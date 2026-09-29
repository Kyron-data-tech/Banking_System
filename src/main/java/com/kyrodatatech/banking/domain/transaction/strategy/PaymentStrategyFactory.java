package com.kyrodatatech.banking.domain.transaction.strategy;

import com.kyrodatatech.banking.exception.AppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ============================================================================
 * PaymentStrategyFactory - Dynamic Routing for Payment Strategy Beans
 * ============================================================================
 * 
 * Automatically detects all registered Spring beans implementing {@link PaymentStrategy}
 * and registers them into an execution routing lookup table.
 */
@Component
@Slf4j
public class PaymentStrategyFactory {

    private final Map<String, PaymentStrategy> strategies = new ConcurrentHashMap<>();

    /**
     * Autowires all Spring beans implementing PaymentStrategy into the strategy registry.
     */
    public PaymentStrategyFactory(List<PaymentStrategy> strategyList) {
        for (PaymentStrategy strategy : strategyList) {
            String type = strategy.getSupportedType().toUpperCase();
            strategies.put(type, strategy);
            log.info("Registered payment routing strategy: [{}] -> {}", type, strategy.getClass().getSimpleName());
        }
    }

    /**
     * Resolves the appropriate PaymentStrategy bean given a transaction type.
     *
     * @param paymentType Identifier such as "SWIFT", "NEFT", "RTGS", "UPI"
     * @return Concrete PaymentStrategy implementation
     * @throws AppException if no strategy is registered for the specified type
     */
    public PaymentStrategy getStrategy(String paymentType) {
        if (paymentType == null) {
            throw new AppException("Payment type cannot be null for gateway routing.", HttpStatus.BAD_REQUEST);
        }

        String normalizedType = paymentType.trim().toUpperCase();
        return Optional.ofNullable(strategies.get(normalizedType))
                .orElseThrow(() -> new AppException(
                        "No payment routing strategy configured for network type: " + paymentType,
                        HttpStatus.BAD_REQUEST
                ));
    }
}
