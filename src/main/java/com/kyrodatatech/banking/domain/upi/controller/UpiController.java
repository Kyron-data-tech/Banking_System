package com.kyrodatatech.banking.domain.upi.controller;

import com.kyrodatatech.banking.domain.upi.entity.UpiParentTransaction;
import com.kyrodatatech.banking.domain.upi.service.UpiSplitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/upi")
@RequiredArgsConstructor
public class UpiController {

    private final UpiSplitService upiSplitService;

    @PostMapping("/send")
    public ResponseEntity<?> sendOptimizedTransfer(@RequestBody Map<String, Object> request) {
        String senderId = (String) request.get("senderId");
        String receiverId = (String) request.get("receiverId");
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        
        UpiParentTransaction result = upiSplitService.initiateOptimizedTransfer(senderId, receiverId, amount);
        
        int fullPackets = amount.divideToIntegralValue(new BigDecimal("1999")).intValue();
        BigDecimal remainder = amount.remainder(new BigDecimal("1999"));
        
        String msg = "Transfer optimized to bypass MDR: Split into " + fullPackets + " packets of ₹1,999" + 
                     (remainder.compareTo(BigDecimal.ZERO) > 0 ? " and 1 packet of ₹" + remainder : ".");
                     
        return ResponseEntity.ok(Map.of(
            "message", msg,
            "transaction", result
        ));
    }

    @GetMapping("/outflows")
    public ResponseEntity<List<UpiParentTransaction>> getOutflows(@RequestParam String senderId) {
        return ResponseEntity.ok(upiSplitService.getOutflowsForSender(senderId));
    }

    @GetMapping("/verify-vpa")
    public ResponseEntity<?> verifyVpa(@RequestParam String vpa) {
        String name = vpa.contains("@") ? vpa.split("@")[0] : vpa;
        if (name.length() > 2) {
            name = name.substring(0, 1).toUpperCase() + "****" + name.substring(name.length() - 1).toLowerCase();
        } else {
            name = "V****r";
        }
        try { Thread.sleep(800); } catch (Exception e) {} // Simulate VPA lookup latency
        return ResponseEntity.ok(Map.of(
            "vpa", vpa,
            "verifiedName", name + " (Verified)",
            "isValid", true
        ));
    }

    @GetMapping("/inflows")
    public ResponseEntity<List<UpiParentTransaction>> getInflows(@RequestParam String receiverId) {
        return ResponseEntity.ok(upiSplitService.getInflowsForReceiver(receiverId));
    }
}
