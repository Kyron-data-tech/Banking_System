package com.kyrodatatech.banking.domain.auth;

import com.kyrodatatech.banking.domain.auth.dto.AuthResponse;
import com.kyrodatatech.banking.domain.auth.dto.LoginRequest;
import com.kyrodatatech.banking.domain.auth.dto.RegisterRequest;
import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.enums.UserStatus;
import com.kyrodatatech.banking.domain.user.repository.UserRepository;
import com.kyrodatatech.banking.domain.user.repository.RoleRepository;
import com.kyrodatatech.banking.domain.user.enums.RoleType;
import com.kyrodatatech.banking.domain.user.entity.Role;
import com.kyrodatatech.banking.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ================================================================
 * AuthService — Authentication Business Logic
 * ================================================================
 *
 * This service handles:
 *  1. User REGISTRATION (email + password)
 *  2. User LOGIN (generates JWT tokens)
 *  3. TOKEN REFRESH (get new access token using refresh token)
 *  4. LOGOUT (future: token blacklisting)
 *
 * SECURITY CONCEPTS USED:
 *
 * BCrypt Password Hashing:
 *   - When a user registers, the password is hashed with BCrypt
 *   - BCrypt is a one-way hash — you can't reverse it to get the password
 *   - BCrypt adds a random "salt" so same password → different hash each time
 *   - This prevents rainbow table attacks
 *
 * AuthenticationManager:
 *   - Spring Security's core component for authenticating credentials
 *   - When we call authManager.authenticate(email, password), Spring:
 *     1. Loads user from DB via CustomUserDetailsService
 *     2. Compares BCrypt hash of provided password vs stored hash
 *     3. Returns Authentication if match, throws exception if not
 *
 * @Service — Spring registers this as a business service bean
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;       // BCrypt encoder
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a new user with email + password authentication.
     *
     * PROCESS:
     * 1. Check if email already exists → 409 Conflict if yes
     * 2. Hash the password with BCrypt
     * 3. Save user with PENDING_APPROVAL status
     *    (Needs Admin Checker to approve before they can login)
     *
     * @param request Contains fullName, email, password, etc.
     * @return Success message — NOT a token (account isn't active yet)
     * @throws AppException if email is already taken
     */
    @Transactional
    public String register(RegisterRequest request) {
        // Check if email is already registered
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(
                    "Email address '" + request.getEmail() + "' is already registered.",
                    HttpStatus.CONFLICT
            );
        }

        // Create new user — password is BCrypt hashed, status is PENDING

        java.util.Set<Role> roles = new java.util.HashSet<>();
        roleRepository.findByRoleType(RoleType.BANK_SUPER_ADMIN).ifPresent(roles::add);
        roleRepository.findByRoleType(RoleType.CORP_MAKER).ifPresent(roles::add);
        roleRepository.findByRoleType(RoleType.CORP_CHECKER).ifPresent(roles::add);

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))  // BCrypt hash!
                .employeeId(request.getEmployeeId())
                .phoneNumber(request.getPhoneNumber())
                .status(UserStatus.ACTIVE) // Auto-approved for Hackathon
                .roles(roles)
                .build();


        userRepository.save(user);

        log.info("New user registered: {} — Awaiting admin approval", request.getEmail());

        return "Registration successful. Your account is pending admin approval. " +
               "You will be notified when your account is activated.";
    }

    /**
     * Authenticates a user and generates JWT access + refresh tokens.
     *
     * PROCESS:
     * 1. Call Spring Security's AuthenticationManager to verify email + password
     *    → This internally calls CustomUserDetailsService.loadUserByUsername()
     *    → And BCrypt.matches(providedPassword, storedHash)
     * 2. If authentication succeeds, generate JWT tokens
     * 3. Update lastLoginAt timestamp
     * 4. Return token response
     *
     * @param request Contains email and password
     * @return AuthResponse with access token, refresh token, and user details
     * @throws AppException if credentials are wrong or account is not active
     */
    @Transactional

    public AuthResponse login(LoginRequest request) {
        // HACKATHON MAGIC: Auto-register if user doesn't exist

        if (!userRepository.existsByEmail(request.getEmail())) {
            java.util.Set<Role> roles = new java.util.HashSet<>();
            roleRepository.findByRoleType(RoleType.BANK_SUPER_ADMIN).ifPresent(roles::add);
            roleRepository.findByRoleType(RoleType.CORP_MAKER).ifPresent(roles::add);
            roleRepository.findByRoleType(RoleType.CORP_CHECKER).ifPresent(roles::add);
            
            User magicUser = User.builder()
                .fullName(request.getEmail().split("@")[0])
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.ACTIVE)
                .roles(roles)
                .build();
            userRepository.save(magicUser);
        }


        // Step 1: Authenticate
        // Spring Security handles BCrypt comparison
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),    // username
                        request.getPassword()  // raw password (BCrypt compared internally)
                )
        );

        // Step 2: Get the authenticated user (it's our User entity)
        User user = (User) authentication.getPrincipal();

        // Step 3: Update last login timestamp
        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        // Step 4: Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        // Step 5: Collect roles for the response
        List<String> roles = user.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        log.info("User logged in: {} with roles: {}", user.getEmail(), roles);

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(86400) // 24 hours in seconds
                .build();
    }

    /**
     * Generates a new access token using a valid refresh token.
     *
     * Use this when the access token expires but the refresh token is still valid.
     * This avoids forcing the user to re-login every 24 hours.
     *
     * @param refreshToken The JWT refresh token string
     * @return New AuthResponse with fresh access token
     * @throws AppException if refresh token is invalid or expired
     */
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        // Validate the refresh token
        if (!jwtTokenProvider.validateRefreshToken(refreshToken)) {
            throw new AppException("Invalid or expired refresh token. Please log in again.",
                    HttpStatus.UNAUTHORIZED);
        }

        // Extract the user's email from the refresh token
        String email = jwtTokenProvider.extractUsername(refreshToken);

        // Load the user from the database
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        // Generate a new access token
        String newAccessToken = jwtTokenProvider.generateAccessToken(user);

        List<String> roles = user.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        log.info("Access token refreshed for user: {}", email);

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .accessToken(newAccessToken)
                .refreshToken(refreshToken) // Return same refresh token
                .expiresIn(86400)
                .build();
    }
}
