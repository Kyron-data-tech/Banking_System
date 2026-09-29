package com.kyrodatatech.banking.security;

import com.kyrodatatech.banking.domain.llm.LlmRiskService;
import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.*;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ============================================================================
 * RBACSecurityTest - Role-Based Access Control Security Validation Suite
 * ============================================================================
 *
 * Validates that Spring Security @PreAuthorize annotations correctly enforce
 * the KyroBank CMS 4-Eyes Maker-Checker access control model:
 *
 *   ANONYMOUS      -> any protected endpoint         -> 3xx Redirect (OAuth2)
 *   MAKER          -> GET  /api/transactions          -> 200 OK
 *   CORP_MAKER     -> POST /api/transactions/initiate -> 200 OK  (authorized)
 *   CORP_MAKER     -> POST /{ref}/approve             -> 403 FORBIDDEN (4-Eyes)
 *   CORP_CHECKER   -> POST /{ref}/approve             -> non-403  (authorized)
 *   CORP_CHECKER   -> POST /api/transactions/initiate -> 403 FORBIDDEN (4-Eyes)
 *   COMPLIANCE_OFFICER -> GET /api/transactions       -> 200 OK
 *   COMPLIANCE_OFFICER -> POST /initiate              -> 403 FORBIDDEN
 *   BANK_SUPER_ADMIN   -> all endpoints               -> 200 OK / non-403
 *
 * DESIGN NOTES:
 *   @MockBean LlmRiskService  -- prevents real Ollama HTTP calls (would fail in CI)
 *   @MockBean TransactionRepository -- prevents real H2 DB writes which would
 *     violate NOT NULL constraints on columns not set in the test fallback builder
 *
 *   Anonymous 401 vs 302: With OAuth2 login configured, Spring Security redirects
 *   unauthenticated users to the OAuth2 login page (HTTP 302) instead of returning
 *   401. This is standard OAuth2 behavior. The test validates the redirect occurs,
 *   confirming unauthenticated access is blocked (access denied, but via redirect).
 *
 * @author  KyroBank CMS Security Engineering Team
 * @version 2.1 -- Phase 2: Fixed OAuth2 redirect behavior + MockBean isolation
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("RBAC Security Enforcement Test Suite")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class RBACSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    // =========================================================================
    // MockBeans -- isolate RBAC tests from LLM and DB side-effects
    // =========================================================================

    /**
     * Mocked LLM service: prevents real Ollama/HTTP calls during @SpringBootTest.
     * Without this, initiatePayment() throws NoClassDefFoundError for the LLM DTO.
     */
    @MockBean
    private LlmRiskService llmRiskService;

    /**
     * Mocked repository: prevents real H2 DB writes.
     * Without this, the approve endpoint fallback builder creates a Transaction with
     * null creditAccountName which violates the NOT NULL DB constraint (H2 error 23502).
     */
    @MockBean
    private TransactionRepository transactionRepository;

    /**
     * Setup mock return values so initiate and approve endpoints
     * can complete their business logic without hitting real infrastructure.
     */
    @BeforeEach
    void setupMocks() {
        // LLM risk scan returns a mock AML report (no real Ollama needed)
        when(llmRiskService.evaluateTransactionRisk(
                anyString(), anyString(), anyDouble(), anyString()))
                .thenReturn("AML_RISK: LOW | Score: 12/100 | APPROVED for processing");

        // Repository reads return empty list / empty optional (safe defaults)
        when(transactionRepository.findAll(any(Sort.class))).thenReturn(List.of());
        when(transactionRepository.findByTransactionRefNo(anyString())).thenReturn(Optional.empty());

        // Repository write is a no-op in tests (returns the entity passed in)
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    // =========================================================================
    // GROUP 1: ANONYMOUS -- Must be blocked (redirected by OAuth2)
    // =========================================================================

    /**
     * [SECURITY-001] Unauthenticated request -> OAuth2 login redirect (302)
     *
     * WHY 302, NOT 401?
     *   When OAuth2 login is configured, Spring Security''s default behavior for
     *   unauthenticated requests is to redirect to the OAuth2 authorization URL
     *   (HTTP 302 Found), NOT to return HTTP 401 Unauthorized.
     *   Both 302 and 401 confirm the user is BLOCKED -- just via different mechanisms:
     *     - 401: "Who are you? Prove your identity."
     *     - 302: "You are not authenticated. Go log in here."
     *   For REST API production hardening, a custom AuthenticationEntryPoint
     *   returning 401 would be added. This test validates the current OAuth2 behavior.
     */
    @Test
    @Order(1)
    @DisplayName("[SECURITY-001] Anonymous user is redirected by OAuth2 (302) - access denied")
    void anonymousUser_accessingProtectedEndpoint_redirectedByOAuth2() throws Exception {
        mockMvc.perform(get("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                // OAuth2 redirects unauthenticated users to login page (302)
                // This confirms access is denied -- no data is returned to anonymous callers
                .andExpect(status().is3xxRedirection());
    }

    // =========================================================================
    // GROUP 2: MAKER ROLE -- Can initiate, cannot approve
    // =========================================================================

    /**
     * [SECURITY-002] MAKER can view the transaction list (GET /api/transactions) -> 200 OK
     * getAll() @PreAuthorize permits: BANK_SUPER_ADMIN, PAYMENT_OPERATIONS,
     * COMPLIANCE_OFFICER, MAKER, CHECKER.
     */
    @Test
    @Order(2)
    @WithMockUser(roles = "MAKER")
    @DisplayName("[SECURITY-002] MAKER can view transaction list (GET /api/transactions) -> 200 OK")
    void makerRole_getTransactionList_returns200() throws Exception {
        mockMvc.perform(get("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    /**
     * [SECURITY-003] CORP_MAKER can initiate a transaction (POST /initiate) -> 200 OK
     * @PreAuthorize permits: MAKER, BANK_SUPER_ADMIN, CORP_MAKER.
     */
    @Test
    @Order(3)
    @WithMockUser(roles = "CORP_MAKER")
    @DisplayName("[SECURITY-003] CORP_MAKER can initiate a transaction -> 200 OK")
    void corpMakerRole_initiateTransaction_returns200() throws Exception {
        mockMvc.perform(post("/api/transactions/initiate")
                .param("type", "NEFT")
                .param("amount", "50000.0")
                .param("makerId", "MAKER-EMP-001")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andDo(print())
                .andExpect(status().isOk());
    }

    /**
     * [SECURITY-004] CORP_MAKER CANNOT approve -- 403 FORBIDDEN
     *
     * CRITICAL 4-EYES HTTP LAYER TEST:
     * @PreAuthorize on /approve only permits: CHECKER, BANK_SUPER_ADMIN, CORP_CHECKER.
     * A CORP_MAKER attempting to approve is BLOCKED at the Spring Security filter layer,
     * BEFORE any controller business logic runs. This is the HTTP-layer complement to
     * the business-logic self-approval check inside the controller itself.
     */
    @Test
    @Order(4)
    @WithMockUser(roles = "CORP_MAKER")
    @DisplayName("[SECURITY-004] CORP_MAKER CANNOT approve transactions -> 403 FORBIDDEN (4-Eyes HTTP layer)")
    void corpMakerRole_attemptApproval_returns403() throws Exception {
        mockMvc.perform(post("/api/transactions/TXN-2026-RBAC-001/approve")
                .param("checkerId", "MAKER-TRYING-TO-APPROVE")
                .param("makerId", "MAKER-EMP-002")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andDo(print())
                .andExpect(status().isForbidden()); // 403 -- @PreAuthorize rejects CORP_MAKER
    }

    // =========================================================================
    // GROUP 3: CHECKER ROLE -- Can approve, cannot initiate
    // =========================================================================

    /**
     * [SECURITY-005] CORP_CHECKER can access the approval endpoint -> NOT 403
     * RBAC allows CORP_CHECKER on /approve. The response code (200 etc.) depends
     * on business logic, but the SECURITY layer must not return 403.
     */
    @Test
    @Order(5)
    @WithMockUser(roles = "CORP_CHECKER")
    @DisplayName("[SECURITY-005] CORP_CHECKER can access approval endpoint -> NOT 403")
    void corpCheckerRole_accessApprovalEndpoint_isNotForbidden() throws Exception {
        var result = mockMvc.perform(post("/api/transactions/TXN-RBAC-CHECKER-001/approve")
                .param("checkerId", "CHECKER-EMP-777")
                .param("makerId", "MAKER-EMP-001") // Different IDs -- passes self-approval check
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andDo(print())
                .andReturn();

        assertThat(result.getResponse().getStatus())
                .as("CORP_CHECKER must NOT be blocked (403) from the approval endpoint by RBAC")
                .isNotEqualTo(403);
    }

    /**
     * [SECURITY-006] CORP_CHECKER CANNOT initiate a transaction -> 403 FORBIDDEN
     *
     * CRITICAL 4-EYES TEST: Segregation of duties prevents a Checker from also
     * being a Maker. If a Checker could initiate, they could create then self-approve
     * by exploiting any timing gap -- defeating the 4-Eyes model entirely.
     */
    @Test
    @Order(6)
    @WithMockUser(roles = "CORP_CHECKER")
    @DisplayName("[SECURITY-006] CORP_CHECKER CANNOT initiate transactions -> 403 FORBIDDEN (segregation of duties)")
    void corpCheckerRole_attemptInitiation_returns403() throws Exception {
        mockMvc.perform(post("/api/transactions/initiate")
                .param("type", "SWIFT")
                .param("amount", "1000000.0")
                .param("makerId", "CHECKER-TRYING-TO-INITIATE")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andDo(print())
                .andExpect(status().isForbidden()); // 403 -- Checker has zero initiation rights
    }

    // =========================================================================
    // GROUP 4: COMPLIANCE_OFFICER -- Read-only audit access
    // =========================================================================

    /**
     * [SECURITY-007] COMPLIANCE_OFFICER has read access for AML/regulatory audit -> 200 OK
     */
    @Test
    @Order(7)
    @WithMockUser(roles = "COMPLIANCE_OFFICER")
    @DisplayName("[SECURITY-007] COMPLIANCE_OFFICER has read access for audit -> 200 OK")
    void complianceOfficerRole_readTransactions_returns200() throws Exception {
        mockMvc.perform(get("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    /**
     * [SECURITY-008] COMPLIANCE_OFFICER CANNOT initiate transactions -> 403 FORBIDDEN
     * Compliance Officers are observers and auditors, never workflow actors.
     */
    @Test
    @Order(8)
    @WithMockUser(roles = "COMPLIANCE_OFFICER")
    @DisplayName("[SECURITY-008] COMPLIANCE_OFFICER CANNOT initiate transactions -> 403 FORBIDDEN")
    void complianceOfficerRole_attemptInitiation_returns403() throws Exception {
        mockMvc.perform(post("/api/transactions/initiate")
                .param("type", "NEFT")
                .param("amount", "10000.0")
                .param("makerId", "COMPLIANCE-001")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // GROUP 5: BANK_SUPER_ADMIN -- Full superuser access
    // =========================================================================

    /** [SECURITY-009] BANK_SUPER_ADMIN has full read access -> 200 OK */
    @Test
    @Order(9)
    @WithMockUser(roles = "BANK_SUPER_ADMIN")
    @DisplayName("[SECURITY-009] BANK_SUPER_ADMIN has full read access -> 200 OK")
    void bankSuperAdminRole_readTransactions_returns200() throws Exception {
        mockMvc.perform(get("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }

    /** [SECURITY-010] BANK_SUPER_ADMIN can initiate transactions (emergency) -> 200 OK */
    @Test
    @Order(10)
    @WithMockUser(roles = "BANK_SUPER_ADMIN")
    @DisplayName("[SECURITY-010] BANK_SUPER_ADMIN can initiate transactions -> 200 OK")
    void bankSuperAdminRole_initiateTransaction_returns200() throws Exception {
        mockMvc.perform(post("/api/transactions/initiate")
                .param("type", "SWIFT")
                .param("amount", "5000000.0")
                .param("makerId", "ADMIN-ROOT-001")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andDo(print())
                .andExpect(status().isOk());
    }

    /** [SECURITY-011] BANK_SUPER_ADMIN can access approval endpoint -> NOT 403 */
    @Test
    @Order(11)
    @WithMockUser(roles = "BANK_SUPER_ADMIN")
    @DisplayName("[SECURITY-011] BANK_SUPER_ADMIN can access approval endpoint -> NOT 403")
    void bankSuperAdminRole_accessApprovalEndpoint_isNotForbidden() throws Exception {
        var result = mockMvc.perform(post("/api/transactions/TXN-ADMIN-OVERRIDE-001/approve")
                .param("checkerId", "ADMIN-CHECKER-001")
                .param("makerId", "ADMIN-MAKER-002") // Different IDs -- passes self-approval check
                .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andDo(print())
                .andReturn();

        assertThat(result.getResponse().getStatus())
                .as("BANK_SUPER_ADMIN must NOT be blocked (403) from the approval endpoint by RBAC")
                .isNotEqualTo(403);
    }
}
