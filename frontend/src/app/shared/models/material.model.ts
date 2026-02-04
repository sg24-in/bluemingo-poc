/**
 * Material Model - Matches backend MaterialDTO.
 */

export interface Material {
  materialId: number;
  materialCode: string;
  materialName: string;
  materialType: 'RM' | 'IM' | 'FG' | 'WIP';  // Raw Material, Intermediate, Finished Goods, Work In Progress
  description?: string;
  baseUnit: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdOn?: string;
  updatedOn?: string;
}

export interface CreateMaterialRequest {
  materialCode: string;
  materialName: string;
  materialType: 'RM' | 'IM' | 'FG' | 'WIP';
  description?: string;
  baseUnit: string;
}

export interface UpdateMaterialRequest {
  materialName: string;
  materialType?: 'RM' | 'IM' | 'FG' | 'WIP';
  description?: string;
  baseUnit?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
