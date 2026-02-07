/**
 * Process Models - Design-time process template per MES Consolidated Specification
 *
 * Process is a DESIGN-TIME entity only with statuses: DRAFT, ACTIVE, INACTIVE
 * Runtime execution tracking happens at Operation level (linked to OrderLineItem)
 */

import { OperationBrief } from './operation.model';

// Design-time status types for Process templates
export type ProcessStatusType = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

/**
 * Process - Design-time process template
 */
export interface Process {
  processId: number;
  processName: string;
  status: ProcessStatusType;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  operations?: OperationBrief[];
}

/**
 * Process create request
 */
export interface ProcessCreateRequest {
  processName: string;
  status?: ProcessStatusType;  // Defaults to DRAFT
}

/**
 * Process update request
 */
export interface ProcessUpdateRequest {
  processName?: string;
  status?: ProcessStatusType;
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
