/**
 * Process Models - Must match backend ProcessDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { ProcessStatusType, ProcessDecisionType } from '../constants/status.constants';
import { OperationBrief } from './operation.model';

/**
 * Matches: ProcessDTO.Response
 */
export interface Process {
  processId: number;
  orderLineId?: number;
  stageName: string;
  stageSequence: number;
  status: ProcessStatusType;
  usageDecision?: ProcessDecisionType;
  createdOn?: string; // LocalDateTime
  createdBy?: string;
  updatedOn?: string; // LocalDateTime
  updatedBy?: string;
  operations?: OperationBrief[];
}

/**
 * Matches: ProcessDTO.StatusUpdateRequest
 */
export interface ProcessStatusUpdateRequest {
  processId: number;
  newStatus: string;
  reason?: string;
  notes?: string;
}

/**
 * Matches: ProcessDTO.QualityDecisionRequest
 */
export interface ProcessQualityDecisionRequest {
  processId: number;
  decision: ProcessDecisionType;
  reason?: string;
  notes?: string;
}

/**
 * Matches: ProcessDTO.StatusUpdateResponse
 */
export interface ProcessStatusUpdateResponse {
  processId: number;
  stageName: string;
  previousStatus: string;
  newStatus: string;
  usageDecision?: string;
  updatedBy: string;
  updatedOn: string; // LocalDateTime
  message: string;
}

/**
 * Nested process for order context
 * Matches: OrderDTO.ProcessDTO
 */
export interface ProcessSummary {
  processId: number;
  stageName: string;
  stageSequence: number;
  status: ProcessStatusType;
  operations?: OperationBrief[];
}
