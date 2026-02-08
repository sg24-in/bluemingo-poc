/**
 * Fixed POC Demo Screenshots Capture Script
 * Properly waits for Angular and handles dropdowns
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const OUTPUT_DIR = path.join(__dirname, 'output', 'poc-demo-screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForAngular(page) {
  await page.waitForLoadState('networkidle');
  await delay(1000);
}

async function captureScreenshots() {
  console.log('Starting Fixed Screenshot Capture...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // ============ LOGIN ============
    console.log('1-2. Login screens...');
    await page.goto(`${BASE_URL}/#/login`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-login-page.png'), fullPage: true });

    await page.fill('input[formcontrolname="email"]', 'admin@mes.com');
    await page.fill('input[formcontrolname="password"]', 'admin123');
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-login-filled.png'), fullPage: true });

    await page.click('button[type="submit"]');
    await waitForAngular(page);

    // ============ DASHBOARD ============
    console.log('3-5. Dashboard screens...');
    await page.goto(`${BASE_URL}/#/dashboard`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-dashboard-full.png'), fullPage: true });

    // Scroll to metrics
    await page.evaluate(() => window.scrollTo(0, 300));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-dashboard-metrics.png'), fullPage: false });

    // Scroll to charts
    await page.evaluate(() => window.scrollTo(0, 800));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-dashboard-charts.png'), fullPage: false });

    // ============ ORDERS LIST ============
    console.log('6. Orders list...');
    await page.goto(`${BASE_URL}/#/orders`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-orders-list.png'), fullPage: true });

    // ============ ORDER DETAILS - Different Orders ============
    console.log('7-10. Order detail screens (different orders)...');

    // Order 1 - IN_PROGRESS
    await page.goto(`${BASE_URL}/#/orders/1`);
    await waitForAngular(page);
    await delay(1500); // Wait for chart to render
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07-order-detail-inprogress.png'), fullPage: true });

    // Scroll to see operations
    await page.evaluate(() => window.scrollTo(0, 600));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08-order-detail-operations.png'), fullPage: false });

    // Order 5 - COMPLETED
    await page.goto(`${BASE_URL}/#/orders/5`);
    await waitForAngular(page);
    await delay(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09-order-detail-completed.png'), fullPage: true });

    // Order 8 - ON_HOLD
    await page.goto(`${BASE_URL}/#/orders/8`);
    await waitForAngular(page);
    await delay(1500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10-order-detail-onhold.png'), fullPage: true });

    // ============ PRODUCTION CONFIRMATION ============
    console.log('11. Production confirmation empty...');
    await page.goto(`${BASE_URL}/#/production/confirm`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11-production-confirm-empty.png'), fullPage: true });

    // ============ INVENTORY ============
    console.log('12-14. Inventory screens...');
    await page.goto(`${BASE_URL}/#/inventory`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '12-inventory-list.png'), fullPage: true });

    // Filter AVAILABLE
    const stateSelect = await page.locator('select').first();
    await stateSelect.selectOption('AVAILABLE');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '13-inventory-available.png'), fullPage: true });

    // Filter BLOCKED
    await stateSelect.selectOption('BLOCKED');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '14-inventory-blocked.png'), fullPage: true });

    // ============ BATCHES ============
    console.log('15-16. Batches screens...');
    await page.goto(`${BASE_URL}/#/batches`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '15-batches-list.png'), fullPage: true });

    // Batch detail with genealogy
    await page.goto(`${BASE_URL}/#/batches/5`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '16-batch-detail.png'), fullPage: true });

    // ============ HOLDS ============
    console.log('17. Holds list...');
    await page.goto(`${BASE_URL}/#/holds`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '17-holds-list.png'), fullPage: true });

    // ============ EQUIPMENT ============
    console.log('18. Equipment list...');
    await page.goto(`${BASE_URL}/#/equipment`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '18-equipment-list.png'), fullPage: true });

    // ============ QUALITY ============
    console.log('19. Quality pending...');
    await page.goto(`${BASE_URL}/#/quality`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '19-quality-pending.png'), fullPage: true });

    // ============ RECEIVE MATERIAL ============
    console.log('20. Receive material...');
    await page.goto(`${BASE_URL}/#/inventory/receive`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '20-receive-material.png'), fullPage: true });

    // ============ PRODUCTION CONFIRM WITH OPERATION ============
    console.log('21-26. Production confirmation with operation selected...');

    // Navigate directly to an operation
    await page.goto(`${BASE_URL}/#/production/confirm/3`);
    await waitForAngular(page);
    await delay(2000); // Wait for form to load with operation data
    await page.screenshot({ path: path.join(OUTPUT_DIR, '21-production-with-operation.png'), fullPage: true });

    // Scroll to materials section
    await page.evaluate(() => {
      const el = document.querySelector('.materials-section, [class*="material"], .card:nth-of-type(2)');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, 400);
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '22-production-materials.png'), fullPage: false });

    // Scroll to parameters
    await page.evaluate(() => {
      const el = document.querySelector('.parameters-section, [class*="parameter"], .card:nth-of-type(3)');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, 800);
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '23-production-parameters.png'), fullPage: false });

    // Scroll to equipment/operators
    await page.evaluate(() => {
      const el = document.querySelector('.resources-section, [class*="equipment"], .card:nth-of-type(4)');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, 1200);
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '24-production-resources.png'), fullPage: false });

    // Scroll to output
    await page.evaluate(() => {
      const el = document.querySelector('.output-section, [class*="output"], .card:nth-of-type(5)');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, 1600);
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '25-production-output.png'), fullPage: false });

    // Full page of production form
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(300);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '26-production-full-form.png'), fullPage: true });

    // ============ BATCH GENEALOGY DETAILS ============
    console.log('27-28. Batch genealogy...');

    // Find a batch with parents
    await page.goto(`${BASE_URL}/#/batches/10`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '27-batch-with-genealogy.png'), fullPage: true });

    // Different batch
    await page.goto(`${BASE_URL}/#/batches/15`);
    await waitForAngular(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '28-batch-genealogy-2.png'), fullPage: true });

    // ============ ORDER PROCESS FLOW CHART ============
    console.log('29. Order process flow chart...');
    await page.goto(`${BASE_URL}/#/orders/1`);
    await waitForAngular(page);
    await delay(2000); // Wait for ECharts to render

    // Focus on the chart
    await page.evaluate(() => {
      const chart = document.querySelector('.process-flow-container, [class*="echarts"], canvas');
      if (chart) chart.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '29-order-process-chart.png'), fullPage: false });

    // ============ ORDERS FILTERED BY STATUS ============
    console.log('30-32. Orders filtered by status...');
    await page.goto(`${BASE_URL}/#/orders`);
    await waitForAngular(page);

    // Get the status select
    const orderStatusSelect = await page.locator('select').first();

    // IN_PROGRESS
    await orderStatusSelect.selectOption('IN_PROGRESS');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '30-orders-in-progress.png'), fullPage: true });

    // COMPLETED
    await orderStatusSelect.selectOption('COMPLETED');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '31-orders-completed.png'), fullPage: true });

    // ON_HOLD
    await orderStatusSelect.selectOption('ON_HOLD');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '32-orders-on-hold.png'), fullPage: true });

    // ============ BATCHES FILTERED ============
    console.log('33-34. Batches filtered...');
    await page.goto(`${BASE_URL}/#/batches`);
    await waitForAngular(page);

    const batchStatusSelect = await page.locator('select').first();

    await batchStatusSelect.selectOption('AVAILABLE');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '33-batches-available.png'), fullPage: true });

    await batchStatusSelect.selectOption('CONSUMED');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '34-batches-consumed.png'), fullPage: true });

    // ============ LINE ITEMS DETAIL ============
    console.log('35. Order line items...');
    await page.goto(`${BASE_URL}/#/orders/1`);
    await waitForAngular(page);
    await delay(1500);

    // Scroll to line items
    await page.evaluate(() => {
      const lineItems = document.querySelector('.line-items-section, [class*="line-item"]');
      if (lineItems) lineItems.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, 700);
    });
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '35-order-line-items.png'), fullPage: false });

    console.log('\n===========================================');
    console.log('Screenshot capture complete!');
    console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
    console.log('===========================================\n');

    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).sort();
    console.log(`Total ${files.length} screenshots.`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
