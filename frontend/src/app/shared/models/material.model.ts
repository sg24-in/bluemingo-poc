/**
 * Material Model - Matches backend MaterialDTO.
 * TASK-M4: Updated with all backend fields for complete alignment.
 */

export type MaterialType = 'RM' | 'IM' | 'FG' | 'WIP';
export type MaterialStatus = 'ACTIVE' | 'INACTIVE';

export interface Material {
  materialId: number;
  materialCode: string;
  materialName: string;
  materialType: MaterialType;  // Raw Material, Intermediate, Finished Goods, Work In Progress
  description?: string;
  baseUnit: string;
  status: MaterialStatus;

  // TASK-M4: Classification fields
  materialGroup?: string;
  sku?: string;

  // TASK-M4: Cost fields
  standardCost?: number;
  costCurrency?: string;

  // TASK-M4: Inventory management fields
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;

  // TASK-M4: Logistics fields
  leadTimeDays?: number;
  shelfLifeDays?: number;
  storageConditions?: string;

  // Audit fields
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

export interface CreateMaterialRequest {
  materialCode: string;
  materialName: string;
  materialType: MaterialType;
  description?: string;
  baseUnit: string;

  // TASK-M4: Optional extended fields
  materialGroup?: string;
  sku?: string;
  standardCost?: number;
  costCurrency?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  leadTimeDays?: number;
  shelfLifeDays?: number;
  storageConditions?: string;
}

export interface UpdateMaterialRequest {
  materialName?: string;
  materialType?: MaterialType;
  description?: string;
  baseUnit?: string;
  status?: MaterialStatus;

  // TASK-M4: Optional extended fields
  materialGroup?: string;
  sku?: string;
  standardCost?: number;
  costCurrency?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  leadTimeDays?: number;
  shelfLifeDays?: number;
  storageConditions?: string;
}
