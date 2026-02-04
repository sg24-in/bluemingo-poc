/**
 * Constants and Test Data for MES E2E Tests
 */

// Navigation routes (using hash-based routing)
const ROUTES = {
    LOGIN: '/#/login',
    DASHBOARD: '/#/dashboard',
    ORDERS: '/#/orders',
    ORDER_DETAIL: (id) => `/#/orders/${id}`,
    ORDER_NEW: '/#/orders/new',
    ORDER_EDIT: (id) => `/#/orders/${id}/edit`,
    PRODUCTION: '/#/production/confirm',
    INVENTORY: '/#/inventory',
    BATCHES: '/#/batches',
    BATCH_DETAIL: (id) => `/#/batches/${id}`,
    HOLDS: '/#/holds',
    EQUIPMENT: '/#/equipment',
    QUALITY: '/#/quality',
    MANAGE: '/#/manage',
    CUSTOMERS: '/#/manage/customers',
    CUSTOMER_NEW: '/#/manage/customers/new',
    CUSTOMER_EDIT: (id) => `/#/manage/customers/${id}/edit`,
    MATERIALS: '/#/manage/materials',
    MATERIAL_NEW: '/#/manage/materials/new',
    MATERIAL_EDIT: (id) => `/#/manage/materials/${id}/edit`,
    PRODUCTS: '/#/manage/products',
    PRODUCT_NEW: '/#/manage/products/new',
    PRODUCT_EDIT: (id) => `/#/manage/products/${id}/edit`
};

// CSS Selectors
const SELECTORS = {
    // Login page
    login: {
        emailInput: 'input[formControlName="email"]',
        passwordInput: 'input[formControlName="password"]',
        submitButton: 'button[type="submit"]',
        errorMessage: '.error-message, .alert-danger'
    },

    // Header/Navigation
    header: {
        logo: '.header-logo, .navbar-brand',
        navLinks: '.nav-link',
        userMenu: '.user-menu',
        logoutButton: '.logout-btn, button:has-text("Logout")'
    },

    // Common table elements
    table: {
        container: 'table',
        header: 'table thead',
        body: 'table tbody',
        rows: 'table tbody tr',
        cells: 'table tbody td'
    },

    // Common form elements
    form: {
        input: 'input',
        select: 'select',
        textarea: 'textarea',
        checkbox: 'input[type="checkbox"]',
        submitButton: 'button[type="submit"]',
        cancelButton: 'button.cancel, button:has-text("Cancel")'
    },

    // Modal elements
    modal: {
        container: '.modal, .dialog',
        title: '.modal-title',
        body: '.modal-body',
        footer: '.modal-footer',
        closeButton: '.modal-close, .btn-close',
        confirmButton: '.btn-primary, button:has-text("Confirm")',
        cancelButton: '.btn-secondary, button:has-text("Cancel")'
    },

    // Status badges
    status: {
        badge: '.status-badge, .badge',
        available: '.status-available',
        blocked: '.status-blocked',
        ready: '.status-ready'
    },

    // Filters
    filters: {
        statusDropdown: 'select[name="status"], select#status',
        typeDropdown: 'select[name="type"], select#type',
        searchInput: 'input[name="search"], input[type="search"]'
    }
};

// Test Data
const TEST_DATA = {
    // Production confirmation form data
    production: {
        producedQty: 100,
        scrapQty: 5,
        delayMinutes: 15,
        delayReason: 'Equipment calibration',
        notes: 'Test production confirmation'
    },

    // Block/Hold reasons
    reasons: {
        block: 'Quality inspection required',
        scrap: 'Material defect detected',
        hold: 'Pending quality review',
        maintenance: 'Scheduled maintenance'
    },

    // Expected inventory states
    inventoryStates: ['AVAILABLE', 'BLOCKED', 'RESERVED', 'CONSUMED', 'SCRAPPED'],

    // Expected order statuses
    orderStatuses: ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],

    // Expected equipment statuses
    equipmentStatuses: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'ON_HOLD']
};

// Screenshot naming convention
const SCREENSHOT_PREFIX = {
    login: '01-login',
    dashboard: '02-dashboard',
    orders: '03-orders',
    production: '04-production',
    inventory: '05-inventory',
    batches: '06-batches',
    holds: '07-holds',
    equipment: '08-equipment',
    quality: '09-quality',
    navigation: '10-navigation'
};

module.exports = {
    ROUTES,
    SELECTORS,
    TEST_DATA,
    SCREENSHOT_PREFIX
};
