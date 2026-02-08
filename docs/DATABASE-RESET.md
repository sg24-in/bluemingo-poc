# MES Database Reset & Demo Seeding System

This document describes the database reset and demo seeding system for the MES Production Confirmation POC.

## Architecture Rules (NON-NEGOTIABLE)

Before using this system, understand these architectural rules:

| Entity | Type | Linked To | Created When |
|--------|------|-----------|--------------|
| **Process** | TEMPLATE | Nothing (design-time only) | Master data setup |
| **Routing** | TEMPLATE | Process | Master data setup |
| **RoutingStep** | TEMPLATE | Routing | Master data setup |
| **Operation** | RUNTIME | OrderLineItem + Process | Order processing |

**Critical Points:**
- Process = Design-time template only
- Operation = Runtime execution entity
- Operations are auto-generated from RoutingSteps via `OperationInstantiationService`
- Order Line Items link to Process via `process_id` (cached from Product's default process)

## Quick Start

### One-Command Demo Reset

```bash
# Start backend with reset profile enabled
cd backend
./gradlew bootRun --args='--spring.profiles.active=reset'

# Then call the reset API (from another terminal)
curl -X POST http://localhost:8080/api/admin/reset/demo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using the API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/reset/status` | GET | Check if reset is allowed |
| `/api/admin/reset/verify` | GET | Verify database state (row counts) |
| `/api/admin/reset/transactional` | POST | Reset transactional data only |
| `/api/admin/reset/full` | POST | Reset ALL data including master data |
| `/api/admin/reset/demo` | POST | **Full demo reset + reseed + generate operations** |
| `/api/admin/reset/generate-operations` | POST | Generate operations for existing orders |
| `/api/admin/reset/seed` | POST | Seed demo data (generate operations) |
| `/api/admin/reset/history` | GET | Get reset history log |

### Full Demo Reset Workflow

The `/api/admin/reset/demo` endpoint performs these steps:

1. **Delete all data** - Calls `reset_all_data()` stored procedure
2. **Restart application** - Seed patches (034-037) run automatically
3. **Generate operations** - Creates runtime operations from routing templates

### Manual Reset Steps

If you prefer manual control:

```bash
# Step 1: Clear transactional data only (keep master data)
curl -X POST http://localhost:8080/api/admin/reset/transactional

# Step 2: Restart the application to re-run seed patches
./gradlew bootRun --args='--spring.profiles.active=reset'

# Step 3: Generate operations for all orders
curl -X POST http://localhost:8080/api/admin/reset/generate-operations
```

## SQL Patches

The seeding system uses these SQL patches:

| Patch | Purpose | Contents |
|-------|---------|----------|
| `033_database_reset_support.sql` | Reset functions | Stored procedures for safe reset |
| `034_demo_seed_master_data.sql` | Master data | Customers, Materials, Products, Equipment, Operators |
| `035_demo_seed_templates.sql` | Templates | Processes, Routings, RoutingSteps, BOMs |
| `036_demo_seed_transactions.sql` | Transactions | Batches, Inventory, Orders, OrderLineItems |
| `037_product_process_mapping.sql` | Product-Process mapping | Links products to default processes |

## Demo Data Summary

After a full demo reset, the database contains:

| Entity | Count | Notes |
|--------|-------|-------|
| Customers | 10 | Various steel customers |
| Materials | 55+ | 25 RM, 15 IM, 15 FG |
| Products | 25 | Various steel products |
| Processes | 10 | Template processes |
| Routings | 10 | One per process |
| RoutingSteps | ~35 | 2-4 per routing |
| Equipment | 15 | Various equipment types |
| Operators | 12 | Various skill levels |
| Orders | 45 | Various statuses |
| OrderLineItems | 60+ | 1-3 per order |
| Batches | 25+ | RM, IM, FG batches |
| Inventory | 25+ | Linked to batches |
| Operations | ~180 | Generated from routings |

## Safety Features

1. **Production Block**: Reset functions refuse to run if `environment = 'production'`
2. **Profile Check**: Reset endpoints are disabled unless `app.database.reset.enabled = true`
3. **Audit Trail**: All resets are logged to `database_reset_log` table
4. **Idempotent Seeds**: All seed patches use `NOT EXISTS` patterns

## Troubleshooting

### Reset Endpoint Returns 403

Check that you're running with the reset profile:
```bash
./gradlew bootRun --args='--spring.profiles.active=reset'
```

### Operations Not Generated

After seeding orders, you must generate operations:
```bash
curl -X POST http://localhost:8080/api/admin/reset/generate-operations
```

### Verify Database State

Check current row counts:
```bash
curl http://localhost:8080/api/admin/reset/verify
```

Example response:
```json
{
  "customers": 10,
  "materials": 55,
  "products": 25,
  "processes": 10,
  "routings": 10,
  "routingSteps": 35,
  "orders": 45,
  "orderLineItems": 65,
  "operations": 180,
  "batches": 25,
  "inventory": 25,
  "equipment": 15,
  "operators": 12,
  "verified": true
}
```

## E2E Test Preparation

Before running E2E tests:

```bash
# 1. Reset database to clean state
curl -X POST http://localhost:8080/api/admin/reset/demo

# 2. Verify state
curl http://localhost:8080/api/admin/reset/verify

# 3. Run E2E tests
cd e2e && node run-all-tests.js
```

## Configuration Reference

### application.yml
```yaml
app:
  database:
    reset:
      enabled: false  # NEVER set to true in production
```

### application-reset.yml
```yaml
app:
  database:
    reset:
      enabled: true  # Enables reset endpoints
```

## Development Notes

- The `DatabaseResetService` uses `@Transactional` for atomic operations
- The `OperationInstantiationService` creates operations from routing steps
- All seed patches are designed to be idempotent (safe to run multiple times)
- The reset functions temporarily disable triggers for faster deletion

## Related Documentation

- [CLAUDE.md](.claude/CLAUDE.md) - Project context and conventions
- [TASKS.md](.claude/TASKS.md) - Active development tasks
- [DEV-GUIDE.md](docs/DEV-GUIDE.md) - Development setup
