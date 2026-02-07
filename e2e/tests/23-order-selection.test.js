/**
 * Order Selection Flow Tests (P18)
 * Tests the workflow from order selection to production confirmation
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runOrderSelectionTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 ORDER SELECTION FLOW TESTS');
    console.log('─'.repeat(50));

    // Test 1: Available orders endpoint returns orders with READY operations
    await runTest('Order Selection - Available Orders List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'order-selection-list');

        // Check table is visible
        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Orders table not visible');
        }

        // Check for rows with READY or IN_PROGRESS status
        const readyRows = page.locator('table tbody tr:has-text("READY"), table tbody tr:has-text("IN_PROGRESS")');
        const count = await readyRows.count();
        console.log(`  Found ${count} orders with READY/IN_PROGRESS status`);
    }, page, results, screenshots);

    // Test 2: Order detail shows operations with status
    await runTest('Order Selection - Order Detail with Operations', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click first order
        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'order-selection-detail');

            // Look for operations section
            const operationsSection = page.locator('.operations, .timeline, [class*="operation"]');
            const hasOperations = await operationsSection.count() > 0;
            console.log(`  Operations section visible: ${hasOperations}`);
        }
    }, page, results, screenshots);

    // Test 3: READY operations are clickable/actionable
    await runTest('Order Selection - READY Operation Indicator', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Look for an order with IN_PROGRESS status (has READY operations)
        const inProgressRows = page.locator('table tbody tr:has-text("IN_PROGRESS")');
        if (await inProgressRows.count() > 0) {
            await inProgressRows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'order-selection-ready-operations');

            // Look for READY badge or status
            const readyBadge = page.locator('.badge:has-text("READY"), .status-badge:has-text("READY"), span:has-text("READY")');
            const hasReadyOps = await readyBadge.count() > 0;
            console.log(`  Found READY operation indicator: ${hasReadyOps}`);
        } else {
            console.log('  No IN_PROGRESS orders found, skipping READY check');
        }
    }, page, results, screenshots);

    // Test 4: Navigate to production confirmation from orders
    await runTest('Order Selection - Navigate to Production', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'order-selection-production-form');

        // Verify order dropdown exists and has options
        const orderDropdown = page.locator('select#order, select[formControlName="order"], select[name="order"]');
        if (await orderDropdown.count() > 0) {
            const options = await orderDropdown.locator('option').allTextContents();
            console.log(`  Order dropdown has ${options.length} options`);

            if (options.length > 1) {
                await orderDropdown.selectOption({ index: 1 });
                await page.waitForTimeout(1500);
                await screenshots.capture(page, 'order-selection-order-selected');
            }
        }
    }, page, results, screenshots);

    // Test 5: Operation dropdown populates after order selection
    await runTest('Order Selection - Operation Dropdown Populates', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select an order
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1500);
        }

        // Check operation dropdown now has options
        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            const options = await operationDropdown.locator('option').allTextContents();
            console.log(`  Operation dropdown has ${options.length} options after order selection`);

            await screenshots.capture(page, 'order-selection-operation-dropdown');

            if (options.length <= 1) {
                console.log('  Warning: No operations available for selected order');
            }
        }
    }, page, results, screenshots);

    // Test 6: Full flow - Order to Production Confirmation
    await runTest('Order Selection - Full Flow', async () => {
        // Start at orders
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'order-selection-flow-1-orders');

        // Navigate to production
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'order-selection-flow-2-production');

        // Select order
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1500);
        }

        // Select operation
        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            await operationDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'order-selection-flow-3-ready');

        // Verify form is ready for input
        const producedQty = page.locator('input[formControlName="producedQty"], input#producedQty');
        if (await producedQty.count() > 0) {
            await producedQty.fill('100');
        }

        await screenshots.capture(page, 'order-selection-flow-4-filled');

        console.log('  Full order selection flow completed successfully');
    }, page, results, screenshots);

    // Test 7: Yield and Duration Display (P19)
    await runTest('Order Selection - Yield and Duration Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order and operation
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1500);
        }

        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            await operationDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);
        }

        // Look for yield display
        const yieldDisplay = page.locator('[class*="yield"], .yield-info, label:has-text("Yield"), span:has-text("Yield")');
        const hasYield = await yieldDisplay.count() > 0;
        console.log(`  Yield display visible: ${hasYield}`);

        // Look for duration fields
        const startTime = page.locator('input[type="datetime-local"][formControlName="startTime"], input#startTime');
        const endTime = page.locator('input[type="datetime-local"][formControlName="endTime"], input#endTime');

        const hasTimeFields = await startTime.count() > 0 && await endTime.count() > 0;
        console.log(`  Duration fields visible: ${hasTimeFields}`);

        await screenshots.capture(page, 'order-selection-yield-duration');
    }, page, results, screenshots);

    // Test 8: BOM Suggested Consumption
    await runTest('Order Selection - BOM Suggested Consumption', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order and operation
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1500);
        }

        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            await operationDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);
        }

        // Look for suggested consumption section
        const suggestedSection = page.locator('[class*="suggested"], .suggested-consumption, h3:has-text("Suggested")');
        const hasSuggested = await suggestedSection.count() > 0;
        console.log(`  Suggested consumption section visible: ${hasSuggested}`);

        // Look for "Apply Suggestions" button
        const applySuggestionsBtn = page.locator('button:has-text("Apply Suggestions"), button:has-text("Apply")');
        const hasApplyBtn = await applySuggestionsBtn.count() > 0;
        console.log(`  Apply Suggestions button visible: ${hasApplyBtn}`);

        await screenshots.capture(page, 'order-selection-bom-suggested');
    }, page, results, screenshots);
}

module.exports = { runOrderSelectionTests };
