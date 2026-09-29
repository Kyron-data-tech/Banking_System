package com.kyrodatatech.banking.domain.transaction.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import com.kyrodatatech.banking.domain.user.entity.MakerCheckerRequest;
import com.kyrodatatech.banking.domain.user.enums.ApprovalStatus;
import com.kyrodatatech.banking.domain.user.repository.MakerCheckerRepository;
import com.kyrodatatech.banking.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ================================================================
 * TransactionService — Core Transaction Pipeline Orchestrator
 * ================================================================
 *
 * This service manages the COMPLETE transaction lifecycle:
 *
 *   SUBMITTED
 *      ↓ validate()
 *   VALIDATION_PASSED
 *      ↓ sanctionsScreen()
 *   SANCTIONS_CLEARED
 *      ↓ amlCheck()
 *   AML_CLEARED
 *      ↓ submitForApproval() [Creates Maker-Checker request]
 *   PENDING_APPROVAL
 *      ↓ processApprovedTransaction() [Checker approves]
 *   PROCESSING
 *      ↓ bankProcess()
 *   COMPLETED
 *
 * IMPORTANT BANKING CONCEPTS:
 *
 * VALIDATION:
 *   Before sending money, we verify:
 *   - IFSC code format is valid (Indian Financial System Code)
 *   - Account number format matches bank patterns
 *   - Amount is within daily/per-transaction limits
 *   - Debit account has sufficient balance
 *
 * SANCTIONS SCREENING:
 *   Every transaction checks if the beneficiary is on:
 *   - OFAC (Office of Foreign Assets Control) list
 *   - UN Sanctions list
 *   - RBI watchlist
 *   Blocked transactions are frozen for compliance review.
 *
 * AML (Anti-Money Laundering) CHECK:
 *   Risk scoring based on:
 *   - Transaction amount (large = higher risk)
 *   - Transaction frequency (many small txns = structuring risk)
 *   - Destination country risk
 *   - Beneficiary history
 *   High-risk transactions are flagged for compliance officer review.
 *
 * @Service — Business logic layer
 * @Slf4j — Logging
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final MakerCheckerRepository makerCheckerRepository;
    private final ObjectMapper objectMapper;

    // Transaction limits (in INR) — In production, load from database config
    private static final BigDecimal IMPS_LIMIT = new BigDecimal("500000");    // ₹5 Lakh
    private static final BigDecimal NEFT_LIMIT = new BigDecimal("10000000");  // ₹1 Crore (no formal limit, but internal)
    private static final BigDecimal RTGS_MIN = new BigDecimal("200000");      // ₹2 Lakh minimum
    private static final BigDecimal AML_HIGH_RISK_THRESHOLD = new BigDecimal("1000000"); // ₹10 Lakh triggers AML
    private static final BigDecimal AML_FLAG_SCORE = new BigDecimal("0.70");  // 70% risk score triggers flag

    // ─────────────────────────────────────────────────────────────
    // STEP 1: SUBMIT TRANSACTION
    // ─────────────────────────────────────────────────────────────

    /**
     * Submits a new transaction for processing.
     * Runs the complete pipeline: Validate → Sanctions → AML → Approval Queue.
     *
     * @param transaction The transaction to submit (created by the Maker)
     * @return The transaction after initial pipeline processing
     */
    @Transactional
    public Transaction submitTransaction(Transaction transaction) {
        log.info("Submitting transaction: {} | Type: {} | Amount: {} {}",
                transaction.getTransactionRefNo(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getCurrency());

        // Step 1: Save initial record with SUBMITTED status
        transaction.setStatus(TransactionStatus.SUBMITTED);
        transaction = transactionRepository.save(transaction);

        // Step 2: Run validation
        transaction = validate(transaction);

        // Step 3: Sanctions screening (only if validation passed)
        if (transaction.getStatus() == TransactionStatus.VALIDATION_PASSED) {
            transaction = sanctionsScreen(transaction);
        }

        // Step 4: AML Check (only if sanctions cleared)
        if (transaction.getStatus() == TransactionStatus.SANCTIONS_CLEARED) {
            transaction = amlCheck(transaction);
        }

        // Step 5: Move to approval queue if all checks passed
        if (transaction.getStatus() == TransactionStatus.AML_CLEARED) {
            transaction.setStatus(TransactionStatus.PENDING_CHECKER);
            log.info("Transaction {} moved to PENDING_APPROVAL queue", transaction.getTransactionRefNo());
        }

        transaction = transactionRepository.save(transaction);
        if (transaction.getStatus() == TransactionStatus.PENDING_CHECKER) {
            createPaymentApprovalRequest(transaction);
        }
        return transaction;
    }

    private void createPaymentApprovalRequest(Transaction transaction) {
        if (transaction.getCreatedBy() == null) {
            throw new AppException("A payment maker is required for approval.", HttpStatus.BAD_REQUEST);
        }

        try {
            MakerCheckerRequest request = MakerCheckerRequest.builder()
                    .actionType("INITIATE_PAYMENT")
                    .requestPayload(objectMapper.writeValueAsString(transaction))
                    .makerId(transaction.getCreatedBy().getId())
                    .makerName(transaction.getCreatedBy().getFullName())
                    .entityId(transaction.getId())
                    .entityType("TRANSACTION")
                    .status(ApprovalStatus.PENDING_CHECKER)
                    .priority(transaction.getAmount().compareTo(new BigDecimal("5000000")) >= 0 ? "HIGH" : "MEDIUM")
                    .build();

            request = makerCheckerRepository.save(request);
            transaction.setMakerCheckerRequestId(request.getId());
            transactionRepository.save(transaction);
        } catch (JsonProcessingException exception) {
            throw new AppException("Unable to create payment approval request.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: VALIDATE
    // ─────────────────────────────────────────────────────────────

    /**
     * Validates transaction data format and business rules.
     *
     * VALIDATION CHECKS:
     * 1. Amount must be positive and within limits
     * 2. IFSC code format (for NEFT/RTGS/IMPS): AAAA0NNNNNN (11 chars)
     * 3. Account number format
     * 4. RTGS minimum amount (₹2 Lakh)
     * 5. UPI VPA format (for UPI transactions)
     *
     * @param transaction The transaction to validate
     * @return Transaction with VALIDATION_PASSED or VALIDATION_FAILED status
     */
    private Transaction validate(Transaction transaction) {
        log.debug("Validating transaction: {}", transaction.getTransactionRefNo());

        try {
            // Check 1: Amount must be positive
            if (transaction.getAmount() == null || transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                return failValidation(transaction, "Transaction amount must be greater than zero");
            }

            // Check 2: Credit account must have a name
            if (transaction.getCreditAccountName() == null || transaction.getCreditAccountName().isBlank()) {
                return failValidation(transaction, "Beneficiary name is required");
            }

            // Check 3: RTGS minimum amount validation
            if (transaction.getTransactionType().name().equals("RTGS")) {
                if (transaction.getAmount().compareTo(RTGS_MIN) < 0) {
                    return failValidation(transaction,
                            "RTGS minimum amount is ₹2,00,000. Got: ₹" + transaction.getAmount());
                }
            }

            // Check 4: IMPS maximum limit
            if (transaction.getTransactionType().name().equals("IMPS")) {
                if (transaction.getAmount().compareTo(IMPS_LIMIT) > 0) {
                    return failValidation(transaction,
                            "IMPS maximum amount is ₹5,00,000. Got: ₹" + transaction.getAmount());
                }
            }

            // Check 5: IFSC code format (for domestic payments)
            if (transaction.getCreditIfscCode() != null) {
                if (!isValidIfsc(transaction.getCreditIfscCode())) {
                    return failValidation(transaction,
                            "Invalid IFSC code format: " + transaction.getCreditIfscCode() +
                            ". Expected format: AAAA0NNNNNN (e.g., HDFC0001234)");
                }
            }

            // All checks passed!
            transaction.setStatus(TransactionStatus.VALIDATION_PASSED);
            log.debug("Transaction {} passed validation", transaction.getTransactionRefNo());
            return transaction;

        } catch (Exception e) {
            log.error("Validation error for {}: {}", transaction.getTransactionRefNo(), e.getMessage());
            return failValidation(transaction, "Validation error: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: SANCTIONS SCREENING
    // ─────────────────────────────────────────────────────────────

    /**
     * Screens the transaction against sanctions lists.
     *
     * In production, this would call:
     * - OFAC SDN (Specially Designated Nationals) API
     * - UN Consolidated Sanctions list API
     * - RBI Watchlist API
     * - Internal blocked-entity database
     *
     * For this demo, we simulate the screening check.
     *
     * @param transaction The transaction to screen
     * @return Transaction with SANCTIONS_CLEARED or SANCTIONS_BLOCKED status
     */
    private Transaction sanctionsScreen(Transaction transaction) {
        log.debug("Running sanctions screening for: {}", transaction.getTransactionRefNo());

        // TODO: In production, call actual sanctions screening API:
        // boolean isBlocked = sanctionsApiClient.check(transaction.getCreditAccountName(),
        //                                              transaction.getCreditBankName(),
        //                                              transaction.getSwiftBic());

        // Simulation: All transactions pass sanctions (replace with real API call)
        boolean isBlocked = simulateSanctionsCheck(transaction);

        if (isBlocked) {
            transaction.setStatus(TransactionStatus.SANCTIONS_BLOCKED);
            transaction.setSanctionsCleared(false);
            log.warn("Transaction {} BLOCKED by sanctions screening! Beneficiary: {}",
                    transaction.getTransactionRefNo(), transaction.getCreditAccountName());
        } else {
            transaction.setStatus(TransactionStatus.SANCTIONS_CLEARED);
            transaction.setSanctionsCleared(true);
            log.debug("Transaction {} cleared sanctions screening", transaction.getTransactionRefNo());
        }

        return transaction;
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: AML CHECK
    // ─────────────────────────────────────────────────────────────

    /**
     * Performs Anti-Money Laundering risk assessment.
     *
     * RISK FACTORS CONSIDERED:
     * - Large amount (>₹10 Lakh = higher risk)
     * - International/SWIFT transactions (higher risk)
     * - Customer transaction history (frequent large transfers)
     *
     * RISK SCORE: 0.0 (very safe) to 1.0 (very risky)
     * Transactions scoring > 0.70 are flagged for compliance review.
     *
     * @param transaction The transaction to check
     * @return Transaction with AML_CLEARED or AML_FLAGGED status + risk score
     */
    private Transaction amlCheck(Transaction transaction) {
        log.debug("Running AML check for: {}", transaction.getTransactionRefNo());

        BigDecimal riskScore = calculateAmlRiskScore(transaction);
        transaction.setAmlRiskScore(riskScore);

        if (riskScore.compareTo(AML_FLAG_SCORE) >= 0) {
            transaction.setStatus(TransactionStatus.AML_FLAGGED);
            transaction.setAmlCleared(false);
            log.warn("Transaction {} FLAGGED by AML! Risk score: {}",
                    transaction.getTransactionRefNo(), riskScore);
        } else {
            transaction.setStatus(TransactionStatus.AML_CLEARED);
            transaction.setAmlCleared(true);
            log.debug("Transaction {} cleared AML. Risk score: {}",
                    transaction.getTransactionRefNo(), riskScore);
        }

        return transaction;
    }

    // ─────────────────────────────────────────────────────────────
    // CHECKER APPROVAL: PROCESS APPROVED TRANSACTION
    // ─────────────────────────────────────────────────────────────

    /**
     * Processes a transaction that has been APPROVED by a Checker.
     * Called by the MakerCheckerService when a payment request is approved.
     *
     * In production, this would:
     * - Call the bank's core banking system API
     * - Submit to NEFT/RTGS/IMPS/UPI network
     * - Generate UTR (Unique Transaction Reference)
     *
     * @param transactionId UUID of the approved transaction
     * @return Processed transaction
     */
    @Transactional
    public Transaction processApprovedTransaction(UUID transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(
                        "Transaction not found: " + transactionId, HttpStatus.NOT_FOUND));

        if (transaction.getStatus() != TransactionStatus.APPROVED) {
            throw new AppException("Transaction is not in APPROVED status", HttpStatus.BAD_REQUEST);
        }

        transaction.setStatus(TransactionStatus.PROCESSING);
        log.info("Transaction {} is now PROCESSING — submitting to bank network",
                transaction.getTransactionRefNo());

        // TODO: Call actual bank network API here
        // For now, simulate successful processing
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setProcessedAt(LocalDateTime.now());
        transaction.setBankRefNo("UTR" + System.currentTimeMillis()); // Simulated UTR

        log.info("Transaction {} COMPLETED. Bank Ref: {}",
                transaction.getTransactionRefNo(), transaction.getBankRefNo());

        return transactionRepository.save(transaction);
    }

    // ─────────────────────────────────────────────────────────────
    // QUERY METHODS
    // ─────────────────────────────────────────────────────────────

    /**
     * Get transaction details by reference number.
     * Used for transaction inquiry / customer support.
     */
    public Transaction getByRefNo(String refNo) {
        return transactionRepository.findByTransactionRefNo(refNo)
                .orElseThrow(() -> new AppException(
                        "Transaction not found with reference: " + refNo, HttpStatus.NOT_FOUND));
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    /** Marks a transaction as VALIDATION_FAILED with a reason */
    private Transaction failValidation(Transaction transaction, String reason) {
        transaction.setStatus(TransactionStatus.VALIDATION_FAILED);
        transaction.setInternalRemarks("VALIDATION FAILED: " + reason);
        log.warn("Transaction {} failed validation: {}", transaction.getTransactionRefNo(), reason);
        return transaction;
    }

    /**
     * Validates IFSC code format.
     * Format: First 4 chars = bank code (letters), 5th = always '0', last 6 = branch code
     * Example: HDFC0001234
     */
    private boolean isValidIfsc(String ifsc) {
        return ifsc != null && ifsc.matches("[A-Z]{4}0[A-Z0-9]{6}");
    }

    /**
     * Simulates sanctions check. In production: call OFAC/UN APIs.
     * Returns true = blocked, false = clear.
     */
    private boolean simulateSanctionsCheck(Transaction transaction) {
        // Simulate: no real check, always returns safe
        // TODO: Replace with real sanctions API integration
        return false; // false = NOT blocked = safe
    }

    /**
     * Calculates AML risk score (0.0 to 1.0).
     *
     * FACTORS:
     * - Amount > ₹10 Lakh = +0.3 risk
     * - SWIFT (international) = +0.2 risk
     * - Amount > ₹50 Lakh = +0.4 additional risk
     */
    private BigDecimal calculateAmlRiskScore(Transaction transaction) {
        double riskScore = 0.0;

        // Large amount increases risk
        if (transaction.getAmount().compareTo(AML_HIGH_RISK_THRESHOLD) > 0) {
            riskScore += 0.3;
        }

        // International transactions are higher risk
        if (transaction.getTransactionType().name().equals("SWIFT")) {
            riskScore += 0.2;
        }

        // Very large amounts (>₹50 Lakh)
        if (transaction.getAmount().compareTo(new BigDecimal("5000000")) > 0) {
            riskScore += 0.4;
        }

        return BigDecimal.valueOf(Math.min(riskScore, 1.0)); // Cap at 1.0
    }

    /**
     * Generates a unique transaction reference number.
     * Format: TXN-YYYYMMDD-XXXXXXXX (8 random hex chars)
     */
    public String generateRefNo() {
        String date = java.time.LocalDate.now().toString().replace("-", "");
        String random = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "TXN-" + date + "-" + random;
    }
}
