package com.kyrodatatech.banking.domain.user.repository;

import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByStatus(UserStatus status);
    Optional<User> findByEmployeeId(String employeeId);
    Optional<User> findByUpiId(String upiId);
    Optional<User> findByRupayApiKey(String apiKey);
}
