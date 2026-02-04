/**
 * Operation Models - Must match backend OperationDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { OperationStatusType } from '../constants/status.constants';

/**
 * Matches: OperationDTO
 */
export interface Operation {
  operationId: number;
  processId?: number;
  operationName: string;
  operationCode: string;
  operationType: string;
  sequenceNumber: number;
  status: OperationStatusType;
  targetQty?: number;
  confirmedQty?: number;
  // Block info
  blockReason?: string;
  blockedBy?: string;
  blockedOn?: string; // LocalDateTime
  // Additional context
  processName?: string;
  orderNumber?: string;
  productSku?: string;
}

/**
 * Matches: OperationDTO.StatusUpdateResponse
 */
export interface OperationStatusUpdateResponse {
  operationId: number;
  previousStatus: string;
  newStatus: string;
  message: string;
  updatedBy: string;
  updatedOn: string; // LocalDateTime
}

/**
 * Matches: OperationDTO.BlockRequest
 */
export interface OperationBlockRequest {
  operationId: number;
  reason: string;
}

/**
 * Nested operation for order/process context
 * Matches: OrderDTO.OperationDTO
 */
export interface OperationBrief {
  operationId: number;
  operationName: string;
  operationCode: string;
  operationType?: string;
  sequenceNumber: number;
  status: OperationStatusType;
}
