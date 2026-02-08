/**
 * Capture Remaining Screenshots
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const OUTPUT_DIR = path.join(__dirname, 'output', 'poc-demo-screenshots');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureRemaining() {
  console.log('Capturing remaining screenshots...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // LOGIN
    await page.goto(`${BASE_URL}/#/login`);
    await delay(1000);
    await page.fill('input[type="email"], input[formcontrolname="email"]', 'admin@mes.com');
    await page.fill('input[type="password"], input[formcontrolname="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await delay(2000);

    // 34. Inventory - FG type
    console.log('34. Capturing Inventory - Type Filter (FG)...');
    await page.goto(`${BASE_URL}/#/inventory`);
    await delay(2000);
    // Try different selectors for the type filter
    try {
      await page.selectOption('select', { label: 'FG' });
    } catch (e) {
      try {
        await page.selectOption('select:nth-of-type(2)', 'FG');
      } catch (e2) {
        console.log('Could not find FG filter, using current view');
      }
    }
    await delay(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '34-inventory-type-fg.png'), fullPage: true });

    // 35. Holds - Apply Hold button click
    console.log('35. Capturing Holds - Apply Hold Modal...');
    await page.goto(`${BASE_URL}/#/holds`);
    await delay(2000);

    // Try to click Apply Hold button
    try {
      await page.click('button:has-text("Apply"), a:has-text("Apply")');
      await delay(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '35-holds-apply-modal.png'), fullPage: false });

      // Try to close modal
      try {
        await page.click('button:has-text("Cancel"), .close, [aria-label="Close"]');
      } catch (e) {
        await page.keyboard.press('Escape');
      }
      await delay(500);
    } catch (e) {
      console.log('Apply Hold button not found, capturing current view');
      await page.screenshot({ path: path.join(OUTPUT_DIR, '35-holds-apply-modal.png'), fullPage: true });
    }

    // 36. Holds - Filter Active
    console.log('36. Capturing Holds - Filter Active...');
    try {
      await page.selectOption('select', 'ACTIVE');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '36-holds-filter-active.png'), fullPage: true });

    // 37. Holds - Filter Released
    console.log('37. Capturing Holds - Filter Released...');
    try {
      await page.selectOption('select', 'RELEASED');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '37-holds-filter-released.png'), fullPage: true });

    // 38. Equipment - Maintenance
    console.log('38. Capturing Equipment - Maintenance...');
    await page.goto(`${BASE_URL}/#/equipment`);
    await delay(2000);
    try {
      await page.selectOption('select', 'MAINTENANCE');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '38-equipment-maintenance.png'), fullPage: true });

    // 39. Equipment - Available
    console.log('39. Capturing Equipment - Available...');
    try {
      await page.selectOption('select', 'AVAILABLE');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '39-equipment-available.png'), fullPage: true });

    // 40. Batches - Quality Pending
    console.log('40. Capturing Batches - Quality Pending...');
    await page.goto(`${BASE_URL}/#/batches`);
    await delay(2000);
    try {
      await page.selectOption('select', 'QUALITY_PENDING');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '40-batches-quality-pending.png'), fullPage: true });

    // 41. Batches - Available
    console.log('41. Capturing Batches - Available...');
    try {
      await page.selectOption('select', 'AVAILABLE');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '41-batches-available.png'), fullPage: true });

    // 42. Orders - In Progress
    console.log('42. Capturing Orders - In Progress...');
    await page.goto(`${BASE_URL}/#/orders`);
    await delay(2000);
    try {
      await page.selectOption('select', 'IN_PROGRESS');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '42-orders-in-progress.png'), fullPage: true });

    // 43. Orders - Completed
    console.log('43. Capturing Orders - Completed...');
    try {
      await page.selectOption('select', 'COMPLETED');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '43-orders-completed.png'), fullPage: true });

    // 44. Orders - On Hold
    console.log('44. Capturing Orders - On Hold...');
    try {
      await page.selectOption('select', 'ON_HOLD');
      await delay(1000);
    } catch (e) {
      console.log('Status filter not found');
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, '44-orders-on-hold.png'), fullPage: true });

    // 45. Receive Material - Filled
    console.log('45. Capturing Receive Material - Filled...');
    await page.goto(`${BASE_URL}/#/inventory/receive`);
    await delay(2000);

    // Fill form fields
    try {
      const selects = await page.$$('select');
      if (selects.length > 0) {
        const options = await selects[0].$$('option');
        if (options.length > 1) {
          await selects[0].selectOption({ index: 1 });
        }
      }
    } catch (e) {
      console.log('Material select not found');
    }

    try {
      const inputs = await page.$$('input[type="number"], input[type="text"]');
      for (const input of inputs) {
        const placeholder = await input.getAttribute('placeholder');
        const name = await input.getAttribute('name');
        const formControl = await input.getAttribute('formcontrolname');

        if (formControl === 'quantity' || name === 'quantity' || (placeholder && placeholder.toLowerCase().includes('quantity'))) {
          await input.fill('100');
        } else if (formControl === 'location' || name === 'location' || (placeholder && placeholder.toLowerCase().includes('location'))) {
          await input.fill('Warehouse A - Bay 3');
        } else if (formControl === 'supplierBatch' || name === 'supplierBatch') {
          await input.fill('SUP-2026-001');
        }
      }
    } catch (e) {
      console.log('Input fields not found');
    }

    await delay(500);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '45-receive-material-filled.png'), fullPage: true });

    console.log('\n===========================================');
    console.log('Remaining screenshots captured!');
    console.log('===========================================\n');

    // List all captured files
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).sort();
    console.log(`Total ${files.length} screenshots.`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureRemaining();
