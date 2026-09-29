package com.kyrodatatech.banking.domain.llm;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kyrodatatech.banking.domain.llm.dto.TransactionRiskRequestDto;
import com.kyrodatatech.banking.domain.llm.dto.TransactionRiskResponseDto;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class LlmRiskService {

    @Value("${aml.service.url:http://localhost:8000/api/v1/analyze-risk}")
    private String amlServiceUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public LlmRiskService(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(15))
                .build();
        this.objectMapper = objectMapper;
    }

    LlmRiskService(String amlServiceUrl, RestTemplate restTemplate) {
        this.amlServiceUrl = amlServiceUrl;
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Performs multi-factor risk analysis (velocity, cross-border/SWIFT, country risk).
     * Returns a structured JSON string.
     */
    public String evaluateTransactionRisk(String txRef, String type, Double amount, String makerId) {
        log.info("Dispatching AML evaluation request to Python Microservice: txRef={}, type={}, amount={}", txRef, type, amount);

        TransactionRiskRequestDto payload = TransactionRiskRequestDto.builder()
                .transactionRef(txRef)
                .paymentType(type)
                .amount(amount)
                .currency("INR")
                .makerId(makerId)
                .countryCode("SWIFT".equalsIgnoreCase(type) ? "AE" : "IN")
                .notes("Automated Maker-Checker pre-approval risk scan")
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<TransactionRiskRequestDto> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<TransactionRiskResponseDto> response = restTemplate.postForEntity(
                    amlServiceUrl,
                    request,
                    TransactionRiskResponseDto.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                TransactionRiskResponseDto body = response.getBody();
                Map<String, Object> riskData = new HashMap<>();
                riskData.put("riskScore", body.getRiskScore());
                riskData.put("riskLevel", body.getRiskLevel());
                riskData.put("complianceSummary", body.getExplanation());
                return objectMapper.writeValueAsString(riskData);
            }

        } catch (Exception e) {
            log.warn("Could not connect to Python AML Microservice at {} ({}), executing fallback rule evaluation.", amlServiceUrl, e.getMessage());
        }
        
        // Advanced Fallback Logic
        return performFallbackRiskAnalysis(txRef, type, amount, makerId);
    }
    
    private String performFallbackRiskAnalysis(String txRef, String type, Double amount, String makerId) {
        Map<String, Object> riskData = new HashMap<>();
        if (amount > 1000000.0 || "SWIFT".equalsIgnoreCase(type)) {
            riskData.put("riskScore", 0.85);
            riskData.put("riskLevel", "HIGH");
            riskData.put("complianceSummary", "High volume or cross-border transaction flagged for AML review.");
        } else {
            riskData.put("riskScore", 0.10);
            riskData.put("riskLevel", "LOW");
            riskData.put("complianceSummary", "Standard parameters passed domestic baseline.");
        }
        try {
            return objectMapper.writeValueAsString(riskData);
        } catch (Exception e) {
            return "{}";
        }
    }
}
