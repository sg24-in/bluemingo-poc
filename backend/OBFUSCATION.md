# ProGuard Obfuscation for MES Backend

## Overview

This document describes how to build an obfuscated WAR file for the MES Production Confirmation backend.

## Build Commands

### Standard Build (No Obfuscation)
```bash
./gradlew bootWar
```
Output: `build/libs/mes-production.war`

### Obfuscated Build
```bash
./gradlew obfuscatedWar
```
Output: `build/libs/mes-production-obfuscated.war`

## What Gets Obfuscated

### Obfuscated (Internal Implementation)
- Service implementation classes (method bodies, local variables)
- Helper/utility methods
- Business logic internals
- Private methods and fields

### NOT Obfuscated (API Compatibility)
- **Controllers** - All REST endpoints preserved
- **DTOs** - JSON field names preserved for Angular compatibility
- **Entities** - JPA annotations and field names preserved
- **Repositories** - Spring Data interfaces preserved
- **Configuration** - Spring/Security config preserved
- **Annotations** - All reflection metadata preserved

## ProGuard Rules

The `proguard-rules.pro` file contains all keep rules to ensure:
1. Spring Framework annotations work
2. Jackson JSON serialization works
3. JPA/Hibernate mappings work
4. REST API contracts remain unchanged

## Verification Checklist

After building obfuscated WAR:

1. **Tomcat Startup**
   ```bash
   # Deploy to Tomcat webapps folder
   cp build/libs/mes-production-obfuscated.war $TOMCAT_HOME/webapps/mes-production.war
   # Start Tomcat and check logs for errors
   ```

2. **API Contract Validation**
   - Test login: `POST /api/auth/login`
   - Test dashboard: `GET /api/dashboard/stats`
   - Test orders: `GET /api/orders`
   - Verify JSON response structure matches original

3. **Angular Compatibility**
   - Load Angular app
   - Login should work
   - Dashboard should display data
   - All CRUD operations should work

4. **No Runtime Errors**
   - No `ClassNotFoundException`
   - No `NoSuchMethodException`
   - No reflection errors
   - No JSON parsing errors

## Mapping File

After obfuscation, a mapping file is generated at:
```
build/proguard/mapping.txt
```

Keep this file for:
- Debugging production stack traces
- Correlating obfuscated names to original names

## Troubleshooting

### Problem: ClassNotFoundException at startup
**Solution:** Add missing class to `-keep` rules in `proguard-rules.pro`

### Problem: JSON field names changed
**Solution:** Ensure DTO classes are in `-keep` rules with member preservation

### Problem: Spring injection fails
**Solution:** Verify `@Autowired` and `@Inject` annotations are preserved

### Problem: JPA entities not working
**Solution:** Ensure all `@Entity` classes are in keep rules

## Security Notes

- Obfuscation protects intellectual property but is NOT encryption
- Determined attackers can still reverse-engineer obfuscated code
- Use in combination with other security measures
- Do NOT rely on obfuscation for secrets (use environment variables)
