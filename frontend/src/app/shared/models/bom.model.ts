/**
 * BOM (Bill of Materials) Models - Must match backend BomDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { BomCheckStatusType } from '../constants/status.constants';

/**
 * Matches: BomDTO.BomRequirement
 */
export interface BomRequirement {
  bomId: number;
  productSku: string;
  materialId: string;
  materialName: string;
  quantityRequired: number;
  unit: string;
  yieldLossRatio?: number;
  sequenceLevel: number;
}

/**
 * Matches: BomDTO.BomValidationRequest
 */
export interface BomValidationRequest {
  productSku: string;
  targetQuantity: number;
  materialsConsumed: BomMaterialConsumption[];
}

/**
 * Matches: BomDTO.MaterialConsumption
 */
export interface BomMaterialConsumption {
  materialId: string;
  quantity: number;
}

/**
 * Matches: BomDTO.BomValidationResult
 */
export interface BomValidationResult {
  valid: boolean;
  productSku: string;
  requirementChecks: RequirementCheck[];
  warnings: string[];
  errors: string[];
}

/**
 * Matches: BomDTO.RequirementCheck
 */
export interface RequirementCheck {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  actualQuantity: number;
  variancePercent: number;
  status: BomCheckStatusType;
}

/**
 * Matches: BomDTO.BomTreeResponse
 */
export interface BomTreeResponse {
  productSku: string;
  requirements: BomRequirement[];
  levels: number[];
}

/**
 * Matches: BomDTO.SuggestedConsumptionResponse
 */
export interface SuggestedConsumptionResponse {
  operationId: number;
  operationName: string;
  productSku: string;
  targetQuantity: number;
  suggestedMaterials: SuggestedMaterial[];
  totalRequiredQuantity: number;
}

/**
 * Matches: BomDTO.SuggestedMaterial
 */
export interface SuggestedMaterial {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  yieldLossRatio: number;
  availableQuantity: number;
  availableBatches: AvailableBatch[];
  sufficientStock: boolean;
}

/**
 * Matches: BomDTO.AvailableBatch
 */
export interface AvailableBatch {
  inventoryId: number;
  batchId?: number;
  batchNumber?: string;
  availableQuantity: number;
  suggestedConsumption: number;
  location?: string;
}

// =====================================================
// BOM Tree CRUD Models (NEW)
// =====================================================

/**
 * Matches: BomDTO.BomTreeNode
 * Hierarchical tree node with children
 */
export interface BomTreeNode {
  bomId: number;
  productSku: string;
  bomVersion: string;
  materialId: string;
  materialName: string;
  quantityRequired: number;
  unit: string;
  yieldLossRatio?: number;
  sequenceLevel: number;
  parentBomId?: number;
  status: string;
  children: BomTreeNode[];
}

/**
 * Matches: BomDTO.BomTreeFullResponse
 * Full tree response with metadata
 */
export interface BomTreeFullResponse {
  productSku: string;
  bomVersion: string;
  tree: BomTreeNode[];
  totalNodes: number;
  maxDepth: number;
}

/**
 * Matches: BomDTO.CreateBomNodeRequest
 */
export interface CreateBomNodeRequest {
  productSku: string;
  bomVersion?: string;
  materialId: string;
  materialName: string;
  quantityRequired: number;
  unit: string;
  yieldLossRatio?: number;
  sequenceLevel?: number;
  parentBomId?: number;
}

/**
 * Matches: BomDTO.CreateBomTreeRequest
 */
export interface CreateBomTreeRequest {
  productSku: string;
  bomVersion?: string;
  nodes: CreateBomNodeRequest[];
}

/**
 * Matches: BomDTO.UpdateBomNodeRequest
 */
export interface UpdateBomNodeRequest {
  materialId?: string;
  materialName?: string;
  quantityRequired?: number;
  unit?: string;
  yieldLossRatio?: number;
  sequenceLevel?: number;
  parentBomId?: number;
  status?: string;
}

/**
 * Matches: BomDTO.MoveBomNodeRequest
 */
export interface MoveBomNodeRequest {
  newParentBomId?: number;
  newSequenceLevel?: number;
}

/**
 * Matches: BomDTO.BomListResponse
 * Flat list for table view
 */
export interface BomListResponse {
  bomId: number;
  productSku: string;
  bomVersion: string;
  materialId: string;
  materialName: string;
  quantityRequired: number;
  unit: string;
  sequenceLevel: number;
  parentBomId?: number;
  status: string;
  childCount: number;
}

/**
 * Matches: BomDTO.BomProductSummary
 */
export interface BomProductSummary {
  productSku: string;
  bomVersion: string;
  totalNodes: number;
  maxLevel: number;
  status: string;
}

/**
 * Matches: BomDTO.UpdateBomSettingsRequest
 */
export interface UpdateBomSettingsRequest {
  newProductSku?: string;
  bomVersion?: string;
  status?: string;
}

/**
 * Matches: BomDTO.UpdateBomSettingsResponse
 */
export interface UpdateBomSettingsResponse {
  productSku: string;
  bomVersion: string;
  status: string;
  nodesUpdated: number;
}
