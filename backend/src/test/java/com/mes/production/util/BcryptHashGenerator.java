package com.mes.production.util;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptHashGenerator {

    @Test
    public void generateAndVerifyHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "admin123";
        String hash = encoder.encode(password);
        System.out.println("===========================================");
        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash: " + hash);
        System.out.println("===========================================");

        // Verify the hash works
        boolean matches = encoder.matches(password, hash);
        System.out.println("New hash verification: " + (matches ? "SUCCESS" : "FAILED"));

        // Also verify the old hash from seed_data.sql
        String oldHash = "$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqIuH.1Y9CrWKpxJqmvZrFfU1Aq5W";
        boolean oldMatches = encoder.matches(password, oldHash);
        System.out.println("Old hash (from seed_data.sql) verification: " + (oldMatches ? "SUCCESS" : "FAILED"));

        // Verify the hash I used earlier
        String usedHash = "$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6";
        boolean usedMatches = encoder.matches(password, usedHash);
        System.out.println("Used hash verification: " + (usedMatches ? "SUCCESS" : "FAILED"));
    }
}
