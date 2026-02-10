/**
 * MES System Guide - Screenshot Capture Script
 *
 * Captures screenshots of every page for the MES System Guide documentation.
 * Organized by section: Master Data, Design Phase, Production Workflow.
 *
 * Usage:
 *   node e2e/capture-system-guide-screenshots.js
 *
 * Prerequisites:
 *   - Backend running: cd backend && gradlew bootRun --args="--spring.profiles.active=demo"
 *   - Frontend running: cd frontend && npm start
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('./config/playwright.config');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outputDir = path.join(__dirname, 'output', 'system-guide-screenshots', timestamp);

let screenshotCounter = 0;

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function capture(page, sectionDir, name, options = {}) {
    screenshotCounter++;
    const paddedNum = String(screenshotCounter).padStart(3, '0');
    const sanitizedName = name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const filename = `${paddedNum}-${sanitizedName}.png`;
    const fullDir = path.join(outputDir, sectionDir);
    ensureDir(fullDir);
    const filepath = path.join(fullDir, filename);

    await page.screenshot({
        path: filepath,
        fullPage: options.fullPage || false
    });

    console.log(`   [${paddedNum}] ${sectionDir}/${filename}`);
    return filepath;
}

async function waitForPage(page, timeout = 1500) {
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(timeout);
}

async function login(page) {
    await page.goto(`${config.baseUrl}/#/login`, { waitUntil: 'networkidle' });
    await page.fill('input[formControlName="email"]', config.credentials.admin.email);
    await page.fill('input[formControlName="password"]', config.credentials.admin.password);

    const [response] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }),
        page.click('button[type="submit"]')
    ]);

    if (response.status() === 200) {
        const loginData = await response.json();
        await page.evaluate((data) => {
            localStorage.setItem('mes_token', data.accessToken);
            localStorage.setItem('mes_user', JSON.stringify(data.user));
        }, loginData);
        console.log('   Login successful');
    } else {
        throw new Error('Login failed');
    }
}

async function main() {
    console.log('='.repeat(70));
    console.log('MES SYSTEM GUIDE - SCREENSHOT CAPTURE');
    console.log('='.repeat(70));
    console.log(`Output: ${outputDir}`);
    console.log('='.repeat(70));

    const browser = await chromium.launch({
        headless: config.browser.headless,
        args: config.browser.args,
    });

    const context = await browser.newContext({
        viewport: config.viewport,
        deviceScaleFactor: config.viewport.deviceScaleFactor
    });

    const page = await context.newPage();

    // Auto-accept dialogs
    page.on('dialog', async dialog => {
        console.log(`   Dialog: ${dialog.message()}`);
        await dialog.accept();
    });

    try {
        // =============================================
        // SECTION 0: LOGIN
        // =============================================
        console.log('\n--- SECTION 0: LOGIN ---');

        await page.goto(`${config.baseUrl}/#/login`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '00-login', 'login-page-empty');

        await page.fill('input[formControlName="email"]', config.credentials.admin.email);
        await page.fill('input[formControlName="password"]', config.credentials.admin.password);
        await capture(page, '00-login', 'login-credentials-entered');

        await login(page);
        await page.goto(`${config.baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '00-login', 'login-success-dashboard');

        // =============================================
        // SECTION 1: MASTER DATA - CUSTOMERS
        // =============================================
        console.log('\n--- SECTION 1: MASTER DATA ---');

        // Customers
        await page.goto(`${config.baseUrl}/#/manage/customers`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '01-master-data', 'customer-list');

        const customerNewBtn = page.locator('a:has-text("New Customer"), a:has-text("Add Customer"), button:has-text("New"), a[routerLink*="new"]');
        if (await customerNewBtn.first().isVisible({ timeout: 2000 })) {
            await customerNewBtn.first().click();
            await waitForPage(page);
            await capture(page, '01-master-data', 'customer-create-form');
            await page.goBack();
            await waitForPage(page);
        }

        // Click first customer row for detail
        const customerRow = page.locator('table tbody tr').first();
        if (await customerRow.isVisible({ timeout: 2000 })) {
            await customerRow.click();
            await waitForPage(page);
            await capture(page, '01-master-data', 'customer-detail');
            await page.goBack();
            await waitForPage(page);
        }

        // Materials
        await page.goto(`${config.baseUrl}/#/manage/materials`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '01-master-data', 'material-list');

        const materialNewBtn = page.locator('a:has-text("New Material"), a:has-text("Add Material"), button:has-text("New"), a[routerLink*="new"]');
        if (await materialNewBtn.first().isVisible({ timeout: 2000 })) {
            await materialNewBtn.first().click();
            await waitForPage(page);
            await capture(page, '01-master-data', 'material-create-form');
            await page.goBack();
            await waitForPage(page);
        }

        // Products
        await page.goto(`${config.baseUrl}/#/manage/products`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '01-master-data', 'product-list');

        const productNewBtn = page.locator('a:has-text("New Product"), a:has-text("Add Product"), button:has-text("New"), a[routerLink*="new"]');
        if (await productNewBtn.first().isVisible({ timeout: 2000 })) {
            await productNewBtn.first().click();
            await waitForPage(page);
            await capture(page, '01-master-data', 'product-create-form');
            await page.goBack();
            await waitForPage(page);
        }

        // Equipment
        await page.goto(`${config.baseUrl}/#/equipment`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '01-master-data', 'equipment-list');

        // Operators
        await page.goto(`${config.baseUrl}/#/manage/operators`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '01-master-data', 'operator-list');

        // Users
        await page.goto(`${config.baseUrl}/#/manage/users`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '01-master-data', 'user-list');

        // =============================================
        // SECTION 2: DESIGN PHASE
        // =============================================
        console.log('\n--- SECTION 2: DESIGN PHASE ---');

        // Processes
        await page.goto(`${config.baseUrl}/#/manage/processes`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '02-design-phase', 'process-list');

        // Process detail (click first row)
        const processRow = page.locator('table tbody tr').first();
        if (await processRow.isVisible({ timeout: 2000 })) {
            await processRow.click();
            await waitForPage(page);
            await capture(page, '02-design-phase', 'process-detail');
            await page.goBack();
            await waitForPage(page);
        }

        // Routing
        await page.goto(`${config.baseUrl}/#/manage/routing`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '02-design-phase', 'routing-list');

        // Routing detail (click first row)
        const routingRow = page.locator('table tbody tr, .routing-card, .list-item').first();
        if (await routingRow.isVisible({ timeout: 2000 })) {
            await routingRow.click();
            await waitForPage(page);
            await capture(page, '02-design-phase', 'routing-detail-with-steps');
            await page.goBack();
            await waitForPage(page);
        }

        // Operation Templates
        await page.goto(`${config.baseUrl}/#/manage/operation-templates`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '02-design-phase', 'operation-template-list');

        // BOM
        await page.goto(`${config.baseUrl}/#/manage/bom`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '02-design-phase', 'bom-product-list');

        // Click first BOM tree if available
        const bomLink = page.locator('a:has-text("View Tree"), a:has-text("View BOM"), table tbody tr a').first();
        if (await bomLink.isVisible({ timeout: 2000 })) {
            await bomLink.click();
            await waitForPage(page);
            await capture(page, '02-design-phase', 'bom-tree-view');
            await page.goBack();
            await waitForPage(page);
        }

        // =============================================
        // SECTION 3: CONFIGURATION
        // =============================================
        console.log('\n--- SECTION 3: CONFIGURATION ---');

        // Batch Number Config
        await page.goto(`${config.baseUrl}/#/manage/config/batch-number`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '03-configuration', 'batch-number-config');

        // Batch Size Config
        await page.goto(`${config.baseUrl}/#/manage/config/batch-size`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '03-configuration', 'batch-size-config');

        // Process Parameters Config
        await page.goto(`${config.baseUrl}/#/manage/config/process-params`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '03-configuration', 'process-params-config');

        // Hold Reasons Config
        await page.goto(`${config.baseUrl}/#/manage/config/hold-reasons`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '03-configuration', 'hold-reasons-config');

        // Delay Reasons Config
        await page.goto(`${config.baseUrl}/#/manage/config/delay-reasons`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '03-configuration', 'delay-reasons-config');

        // Quantity Type Config
        await page.goto(`${config.baseUrl}/#/manage/config/quantity-type`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '03-configuration', 'quantity-type-config');

        // =============================================
        // SECTION 4: ORDERS
        // =============================================
        console.log('\n--- SECTION 4: ORDERS ---');

        await page.goto(`${config.baseUrl}/#/orders`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '04-orders', 'order-list');

        // Order detail (click first row)
        const orderRow = page.locator('table tbody tr').first();
        if (await orderRow.isVisible({ timeout: 2000 })) {
            await orderRow.click();
            await waitForPage(page);
            await capture(page, '04-orders', 'order-detail');

            // Capture line items section
            const lineItemsSection = page.locator('.line-items, .order-items, h3:has-text("Line Items")');
            if (await lineItemsSection.isVisible({ timeout: 2000 })) {
                await capture(page, '04-orders', 'order-line-items', { fullPage: true });
            }

            // Capture operations timeline/flow chart
            const flowChart = page.locator('.flow-chart, .process-flow, .operations-timeline, .operation-flow');
            if (await flowChart.isVisible({ timeout: 2000 })) {
                await capture(page, '04-orders', 'order-operations-timeline', { fullPage: true });
            }

            await page.goBack();
            await waitForPage(page);
        }

        // Order create form
        const orderNewBtn = page.locator('a:has-text("New Order"), a:has-text("Create Order"), button:has-text("New"), a[routerLink*="new"]');
        if (await orderNewBtn.first().isVisible({ timeout: 2000 })) {
            await orderNewBtn.first().click();
            await waitForPage(page);
            await capture(page, '04-orders', 'order-create-form', { fullPage: true });
            await page.goBack();
            await waitForPage(page);
        }

        // =============================================
        // SECTION 5: RECEIVE MATERIAL
        // =============================================
        console.log('\n--- SECTION 5: RECEIVE MATERIAL ---');

        await page.goto(`${config.baseUrl}/#/inventory/receive`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '05-receive-material', 'receive-material-form');

        // =============================================
        // SECTION 6: PRODUCTION CONFIRMATION
        // =============================================
        console.log('\n--- SECTION 6: PRODUCTION CONFIRMATION ---');

        await page.goto(`${config.baseUrl}/#/production/confirm`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '06-production', 'production-confirm-order-selection');

        // Try to select an order with READY operations
        const readyOrder = page.locator('table tbody tr:has(.status-badge:has-text("READY")), table tbody tr').first();
        if (await readyOrder.isVisible({ timeout: 2000 })) {
            await readyOrder.click();
            await waitForPage(page, 2000);
            await capture(page, '06-production', 'production-confirm-operation-selected');

            // Capture material selection section
            const materialSection = page.locator('.material-selection, .available-inventory, h3:has-text("Material"), h3:has-text("Inventory")');
            if (await materialSection.first().isVisible({ timeout: 2000 })) {
                await capture(page, '06-production', 'production-confirm-material-selection', { fullPage: true });
            }

            // Capture BOM suggested consumption
            const bomSection = page.locator('.suggested-consumption, .bom-suggestions, h3:has-text("Suggested")');
            if (await bomSection.first().isVisible({ timeout: 2000 })) {
                await capture(page, '06-production', 'production-confirm-bom-suggestions');
            }

            // Capture process parameters
            const paramsSection = page.locator('.process-parameters, .parameters-section, h3:has-text("Parameter")');
            if (await paramsSection.first().isVisible({ timeout: 2000 })) {
                await capture(page, '06-production', 'production-confirm-process-parameters');
            }
        }

        // Production History
        await page.goto(`${config.baseUrl}/#/production/history`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '06-production', 'production-history-list');

        // =============================================
        // SECTION 7: INVENTORY
        // =============================================
        console.log('\n--- SECTION 7: INVENTORY ---');

        await page.goto(`${config.baseUrl}/#/inventory`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '07-inventory', 'inventory-list');

        // Inventory detail (click first row)
        const invRow = page.locator('table tbody tr').first();
        if (await invRow.isVisible({ timeout: 2000 })) {
            await invRow.click();
            await waitForPage(page);
            await capture(page, '07-inventory', 'inventory-detail');
            await page.goBack();
            await waitForPage(page);
        }

        // =============================================
        // SECTION 8: BATCHES
        // =============================================
        console.log('\n--- SECTION 8: BATCHES ---');

        await page.goto(`${config.baseUrl}/#/batches`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '08-batches', 'batch-list');

        // Batch detail (click first row)
        const batchRow = page.locator('table tbody tr').first();
        if (await batchRow.isVisible({ timeout: 2000 })) {
            await batchRow.click();
            await waitForPage(page);
            await capture(page, '08-batches', 'batch-detail');

            // Genealogy section
            const genealogy = page.locator('.genealogy, .batch-genealogy, h3:has-text("Genealogy"), h3:has-text("Traceability")');
            if (await genealogy.first().isVisible({ timeout: 2000 })) {
                await capture(page, '08-batches', 'batch-genealogy', { fullPage: true });
            }

            // Quality section
            const qualitySection = page.locator('.quality-info, .quality-section, h3:has-text("Quality")');
            if (await qualitySection.first().isVisible({ timeout: 2000 })) {
                await capture(page, '08-batches', 'batch-quality-info');
            }

            await page.goBack();
            await waitForPage(page);
        }

        // Quality pending page
        await page.goto(`${config.baseUrl}/#/processes/quality-pending`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '08-batches', 'quality-pending-queue');

        // =============================================
        // SECTION 9: HOLDS
        // =============================================
        console.log('\n--- SECTION 9: HOLDS ---');

        await page.goto(`${config.baseUrl}/#/holds`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '09-holds', 'hold-list');

        // Hold detail (click first row)
        const holdRow = page.locator('table tbody tr').first();
        if (await holdRow.isVisible({ timeout: 2000 })) {
            await holdRow.click();
            await waitForPage(page);
            await capture(page, '09-holds', 'hold-detail');
            await page.goBack();
            await waitForPage(page);
        }

        // =============================================
        // SECTION 10: OPERATIONS
        // =============================================
        console.log('\n--- SECTION 10: OPERATIONS ---');

        await page.goto(`${config.baseUrl}/#/operations`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '10-operations', 'operation-list');

        // =============================================
        // SECTION 11: DASHBOARD
        // =============================================
        console.log('\n--- SECTION 11: DASHBOARD ---');

        await page.goto(`${config.baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
        await waitForPage(page, 2000);
        await capture(page, '11-dashboard', 'dashboard-overview');
        await capture(page, '11-dashboard', 'dashboard-full-page', { fullPage: true });

        // =============================================
        // SECTION 12: AUDIT TRAIL
        // =============================================
        console.log('\n--- SECTION 12: AUDIT TRAIL ---');

        await page.goto(`${config.baseUrl}/#/manage/audit`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '12-audit', 'audit-trail-list');

        // =============================================
        // SECTION 13: USER PROFILE & SETTINGS
        // =============================================
        console.log('\n--- SECTION 13: USER PROFILE ---');

        await page.goto(`${config.baseUrl}/#/profile`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '13-profile', 'user-profile');

        await page.goto(`${config.baseUrl}/#/change-password`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '13-profile', 'change-password');

        // =============================================
        // SECTION 14: ADMIN SIDEBAR NAVIGATION
        // =============================================
        console.log('\n--- SECTION 14: ADMIN SIDEBAR ---');

        await page.goto(`${config.baseUrl}/#/manage/customers`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '14-navigation', 'admin-sidebar-master-data');

        await page.goto(`${config.baseUrl}/#/manage/config/hold-reasons`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '14-navigation', 'admin-sidebar-configuration');

        // =============================================
        // SECTION 15: REPORTS (if available)
        // =============================================
        console.log('\n--- SECTION 15: REPORTS ---');

        await page.goto(`${config.baseUrl}/#/reports`, { waitUntil: 'networkidle' });
        await waitForPage(page);
        await capture(page, '15-reports', 'reports-landing');

        const reportRoutes = [
            { path: '/#/reports/production', name: 'report-production-summary' },
            { path: '/#/reports/scrap-analysis', name: 'report-scrap-analysis' },
            { path: '/#/reports/inventory-balance', name: 'report-inventory-balance' },
            { path: '/#/reports/order-fulfillment', name: 'report-order-fulfillment' },
            { path: '/#/reports/operations', name: 'report-operations' },
            { path: '/#/reports/executive-dashboard', name: 'report-executive-dashboard' }
        ];

        for (const route of reportRoutes) {
            try {
                await page.goto(`${config.baseUrl}${route.path}`, { waitUntil: 'networkidle', timeout: 5000 });
                await waitForPage(page, 1000);
                await capture(page, '15-reports', route.name);
            } catch (e) {
                console.log(`   Skipped ${route.name}: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('\n[ERROR]', error.message);
        await capture(page, 'errors', 'capture-error').catch(() => {});
    } finally {
        await context.close();
        await browser.close();
    }

    // Generate manifest
    const manifest = {
        timestamp,
        outputDir,
        totalScreenshots: screenshotCounter,
        sections: [
            '00-login',
            '01-master-data',
            '02-design-phase',
            '03-configuration',
            '04-orders',
            '05-receive-material',
            '06-production',
            '07-inventory',
            '08-batches',
            '09-holds',
            '10-operations',
            '11-dashboard',
            '12-audit',
            '13-profile',
            '14-navigation',
            '15-reports'
        ]
    };

    const manifestPath = path.join(outputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log(`CAPTURE COMPLETE: ${screenshotCounter} screenshots`);
    console.log(`Output: ${outputDir}`);
    console.log('='.repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Screenshot capture failed:', error);
        process.exit(1);
    });
