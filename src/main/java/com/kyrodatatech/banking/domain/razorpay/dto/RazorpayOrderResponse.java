package com.kyrodatatech.banking.domain.razorpay.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderResponse {
    private String orderId;
    private BigDecimal amount;
    private Long amountInPaise;
    private String currency;
    private String keyId;
    private String companyName;
    private String userEmail;
    private String purpose;
    private String receiverId;
}
