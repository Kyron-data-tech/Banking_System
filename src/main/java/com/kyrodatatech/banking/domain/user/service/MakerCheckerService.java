package com.kyrodatatech.banking.domain.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kyrodatatech.banking.domain.audit.service.AuditLogService;
import com.kyrodatatech.banking.domain.user.entity.MakerCheckerRequest;
import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.enums.ApprovalStatus;
import com.kyrodatatech.banking.domain.user.enums.UserStatus;
import com.kyrodatatech.banking.domain.user.repository.MakerCheckerRepository;
import com.kyrodatatech.banking.domain.user.repository.UserRepository;
import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import com.kyrodatatech.banking.domain.transaction.service.TransactionService;
import com.kyrodatatech.banking.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MakerCheckerService {

    private final MakerCheckerRepository makerCheckerRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Transactional
    public MakerCheckerRequest createRequest(String actionType, UUID entityId,
                                             UUID makerId, String makerName,
                                             Object requestPayload, String internalRemarks) {
        String payloadJson = null;
        try {
            if (requestPayload != null) {
                payloadJson = requestPayload instanceof String 
                        ? (String) requestPayload 
                        : objectMapper.writeValueAsString(requestPayload);
            }
        } catch (Exception e) {
            log.error("Failed to serialize maker-checker payload", e);
            payloadJson = "{}";
        }

        MakerCheckerRequest request = MakerCheckerRequest.builder()
                .actionType(actionType)
                .entityId(entityId)
                .makerId(makerId)
                .makerName(makerName)
                .status(ApprovalStatus.PENDING_CHECKER)
                .requestPayload(payloadJson)
                
                .build();

        return makerCheckerRepository.save(request);
    }

    @Transactional
    public MakerCheckerRequest approve(UUID requestId, UUID checkerId, String checkerName, String comments) {
        MakerCheckerRequest request = getRequestOrThrow(requestId);

        if (request.getMakerId().equals(checkerId)) {
            auditLogService.logAction("SELF_APPROVAL_BLOCKED", requestId.toString(), checkerName, null, "Maker attempted to self-approve");
            throw new AppException("A maker cannot approve their own request. Strictly prohibited.", HttpStatus.FORBIDDEN);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isChecker = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CORP_CHECKER"));
        boolean isL1 = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CORP_APPROVER_L1"));
        boolean isL2 = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CORP_APPROVER_L2"));
        boolean isFinal = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CORP_FINAL_AUTHORIZER"));
        boolean isSuperAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_BANK_SUPER_ADMIN"));

        request.setCheckerId(checkerId);
        request.setCheckerName(checkerName);
        request.setCheckerComments(comments);
        request.setActionedAt(LocalDateTime.now());

        if ("INITIATE_PAYMENT".equals(request.getActionType())) {
            Transaction transaction = transactionRepository.findById(request.getEntityId())
                .orElseThrow(() -> new AppException("Transaction not found", HttpStatus.NOT_FOUND));

            double amount = transaction.getAmount().doubleValue();

            if (request.getStatus() == ApprovalStatus.PENDING_CHECKER) {
                if (!isChecker && !isSuperAdmin) throw new AppException("Only CHECKER can approve this tier.", HttpStatus.FORBIDDEN);
                if (amount > 100000) {
                    request.setStatus(ApprovalStatus.PENDING_L1);
                    transaction.setStatus(TransactionStatus.PENDING_L1);
                    auditLogService.logAction("TRANSACTION_APPROVED", transaction.getId().toString(), checkerName, "CHECKER", "Forwarded to L1");
                } else {
                    request.setStatus(ApprovalStatus.APPROVED);
                    transaction.setStatus(TransactionStatus.APPROVED);
                    transactionService.processApprovedTransaction(transaction.getId());
                    auditLogService.logAction("TRANSACTION_APPROVED", transaction.getId().toString(), checkerName, "CHECKER", "Fully Approved");
                }
            } else if (request.getStatus() == ApprovalStatus.PENDING_L1) {
                if (!isL1 && !isSuperAdmin) throw new AppException("Only APPROVER_L1 can approve this tier.", HttpStatus.FORBIDDEN);
                request.setStatus(ApprovalStatus.PENDING_L2);
                transaction.setStatus(TransactionStatus.PENDING_L2);
                auditLogService.logAction("TRANSACTION_APPROVED", transaction.getId().toString(), checkerName, "L1", "Forwarded to L2");
            } else if (request.getStatus() == ApprovalStatus.PENDING_L2) {
                if (!isL2 && !isSuperAdmin) throw new AppException("Only APPROVER_L2 can approve this tier.", HttpStatus.FORBIDDEN);
                if (amount > 1000000) {
                    request.setStatus(ApprovalStatus.PENDING_FINAL_AUTHORIZATION);
                    transaction.setStatus(TransactionStatus.PENDING_FINAL_AUTHORIZATION);
                    auditLogService.logAction("TRANSACTION_APPROVED", transaction.getId().toString(), checkerName, "L2", "Forwarded to FINAL");
                } else {
                    request.setStatus(ApprovalStatus.APPROVED);
                    transaction.setStatus(TransactionStatus.APPROVED);
                    transactionService.processApprovedTransaction(transaction.getId());
                    auditLogService.logAction("TRANSACTION_APPROVED", transaction.getId().toString(), checkerName, "L2", "Fully Approved");
                }
            } else if (request.getStatus() == ApprovalStatus.PENDING_FINAL_AUTHORIZATION) {
                if (!isFinal && !isSuperAdmin) throw new AppException("Only FINAL_AUTHORIZER can approve this tier.", HttpStatus.FORBIDDEN);
                request.setStatus(ApprovalStatus.APPROVED);
                transaction.setStatus(TransactionStatus.APPROVED);
                transactionService.processApprovedTransaction(transaction.getId());
                auditLogService.logAction("TRANSACTION_APPROVED", transaction.getId().toString(), checkerName, "FINAL", "Fully Approved");
            } else {
                throw new AppException("Invalid state for approval.", HttpStatus.BAD_REQUEST);
            }
            transactionRepository.save(transaction);
        } else {
            request.setStatus(ApprovalStatus.APPROVED);
            executeApprovedAction(request);
            auditLogService.logAction("MAKER_CHECKER_APPROVED", requestId.toString(), checkerName, null, "Action: " + request.getActionType());
        }

        return makerCheckerRepository.save(request);
    }

    @Transactional
    public MakerCheckerRequest reject(UUID requestId, UUID checkerId, String checkerName, String rejectionReason) {
        MakerCheckerRequest request = getRequestOrThrow(requestId);

        if (request.getMakerId().equals(checkerId)) {
            auditLogService.logAction("SELF_APPROVAL_BLOCKED", requestId.toString(), checkerName, null, "Maker attempted to self-reject");
            throw new AppException("A maker cannot reject their own request.", HttpStatus.FORBIDDEN);
        }

        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new AppException("Rejection reason is required.", HttpStatus.BAD_REQUEST);
        }

        request.setStatus(ApprovalStatus.REJECTED);
        request.setCheckerId(checkerId);
        request.setCheckerName(checkerName);
        request.setRejectionReason(rejectionReason);
        request.setActionedAt(LocalDateTime.now());

        if ("INITIATE_PAYMENT".equals(request.getActionType())) {
            transactionRepository.findById(request.getEntityId()).ifPresent(transaction -> {
                transaction.setStatus(TransactionStatus.REJECTED);
                transactionRepository.save(transaction);
                auditLogService.logAction("TRANSACTION_REJECTED", transaction.getId().toString(), checkerName, null, "Reason: " + rejectionReason);
            });
        }

        return makerCheckerRepository.save(request);
    }

    public List<MakerCheckerRequest> getAllPendingRequests() {
        return makerCheckerRepository.findAll().stream()
                .filter(r -> r.getStatus() != ApprovalStatus.APPROVED && r.getStatus() != ApprovalStatus.REJECTED && r.getStatus() != ApprovalStatus.CANCELLED)
                .toList();
    }

    public List<MakerCheckerRequest> getRequestsByMaker(UUID makerId) {
        return makerCheckerRepository.findByMakerId(makerId);
    }

    public MakerCheckerRequest getRequest(UUID requestId) {
        return getRequestOrThrow(requestId);
    }

    private MakerCheckerRequest getRequestOrThrow(UUID requestId) {
        return makerCheckerRepository.findById(requestId)
                .orElseThrow(() -> new AppException("Approval request not found with ID: " + requestId, HttpStatus.NOT_FOUND));
    }

    private void executeApprovedAction(MakerCheckerRequest request) {
        switch (request.getActionType()) {
            case "CREATE_USER" -> {
                UUID userId = request.getEntityId();
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new AppException("User not found for approval: " + userId, HttpStatus.NOT_FOUND));
                user.setStatus(UserStatus.ACTIVE);
                user.setApprovedBy(request.getCheckerId());
                user.setApprovedAt(LocalDateTime.now());
                userRepository.save(user);
                log.info("User {} ACTIVATED after checker approval", user.getEmail());
            }
            case "DEACTIVATE_USER" -> {
                UUID userId = request.getEntityId();
                userRepository.findById(userId).ifPresent(user -> {
                    user.setStatus(UserStatus.DEACTIVATED);
                    userRepository.save(user);
                });
            }
            default -> log.warn("Unknown action type in approved request: {}", request.getActionType());
        }
    }
}
