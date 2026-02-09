/**
 * Shared Models Index - POC
 * Export all model interfaces from a single location.
 */

// Dashboard
export * from './dashboard.model';

// Core Entities
export * from './batch.model';
export * from './inventory.model';
export * from './equipment.model';
export * from './operation.model';
export * from './process.model';
export * from './order.model';
export * from './hold.model';
export * from './production.model';
export * from './bom.model';
export * from './pagination.model';
export * from './batch-allocation.model';

// Master Data (read-only lookups for POC)
export * from './customer.model';
export * from './material.model';
export * from './product.model';
export * from './operator.model';
export * from './config.model';
