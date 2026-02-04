/**
 * Batch Models - Must match backend BatchDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

/**
 * Batch Models - Must match backend BatchDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

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
