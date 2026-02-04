/**
 * Hold Models - Must match backend HoldDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { EntityTypeValue, HoldStatusType } from '../constants/status.constants';

/**
 * Matches: HoldDTO.HoldResponse
 */
export interface Hold {
  holdId: number;
  entityType: EntityTypeValue;
  entityId: number;
  entityName?: string;
  reason: string;
  comments?: string;
  appliedBy: string;
  appliedOn: string; // LocalDateTime
  releasedBy?: string;
  releasedOn?: string; // LocalDateTime
  releaseComments?: string;
  status: HoldStatusType;
  durationMinutes?: number;
}

/**
 * Matches: HoldDTO.ApplyHoldRequest
 */
export interface ApplyHoldRequest {
  entityType: EntityTypeValue;
  entityId: number;
  reason: string;
  comments?: string;
}

/**
 * Matches: HoldDTO.ReleaseHoldRequest
 */
export interface ReleaseHoldRequest {
  releaseComments?: string;
}

/**
 * Matches: HoldDTO.HoldCountResponse
 */
export interface HoldCountResponse {
  activeHolds: number;
}
