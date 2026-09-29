package com.kyrodatatech.banking.domain.audit.service;

import com.kyrodatatech.banking.domain.audit.entity.AuditLog;
import com.kyrodatatech.banking.domain.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@EnableAsync
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void logAction(String action, String entityId, String actorId, String actorRole, String details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entityId(entityId)
                    .actorId(actorId)
                    .actorRole(actorRole)
                    .timestamp(LocalDateTime.now())
                    .details(details)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("AUDIT [{}]: Entity={} Actor={} Role={}", action, entityId, actorId, actorRole);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage());
        }
    }
}
