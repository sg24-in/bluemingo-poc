package com.mes.production.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;

/**
 * Resets the PostgreSQL public schema before patches run.
 * Only active when app.test.reset-schema=true (test profile).
 * Uses @Order to ensure this runs BEFORE PatchRunner.
 */
@Configuration
@ConditionalOnProperty(name = "app.test.reset-schema", havingValue = "true")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TestSchemaReset {

    private static final Logger log = LoggerFactory.getLogger(TestSchemaReset.class);

    private final DataSource dataSource;

    public TestSchemaReset(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void resetSchema() {
        log.info("=== TEST MODE: Resetting database schema ===");

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        try {
            // Drop and recreate public schema
            jdbcTemplate.execute("DROP SCHEMA IF EXISTS public CASCADE");
            jdbcTemplate.execute("CREATE SCHEMA public");
            jdbcTemplate.execute("GRANT ALL ON SCHEMA public TO postgres");
            jdbcTemplate.execute("GRANT ALL ON SCHEMA public TO public");

            log.info("Public schema dropped and recreated successfully");
            log.info("Patches will now run to set up the schema...");
        } catch (Exception e) {
            log.error("Failed to reset schema: {}", e.getMessage(), e);
            throw new RuntimeException("Schema reset failed", e);
        }
    }
}
