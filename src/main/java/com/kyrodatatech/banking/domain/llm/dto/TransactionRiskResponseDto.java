package com.kyrodatatech.banking.domain.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO received from the Python AML/LLM Risk microservice.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRiskResponseDto {
    private String transactionRef;
    private String riskLevel;   // LOW, MEDIUM, HIGH
    private Double riskScore;   // 0.0 - 1.0
    private String explanation;
    private String model;
}
