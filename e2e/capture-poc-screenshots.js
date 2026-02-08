/**
 * POC Demo Screenshots Capture Script
 * Captures screenshots for MES-POC-Demo-Document.md
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

async function captureScreenshots() {
  console.log('Starting POC Demo Screenshot Capture...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. LOGIN SCREEN
    console.log('1. Capturing Login Screen...');
    await page.goto(`${BASE_URL}/#/login`);
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-login-page.png'), fullPage: true });

    // Fill credentials
    await page.fill('input[type="email"], input[formcontrolname="email"]', 'admin@mes.com');
    await page.fill('input[type="password"], input[formcontrolname="password"]', 'admin123');
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-login-filled.png'), fullPage: true });

    // Login
    await page.click('button[type="submit"]');
    await delay(2000);

    // 2. DASHBOARD
    console.log('2. Capturing Dashboard...');
    await page.goto(`${BASE_URL}/#/dashboard`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-dashboard-full.png'), fullPage: true });

    // Scroll to show different sections
    await page.evaluate(() => window.scrollTo(0, 500));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-dashboard-metrics.png'), fullPage: false });

    await page.evaluate(() => window.scrollTo(0, 1000));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-dashboard-charts.png'), fullPage: false });

    // 3. ORDERS LIST
    console.log('3. Capturing Orders List...');
    await page.goto(`${BASE_URL}/#/orders`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-orders-list.png'), fullPage: true });

    // 4. ORDER DETAIL - IN_PROGRESS order
    console.log('4. Capturing Order Detail (IN_PROGRESS)...');
    await page.goto(`${BASE_URL}/#/orders/1`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07-order-detail-inprogress.png'), fullPage: true });

    // Scroll to show operations
    await page.evaluate(() => window.scrollTo(0, 600));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08-order-detail-operations.png'), fullPage: false });

    // 5. ORDER DETAIL - COMPLETED order
    console.log('5. Capturing Order Detail (COMPLETED)...');
    await page.goto(`${BASE_URL}/#/orders/5`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09-order-detail-completed.png'), fullPage: true });

    // 6. ORDER DETAIL - ON_HOLD order
    console.log('6. Capturing Order Detail (ON_HOLD)...');
    await page.goto(`${BASE_URL}/#/orders/8`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10-order-detail-onhold.png'), fullPage: true });

    // 7. PRODUCTION CONFIRMATION
    console.log('7. Capturing Production Confirmation...');
    await page.goto(`${BASE_URL}/#/production/confirm`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11-production-confirm-empty.png'), fullPage: true });

    // 8. INVENTORY LIST
    console.log('8. Capturing Inventory List...');
    await page.goto(`${BASE_URL}/#/inventory`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '12-inventory-list.png'), fullPage: true });

    // Filter by AVAILABLE
    await page.selectOption('select', 'AVAILABLE');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '13-inventory-available.png'), fullPage: true });

    // Filter by BLOCKED
    await page.selectOption('select', 'BLOCKED');
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '14-inventory-blocked.png'), fullPage: true });

    // 9. BATCHES LIST
    console.log('9. Capturing Batches List...');
    await page.goto(`${BASE_URL}/#/batches`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '15-batches-list.png'), fullPage: true });

    // 10. BATCH DETAIL with Genealogy
    console.log('10. Capturing Batch Detail...');
    await page.goto(`${BASE_URL}/#/batches/1`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '16-batch-detail.png'), fullPage: true });

    // 11. HOLDS LIST
    console.log('11. Capturing Holds List...');
    await page.goto(`${BASE_URL}/#/holds`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '17-holds-list.png'), fullPage: true });

    // 12. EQUIPMENT LIST
    console.log('12. Capturing Equipment List...');
    await page.goto(`${BASE_URL}/#/equipment`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '18-equipment-list.png'), fullPage: true });

    // 13. QUALITY PAGE
    console.log('13. Capturing Quality Page...');
    await page.goto(`${BASE_URL}/#/quality`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '19-quality-pending.png'), fullPage: true });

    // 14. RECEIVE MATERIAL
    console.log('14. Capturing Receive Material...');
    await page.goto(`${BASE_URL}/#/inventory/receive`);
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '20-receive-material.png'), fullPage: true });

    console.log('\n===========================================');
    console.log('Screenshot capture complete!');
    console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
    console.log('===========================================\n');

    // List all captured files
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    console.log(`Captured ${files.length} screenshots:`);
    files.forEach(f => console.log(`  - ${f}`));

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
