/**
 * Capture Production Form Sections Properly
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const OUTPUT_DIR = path.join(__dirname, 'output', 'poc-demo-screenshots');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureProductionSections() {
  console.log('Capturing Production Form Sections...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Login first
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/#/login`);
    await page.waitForLoadState('networkidle');
    await delay(1000);

    await page.fill('input[formcontrolname="email"]', 'admin@mes.com');
    await page.fill('input[formcontrolname="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await delay(2000);

    // Go to production confirmation with an operation
    console.log('Navigating to Production Confirmation...');

    // Try to find a READY operation by going through orders
    await page.goto(`${BASE_URL}/#/orders/1`);
    await page.waitForLoadState('networkidle');
    await delay(2000);

    // Look for Start Production button and click it
    const startProdBtn = await page.$('button:has-text("Start Production"), a:has-text("Start Production")');
    if (startProdBtn) {
      console.log('Found Start Production button, clicking...');
      await startProdBtn.click();
      await page.waitForLoadState('networkidle');
      await delay(3000);
    } else {
      // Fallback: go directly to production/confirm
      console.log('No Start Production button, going to /production/confirm...');
      await page.goto(`${BASE_URL}/#/production/confirm`);
      await page.waitForLoadState('networkidle');
      await delay(2000);
    }

    // Check if we have the form loaded
    const pageContent = await page.content();
    console.log('Page loaded, checking for form elements...');

    // Take full page screenshot first
    console.log('\n[1/6] Full production form...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '21-production-with-operation.png'),
      fullPage: true
    });

    // Now capture each section by finding card headers
    const cards = await page.$$('.card');
    console.log(`Found ${cards.length} card sections`);

    // Capture Material Consumption section
    console.log('\n[2/6] Material Consumption section...');
    const materialSection = await page.$('.card:has-text("Material Consumption"), .card:has-text("Available Materials")');
    if (materialSection) {
      await materialSection.scrollIntoViewIfNeeded();
      await delay(500);
      // Get bounding box and take screenshot of that area
      const box = await materialSection.boundingBox();
      if (box) {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '22-production-materials.png'),
          clip: { x: 0, y: Math.max(0, box.y - 50), width: 1920, height: Math.min(800, box.height + 100) }
        });
      }
    } else {
      // Scroll down and capture
      await page.evaluate(() => window.scrollTo(0, 400));
      await delay(500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '22-production-materials.png'),
        fullPage: false
      });
    }

    // Capture Process Parameters section
    console.log('\n[3/6] Process Parameters section...');
    const paramSection = await page.$('.card:has-text("Process Parameters")');
    if (paramSection) {
      await paramSection.scrollIntoViewIfNeeded();
      await delay(500);
      const box = await paramSection.boundingBox();
      if (box) {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '23-production-parameters.png'),
          clip: { x: 0, y: Math.max(0, box.y - 50), width: 1920, height: Math.min(600, box.height + 100) }
        });
      }
    } else {
      await page.evaluate(() => window.scrollTo(0, 900));
      await delay(500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '23-production-parameters.png'),
        fullPage: false
      });
    }

    // Capture Equipment & Operators section
    console.log('\n[4/6] Equipment & Operators section...');
    const equipSection = await page.$('.card:has-text("Equipment"), .card:has-text("Operator")');
    if (equipSection) {
      await equipSection.scrollIntoViewIfNeeded();
      await delay(500);
      const box = await equipSection.boundingBox();
      if (box) {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '24-production-resources.png'),
          clip: { x: 0, y: Math.max(0, box.y - 50), width: 1920, height: Math.min(600, box.height + 100) }
        });
      }
    } else {
      await page.evaluate(() => window.scrollTo(0, 1400));
      await delay(500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '24-production-resources.png'),
        fullPage: false
      });
    }

    // Capture Output/Quantities section
    console.log('\n[5/6] Production Output section...');
    const outputSection = await page.$('.card:has-text("Quantities"), .card:has-text("Output"), .card:has-text("Produced")');
    if (outputSection) {
      await outputSection.scrollIntoViewIfNeeded();
      await delay(500);
      const box = await outputSection.boundingBox();
      if (box) {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '25-production-output.png'),
          clip: { x: 0, y: Math.max(0, box.y - 50), width: 1920, height: Math.min(600, box.height + 100) }
        });
      }
    } else {
      await page.evaluate(() => window.scrollTo(0, 1800));
      await delay(500);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '25-production-output.png'),
        fullPage: false
      });
    }

    // Capture the Confirm button area
    console.log('\n[6/6] Confirm button area...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '26-production-confirm-button.png'),
      fullPage: false
    });

    console.log('\n===========================================');
    console.log('Production screenshots captured!');
    console.log('===========================================\n');

    // Verify file sizes
    const files = ['21-production-with-operation.png', '22-production-materials.png',
                   '23-production-parameters.png', '24-production-resources.png',
                   '25-production-output.png', '26-production-confirm-button.png'];

    console.log('File sizes:');
    for (const file of files) {
      const filePath = path.join(OUTPUT_DIR, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ${file}: ${Math.round(stats.size/1024)} KB`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureProductionSections();
