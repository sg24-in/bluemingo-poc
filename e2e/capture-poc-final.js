/**
 * Final POC Screenshots - Only what's needed for the demo document
 * Waits properly for Angular to load
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const OUTPUT_DIR = path.join(__dirname, 'output', 'poc-demo-screenshots');

// Clear and recreate output directory
if (fs.existsSync(OUTPUT_DIR)) {
  fs.readdirSync(OUTPUT_DIR).forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
} else {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForPageReady(page) {
  await page.waitForLoadState('networkidle');
  // Wait for Angular to settle
  await delay(2000);
  // Wait for any spinners to disappear
  try {
    await page.waitForSelector('.spinner, .loading, [class*="loading"]', { state: 'hidden', timeout: 5000 });
  } catch (e) {
    // No spinner found, that's fine
  }
}

async function captureScreenshots() {
  console.log('===========================================');
  console.log('POC Demo Screenshots Capture');
  console.log('===========================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100 // Slow down actions for stability
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // ========== SCREEN 1: LOGIN ==========
    console.log('[1/14] Login page...');
    await page.goto(`${BASE_URL}/#/login`);
    await waitForPageReady(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-login-page.png'), fullPage: true });

    console.log('[2/14] Login with credentials...');
    await page.fill('input[formcontrolname="email"], input[type="email"]', 'admin@mes.com');
    await page.fill('input[formcontrolname="password"], input[type="password"]', 'admin123');
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-login-filled.png'), fullPage: true });

    // Login
    await page.click('button[type="submit"]');
    await waitForPageReady(page);

    // ========== SCREEN 2: DASHBOARD ==========
    console.log('[3/14] Dashboard...');
    await page.goto(`${BASE_URL}/#/dashboard`);
    await waitForPageReady(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-dashboard-full.png'), fullPage: true });

    // ========== ORDERS LIST ==========
    console.log('[4/14] Orders list...');
    await page.goto(`${BASE_URL}/#/orders`);
    await waitForPageReady(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-orders-list.png'), fullPage: true });

    // ========== ORDER DETAIL ==========
    console.log('[5/14] Order detail...');
    await page.goto(`${BASE_URL}/#/orders/1`);
    await waitForPageReady(page);
    // Extra wait for chart to render
    await delay(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07-order-detail-inprogress.png'), fullPage: true });

    // ========== SCREEN 3: PRODUCTION CONFIRMATION ==========
    console.log('[6/14] Production form (empty)...');
    await page.goto(`${BASE_URL}/#/production/confirm`);
    await waitForPageReady(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11-production-confirm-empty.png'), fullPage: true });

    // Navigate to production with a specific operation
    console.log('[7/14] Production with operation...');
    // First try operation 3, if not available try others
    let operationFound = false;
    for (const opId of [3, 5, 7, 10, 15]) {
      await page.goto(`${BASE_URL}/#/production/confirm/${opId}`);
      await waitForPageReady(page);

      // Check if the page loaded with operation data
      const hasOperation = await page.locator('text=Operation').count() > 0;
      if (hasOperation) {
        operationFound = true;
        break;
      }
    }

    await page.screenshot({ path: path.join(OUTPUT_DIR, '21-production-with-operation.png'), fullPage: true });

    // Scroll to materials section
    console.log('[8/14] Materials section...');
    await page.evaluate(() => window.scrollTo(0, 400));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '22-production-materials.png'), fullPage: false });

    // Scroll to parameters section
    console.log('[9/14] Parameters section...');
    await page.evaluate(() => window.scrollTo(0, 800));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '23-production-parameters.png'), fullPage: false });

    // Scroll to equipment/operators section
    console.log('[10/14] Resources section...');
    await page.evaluate(() => window.scrollTo(0, 1200));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '24-production-resources.png'), fullPage: false });

    // Scroll to output section
    console.log('[11/14] Output section...');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '25-production-output.png'), fullPage: false });

    // ========== SCREEN 4: TRACEABILITY ==========
    console.log('[12/14] Batches list...');
    await page.goto(`${BASE_URL}/#/batches`);
    await waitForPageReady(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '15-batches-list.png'), fullPage: true });

    // Batch detail - try to find one with genealogy
    console.log('[13/14] Batch detail...');
    await page.goto(`${BASE_URL}/#/batches/1`);
    await waitForPageReady(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '16-batch-detail.png'), fullPage: true });

    // Try another batch that might have more genealogy
    console.log('[14/14] Batch with genealogy...');
    await page.goto(`${BASE_URL}/#/batches/10`);
    await waitForPageReady(page);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '27-batch-with-genealogy.png'), fullPage: true });

    console.log('\n===========================================');
    console.log('Screenshot capture complete!');
    console.log(`Output: ${OUTPUT_DIR}`);
    console.log('===========================================\n');

    // List captured files
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).sort();
    console.log(`Captured ${files.length} screenshots:`);
    files.forEach(f => console.log(`  - ${f}`));

  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
