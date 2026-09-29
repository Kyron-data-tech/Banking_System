package com.kyrodatatech.banking.domain.upi.service;

import com.kyrodatatech.banking.domain.upi.entity.UpiParentTransaction;
import com.kyrodatatech.banking.domain.upi.entity.UpiTransactionPacket;
import com.kyrodatatech.banking.domain.upi.repository.UpiParentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UpiSplitService {

    private final UpiParentTransactionRepository upiParentTransactionRepository;
    private static final BigDecimal OPTIMAL_PACKET_SIZE = new BigDecimal("1999.00");

    @Transactional
    public UpiParentTransaction initiateOptimizedTransfer(String senderId, String receiverId, BigDecimal totalAmount) {
        String parentRef = "UPI-P-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        UpiParentTransaction parent = UpiParentTransaction.builder()
                .parentReferenceNo(parentRef)
                .senderId(senderId)
                .receiverId(receiverId)
                .totalAmount(totalAmount)
                .status("COMPLETED")
                .createdAt(LocalDateTime.now())
                .packets(new ArrayList<>())
                .build();

        BigDecimal remainingAmount = totalAmount;
        List<UpiTransactionPacket> packets = new ArrayList<>();
        
        while (remainingAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal packetAmount = remainingAmount.compareTo(OPTIMAL_PACKET_SIZE) > 0 ? OPTIMAL_PACKET_SIZE : remainingAmount;
            
            UpiTransactionPacket packet = UpiTransactionPacket.builder()
                    .packetUtr("UTR" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase())
                    .amount(packetAmount)
                    .status("SUCCESS")
                    .parentTransaction(parent)
                    .build();
            
            packets.add(packet);
            remainingAmount = remainingAmount.subtract(packetAmount);
        }
        
        parent.setPackets(packets);
        log.info("Optimized Transfer: Split {} into {} packets to bypass MDR for {}", totalAmount, packets.size(), parentRef);
        return upiParentTransactionRepository.save(parent);
    }
    
    public List<UpiParentTransaction> getInflowsForReceiver(String receiverId) {
        return upiParentTransactionRepository.findByReceiverIdOrderByCreatedAtDesc(receiverId);
    }
    
    public List<UpiParentTransaction> getOutflowsForSender(String senderId) {
        return upiParentTransactionRepository.findBySenderIdOrderByCreatedAtDesc(senderId);
    }
}
