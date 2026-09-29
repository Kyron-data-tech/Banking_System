package com.kyrodatatech.banking.domain.llm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO sent to the Python AML/LLM Risk microservice.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRiskRequestDto {
    private String transactionRef;
    private String paymentType;
    private Double amount;
    private String currency;
    private String makerId;
    private String countryCode;
    private String notes;
}
