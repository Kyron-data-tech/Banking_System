package com.kyrodatatech.banking.domain.user;

import com.kyrodatatech.banking.domain.user.entity.MakerCheckerRequest;
import com.kyrodatatech.banking.domain.user.enums.ApprovalStatus;
import com.kyrodatatech.banking.domain.user.service.MakerCheckerService;
import com.kyrodatatech.banking.exception.AppException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.test.context.support.WithMockUser;
import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;

@SpringBootTest
@ActiveProfiles("test")
public class MakerCheckerWorkflowTest {

    @Autowired
    private MakerCheckerService makerCheckerService;

    @Test
    @WithMockUser(username = "checker", roles = {"CORP_CHECKER"})
    public void testSelfApprovalForbidden() {
        UUID makerId = UUID.randomUUID();
        MakerCheckerRequest request = makerCheckerService.createRequest("DUMMY_ACTION", UUID.randomUUID(), makerId, "Maker", "{}", "remarks");
        
        AppException ex = assertThrows(AppException.class, () -> {
            makerCheckerService.approve(request.getId(), makerId, "Maker as Checker", "Self approving");
        });
        
        assertTrue(ex.getMessage().contains("cannot approve their own request"));
    }
}
