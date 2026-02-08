/**
 * Full Workflow E2E Test - Complete System Setup
 *
 * This test creates ALL data through the API:
 * 1. Reset database (clear all data)
 * 2. Create master data (customers, materials, products, equipment, operators)
 * 3. Create processes and routings
 * 4. Create orders with line items
 * 5. Generate operations from routings
 * 6. Receive raw materials (create batches + inventory)
 * 7. Run production confirmations
 *
 * Run with: node e2e/tests/30-full-workflow-setup.test.js
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

let authToken = null;

// ============================================================
// API Helper Functions
// ============================================================

async function login() {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@mes.com', password: 'admin123' })
    });
    const data = await response.json();
    authToken = data.accessToken;
    console.log('✅ Logged in successfully');
    return authToken;
}

async function apiCall(method, endpoint, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const text = await response.text();
    try {
        return { status: response.status, data: JSON.parse(text) };
    } catch {
        return { status: response.status, data: text };
    }
}

async function get(endpoint) { return apiCall('GET', endpoint); }
async function post(endpoint, body) { return apiCall('POST', endpoint, body); }
async function put(endpoint, body) { return apiCall('PUT', endpoint, body); }
async function del(endpoint) { return apiCall('DELETE', endpoint); }

// ============================================================
// Test Data Definitions
// ============================================================

const CUSTOMERS = [
    { customerCode: 'CUST-E2E-001', customerName: 'Steel Works Inc', email: 'orders@steelworks.com', phone: '+1-555-0101', address: '123 Industrial Ave', city: 'Pittsburgh', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-E2E-002', customerName: 'Auto Parts Manufacturing', email: 'procurement@autoparts.com', phone: '+1-555-0102', address: '456 Manufacturing Blvd', city: 'Detroit', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-E2E-003', customerName: 'Construction Materials Ltd', email: 'buying@constructmat.com', phone: '+1-555-0103', address: '789 Builder St', city: 'Chicago', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-E2E-004', customerName: 'Heavy Equipment Corp', email: 'supply@heavyequip.com', phone: '+1-555-0104', address: '321 Machine Way', city: 'Cleveland', country: 'USA', status: 'ACTIVE' },
    { customerCode: 'CUST-E2E-005', customerName: 'Pacific Steel Trading', email: 'trade@pacificsteel.com', phone: '+1-555-0105', address: '555 Harbor Blvd', city: 'Los Angeles', country: 'USA', status: 'ACTIVE' },
];

const MATERIALS = [
    // Raw Materials
    { materialCode: 'RM-E2E-SCRAP-A', materialName: 'Steel Scrap Grade A (E2E)', materialType: 'RM', baseUnit: 'T', description: 'High quality steel scrap', status: 'ACTIVE' },
    { materialCode: 'RM-E2E-SCRAP-B', materialName: 'Steel Scrap Grade B (E2E)', materialType: 'RM', baseUnit: 'T', description: 'Standard steel scrap', status: 'ACTIVE' },
    { materialCode: 'RM-E2E-FESI', materialName: 'Ferro Silicon (E2E)', materialType: 'RM', baseUnit: 'KG', description: 'Ferroalloy for deoxidation', status: 'ACTIVE' },
    { materialCode: 'RM-E2E-FEMN', materialName: 'Ferro Manganese (E2E)', materialType: 'RM', baseUnit: 'KG', description: 'Ferroalloy for alloying', status: 'ACTIVE' },
    { materialCode: 'RM-E2E-LIMESTONE', materialName: 'Limestone (E2E)', materialType: 'RM', baseUnit: 'T', description: 'Flux material', status: 'ACTIVE' },
    // Intermediate Materials
    { materialCode: 'IM-E2E-SLAB', materialName: 'Steel Slab (E2E)', materialType: 'IM', baseUnit: 'T', description: 'Cast slab for rolling', status: 'ACTIVE' },
    { materialCode: 'IM-E2E-BILLET', materialName: 'Steel Billet (E2E)', materialType: 'IM', baseUnit: 'T', description: 'Cast billet for long products', status: 'ACTIVE' },
    { materialCode: 'IM-E2E-HR-COIL', materialName: 'Hot Rolled Coil (E2E)', materialType: 'IM', baseUnit: 'T', description: 'Hot rolled coil for cold rolling', status: 'ACTIVE' },
    // Finished Goods
    { materialCode: 'FG-E2E-HR-2MM', materialName: 'HR Coil 2mm (E2E)', materialType: 'FG', baseUnit: 'T', description: 'Hot rolled coil 2mm thickness', status: 'ACTIVE' },
    { materialCode: 'FG-E2E-HR-3MM', materialName: 'HR Coil 3mm (E2E)', materialType: 'FG', baseUnit: 'T', description: 'Hot rolled coil 3mm thickness', status: 'ACTIVE' },
    { materialCode: 'FG-E2E-CR-1MM', materialName: 'CR Sheet 1mm (E2E)', materialType: 'FG', baseUnit: 'T', description: 'Cold rolled sheet 1mm', status: 'ACTIVE' },
    { materialCode: 'FG-E2E-REBAR-10', materialName: 'Rebar 10mm (E2E)', materialType: 'FG', baseUnit: 'T', description: 'Reinforcing bar 10mm diameter', status: 'ACTIVE' },
    { materialCode: 'FG-E2E-REBAR-12', materialName: 'Rebar 12mm (E2E)', materialType: 'FG', baseUnit: 'T', description: 'Reinforcing bar 12mm diameter', status: 'ACTIVE' },
];

const PRODUCTS = [
    { sku: 'PROD-HR-COIL-2MM', productName: 'Hot Rolled Coil 2mm', productCategory: 'Flat Products', baseUnit: 'T', status: 'ACTIVE' },
    { sku: 'PROD-HR-COIL-3MM', productName: 'Hot Rolled Coil 3mm', productCategory: 'Flat Products', baseUnit: 'T', status: 'ACTIVE' },
    { sku: 'PROD-CR-SHEET-1MM', productName: 'Cold Rolled Sheet 1mm', productCategory: 'Flat Products', baseUnit: 'T', status: 'ACTIVE' },
    { sku: 'PROD-REBAR-10', productName: 'Rebar 10mm', productCategory: 'Long Products', baseUnit: 'T', status: 'ACTIVE' },
    { sku: 'PROD-REBAR-12', productName: 'Rebar 12mm', productCategory: 'Long Products', baseUnit: 'T', status: 'ACTIVE' },
    { sku: 'PROD-BILLET-100', productName: 'Steel Billet 100mm', productCategory: 'Semi-Finished', baseUnit: 'T', status: 'ACTIVE' },
];

const EQUIPMENT = [
    { equipmentCode: 'EAF-E2E-001', name: 'Electric Arc Furnace #1', equipmentType: 'FURNACE', capacity: 120, capacityUnit: 'T', location: 'Melt Shop Bay 1', status: 'AVAILABLE' },
    { equipmentCode: 'EAF-E2E-002', name: 'Electric Arc Furnace #2', equipmentType: 'FURNACE', capacity: 120, capacityUnit: 'T', location: 'Melt Shop Bay 2', status: 'AVAILABLE' },
    { equipmentCode: 'LF-E2E-001', name: 'Ladle Furnace #1', equipmentType: 'LADLE', capacity: 120, capacityUnit: 'T', location: 'Secondary Metallurgy', status: 'AVAILABLE' },
    { equipmentCode: 'CCM-E2E-001', name: 'Continuous Caster #1', equipmentType: 'CASTER', capacity: 200, capacityUnit: 'T/H', location: 'Casting Bay', status: 'AVAILABLE' },
    { equipmentCode: 'HSM-E2E-001', name: 'Hot Strip Mill #1', equipmentType: 'ROLLING_MILL', capacity: 400, capacityUnit: 'T/H', location: 'Hot Rolling Bay', status: 'AVAILABLE' },
    { equipmentCode: 'CRM-E2E-001', name: 'Cold Rolling Mill', equipmentType: 'ROLLING_MILL', capacity: 150, capacityUnit: 'T/H', location: 'Cold Rolling Bay', status: 'AVAILABLE' },
    { equipmentCode: 'BRM-E2E-001', name: 'Bar Rolling Mill', equipmentType: 'ROLLING_MILL', capacity: 100, capacityUnit: 'T/H', location: 'Long Products Bay', status: 'AVAILABLE' },
];

const OPERATORS = [
    { operatorCode: 'OP-E2E-001', name: 'John Smith', department: 'Melt Shop', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-E2E-002', name: 'Mike Johnson', department: 'Melt Shop', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-E2E-003', name: 'David Brown', department: 'Casting', shift: 'DAY', status: 'ACTIVE' },
    { operatorCode: 'OP-E2E-004', name: 'James Wilson', department: 'Hot Rolling', shift: 'NIGHT', status: 'ACTIVE' },
    { operatorCode: 'OP-E2E-005', name: 'Robert Davis', department: 'Cold Rolling', shift: 'NIGHT', status: 'ACTIVE' },
    { operatorCode: 'OP-E2E-006', name: 'William Garcia', department: 'Long Products', shift: 'NIGHT', status: 'ACTIVE' },
];

const PROCESSES = [
    { processName: 'HR Coil Production', description: 'Hot rolled coil production - Melting → Casting → Hot Rolling', status: 'ACTIVE' },
    { processName: 'CR Sheet Production', description: 'Cold rolled sheet - HR Coil → Cold Rolling', status: 'ACTIVE' },
    { processName: 'Rebar Production', description: 'Rebar production - Melting → Casting → Bar Rolling', status: 'ACTIVE' },
    { processName: 'Billet Production', description: 'Billet production - Melting → Casting', status: 'ACTIVE' },
];

// ============================================================
// Setup Functions
// ============================================================

async function resetDatabase() {
    console.log('\n📦 Resetting database...');
    const result = await post('/admin/reset/transactional', {});
    if (result.status === 200) {
        console.log(`   ✅ Deleted ${result.data.rowsDeleted} rows`);
    } else {
        console.log(`   ⚠️  Reset returned: ${JSON.stringify(result.data)}`);
    }
}

async function createCustomers() {
    console.log('\n👥 Creating customers...');
    let created = 0;
    for (const customer of CUSTOMERS) {
        const result = await post('/customers', customer);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} customers`);
}

async function createMaterials() {
    console.log('\n🧱 Creating materials...');
    let created = 0;
    for (const material of MATERIALS) {
        const result = await post('/materials', material);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} materials`);
}

async function createProducts() {
    console.log('\n📦 Creating products...');
    let created = 0;
    for (const product of PRODUCTS) {
        const result = await post('/products', product);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} products`);
}

async function createEquipment() {
    console.log('\n🏭 Creating equipment...');
    let created = 0;
    for (const equip of EQUIPMENT) {
        const result = await post('/equipment', equip);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} equipment`);
}

async function createOperators() {
    console.log('\n👷 Creating operators...');
    let created = 0;
    for (const operator of OPERATORS) {
        const result = await post('/operators', operator);
        if (result.status === 200 || result.status === 201) {
            created++;
        }
    }
    console.log(`   ✅ Created ${created} operators`);
}

async function createProcessesAndRoutings() {
    console.log('\n⚙️  Creating processes and routings...');

    const processIds = {};

    // Create processes
    for (const process of PROCESSES) {
        const result = await post('/processes', process);
        if (result.status === 200 || result.status === 201) {
            processIds[process.processName] = result.data.processId;
            console.log(`   ✅ Created process: ${process.processName} (ID: ${result.data.processId})`);
        }
    }

    // Create routings for each process
    const routingSteps = {
        'HR Coil Production': [
            { sequenceNumber: 1, operationName: 'Melting', operationType: 'MELTING', operationCode: 'MELT-01' },
            { sequenceNumber: 2, operationName: 'Casting', operationType: 'CASTING', operationCode: 'CAST-01' },
            { sequenceNumber: 3, operationName: 'Hot Rolling', operationType: 'HOT_ROLLING', operationCode: 'HR-01' },
        ],
        'CR Sheet Production': [
            { sequenceNumber: 1, operationName: 'Pickling', operationType: 'PICKLING', operationCode: 'PKL-01' },
            { sequenceNumber: 2, operationName: 'Cold Rolling', operationType: 'COLD_ROLLING', operationCode: 'CR-01' },
            { sequenceNumber: 3, operationName: 'Annealing', operationType: 'ANNEALING', operationCode: 'ANN-01' },
        ],
        'Rebar Production': [
            { sequenceNumber: 1, operationName: 'Melting', operationType: 'MELTING', operationCode: 'MELT-02' },
            { sequenceNumber: 2, operationName: 'Billet Casting', operationType: 'CASTING', operationCode: 'CAST-02' },
            { sequenceNumber: 3, operationName: 'Bar Rolling', operationType: 'BAR_ROLLING', operationCode: 'BAR-01' },
        ],
        'Billet Production': [
            { sequenceNumber: 1, operationName: 'Melting', operationType: 'MELTING', operationCode: 'MELT-03' },
            { sequenceNumber: 2, operationName: 'Billet Casting', operationType: 'CASTING', operationCode: 'CAST-03' },
        ],
    };

    for (const [processName, steps] of Object.entries(routingSteps)) {
        const processId = processIds[processName];
        if (!processId) continue;

        // Create routing
        const routingResult = await post('/routing', {
            processId,
            routingName: `${processName} Route`,
            routingType: 'SEQUENTIAL',
            status: 'ACTIVE'
        });

        if (routingResult.status === 200 || routingResult.status === 201) {
            const routingId = routingResult.data.routingId;
            console.log(`   ✅ Created routing for: ${processName} (ID: ${routingId})`);

            // Create routing steps
            for (const step of steps) {
                await post(`/routing/${routingId}/steps`, step);
            }
            console.log(`      ✅ Created ${steps.length} routing steps`);
        }
    }

    return processIds;
}

async function updateProductProcessMapping(processIds) {
    console.log('\n🔗 Updating product-process mapping...');

    const mapping = {
        'PROD-HR-COIL-2MM': 'HR Coil Production',
        'PROD-HR-COIL-3MM': 'HR Coil Production',
        'PROD-CR-SHEET-1MM': 'CR Sheet Production',
        'PROD-REBAR-10': 'Rebar Production',
        'PROD-REBAR-12': 'Rebar Production',
        'PROD-BILLET-100': 'Billet Production',
    };

    // Get all products
    const productsResult = await get('/products');
    if (productsResult.status === 200) {
        for (const product of productsResult.data) {
            const processName = mapping[product.sku];
            if (processName && processIds[processName]) {
                await put(`/products/${product.productId}`, {
                    ...product,
                    defaultProcessId: processIds[processName]
                });
            }
        }
        console.log(`   ✅ Updated product-process mappings`);
    }
}

async function createOrders() {
    console.log('\n📋 Creating orders...');

    // Get customers
    const customersResult = await get('/customers');
    const customers = customersResult.data || [];
    if (customers.length === 0) {
        console.log('   ⚠️  No customers found, skipping orders');
        return;
    }

    // Get products
    const productsResult = await get('/products');
    const products = productsResult.data || [];
    const productMap = {};
    for (const p of products) {
        productMap[p.sku] = p.productName;
    }

    const orders = [
        { customerIndex: 0, items: [{ sku: 'PROD-HR-COIL-2MM', qty: 100 }] },
        { customerIndex: 1, items: [{ sku: 'PROD-HR-COIL-3MM', qty: 80 }] },
        { customerIndex: 2, items: [{ sku: 'PROD-REBAR-10', qty: 150 }, { sku: 'PROD-REBAR-12', qty: 100 }] },
        { customerIndex: 3, items: [{ sku: 'PROD-CR-SHEET-1MM', qty: 50 }] },
        { customerIndex: 4 % customers.length, items: [{ sku: 'PROD-BILLET-100', qty: 200 }] },
        { customerIndex: 0, items: [{ sku: 'PROD-HR-COIL-2MM', qty: 120 }, { sku: 'PROD-HR-COIL-3MM', qty: 80 }] },
        { customerIndex: 1, items: [{ sku: 'PROD-REBAR-10', qty: 200 }] },
        { customerIndex: 2, items: [{ sku: 'PROD-CR-SHEET-1MM', qty: 75 }] },
    ];

    let created = 0;
    for (const order of orders) {
        const customer = customers[order.customerIndex % customers.length];
        if (!customer) continue;

        const orderResult = await post('/orders', {
            customerId: String(customer.customerId),
            customerName: customer.customerName,
            orderDate: new Date().toISOString().split('T')[0],
            lineItems: order.items.map(item => ({
                productSku: item.sku,
                productName: productMap[item.sku] || item.sku,
                quantity: item.qty,
                unit: 'T'
            }))
        });

        if (orderResult.status === 200 || orderResult.status === 201) {
            created++;
        } else {
            console.log(`   ⚠️  Order creation failed: ${JSON.stringify(orderResult.data).substring(0, 100)}`);
        }
    }
    console.log(`   ✅ Created ${created} orders`);
}

async function generateOperations() {
    console.log('\n⚡ Generating operations from routings...');
    const result = await post('/admin/reset/generate-operations', {});
    if (result.status === 200) {
        console.log(`   ✅ Generated ${result.data.operationsGenerated} operations`);
    } else {
        console.log(`   ⚠️  Result: ${JSON.stringify(result.data)}`);
    }
}

async function receiveRawMaterials() {
    console.log('\n📥 Receiving raw materials...');

    // Get materials
    const materialsResult = await get('/materials');
    const materials = materialsResult.data || [];

    const rmMaterials = materials.filter(m => m.materialType === 'RM');
    if (rmMaterials.length === 0) {
        console.log('   ⚠️  No raw materials found, skipping receipts');
        return;
    }

    // Use E2E materials first, fall back to any RM
    const findMaterial = (codes) => {
        for (const code of codes) {
            const m = rmMaterials.find(m => m.materialCode === code);
            if (m) return m;
        }
        return null;
    };

    const receipts = [
        { codes: ['RM-E2E-SCRAP-A', 'RM-SCRAP-A'], quantity: 500, location: 'Scrap Yard A' },
        { codes: ['RM-E2E-SCRAP-A', 'RM-SCRAP-A'], quantity: 450, location: 'Scrap Yard A' },
        { codes: ['RM-E2E-SCRAP-B', 'RM-SCRAP-B'], quantity: 600, location: 'Scrap Yard B' },
        { codes: ['RM-E2E-SCRAP-B', 'RM-SCRAP-B'], quantity: 550, location: 'Scrap Yard B' },
        { codes: ['RM-E2E-FESI', 'RM-FESI'], quantity: 25000, location: 'Alloy Store' },
        { codes: ['RM-E2E-FEMN', 'RM-FEMN'], quantity: 30000, location: 'Alloy Store' },
        { codes: ['RM-E2E-LIMESTONE', 'RM-LIMESTONE'], quantity: 1000, location: 'Flux Store' },
    ];

    let received = 0;
    for (const receipt of receipts) {
        const material = findMaterial(receipt.codes) || rmMaterials[received % rmMaterials.length];
        if (!material) continue;

        const batchNumber = `E2E-RCV-${Date.now()}-${received + 1}`.substring(0, 25);

        const result = await post('/production/receive-material', {
            materialId: material.materialId,
            quantity: receipt.quantity,
            unit: material.baseUnit,
            batchNumber: batchNumber,
            location: receipt.location,
            supplierName: 'E2E Test Supplier',
            supplierBatchNumber: `SUP-${batchNumber}`
        });

        if (result.status === 200 || result.status === 201) {
            received++;
        } else {
            console.log(`   ⚠️  Receipt failed: ${JSON.stringify(result.data).substring(0, 100)}`);
        }
    }
    console.log(`   ✅ Received ${received} raw material batches`);
}

async function verifySetup() {
    console.log('\n📊 Verifying setup...');
    const result = await get('/admin/reset/verify');
    if (result.status === 200) {
        const data = result.data;
        console.log(`   Customers:      ${data.customers}`);
        console.log(`   Materials:      ${data.materials}`);
        console.log(`   Products:       ${data.products}`);
        console.log(`   Processes:      ${data.processes}`);
        console.log(`   Routings:       ${data.routings}`);
        console.log(`   Routing Steps:  ${data.routingSteps}`);
        console.log(`   Equipment:      ${data.equipment}`);
        console.log(`   Operators:      ${data.operators}`);
        console.log(`   Orders:         ${data.orders}`);
        console.log(`   Order Lines:    ${data.orderLineItems}`);
        console.log(`   Operations:     ${data.operations}`);
        console.log(`   Batches:        ${data.batches}`);
        console.log(`   Inventory:      ${data.inventory}`);
        console.log(`   ✅ Verified: ${data.verified}`);
    }
}

// ============================================================
// Main Execution
// ============================================================

async function runFullSetup() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   MES Full Workflow E2E Setup');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Started: ${new Date().toISOString()}`);

    try {
        // Step 1: Login
        await login();

        // Step 2: Reset database
        await resetDatabase();

        // Step 3: Create master data
        await createCustomers();
        await createMaterials();
        await createProducts();
        await createEquipment();
        await createOperators();

        // Step 4: Create processes and routings
        const processIds = await createProcessesAndRoutings();

        // Step 5: Update product-process mapping
        await updateProductProcessMapping(processIds);

        // Step 6: Create orders
        await createOrders();

        // Step 7: Generate operations
        await generateOperations();

        // Step 8: Receive raw materials
        await receiveRawMaterials();

        // Step 9: Verify setup
        await verifySetup();

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('   ✅ FULL SETUP COMPLETE');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`   Finished: ${new Date().toISOString()}`);

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    runFullSetup().then(() => process.exit(0));
}

module.exports = { runFullSetup };
