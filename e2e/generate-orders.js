// Generate 30 new orders with line items and operations for demo data
// Includes multi-stage products (orders with line items spanning multiple processes)
const fs = require('fs');
const path = require('path');

const customers = [
  { id: 'CUST-001', name: 'ABC Steel Corporation' },
  { id: 'CUST-002', name: 'Global Manufacturing Ltd' },
  { id: 'CUST-003', name: 'Pacific Metal Works' },
  { id: 'CUST-004', name: 'European Auto Parts GmbH' },
  { id: 'CUST-005', name: 'Asian Electronics Inc' },
  { id: 'CUST-006', name: 'BuildRight Construction' },
  { id: 'CUST-007', name: 'Nordic Steel Trading AB' },
  { id: 'CUST-008', name: 'Middle East Metals FZE' },
  { id: 'CUST-009', name: 'South American Steel SA' },
  { id: 'CUST-010', name: 'African Mining Corp' },
  { id: 'CUST-011', name: 'Oceanic Metals Ltd' },
];

// Product definitions with their process and operation templates
const products = {
  'HR-COIL-2MM': { name: 'Hot Rolled Coil 2mm', processId: 1, ops: [
    { tmpl: 1, name: 'Scrap Charging', code: 'MELT-CHRG', type: 'FURNACE', seq: 1 },
    { tmpl: 2, name: 'EAF Melting', code: 'MELT-EAF', type: 'FURNACE', seq: 2 },
    { tmpl: 3, name: 'Ladle Refining', code: 'MELT-LF', type: 'FURNACE', seq: 3 },
    { tmpl: 4, name: 'Slab Casting', code: 'CAST-SLAB', type: 'CASTER', seq: 4 },
    { tmpl: 6, name: 'Slab Reheating', code: 'ROLL-RHT', type: 'FURNACE', seq: 5 },
    { tmpl: 7, name: 'Rough Rolling', code: 'ROLL-RGH', type: 'ROLLING', seq: 6 },
    { tmpl: 8, name: 'Finish Rolling', code: 'ROLL-FIN', type: 'ROLLING', seq: 7 },
    { tmpl: 9, name: 'Cooling & Coiling', code: 'ROLL-COOL', type: 'COOLING', seq: 8 },
  ]},
  'HR-COIL-3MM': { name: 'Hot Rolled Coil 3mm', processId: 1, ops: [
    { tmpl: 1, name: 'Scrap Charging', code: 'MELT-CHRG', type: 'FURNACE', seq: 1 },
    { tmpl: 2, name: 'EAF Melting', code: 'MELT-EAF', type: 'FURNACE', seq: 2 },
    { tmpl: 3, name: 'Ladle Refining', code: 'MELT-LF', type: 'FURNACE', seq: 3 },
    { tmpl: 4, name: 'Slab Casting', code: 'CAST-SLAB', type: 'CASTER', seq: 4 },
    { tmpl: 6, name: 'Slab Reheating', code: 'ROLL-RHT', type: 'FURNACE', seq: 5 },
    { tmpl: 7, name: 'Rough Rolling', code: 'ROLL-RGH', type: 'ROLLING', seq: 6 },
    { tmpl: 8, name: 'Finish Rolling', code: 'ROLL-FIN', type: 'ROLLING', seq: 7 },
    { tmpl: 9, name: 'Cooling & Coiling', code: 'ROLL-COOL', type: 'COOLING', seq: 8 },
  ]},
  'HR-COIL-4MM': { name: 'Hot Rolled Coil 4mm', processId: 1, ops: [
    { tmpl: 1, name: 'Scrap Charging', code: 'MELT-CHRG', type: 'FURNACE', seq: 1 },
    { tmpl: 2, name: 'EAF Melting', code: 'MELT-EAF', type: 'FURNACE', seq: 2 },
    { tmpl: 3, name: 'Ladle Refining', code: 'MELT-LF', type: 'FURNACE', seq: 3 },
    { tmpl: 4, name: 'Slab Casting', code: 'CAST-SLAB', type: 'CASTER', seq: 4 },
    { tmpl: 6, name: 'Slab Reheating', code: 'ROLL-RHT', type: 'FURNACE', seq: 5 },
    { tmpl: 7, name: 'Rough Rolling', code: 'ROLL-RGH', type: 'ROLLING', seq: 6 },
    { tmpl: 8, name: 'Finish Rolling', code: 'ROLL-FIN', type: 'ROLLING', seq: 7 },
    { tmpl: 9, name: 'Cooling & Coiling', code: 'ROLL-COOL', type: 'COOLING', seq: 8 },
  ]},
  'CR-SHEET-1MM': { name: 'Cold Rolled Sheet 1mm', processId: 2, ops: [
    { tmpl: 10, name: 'Pickling', code: 'PKL', type: 'PICKLING', seq: 1 },
    { tmpl: 11, name: 'Cold Rolling', code: 'CRM', type: 'ROLLING', seq: 2 },
    { tmpl: 12, name: 'Batch Annealing', code: 'ANN', type: 'HEAT_TREATMENT', seq: 3 },
  ]},
  'CR-SHEET-2MM': { name: 'Cold Rolled Sheet 2mm', processId: 2, ops: [
    { tmpl: 10, name: 'Pickling', code: 'PKL', type: 'PICKLING', seq: 1 },
    { tmpl: 11, name: 'Cold Rolling', code: 'CRM', type: 'ROLLING', seq: 2 },
    { tmpl: 12, name: 'Batch Annealing', code: 'ANN', type: 'HEAT_TREATMENT', seq: 3 },
  ]},
  'REBAR-10MM': { name: 'Reinforcement Bar 10mm', processId: 3, ops: [
    { tmpl: 1, name: 'Scrap Charging', code: 'MELT-CHRG', type: 'FURNACE', seq: 1 },
    { tmpl: 2, name: 'EAF Melting', code: 'MELT-EAF', type: 'FURNACE', seq: 2 },
    { tmpl: 3, name: 'Ladle Refining', code: 'MELT-LF', type: 'FURNACE', seq: 3 },
    { tmpl: 5, name: 'Billet Casting', code: 'CAST-BILL', type: 'CASTER', seq: 4 },
    { tmpl: 13, name: 'Billet Reheating', code: 'BAR-RHT', type: 'FURNACE', seq: 5 },
    { tmpl: 14, name: 'Bar Rolling', code: 'BAR-ROLL', type: 'ROLLING', seq: 6 },
    { tmpl: 15, name: 'Quenching & Tempering', code: 'BAR-QT', type: 'HEAT_TREATMENT', seq: 7 },
  ]},
  'REBAR-12MM': { name: 'Reinforcement Bar 12mm', processId: 3, ops: [
    { tmpl: 1, name: 'Scrap Charging', code: 'MELT-CHRG', type: 'FURNACE', seq: 1 },
    { tmpl: 2, name: 'EAF Melting', code: 'MELT-EAF', type: 'FURNACE', seq: 2 },
    { tmpl: 3, name: 'Ladle Refining', code: 'MELT-LF', type: 'FURNACE', seq: 3 },
    { tmpl: 5, name: 'Billet Casting', code: 'CAST-BILL', type: 'CASTER', seq: 4 },
    { tmpl: 13, name: 'Billet Reheating', code: 'BAR-RHT', type: 'FURNACE', seq: 5 },
    { tmpl: 14, name: 'Bar Rolling', code: 'BAR-ROLL', type: 'ROLLING', seq: 6 },
    { tmpl: 15, name: 'Quenching & Tempering', code: 'BAR-QT', type: 'HEAT_TREATMENT', seq: 7 },
  ]},
  'STEEL-BILLET-100': { name: 'Steel Billet 100mm', processId: 4, ops: [
    { tmpl: 1, name: 'Scrap Charging', code: 'MELT-CHRG', type: 'FURNACE', seq: 1 },
    { tmpl: 2, name: 'EAF Melting', code: 'MELT-EAF', type: 'FURNACE', seq: 2 },
    { tmpl: 3, name: 'Ladle Refining', code: 'MELT-LF', type: 'FURNACE', seq: 3 },
    { tmpl: 5, name: 'Billet Casting', code: 'CAST-BILL', type: 'CASTER', seq: 4 },
  ]},
};

