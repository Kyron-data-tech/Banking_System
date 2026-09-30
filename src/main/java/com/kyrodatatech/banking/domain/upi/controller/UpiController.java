package com.kyrodatatech.banking.domain.upi.controller;

import com.kyrodatatech.banking.domain.upi.entity.UpiParentTransaction;
import com.kyrodatatech.banking.domain.upi.service.UpiSplitService;
import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/upi")
@RequiredArgsConstructor
public class UpiController {

    private final UpiSplitService upiSplitService;
    private final UserRepository userRepository;

    @PostMapping("/onboard")
    public ResponseEntity<?> onboard(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String upiId = request.get("upiId");
        String mpin = request.get("mpin");
        try {
            User user = upiSplitService.onboardUser(email, upiId, mpin);
            return ResponseEntity.ok(Map.of("message", "UPI setup complete", "upiId", user.getUpiId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyUpiDetails(@RequestParam String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && user.getUpiId() != null) {
            return ResponseEntity.ok(Map.of("hasUpi", true, "upiId", user.getUpiId()));
        }
        return ResponseEntity.ok(Map.of("hasUpi", false));
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendOptimizedTransfer(@RequestBody Map<String, Object> request) {
        String senderId = (String) request.get("senderId");
        String receiverId = (String) request.get("receiverId");
        String mpin = (String) request.get("mpin");
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        
        try {
            UpiParentTransaction result = upiSplitService.initiateOptimizedTransfer(senderId, receiverId, amount, mpin);
            
            int fullPackets = amount.divideToIntegralValue(new BigDecimal("1999")).intValue();
            BigDecimal remainder = amount.remainder(new BigDecimal("1999"));
            
            String msg = "Transfer optimized to bypass MDR: Split into " + fullPackets + " packets of INR 1,999" + 
                         (remainder.compareTo(BigDecimal.ZERO) > 0 ? " and 1 packet of INR " + remainder : ".");
                         
            return ResponseEntity.ok(Map.of(
                "message", msg,
                "transaction", result
            ));
        } catch(Exception e) {
            if (e.getMessage().equals("INVALID_MPIN")) {
                return ResponseEntity.status(401).body(Map.of("error", "Incorrect MPIN"));
            }
            if (e.getMessage().contains("NPCI-U16")) {
                return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/outflows")
    public ResponseEntity<List<UpiParentTransaction>> getOutflows(@RequestParam String senderId) {
        return ResponseEntity.ok(upiSplitService.getOutflowsForSender(senderId));
    }

    @GetMapping("/verify-vpa")
    public ResponseEntity<?> verifyVpa(@RequestParam String vpa) {
        User user = userRepository.findByUpiId(vpa).orElse(null);
        String name = user != null ? user.getFullName() : vpa.split("@")[0];

        if (name.length() > 2) {
            name = name.substring(0, 1).toUpperCase() + "****" + name.substring(name.length() - 1).toLowerCase();
        } else {
            name = "V****r";
        }
        try { Thread.sleep(800); } catch (Exception e) {} // Simulate VPA lookup latency
        
        if (user == null && !vpa.contains("@example.com") && !vpa.contains("@kyro")) {
            return ResponseEntity.status(404).body(Map.of("error", "Invalid UPI ID"));
        }
        
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
