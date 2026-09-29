package com.kyrodatatech.banking.domain.transaction;

import com.kyrodatatech.banking.domain.transaction.controller.TransactionController;
import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionType;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import com.kyrodatatech.banking.domain.audit.service.AuditLogService;
import com.kyrodatatech.banking.domain.llm.LlmRiskService;
import com.kyrodatatech.banking.domain.transaction.service.TransactionService;
import com.kyrodatatech.banking.domain.transaction.strategy.PaymentStrategy;
import com.kyrodatatech.banking.domain.transaction.strategy.PaymentStrategyFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Maker-Checker Multi-Tier Workflow Tests")
public class MakerCheckerWorkflowTest {

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private LlmRiskService llmRiskService;
    @Mock
    private TransactionService transactionService;
    @Mock
    private PaymentStrategyFactory paymentStrategyFactory;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private PaymentStrategy paymentStrategy;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private TransactionController transactionController;

    @BeforeEach
    void setUp() {
        lenient().when(paymentStrategyFactory.getStrategy(anyString())).thenReturn(paymentStrategy);
        lenient().when(paymentStrategy.processPayment(any())).thenReturn("MOCK_SUCCESS");
    }

    @Test
    @DisplayName("Self Approval must be blocked and return 403")
    void testSelfApprovalBlocked() {
        ResponseEntity<String> response = transactionController.approvePayment("TXN-123", "EMP-001", "EMP-001", authentication);
        
        assertThat(response.getStatusCodeValue()).isEqualTo(403);
        assertThat(response.getBody()).contains("Self-approval is strictly forbidden");
        verify(auditLogService).logAction(eq("SELF_APPROVAL_BLOCKED"), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Standard Tier (<= 1L) requires single CHECKER")
    void testStandardTierApproval() {
        Transaction tx = Transaction.builder().amount(new BigDecimal("50000")).status(TransactionStatus.PENDING_CHECKER).build();
        when(transactionRepository.findByTransactionRefNo("TXN-123")).thenReturn(Optional.of(tx));
        
        // Mock Roles for authentication
        doReturn(Collections.singleton(new SimpleGrantedAuthority("ROLE_CORP_CHECKER"))).when(authentication).getAuthorities();

        ResponseEntity<String> response = transactionController.approvePayment("TXN-123", "CHECKER-001", "MAKER-001", authentication);
        
        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(tx.getStatus()).isEqualTo(TransactionStatus.APPROVED);
        verify(auditLogService).logAction(eq("TRANSACTION_APPROVED"), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("High Value Tier (> 1L to 10L) by L1 requires L2 Approval")
    void testHighValueTierL1Approval() {
        Transaction tx = Transaction.builder().amount(new BigDecimal("500000")).status(TransactionStatus.PENDING_CHECKER).build();
        when(transactionRepository.findByTransactionRefNo("TXN-123")).thenReturn(Optional.of(tx));
        
        doReturn(Collections.singleton(new SimpleGrantedAuthority("ROLE_CORP_APPROVER_L1"))).when(authentication).getAuthorities();

        ResponseEntity<String> response = transactionController.approvePayment("TXN-123", "L1-001", "MAKER-001", authentication);
        
        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(tx.getStatus()).isEqualTo(TransactionStatus.PENDING_L2);
    }

    @Test
    @DisplayName("High Value Tier (> 1L to 10L) by L2 moves to APPROVED")
    void testHighValueTierL2Approval() {
        Transaction tx = Transaction.builder().amount(new BigDecimal("500000")).status(TransactionStatus.PENDING_L2).build();
        when(transactionRepository.findByTransactionRefNo("TXN-123")).thenReturn(Optional.of(tx));
        
        doReturn(Collections.singleton(new SimpleGrantedAuthority("ROLE_CORP_APPROVER_L2"))).when(authentication).getAuthorities();

        ResponseEntity<String> response = transactionController.approvePayment("TXN-123", "L2-001", "MAKER-001", authentication);
        
        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(tx.getStatus()).isEqualTo(TransactionStatus.APPROVED);
    }

    @Test
    @DisplayName("Enterprise Tier (> 10L) by L2 requires FINAL_AUTHORIZER")
    void testEnterpriseTierL2Approval() {
        Transaction tx = Transaction.builder().amount(new BigDecimal("50000000")).status(TransactionStatus.PENDING_L2).build();
        when(transactionRepository.findByTransactionRefNo("TXN-123")).thenReturn(Optional.of(tx));
        
        doReturn(Collections.singleton(new SimpleGrantedAuthority("ROLE_CORP_APPROVER_L2"))).when(authentication).getAuthorities();

        ResponseEntity<String> response = transactionController.approvePayment("TXN-123", "L2-001", "MAKER-001", authentication);
        
        assertThat(response.getStatusCodeValue()).isEqualTo(200);
        assertThat(tx.getStatus()).isEqualTo(TransactionStatus.PENDING_FINAL_AUTHORIZATION);
    }
}
