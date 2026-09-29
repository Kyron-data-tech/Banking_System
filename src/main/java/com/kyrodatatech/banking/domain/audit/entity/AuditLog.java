package com.kyrodatatech.banking.domain.audit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String action; // e.g., TRANSACTION_INITIATED, SELF_APPROVAL_BLOCKED

    @Column(name = "entity_id")
    private String entityId; // Transaction Ref or User ID

    @Column(name = "actor_id")
    private String actorId; // Maker or Checker ID

    @Column(name = "actor_role")
    private String actorRole;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT")
    private String details;
}
