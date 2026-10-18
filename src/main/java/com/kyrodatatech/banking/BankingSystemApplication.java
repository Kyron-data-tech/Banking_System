package com.kyrodatatech.banking;

import com.kyrodatatech.banking.domain.user.entity.Role;
import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.enums.RoleType;
import com.kyrodatatech.banking.domain.user.enums.UserStatus;
import com.kyrodatatech.banking.domain.user.repository.RoleRepository;
import com.kyrodatatech.banking.domain.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * ================================================================
 * CMS Finance & Banking System — Application Entry Point
 * ================================================================
 *
 * On startup, creates one demo user per role so any team member
 * can log in and explore the system. All passwords: "password123"
 *
 * Access Swagger UI: http://localhost:8080/swagger-ui.html
 * Frontend Dashboard: http://localhost:3000
 *
 * @author  KyroDataTech Engineering Team
 * @version 1.0.0
 */
import com.kyrodatatech.banking.domain.transaction.entity.Transaction;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionStatus;
import com.kyrodatatech.banking.domain.transaction.enums.TransactionType;
import com.kyrodatatech.banking.domain.transaction.repository.TransactionRepository;
import com.kyrodatatech.banking.domain.user.entity.MakerCheckerRequest;
import com.kyrodatatech.banking.domain.user.enums.ApprovalStatus;
import com.kyrodatatech.banking.domain.user.repository.MakerCheckerRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@SpringBootApplication
public class BankingSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankingSystemApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDemoUsers(
            UserRepository userRepository,
            RoleRepository roleRepository,
            TransactionRepository transactionRepository,
            MakerCheckerRepository makerCheckerRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Seed Roles
            Map<RoleType, Role> roles = new HashMap<>();
            for (RoleType roleType : RoleType.values()) {
                Role role = roleRepository.findByRoleType(roleType)
                    .orElseGet(() -> {
                        Role newRole = new Role();
                        newRole.setRoleType(roleType);
                        return roleRepository.save(newRole);
                    });
                roles.put(roleType, role);
            }

            // 2. Seed Users for ALL 30+ ROLES
            for (RoleType roleType : RoleType.values()) {
                String prefix = roleType.name().toLowerCase().replace("role_", "").replace("_", "");
                String email = prefix.equals("banksuperadmin") ? "admin@kyrobank.com" : prefix + "@kyrobank.com";
                
                if (userRepository.findByEmail(email).isEmpty()) {
                    User user = new User();
                    user.setEmail(email);
                    user.setFullName(roleType.name().replace("_", " "));
                    user.setPassword(passwordEncoder.encode("password123"));
                    user.setStatus(UserStatus.ACTIVE);
                    user.getRoles().add(roles.get(roleType));
                    userRepository.save(user);
                    System.out.println("SEEDED DEMO USER: " + email + " [" + roleType + "]");
                }
            }

            // 3. Seed Realistic Pending Maker-Checker Transactions (Persistent DB with real UUIDs)
            if (makerCheckerRepository.count() == 0) {
                User corpmaker = userRepository.findByEmail("corpmaker@kyrobank.com").orElse(null);
                User bankAdmin = userRepository.findByEmail("admin@kyrobank.com").orElse(null);

                if (corpmaker != null) {
                    // Instruction 1: Tier-1 (<= 1 Lakh -> Approved by Checker)
                    Transaction tx1 = Transaction.builder()
                        .transactionRefNo("TXN-2026-NEFT-884102")
                        .transactionType(TransactionType.NEFT)
                        .amount(new BigDecimal("85000.00"))
                        .currency("INR")
                        .debitAccountNo("AC-CORP-98231")
                        .debitAccountName("Corporate Primary Treasury")
                        .creditAccountNo("AC-DELL-994123")
                        .creditAccountName("Dell Enterprise India")
                        .creditIfscCode("HDFC0001234")
                        .narration("Office Hardware & Server Maintenance Disbursement")
                        .createdBy(corpmaker)
                        .status(TransactionStatus.PENDING_CHECKER)
                        .build();
                    tx1 = transactionRepository.save(tx1);

                    MakerCheckerRequest req1 = MakerCheckerRequest.builder()
                        .actionType("INITIATE_PAYMENT")
                        .entityId(tx1.getId())
                        .entityType("TRANSACTION")
                        .makerId(corpmaker.getId())
                        .makerName(corpmaker.getFullName())
                        .status(ApprovalStatus.PENDING_CHECKER)
                        .priority("MEDIUM")
                        .requestPayload("{\"beneficiary\":\"Dell Enterprise India\",\"amount\":85000,\"type\":\"NEFT\",\"refNo\":\"TXN-2026-NEFT-884102\",\"destinationAccount\":\"AC-DELL-994123\",\"narration\":\"Office Hardware & Server Maintenance Disbursement\"}")
                        .build();
                    req1 = makerCheckerRepository.save(req1);
                    tx1.setMakerCheckerRequestId(req1.getId());
                    transactionRepository.save(tx1);

                    // Instruction 2: Tier-2 (1L - 10L -> Requires L1 & L2 sign-off)
                    Transaction tx2 = Transaction.builder()
                        .transactionRefNo("TXN-2026-RTGS-992314")
                        .transactionType(TransactionType.RTGS)
                        .amount(new BigDecimal("450000.00"))
                        .currency("INR")
                        .debitAccountNo("AC-CORP-98231")
                        .debitAccountName("Corporate Primary Treasury")
                        .creditAccountNo("AC-TATA-332198")
                        .creditAccountName("TATA Power Grid Corp")
                        .creditIfscCode("SBIN0004521")
                        .narration("Quarterly Industrial Power Grid Settlement")
                        .createdBy(corpmaker)
                        .status(TransactionStatus.PENDING_CHECKER)
                        .build();
                    tx2 = transactionRepository.save(tx2);

                    MakerCheckerRequest req2 = MakerCheckerRequest.builder()
                        .actionType("INITIATE_PAYMENT")
                        .entityId(tx2.getId())
                        .entityType("TRANSACTION")
                        .makerId(corpmaker.getId())
                        .makerName(corpmaker.getFullName())
                        .status(ApprovalStatus.PENDING_CHECKER)
                        .priority("HIGH")
                        .requestPayload("{\"beneficiary\":\"TATA Power Grid Corp\",\"amount\":450000,\"type\":\"RTGS\",\"refNo\":\"TXN-2026-RTGS-992314\",\"destinationAccount\":\"AC-TATA-332198\",\"narration\":\"Quarterly Industrial Power Grid Settlement\"}")
                        .build();
                    req2 = makerCheckerRepository.save(req2);
                    tx2.setMakerCheckerRequestId(req2.getId());
                    transactionRepository.save(tx2);

                    // Instruction 3: Tier-3 (> 10L -> Requires Final Authorizer / CFO)
                    Transaction tx3 = Transaction.builder()
                        .transactionRefNo("TXN-2026-IMPS-774129")
                        .transactionType(TransactionType.IMPS)
                        .amount(new BigDecimal("1850000.00"))
                        .currency("INR")
                        .debitAccountNo("AC-CORP-98231")
                        .debitAccountName("Corporate Primary Treasury")
                        .creditAccountNo("AC-INFY-100293")
                        .creditAccountName("Infosys Tech Services - Payroll Escrow")
                        .creditIfscCode("ICIC0000912")
                        .narration("Commercial Payroll Batch #109 (140 Engineering Personnel)")
                        .createdBy(corpmaker)
                        .status(TransactionStatus.PENDING_CHECKER)
                        .build();
                    tx3 = transactionRepository.save(tx3);

                    MakerCheckerRequest req3 = MakerCheckerRequest.builder()
                        .actionType("INITIATE_PAYMENT")
                        .entityId(tx3.getId())
                        .entityType("TRANSACTION")
                        .makerId(corpmaker.getId())
                        .makerName(corpmaker.getFullName())
                        .status(ApprovalStatus.PENDING_CHECKER)
                        .priority("CRITICAL")
                        .requestPayload("{\"beneficiary\":\"Infosys Tech Services - Payroll Escrow\",\"amount\":1850000,\"type\":\"IMPS\",\"refNo\":\"TXN-2026-IMPS-774129\",\"destinationAccount\":\"AC-INFY-100293\",\"narration\":\"Commercial Payroll Batch #109 (140 Engineering Personnel)\"}")
                        .build();
                    req3 = makerCheckerRepository.save(req3);
                    tx3.setMakerCheckerRequestId(req3.getId());
                    transactionRepository.save(tx3);
                }

                if (bankAdmin != null) {
                    MakerCheckerRequest req4 = MakerCheckerRequest.builder()
                        .actionType("CREATE_USER")
                        .entityType("USER")
                        .makerId(bankAdmin.getId())
                        .makerName("Bank Super Admin")
                        .status(ApprovalStatus.PENDING_CHECKER)
                        .priority("LOW")
                        .requestPayload("{\"fullName\":\"Siddharth Verma\",\"email\":\"siddharth.compliance@kyrobank.com\",\"role\":\"ROLE_COMPLIANCE_OFFICER\",\"department\":\"Risk & Compliance\",\"clearance\":\"TIER-3 RISK\"}")
                        .build();
                    makerCheckerRepository.save(req4);
                }
                System.out.println(">>> SEEDED 4 REAL MAKER-CHECKER TRANSACTIONS IN PERSISTENT DATABASE <<<");
            }
        };
    }
}
