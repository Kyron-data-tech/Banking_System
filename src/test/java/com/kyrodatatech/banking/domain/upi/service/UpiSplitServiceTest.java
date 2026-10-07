package com.kyrodatatech.banking.domain.upi.service;

import com.kyrodatatech.banking.domain.upi.entity.UpiParentTransaction;
import com.kyrodatatech.banking.domain.upi.entity.UpiTransactionPacket;
import com.kyrodatatech.banking.domain.upi.repository.UpiParentTransactionRepository;
import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.repository.UserRepository;
import com.kyrodatatech.banking.domain.llm.LlmRiskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UpiSplitServiceTest {

    @Mock
    private UpiParentTransactionRepository upiParentTransactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LlmRiskService llmRiskService;

    @InjectMocks
    private UpiSplitService upiSplitService;

    private User sender;

    @BeforeEach
    void setUp() {
        sender = User.builder()
                .id(java.util.UUID.randomUUID())
                .email("sender@example.com")
                .upiId("sender@kyro")
                .mpin("123456")
                .build();
    }

    @Test
    void onboardUser_Success() {
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByUpiId("new@kyro")).thenReturn(Optional.empty());
        
        User mockSaved = User.builder()
                .id(java.util.UUID.randomUUID())
                .email("new@example.com")
                .upiId("new@kyro")
                .mpin("111111")
                .build();
                
        when(userRepository.save(any(User.class))).thenReturn(mockSaved);

        User result = upiSplitService.onboardUser("new@example.com", "new@kyro", "111111");

        assertNotNull(result);
        assertEquals("new@kyro", result.getUpiId());
        assertEquals("111111", result.getMpin());
    }

    @Test
    void onboardUser_UpiIdAlreadyTaken() {
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        
        User existingUser = User.builder().id(java.util.UUID.randomUUID()).upiId("taken@kyro").build();
        when(userRepository.findByUpiId("taken@kyro")).thenReturn(Optional.of(existingUser));
        
        User tempNewUser = User.builder().id(java.util.UUID.randomUUID()).email("new@example.com").build();
        when(userRepository.save(any(User.class))).thenReturn(tempNewUser);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            upiSplitService.onboardUser("new@example.com", "taken@kyro", "111111");
        });

        assertEquals("UPI ID already taken", exception.getMessage());
    }

    @Test
    void initiateOptimizedTransfer_Success_SinglePacket() {
        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(llmRiskService.evaluateTransactionRisk(anyString(), anyString(), anyDouble(), anyString()))
                .thenReturn("LOW");
        
        when(upiParentTransactionRepository.save(any(UpiParentTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpiParentTransaction result = upiSplitService.initiateOptimizedTransfer(
                "sender@example.com", "receiver@kyro", new BigDecimal("1500.00"), "123456");

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        assertEquals(new BigDecimal("1500.00"), result.getTotalAmount());
        assertEquals(1, result.getPackets().size());
        assertEquals(new BigDecimal("1500.00"), result.getPackets().get(0).getAmount());
    }

    @Test
    void initiateOptimizedTransfer_Success_SplitPackets() {
        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(llmRiskService.evaluateTransactionRisk(anyString(), anyString(), anyDouble(), anyString()))
                .thenReturn("LOW");
                
        when(upiParentTransactionRepository.save(any(UpiParentTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpiParentTransaction result = upiSplitService.initiateOptimizedTransfer(
                "sender@example.com", "receiver@kyro", new BigDecimal("4500.00"), "123456");

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        assertEquals(new BigDecimal("4500.00"), result.getTotalAmount());
        
        // Should split into: 1999.00, 1999.00, 502.00
        assertEquals(3, result.getPackets().size());
        assertEquals(new BigDecimal("1999.00"), result.getPackets().get(0).getAmount());
        assertEquals(new BigDecimal("1999.00"), result.getPackets().get(1).getAmount());
        assertEquals(new BigDecimal("502.00"), result.getPackets().get(2).getAmount());
    }

    @Test
    void initiateOptimizedTransfer_InvalidMpin() {
        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            upiSplitService.initiateOptimizedTransfer(
                    "sender@example.com", "receiver@kyro", new BigDecimal("1000.00"), "WRONG");
        });

        assertEquals("INVALID_MPIN", exception.getMessage());
    }

    @Test
    void initiateOptimizedTransfer_RiskRejected() {
        when(userRepository.findByEmail("sender@example.com")).thenReturn(Optional.of(sender));
        when(llmRiskService.evaluateTransactionRisk(anyString(), anyString(), anyDouble(), anyString()))
                .thenReturn("HIGH");

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            upiSplitService.initiateOptimizedTransfer(
                    "sender@example.com", "receiver@kyro", new BigDecimal("1000000.00"), "123456");
        });

        assertEquals("NPCI-U16: Risk Threshold Exceeded", exception.getMessage());
    }
}
