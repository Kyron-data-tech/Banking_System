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

    @PostMapping("/reset-pin")
    public ResponseEntity<?> resetPin(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String cardLast6 = request.get("cardLast6");
        String expiry = request.get("expiry");
        String otp = request.get("otp");
        String newMpin = request.get("newMpin");

        try {
            upiSplitService.resetMpin(email, cardLast6, expiry, otp, newMpin);
            return ResponseEntity.ok(Map.of(
                "message", "UPI PIN updated successfully via NPCI Banking Switch",
                "success", true
            ));
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
            String msg = e.getMessage() != null ? e.getMessage() : "Payment failed";
            if ("INVALID_MPIN".equals(msg)) {
                return ResponseEntity.status(400).body(Map.of("error", "Incorrect MPIN"));
            }
            if (msg.contains("NPCI-U16")) {
                return ResponseEntity.status(403).body(Map.of("error", msg));
            }
            if (msg.contains("NPCI-U17") || msg.contains("Insufficient Funds")) {
                return ResponseEntity.status(400).body(Map.of("error", msg));
            }
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    @GetMapping("/outflows")
    public ResponseEntity<List<UpiParentTransaction>> getOutflows(@RequestParam String senderId) {
        return ResponseEntity.ok(upiSplitService.getOutflowsForSender(senderId));
    }

    @GetMapping("/verify-vpa")
    public ResponseEntity<?> verifyVpa(@RequestParam String vpa) {
        if (vpa == null || !vpa.contains("@")) {
            return ResponseEntity.status(404).body(Map.of("error", "Invalid UPI ID. Format must be name@handle."));
        }

        User user = userRepository.findByUpiId(vpa)
                .or(() -> userRepository.findByEmail(vpa))
                .orElse(null);

        String name;
        if (user != null) {
            name = user.getFullName();
        } else {
            String prefix = vpa.split("@")[0];
            String handle = vpa.split("@")[1].toUpperCase();
            name = prefix.substring(0, 1).toUpperCase() + prefix.substring(1) + " (" + handle + ")";
        }

        try { Thread.sleep(600); } catch (Exception e) {} // Simulate NPCI VPA lookup latency

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

    @GetMapping("/directory/contacts")
    public ResponseEntity<?> getDirectoryContacts(@RequestParam(required = false) String phone) {
        List<Map<String, Object>> list = userRepository.findAll().stream()
                .filter(u -> u.getFullName() != null && !u.getFullName().isBlank())
                .map(u -> {
                    String userPhone = u.getPhoneNumber() != null ? u.getPhoneNumber() : "98" + (Math.abs(u.getId().hashCode()) % 90000000 + 10000000);
                    String userVpa = u.getUpiId() != null ? u.getUpiId() : u.getEmail();
                    String badge = "NPCI UPI";
                    if (u.getRoles() != null && !u.getRoles().isEmpty() && u.getRoles().iterator().next().getRoleType() != null && u.getRoles().iterator().next().getRoleType().name().contains("BANK")) {
                        badge = "Core Banking CBS";
                    } else if (u.getEmail() != null && u.getEmail().contains("merchant")) {
                        badge = "Merchant Hub";
                    }
                    String cleanPhone = userPhone.replaceAll("\\D", "");
                    if (cleanPhone.length() >= 10) {
                        cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
                    }
                    return Map.<String, Object>of(
                        "id", u.getId().toString(),
                        "name", u.getFullName(),
                        "phoneNumber", cleanPhone,
                        "upiId", userVpa,
                        "isUpiRegistered", true,
                        "bankBadge", badge
                    );
                })
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/settle")
    public ResponseEntity<?> settleToBank(@RequestBody Map<String, Object> request) {
        String merchantId = (String) request.get("merchantId");
        String mpin = (String) request.get("mpin");
        String bankAccount = (String) request.getOrDefault("bankAccount", "HDFC Bank - A/c 50100482910");
        String ifsc = (String) request.getOrDefault("ifsc", "HDFC0001234");
        BigDecimal amount = new BigDecimal(request.get("amount").toString());

        try {
            UpiParentTransaction settlement = upiSplitService.settleMerchantBalance(merchantId, amount, mpin, bankAccount, ifsc);
            return ResponseEntity.ok(Map.of(
                "message", "Settlement of INR " + amount + " processed successfully via Instant IMPS (T+0)",
                "settlement", settlement
            ));
        } catch (Exception e) {
            if ("INVALID_MPIN".equals(e.getMessage())) {
                return ResponseEntity.status(400).body(Map.of("error", "Incorrect MPIN entered."));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
