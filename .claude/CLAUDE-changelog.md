# Implementation Changelog

## GAP-004: BOM Suggested Consumption
- Pre-populates material consumption from BOM requirements
- Calculates quantities with yield loss ratios, shows stock availability
- Backend: `BomValidationService.getSuggestedConsumption()`, endpoint `/bom/operation/{id}/suggested-consumption`
- Frontend: Suggested consumption UI section in production-confirm component

## Pagination & Sorting
- Server-side pagination (10/20/50/100), sorting (ASC/DESC), search/filter
- `PagedResponseDTO`, `PageRequestDTO`, `/paged` endpoints on all list resources
- Reusable `PaginationComponent` in SharedModule
- E2E: `e2e/tests/10-pagination.test.js`

## GAP-007: Field-Level Audit Trail
- `FieldChangeAuditService` — auto-compares old vs new entity values
- Logs individual field changes with old/new values
- Methods for ProductionConfirmation, Inventory, Batch, Operation changes

## GAP-005: Configurable Batch Number Generation
- `BatchNumberService` with config table (`batch_number_config`)
- Operation-type and product-specific configurations
- Sequence reset options: DAILY, MONTHLY, YEARLY, NEVER

## GAP-003: Dynamic Process Parameters Validation
- `ProcessParameterService` validates against min/max config
- Frontend real-time validation errors + warnings (within 10% of limits)

## GAP-010: BLOCKED/SCRAPPED Inventory States
- Already implemented in Inventory entity + controller block/unblock/scrap endpoints

## Holds Management UI Fix
- Fixed filter layout (stacked → horizontal flex)
- Added Equipment entity type to hold list

## Demo Video System
- 33-scene comprehensive demo with captions + Google TTS voiceover
- Scripts: `record-comprehensive-demo.js`, `create-synced-voiceover.js`

## P14: MaterialSelectionModalComponent
- Search by batch/material, filter by type, bulk selection, quantity validation
- SharedModule modal for production confirmation

## P15: ApplyHoldModalComponent
- Hold reasons from API, entity info display, success auto-close
- Supports: OPERATION, BATCH, INVENTORY, ORDER, EQUIPMENT
