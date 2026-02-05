package com.mes.production;

import com.mes.production.config.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class MesProductionApplicationTests {

    @Test
    void contextLoads() {
        // Verify that the Spring context loads successfully
    }
}
