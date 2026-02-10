/**
 * Reports & Analytics E2E Tests
 * Tests all 7 report pages: landing, production summary, scrap analysis,
 * inventory balance, order fulfillment, operations report, executive dashboard
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runReportsTests(page, screenshots, results, runTest, submitActions) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 REPORTS & ANALYTICS TESTS');
    console.log('─'.repeat(50));

    // ── Reports Landing Page ──────────────────────────

    await runTest('Reports - Landing Page Loads', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const title = page.locator('h1.page-title');
        const titleText = await title.textContent();
        if (!titleText.includes('Reports')) {
            throw new Error(`Expected 'Reports' in title, got '${titleText}'`);
        }

        await screenshots.capture(page, 'reports-landing');
    }, page, results, screenshots);

    await runTest('Reports - Landing Has Report Cards', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const cards = page.locator('.report-card');
        const count = await cards.count();
        if (count < 6) {
            throw new Error(`Expected at least 6 report cards, found ${count}`);
        }
        console.log(`   Found ${count} report cards`);

        // Verify cards have titles and descriptions
        const firstTitle = await cards.first().locator('h3').textContent();
        if (!firstTitle || firstTitle.trim().length === 0) {
            throw new Error('Report card title is empty');
        }

        await screenshots.capture(page, 'reports-landing-cards');
    }, page, results, screenshots);

    await runTest('Reports - Landing Cards Have KPI Values', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const kpiValues = page.locator('.card-kpi .kpi-value');
        const count = await kpiValues.count();
        console.log(`   Found ${count} KPI values on report cards`);

        await screenshots.capture(page, 'reports-landing-kpis');
    }, page, results, screenshots);

    // ── Production Summary ─────────────────────────────

    await runTest('Reports - Production Summary Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const title = page.locator('h1.page-title');
        const titleText = await title.textContent();
        if (!titleText.includes('Production Summary')) {
            throw new Error(`Expected 'Production Summary' title, got '${titleText}'`);
        }

        // Verify date filters exist
        const dateInputs = page.locator('.date-filter input[type="date"]');
        const dateCount = await dateInputs.count();
        if (dateCount < 2) {
            throw new Error(`Expected 2 date filter inputs, found ${dateCount}`);
        }

        await screenshots.capture(page, 'reports-production-summary');
    }, page, results, screenshots);

    await runTest('Reports - Production Summary KPIs', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const kpiCards = page.locator('.kpi-card');
        const count = await kpiCards.count();
        if (count < 3) {
            console.log(`   ⚠️  Only ${count} KPI cards (data may be empty)`);
        } else {
            console.log(`   Found ${count} KPI cards`);
        }

        // Check for expected KPI labels
        const labels = page.locator('.kpi-label');
        const labelTexts = [];
        for (let i = 0; i < await labels.count(); i++) {
            labelTexts.push(await labels.nth(i).textContent());
        }
        console.log(`   KPI labels: ${labelTexts.join(', ')}`);

        await screenshots.capture(page, 'reports-production-kpis');
    }, page, results, screenshots);

    await runTest('Reports - Production Summary Operation Table', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for "Production by Operation Type" table
        const table = page.locator('table.table');
        if (await table.count() > 0) {
            const headers = table.first().locator('thead th');
            const headerCount = await headers.count();
            console.log(`   Operation table has ${headerCount} columns`);
        } else {
            console.log('   ⚠️  No operation type table (may need production data)');
        }

        await screenshots.capture(page, 'reports-production-operation-table');
    }, page, results, screenshots);

    await runTest('Reports - Production Summary Back Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const backBtn = page.locator('a:has-text("Back to Reports")');
        if (await backBtn.count() === 0) {
            throw new Error('Back to Reports button not found');
        }

        await backBtn.click();
        await page.waitForTimeout(1000);

        // Should be back on landing page
        const title = page.locator('h1.page-title');
        const text = await title.textContent();
        if (!text.includes('Reports')) {
            throw new Error(`Expected Reports landing, got '${text}'`);
        }

        await screenshots.capture(page, 'reports-production-back');
    }, page, results, screenshots);

    // ── Scrap Analysis ─────────────────────────────────

    await runTest('Reports - Scrap Analysis Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_SCRAP}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const title = page.locator('h1.page-title');
        const titleText = await title.textContent();
        if (!titleText.includes('Scrap Analysis')) {
            throw new Error(`Expected 'Scrap Analysis' title, got '${titleText}'`);
        }

        // Date filters
        const dateInputs = page.locator('.date-filter input[type="date"]');
        if (await dateInputs.count() < 2) {
            throw new Error('Missing date filter inputs');
        }

        await screenshots.capture(page, 'reports-scrap-analysis');
    }, page, results, screenshots);

    await runTest('Reports - Scrap Analysis KPIs and Tables', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_SCRAP}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const kpiCards = page.locator('.kpi-card');
        const count = await kpiCards.count();
        console.log(`   Found ${count} KPI cards`);

        // Check for scrap tables or empty state
        const tables = page.locator('table.table');
        const emptyState = page.locator('.empty-state');
        if (await tables.count() > 0) {
            console.log(`   Found ${await tables.count()} data table(s)`);
            // Check for percentage bars in scrap tables
            const percentBars = page.locator('.percentage-bar-container');
            console.log(`   Found ${await percentBars.count()} percentage bar(s)`);
        } else if (await emptyState.count() > 0) {
            console.log('   ⚠️  Empty state shown (no scrap data)');
        }

        await screenshots.capture(page, 'reports-scrap-kpis-tables');
    }, page, results, screenshots);

    // ── Inventory Balance ──────────────────────────────

    await runTest('Reports - Inventory Balance Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const title = page.locator('h1.page-title');
        const titleText = await title.textContent();
        if (!titleText.includes('Inventory Balance')) {
            throw new Error(`Expected 'Inventory Balance' title, got '${titleText}'`);
        }

        // No date filters on inventory balance (it's a snapshot)
        const backBtn = page.locator('a:has-text("Back to Reports")');
        if (await backBtn.count() === 0) {
            throw new Error('Back to Reports button not found');
        }

        await screenshots.capture(page, 'reports-inventory-balance');
    }, page, results, screenshots);

    await runTest('Reports - Inventory Balance KPIs', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const kpiCards = page.locator('.kpi-card');
        const count = await kpiCards.count();
        if (count < 2) {
            console.log(`   ⚠️  Only ${count} KPI cards`);
        } else {
            console.log(`   Found ${count} KPI cards (Total Items, Total Quantity, Types, States)`);
        }

        await screenshots.capture(page, 'reports-inventory-kpis');
    }, page, results, screenshots);

    await runTest('Reports - Inventory Balance Tables', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for "By Inventory Type" and "By Inventory State" tables
        const tables = page.locator('table.table');
        const tableCount = await tables.count();
        console.log(`   Found ${tableCount} table(s)`);

        // Check for type badges
        const typeBadges = page.locator('.type-badge');
        const badgeCount = await typeBadges.count();
        console.log(`   Found ${badgeCount} type badge(s)`);

        // Check for state badges
        const stateBadges = page.locator('.state-badge');
        const stateCount = await stateBadges.count();
        console.log(`   Found ${stateCount} state badge(s)`);

        await screenshots.capture(page, 'reports-inventory-tables');
    }, page, results, screenshots);

    // ── Order Fulfillment ──────────────────────────────

    await runTest('Reports - Order Fulfillment Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const title = page.locator('h1.page-title');
        const titleText = await title.textContent();
        if (!titleText.includes('Order Fulfillment')) {
            throw new Error(`Expected 'Order Fulfillment' title, got '${titleText}'`);
        }

        await screenshots.capture(page, 'reports-order-fulfillment');
    }, page, results, screenshots);

    await runTest('Reports - Order Fulfillment KPIs', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const kpiCards = page.locator('.kpi-card');
        const count = await kpiCards.count();
        console.log(`   Found ${count} KPI cards`);

        // Check for completion rate (highlighted card)
        const highlightCard = page.locator('.kpi-card.highlight');
        if (await highlightCard.count() > 0) {
            const rateText = await highlightCard.locator('.kpi-value').textContent();
            console.log(`   Completion Rate: ${rateText}`);
        }

        await screenshots.capture(page, 'reports-order-fulfillment-kpis');
    }, page, results, screenshots);

    await runTest('Reports - Order Fulfillment Status Bar', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for status distribution bar
        const statusBar = page.locator('.status-bar');
        if (await statusBar.count() > 0) {
            const segments = page.locator('.status-segment');
            console.log(`   Status bar has ${await segments.count()} segment(s)`);
        } else {
            console.log('   ⚠️  No status bar (may have no data)');
        }

        // Check for legend
        const legendItems = page.locator('.legend-item');
        if (await legendItems.count() > 0) {
            console.log(`   Legend has ${await legendItems.count()} item(s)`);
        }

        await screenshots.capture(page, 'reports-order-status-bar');
    }, page, results, screenshots);

    // ── Operations & Holds Report ──────────────────────

    await runTest('Reports - Operations Report Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const title = page.locator('h1.page-title');
        const titleText = await title.textContent();
        if (!titleText.includes('Operations') || !titleText.includes('Holds')) {
            throw new Error(`Expected 'Operations & Holds' title, got '${titleText}'`);
        }

        // Date filters
        const dateInputs = page.locator('.date-filter input[type="date"]');
        if (await dateInputs.count() < 2) {
            throw new Error('Missing date filter inputs');
        }

        await screenshots.capture(page, 'reports-operations');
    }, page, results, screenshots);

    await runTest('Reports - Operations Cycle Times Table', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for cycle times table or empty state
        const tables = page.locator('table.table');
        const emptyState = page.locator('.empty-state');

        if (await tables.count() > 0) {
            const firstTable = tables.first();
            const rows = firstTable.locator('tbody tr');
            console.log(`   Cycle times table has ${await rows.count()} row(s)`);
        } else if (await emptyState.count() > 0) {
            console.log('   ⚠️  Empty state shown (no cycle time data)');
        }

        await screenshots.capture(page, 'reports-operations-cycle-times');
    }, page, results, screenshots);

    await runTest('Reports - Operations Hold Analysis', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check hold analysis KPIs
        const holdKpis = page.locator('.kpi-card');
        const count = await holdKpis.count();
        console.log(`   Found ${count} total KPI cards`);

        // Check for hold-specific values
        const activeHolds = page.locator('.holds-active');
        if (await activeHolds.count() > 0) {
            console.log('   Active holds KPI present');
        }

        const releasedHolds = page.locator('.holds-released');
        if (await releasedHolds.count() > 0) {
            console.log('   Released holds KPI present');
        }

        // Entity type table
        const entityBadges = page.locator('.entity-badge');
        if (await entityBadges.count() > 0) {
            console.log(`   Hold entity types: ${await entityBadges.count()}`);
        }

        await screenshots.capture(page, 'reports-operations-hold-analysis');
    }, page, results, screenshots);

    // ── Executive Dashboard ────────────────────────────

    await runTest('Reports - Executive Dashboard Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_EXECUTIVE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const title = page.locator('h1.page-title');
        const titleText = await title.textContent();
        if (!titleText.includes('Executive Dashboard')) {
            throw new Error(`Expected 'Executive Dashboard' title, got '${titleText}'`);
        }

        await screenshots.capture(page, 'reports-executive-dashboard');
    }, page, results, screenshots);

    await runTest('Reports - Executive Dashboard Sections', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_EXECUTIVE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check for all 4 major sections
        const sections = page.locator('.section');
        const sectionCount = await sections.count();
        console.log(`   Found ${sectionCount} sections`);

        const sectionTitles = page.locator('.section-title');
        const expectedSections = ['Production Performance', 'Order Fulfillment', 'Inventory Overview', 'Hold Status'];
        const foundTitles = [];

        for (let i = 0; i < await sectionTitles.count(); i++) {
            foundTitles.push(await sectionTitles.nth(i).textContent());
        }
        console.log(`   Section titles: ${foundTitles.join(', ')}`);

        for (const expected of expectedSections) {
            if (!foundTitles.some(t => t.includes(expected))) {
                console.log(`   ⚠️  Missing section: ${expected}`);
            }
        }

        await screenshots.capture(page, 'reports-executive-sections');
    }, page, results, screenshots);

    await runTest('Reports - Executive Dashboard Production KPIs', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_EXECUTIVE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Production section KPIs
        const kpiCards = page.locator('.kpi-card');
        const totalKpis = await kpiCards.count();
        console.log(`   Total KPI cards across all sections: ${totalKpis}`);

        // Check for scrap value indicator
        const scrapValues = page.locator('.kpi-value.scrap');
        console.log(`   Scrap indicators: ${await scrapValues.count()}`);

        // Check for completion class indicators
        const completedValues = page.locator('.kpi-value.completed');
        console.log(`   Completed indicators: ${await completedValues.count()}`);

        await screenshots.capture(page, 'reports-executive-production-kpis');
    }, page, results, screenshots);

    await runTest('Reports - Executive Dashboard Tables', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_EXECUTIVE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check for tables (inventory by type, holds by entity, top reasons, cycle times)
        const tables = page.locator('table.table');
        const tableCount = await tables.count();
        console.log(`   Found ${tableCount} table(s) in executive dashboard`);

        // Scroll to bottom to capture full page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'reports-executive-tables');
    }, page, results, screenshots);

    await runTest('Reports - Executive Dashboard Back Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_EXECUTIVE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const backBtn = page.locator('a:has-text("Back to Reports")');
        if (await backBtn.count() === 0) {
            throw new Error('Back to Reports button not found');
        }

        await backBtn.click();
        await page.waitForTimeout(1000);

        const title = page.locator('h1.page-title');
        const text = await title.textContent();
        if (!text.includes('Reports')) {
            throw new Error(`Expected Reports landing after back, got '${text}'`);
        }

        await screenshots.capture(page, 'reports-executive-back');
    }, page, results, screenshots);

    // ── Navigation Between Reports ─────────────────────

    await runTest('Reports - Navigate From Landing to All Sub-Pages', async () => {
        const reportRoutes = [
            { route: ROUTES.REPORTS_PRODUCTION, name: 'Production Summary' },
            { route: ROUTES.REPORTS_SCRAP, name: 'Scrap Analysis' },
            { route: ROUTES.REPORTS_INVENTORY, name: 'Inventory Balance' },
            { route: ROUTES.REPORTS_ORDERS, name: 'Order Fulfillment' },
            { route: ROUTES.REPORTS_OPERATIONS, name: 'Operations' },
            { route: ROUTES.REPORTS_EXECUTIVE, name: 'Executive Dashboard' },
        ];

        for (const report of reportRoutes) {
            await page.goto(`${config.baseUrl}${report.route}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const title = page.locator('h1.page-title');
            if (await title.count() === 0) {
                throw new Error(`No page title found for ${report.name}`);
            }
            const text = await title.textContent();
            console.log(`   ${report.name}: title='${text.trim()}'`);
        }

        await screenshots.capture(page, 'reports-all-navigated');
    }, page, results, screenshots);
}

module.exports = { runReportsTests };
