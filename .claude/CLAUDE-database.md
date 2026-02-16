# Database Setup & Schema Management

## PostgreSQL Databases

| Database | Purpose | Created By |
|----------|---------|------------|
| `mes_production` | Production | Manual |
| `mes_test` | Testing | Manual or `run-tests.bat` |

```bash
psql -U postgres -c "CREATE DATABASE mes_production"
psql -U postgres -c "CREATE DATABASE mes_test"
```

## Schema Management

- All schema changes via SQL patches in `backend/src/main/resources/patches/`
- Patches are numbered (001, 002, etc.) and run automatically on startup
- Test mode resets schema (DROP/CREATE public) before running patches
- Tracked in `database_patches` table to prevent re-running

## SQL Patch Conventions (IMPORTANT)

**AVOID in patches:**
- **Dollar-quoted strings (`$$...$$`)** — patch parser can't handle them
- **PL/pgSQL functions** — use Java service classes instead
- **Complex multi-statement procedures** — keep patches simple (DDL/DML only)

**MANDATORY: Every schema change MUST have a SQL patch:**
- Add/modify entity fields, tables, column types → create numbered patch in `patches/`
- **Also update** `demo/schema.sql` with equivalent H2-compatible DDL
- Applies to ALL changes (gap fixes, bug fixes, feature additions)
- Patch numbering: check latest number and increment by 1

**Best practices:**
- Simple DDL: `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`
- Simple DML: `INSERT`, `UPDATE`, `DELETE`
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Standard SQL quoting (single quotes for strings)
- One logical change per patch

## Demo Mode Schema Alignment

Demo mode uses H2 in-memory database — keep in sync with patches:

| File | Purpose | When to Update |
|------|---------|----------------|
| `patches/*.sql` | **Source of truth** | Any schema change |
| `demo/schema.sql` | H2-compatible DDL | After creating a patch |
| `demo/data.sql` | Rich sample data | When patches add new tables |

**When creating a new patch:**
1. Create patch: `patches/NNN_description.sql`
2. Update `demo/schema.sql` with equivalent H2-compatible DDL
3. Update `demo/data.sql` if new tables need sample data

## Entity Model Notes

- **Process** = Design-time entity only (`process_name`, `status`) — NO `order_line_id` FK
- **Operation** = Links to Process via `process_id` AND to OrderLineItem via `order_line_id`

## Verify Both Profiles

```bash
./gradlew bootRun -Dspring.profiles.active=test              # Patches (PostgreSQL)
./gradlew bootRun --args='--spring.profiles.active=demo'      # H2 demo
```

## Database ER Diagram

See `documents/database-schema.puml` for the complete PlantUML diagram of all 42 tables with relationships.
