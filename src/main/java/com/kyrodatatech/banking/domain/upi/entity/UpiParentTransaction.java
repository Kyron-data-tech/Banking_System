package com.kyrodatatech.banking.domain.upi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "upi_parent_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpiParentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String parentReferenceNo;
    private String senderId;
    private String receiverId;
    
    @Column(precision = 19, scale = 2)
    private BigDecimal totalAmount;
    
    private String status;
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "parentTransaction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<UpiTransactionPacket> packets = new ArrayList<>();
}
