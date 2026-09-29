package com.kyrodatatech.banking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * ================================================================
 * CorsConfig — Cross-Origin Resource Sharing Configuration
 * ================================================================
 *
 * CORS is a browser security feature that blocks web pages from making
 * requests to a different domain than the one that served the page.
 *
 * PROBLEM WITHOUT CORS CONFIG:
 *   Frontend: http://localhost:3000 (React/Angular)
 *   Backend:  http://localhost:8080 (This Spring Boot API)
 *   Browser blocks the request! (Different port = different "origin")
 *
 * SOLUTION:
 *   This config tells the browser:
 *   "Our API at port 8080 trusts requests from port 3000"
 *
 * PRODUCTION:
 *   Replace "http://localhost:3000" with your actual frontend domain:
 *   "https://app.kyrobank.com"
 *
 * WHAT WE CONFIGURE:
 * - allowedOrigins: Which frontend URLs can call our API
 * - allowedMethods: Which HTTP methods are allowed (GET, POST, PUT, DELETE, etc.)
 * - allowedHeaders: Which headers can be sent (Authorization for JWT, Content-Type, etc.)
 * - allowCredentials: Whether cookies/auth headers can be sent cross-origin
 */
@Configuration
public class CorsConfig {

    /**
     * Creates a CORS filter that applies to all requests.
     *
     * CORS headers are added to every response:
     * Access-Control-Allow-Origin: http://localhost:3000
     * Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
     * Access-Control-Allow-Headers: *
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Which frontend URLs are allowed to call this API?
        // In production, replace with your actual frontend domain(s)
        config.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",    // React development server
                "http://127.0.0.1:3000",    // React development server via loopback IP
                "http://localhost:4200",    // Angular development server
                "http://localhost:8080",    // Same-origin (Swagger UI)
                "https://app.kyrobank.com" // Production frontend
        ));

        // Which HTTP methods are allowed?
        config.setAllowedMethods(Arrays.asList(
                "GET",     // Read data
                "POST",    // Create data
                "PUT",     // Update (full replace)
                "PATCH",   // Update (partial)
                "DELETE",  // Delete data
                "OPTIONS"  // Pre-flight requests (browser sends this before POST/PUT)
        ));

        // Which request headers are allowed?
        // "*" = all headers. In production, restrict this to specific headers.
        config.setAllowedHeaders(List.of("*"));

        // Allow sending credentials (Authorization header with JWT, cookies)
        // Required for JWT token-based authentication to work
        config.setAllowCredentials(true);

        // How long (in seconds) browsers should cache this CORS config
        // 3600 seconds = 1 hour (reduces pre-flight requests)
        config.setMaxAge(3600L);

        // Apply this CORS config to ALL API paths
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }

    /**
     * Creates a CorsConfigurationSource bean for Spring Security.
     * Spring Security requires this to integrate CORS with its filter chain.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000",
                "http://localhost:4200",
                "http://localhost:8080",
                "https://app.kyrobank.com"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
