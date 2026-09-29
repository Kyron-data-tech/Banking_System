package com.kyrodatatech.banking.domain.transaction.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionType;
import com.kyrodatatech.banking.domain.user.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ================================================================
 * Transaction Entity — Core Financial Transaction Record
 * ================================================================
 *
 * Every money movement in the system is recorded as a Transaction.
 * This includes payments (NEFT, RTGS, IMPS, UPI), collections,
 * and internal transfers.
 *
 * DATABASE TABLE: 'transactions'
 *
 * TRANSACTION LIFECYCLE (Pipeline):
 * ─────────────────────────────────────────────────────────────
 *  1. SUBMITTED      — Maker initiates the transaction
 *  2. VALIDATION     — System checks format, IFSC codes, limits
 *  3. SANCTIONS      — Screens against blocked party lists
 *  4. AML CHECK      — Anti-money laundering risk scoring
 *  5. PENDING APPROVAL — Sent to Checker for approval
 *  6. APPROVED        — Checker approves
 *  7. PROCESSING      — Sent to payment network (NEFT/RTGS etc.)
 *  8. COMPLETED       — Funds successfully transferred
 * ─────────────────────────────────────────────────────────────
 *
 * KEY FIELDS:
 *   - transactionRefNo: Unique reference shown to customers (UTR/RRN/etc.)
 *   - amount: Always in BigDecimal — NEVER use float/double for money!
 *   - currency: ISO 4217 currency code (INR, USD, EUR, etc.)
 *   - debitAccount/creditAccount: The accounts being debited and credited
 */
@Entity
@Table(name = "transactions",
       indexes = {
           @Index(name = "idx_txn_ref", columnList = "transaction_ref_no"),
           @Index(name = "idx_txn_status", columnList = "status"),
           @Index(name = "idx_txn_created_by", columnList = "created_by_id"),
           @Index(name = "idx_txn_created_at", columnList = "created_at")
       })
@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // ---- Reference Numbers ----

    /**
     * System-generated unique reference for this transaction.
     * Format: TXN-{YYYYMMDD}-{RANDOM8CHARS}
     * Example: TXN-20240915-A3B7C2D1
     */
    @Column(name = "transaction_ref_no", unique = true, nullable = false, length = 30)
    private String transactionRefNo;

    /**
     * Bank Reference Number / UTR (Unique Transaction Reference).
     * Assigned by the bank network after successful processing.
     * Example: HDFC923847NEFT001
     * Null until the transaction reaches PROCESSING stage.
     */
    @Column(name = "bank_ref_no", length = 50)
    private String bankRefNo;

    // ---- Transaction Type & Status ----

    /**
     * The type of this transaction (NEFT, RTGS, UPI, etc.)
     * Determines routing, limits, and settlement timelines.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private TransactionType transactionType;

    /**
     * Current status in the transaction pipeline.
     * Default: SUBMITTED (newly created by maker).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.SUBMITTED;

    // ---- Financial Details ----

    /**
     * Transaction amount.
     * IMPORTANT: We use BigDecimal (not double/float) for money because
     * floating-point types have precision issues.
     * Example: 1.0 + 2.0 in float could give 2.9999999 instead of 3.0!
     * precision=19 = up to 9999999999999999999 (₹ quadrillions!)
     * scale=2 = 2 decimal places (paise)
     */
    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    /**
     * Currency code (ISO 4217).
     * Examples: "INR" (Rupee), "USD" (Dollar), "EUR" (Euro)
     */
    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    // ---- Debit (Sender) Account Details ----

    /** Account number being debited (sender's account) */
    @Column(name = "debit_account_no", nullable = false, length = 30)
    private String debitAccountNo;

    /** Name of account holder being debited */
    @Column(name = "debit_account_name", length = 150)
    private String debitAccountName;

    /** IFSC code of the debit bank branch */
    @Column(name = "debit_ifsc_code", length = 11)
    private String debitIfscCode;

    // ---- Credit (Beneficiary) Account Details ----

    /** Account number being credited (recipient's account) */
    @Column(name = "credit_account_no", nullable = false, length = 30)
    private String creditAccountNo;

    /** Name of the beneficiary */
    @Column(name = "credit_account_name", nullable = false, length = 150)
    private String creditAccountName;

    /** IFSC code of the beneficiary's bank branch */
    @Column(name = "credit_ifsc_code", length = 11)
    private String creditIfscCode;

    /** Name of the beneficiary's bank */
    @Column(name = "credit_bank_name", length = 100)
    private String creditBankName;

    /** UPI VPA (Virtual Payment Address) for UPI transactions */
    @Column(name = "upi_vpa", length = 50)
    private String upiVpa;

    /** SWIFT BIC code for international (SWIFT) transactions */
    @Column(name = "swift_bic", length = 11)
    private String swiftBic;

    // ---- Payment Details ----

    /** Narration/description for the payment (shown in bank statement) */
    @Column(name = "narration", length = 200)
    private String narration;

    /** Internal remarks (not shown to beneficiary) */
    @Column(name = "internal_remarks", length = 500)
    private String internalRemarks;

    // ---- Compliance & Risk ----

    /**
     * AML Risk score (0.0 to 1.0) assigned by the AML check engine.
     * 0.0 = Very low risk, 1.0 = Very high risk
     * Transactions above threshold (e.g., 0.7) are flagged for review.
     */
    @Column(name = "aml_risk_score", precision = 5, scale = 2)
    private BigDecimal amlRiskScore;

    /** Whether this transaction passed sanctions screening */
    @Column(name = "sanctions_cleared")
    private Boolean sanctionsCleared;

    /** Whether this transaction passed AML checks */
    @Column(name = "aml_cleared")
    private Boolean amlCleared;

    // ---- Maker-Checker Links ----

    /** The user who created (initiated) this transaction */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    @JsonIgnore
    private User createdBy;

    /** The user who approved or rejected this transaction */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    @JsonIgnore
    private User approvedBy;

    /** The Maker-Checker approval request linked to this transaction */
    @Column(name = "maker_checker_request_id")
    private UUID makerCheckerRequestId;

    // ---- Timestamps ----

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** When the checker approved/rejected the transaction */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /** When the transaction was successfully processed by the bank network */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    /** Scheduled execution date (for future-dated transactions) */
    @Column(name = "value_date")
    private LocalDateTime valueDate;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
