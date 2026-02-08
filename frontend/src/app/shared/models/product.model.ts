/**
 * Product Model - Matches backend ProductDTO.
 * TASK-M4: Updated with all backend fields for complete alignment.
 */

export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Product {
  productId: number;
  sku: string;
  productName: string;
  description?: string;
  baseUnit: string;
  status: ProductStatus;

  // TASK-M4: Classification fields
  productCategory?: string;
  productGroup?: string;

  // TASK-M4: Physical specifications
  weightPerUnit?: number;
  weightUnit?: string;

  // TASK-M4: Pricing fields
  standardPrice?: number;
  priceCurrency?: string;

  // TASK-M4: Order management fields
  minOrderQty?: number;
  leadTimeDays?: number;

  // TASK-M4: Material linkage
  materialId?: number;

  // Audit fields
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

export interface CreateProductRequest {
  sku: string;
  productName: string;
  description?: string;
  baseUnit: string;

  // TASK-M4: Optional extended fields
  productCategory?: string;
  productGroup?: string;
  weightPerUnit?: number;
  weightUnit?: string;
  standardPrice?: number;
  priceCurrency?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  materialId?: number;
}

export interface UpdateProductRequest {
  productName?: string;
  description?: string;
  baseUnit?: string;
  status?: ProductStatus;

  // TASK-M4: Optional extended fields
  productCategory?: string;
  productGroup?: string;
  weightPerUnit?: number;
  weightUnit?: string;
  standardPrice?: number;
  priceCurrency?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  materialId?: number;
}
