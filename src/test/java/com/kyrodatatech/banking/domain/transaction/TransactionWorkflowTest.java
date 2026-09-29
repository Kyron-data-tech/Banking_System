package com.kyrodatatech.banking.domain.transaction;

import com.kyrodatatech.banking.domain.llm.LlmRiskService;
import com.kyrodatatech.banking.domain.transaction.controller.TransactionController;
import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionType;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import com.kyrodatatech.banking.domain.transaction.strategy.*;
import com.kyrodatatech.banking.exception.AppException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import com.kyrodatatech.banking.domain.audit.service.AuditLogService;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ============================================================================
 * TransactionWorkflowTest - Business Logic Workflow Test Suite
 * ============================================================================
 * Tests the CORE BUSINESS RULES of the KyroBank CMS transaction engine
 * using pure Mockito (no Spring context - fast, isolated unit tests).
 *
 * DOMAIN 1: 4-Eyes Maker-Checker Security Protocol
 *   The "4-Eyes Principle" (Vier-Augen-Prinzip) mandates that every
 *   financial transaction must be initiated by one person (Maker) and
 *   approved by a DIFFERENT person (Checker). Self-approval is a
 *   critical internal control violation that enables fraud.
 *   Tests ensure the controller enforces this at the business logic level
 *   (complementing RBAC enforcement at the HTTP security layer).
 *
 * DOMAIN 2: Payment Strategy Pattern (GoF Strategy Pattern)
 *   PaymentStrategyFactory dynamically routes transactions to the
 *   correct payment network gateway based on transaction type:
 *     SWIFT -> International wire transfers (cross-border)
 *     NEFT  -> National Electronic Funds Transfer (domestic RBI clearing)
 *     NULL/UNKNOWN -> AppException (no silent failures allowed)
 *
 * @ExtendWith(MockitoExtension.class) - Pure Mockito, no Spring overhead
 * @InjectMocks - Real TransactionController with mocked dependencies
 * @Mock - Controlled fake implementations of all collaborators
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Transaction Business Workflow Test Suite")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TransactionWorkflowTest {

    // =========================================================================
    // Mocked Dependencies - Controlled fakes, no real DB/LLM/Gateway calls
    // =========================================================================

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private LlmRiskService llmRiskService;

    @Mock
    private PaymentStrategyFactory paymentStrategyFactory;
    @Mock
    private AuditLogService auditLogService;

    // =========================================================================
    // System Under Test - Real controller, all dependencies mocked
    // =========================================================================

    @InjectMocks
    private TransactionController transactionController;

    // =========================================================================
    // NESTED GROUP 1: 4-Eyes Maker-Checker Security Protocol
    // =========================================================================

    @Nested
    @DisplayName("Group 1: 4-Eyes Maker-Checker Security Protocol")
    class FourEyesPrincipleTests {

        /**
         * [4-EYES-001] Self-approval with identical IDs -> HTTP 403 Forbidden
         *
         * SCENARIO: An employee attempts to use their own ID as both Maker and Checker.
         * EXPECTED: Controller detects identity collision via equalsIgnoreCase() and
         * returns 403 IMMEDIATELY, before any DB lookup, strategy resolution, or save.
         *
         * SOX Compliance: Sarbanes-Oxley Act mandates segregation of duties.
         * The person who creates a payment cannot be the same who authorizes it.
         */
        @Test
        @Order(1)
        @DisplayName("[4-EYES-001] Self-approval with same Maker/Checker ID is blocked -> 403")
        void selfApproval_withSameCheckerAndMakerId_returns403() {
            // ARRANGE: Same employee ID for both roles (fraud attempt)
            String sharedId = "EMP-SELF-APPROVE-42";

            // ACT: Attempt self-approval
            ResponseEntity<String> response = transactionController.approvePayment(
                    "TXN-20260922-SELF001", sharedId, sharedId);

            // ASSERT: Must be 403 with security alert message
            assertThat(response.getStatusCode().value())
                    .as("Self-approval must return HTTP 403 Forbidden")
                    .isEqualTo(403);

            assertThat(response.getBody())
                    .as("Response body must contain security violation message")
                    .isNotNull()
                    .containsIgnoringCase("self-approval")
                    .containsIgnoringCase("forbidden");

            // VERIFY: Zero DB operations - check must short-circuit everything
            verify(transactionRepository, never()).findByTransactionRefNo(anyString());
            verify(transactionRepository, never()).save(any(Transaction.class));
            verify(paymentStrategyFactory, never()).getStrategy(anyString());
        }

        /**
         * [4-EYES-002] Case-insensitive self-approval bypass -> HTTP 403 Forbidden
         *
         * SCENARIO: Attacker exploits case sensitivity to bypass the identity check:
         *   makerId   = "emp-maker-007" (lowercase)
         *   checkerId = "EMP-MAKER-007" (uppercase)
         * EXPECTED: equalsIgnoreCase() catches this variant and returns 403.
         * Tests robustness against simple case-manipulation bypass attempts.
         */
        @Test
        @Order(2)
        @DisplayName("[4-EYES-002] Mixed-case self-approval bypass attempt is also blocked -> 403")
        void selfApproval_withMixedCaseIds_returns403() {
            // ARRANGE: Same person, different case (bypass attempt)
            String makerIdLower  = "emp-maker-corp-007";
            String checkerIdUpper = "EMP-MAKER-CORP-007"; // Same person, uppercase

            // ACT
            ResponseEntity<String> response = transactionController.approvePayment(
                    "TXN-20260922-CASE001", checkerIdUpper, makerIdLower);

            // ASSERT: Case-insensitive comparison catches the bypass
            assertThat(response.getStatusCode().value())
                    .as("Case-insensitive self-approval must still return 403")
                    .isEqualTo(403);

            verify(transactionRepository, never()).save(any());
        }

        /**
         * [4-EYES-003] Valid 4-Eyes approval (different Maker and Checker) -> 200 OK
         *
         * SCENARIO: Legitimate approval workflow:
         *   Employee A (CORP_MAKER): initiates transaction
         *   Employee B (CORP_CHECKER): independently reviews and approves
         * EXPECTED: Controller processes the approval, updates DB, returns 200 OK.
         * This is the HAPPY PATH that must work correctly for legitimate operations.
         */
        @Test
        @Order(3)
        @DisplayName("[4-EYES-003] Valid approval with different Maker/Checker IDs -> 200 OK")
        void validApproval_withDifferentMakerAndCheckerIds_returns200() {
            // ARRANGE: Two different employees (genuine 4-eyes pair)
            String makerId   = "MAKER-ALICE-EMP-001";
            String checkerId = "CHECKER-BOB-EMP-777";
            String txRef     = "TXN-20260922-LEGIT001";

            Transaction tx = Transaction.builder()
                    .transactionRefNo(txRef)
                    .transactionType(TransactionType.NEFT)
                    .amount(BigDecimal.valueOf(75000.00))
                    .currency("INR")
                    .status(TransactionStatus.PENDING_CHECKER)
                    .build();

            when(transactionRepository.findByTransactionRefNo(txRef)).thenReturn(Optional.of(tx));

            PaymentStrategy mockNeft = mock(PaymentStrategy.class);
            when(mockNeft.processPayment(any(Transaction.class)))
                    .thenReturn("NEFT_CLEARED: Settled via RBI clearing at 14:00 batch");
            when(paymentStrategyFactory.getStrategy("NEFT")).thenReturn(mockNeft);
            when(transactionRepository.save(any(Transaction.class))).thenReturn(tx);

            // ACT: Checker approves with their unique ID
            ResponseEntity<String> response = transactionController.approvePayment(
                    txRef, checkerId, makerId);

            // ASSERT: Full approval workflow completes successfully
            assertThat(response.getStatusCode().value())
                    .as("Valid 4-eyes approval must return HTTP 200 OK")
                    .isEqualTo(200);

            assertThat(response.getBody())
                    .as("Response must confirm transaction approval")
                    .isNotNull()
                    .containsIgnoringCase("APPROVED");

            // VERIFY: DB was queried and saved (full workflow executed)
            verify(transactionRepository, times(1)).findByTransactionRefNo(txRef);
            verify(transactionRepository, times(1)).save(any(Transaction.class));
        }
    }

    // =========================================================================
    // NESTED GROUP 2: Payment Strategy Pattern - Dynamic Gateway Routing
    // =========================================================================

    @Nested
    @DisplayName("Group 2: Payment Strategy Pattern - Gateway Routing Validation")
    class PaymentStrategyRoutingTests {

        private PaymentStrategyFactory realFactory;
        private SwiftPaymentStrategy swiftStrategy;
        private NeftPaymentStrategy  neftStrategy;

        /**
         * Before each test: build a REAL PaymentStrategyFactory with real strategies.
         * Simulates Spring's auto-discovery of PaymentStrategy beans by manually
         * constructing and passing the list (no ApplicationContext needed).
         */
        @BeforeEach
        void setUpRealStrategyFactory() {
            swiftStrategy = new SwiftPaymentStrategy();
            neftStrategy  = new NeftPaymentStrategy();
            realFactory   = new PaymentStrategyFactory(List.of(swiftStrategy, neftStrategy));
        }

        /**
         * [STRATEGY-001] SWIFT transaction -> SwiftPaymentStrategy resolved and executed
         *
         * SCENARIO: Cross-border international SWIFT wire transfer (e.g., USD wire to EU).
         * Wrong routing could send SWIFT payments through NEFT (domestic only),
         * causing regulatory non-compliance and settlement failures.
         */
        @Test
        @Order(4)
        @DisplayName("[STRATEGY-001] SWIFT type resolves to SwiftPaymentStrategy and processes correctly")
        void strategyFactory_swiftType_resolvesToSwiftStrategy() {
            // ARRANGE: International SWIFT transaction
            Transaction swiftTx = Transaction.builder()
                    .transactionRefNo("TXN-20260922-SWIFT-INT-01")
                    .transactionType(TransactionType.SWIFT)
                    .amount(BigDecimal.valueOf(500000.00))
                    .currency("USD")
                    .swiftBic("KYROBANK0DE")
                    .status(TransactionStatus.APPROVED)
                    .build();

            // ACT: Resolve strategy
            PaymentStrategy resolved = realFactory.getStrategy("SWIFT");

            // ASSERT: Correct implementation resolved
            assertThat(resolved)
                    .isNotNull()
                    .isInstanceOf(SwiftPaymentStrategy.class);

            // ACT: Execute payment
            String result = resolved.processPayment(swiftTx);

            // ASSERT: Response references SWIFT network
            assertThat(result)
                    .isNotNull()
                    .isNotBlank()
                    .containsIgnoringCase("SWIFT");
        }

        /**
         * [STRATEGY-002] NEFT transaction -> NeftPaymentStrategy resolved and executed
         *
         * SCENARIO: Domestic Indian NEFT payment (vendor payment in INR).
         * NEFT has specific RBI batch windows; correct routing ensures processing
         * in the right clearing cycle (not routed through SWIFT for domestic payment).
         */
        @Test
        @Order(5)
        @DisplayName("[STRATEGY-002] NEFT type resolves to NeftPaymentStrategy and processes correctly")
        void strategyFactory_neftType_resolvesToNeftStrategy() {
            // ARRANGE: Domestic NEFT transaction
            Transaction neftTx = Transaction.builder()
                    .transactionRefNo("TXN-20260922-NEFT-DOM-01")
                    .transactionType(TransactionType.NEFT)
                    .amount(BigDecimal.valueOf(125000.00))
                    .currency("INR")
                    .creditIfscCode("HDFC0004201")
                    .status(TransactionStatus.APPROVED)
                    .build();

            // ACT: Resolve strategy
            PaymentStrategy resolved = realFactory.getStrategy("NEFT");

            // ASSERT: Correct implementation resolved
            assertThat(resolved)
                    .isNotNull()
                    .isInstanceOf(NeftPaymentStrategy.class);

            // ACT: Execute payment
            String result = resolved.processPayment(neftTx);

            // ASSERT: Response references NEFT clearing house
            assertThat(result)
                    .isNotNull()
                    .isNotBlank()
                    .containsIgnoringCase("NEFT");
        }

        /**
         * [STRATEGY-003] Unknown payment type -> AppException thrown (no silent failures)
         *
         * FAIL-SAFE DESIGN: Better to loudly fail (throw AppException -> HTTP 400)
         * than silently succeed (transaction created but payment never sent to any gateway).
         * An unrouted transaction would mean funds disappear without payment being sent.
         */
        @Test
        @Order(6)
        @DisplayName("[STRATEGY-003] Unknown payment type throws AppException - no silent failures")
        void strategyFactory_unknownType_throwsAppException() {
            // ACT & ASSERT
            assertThatThrownBy(() -> realFactory.getStrategy("CRYPTO_TRANSFER"))
                    .isInstanceOf(AppException.class)
                    .hasMessageContaining("No payment routing strategy configured");

            // Verify exception carries correct HTTP status
            AppException ex = catchThrowableOfType(
                    () -> realFactory.getStrategy("UNSUPPORTED_NETWORK"),
                    AppException.class
            );
            assertThat(ex.getStatus())
                    .as("Unknown type must return BAD_REQUEST (400)")
                    .isEqualTo(HttpStatus.BAD_REQUEST);
        }

        /**
         * [STRATEGY-004] Null payment type -> AppException (not NullPointerException)
         *
         * Defensive programming: null input must produce a clean AppException (HTTP 400),
         * not an NPE (which would be an unhandled 500 Internal Server Error).
         */
        @Test
        @Order(7)
        @DisplayName("[STRATEGY-004] Null payment type throws AppException not NullPointerException")
        void strategyFactory_nullType_throwsAppExceptionNotNpe() {
            assertThatThrownBy(() -> realFactory.getStrategy(null))
                    .isInstanceOf(AppException.class)
                    .isNotInstanceOf(NullPointerException.class);
        }

        /**
         * [STRATEGY-005] Strategy beans correctly declare their supported type identifiers
         *
         * The factory uses getSupportedType() as the routing table key during construction.
         * If a strategy returns the wrong type, it is registered under the wrong key
         * and will never be resolvable. This test validates the declarations are correct.
         */
        @Test
        @Order(8)
        @DisplayName("[STRATEGY-005] Strategy beans correctly declare their supported payment types")
        void strategyBeans_supportedTypeDeclarations_areCorrect() {
            assertThat(swiftStrategy.getSupportedType().toUpperCase())
                    .as("SwiftPaymentStrategy must declare SWIFT")
                    .isEqualTo("SWIFT");

            assertThat(neftStrategy.getSupportedType().toUpperCase())
                    .as("NeftPaymentStrategy must declare NEFT")
                    .isEqualTo("NEFT");
        }
    }
}
