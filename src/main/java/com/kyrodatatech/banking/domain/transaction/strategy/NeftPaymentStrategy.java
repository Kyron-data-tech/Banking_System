package com.kyrodatatech.banking.domain.transaction.strategy;

import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ============================================================================
 * NeftPaymentStrategy - National Electronic Funds Transfer (RBI Clearing)
 * ============================================================================
 * 
 * Handles domestic batched electronic transfers through central clearing cycles (SFMS/RBI).
 */
@Component("NEFT")
@Slf4j
public class NeftPaymentStrategy implements PaymentStrategy {

    @Override
    public String processPayment(Transaction transaction) {
        log.info("[NEFT Clearing] Processing Domestic batch settlement for Ref: {}", transaction.getTransactionRefNo());

        String ifsc = transaction.getCreditIfscCode() != null ? transaction.getCreditIfscCode() : "KYRO0000001";
        String utr = "NEFT" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

        transaction.setBankRefNo(utr);
        transaction.setStatus(TransactionStatus.PROCESSING);
        transaction.setProcessedAt(LocalDateTime.now());

        log.info("[NEFT Clearing] Bundled into SFMS clearing batch. IFSC: {}, UTR: {}, Amount: ₹{}",
                ifsc, utr, transaction.getAmount());

        return "NEFT_BATCHED: Queued for next RBI half-hourly settlement window. UTR: " + utr;
    }

    @Override
    public String getSupportedType() {
        return "NEFT";
    }
}
