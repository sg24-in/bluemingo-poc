/**
 * Audit Trail Models - Must match backend AuditDTO exactly.
 */

export interface AuditEntry {
  auditId: number;
  entityType: string;
  entityId: number;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  action: string;
  changedBy: string;
  timestamp: string;
}

export interface AuditHistory {
  entityType: string;
  entityId: number;
  entries: AuditEntry[];
  totalEntries: number;
}

export interface AuditSummary {
  todaysActivityCount: number;
  recentActivity: AuditEntry[];
}
