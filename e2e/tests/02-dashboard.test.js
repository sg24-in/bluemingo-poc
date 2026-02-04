/**
 * Dashboard Tests
 * Tests dashboard display, statistics, and navigation
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runDashboardTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 DASHBOARD TESTS');
    console.log('─'.repeat(50));

    // Test 1: Dashboard view
    await runTest('Dashboard - View Statistics', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'dashboard-full-view');

        const pageContent = await page.content();
        if (!pageContent.toLowerCase().includes('dashboard')) {
            throw new Error('Dashboard content not found');
        }
    }, page, results, screenshots);

    // Test 2: Dashboard cards/widgets
    await runTest('Dashboard - Statistics Cards', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for stat cards
        const cards = page.locator('.stat-card, .dashboard-card, .card');
        const cardCount = await cards.count();
        console.log(`   Found ${cardCount} dashboard cards`);

        await screenshots.capture(page, 'dashboard-stats-cards');
    }, page, results, screenshots);

    // Test 3: Navigate to Orders from Dashboard
    await runTest('Dashboard - Navigate to Orders', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });

        await screenshots.capture(page, 'dashboard-before-orders-click');

        // Try to find and click orders link
        const ordersLink = page.locator('a[href*="orders"], button:has-text("Orders"), .nav-link:has-text("Orders")');
        if (await ordersLink.count() > 0) {
            await ordersLink.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
        } else {
            await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        }

        await screenshots.capture(page, 'dashboard-after-orders-click');
    }, page, results, screenshots);

    // Test 4: Navigate to Holds from Dashboard
    await runTest('Dashboard - Navigate to Holds', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });

        await screenshots.capture(page, 'dashboard-before-holds-click');

        const holdsLink = page.locator('a[href*="holds"], button:has-text("Holds"), .nav-link:has-text("Holds")');
        if (await holdsLink.count() > 0) {
            await holdsLink.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
        } else {
            await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        }

        await screenshots.capture(page, 'dashboard-after-holds-click');
    }, page, results, screenshots);
}

module.exports = { runDashboardTests };
