package com.kyrodatatech.banking.domain.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/exceptions")
@RequiredArgsConstructor
public class ExceptionController {
    private final ExceptionService exceptionService;

    @GetMapping("/open")
    @PreAuthorize("hasAnyRole('BANK_SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'PAYMENT_OPERATIONS')")
    public ResponseEntity<List<OperationalException>> getOpenExceptions() {
        return ResponseEntity.ok(exceptionService.getOpenExceptions());
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('BANK_SUPER_ADMIN', 'COMPLIANCE_OFFICER')")
    public ResponseEntity<String> resolveException(@PathVariable UUID id, @RequestBody Map<String, String> payload, Authentication auth) {
        exceptionService.resolveException(id, auth.getName(), payload.get("remarks"), payload.get("status"));
        return ResponseEntity.ok("Resolved successfully");
    }
}
