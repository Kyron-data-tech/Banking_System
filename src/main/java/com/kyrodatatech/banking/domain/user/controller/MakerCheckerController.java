package com.kyrodatatech.banking.domain.user.controller;

import com.kyrodatatech.banking.domain.user.entity.MakerCheckerRequest;
import com.kyrodatatech.banking.domain.user.service.MakerCheckerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * ================================================================
 * MakerCheckerController — Approval Workflow REST Endpoints
 * ================================================================
 *
 * BASE URL: /api/maker-checker
 *
 * ENDPOINTS:
 * ─────────────────────────────────────────────────────────────
 *  GET  /api/maker-checker/pending          → Get all PENDING requests
 *  GET  /api/maker-checker/{id}             → Get request by ID
 *  GET  /api/maker-checker/my-requests      → Get my submitted requests
 *  POST /api/maker-checker/{id}/approve     → Approve a request
 *  POST /api/maker-checker/{id}/reject      → Reject a request
 * ─────────────────────────────────────────────────────────────
 *
 * WHO CAN ACCESS:
 * - BANK_SUPER_ADMIN — Full access to all requests
 * - BANK_USER_ADMIN — Creates user requests (Maker role)
 * - CORP_ADMIN — Views and approves corporate requests
 * - CORP_CHECKER — Approves/rejects corporate transactions
 */
@RestController
@RequestMapping("/api/maker-checker")
@RequiredArgsConstructor
@Tag(name = "Maker-Checker Workflow",
     description = "4-eyes approval workflow for user creation, modifications, and transactions")
public class MakerCheckerController {

    private final MakerCheckerService makerCheckerService;

    /**
     * GET all PENDING approval requests.
     * Used by CHECKERs to see what needs their action.
     *
     * @PreAuthorize — Only users with CHECKER or ADMIN roles can see pending requests
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('BANK_SUPER_ADMIN', 'BANK_USER_ADMIN', 'PAYMENT_OPERATIONS', 'COMPLIANCE_OFFICER', 'AML_SANCTIONS_REVIEWER', 'RISK_OFFICER', " +
                             "'CORP_ADMIN', 'CORP_CHECKER', 'CORP_APPROVER_L1', " +
                             "'CORP_APPROVER_L2', 'CORP_FINAL_AUTHORIZER')")
    @Operation(summary = "Get pending requests",
               description = "Returns all PENDING approval requests. Only Checkers and Admins can view this.")
    public ResponseEntity<List<MakerCheckerRequest>> getPendingRequests() {
        List<MakerCheckerRequest> pending = makerCheckerService.getAllPendingRequests();
        return ResponseEntity.ok(pending);
    }

    /**
     * GET a specific approval request by ID.
     */
    @GetMapping("/{requestId}")
    @PreAuthorize("hasAnyRole('BANK_SUPER_ADMIN', 'BANK_USER_ADMIN', " +
                             "'CORP_ADMIN', 'CORP_CHECKER')")
    @Operation(summary = "Get request by ID")
    public ResponseEntity<MakerCheckerRequest> getRequest(
            @PathVariable UUID requestId) {
        return ResponseEntity.ok(makerCheckerService.getRequest(requestId));
    }

    /**
     * GET all requests submitted by the currently logged-in MAKER.
     * Makers can see the status of their own requests.
     */
    @GetMapping("/my-requests")
    @Operation(summary = "Get my submitted requests",
               description = "Returns all requests submitted by the currently logged-in user (Maker view).")
    public ResponseEntity<List<MakerCheckerRequest>> getMyRequests(Authentication authentication) {
        // Get the currently logged-in user's ID
        // We cast to our User entity which implements UserDetails
        com.kyrodatatech.banking.domain.user.entity.User currentUser =
                (com.kyrodatatech.banking.domain.user.entity.User) authentication.getPrincipal();

        List<MakerCheckerRequest> myRequests =
                makerCheckerService.getRequestsByMaker(currentUser.getId());
        return ResponseEntity.ok(myRequests);
    }

    /**
     * APPROVE a pending request.
     *
     * POST /api/maker-checker/{requestId}/approve
     * Body: { "comments": "Verified with HR — approved" }
     *
     * ENFORCED: Checker cannot approve their own request (handled in service).
     */
    @PostMapping("/{requestId}/approve")
    @PreAuthorize("hasAnyRole('BANK_SUPER_ADMIN', 'BANK_USER_ADMIN', 'PAYMENT_OPERATIONS', 'COMPLIANCE_OFFICER', 'AML_SANCTIONS_REVIEWER', 'RISK_OFFICER', " +
                             "'CORP_CHECKER', 'CORP_APPROVER_L1', " +
                             "'CORP_APPROVER_L2', 'CORP_FINAL_AUTHORIZER', 'CORP_ADMIN')")
    @Operation(
        summary = "Approve a request",
        description = "Approves a pending maker-checker request. Self-approval is not allowed."
    )
    public ResponseEntity<MakerCheckerRequest> approve(
            @PathVariable UUID requestId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        com.kyrodatatech.banking.domain.user.entity.User checker =
                (com.kyrodatatech.banking.domain.user.entity.User) authentication.getPrincipal();

        String comments = body != null ? body.getOrDefault("comments", "") : "";

        MakerCheckerRequest approved = makerCheckerService.approve(
                requestId,
                checker.getId(),
                checker.getFullName(),
                comments
        );

        return ResponseEntity.ok(approved);
    }

    /**
     * REJECT a pending request.
     *
     * POST /api/maker-checker/{requestId}/reject
     * Body: { "rejectionReason": "Missing required documents" }
     *
     * rejectionReason is MANDATORY on rejection.
     */
    @PostMapping("/{requestId}/reject")
    @PreAuthorize("hasAnyRole('BANK_SUPER_ADMIN', 'BANK_USER_ADMIN', 'PAYMENT_OPERATIONS', 'COMPLIANCE_OFFICER', 'AML_SANCTIONS_REVIEWER', 'RISK_OFFICER', " +
                             "'CORP_CHECKER', 'CORP_APPROVER_L1', " +
                             "'CORP_APPROVER_L2', 'CORP_FINAL_AUTHORIZER', 'CORP_ADMIN')")
    @Operation(
        summary = "Reject a request",
        description = "Rejects a pending maker-checker request with a mandatory rejection reason."
    )
    public ResponseEntity<MakerCheckerRequest> reject(
            @PathVariable UUID requestId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        com.kyrodatatech.banking.domain.user.entity.User checker =
                (com.kyrodatatech.banking.domain.user.entity.User) authentication.getPrincipal();

        String rejectionReason = body.get("rejectionReason");

        MakerCheckerRequest rejected = makerCheckerService.reject(
                requestId,
                checker.getId(),
                checker.getFullName(),
                rejectionReason
        );

        return ResponseEntity.ok(rejected);
    }
}
