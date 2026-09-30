package com.kyrodatatech.banking.domain.operations.controller;

import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operations/exceptions")
public class ExceptionQueueController {
    private final TransactionRepository transactionRepository;

    public ExceptionQueueController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @GetMapping("/high-risk")
    public ResponseEntity<List<Transaction>> getHighRiskTransactions() {
        List<Transaction> exceptions = transactionRepository.findByStatus(TransactionStatus.AML_FLAGGED, PageRequest.of(0, 100)).getContent();
        return ResponseEntity.ok(exceptions);
    }
}