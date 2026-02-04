/**
 * Orders Tests
 * Tests order list, filtering, and order details
 */

const { ROUTES, SELECTORS } = require('../config/constants');
const config = require('../config/playwright.config');

async function runOrdersTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 ORDERS TESTS');
    console.log('─'.repeat(50));

    // Test 1: Orders list view
    await runTest('Orders - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'orders-list-view');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Orders table not visible');
        }
    }, page, results, screenshots);

    // Test 2: Filter by status
    await runTest('Orders - Filter by Status', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'orders-filter-before');

        const statusFilter = page.locator('select[name="status"], select#status, select:has(option:has-text("IN_PROGRESS"))');
        if (await statusFilter.count() > 0) {
            await statusFilter.first().selectOption({ label: 'IN_PROGRESS' }).catch(() => {
                // Try by value
                return statusFilter.first().selectOption('IN_PROGRESS');
            }).catch(() => {
                // Try index
                return statusFilter.first().selectOption({ index: 1 });
            });
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'orders-filter-after');
    }, page, results, screenshots);

    // Test 3: View order detail
    await runTest('Orders - View Order Detail', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'orders-before-row-click');

        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'orders-detail-view', { fullPage: true });
        } else {
            throw new Error('No orders found in table');
        }
    }, page, results, screenshots);

    // Test 4: Order operations/timeline view
    await runTest('Orders - Operations Timeline', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Look for operations section
            const operationsSection = page.locator('.operations, .timeline, [class*="operation"]');
            if (await operationsSection.count() > 0) {
                await screenshots.capture(page, 'orders-operations-timeline');
            } else {
                await screenshots.capture(page, 'orders-detail-full', { fullPage: true });
            }
        }
    }, page, results, screenshots);

    // Test 5: Order line items
    await runTest('Orders - Line Items Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Look for line items
            const lineItems = page.locator('.line-items, .order-items, table:has(th:has-text("Product"))');
            if (await lineItems.count() > 0) {
                await screenshots.capture(page, 'orders-line-items');
            }
        }
    }, page, results, screenshots);
}

module.exports = { runOrdersTests };
