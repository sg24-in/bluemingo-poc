/**
 * Enhanced POC Demo Screenshots Capture Script
 * Captures additional flow screenshots for MES-POC-Demo-Document.md
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const OUTPUT_DIR = path.join(__dirname, 'output', 'poc-demo-screenshots');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureEnhancedScreenshots() {
  console.log('Starting Enhanced POC Demo Screenshot Capture...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // LOGIN
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/#/login`);
    await delay(1000);
    await page.fill('input[type="email"], input[formcontrolname="email"]', 'admin@mes.com');
    await page.fill('input[type="password"], input[formcontrolname="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await delay(2000);

    // ============ DASHBOARD ENHANCED ============
    console.log('21. Capturing Dashboard - Needs Attention Section...');
    await page.goto(`${BASE_URL}/#/dashboard`);
    await delay(2000);

    // Scroll to show Needs Attention section
    await page.evaluate(() => {
      const needsAttention = document.querySelector('.needs-attention, .alerts-section, [class*="attention"]');
      if (needsAttention) needsAttention.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '21-dashboard-needs-attention.png'), fullPage: false });

    // Quick Actions section
    console.log('22. Capturing Dashboard - Quick Actions...');
    await page.evaluate(() => {
      const quickActions = document.querySelector('.quick-actions, [class*="quick-action"]');
      if (quickActions) quickActions.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '22-dashboard-quick-actions.png'), fullPage: false });

    // ============ ORDER DETAIL - PROCESS FLOW ============
    console.log('23. Capturing Order Detail - Process Flow Chart...');
    await page.goto(`${BASE_URL}/#/orders/1`);
    await delay(2500);

    // Focus on process flow chart
    await page.evaluate(() => {
      const processFlow = document.querySelector('.process-flow-container, [class*="echarts"], [class*="chart"]');
      if (processFlow) processFlow.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '23-order-process-flow.png'), fullPage: false });

    // Line items expanded view
    console.log('24. Capturing Order Detail - Line Items Expanded...');
    await page.evaluate(() => {
      const lineItems = document.querySelector('.line-items-section, [class*="line-item"]');
      if (lineItems) lineItems.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '24-order-line-items.png'), fullPage: false });

    // ============ PRODUCTION CONFIRMATION FLOW ============
    console.log('25. Capturing Production Confirm - Order Selected...');
    await page.goto(`${BASE_URL}/#/production/confirm`);
    await delay(2000);

    // Select first available order
    const orderSelect = await page.$('select[formcontrolname="orderId"], select#orderId, select:first-of-type');
    if (orderSelect) {
      const options = await orderSelect.$$('option');
      if (options.length > 1) {
        await orderSelect.selectOption({ index: 1 });
        await delay(1500);
      }
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '25-production-order-selected.png'), fullPage: true });

    // Select operation
    console.log('26. Capturing Production Confirm - Operation Selected...');
    const operationSelect = await page.$('select[formcontrolname="operationId"], select#operationId, select:nth-of-type(2)');
    if (operationSelect) {
      const options = await operationSelect.$$('option');
      if (options.length > 1) {
        await operationSelect.selectOption({ index: 1 });
        await delay(1500);
      }
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '26-production-operation-selected.png'), fullPage: true });

    // Material consumption section
    console.log('27. Capturing Production Confirm - Materials Section...');
    await page.evaluate(() => {
      const materials = document.querySelector('[class*="material"], [class*="consumption"], .available-materials');
      if (materials) materials.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '27-production-materials.png'), fullPage: false });

    // Process parameters section
    console.log('28. Capturing Production Confirm - Process Parameters...');
    await page.evaluate(() => {
      const params = document.querySelector('[class*="parameter"], [class*="process-param"], .parameters-section');
      if (params) params.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '28-production-parameters.png'), fullPage: false });

    // Equipment and Operator section
    console.log('29. Capturing Production Confirm - Equipment & Operators...');
    await page.evaluate(() => {
      const equipment = document.querySelector('[class*="equipment"], [class*="operator"], .resources-section');
      if (equipment) equipment.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '29-production-equipment-operators.png'), fullPage: false });

    // Output section with batch preview
    console.log('30. Capturing Production Confirm - Output & Batch Preview...');
    await page.evaluate(() => {
      const output = document.querySelector('[class*="output"], [class*="batch-preview"], .output-section');
      if (output) output.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '30-production-output-preview.png'), fullPage: false });

    // ============ BATCH GENEALOGY ============
    console.log('31. Capturing Batch Detail - Parent Batches...');
    await page.goto(`${BASE_URL}/#/batches/5`);  // Try a batch that might have parents
    await delay(2000);

    // Genealogy section - parents
    await page.evaluate(() => {
      const genealogy = document.querySelector('[class*="genealogy"], [class*="parent"], .genealogy-section');
      if (genealogy) genealogy.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '31-batch-genealogy-parents.png'), fullPage: false });

    // Try another batch for children
    console.log('32. Capturing Batch Detail - Child Batches...');
    await page.goto(`${BASE_URL}/#/batches/1`);  // First batch might have children
    await delay(2000);
    await page.evaluate(() => {
      const children = document.querySelector('[class*="child"], [class*="genealogy"], .children-section');
      if (children) children.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '32-batch-genealogy-children.png'), fullPage: false });

    // ============ INVENTORY ACTIONS ============
    console.log('33. Capturing Inventory - Type Filter (RM)...');
    await page.goto(`${BASE_URL}/#/inventory`);
    await delay(2000);

    // Filter by RM type
    const typeSelect = await page.$('select[formcontrolname="type"], select#type, select:has(option[value="RM"])');
    if (typeSelect) {
      await typeSelect.selectOption('RM');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '33-inventory-type-rm.png'), fullPage: true });

    // Filter by FG type
    console.log('34. Capturing Inventory - Type Filter (FG)...');
    if (typeSelect) {
      await typeSelect.selectOption('FG');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '34-inventory-type-fg.png'), fullPage: true });

    // ============ HOLDS FLOW ============
    console.log('35. Capturing Holds - Apply Hold Button...');
    await page.goto(`${BASE_URL}/#/holds`);
    await delay(2000);

    // Look for Apply Hold button
    const applyHoldBtn = await page.$('button:has-text("Apply Hold"), button:has-text("Add Hold"), .btn-primary:has-text("Hold")');
    if (applyHoldBtn) {
      await applyHoldBtn.click();
      await delay(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '35-holds-apply-modal.png'), fullPage: false });

      // Close modal
      const closeBtn = await page.$('button:has-text("Cancel"), button:has-text("Close"), .modal-close, .btn-secondary');
      if (closeBtn) await closeBtn.click();
      await delay(500);
    }

    // Filter by entity type
    console.log('36. Capturing Holds - Filter by BATCH...');
    const entityTypeSelect = await page.$('select[formcontrolname="entityType"], select#entityType, select:has(option[value="BATCH"])');
    if (entityTypeSelect) {
      await entityTypeSelect.selectOption('BATCH');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '36-holds-filter-batch.png'), fullPage: true });

    // Filter by OPERATION
    console.log('37. Capturing Holds - Filter by OPERATION...');
    if (entityTypeSelect) {
      await entityTypeSelect.selectOption('OPERATION');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '37-holds-filter-operation.png'), fullPage: true });

    // ============ EQUIPMENT STATUS FILTERS ============
    console.log('38. Capturing Equipment - Filter by MAINTENANCE...');
    await page.goto(`${BASE_URL}/#/equipment`);
    await delay(2000);

    const statusSelect = await page.$('select[formcontrolname="status"], select#status, select:has(option[value="MAINTENANCE"])');
    if (statusSelect) {
      await statusSelect.selectOption('MAINTENANCE');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '38-equipment-maintenance.png'), fullPage: true });

    // Filter by IN_USE
    console.log('39. Capturing Equipment - Filter by IN_USE...');
    if (statusSelect) {
      await statusSelect.selectOption('IN_USE');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '39-equipment-in-use.png'), fullPage: true });

    // ============ BATCHES STATUS FILTERS ============
    console.log('40. Capturing Batches - Filter by QUALITY_PENDING...');
    await page.goto(`${BASE_URL}/#/batches`);
    await delay(2000);

    const batchStatusSelect = await page.$('select[formcontrolname="status"], select#status, select:has(option[value="QUALITY_PENDING"])');
    if (batchStatusSelect) {
      await batchStatusSelect.selectOption('QUALITY_PENDING');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '40-batches-quality-pending.png'), fullPage: true });

    // Filter by AVAILABLE
    console.log('41. Capturing Batches - Filter by AVAILABLE...');
    if (batchStatusSelect) {
      await batchStatusSelect.selectOption('AVAILABLE');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '41-batches-available.png'), fullPage: true });

    // ============ ORDER STATUS FILTERS ============
    console.log('42. Capturing Orders - Filter by IN_PROGRESS...');
    await page.goto(`${BASE_URL}/#/orders`);
    await delay(2000);

    const orderStatusSelect = await page.$('select[formcontrolname="status"], select#status, select:has(option[value="IN_PROGRESS"])');
    if (orderStatusSelect) {
      await orderStatusSelect.selectOption('IN_PROGRESS');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '42-orders-in-progress.png'), fullPage: true });

    // Filter by COMPLETED
    console.log('43. Capturing Orders - Filter by COMPLETED...');
    if (orderStatusSelect) {
      await orderStatusSelect.selectOption('COMPLETED');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '43-orders-completed.png'), fullPage: true });

    // Filter by ON_HOLD
    console.log('44. Capturing Orders - Filter by ON_HOLD...');
    if (orderStatusSelect) {
      await orderStatusSelect.selectOption('ON_HOLD');
      await delay(1000);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '44-orders-on-hold.png'), fullPage: true });

    // ============ RECEIVE MATERIAL FORM FILLED ============
    console.log('45. Capturing Receive Material - Form Filled...');
    await page.goto(`${BASE_URL}/#/inventory/receive`);
    await delay(2000);

    // Fill in some fields
    const materialSelect = await page.$('select[formcontrolname="materialId"], select#materialId, select:first-of-type');
    if (materialSelect) {
      const options = await materialSelect.$$('option');
      if (options.length > 1) {
        await materialSelect.selectOption({ index: 1 });
        await delay(500);
      }
    }

    const qtyInput = await page.$('input[formcontrolname="quantity"], input#quantity, input[type="number"]:first-of-type');
    if (qtyInput) {
      await qtyInput.fill('100');
    }

    const locationInput = await page.$('input[formcontrolname="location"], input#location, input[placeholder*="location" i]');
    if (locationInput) {
      await locationInput.fill('Warehouse A - Bay 3');
    }

    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '45-receive-material-filled.png'), fullPage: true });

    console.log('\n===========================================');
    console.log('Enhanced screenshot capture complete!');
    console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
    console.log('===========================================\n');

    // List all captured files
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).sort();
    console.log(`Total ${files.length} screenshots:`);
    files.forEach(f => console.log(`  - ${f}`));

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

captureEnhancedScreenshots();
