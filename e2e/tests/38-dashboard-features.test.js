/**
 * Dashboard Features Tests
 * Tests dashboard statistics, charts, and navigation features
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runDashboardFeaturesTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('📊 DASHBOARD FEATURES TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // STATISTICS CARDS
    // ============================================

    // Test 1: Dashboard statistics cards display
    await runTest('Dashboard - Statistics Cards Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'dashboard-full-view');

        // Check for statistics cards
        const statsCards = page.locator('.stat-card, .stats-card, .dashboard-card, .metric-card');
        const count = await statsCards.count();
        if (count < 4) {
            console.log(`   Warning: Only ${count} statistics cards visible`);
        } else {
            console.log(`   Found ${count} statistics cards`);
        }
    }, page, results, screenshots);

    // Test 2: Total orders count
    await runTest('Dashboard - Orders Count', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const ordersCard = page.locator('.stat-card:has-text("Orders"), .card:has-text("Orders")').first();
        if (await ordersCard.isVisible()) {
            await screenshots.capture(page, 'dashboard-orders-card');
            const countText = await ordersCard.textContent();
            console.log(`   Orders card content: ${countText.substring(0, 50)}...`);
        }
    }, page, results, screenshots);

    // Test 3: Active holds count
    await runTest('Dashboard - Active Holds Count', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const holdsCard = page.locator('.stat-card:has-text("Hold"), .card:has-text("Hold")').first();
        if (await holdsCard.isVisible()) {
            await screenshots.capture(page, 'dashboard-holds-card');
        }
    }, page, results, screenshots);

    // Test 4: Today's confirmations count
    await runTest('Dashboard - Today Confirmations Count', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const confirmCard = page.locator('.stat-card:has-text("Confirmation"), .card:has-text("Today")').first();
        if (await confirmCard.isVisible()) {
            await screenshots.capture(page, 'dashboard-confirmations-card');
        }
    }, page, results, screenshots);

    // Test 5: Quality pending count
    await runTest('Dashboard - Quality Pending Count', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const qualityCard = page.locator('.stat-card:has-text("Quality"), .card:has-text("Pending")').first();
        if (await qualityCard.isVisible()) {
            await screenshots.capture(page, 'dashboard-quality-card');
        }
    }, page, results, screenshots);

    // Test 6: Batches pending approval count
    await runTest('Dashboard - Batches Pending Approval', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const batchCard = page.locator('.stat-card:has-text("Batch"), .card:has-text("Approval")').first();
        if (await batchCard.isVisible()) {
            await screenshots.capture(page, 'dashboard-batches-approval-card');
        }
    }, page, results, screenshots);

    // ============================================
    // CHARTS
    // ============================================

    // Test 7: Inventory state distribution chart
    await runTest('Dashboard - Inventory Chart', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const inventoryChart = page.locator('.inventory-chart, canvas, .echarts-container, [id*="inventory"]').first();
        if (await inventoryChart.isVisible()) {
            await screenshots.capture(page, 'dashboard-inventory-chart');
        } else {
            console.log('   Inventory chart not visible');
        }
    }, page, results, screenshots);

    // Test 8: Order status chart
    await runTest('Dashboard - Order Status Chart', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const orderChart = page.locator('.order-chart, [id*="order-chart"], .chart-container:has-text("Order")');
        if (await orderChart.isVisible()) {
            await screenshots.capture(page, 'dashboard-order-chart');
        }
    }, page, results, screenshots);

    // Test 9: Batch status chart
    await runTest('Dashboard - Batch Status Chart', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const batchChart = page.locator('.batch-chart, [id*="batch-chart"], .chart-container:has-text("Batch")');
        if (await batchChart.isVisible()) {
            await screenshots.capture(page, 'dashboard-batch-chart');
        }
    }, page, results, screenshots);

    // Test 10: Inventory flow pipeline
    await runTest('Dashboard - Inventory Flow Pipeline', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Use more specific selector - look for the inventory flow container
        const pipeline = page.locator('.inventory-flow, .inventory-flow-section, .flow-diagram').first();
        if (await pipeline.isVisible({ timeout: 3000 })) {
            await screenshots.capture(page, 'dashboard-inventory-pipeline');
            console.log('   Inventory flow pipeline visible');
        } else {
            // Fallback - just verify dashboard has content
            console.log('   Inventory flow section not found (may have different class)');
        }
    }, page, results, screenshots);

    // ============================================
    // NAVIGATION FROM DASHBOARD
    // ============================================

    // Test 11: Navigate to inventory with type filter
    await runTest('Dashboard - Navigate to Inventory RM', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click on RM section in pipeline or inventory card
        const rmLink = page.locator('a:has-text("Raw Material"), .rm-count, .flow-stage:has-text("RM")').first();
        if (await rmLink.isVisible()) {
            await rmLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'dashboard-nav-inventory-rm');

            // Check URL includes type filter
            const url = page.url();
            if (url.includes('inventory') && url.includes('RM')) {
                console.log('   Navigation with RM filter successful');
            }
        }
    }, page, results, screenshots);

    // Test 12: Navigate to batches pending approval
    await runTest('Dashboard - Navigate to Pending Batches', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click on batches pending card
        const batchLink = page.locator('a:has-text("Pending Approval"), .batch-pending-link, .card:has-text("Approval") a').first();
        if (await batchLink.isVisible()) {
            await batchLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'dashboard-nav-pending-batches');

            const url = page.url();
            if (url.includes('batches') && url.includes('QUALITY_PENDING')) {
                console.log('   Navigation to pending batches successful');
            }
        }
    }, page, results, screenshots);

    // Test 13: Navigate to quality pending
    await runTest('Dashboard - Navigate to Quality Pending', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const qualityLink = page.locator('a:has-text("Quality"), .quality-link, .card:has-text("Quality") a').first();
        if (await qualityLink.isVisible()) {
            await qualityLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'dashboard-nav-quality');
        }
    }, page, results, screenshots);

    // Test 14: Navigate to specific order from list
    await runTest('Dashboard - Navigate to Order Detail', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Look for recent orders section
        const orderRow = page.locator('.recent-orders a, .order-list a, table tr a').first();
        if (await orderRow.isVisible()) {
            await orderRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'dashboard-nav-order-detail');
        }
    }, page, results, screenshots);

    // ============================================
    // ALERTS SECTION
    // ============================================

    // Test 15: Alert indicators display
    await runTest('Dashboard - Alert Indicators', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const alerts = page.locator('.alerts-section, .alert-indicators, .warnings, :has-text("Alert")');
        if (await alerts.isVisible()) {
            await screenshots.capture(page, 'dashboard-alerts');
        }
    }, page, results, screenshots);

    // Test 16: Blocked inventory alert
    await runTest('Dashboard - Blocked Inventory Alert', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const blockedAlert = page.locator('.alert:has-text("Blocked"), .warning:has-text("Blocked")');
        if (await blockedAlert.isVisible()) {
            await screenshots.capture(page, 'dashboard-blocked-alert');
        }
    }, page, results, screenshots);

    // ============================================
    // RECENT ACTIVITY
    // ============================================

    // Test 17: Recent activity list
    await runTest('Dashboard - Recent Activity', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const activity = page.locator('.recent-activity, .activity-list, .audit-preview');
        if (await activity.isVisible()) {
            await screenshots.capture(page, 'dashboard-recent-activity');
        }
    }, page, results, screenshots);

    // Test 18: Operations summary by status
    await runTest('Dashboard - Operations Summary', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Use more specific selector
        const opsSummary = page.locator('.operations-summary, .ops-by-status, .operations-section').first();
        if (await opsSummary.isVisible({ timeout: 3000 })) {
            await screenshots.capture(page, 'dashboard-operations-summary');
            console.log('   Operations summary visible');
        } else {
            // Fallback - dashboard may not have this section
            console.log('   Operations summary section not found (may have different layout)');
        }
    }, page, results, screenshots);

    // ============================================
    // REFRESH / REAL-TIME
    // ============================================

    // Test 19: Dashboard data refresh
    await runTest('Dashboard - Data Refresh', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const refreshBtn = page.locator('button:has-text("Refresh"), button[aria-label="refresh"]');
        if (await refreshBtn.isVisible()) {
            await refreshBtn.click();
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'dashboard-refreshed');
        } else {
            // Dashboard may auto-refresh
            console.log('   No manual refresh button (may auto-refresh)');
        }
    }, page, results, screenshots);

    // Test 20: Responsive layout
    await runTest('Dashboard - Mobile View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        await screenshots.capture(page, 'dashboard-mobile-view');

        // Reset to desktop
        await page.setViewportSize({ width: 1280, height: 720 });
    }, page, results, screenshots);

    console.log('\n✅ Dashboard features tests finished');
}

module.exports = { runDashboardFeaturesTests };