// ============================================================
// ORDER PROFILES: Single-stage, Multi-stage, and Mixed orders
// ============================================================
// Multi-stage = orders with line items from different processes forming a production chain
// e.g., HR Coil (Process 1) feeds into CR Sheet (Process 2)

const orderProfiles = [
  // --- SINGLE-STAGE ORDERS (10 orders) ---
  { type: 'single', items: [{ sku: 'HR-COIL-2MM', qtyRange: [80, 200] }] },
  { type: 'single', items: [{ sku: 'HR-COIL-3MM', qtyRange: [60, 180] }] },
  { type: 'single', items: [{ sku: 'HR-COIL-4MM', qtyRange: [100, 250] }] },
  { type: 'single', items: [{ sku: 'CR-SHEET-1MM', qtyRange: [40, 120] }] },
  { type: 'single', items: [{ sku: 'CR-SHEET-2MM', qtyRange: [50, 150] }] },
  { type: 'single', items: [{ sku: 'REBAR-10MM', qtyRange: [100, 300] }] },
  { type: 'single', items: [{ sku: 'REBAR-12MM', qtyRange: [80, 250] }] },
  { type: 'single', items: [{ sku: 'STEEL-BILLET-100', qtyRange: [200, 500] }] },
  { type: 'single', items: [{ sku: 'REBAR-10MM', qtyRange: [150, 350] }] },
  { type: 'single', items: [{ sku: 'HR-COIL-2MM', qtyRange: [100, 300] }] },

  // --- MULTI-STAGE ORDERS: HR Coil → CR Sheet (11 ops total) ---
  // Customer orders Cold Rolled Sheet; first stage produces Hot Rolled Coil, second stage cold-rolls it
  { type: 'multi-stage', label: 'HR→CR', items: [
    { sku: 'HR-COIL-2MM', qtyRange: [80, 160] },   // Stage 1: Hot rolling (8 ops)
    { sku: 'CR-SHEET-1MM', qtyRange: [60, 120] },   // Stage 2: Cold rolling (3 ops)
  ]},
  { type: 'multi-stage', label: 'HR→CR', items: [
    { sku: 'HR-COIL-3MM', qtyRange: [100, 200] },
    { sku: 'CR-SHEET-2MM', qtyRange: [80, 150] },
  ]},
  { type: 'multi-stage', label: 'HR→CR', items: [
    { sku: 'HR-COIL-4MM', qtyRange: [120, 220] },
    { sku: 'CR-SHEET-1MM', qtyRange: [100, 180] },
  ]},
  { type: 'multi-stage', label: 'HR→CR', items: [
    { sku: 'HR-COIL-2MM', qtyRange: [60, 140] },
    { sku: 'CR-SHEET-2MM', qtyRange: [50, 100] },
  ]},

  // --- MULTI-STAGE ORDERS: Billet → Rebar (4 + 7 = 11 ops total) ---
  // Customer orders Rebar; first stage casts billets, second stage rolls into rebar
  { type: 'multi-stage', label: 'Billet→Rebar', items: [
    { sku: 'STEEL-BILLET-100', qtyRange: [150, 300] },  // Stage 1: Billet casting (4 ops)
    { sku: 'REBAR-10MM', qtyRange: [120, 250] },        // Stage 2: Bar rolling (7 ops)
  ]},
  { type: 'multi-stage', label: 'Billet→Rebar', items: [
    { sku: 'STEEL-BILLET-100', qtyRange: [200, 400] },
    { sku: 'REBAR-12MM', qtyRange: [180, 350] },
  ]},
  { type: 'multi-stage', label: 'Billet→Rebar', items: [
    { sku: 'STEEL-BILLET-100', qtyRange: [100, 250] },
    { sku: 'REBAR-10MM', qtyRange: [80, 200] },
  ]},

  // --- MULTI-STAGE ORDERS: Full Pipeline HR → CR + Rebar (3 line items) ---
  // Large customer order requiring hot rolling, cold rolling, AND rebar production
  { type: 'multi-stage', label: 'Full Pipeline', items: [
    { sku: 'HR-COIL-2MM', qtyRange: [100, 200] },    // Stage 1: Hot rolling
    { sku: 'CR-SHEET-1MM', qtyRange: [80, 150] },     // Stage 2: Cold rolling
    { sku: 'REBAR-10MM', qtyRange: [150, 300] },      // Stage 3: Rebar
  ]},
  { type: 'multi-stage', label: 'Full Pipeline', items: [
    { sku: 'HR-COIL-3MM', qtyRange: [80, 180] },
    { sku: 'CR-SHEET-2MM', qtyRange: [60, 120] },
    { sku: 'REBAR-12MM', qtyRange: [100, 250] },
  ]},

  // --- MULTI-STAGE ORDERS: Billet + HR Coil + CR Sheet (3 different processes) ---
  { type: 'multi-stage', label: 'Triple Process', items: [
    { sku: 'STEEL-BILLET-100', qtyRange: [200, 350] },
    { sku: 'HR-COIL-4MM', qtyRange: [100, 200] },
    { sku: 'CR-SHEET-2MM', qtyRange: [80, 150] },
  ]},

  // --- MIXED ORDERS: Multiple same-process products ---
  { type: 'mixed', items: [
    { sku: 'HR-COIL-2MM', qtyRange: [60, 120] },
    { sku: 'HR-COIL-3MM', qtyRange: [80, 160] },
  ]},
  { type: 'mixed', items: [
    { sku: 'REBAR-10MM', qtyRange: [100, 200] },
    { sku: 'REBAR-12MM', qtyRange: [120, 250] },
  ]},
  { type: 'mixed', items: [
    { sku: 'CR-SHEET-1MM', qtyRange: [40, 100] },
    { sku: 'CR-SHEET-2MM', qtyRange: [60, 120] },
  ]},

  // --- LARGE MULTI-STAGE: Heavy industrial orders ---
  { type: 'multi-stage', label: 'Heavy HR→CR', items: [
    { sku: 'HR-COIL-2MM', qtyRange: [200, 350] },
    { sku: 'HR-COIL-4MM', qtyRange: [150, 300] },
    { sku: 'CR-SHEET-1MM', qtyRange: [150, 250] },
  ]},

  // --- ADDITIONAL MULTI-STAGE ORDERS ---
  // HR Coil → CR Sheet (another customer, different thicknesses)
  { type: 'multi-stage', label: 'HR→CR', items: [
    { sku: 'HR-COIL-3MM', qtyRange: [80, 150] },
    { sku: 'CR-SHEET-1MM', qtyRange: [60, 130] },
  ]},
  // Billet → Rebar (heavy construction order)
  { type: 'multi-stage', label: 'Billet→Rebar', items: [
    { sku: 'STEEL-BILLET-100', qtyRange: [300, 500] },
    { sku: 'REBAR-12MM', qtyRange: [250, 450] },
  ]},
  // Full Pipeline: all 4 processes in one order
  { type: 'multi-stage', label: 'Full Pipeline 4-Stage', items: [
    { sku: 'STEEL-BILLET-100', qtyRange: [100, 200] },
    { sku: 'HR-COIL-2MM', qtyRange: [80, 160] },
    { sku: 'CR-SHEET-2MM', qtyRange: [60, 120] },
    { sku: 'REBAR-10MM', qtyRange: [100, 200] },
  ]},
  // Mixed: HR Coil variety pack
  { type: 'mixed', items: [
    { sku: 'HR-COIL-2MM', qtyRange: [50, 100] },
    { sku: 'HR-COIL-3MM', qtyRange: [60, 120] },
    { sku: 'HR-COIL-4MM', qtyRange: [70, 140] },
  ]},
  // Multi-stage: Rebar with billet feedstock + CR Sheet
  { type: 'multi-stage', label: 'Billet+Rebar+CR', items: [
    { sku: 'STEEL-BILLET-100', qtyRange: [150, 250] },
    { sku: 'REBAR-12MM', qtyRange: [120, 200] },
    { sku: 'CR-SHEET-1MM', qtyRange: [40, 100] },
  ]},
  // Single: large billet order
  { type: 'single', items: [{ sku: 'STEEL-BILLET-100', qtyRange: [400, 600] }] },
];

