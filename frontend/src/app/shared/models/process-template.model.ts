/**
 * ProcessTemplate models for design-time process definitions
 *
 * ProcessTemplate = Design-time template (used by Routing)
 * Process = Runtime entity (linked to OrderLineItem)
 *
 * Per MES Consolidated Specification
 */

export interface ProcessTemplate {
  processTemplateId: number;
  templateName: string;
  templateCode: string;
  description?: string;
  productSku?: string;
  status: ProcessTemplateStatus;
  version: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isEffective?: boolean;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  routingSteps?: RoutingStepTemplate[];
}

export type ProcessTemplateStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUPERSEDED';

export interface ProcessTemplateSummary {
  processTemplateId: number;
  templateName: string;
  templateCode: string;
  productSku?: string;
  status: ProcessTemplateStatus;
  version: string;
  isEffective?: boolean;
  stepCount: number;
  createdOn?: string;
}

export interface RoutingStepTemplate {
  routingStepId?: number;
  sequenceNumber: number;
  operationName: string;
  operationType?: string;
  operationCode?: string;
  description?: string;
  targetQty?: number;
  estimatedDurationMinutes?: number;
  isParallel?: boolean;
  mandatoryFlag?: boolean;
  producesOutputBatch?: boolean;
  allowsSplit?: boolean;
  allowsMerge?: boolean;
  status?: string;
}

export interface CreateProcessTemplateRequest {
  templateName: string;
  templateCode?: string;
  description?: string;
  productSku?: string;
  version?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  routingSteps?: RoutingStepTemplate[];
}

export interface UpdateProcessTemplateRequest {
  templateName?: string;
  description?: string;
  productSku?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface ActivationRequest {
  deactivateOthers?: boolean;
  effectiveFrom?: string;
}

// Routing models - Per MES Consolidated Specification
export interface Routing {
  routingId: number;
  processId?: number;  // Per MES Spec: Routing.ProcessID (FK → Processes)
  routingName: string;
  routingType: RoutingType;
  status: RoutingStatus;
  steps?: RoutingStepInfo[];
  createdOn?: string;
}

export type RoutingType = 'SEQUENTIAL' | 'PARALLEL';
export type RoutingStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';

export interface RoutingStepInfo {
  routingStepId: number;
  routingId: number;
  operationId?: number;
  operationName?: string;
  sequenceNumber: number;
  isParallel?: boolean;
  mandatoryFlag?: boolean;
  status: string;
}

export interface CreateRoutingRequest {
  processId: number;  // Per MES Spec: Routing.ProcessID (FK → Processes)
  routingName: string;
  routingType?: RoutingType;
  activateImmediately?: boolean;
}

export interface UpdateRoutingRequest {
  routingName?: string;
  routingType?: RoutingType;
}

export interface RoutingStatusSummary {
  routingId: number;
  status: RoutingStatus;
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  isComplete: boolean;
  isLocked: boolean;
}

export interface ActivateRoutingRequest {
  deactivateOthers?: boolean;
}

export interface HoldRoutingRequest {
  reason?: string;
}
