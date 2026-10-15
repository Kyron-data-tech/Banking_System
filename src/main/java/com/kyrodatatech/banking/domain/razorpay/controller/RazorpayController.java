package com.kyrodatatech.banking.domain.razorpay.controller;

import com.kyrodatatech.banking.domain.razorpay.dto.RazorpayOrderRequest;
import com.kyrodatatech.banking.domain.razorpay.dto.RazorpayOrderResponse;
import com.kyrodatatech.banking.domain.razorpay.dto.RazorpayVerifyRequest;
import com.kyrodatatech.banking.domain.razorpay.service.RazorpayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/razorpay")
@RequiredArgsConstructor
public class RazorpayController {

    private final RazorpayService razorpayService;

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        return ResponseEntity.ok(razorpayService.getPublicConfig());
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody RazorpayOrderRequest request) {
        try {
            RazorpayOrderResponse response = razorpayService.createOrder(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody RazorpayVerifyRequest request) {
        try {
            Map<String, Object> result = razorpayService.verifyAndProcessPayment(request);
            return ResponseEntity.ok(result);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
