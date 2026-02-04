/**
 * Product Model - Matches backend ProductDTO.
 */

export interface Product {
  productId: number;
  sku: string;
  productName: string;
  description?: string;
  baseUnit: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdOn?: string;
  updatedOn?: string;
}

export interface CreateProductRequest {
  sku: string;
  productName: string;
  description?: string;
  baseUnit: string;
}

export interface UpdateProductRequest {
  productName: string;
  description?: string;
  baseUnit?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
