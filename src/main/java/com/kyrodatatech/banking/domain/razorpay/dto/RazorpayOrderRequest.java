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
public class RazorpayOrderRequest {
    private BigDecimal amount;
    private String userEmail;
    private String purpose; // "ADD_FUNDS" or "PAY_MERCHANT"
    private String receiverId;
    private String notes;
}
