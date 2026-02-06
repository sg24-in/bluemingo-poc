/**
 * Process Models - Design-time process per MES Consolidated Specification
 *
 * Process entity (per spec):
 * - ProcessID (PK)
 * - ProcessName
 * - Status (READY / IN_PROGRESS / QUALITY_PENDING / COMPLETED / REJECTED / ON_HOLD)
 *
 * Per MES Consolidated Specification:
 * - Process is a design-time entity (no OrderLineItem reference)
 * - Operations link to Process via ProcessID (design-time reference)
 * - Operations link to OrderLineItem via OrderLineID (runtime tracking)
 * - Relationship: Orders → OrderLineItems → Operations (via OrderLineID)
 *                 Process → Operations (via ProcessID - design-time)
 */

import { OperationBrief } from './operation.model';

// Process status types
export type ProcessStatusType = 'READY' | 'IN_PROGRESS' | 'QUALITY_PENDING' | 'COMPLETED' | 'REJECTED' | 'ON_HOLD';
export type ProcessDecisionType = 'PENDING' | 'ACCEPT' | 'REJECT';

/**
 * Process - Design-time process entity
 * Matches backend Process entity
 */
export interface Process {
  processId: number;
  processName: string;
  status: ProcessStatusType;
  usageDecision?: ProcessDecisionType;
  bomId?: number;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  operations?: OperationBrief[];
}

/**
 * Process status update request
 */
export interface ProcessStatusUpdateRequest {
  processId: number;
  newStatus: string;
  reason?: string;
  notes?: string;
}

/**
 * Process quality decision request
 */
export interface ProcessQualityDecisionRequest {
  processId: number;
  decision: ProcessDecisionType;
  reason?: string;
  notes?: string;
}

/**
 * Process status update response
 */
export interface ProcessStatusUpdateResponse {
  processId: number;
  processName: string;
  previousStatus: string;
  newStatus: string;
  usageDecision?: string;
  updatedBy: string;
  updatedOn: string;
  message: string;
}

/**
 * Process summary for nested display
 */
export interface ProcessSummary {
  processId: number;
  processName: string;
  status: ProcessStatusType;
  operations?: OperationBrief[];
}
