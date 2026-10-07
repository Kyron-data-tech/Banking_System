package com.kyrodatatech.banking.domain.upi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
public class TempDbController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/api/temp-fix-upi")
    public String fixUpi() {
        jdbcTemplate.execute("UPDATE users SET upi_id = 'mjstyle65@okaxis' WHERE email = 'mjstyle65@gmail.com'");
        jdbcTemplate.execute("UPDATE users SET upi_id = 'vanshj7818@okaxis' WHERE email = 'vanshj7818@gmail.com'");
        return "Fixed UPI IDs";
    }
}
