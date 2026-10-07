package com.kyrodatatech.banking.domain.transaction.controller;

import com.kyrodatatech.banking.domain.transaction.strategy.PaymentStrategyFactory;
import com.kyrodatatech.banking.domain.transaction.strategy.PaymentStrategy;
import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/gateway/v1")
public class GatewayController {

    @Autowired
    private PaymentStrategyFactory strategyFactory;

    @PostMapping("/charge")
    public ResponseEntity<?> charge(@RequestBody Map<String, Object> payload) {
        String amountStr = payload.get("amount").toString();
        BigDecimal amount = new BigDecimal(amountStr);

        Transaction dummyTx = new Transaction();
        dummyTx.setAmount(amount);

        PaymentStrategy strategy = strategyFactory.getStrategy("RUPAY_SANDBOX");
        String result = strategy.processPayment(dummyTx);

        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "gateway_reference", result,
            "message", "RuPay Gateway Sandbox payment successful."
        ));
    }
}
