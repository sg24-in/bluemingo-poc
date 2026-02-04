/**
 * Dashboard Models - Must match backend DashboardDTO exactly.
 * See CONVENTIONS.md for contract rules.
 */

import { AuditActionType, EntityTypeValue } from '../constants/status.constants';

/**
 * Matches: DashboardDTO.Summary
 */
export interface DashboardSummary {
  totalOrders: number;
  ordersInProgress: number;
  operationsReady: number;
  operationsInProgress: number;
  activeHolds: number;
  todayConfirmations: number;
  qualityPendingProcesses: number;
  recentActivity: RecentActivity[];
  auditActivity: AuditActivity[];
}

/**
 * Matches: DashboardDTO.RecentActivity
 */
export interface RecentActivity {
  confirmationId: number;
  operationName: string;
  productSku: string;
  producedQty: number;
  operatorName: string;
  confirmedAt: string; // LocalDateTime serialized as ISO string
  batchNumber: string;
}

/**
 * Matches: DashboardDTO.AuditActivity
 */
export interface AuditActivity {
  auditId: number;
  entityType: EntityTypeValue;
  entityId: number;
  action: AuditActionType;
  description: string;
  changedBy: string;
  timestamp: string; // LocalDateTime serialized as ISO string
}

/**
 * Matches: DashboardDTO.OrderSummary
 */
export interface OrderSummary {
  total: number;
  created: number;
  inProgress: number;
  completed: number;
  onHold: number;
}

/**
 * Matches: DashboardDTO.OperationSummary
 */
export interface OperationSummary {
  total: number;
  notStarted: number;
  ready: number;
  inProgress: number;
  confirmed: number;
  onHold: number;
}
