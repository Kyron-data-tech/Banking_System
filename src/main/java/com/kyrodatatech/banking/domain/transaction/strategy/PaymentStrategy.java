package com.kyrodatatech.banking.domain.transaction.strategy;

import com.kyrodatatech.banking.domain.transaction.entity.Transaction;

/**
 * ============================================================================
 * PaymentStrategy - Strategy Interface for Payment Networks
 * ============================================================================
 * 
 * Part of the Strategy Pattern implementation in Domain-Driven Design (DDD).
 * Encapsulates network-specific payment routing, payload transformation,
 * clearing house handshakes, and status management.
 */
public interface PaymentStrategy {

    /**
     * Executes the payment routing for the specific payment gateway or network.
     *
     * @param transaction The approved financial transaction record
     * @return Execution confirmation or external reference code
     */
    String processPayment(Transaction transaction);

    /**
     * Identifies the primary payment type handled by this strategy.
     *
     * @return Standardized network identifier (e.g., "SWIFT", "NEFT", "RTGS")
     */
    String getSupportedType();
}
