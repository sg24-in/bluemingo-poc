/**
 * Status Constants - Single source of truth for all status/state values.
 * These MUST match exactly with backend entity constants.
 * See CONVENTIONS.md for authoritative documentation.
 */

// Operation Status
export const OperationStatus = {
  NOT_STARTED: 'NOT_STARTED',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  PARTIALLY_CONFIRMED: 'PARTIALLY_CONFIRMED',
  CONFIRMED: 'CONFIRMED',
  ON_HOLD: 'ON_HOLD',
  BLOCKED: 'BLOCKED'
} as const;
export type OperationStatusType = typeof OperationStatus[keyof typeof OperationStatus];

// Process Instance Status (runtime)
export const ProcessInstanceStatus = {
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  QUALITY_PENDING: 'QUALITY_PENDING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  ON_HOLD: 'ON_HOLD'
} as const;
export type ProcessInstanceStatusType = typeof ProcessInstanceStatus[keyof typeof ProcessInstanceStatus];

// Backward compatibility alias
export const ProcessStatus = ProcessInstanceStatus;
export type ProcessStatusType = ProcessInstanceStatusType;

// Process Quality Decision
export const ProcessDecision = {
  PENDING: 'PENDING',
  ACCEPT: 'ACCEPT',
  REJECT: 'REJECT'
} as const;
export type ProcessDecisionType = typeof ProcessDecision[keyof typeof ProcessDecision];

// Inventory State
export const InventoryState = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  CONSUMED: 'CONSUMED',
  PRODUCED: 'PRODUCED',
  BLOCKED: 'BLOCKED',
  SCRAPPED: 'SCRAPPED',
  ON_HOLD: 'ON_HOLD'
} as const;
export type InventoryStateType = typeof InventoryState[keyof typeof InventoryState];

// Batch Status
export const BatchStatus = {
  PRODUCED: 'PRODUCED',
  AVAILABLE: 'AVAILABLE',
  CONSUMED: 'CONSUMED',
  BLOCKED: 'BLOCKED',
  SCRAPPED: 'SCRAPPED',
  QUALITY_PENDING: 'QUALITY_PENDING',
  MERGED: 'MERGED',
  SPLIT: 'SPLIT'
} as const;
export type BatchStatusType = typeof BatchStatus[keyof typeof BatchStatus];

// Equipment Status
export const EquipmentStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  ON_HOLD: 'ON_HOLD',
  UNAVAILABLE: 'UNAVAILABLE'
} as const;
export type EquipmentStatusType = typeof EquipmentStatus[keyof typeof EquipmentStatus];

// Production Confirmation Status
export const ProductionConfirmationStatus = {
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  PARTIALLY_CONFIRMED: 'PARTIALLY_CONFIRMED',
  PENDING_REVIEW: 'PENDING_REVIEW'
} as const;
export type ProductionConfirmationStatusType = typeof ProductionConfirmationStatus[keyof typeof ProductionConfirmationStatus];

// Order Status
export const OrderStatus = {
  CREATED: 'CREATED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD'
} as const;
export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Order Line Item Status
export const OrderLineStatus = {
  CREATED: 'CREATED',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
  ON_HOLD: 'ON_HOLD'
} as const;
export type OrderLineStatusType = typeof OrderLineStatus[keyof typeof OrderLineStatus];

// Hold Status
export const HoldStatus = {
  ACTIVE: 'ACTIVE',
  RELEASED: 'RELEASED'
} as const;
export type HoldStatusType = typeof HoldStatus[keyof typeof HoldStatus];

// Inventory Movement Type
export const InventoryMovementType = {
  CONSUME: 'CONSUME',
  PRODUCE: 'PRODUCE',
  HOLD: 'HOLD',
  RELEASE: 'RELEASE',
  SCRAP: 'SCRAP'
} as const;
export type InventoryMovementTypeValue = typeof InventoryMovementType[keyof typeof InventoryMovementType];

// Audit Actions
export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  CONSUME: 'CONSUME',
  PRODUCE: 'PRODUCE',
  HOLD: 'HOLD',
  RELEASE: 'RELEASE'
} as const;
export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

// Entity Types (for Holds and Audit)
export const EntityType = {
  OPERATION: 'OPERATION',
  PROCESS: 'PROCESS',
  PROCESS_INSTANCE: 'PROCESS_INSTANCE',
  ORDER: 'ORDER',
  ORDER_LINE: 'ORDER_LINE',
  INVENTORY: 'INVENTORY',
  BATCH: 'BATCH',
  BATCH_RELATION: 'BATCH_RELATION',
  PRODUCTION_CONFIRMATION: 'PRODUCTION_CONFIRMATION',
  EQUIPMENT: 'EQUIPMENT'
} as const;
export type EntityTypeValue = typeof EntityType[keyof typeof EntityType];

// Routing Type
export const RoutingType = {
  SEQUENTIAL: 'SEQUENTIAL',
  PARALLEL: 'PARALLEL'
} as const;
export type RoutingTypeValue = typeof RoutingType[keyof typeof RoutingType];

// BOM Requirement Check Status
export const BomCheckStatus = {
  MET: 'MET',
  WARNING: 'WARNING',
  INSUFFICIENT: 'INSUFFICIENT'
} as const;
export type BomCheckStatusType = typeof BomCheckStatus[keyof typeof BomCheckStatus];
