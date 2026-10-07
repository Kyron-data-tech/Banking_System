package com.kyrodatatech.banking.domain.transaction.strategy;

import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import org.springframework.stereotype.Component;

@Component
public class RuPayPaymentStrategy implements PaymentStrategy {
    @Override
    public String processPayment(Transaction transaction) {
        try { Thread.sleep(1500); } catch (Exception e) {}
        String rrn = generate12DigitRrn();
        return "RUPAY-SUCCESS-" + rrn;
    }

    @Override
    public String getSupportedType() {
        return "RUPAY_SANDBOX";
    }

    private String generate12DigitRrn() {
        long number = (long) Math.floor(Math.random() * 9_000_000_000_000L) + 1_000_000_000_000L;
        return String.valueOf(number);
    }
}
