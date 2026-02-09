/**
 * Capture detailed panel-level cropped screenshots for user guide
 * Targets specific UI panels, sections, buttons, and status badges
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const CREDS = { email: 'admin@mes.com', password: 'admin123' };

// Use same output directory as the main screenshots
const outputDir = path.join(__dirname, 'output', 'user-guide-screenshots', '2026-02-09T07-17-42', 'panels');

let counter = 79; // Continue numbering from main screenshots

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function ss(page, name, opts = {}) {
    counter++;
    const num = String(counter).padStart(3, '0');
    const safeName = name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const filename = `${num}-${safeName}.png`;
    const filepath = path.join(outputDir, filename);

    try {
        if (opts.locator) {
            const el = opts.locator;
            if (await el.count() > 0 && await el.first().isVisible().catch(() => false)) {
                await el.first().screenshot({ path: filepath });
                console.log(`  [${num}] ${name}`);
                return filename;
            }
        }
        await page.screenshot({ path: filepath, fullPage: opts.fullPage || false });
        console.log(`  [${num}] ${name} (full page fallback)`);
    } catch (e) {
        await page.screenshot({ path: filepath });
        console.log(`  [${num}] ${name} (error fallback: ${e.message.slice(0, 50)})`);
    }
    return filename;
}

async function login(page) {
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('input[formControlName="email"]', CREDS.email);
    await page.fill('input[formControlName="password"]', CREDS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
}

async function run() {
    ensureDir(outputDir);
    console.log(`\nCapturing panel screenshots to: ${outputDir}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await login(page);

    // =====================================================
    // DASHBOARD PANELS
    // =====================================================
    console.log('\n--- DASHBOARD PANELS ---');
    await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Each row of the dashboard
    await ss(page, 'panel-dashboard-top-row', { locator: page.locator('.dashboard-row, .stats-row, .row').first() });

    // Individual cards with labels
    const cards = page.locator('.card, .stat-card, .dashboard-card');
    const cardCount = await cards.count();
    for (let i = 0; i < Math.min(cardCount, 8); i++) {
        await ss(page, `panel-dashboard-card-${i+1}-detail`, { locator: cards.nth(i) });
    }

    // =====================================================
    // ORDER DETAIL PANELS
    // =====================================================
    console.log('\n--- ORDER DETAIL PANELS ---');
    await page.goto(`${BASE_URL}/#/orders/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Page header area (status badge + buttons)
    await ss(page, 'panel-order-header-badge-buttons', { locator: page.locator('.page-header').first() });

    // Order info section
    await ss(page, 'panel-order-info-section', { locator: page.locator('.order-info, .info-section, .detail-section').first() });

    // Line items cards
    const lineItemCards = page.locator('.line-items-section .card, .line-item-card');
    if (await lineItemCards.count() > 0) {
        await ss(page, 'panel-order-line-item-card', { locator: lineItemCards.first() });
    }

    // Operations list within a line item
    const opsSection = page.locator('.operations-list, .operation-step');
    if (await opsSection.count() > 0) {
        await ss(page, 'panel-order-operations-list', { locator: opsSection.first() });
    }

    // Process flow chart
    await ss(page, 'panel-order-process-flow-chart', { locator: page.locator('.process-flow-container').first() });

    // Multi-stage order (order 42)
    await page.goto(`${BASE_URL}/#/orders/42`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Each line item section
    const liSections = page.locator('.line-items-section .card');
    const liCount = await liSections.count();
    for (let i = 0; i < Math.min(liCount, 4); i++) {
        await ss(page, `panel-order42-line-item-${i+1}`, { locator: liSections.nth(i) });
    }

    // =====================================================
    // PRODUCTION CONFIRM PANELS
    // =====================================================
    console.log('\n--- PRODUCTION CONFIRM PANELS ---');
    await page.goto(`${BASE_URL}/#/production/confirm/6`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    // Each card/section on the production confirm page
    const prodCards = page.locator('.card, .section-card, .confirm-section');
    const prodCardCount = await prodCards.count();
    for (let i = 0; i < Math.min(prodCardCount, 10); i++) {
        await ss(page, `panel-production-section-${i+1}`, { locator: prodCards.nth(i) });
    }

    // Buttons area
    await ss(page, 'panel-production-action-buttons', { locator: page.locator('.form-actions, .action-buttons, .btn-group').first() });

    // =====================================================
    // INVENTORY PANELS
    // =====================================================
    console.log('\n--- INVENTORY PANELS ---');
    await page.goto(`${BASE_URL}/#/inventory`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Status summary cards at top
    const invCards = page.locator('.status-card, .summary-card, .stat-card');
    const invCardCount = await invCards.count();
    for (let i = 0; i < Math.min(invCardCount, 6); i++) {
        await ss(page, `panel-inventory-status-card-${i+1}`, { locator: invCards.nth(i) });
    }

    // Filter controls
    await ss(page, 'panel-inventory-filter-controls', { locator: page.locator('.filters, .filter-bar').first() });

    // =====================================================
    // BATCH DETAIL PANELS
    // =====================================================
    console.log('\n--- BATCH DETAIL PANELS ---');
    await page.goto(`${BASE_URL}/#/batches/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Batch info section
    await ss(page, 'panel-batch-info', { locator: page.locator('.batch-info, .detail-section, .info-card').first() });

    // Batch actions area (approve, reject, split, merge buttons)
    await ss(page, 'panel-batch-action-buttons', { locator: page.locator('.batch-actions, .action-section, .btn-group').first() });

    // Genealogy section
    await ss(page, 'panel-batch-genealogy', { locator: page.locator('.genealogy-section, .genealogy, .batch-genealogy').first() });

    // Order allocations section
    await ss(page, 'panel-batch-allocations', { locator: page.locator('.allocations-section, .order-allocations').first() });

    // =====================================================
    // HOLDS PANELS
    // =====================================================
    console.log('\n--- HOLDS PANELS ---');
    await page.goto(`${BASE_URL}/#/holds`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Hold filter row
    await ss(page, 'panel-holds-filter-row', { locator: page.locator('.filters, .filter-bar, .filter-section').first() });

    // Single hold row in table (first row)
    const holdRows = page.locator('table tbody tr');
    if (await holdRows.count() > 0) {
        await ss(page, 'panel-holds-table-row', { locator: holdRows.first() });
    }

    // =====================================================
    // EQUIPMENT PANELS
    // =====================================================
    console.log('\n--- EQUIPMENT PANELS ---');
    await page.goto(`${BASE_URL}/#/equipment`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Equipment status summary cards
    const eqCards = page.locator('.status-card, .summary-card, .stat-card');
    const eqCardCount = await eqCards.count();
    for (let i = 0; i < Math.min(eqCardCount, 5); i++) {
        await ss(page, `panel-equipment-status-card-${i+1}`, { locator: eqCards.nth(i) });
    }

    // =====================================================
    // ADMIN SIDEBAR & PANELS
    // =====================================================
    console.log('\n--- ADMIN PANELS ---');
    await page.goto(`${BASE_URL}/#/manage/customers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Admin sidebar navigation
    await ss(page, 'panel-admin-sidebar', { locator: page.locator('.admin-sidebar, .sidebar, aside, .side-nav').first() });

    // Admin page header with "New" button
    await ss(page, 'panel-admin-page-header', { locator: page.locator('.page-header, .content-header').first() });

    // BOM Tree view
    await page.goto(`${BASE_URL}/#/manage/bom/HR-COIL-2MM/tree`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // BOM tree container
    await ss(page, 'panel-bom-tree-view', { locator: page.locator('.bom-tree, .tree-container, .tree-view').first() });

    // Audit trail
    await page.goto(`${BASE_URL}/#/manage/audit`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Audit filters
    await ss(page, 'panel-audit-filters', { locator: page.locator('.filters, .filter-bar').first() });

    // Audit table
    await ss(page, 'panel-audit-table', { locator: page.locator('table').first() });

    console.log(`\n=== Panel screenshot capture complete ===`);
    console.log(`Additional screenshots: ${counter - 79}`);
    console.log(`Total (including main): ${counter}`);
    console.log(`Output: ${outputDir}`);

    await browser.close();
}

run().catch(console.error);
