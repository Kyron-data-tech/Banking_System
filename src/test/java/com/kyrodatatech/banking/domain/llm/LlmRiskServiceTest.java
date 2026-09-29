package com.kyrodatatech.banking.domain.llm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class LlmRiskServiceTest {

    private static final String AML_URL = "http://aml.test/api/v1/analyze-risk";

    private MockRestServiceServer mockServer;
    private LlmRiskService service;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.bindTo(restTemplate).build();
        service = new LlmRiskService(AML_URL, restTemplate);
    }

    @Test
    void sendsTransactionToPythonAndReturnsRiskAssessment() {
        mockServer.expect(requestTo(AML_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Content-Type", MediaType.APPLICATION_JSON_VALUE))
                .andExpect(content().json("""
                        {
                          "transactionRef": "TX-100",
                          "paymentType": "SWIFT",
                          "amount": 5000000.0,
                          "currency": "INR",
                          "makerId": "maker@kyrobank.com",
                          "countryCode": "AE"
                        }
                        """, false))
                .andRespond(withSuccess("""
                        {
                          "transactionRef": "TX-100",
                          "riskLevel": "HIGH",
                          "riskScore": 0.91,
                          "explanation": "Cross-border payment requires review",
                          "model": "llama3"
                        }
                        """, MediaType.APPLICATION_JSON));

        String result = service.evaluateTransactionRisk(
                "TX-100", "SWIFT", 5_000_000.0, "maker@kyrobank.com");

        assertThat(result)
                .contains("HIGH")
                .contains("0.91")
                .contains("Cross-border payment requires review");
        mockServer.verify();
    }

    @Test
    void fallsBackToRulesWhenPythonServiceIsUnavailable() {
        mockServer.expect(requestTo(AML_URL))
                                .andRespond(withException(new IOException("Python service is offline")));

        String result = service.evaluateTransactionRisk(
                "TX-101", "NEFT", 2_000_000.0, "maker@kyrobank.com");

        assertThat(result)
                .startsWith("HIGH")
                .contains("Rule Fallback")
                .contains("AML review");
        mockServer.verify();
    }
}
