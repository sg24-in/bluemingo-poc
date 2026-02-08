/**
 * Batch Models - Must match backend BatchDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

/**
 * Batch Models - Must match backend BatchDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

/**
 * Batch creation source types - matches backend createdVia values
 */
export type BatchCreatedVia = 'PRODUCTION' | 'SPLIT' | 'MERGE' | 'MANUAL' | 'SYSTEM' | 'RECEIPT';

/**
 * Matches: BatchDTO
 * Note: status can include ON_HOLD when batch is put on hold
 */
export interface Batch {
  batchId: number;
  batchNumber: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  state?: string; // Used by UI for filtering
  status: string; // Flexible to allow all batch status values including ON_HOLD
  createdOn: string; // LocalDateTime

  // GAP-020: Traceability fields - Track source operation and creation context
  /**
   * The operation that generated this batch (for PRODUCTION batches)
   */
  generatedAtOperationId?: number;
  /**
   * How this batch was created: PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT
   */
  createdVia?: BatchCreatedVia;

  // Supplier/Receipt info for RM (Raw Material) batches
  /**
   * External supplier batch number reference
   */
  supplierBatchNumber?: string;
  /**
   * Supplier ID for traceability
   */
  supplierId?: string;

  // Approval info
  approvedBy?: string;
  approvedOn?: string; // LocalDateTime
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedOn?: string; // LocalDateTime
}

/**
 * Matches: BatchDTO.Genealogy
 */
export interface BatchGenealogy {
  batch: Batch;
  parentBatches: ParentBatchInfo[];
  childBatches: ChildBatchInfo[];
  productionInfo?: ProductionInfo;
}

/**
 * Matches: BatchDTO.ParentBatchInfo
 */
export interface ParentBatchInfo {
  batchId: number;
  batchNumber: string;
  materialName: string;
  quantityConsumed: number;
  unit: string;
  relationType: string;
}

/**
 * Matches: BatchDTO.ChildBatchInfo
 */
export interface ChildBatchInfo {
  batchId: number;
  batchNumber: string;
  materialName: string;
  quantity: number;
  unit: string;
  relationType: string;
}

/**
 * Matches: BatchDTO.ProductionInfo
 */
export interface ProductionInfo {
  operationId: number;
  operationName: string;
  processName: string;
  orderId: string;
  productionDate: string; // LocalDateTime
}

/**
 * Matches: BatchDTO.SplitRequest
 */
export interface BatchSplitRequest {
  sourceBatchId: number;
  portions: SplitPortion[];
  reason?: string;
}

/**
 * Matches: BatchDTO.SplitPortion
 */
export interface SplitPortion {
  quantity: number;
  batchNumberSuffix?: string;
}

/**
 * Matches: BatchDTO.SplitResponse
 */
export interface BatchSplitResponse {
  sourceBatchId: number;
  sourceBatchNumber: string;
  originalQuantity: number;
  remainingQuantity: number;
  newBatches: Batch[];
  status: string;
}

/**
 * Matches: BatchDTO.MergeRequest
 */
export interface BatchMergeRequest {
  sourceBatchIds: number[];
  targetBatchNumber?: string;
  reason?: string;
}

/**
 * Matches: BatchDTO.MergeResponse
 */
export interface BatchMergeResponse {
  sourceBatches: Batch[];
  mergedBatch: Batch;
  totalQuantity: number;
  status: string;
}

/**
 * Matches: BatchDTO.StatusUpdateResponse
 */
export interface BatchStatusUpdateResponse {
  batchId: number;
  batchNumber: string;
  previousStatus: string;
  newStatus: string;
  message: string;
  updatedBy: string;
  updatedOn: string; // LocalDateTime
}

/**
 * Matches: BatchDTO.ApprovalRequest
 */
export interface BatchApprovalRequest {
  batchId: number;
  notes?: string;
}

/**
 * Matches: BatchDTO.RejectionRequest
 */
export interface BatchRejectionRequest {
  batchId: number;
  reason: string;
}

/**
 * Matches: BatchDTO.CreateBatchRequest
 */
export interface CreateBatchRequest {
  batchNumber: string;
  materialId: string;
  materialName?: string;
  quantity: number;
  unit?: string;
}

/**
 * Matches: BatchDTO.UpdateBatchRequest
 * NOTE: quantity field REMOVED per MES Batch Management Specification.
 * Use adjustBatchQuantity() for quantity changes.
 */
export interface UpdateBatchRequest {
  batchNumber?: string;
  materialId?: string;
  materialName?: string;
  // quantity REMOVED - use AdjustQuantityRequest instead
  unit?: string;
  status?: string;
}

/**
 * Matches: BatchDTO.AdjustQuantityRequest
 * Per MES Batch Management Specification: batch quantity is NEVER edited directly.
 * All quantity changes must use this endpoint with proper justification.
 */
export interface AdjustQuantityRequest {
  newQuantity: number;
  reason: string;
  adjustmentType: 'CORRECTION' | 'INVENTORY_COUNT' | 'DAMAGE' | 'SCRAP_RECOVERY';
}

/**
 * Matches: BatchDTO.AdjustQuantityResponse
 */
export interface AdjustQuantityResponse {
  batchId: number;
  batchNumber: string;
  previousQuantity: number;
  newQuantity: number;
  quantityDifference: number;
  adjustmentType: string;
  reason: string;
  adjustedBy: string;
  adjustedOn: string;
  message: string;
}

/**
 * Matches: BatchDTO.QuantityAdjustmentHistory
 */
export interface QuantityAdjustmentHistory {
  adjustmentId: number;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  adjustmentType: string;
  reason: string;
  adjustedBy: string;
  adjustedOn: string;
}

/**
 * P07: Batch number preview response.
 * Matches: BatchDTO.BatchNumberPreview
 */
export interface BatchNumberPreview {
  previewBatchNumber: string;
  operationType?: string;
  productSku?: string;
}
