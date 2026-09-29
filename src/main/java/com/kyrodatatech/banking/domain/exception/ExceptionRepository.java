package com.kyrodatatech.banking.domain.exception;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface ExceptionRepository extends JpaRepository<OperationalException, UUID> {
    List<OperationalException> findByStatus(String status);
}
