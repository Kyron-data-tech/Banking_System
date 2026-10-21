package com.kyrodatatech.banking.domain.upi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "upi_collect_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpiCollectRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String collectRef;

    @Column(nullable = false)
    private String requesterVpa;

    private String requesterName;

    @Column(nullable = false)
    private String payerVpa;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    private String note;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, DECLINED, EXPIRED

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
        }
        if (expiresAt == null) {
            expiresAt = LocalDateTime.now().plusMinutes(5);
        }
        if (collectRef == null) {
            collectRef = "COL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
