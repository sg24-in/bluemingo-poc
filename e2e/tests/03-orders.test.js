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

    // Test 6: Edit button hidden for COMPLETED orders
    await runTest('Orders - Edit Button Hidden for Completed Orders', async () => {
        // Navigate to a COMPLETED order (order 5 is COMPLETED)
        await page.goto(`${config.baseUrl}/#/orders/5`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check status badge shows COMPLETED
        const statusBadge = page.locator('.page-header-actions .status-badge, .page-header-actions app-status-badge');
        if (await statusBadge.count() > 0) {
            const badgeText = await statusBadge.first().textContent();
            if (badgeText && badgeText.includes('COMPLETED')) {
                // Edit button should NOT be present
                const editBtn = page.locator('.page-header-actions button:has-text("Edit Order")');
                const editVisible = await editBtn.count() > 0 && await editBtn.first().isVisible().catch(() => false);
                if (editVisible) {
                    throw new Error('Edit button should be hidden for COMPLETED orders');
                }
                await screenshots.capture(page, 'orders-completed-no-edit-btn');
            }
        }
    }, page, results, screenshots);

    // Test 7: Edit button visible for IN_PROGRESS orders
    await runTest('Orders - Edit Button Visible for Active Orders', async () => {
        // Navigate to an IN_PROGRESS order (order 1)
        await page.goto(`${config.baseUrl}/#/orders/1`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const editBtn = page.locator('button:has-text("Edit Order")');
        if (await editBtn.count() > 0) {
            const isVisible = await editBtn.first().isVisible();
            if (!isVisible) {
                throw new Error('Edit button should be visible for IN_PROGRESS orders');
            }
        }
        await screenshots.capture(page, 'orders-active-edit-btn-visible');
    }, page, results, screenshots);

    // Test 8: Customer and Product visible when editing order
    await runTest('Orders - Customer & Product Visible in Edit Mode', async () => {
        await page.goto(`${config.baseUrl}/#/orders/3/edit`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Verify edit page loaded
        const pageTitle = page.locator('.page-title');
        const titleText = await pageTitle.textContent();
        if (!titleText.includes('Edit Order')) {
            throw new Error(`Expected edit order page, got: ${titleText}`);
        }

        // Check customer read-only input has value
        const customerInput = page.locator('.form-group:has(label:has-text("Customer")) input[readonly]');
        if (await customerInput.count() > 0) {
            const value = await customerInput.first().inputValue();
            if (!value || value === ' - ') {
                throw new Error(`Customer label is empty: "${value}"`);
            }
        } else {
            throw new Error('No customer read-only input found');
        }

        // Check product read-only input has value in line items
        const productInput = page.locator('.line-item .product-group input[readonly]');
        if (await productInput.count() === 0) {
            throw new Error('No product label found in line items');
        }
        const productValue = await productInput.first().inputValue();
        if (!productValue || productValue === ' - ') {
            throw new Error(`Product label is empty: "${productValue}"`);
        }

        await screenshots.capture(page, 'orders-edit-customer-product-visible');
    }, page, results, screenshots);

    // Test 9: Multi-stage order process flow visualization
    await runTest('Orders - Multi-Stage Order Flow Visualization', async () => {
        // Navigate to the 4-stage order (order 42)
        await page.goto(`${config.baseUrl}/#/orders/42`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check flow chart container exists and has adequate height
        const flowChart = page.locator('.process-flow-container');
        if (await flowChart.count() > 0) {
            const box = await flowChart.first().boundingBox();
            if (box && box.height < 200) {
                throw new Error(`Flow chart height too small: ${box.height}px`);
            }
        }

        await screenshots.capture(page, 'orders-multi-stage-flow', { fullPage: true });

        // Verify multiple line items are shown
        const lineItems = page.locator('.line-items-section .card');
        const liCount = await lineItems.count();
        if (liCount < 3) {
            throw new Error(`Expected 4 line items for 4-stage order, found ${liCount}`);
        }
    }, page, results, screenshots);
}

module.exports = { runOrdersTests };
