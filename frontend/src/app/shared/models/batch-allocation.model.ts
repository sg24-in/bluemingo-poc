/**
 * Batch Allocation Models
 * Matches backend BatchAllocationDTO
 */

export interface AllocationInfo {
  allocationId: number;
  batchId: number;
  batchNumber: string;
  materialId: string;
  materialName: string;
  orderLineId: number;
  orderId: number;
  productSku: string;
  productName: string;
  allocatedQty: number;
  unit: string;
  timestamp: string;
  status: string;
  createdBy: string;
}

export interface AllocateRequest {
  batchId: number;
  orderLineId: number;
  quantity: number;
}

export interface UpdateAllocationQuantityRequest {
  quantity: number;
}

export interface BatchAvailability {
  batchId: number;
  batchNumber: string;
  totalQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  fullyAllocated: boolean;
}
