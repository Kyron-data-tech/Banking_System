package com.kyrodatatech.banking.domain.upi.service;

import com.kyrodatatech.banking.domain.upi.entity.UpiParentTransaction;
import com.kyrodatatech.banking.domain.upi.entity.UpiTransactionPacket;
import com.kyrodatatech.banking.domain.upi.repository.UpiParentTransactionRepository;
import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.repository.UserRepository;
import com.kyrodatatech.banking.domain.llm.LlmRiskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class UpiSplitService {

    private final UpiParentTransactionRepository upiParentTransactionRepository;
    private final UserRepository userRepository;
    private final LlmRiskService llmRiskService;
    private static final BigDecimal OPTIMAL_PACKET_SIZE = new BigDecimal("1999.00");

    @Transactional
    public User onboardUser(String email, String upiId, String mpin) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                .email(email)
                .fullName(email.split("@")[0]) // Default name
                .status(com.kyrodatatech.banking.domain.user.enums.UserStatus.ACTIVE)
                .build();
            return userRepository.save(newUser);
        });
        
        if (userRepository.findByUpiId(upiId).isPresent() && !userRepository.findByUpiId(upiId).get().getId().equals(user.getId())) {
            throw new RuntimeException("UPI ID already taken");
        }
        
        user.setUpiId(upiId);
        user.setMpin(mpin); // In production, hash this!
        return userRepository.save(user);
    }

    @Transactional
    public UpiParentTransaction initiateOptimizedTransfer(String senderId, String receiverId, BigDecimal totalAmount, String mpin) {
        
        // 1. Verify MPIN
        User sender = userRepository.findByEmail(senderId).orElse(null);
        if (sender != null) {
            if (sender.getMpin() == null || !sender.getMpin().equals(mpin)) {
                throw new RuntimeException("INVALID_MPIN");
            }
        }

        String parentRef = "UPI-P-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // NPCI SIMULATION: Risk Check
        String risk = llmRiskService.evaluateTransactionRisk(parentRef, "UPI", totalAmount.doubleValue(), senderId);
        if ("HIGH".equalsIgnoreCase(risk)) {
            throw new RuntimeException("NPCI-U16: Risk Threshold Exceeded");
        }

        // NPCI SIMULATION: Network Latency
        try {
            Thread.sleep(2500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        UpiParentTransaction parent = UpiParentTransaction.builder()
                .parentReferenceNo(parentRef)
                .senderId(senderId)
                .receiverId(receiverId)
                .totalAmount(totalAmount)
                .status("COMPLETED")
                .createdAt(LocalDateTime.now())
                .build();

        List<UpiTransactionPacket> packets = new ArrayList<>();
        BigDecimal remainingAmount = totalAmount;

        while (remainingAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal packetAmount = remainingAmount.compareTo(OPTIMAL_PACKET_SIZE) > 0 ? OPTIMAL_PACKET_SIZE : remainingAmount;
            
            UpiTransactionPacket packet = UpiTransactionPacket.builder()
                    .packetUtr(generateUtr())
                    .amount(packetAmount)
                    .parentTransaction(parent)
                    .build();
            
            packets.add(packet);
            remainingAmount = remainingAmount.subtract(packetAmount);
        }

        parent.setPackets(packets);
        log.info("Optimized Transfer: Split {} into {} packets to bypass MDR for {}", totalAmount, packets.size(), parentRef);
        return upiParentTransactionRepository.save(parent);
    }
    
    private String generateUtr() {
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder(12);
        for(int i=0; i < 12; i++) {
            sb.append(rnd.nextInt(10));
        }
        return sb.toString();
    }

    public List<UpiParentTransaction> getInflowsForReceiver(String receiverId) {
        java.util.List<String> ids = new java.util.ArrayList<>();
        ids.add(receiverId);
        userRepository.findByEmail(receiverId).ifPresent(u -> {
            if (u.getUpiId() != null) ids.add(u.getUpiId());
        });
        userRepository.findByUpiId(receiverId).ifPresent(u -> {
            ids.add(u.getEmail());
        });
        return upiParentTransactionRepository.findByReceiverIdInOrderByCreatedAtDesc(ids);
    }
    
    public List<UpiParentTransaction> getOutflowsForSender(String senderId) {
        java.util.List<String> ids = new java.util.ArrayList<>();
        ids.add(senderId);
        userRepository.findByEmail(senderId).ifPresent(u -> {
            if (u.getUpiId() != null) ids.add(u.getUpiId());
        });
        userRepository.findByUpiId(senderId).ifPresent(u -> {
            ids.add(u.getEmail());
        });
        return upiParentTransactionRepository.findBySenderIdInOrderByCreatedAtDesc(ids);
    }
}
