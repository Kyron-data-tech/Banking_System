package com.kyrodatatech.banking.domain.user.controller;

import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import com.kyrodatatech.banking.domain.user.enums.UserStatus;

@RestController
@RequestMapping("/api/merchant/keys")
public class MerchantKeyController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/generate")
    public ResponseEntity<?> generateKey(@RequestParam String email) {
        String finalEmail = (email == null || email.isEmpty()) ? "demo_merchant@kyrobank.com" : email;
        Optional<User> userOpt = userRepository.findByEmail(finalEmail);
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            user = new User();
            user.setEmail(finalEmail);
            user.setFullName("Merchant Demo");
            user.setStatus(UserStatus.ACTIVE);
        }
        
        String newKey = "sk_test_rupay_" + UUID.randomUUID().toString().replace("-", "");
        user.setRupayApiKey(newKey);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("apiKey", newKey));
    }
}
