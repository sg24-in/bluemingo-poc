/**
 * Process Models - Runtime process per MES Consolidated Specification
 *
 * Process entity (per spec):
 * - ProcessID (PK)
 * - ProcessName
 * - Status (READY / IN_PROGRESS / QUALITY_PENDING / COMPLETED / REJECTED / ON_HOLD)
 *
 * Relationship: Orders → OrderLineItems → Processes → Operations
 */

import { OperationBrief } from './operation.model';

// Process status types
export type ProcessStatusType = 'READY' | 'IN_PROGRESS' | 'QUALITY_PENDING' | 'COMPLETED' | 'REJECTED' | 'ON_HOLD';
export type ProcessDecisionType = 'PENDING' | 'ACCEPT' | 'REJECT';

/**
 * Process - Runtime process entity
 * Matches backend Process entity
 */
export interface Process {
  processId: number;
  orderLineId?: number;
  processName: string;
  stageSequence: number;
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
  stageSequence: number;
  status: ProcessStatusType;
  operations?: OperationBrief[];
}

// Backward compatibility aliases (deprecated - use Process instead)
/** @deprecated Use Process instead */
export type ProcessInstance = Process;
/** @deprecated Use ProcessStatusUpdateRequest instead */
export type ProcessInstanceStatusUpdateRequest = ProcessStatusUpdateRequest;
/** @deprecated Use ProcessQualityDecisionRequest instead */
export type ProcessInstanceQualityDecisionRequest = ProcessQualityDecisionRequest;
/** @deprecated Use ProcessStatusUpdateResponse instead */
export type ProcessInstanceStatusUpdateResponse = ProcessStatusUpdateResponse;
/** @deprecated Use ProcessSummary instead */
export type ProcessInstanceSummary = ProcessSummary;
