package com.kyrodatatech.banking.domain.transaction;

import com.kyrodatatech.banking.domain.transaction.controller.TransactionController;
import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionType;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import com.kyrodatatech.banking.domain.transaction.strategy.PaymentStrategy;
import com.kyrodatatech.banking.domain.transaction.strategy.PaymentStrategyFactory;
import com.kyrodatatech.banking.domain.transaction.strategy.SwiftPaymentStrategy;
import com.kyrodatatech.banking.domain.llm.LlmRiskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import com.kyrodatatech.banking.domain.audit.service.AuditLogService;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * ============================================================================
 * TransactionServiceTest - Core Business Logic & Security Unit Suite
 * ============================================================================
 * 
 * Verifies:
 * 1. Strict 4-Eyes Maker-Checker Self-Approval Blockade.
 * 2. Strategy Pattern resolution via PaymentStrategyFactory.
 * 3. Execution of concrete payment strategies (SWIFT / NEFT).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Transaction Core Service & Security Unit Tests")
public class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private LlmRiskService llmRiskService;

    @Mock
    private PaymentStrategyFactory paymentStrategyFactory;

    @Mock
    private SwiftPaymentStrategy swiftPaymentStrategy;

    @InjectMocks
    private TransactionController transactionController;

    private Transaction sampleTransaction;
    private final String txRef = "TXN-20260922-A1B2C3D4";

    @BeforeEach
    void setUp() {
        sampleTransaction = Transaction.builder()
                .id(UUID.randomUUID())
                .transactionRefNo(txRef)
                .transactionType(TransactionType.SWIFT)
                .amount(new BigDecimal("5000000.00"))
                .currency("INR")
                .status(TransactionStatus.SUBMITTED)
                .swiftBic("KYROUS33XXX")
                .debitAccountNo("AC-CORP-98231")
                .creditAccountNo("AC-BENEFICIARY-44321")
                .build();
    }

    @Nested
    @DisplayName("1. 4-Eyes Principle & Self-Approval Prevention Tests")
    class SelfApprovalTests {

        @Test
        @DisplayName("GIVEN identical maker and checker WHEN approving THEN block with HTTP 403 Forbidden")
        void testSelfApprovalPrevention() {
            // Arrange: Attempting self-approval where checker equals maker
            String conflictingUserId = "corporate_admin@kyrobank.com";

            // Act: Execute approval request
            ResponseEntity<String> response = transactionController.approvePayment(
                    txRef,
                    conflictingUserId, // checkerId
                    conflictingUserId  // makerId
            );

            // Assert: Security blockade triggered
            assertNotNull(response, "Response should not be null");
            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode(), "Self-approval must return 403 Forbidden");
            assertNotNull(response.getBody(), "Response body should contain security violation explanation");
            assertTrue(response.getBody().contains("SECURITY ALERT: Self-approval is strictly forbidden"),
                    "Response message must explicitly indicate self-approval blockade");

            // Verify: No database modifications or strategy executions occurred
            verify(paymentStrategyFactory, never()).getStrategy(anyString());
            verify(transactionRepository, never()).save(any(Transaction.class));
        }

        @Test
        @DisplayName("GIVEN distinct maker and checker WHEN approving THEN permit authorization with HTTP 200 OK")
        void testValidMultiPartyApproval() {
            // Arrange: Distinct identities
            String makerId = "maker@kyrobank.com";
            String checkerId = "checker@kyrobank.com";

            when(transactionRepository.findByTransactionRefNo(txRef)).thenReturn(Optional.of(sampleTransaction));
            when(paymentStrategyFactory.getStrategy("SWIFT")).thenReturn(swiftPaymentStrategy);
            when(swiftPaymentStrategy.processPayment(any(Transaction.class)))
                    .thenReturn("SWIFT_DISPATCHED: UTR=SWIFT-99238471");
            when(transactionRepository.save(any(Transaction.class))).thenReturn(sampleTransaction);

            // Act
            ResponseEntity<String> response = transactionController.approvePayment(txRef, checkerId, makerId);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().contains("TRANSACTION APPROVED"));
            assertTrue(response.getBody().contains("- Authorized By: " + checkerId));

            verify(paymentStrategyFactory, times(1)).getStrategy("SWIFT");
            verify(swiftPaymentStrategy, times(1)).processPayment(sampleTransaction);
            verify(transactionRepository, times(1)).save(sampleTransaction);
        }
    }

    @Nested
    @DisplayName("2. Payment Strategy Pattern Dynamic Routing Tests")
    class StrategyRoutingTests {

        @Test
        @DisplayName("GIVEN an approved SWIFT transaction WHEN routed THEN resolve SwiftPaymentStrategy and process successfully")
        void testPaymentStrategyRouting() {
            // Arrange
            String makerId = "corp_maker@kyrobank.com";
            String checkerId = "corp_checker@kyrobank.com";

            when(transactionRepository.findByTransactionRefNo(txRef)).thenReturn(Optional.of(sampleTransaction));
            when(paymentStrategyFactory.getStrategy("SWIFT")).thenReturn(swiftPaymentStrategy);
            when(swiftPaymentStrategy.processPayment(sampleTransaction))
                    .thenReturn("SWIFT_DISPATCHED: Wire transfer queued with Interbank Correspondent network.");
            when(transactionRepository.save(any(Transaction.class))).thenReturn(sampleTransaction);

            // Act
            ResponseEntity<String> response = transactionController.approvePayment(txRef, checkerId, makerId);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().contains("SWIFT_DISPATCHED"));

            // Verify: PaymentStrategyFactory resolved SWIFT and called processPayment
            verify(paymentStrategyFactory).getStrategy("SWIFT");
            verify(swiftPaymentStrategy).processPayment(sampleTransaction);
            assertEquals(TransactionStatus.APPROVED, sampleTransaction.getStatus());
        }
    }

    @Nested
    @DisplayName("3. Transaction Initiation & AML Risk Pre-Check Tests")
    class InitiationFlowTests {

        @Test
        @DisplayName("GIVEN valid payment parameters WHEN maker initiates THEN evaluate AI risk and save transaction as SUBMITTED")
        void testInitiatePaymentWithAmlRiskEvaluation() {
            // Arrange
            String type = "SWIFT";
            Double amount = 5000000.00;
            String makerId = "maker@kyrobank.com";

            when(llmRiskService.evaluateTransactionRisk(anyString(), eq(type), eq(amount), eq(makerId)))
                    .thenReturn("HIGH (Score: 0.88) - High-value cross-border payment to UAE.");
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            ResponseEntity<String> response = transactionController.initiatePayment(type, amount, makerId);

            // Assert
            assertNotNull(response);
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody().contains("SUCCESS: SWIFT payment"));
            assertTrue(response.getBody().contains("AI AML Risk Report: HIGH (Score: 0.88)"));
            assertTrue(response.getBody().contains("Status: PENDING_CHECKER"));

            verify(llmRiskService, times(1)).evaluateTransactionRisk(anyString(), eq(type), eq(amount), eq(makerId));
            verify(transactionRepository, times(1)).save(any(Transaction.class));
        }
    }
}
