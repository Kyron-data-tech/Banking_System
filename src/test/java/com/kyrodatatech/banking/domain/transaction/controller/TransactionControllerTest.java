package com.kyrodatatech.banking.domain.transaction.controller;

import com.kyrodatatech.banking.domain.llm.LlmRiskService;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ============================================================================
 * TransactionControllerTest - Security & 4-Eyes Workflow Verification
 * ============================================================================
 * 
 * Verifies:
 * 1. Role-Based Access Control (RBAC) on transaction endpoints.
 * 2. Successful transaction initiation by authenticated MAKER.
 * 3. 4-Eyes Principle enforcement: Prevention of Self-Approval (403 Forbidden).
 * 4. Successful authorization when verified by a distinct CHECKER.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Transaction Controller & Security Policy Tests")
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TransactionRepository transactionRepository;

    @MockBean
    private LlmRiskService llmRiskService;

    @Nested
    @DisplayName("Transaction Initiation Flow (Maker Role)")
    class InitiationTests {

        @Test
        @DisplayName("GIVEN an authenticated MAKER WHEN initiating a valid payment THEN return 200 OK with PENDING_CHECKER status")
        @WithMockUser(username = "maker@kyrobank.com", roles = {"MAKER"})
        void shouldAllowMakerToInitiatePayment() throws Exception {
            when(llmRiskService.evaluateTransactionRisk(anyString(), anyString(), anyDouble(), anyString()))
                    .thenReturn("LOW (Score: 0.12) - Passed baseline checks.");

            mockMvc.perform(post("/api/transactions/initiate")
                            .param("type", "NEFT")
                            .param("amount", "250000.00")
                            .param("makerId", "maker@kyrobank.com")
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString("SUCCESS: NEFT payment of ₹250000.0 initiated")))
                    .andExpect(content().string(containsString("AI AML Risk Report: LOW (Score: 0.12)")))
                    .andExpect(content().string(containsString("Status: PENDING_CHECKER. Waiting for Checker to authorize.")));
        }

        @Test
        @DisplayName("GIVEN an unauthorized user (CHECKER only) WHEN attempting initiation THEN return 403 Forbidden")
        @WithMockUser(username = "checker@kyrobank.com", roles = {"CHECKER"})
        void shouldRejectInitiationByUnauthorizedRole() throws Exception {
            mockMvc.perform(post("/api/transactions/initiate")
                            .param("type", "RTGS")
                            .param("amount", "1000000.00")
                            .param("makerId", "checker@kyrobank.com")
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Maker-Checker Approval & Self-Approval Blockade Flow")
    class ApprovalWorkflowTests {

        private static final String TX_REF = "TXN-20260918-ABCD1234";

        @Test
        @DisplayName("GIVEN identical Maker and Checker IDs WHEN approving THEN return 403 Forbidden (Strict Security Alert)")
        @WithMockUser(username = "dual_role_user@kyrobank.com", roles = {"CHECKER", "BANK_SUPER_ADMIN"})
        void shouldBlockSelfApprovalAttempt() throws Exception {
            String conflictingUser = "corporate_admin@kyrobank.com";

            mockMvc.perform(post("/api/transactions/{txRef}/approve", TX_REF)
                            .param("checkerId", conflictingUser)
                            .param("makerId", conflictingUser)
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                    .andExpect(status().isForbidden())
                    .andExpect(content().string(containsString("SECURITY ALERT: Self-approval is strictly forbidden")));
        }

        @Test
        @DisplayName("GIVEN distinct Maker and Checker WHEN approving THEN return 200 OK with approval confirmation")
        @WithMockUser(username = "checker@kyrobank.com", roles = {"CHECKER"})
        void shouldApproveWhenMakerAndCheckerAreDistinct() throws Exception {
            String makerId = "maker@kyrobank.com";
            String checkerId = "checker@kyrobank.com";

            mockMvc.perform(post("/api/transactions/{txRef}/approve", TX_REF)
                            .param("checkerId", checkerId)
                            .param("makerId", makerId)
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString("TRANSACTION REVIEWED:")))
                    .andExpect(content().string(containsString("- Ref: " + TX_REF)))
                    .andExpect(content().string(containsString("- Authorized By: " + checkerId)))
                    .andExpect(content().string(containsString("- New Status: PROCESSING via Banking Network")));
        }
    }
}
