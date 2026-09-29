package com.kyrodatatech.banking.domain.upi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "upi_transaction_packets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpiTransactionPacket {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String packetUtr;
    
    @Column(precision = 19, scale = 2)
    private BigDecimal amount;
    
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_transaction_id")
    @JsonIgnore
    private UpiParentTransaction parentTransaction;
}
