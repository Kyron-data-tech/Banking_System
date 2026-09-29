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
@SpringBootApplication
public class BankingSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankingSystemApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDemoUsers(
            UserRepository userRepository,
            RoleRepository roleRepository,
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
        };
    }
}
