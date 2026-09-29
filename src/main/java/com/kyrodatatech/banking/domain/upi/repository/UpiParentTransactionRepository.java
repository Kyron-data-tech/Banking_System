package com.kyrodatatech.banking.domain.upi.repository;

import com.kyrodatatech.banking.domain.upi.entity.UpiParentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UpiParentTransactionRepository extends JpaRepository<UpiParentTransaction, UUID> {
    List<UpiParentTransaction> findByReceiverIdOrderByCreatedAtDesc(String receiverId);
    List<UpiParentTransaction> findBySenderIdOrderByCreatedAtDesc(String senderId);
}