// Order status distribution: 10 CREATED, 8 IN_PROGRESS, 6 COMPLETED, 3 ON_HOLD, 2 CANCELLED, 1 BLOCKED
const statuses = [
  ...Array(10).fill('CREATED'),
  ...Array(8).fill('IN_PROGRESS'),
  ...Array(6).fill('COMPLETED'),
  ...Array(3).fill('ON_HOLD'),
  ...Array(2).fill('CANCELLED'),
  ...Array(1).fill('BLOCKED'),
];

// Seeded random for reproducibility
let seed = 42;
function seededRandom() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// Shuffle statuses deterministically
for (let i = statuses.length - 1; i > 0; i--) {
  const j = Math.floor(seededRandom() * (i + 1));
  [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
}

// Starting IDs (after existing demo data)
let orderId = 16;
let lineItemId = 26;
let operationId = 94;

const orderRows = [];
const lineItemRows = [];
const operationRows = [];
const auditRows = [];

for (let i = 0; i < 30; i++) {
  const profile = orderProfiles[i];
  const orderNum = `ORD-2026-${String(orderId).padStart(3, '0')}`;
  const customer = customers[Math.floor(seededRandom() * customers.length)];
  const status = statuses[i];
  const day = 6 + Math.floor(i / 3); // Feb 6 through Feb 15
  const month = day > 28 ? 3 : 2;
  const actualDay = day > 28 ? day - 28 : day;
  const orderDate = `2026-${String(month).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;

  const typeComment = profile.type === 'multi-stage' ? ` [MULTI-STAGE: ${profile.label}]` :
                       profile.type === 'mixed' ? ' [MIXED]' : '';

  orderRows.push(`(${orderId}, '${orderNum}', '${customer.id}', '${customer.name}', '${orderDate}', '${status}', 'SYSTEM')`);
  auditRows.push(`('ORDER', ${orderId}, 'CREATE', 'Created order ${orderNum} for ${customer.name}${typeComment}', 'admin', '${orderDate} 08:00:00')`);

  if (status !== 'CREATED') {
    auditRows.push(`('ORDER', ${orderId}, 'STATUS_CHANGE', 'CREATED -> ${status}', 'admin', '${orderDate} 10:00:00')`);
  }

  // Generate line items for this order
  for (let j = 0; j < profile.items.length; j++) {
    const item = profile.items[j];
    const product = products[item.sku];
    const qty = Math.round((item.qtyRange[0] + seededRandom() * (item.qtyRange[1] - item.qtyRange[0])) / 10) * 10;
    const delDay = actualDay + 20 + Math.floor(seededRandom() * 30);
    const delMonth = delDay > 28 ? month + 1 : month;
    const actualDelDay = delDay > 28 ? delDay - 28 : delDay;
    const deliveryDate = `2026-${String(Math.min(delMonth, 6)).padStart(2, '0')}-${String(Math.min(actualDelDay, 28)).padStart(2, '0')}`;

    let lineStatus = status;

    lineItemRows.push(`(${lineItemId}, ${orderId}, '${item.sku}', '${product.name}', ${qty}, 'T', '${deliveryDate}', '${lineStatus}', 'SYSTEM')`);

    // Generate operations for the line item
    const totalOps = product.ops.length;
    let confirmedCount = 0;
    let readyOp = 0;

    if (status === 'IN_PROGRESS') {
      confirmedCount = Math.max(0, Math.floor(seededRandom() * (totalOps - 1)));
      readyOp = confirmedCount;
    } else if (status === 'COMPLETED') {
      confirmedCount = totalOps;
    }

    for (let k = 0; k < totalOps; k++) {
      const op = product.ops[k];
      let opStatus;

      if (status === 'COMPLETED') {
        opStatus = 'CONFIRMED';
      } else if (status === 'CANCELLED') {
        opStatus = 'NOT_STARTED';
      } else if (status === 'ON_HOLD') {
        opStatus = k === 0 ? 'ON_HOLD' : 'NOT_STARTED';
      } else if (status === 'BLOCKED') {
        opStatus = k === 0 ? 'BLOCKED' : 'NOT_STARTED';
      } else if (status === 'IN_PROGRESS') {
        if (k < confirmedCount) opStatus = 'CONFIRMED';
        else if (k === readyOp) opStatus = 'READY';
        else opStatus = 'NOT_STARTED';
      } else { // CREATED
        opStatus = k === 0 ? 'READY' : 'NOT_STARTED';
      }

      operationRows.push(`(${operationId}, ${product.processId}, ${lineItemId}, ${op.tmpl}, '${op.name}', '${op.code}', '${op.type}', ${op.seq}, '${opStatus}', ${qty}, 'SYSTEM')`);
      operationId++;
    }

    lineItemId++;
  }

  orderId++;
}

// Count multi-stage orders
const multiStageCount = orderProfiles.filter(p => p.type === 'multi-stage').length;
const mixedCount = orderProfiles.filter(p => p.type === 'mixed').length;
const singleCount = orderProfiles.filter(p => p.type === 'single').length;

// Generate SQL output
let sql = `
-- =====================================================
-- ADDITIONAL ORDERS (30 new orders with line items and operations)
-- Includes ${multiStageCount} multi-stage orders, ${mixedCount} mixed orders, ${singleCount} single-stage orders
-- Generated: 2026-02-09
-- =====================================================

-- Multi-stage order types:
-- HR->CR: Hot Rolled Coil (Process 1, 8 ops) feeds into Cold Rolled Sheet (Process 2, 3 ops) = 11 ops
-- Billet->Rebar: Steel Billet (Process 4, 4 ops) feeds into Rebar (Process 3, 7 ops) = 11 ops
-- Full Pipeline: HR Coil + CR Sheet + Rebar across 3 processes = 18 ops
-- Triple Process: Billet + HR Coil + CR Sheet across 3 processes
-- Heavy HR->CR: Multiple HR Coil variants + CR Sheet

-- Orders (IDs 16-45)
INSERT INTO orders (order_id, order_number, customer_id, customer_name, order_date, status, created_by) VALUES
${orderRows.join(',\n')};
ALTER TABLE orders ALTER COLUMN order_id RESTART WITH ${orderId};

-- Audit trail for new orders
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
${auditRows.join(',\n')};

-- Line Items for new orders (IDs ${26}-${lineItemId - 1})
INSERT INTO order_line_items (order_line_id, order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by) VALUES
${lineItemRows.join(',\n')};
ALTER TABLE order_line_items ALTER COLUMN order_line_id RESTART WITH ${lineItemId};

-- Operations for new line items (IDs ${94}-${operationId - 1})
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by) VALUES
${operationRows.join(',\n')};
ALTER TABLE operations ALTER COLUMN operation_id RESTART WITH ${operationId};
`;

console.log(`Generated: ${orderRows.length} orders, ${lineItemRows.length} line items, ${operationRows.length} operations`);
console.log(`  Single-stage: ${singleCount}, Multi-stage: ${multiStageCount}, Mixed: ${mixedCount}`);
console.log(`ID ranges: orders 16-${orderId-1}, lineItems 26-${lineItemId-1}, operations 94-${operationId-1}`);
console.log(`Status distribution: ${JSON.stringify(statuses.reduce((acc, s) => { acc[s] = (acc[s]||0)+1; return acc; }, {}))}`);

fs.writeFileSync(path.join(__dirname, 'generated-orders.sql'), sql.trim());
console.log('Written to e2e/generated-orders.sql');
