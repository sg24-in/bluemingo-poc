/**
 * Equipment Models - Must match backend EquipmentDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { EquipmentStatusType } from '../constants/status.constants';

/**
 * Equipment category types - functional classification
 * Matches backend equipment_category values
 */
export type EquipmentCategoryType =
  | 'MELTING'
  | 'CASTING'
  | 'ROLLING'
  | 'FINISHING'
  | 'COATING'
  | 'WIRE_ROLLING'
  | 'PACKAGING'
  | 'QUALITY'
  | 'UTILITY'
  | 'OTHER';

/**
 * Matches: EquipmentDTO
 */
export interface Equipment {
  equipmentId: number;
  equipmentCode: string;
  name: string;
  equipmentType: string;           // Processing mode: BATCH/CONTINUOUS
  /**
   * GAP-021: Equipment functional category
   * Examples: MELTING, CASTING, ROLLING, FINISHING, COATING, etc.
   */
  equipmentCategory?: EquipmentCategoryType;
  capacity?: number;
  capacityUnit?: string;
  location?: string;
  status: EquipmentStatusType;
  // Maintenance info
  maintenanceReason?: string;
  maintenanceStart?: string; // LocalDateTime
  maintenanceBy?: string;
  expectedMaintenanceEnd?: string; // LocalDateTime
  // Hold info
  holdReason?: string;
  holdStart?: string; // LocalDateTime
  heldBy?: string;
}

/**
 * Matches: EquipmentDTO.StatusUpdateResponse
 */
export interface EquipmentStatusUpdateResponse {
  equipmentId: number;
  equipmentCode: string;
  previousStatus: string;
  newStatus: string;
  message: string;
  updatedBy: string;
  updatedOn: string; // LocalDateTime
}

/**
 * Matches: EquipmentDTO.MaintenanceRequest
 */
export interface EquipmentMaintenanceRequest {
  equipmentId: number;
  reason: string;
  expectedEndTime?: string; // LocalDateTime
}

/**
 * Matches: EquipmentDTO.HoldRequest
 */
export interface EquipmentHoldRequest {
  equipmentId: number;
  reason: string;
}
