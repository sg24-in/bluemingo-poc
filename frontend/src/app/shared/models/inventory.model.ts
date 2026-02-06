/**
 * Inventory Models - Must match backend InventoryDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { InventoryStateType } from '../constants/status.constants';

/**
 * Matches: InventoryDTO
 */
export interface Inventory {
  inventoryId: number;
  materialId: string;
  materialName: string;
  inventoryType: string; // RM, IM, FG, WIP
  state: InventoryStateType;
  quantity: number;
  unit: string;
  location?: string;
  batchId?: number;
  batchNumber?: string;
  // Block info
  blockReason?: string;
  blockedBy?: string;
  blockedOn?: string; // LocalDateTime
  // Scrap info
  scrapReason?: string;
  scrappedBy?: string;
  scrappedOn?: string; // LocalDateTime
  // Reservation info
  reservedForOrderId?: number;
  reservedForOperationId?: number;
  reservedBy?: string;
  reservedOn?: string; // LocalDateTime
  reservedQty?: number;
}

/**
 * Matches: InventoryDTO.StateUpdateResponse
 */
export interface InventoryStateUpdateResponse {
  inventoryId: number;
  previousState: string;
  newState: string;
  message: string;
  updatedBy: string;
  updatedOn: string; // LocalDateTime
}

/**
 * Matches: InventoryDTO.BlockRequest
 */
export interface InventoryBlockRequest {
  inventoryId: number;
  reason: string;
}

/**
 * Matches: InventoryDTO.ScrapRequest
 */
export interface InventoryScrapRequest {
  inventoryId: number;
  reason: string;
}

/**
 * Matches: InventoryDTO.ReserveRequest
 */
export interface InventoryReserveRequest {
  inventoryId: number;
  orderId: number;
  operationId: number;
  quantity?: number;
}

/**
 * Matches: InventoryDTO.CreateInventoryRequest
 */
export interface CreateInventoryRequest {
  materialId: string;
  materialName?: string;
  inventoryType: string; // RM, IM, FG, WIP
  quantity: number;
  unit?: string;
  location?: string;
  batchId?: number;
}

/**
 * Matches: InventoryDTO.UpdateInventoryRequest
 */
export interface UpdateInventoryRequest {
  materialId?: string;
  materialName?: string;
  inventoryType?: string;
  quantity?: number;
  unit?: string;
  location?: string;
  state?: string;
  batchId?: number;
}

/**
 * Matches: InventoryDTO.ReceiveMaterialRequest
 * Used for goods receipt of raw materials.
 */
export interface ReceiveMaterialRequest {
  materialId: string;
  materialName?: string;
  quantity: number;
  unit?: string;
  supplierBatchNumber?: string;
  supplierId?: string;
  receivedDate?: string; // LocalDate (YYYY-MM-DD)
  location?: string;
  notes?: string;
}

/**
 * Matches: InventoryDTO.ReceiveMaterialResponse
 */
export interface ReceiveMaterialResponse {
  batchId: number;
  batchNumber: string;
  inventoryId: number;
  batchStatus: string;
  inventoryState: string;
  quantity: number;
  unit: string;
  message: string;
}
