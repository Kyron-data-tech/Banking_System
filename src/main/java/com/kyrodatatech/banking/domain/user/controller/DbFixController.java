package com.kyrodatatech.banking.domain.user.controller;

import com.kyrodatatech.banking.domain.user.entity.User;
import com.kyrodatatech.banking.domain.user.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/db-fix")
public class DbFixController {
    private final UserRepository userRepository;

    public DbFixController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/fix")
    public String fixUsers() {
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if (u.getEmail().equals("mjstyle65@gmail.com")) {
                u.setUpiId("mjstyle65@okkyro");
                u.setMpin("123456");
            } else if (u.getEmail().equals("vanshj7818@gmail.com")) {
                u.setUpiId("vanshj7818@okkyro");
                u.setMpin("123456");
            } else if (u.getEmail().equals("mjstyle65@okkyro")) {
                u.setEmail("mjstyle65_duplicate@gmail.com");
                u.setUpiId(null);
            } else if (u.getEmail().equals("vanshj7818@okkyro")) {
                u.setEmail("vanshj7818_duplicate@gmail.com");
                u.setUpiId(null);
            }
            userRepository.save(u);
        }
        return "Fixed!";
    }
}
