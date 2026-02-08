/**
 * Production Confirmation Models - Must match backend ProductionConfirmationDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { ProductionConfirmationStatusType } from '../constants/status.constants';

/**
 * Matches: ProductionConfirmationDTO.Request
 */
export interface ProductionConfirmationRequest {
  operationId: number;
  materialsConsumed: MaterialConsumption[];
  producedQty: number;
  scrapQty?: number;
  startTime: string; // LocalDateTime as ISO string
  endTime: string; // LocalDateTime as ISO string
  equipmentIds: number[];
  operatorIds: number[];
  delayMinutes?: number;
  delayReason?: string;
  processParameters?: Record<string, any>;
  notes?: string;
  /**
   * P10-P11: Flag to explicitly save as partial confirmation.
   * When true, the confirmation is saved as PARTIAL even if full quantity is produced.
   * This allows users to continue the confirmation later.
   */
  saveAsPartial?: boolean;
}

/**
 * Matches: ProductionConfirmationDTO.MaterialConsumption
 */
export interface MaterialConsumption {
  batchId: number;
  inventoryId: number;
  quantity: number;
}

/**
 * Matches: ProductionConfirmationDTO.Response
 */
export interface ProductionConfirmationResponse {
  confirmationId: number;
  operationId: number;
  operationName: string;
  producedQty: number;
  scrapQty?: number;
  startTime: string; // LocalDateTime
  endTime: string; // LocalDateTime
  delayMinutes?: number;
  delayReason?: string;
  processParameters?: Record<string, any>;
  notes?: string;
  status: ProductionConfirmationStatusType;
  createdOn: string; // LocalDateTime

  /**
   * P12: Indicates if this is a partial confirmation.
   * True when status is PARTIAL and operation can be continued.
   */
  isPartial?: boolean;

  /**
   * P13: Remaining quantity to be confirmed to complete the operation.
   * Only set for partial confirmations.
   */
  remainingQty?: number;

  // Rejection fields
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedOn?: string; // LocalDateTime

  // Output batch info (primary batch for backward compatibility)
  outputBatch?: BatchInfo;

  // All output batches (for multi-batch production)
  outputBatches?: BatchInfo[];

  // Batch split info (if quantity was split into multiple batches)
  batchCount?: number;
  hasPartialBatch?: boolean;

  // Next operation info
  nextOperation?: NextOperationInfo;

  // Equipment and operator info
  equipment?: EquipmentInfo[];
  operators?: OperatorInfo[];

  // Materials consumed
  materialsConsumed?: MaterialConsumedInfo[];
}

/**
 * Matches: ProductionConfirmationDTO.MaterialConsumedInfo
 */
export interface MaterialConsumedInfo {
  batchId: number;
  batchNumber: string;
  inventoryId: number;
  materialId: string;
  quantityConsumed: number;
}

/**
 * Matches: ProductionConfirmationDTO.EquipmentInfo
 */
export interface EquipmentInfo {
  equipmentId: number;
  equipmentCode: string;
  name: string;
}

/**
 * Matches: ProductionConfirmationDTO.OperatorInfo
 */
export interface OperatorInfo {
  operatorId: number;
  operatorCode: string;
  name: string;
}

/**
 * Matches: ProductionConfirmationDTO.BatchInfo
 */
export interface BatchInfo {
  batchId: number;
  batchNumber: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
}

/**
 * Matches: ProductionConfirmationDTO.NextOperationInfo
 */
export interface NextOperationInfo {
  operationId: number;
  operationName: string;
  status: string;
  processName: string;
}

/**
 * Matches: ProductionConfirmationDTO.RejectionRequest
 */
export interface ProductionRejectionRequest {
  confirmationId: number;
  reason: string;
  notes?: string;
}

/**
 * Matches: ProductionConfirmationDTO.StatusUpdateResponse
 */
export interface ProductionStatusUpdateResponse {
  confirmationId: number;
  previousStatus: string;
  newStatus: string;
  message: string;
  updatedBy: string;
  updatedOn: string; // LocalDateTime
}
