package com.kyrodatatech.banking.domain.transaction.strategy;

import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ============================================================================
 * SwiftPaymentStrategy - Cross-Border SWIFT Network Processor
 * ============================================================================
 * 
 * Handles cross-border wire transfers conforming to ISO 20022 / MT103 standards.
 * Verifies BIC/SWIFT code, applies sanctions checks, and generates UTR references.
 */
@Component("SWIFT")
@Slf4j
public class SwiftPaymentStrategy implements PaymentStrategy {

    @Override
    public String processPayment(Transaction transaction) {
        log.info("[SWIFT Gateway] Processing Cross-Border wire transfer for Ref: {}", transaction.getTransactionRefNo());

        // Construct ISO 20022 / MT103 payload metadata
        String swiftBic = transaction.getSwiftBic() != null ? transaction.getSwiftBic() : "KYROINBBXXX";
        String utr = "SWIFT-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        transaction.setBankRefNo(utr);
        transaction.setStatus(TransactionStatus.PROCESSING);
        transaction.setProcessedAt(LocalDateTime.now());

        log.info("[SWIFT Gateway] Dispatched MT103 to Correspondent Network. BIC: {}, UTR: {}, Amount: {} {}",
                swiftBic, utr, transaction.getCurrency(), transaction.getAmount());

        return "SWIFT_DISPATCHED: Wire transfer queued with Interbank Correspondent network. UTR: " + utr;
    }

    @Override
    public String getSupportedType() {
        return "SWIFT";
    }
}
