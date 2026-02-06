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
    PRODUCTION: '/#/production',
    PRODUCTION_CONFIRM: (operationId) => `/#/production/confirm/${operationId}`,
    INVENTORY: '/#/inventory',
    BATCHES: '/#/batches',
    BATCH_DETAIL: (id) => `/#/batches/${id}`,
    HOLDS: '/#/holds',
    EQUIPMENT: '/#/equipment',
    EQUIPMENT_NEW: '/#/equipment/new',
    EQUIPMENT_EDIT: (id) => `/#/equipment/${id}/edit`,
    INVENTORY_NEW: '/#/inventory/new',
    INVENTORY_EDIT: (id) => `/#/inventory/${id}/edit`,
    BATCH_NEW: '/#/batches/new',
    BATCH_EDIT: (id) => `/#/batches/${id}/edit`,
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
    PRODUCT_EDIT: (id) => `/#/manage/products/${id}/edit`,
    BOM: '/#/manage/bom',
    BOM_TREE: (sku) => `/#/manage/bom/${sku}/tree`,
    BOM_NODE_NEW: (sku) => `/#/manage/bom/${sku}/node/new`,
    BOM_NODE_EDIT: (sku, bomId) => `/#/manage/bom/${sku}/node/${bomId}/edit`,
    // Config management
    CONFIG_HOLD_REASONS: '/#/manage/config/hold-reasons',
    CONFIG_HOLD_REASONS_NEW: '/#/manage/config/hold-reasons/new',
    CONFIG_HOLD_REASONS_EDIT: (id) => `/#/manage/config/hold-reasons/${id}/edit`,
    CONFIG_DELAY_REASONS: '/#/manage/config/delay-reasons',
    CONFIG_DELAY_REASONS_NEW: '/#/manage/config/delay-reasons/new',
    CONFIG_DELAY_REASONS_EDIT: (id) => `/#/manage/config/delay-reasons/${id}/edit`,
    CONFIG_PROCESS_PARAMS: '/#/manage/config/process-params',
    CONFIG_PROCESS_PARAMS_NEW: '/#/manage/config/process-params/new',
    CONFIG_PROCESS_PARAMS_EDIT: (id) => `/#/manage/config/process-params/${id}/edit`,
    CONFIG_BATCH_NUMBER: '/#/manage/config/batch-number',
    CONFIG_BATCH_NUMBER_NEW: '/#/manage/config/batch-number/new',
    CONFIG_BATCH_NUMBER_EDIT: (id) => `/#/manage/config/batch-number/${id}/edit`,
    CONFIG_QUANTITY_TYPE: '/#/manage/config/quantity-type',
    CONFIG_QUANTITY_TYPE_NEW: '/#/manage/config/quantity-type/new',
    CONFIG_QUANTITY_TYPE_EDIT: (id) => `/#/manage/config/quantity-type/${id}/edit`,
    // Audit and Production History
    AUDIT: '/#/manage/audit',
    PRODUCTION_HISTORY: '/#/production/history',
    // Operators
    OPERATORS: '/#/manage/operators',
    OPERATOR_NEW: '/#/manage/operators/new',
    OPERATOR_EDIT: (id) => `/#/manage/operators/${id}/edit`,
    // Operations
    OPERATIONS: '/#/operations',
    // Processes
    PROCESSES: '/#/processes',
    PROCESSES_LIST: '/#/processes/list',
    PROCESSES_QUALITY: '/#/processes/quality-pending',
    PROCESS_DETAIL: (id) => `/#/processes/${id}`,
    // Admin Processes
    ADMIN_PROCESSES: '/#/manage/processes',
    ADMIN_PROCESSES_LIST: '/#/manage/processes/list',
    ADMIN_PROCESSES_QUALITY: '/#/manage/processes/quality-pending',
    // Admin Routing
    ADMIN_ROUTING: '/#/manage/routing',
    ADMIN_ROUTING_NEW: '/#/manage/routing/new',
    ADMIN_ROUTING_EDIT: (id) => `/#/manage/routing/${id}/edit`,
    // Profile & User Management
    PROFILE: '/#/profile',
    CHANGE_PASSWORD: '/#/change-password',
    USERS: '/#/manage/users',
    USER_NEW: '/#/manage/users/new',
    USER_EDIT: (id) => `/#/manage/users/${id}/edit`,
    // Production Landing
    PRODUCTION_LANDING: '/#/production'
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

    // Admin CRUD pages
    admin: {
        newButton: 'button:has-text("New"), button:has-text("+ New")',
        editButton: 'button:has-text("Edit")',
        deleteButton: 'button.btn-danger:has-text("Delete")',
        saveButton: 'button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Update")',
        cancelButton: 'button:has-text("Cancel")',
        searchInput: '#search',
        statusFilter: '#status-filter',
        // Customer form
        customerCode: '#customerCode',
        customerName: '#customerName',
        contactPerson: '#contactPerson',
        email: '#email',
        phone: '#phone',
        address: '#address',
        city: '#city',
        country: '#country',
        taxId: '#taxId',
        // Material form
        materialCode: '#materialCode',
        materialName: '#materialName',
        materialType: '#materialType',
        baseUnit: '#baseUnit',
        description: '#description',
        // Product form
        productSku: '#sku',
        productName: '#productName',
        // Equipment form
        equipmentCode: '#equipmentCode',
        equipmentName: '#name',
        equipmentType: '#equipmentType',
        capacity: '#capacity',
        capacityUnit: '#capacityUnit',
        // Inventory form
        inventoryMaterialId: '#materialId',
        inventoryMaterialName: '#materialName',
        inventoryType: '#inventoryType',
        inventoryQuantity: '#quantity',
        inventoryUnit: '#unit',
        inventoryLocation: '#location',
        // Batch form
        batchNumber: '#batchNumber',
        batchMaterialId: '#materialId',
        batchMaterialName: '#materialName',
        batchQuantity: '#quantity',
        batchUnit: '#unit',
        // BOM form
        bomMaterialId: '#materialId',
        bomMaterialName: '#materialName',
        bomQuantityRequired: '#quantityRequired',
        bomUnit: '#unit',
        bomYieldLossRatio: '#yieldLossRatio',
        bomSequenceLevel: '#sequenceLevel',
        bomVersion: '#bomVersion',
        bomProductSelect: '#productSelect',
        bomMaterialSelect: '#materialSelect',
        // Config forms
        reasonCode: '#reasonCode',
        reasonDescription: '#reasonDescription',
        configStatus: '#status',
        // Process params form
        paramOperationType: '#operationType',
        paramProductSku: '#productSku',
        parameterName: '#parameterName',
        parameterType: '#parameterType',
        paramUnit: '#unit',
        paramMinValue: '#minValue',
        paramMaxValue: '#maxValue',
        paramDefaultValue: '#defaultValue',
        paramIsRequired: '#isRequired',
        paramDisplayOrder: '#displayOrder',
        // Batch number form
        batchConfigName: '#configName',
        batchOperationType: '#operationType',
        batchProductSku: '#productSku',
        batchPrefix: '#prefix',
        batchSeparator: '#separator',
        batchIncludeDate: '#includeDate',
        batchDateFormat: '#dateFormat',
        batchSequenceLength: '#sequenceLength',
        batchSequenceReset: '#sequenceReset',
        batchPriority: '#priority',
        // Quantity type form
        qtConfigName: '#configName',
        qtMaterialCode: '#materialCode',
        qtOperationType: '#operationType',
        qtEquipmentType: '#equipmentType',
        qtQuantityType: '#quantityType',
        qtDecimalPrecision: '#decimalPrecision',
        qtRoundingRule: '#roundingRule',
        qtMinQuantity: '#minQuantity',
        qtMaxQuantity: '#maxQuantity',
        qtUnit: '#unit',
        // Operator form
        operatorCode: '#operatorCode',
        operatorName: '#name',
        operatorDepartment: '#department',
        operatorShift: '#shift',
        operatorStatus: '#status',
        // User form
        userName: '#name',
        userEmail: '#email',
        userPassword: '#password',
        userRole: '#role'
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
    equipmentStatuses: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'ON_HOLD'],

    // CRUD Test Data
    // BOM test data
    bom: {
        materialId: 'E2E-RM-TEST',
        materialName: 'E2E Test Iron Ore',
        quantity: '1500',
        unit: 'KG',
        yieldLossRatio: '1.05',
        sequenceLevel: '1',
        bomVersion: 'V1',
        updatedQuantity: '2000'
    },

    crud: {
        customer: {
            code: 'E2E-CUST-001',
            name: 'E2E Test Customer',
            contact: 'John Doe',
            email: 'e2e@test.com',
            phone: '+1-555-0123',
            address: '123 Test Street',
            city: 'Test City',
            country: 'Test Country',
            taxId: 'TAX-12345',
            updatedName: 'E2E Test Customer Updated'
        },
        material: {
            code: 'E2E-MAT-001',
            name: 'E2E Test Material',
            type: 'RAW',
            unit: 'KG',
            description: 'Test material for E2E testing',
            updatedName: 'E2E Test Material Updated'
        },
        product: {
            sku: 'E2E-PROD-001',
            name: 'E2E Test Product',
            unit: 'PC',
            description: 'Test product for E2E testing',
            updatedName: 'E2E Test Product Updated'
        },
        equipment: {
            code: 'E2E-EQ-001',
            name: 'E2E Test Furnace',
            type: 'BATCH',
            capacity: '5000',
            capacityUnit: 'KG',
            location: 'Building A',
            updatedName: 'E2E Test Furnace Updated'
        },
        inventory: {
            materialId: 'E2E-RM-001',
            materialName: 'E2E Iron Ore',
            type: 'RM',
            quantity: '1000',
            unit: 'KG',
            location: 'Warehouse A',
            updatedQuantity: '2000'
        },
        batch: {
            batchNumber: 'E2E-BATCH-001',
            materialId: 'E2E-RM-001',
            materialName: 'E2E Iron Ore',
            quantity: '500',
            unit: 'KG',
            updatedQuantity: '750'
        },
        holdReason: {
            code: 'E2E-HOLD-001',
            description: 'E2E Test Hold Reason',
            updatedDescription: 'E2E Test Hold Updated'
        },
        delayReason: {
            code: 'E2E-DELAY-001',
            description: 'E2E Test Delay Reason',
            updatedDescription: 'E2E Test Delay Updated'
        },
        processParam: {
            operationType: 'E2E_FURNACE',
            parameterName: 'E2E_TEMPERATURE',
            parameterType: 'DECIMAL',
            unit: 'C',
            minValue: '100',
            maxValue: '1500',
            defaultValue: '800',
            updatedMax: '2000'
        },
        batchNumber: {
            configName: 'E2E Batch Config',
            prefix: 'E2E',
            separator: '-',
            sequenceLength: '4',
            updatedPrefix: 'E2ET'
        },
        quantityType: {
            configName: 'E2E Quantity Config',
            quantityType: 'DECIMAL',
            decimalPrecision: '2',
            roundingRule: 'HALF_UP',
            updatedPrecision: '3'
        },
        operator: {
            code: 'E2E-OP-001',
            name: 'E2E Test Operator',
            department: 'Production',
            shift: 'Day',
            updatedName: 'E2E Test Operator Updated'
        },
        user: {
            name: 'E2E Test User',
            email: 'e2e-test@example.com',
            password: 'TestPass123!',
            role: 'OPERATOR',
            updatedName: 'E2E Test User Updated'
        }
    }
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
    pagination: '10-pagination',
    crud: '11-crud',
    entityCrud: '12-entity-crud',
    bomCrud: '13-bom-crud',
    configCrud: '14-config-crud',
    auditHistory: '15-audit-history',
    operators: '16-operators',
    operations: '17-operations',
    processes: '18-processes',
    userProfile: '19-user-profile',
    users: '20-users',
    productionHistory: '21-production-history'
};

module.exports = {
    ROUTES,
    SELECTORS,
    TEST_DATA,
    SCREENSHOT_PREFIX
};
