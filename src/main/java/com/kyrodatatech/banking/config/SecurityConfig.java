package com.kyrodatatech.banking.config;

import com.kyrodatatech.banking.domain.auth.CustomUserDetailsService;
import com.kyrodatatech.banking.domain.auth.JwtAuthFilter;
import com.kyrodatatech.banking.domain.auth.oauth2.CustomOAuth2UserService;
import com.kyrodatatech.banking.domain.auth.oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * ================================================================
 * SecurityConfig — The Master Security Configuration
 * ================================================================
 *
 * This is the MOST IMPORTANT configuration class in the application.
 * It defines who can access what, and how authentication works.
 *
 * THREE KEY CONCEPTS:
 *
 * 1. STATELESS SESSION (JWT approach):
 *    Traditional web apps use SESSIONS stored on the server.
 *    REST APIs use STATELESS auth — the server doesn't remember anything.
 *    Every request must carry its own proof of identity (JWT token).
 *    This is more scalable (no session memory) and works well with mobile/SPA.
 *
 * 2. URL-BASED ACCESS CONTROL:
 *    Some URLs are public (login page), some require authentication (dashboard),
 *    and some require specific roles (admin panel needs BANK_SUPER_ADMIN).
 *    We define all these rules in the securityFilterChain() method below.
 *
 * 3. FILTER CHAIN:
 *    Every HTTP request passes through a chain of "filters" before reaching
 *    the controller. We inject JwtAuthFilter into this chain so JWT tokens
 *    are checked before the request is processed.
 *
 * @Configuration  — Marks this as a Spring configuration class
 * @EnableWebSecurity — Activates Spring Security
 * @EnableMethodSecurity — Enables @PreAuthorize annotations in controllers
 *   (so we can write @PreAuthorize("hasRole('BANK_SUPER_ADMIN')") on methods)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Enables @PreAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;
    private final CustomOAuth2UserService oAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    /**
     * The main security filter chain — defines all security rules.
     *
     * This is the heart of Spring Security configuration.
     * Think of it as a security policy document:
     * "Who can access what, and how do we verify identity?"
     *
     * @param http The HttpSecurity builder provided by Spring
     * @return Configured SecurityFilterChain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ---- CSRF Protection ----
            // CSRF (Cross-Site Request Forgery) attacks are a web browser concern.
            // Since our REST API uses JWT tokens (not cookies for auth), CSRF
            // protection is not needed and would break API clients (Postman, mobile).
            .csrf(AbstractHttpConfigurer::disable)

            // ---- CORS (Cross-Origin Resource Sharing) ----
            // Allows our React/Angular frontend (running on a different port/domain)
            // to make requests to this API. Full CORS config is in CorsConfig.java.
            .cors(cors -> cors.configure(http))

            // ---- URL Access Rules ----
            // IMPORTANT: Rules are checked TOP-TO-BOTTOM.
            // The FIRST matching rule wins. Order matters!
            .authorizeHttpRequests(auth -> auth

                // PUBLIC ENDPOINTS — No authentication required
                // Anyone can hit these URLs (login page, health check, Swagger)
                .requestMatchers(
                    "/api/v1/auth/**", "/api/auth/**", "/api/v1/upi/**", "/api/upi/**",           // Login, register, refresh token
                    "/swagger-ui/**",         // Swagger UI HTML/CSS/JS
                    "/swagger-ui.html",       // Swagger UI main page
                    "/v3/api-docs/**",        // OpenAPI JSON spec
                    "/actuator/health",       // Health check (for load balancers)
                    "/login/oauth2/**",       // Google OAuth2 callback URL
                    "/oauth2/**",             // OAuth2 authorization URL
                    "/api/gateway/v1/**",     // RuPay Gateway Sandbox
                    "/api/merchant/keys/generate" // Allow demo key gen for OAuth users
                ).permitAll()

                // BANK ADMIN ONLY endpoints
                .requestMatchers("/api/admin/**")
                    .hasAnyRole("BANK_SUPER_ADMIN", "BANK_USER_ADMIN")

                // MAKER-CHECKER endpoints — Only specific roles
                .requestMatchers("/api/maker-checker/**")
                    .hasAnyRole(
                        "BANK_SUPER_ADMIN", "BANK_USER_ADMIN",   // Bank admins
                        "CORP_ADMIN", "CORP_USER_ADMIN",          // Corp admins
                        "CORP_MAKER", "CORP_CHECKER"              // Maker-Checker roles
                    )

                // PAYMENT endpoints — Operations, Makers, and Approvers
                .requestMatchers("/api/payments/**")
                    .hasAnyRole(
                        "PAYMENT_OPERATIONS", "CORP_MAKER", "CORP_CHECKER",
                        "CORP_APPROVER_L1", "CORP_APPROVER_L2",
                        "CORP_FINAL_AUTHORIZER", "BANK_SUPER_ADMIN"
                    )

                // COLLECTION endpoints
                .requestMatchers("/api/collections/**")
                    .hasAnyRole("COLLECTION_OPERATIONS", "CORP_COLLECTION_USER",
                                "BANK_SUPER_ADMIN", "CORP_ADMIN")

                // RISK & COMPLIANCE endpoints
                .requestMatchers("/api/compliance/**")
                    .hasAnyRole("COMPLIANCE_OFFICER", "AML_SANCTIONS_REVIEWER",
                                "RISK_OFFICER", "BANK_AUDITOR", "BANK_SUPER_ADMIN")

                // LLM endpoints open to all authenticated users for chatbot

                // ALL OTHER ENDPOINTS — Must be authenticated (any valid JWT)
                .anyRequest().authenticated()
            )

            // ---- Session Management ----
            // STATELESS = No HTTP sessions on the server.
            // Every request must include the JWT token.
            // This is required for proper JWT authentication.
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // ---- Authentication Provider ----
            // Tells Spring Security to use our UserDetailsService + BCrypt
            .authenticationProvider(authenticationProvider())

            // ---- OAuth2 Login ----
            // Enables Google "Login with OAuth2" flow
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(endpoint ->
                    endpoint.userService(oAuth2UserService) // Load user from Google response
                )
                .successHandler(oAuth2SuccessHandler) // Generate JWT after OAuth2 success
            )

            // ---- JWT Filter ----
            // Add our JwtAuthFilter BEFORE Spring's default UsernamePasswordAuthenticationFilter.
            // This ensures JWT tokens are validated before any other authentication attempt.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Authentication Provider — Connects UserDetailsService to BCrypt.
     *
     * DaoAuthenticationProvider tells Spring Security:
     * "To verify a user's identity, load them from the DB via UserDetailsService,
     * then compare the password using BCryptPasswordEncoder."
     *
     * @return Configured DaoAuthenticationProvider
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService); // Where to load users from
        provider.setPasswordEncoder(passwordEncoder());       // How to verify passwords
        return provider;
    }

    /**
     * AuthenticationManager — Required by AuthService to authenticate login requests.
     *
     * AuthService.login() calls:
     *   authManager.authenticate(email, password)
     * → AuthManager uses DaoAuthenticationProvider
     * → Which loads user via UserDetailsService
     * → And compares password via BCrypt
     *
     * @param config Spring's authentication configuration
     * @return The AuthenticationManager bean
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Password Encoder — BCrypt.
     *
     * BCrypt is the industry standard for password hashing.
     * Key properties:
     * - ONE-WAY: Cannot reverse the hash to get the password
     * - SALTED: Adds random data before hashing (prevents rainbow table attacks)
     * - ADAPTIVE: Can increase work factor as hardware gets faster
     *
     * Work factor 12 (default) means: 2^12 = 4096 iterations.
     * Takes ~300ms on modern hardware — fast enough for login but
     * too slow for brute-force attacks.
     *
     * @return BCryptPasswordEncoder instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // strength = 12 (scale: 4-31)
    }
}
