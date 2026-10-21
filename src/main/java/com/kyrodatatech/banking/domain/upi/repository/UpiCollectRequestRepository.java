package com.kyrodatatech.banking.domain.upi.repository;

import com.kyrodatatech.banking.domain.upi.entity.UpiCollectRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UpiCollectRequestRepository extends JpaRepository<UpiCollectRequest, UUID> {
    
    List<UpiCollectRequest> findByPayerVpaIgnoreCaseAndStatusOrderByCreatedAtDesc(String payerVpa, String status);
    
    List<UpiCollectRequest> findByRequesterVpaIgnoreCaseOrderByCreatedAtDesc(String requesterVpa);

    Optional<UpiCollectRequest> findByCollectRef(String collectRef);
}
