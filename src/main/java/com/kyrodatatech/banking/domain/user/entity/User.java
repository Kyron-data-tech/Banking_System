package com.kyrodatatech.banking.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.kyrodatatech.banking.domain.user.enums.UserStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ================================================================
 * User Entity — Core User Model for the Banking System
 * ================================================================
 *
 * This entity represents EVERY user in the system — both bank staff and
 * corporate users. It implements Spring Security's UserDetails interface,
 * which means Spring uses this object for authentication.
 *
 * DATABASE TABLE: 'users'
 *
 * KEY CONCEPTS FOR INTERNS:
 *
 * 1. @Entity   — Tells JPA (Hibernate) this class maps to a database table
 * 2. @Table    — Specifies the exact table name ('users')
 * 3. @Id       — Marks the primary key column
 * 4. @Column   — Maps a Java field to a database column
 * 5. @ManyToMany — One user can have many roles; one role can belong to many users
 *
 * 6. UserDetails interface — Required by Spring Security for authentication.
 *    Spring Security calls getUsername(), getPassword(), getAuthorities()
 *    to verify login credentials.
 *
 * RELATIONSHIPS:
 *   User ←→ Role   (Many-to-Many: user_roles join table)
 *   User → CorporateGroup (Many-to-One: corporate users belong to a group)
 *   User → LegalEntity    (Many-to-One: corporate users belong to a legal entity)
 */
@Entity
@Table(name = "users",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "email"),
           @UniqueConstraint(columnNames = "employee_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    // ---- Primary Key ----

    /**
     * Unique identifier using UUID (Universally Unique Identifier).
     * Using UUID instead of auto-increment integers prevents enumeration attacks
     * (where an attacker guesses sequential IDs like /users/1, /users/2, etc.)
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // ---- Basic Information ----

    /** User's full legal name — used for display and bank records */
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    /**
     * Email address — used as the login username.
     * Must be unique across all users in the system.
     */
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    /**
     * BCrypt-hashed password. We NEVER store plain-text passwords.
     * BCrypt automatically adds a 'salt' to prevent rainbow table attacks.
     * OAuth2 users (Google login) will have null password.
     */
    @Column(name = "password_hash", length = 255)
    private String password;

    /**
     * Employee/Staff ID for bank users.
     * Corporate user reference ID for corporate users.
     * Optional — used for internal HR system integration.
     */
    @Column(name = "employee_id", unique = true, length = 50)
    private String employeeId;

    /** Phone number — for 2FA or OTP notifications */
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "upi_id", unique = true, length = 50)
    private String upiId;

    @Column(name = "mpin", length = 100)
    private String mpin;

    // ---- Role & Status ----

    /**
     * Roles assigned to this user.
     *
     * @ManyToMany — A user can have multiple roles (e.g., MAKER + CHECKER)
     * @JoinTable  — Creates 'user_roles' join table with 'user_id' and 'role_id' columns
     * FetchType.EAGER — Always load roles with the user (needed for auth checks)
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    /**
     * Current status of the user account.
     * Default: PENDING_APPROVAL — must be approved by CHECKER before login.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING_APPROVAL;

    // ---- OAuth2 Support ----

    /**
     * The OAuth2 provider name (e.g., "google", "github").
     * Null for email/password users.
     */
    @Column(name = "oauth2_provider", length = 50)
    private String oauth2Provider;

    /**
     * The unique ID returned by the OAuth2 provider.
     * Used to identify the user on subsequent OAuth2 logins.
     */
    @Column(name = "oauth2_id", length = 255)
    private String oauth2Id;

    // ---- Corporate Hierarchy (for corporate users) ----

    /**
     * The Corporate Group this user belongs to.
     * Null for bank staff users.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corporate_group_id")
    private CorporateGroup corporateGroup;

    /**
     * The specific Legal Entity within the corporate group.
     * Null for bank staff users.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "legal_entity_id")
    private LegalEntity legalEntity;

    // ---- Audit Fields ----

    /** Timestamp when this user record was created */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp of the last update to this user record */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** ID of the Admin MAKER who created this user account */
    @Column(name = "created_by")
    private UUID createdBy;

    /** ID of the Admin CHECKER who approved this user account */
    @Column(name = "approved_by")
    private UUID approvedBy;

    /** When this account was approved by the checker */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /** Last login timestamp — for security monitoring */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // ---- JPA Lifecycle Hooks ----

    /**
     * Called automatically by JPA before INSERT.
     * Sets createdAt timestamp.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Called automatically by JPA before UPDATE.
     * Updates the updatedAt timestamp.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ---- Spring Security UserDetails Implementation ----
    // The methods below are required by Spring Security's UserDetails interface.
    // Spring calls these methods during authentication.

    /**
     * Returns the list of authorities (roles) for this user.
     * Spring Security uses this for @PreAuthorize checks.
     * Format: "ROLE_BANK_SUPER_ADMIN", "ROLE_CORP_MAKER", etc.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleType().name()))
                .collect(Collectors.toSet());
    }

    /**
     * Returns the username used for authentication.
     * In our system, the email address is the username.
     */
    @Override
    public String getUsername() {
        return this.email;
    }

    /**
     * Returns whether the account is not expired.
     * Deactivated accounts are treated as expired.
     */
    @Override
    public boolean isAccountNonExpired() {
        return status != UserStatus.DEACTIVATED;
    }

    /**
     * Returns whether the account is not locked.
     * Suspended accounts are treated as locked.
     */
    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.SUSPENDED;
    }

    /**
     * Returns whether credentials (password) are not expired.
     * Always true in our current implementation.
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * Returns whether the account is enabled.
     * Only ACTIVE accounts can authenticate.
     */
    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}
