package com.kyrodatatech.banking.domain.exception;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "operational_exceptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationalException {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String exceptionType; // AML_FLAG, TRANSACTION_FAILED, REJECTED_MAKER

    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private String status; // OPEN, RESOLVED, REJECTED

    @Column(name = "resolved_by")
    private String resolvedBy;

    @Column(name = "resolution_remarks", length = 1000)
    private String resolutionRemarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
