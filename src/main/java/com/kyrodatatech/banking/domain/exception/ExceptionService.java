package com.kyrodatatech.banking.domain.exception;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExceptionService {
    private final ExceptionRepository exceptionRepository;

    public void createException(String type, String entityId, String reason) {
        OperationalException ex = OperationalException.builder()
            .exceptionType(type)
            .entityId(entityId)
            .reason(reason)
            .status("OPEN")
            .build();
        exceptionRepository.save(ex);
    }

    public List<OperationalException> getOpenExceptions() {
        return exceptionRepository.findByStatus("OPEN");
    }

    public void resolveException(UUID id, String resolvedBy, String remarks, String newStatus) {
        OperationalException ex = exceptionRepository.findById(id).orElseThrow();
        ex.setStatus(newStatus);
        ex.setResolvedBy(resolvedBy);
        ex.setResolutionRemarks(remarks);
        exceptionRepository.save(ex);
    }
}
