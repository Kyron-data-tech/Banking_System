package com.kyrodatatech.banking.domain.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RBACSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(username = "maker", roles = {"CORP_MAKER"})
    public void makerCannotAccessExceptions() throws Exception {
        mockMvc.perform(get("/api/exceptions/open"))
               .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "compliance", roles = {"COMPLIANCE_OFFICER"})
    public void complianceCanAccessExceptions() throws Exception {
        mockMvc.perform(get("/api/exceptions/open"))
               .andExpect(status().isOk());
    }
}
