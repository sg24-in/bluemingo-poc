package com.mes.production.entity;

/**
 * Design-time status for Process templates.
 * Runtime execution tracking happens at Operation level (linked to OrderLineItem).
 */
public enum ProcessStatus {
    DRAFT,      // Being designed, not ready for use
    ACTIVE,     // Ready to be used in routings
    INACTIVE    // Retired, no longer available
}
