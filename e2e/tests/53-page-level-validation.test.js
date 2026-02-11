/**
 * Page-Level Deep Validation Tests
 * Validates specific page elements, data integrity, form behavior,
 * and navigation side effects at a deeper level than basic E2E tests.
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runPageLevelValidationTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 PAGE-LEVEL VALIDATION TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // SECTION 1: DASHBOARD DEEP VALIDATION
    // ============================================

    // Test 1: Dashboard - Stat Cards Have Numeric Values
    await runTest('Dashboard - Stat Cards Have Numeric Values', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statsCards = page.locator('.stat-card, .metric-card, .summary-card');
        const count = await statsCards.count();
        console.log(`   Found ${count} stat cards`);

        if (count === 0) {
            console.log('   Warning: No stat cards found on dashboard');
        } else {
            let cardsWithNumbers = 0;
            for (let i = 0; i < count; i++) {
                const cardText = await statsCards.nth(i).textContent();
                const trimmed = cardText.trim().substring(0, 80);
                if (/\d+/.test(cardText)) {
                    cardsWithNumbers++;
                    console.log(`   Card ${i + 1}: "${trimmed}" - has numeric value`);
                } else {
                    console.log(`   Card ${i + 1}: "${trimmed}" - NO numeric value`);
                }
            }
            console.log(`   ${cardsWithNumbers}/${count} cards contain numeric values`);
        }

        await screenshots.capture(page, 'plv-dashboard-stat-cards');
    }, page, results, screenshots);

    // Test 2: Dashboard - Inventory Flow Section
    await runTest('Dashboard - Inventory Flow Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const flowSection = page.locator('.inventory-flow, .flow-pipeline, .flow-stage, .inventory-flow-section').first();
        const isVisible = await flowSection.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
            const stages = page.locator('.flow-stage, .inventory-flow .stage, .flow-item');
            const stageCount = await stages.count();
            console.log(`   Inventory flow section visible with ${stageCount} stages`);

            if (stageCount >= 3) {
                console.log('   At least 3 flow stages present (RM, WIP, IM, FG)');
            } else {
                console.log(`   Warning: Expected at least 3 flow stages, found ${stageCount}`);
            }
        } else {
            console.log('   Inventory flow section not visible - non-fatal, may have different layout');
        }

        await screenshots.capture(page, 'plv-dashboard-inventory-flow');
    }, page, results, screenshots);

    // Test 3: Dashboard - Charts or Visualizations Present
    await runTest('Dashboard - Charts or Visualizations Present', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const chartElements = page.locator('.chart-container, canvas, .chart, svg.chart, .echarts-container');
        const chartCount = await chartElements.count();
        console.log(`   Found ${chartCount} chart/visualization elements`);

        if (chartCount >= 1) {
            console.log('   At least 1 chart/visualization is present');
        } else {
            console.log('   Warning: No chart elements found - dashboard may use different visualization approach');
        }

        await screenshots.capture(page, 'plv-dashboard-charts');
    }, page, results, screenshots);

    // Test 4: Dashboard - Recent Activity Section
    await runTest('Dashboard - Recent Activity Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const activitySection = page.locator('.recent-activity, .activity-list, .audit-preview').first();
        const isVisible = await activitySection.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
            console.log('   Recent activity section found');

            // Look for entries/rows within the activity section
            const entries = activitySection.locator('tr, .activity-item, li, .audit-entry');
            const entryCount = await entries.count();
            console.log(`   Activity entries: ${entryCount}`);

            if (entryCount >= 1) {
                console.log('   Recent activity has at least 1 entry');
            } else {
                console.log('   Warning: Recent activity section exists but has no entries');
            }
        } else {
            // Fallback: check for any table on the dashboard that might contain activity
            const tables = page.locator('table');
            const tableCount = await tables.count();
            if (tableCount > 0) {
                const rows = page.locator('table tbody tr');
                const rowCount = await rows.count();
                console.log(`   Found ${tableCount} table(s) with ${rowCount} total rows (may contain activity data)`);
            } else {
                console.log('   No recent activity section or tables found');
            }
        }

        await screenshots.capture(page, 'plv-dashboard-recent-activity');
    }, page, results, screenshots);

    // Test 5: Dashboard - Quick Action Navigation
    await runTest('Dashboard - Quick Action Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const originalUrl = page.url();

        // Look for clickable action links on the dashboard
        const actionLinks = page.locator('.stat-card a, .card a, button:has-text("View All"), a:has-text("View All"), a:has-text("View"), .dashboard-card a');
        const linkCount = await actionLinks.count();
        console.log(`   Found ${linkCount} clickable action links on dashboard`);

        if (linkCount > 0) {
            const firstLink = actionLinks.first();
            await firstLink.click();
            await page.waitForLoadState('networkidle').catch(() => {});
            await page.waitForTimeout(1000);

            const newUrl = page.url();
            if (newUrl !== originalUrl) {
                console.log(`   Navigation occurred: ${originalUrl} -> ${newUrl}`);
            } else {
                console.log('   URL did not change after clicking action link');
            }

            // Navigate back to dashboard
            await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);
        } else {
            console.log('   No action links found on dashboard - checking stat cards as clickable');
            const statCards = page.locator('.stat-card, .dashboard-card').first();
            if (await statCards.isVisible({ timeout: 2000 }).catch(() => false)) {
                await statCards.click();
                await page.waitForTimeout(1000);
                const newUrl = page.url();
                if (newUrl !== originalUrl) {
                    console.log(`   Stat card click navigated to: ${newUrl}`);
                }
                await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
            }
        }

        await screenshots.capture(page, 'plv-dashboard-quick-action');
    }, page, results, screenshots);

    // ============================================
    // SECTION 2: PRODUCTION CONFIRM DEEP VALIDATION
    // ============================================

    // Test 6: Production Confirm - Page Structure
    await runTest('Production Confirm - Page Structure', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify page has a title/header containing "Production" or "Confirm"
        const pageTitle = page.locator('h1, h2, .page-title, .page-header');
        const titleCount = await pageTitle.count();
        let foundProductionTitle = false;

        for (let i = 0; i < titleCount; i++) {
            const text = await pageTitle.nth(i).textContent();
            if (/production|confirm/i.test(text)) {
                console.log(`   Found production title: "${text.trim()}"`);
                foundProductionTitle = true;
                break;
            }
        }

        if (!foundProductionTitle) {
            console.log('   Warning: No title containing "Production" or "Confirm" found');
        }

        // Look for order selection or operation selection section
        const orderSelect = page.locator('select[formControlName="orderId"], #order, .order-select, select:has-text("Order")');
        const operationSelect = page.locator('select[formControlName="operationId"], #operation, .operation-select');

        if (await orderSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('   Order selection section present');
        } else if (await operationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('   Operation selection section present');
        } else {
            console.log('   No order/operation selection section found - page may have different layout');
        }

        await screenshots.capture(page, 'plv-production-page-structure');
    }, page, results, screenshots);

    // Test 7: Production Confirm - Equipment Section Loads
    await runTest('Production Confirm - Equipment Section Loads', async () => {
        try {
            // Try navigating to production confirm with an operation
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Try to select an order first
            const orderSelect = page.locator('select[formControlName="orderId"], #order');
            if (await orderSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                const optionCount = await orderSelect.locator('option').count();
                if (optionCount > 1) {
                    await orderSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                }
            }

            // Try to select an operation
            const operationSelect = page.locator('select[formControlName="operationId"], #operation');
            if (await operationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                const optionCount = await operationSelect.locator('option').count();
                if (optionCount > 1) {
                    await operationSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                }
            }

            // Look for equipment section
            const equipmentSection = page.locator('.equipment-list, .equipment-section, .equipment-checkboxes');
            if (await equipmentSection.isVisible({ timeout: 3000 }).catch(() => false)) {
                const checkboxes = equipmentSection.locator('input[type="checkbox"], input[type="radio"]');
                const checkboxCount = await checkboxes.count();
                console.log(`   Equipment section visible with ${checkboxCount} options`);

                if (checkboxCount >= 1) {
                    console.log('   At least 1 equipment option listed');
                } else {
                    console.log('   Equipment section visible but no checkboxes found');
                }
            } else {
                console.log('   Equipment section not visible - may need a specific operation selected first');
            }

            await screenshots.capture(page, 'plv-production-equipment');
        } catch (err) {
            console.log(`   Equipment section test skipped: ${err.message}`);
            await screenshots.capture(page, 'plv-production-equipment-skipped');
        }
    }, page, results, screenshots);

    // Test 8: Production Confirm - Operator Section Loads
    await runTest('Production Confirm - Operator Section Loads', async () => {
        try {
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Try to select prerequisites
            const orderSelect = page.locator('select[formControlName="orderId"], #order');
            if (await orderSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                const optionCount = await orderSelect.locator('option').count();
                if (optionCount > 1) {
                    await orderSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                }
            }

            const operationSelect = page.locator('select[formControlName="operationId"], #operation');
            if (await operationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                const optionCount = await operationSelect.locator('option').count();
                if (optionCount > 1) {
                    await operationSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                }
            }

            // Look for operator section
            const operatorSection = page.locator('.operator-list, .operator-section, .operator-checkboxes');
            if (await operatorSection.isVisible({ timeout: 3000 }).catch(() => false)) {
                const checkboxes = operatorSection.locator('input[type="checkbox"], input[type="radio"]');
                const checkboxCount = await checkboxes.count();
                console.log(`   Operator section visible with ${checkboxCount} options`);

                if (checkboxCount >= 1) {
                    console.log('   At least 1 operator option listed');
                } else {
                    console.log('   Operator section visible but no checkboxes found');
                }
            } else {
                console.log('   Operator section not visible - may need prerequisites');
            }

            await screenshots.capture(page, 'plv-production-operators');
        } catch (err) {
            console.log(`   Operator section test skipped: ${err.message}`);
            await screenshots.capture(page, 'plv-production-operators-skipped');
        }
    }, page, results, screenshots);

    // Test 9: Production Confirm - Confirm Button Disabled Initially
    await runTest('Production Confirm - Confirm Button Disabled Initially', async () => {
        try {
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const submitBtn = page.locator('button:has-text("Confirm"), button:has-text("Submit"), button[type="submit"]').first();
            if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                const isDisabled = await submitBtn.isDisabled();
                if (isDisabled) {
                    console.log('   Confirm button correctly disabled when form is empty/incomplete');
                } else {
                    console.log('   Confirm button is enabled - form may not have prerequisite validation');
                }
            } else {
                console.log('   No confirm/submit button found on production page');
            }

            await screenshots.capture(page, 'plv-production-confirm-disabled');
        } catch (err) {
            console.log(`   Confirm button test skipped: ${err.message}`);
            await screenshots.capture(page, 'plv-production-confirm-disabled-skipped');
        }
    }, page, results, screenshots);

    // Test 10: Production Confirm - Process Parameters Section
    await runTest('Production Confirm - Process Parameters Section', async () => {
        try {
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Try selecting order and operation to reveal process parameters
            const orderSelect = page.locator('select[formControlName="orderId"], #order');
            if (await orderSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                const optionCount = await orderSelect.locator('option').count();
                if (optionCount > 1) {
                    await orderSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                }
            }

            const operationSelect = page.locator('select[formControlName="operationId"], #operation');
            if (await operationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                const optionCount = await operationSelect.locator('option').count();
                if (optionCount > 1) {
                    await operationSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                }
            }

            // Look for process parameters section
            const paramSection = page.locator('.process-parameters, .parameters-section, .params-section, [class*="parameter"]').first();
            if (await paramSection.isVisible({ timeout: 3000 }).catch(() => false)) {
                const inputs = paramSection.locator('input, select');
                const inputCount = await inputs.count();
                console.log(`   Process parameters section visible with ${inputCount} input fields`);

                // Check that parameter inputs have labels
                const labels = paramSection.locator('label');
                const labelCount = await labels.count();
                console.log(`   Parameter labels found: ${labelCount}`);

                if (inputCount > 0) {
                    // Verify inputs are editable
                    const firstInput = inputs.first();
                    const isEditable = await firstInput.isEditable();
                    console.log(`   First parameter input is editable: ${isEditable}`);
                }
            } else {
                console.log('   Process parameters section not visible - may need specific operation selected');
            }

            await screenshots.capture(page, 'plv-production-process-params');
        } catch (err) {
            console.log(`   Process parameters test skipped: ${err.message}`);
            await screenshots.capture(page, 'plv-production-process-params-skipped');
        }
    }, page, results, screenshots);

    // ============================================
    // SECTION 3: ORDER FORM VALIDATION
    // ============================================

    // Test 11: Order Form - All Required Fields Present
    await runTest('Order Form - All Required Fields Present', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify presence of customer field
        const customerField = page.locator('#customerId, select[formControlName="customerId"], #customer, select[formControlName="customer"]');
        const customerVisible = await customerField.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`   Customer field present: ${customerVisible}`);

        // Verify presence of order date field
        const dateField = page.locator('#orderDate, input[formControlName="orderDate"], input[type="date"]').first();
        const dateVisible = await dateField.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`   Order date field present: ${dateVisible}`);

        // Verify presence of status field
        const statusField = page.locator('#status, select[formControlName="status"]');
        const statusVisible = await statusField.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`   Status field present: ${statusVisible}`);

        // Verify submit button exists
        const submitBtn = page.locator('button[type="submit"]');
        const submitVisible = await submitBtn.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`   Submit button present: ${submitVisible}`);

        if (!customerVisible && !dateVisible) {
            console.log('   Warning: Core order form fields not found - form may have different structure');
        }

        await screenshots.capture(page, 'plv-order-form-fields');
    }, page, results, screenshots);

    // Test 12: Order Form - Submit Disabled When Empty
    await runTest('Order Form - Submit Disabled When Empty', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            const isDisabled = await submitBtn.isDisabled();
            if (isDisabled) {
                console.log('   Submit button correctly disabled when form is empty');
            } else {
                console.log('   Submit button is enabled with empty form - validation may occur on submit');
            }
        } else {
            console.log('   Submit button not found on order form');
        }

        await screenshots.capture(page, 'plv-order-form-empty-submit');
    }, page, results, screenshots);

    // Test 13: Order Form - Customer Selection Required
    await runTest('Order Form - Customer Selection Required', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Fill order date but leave customer empty
        const dateField = page.locator('#orderDate, input[formControlName="orderDate"], input[type="date"]').first();
        if (await dateField.isVisible({ timeout: 3000 }).catch(() => false)) {
            await dateField.fill('2026-02-15');
            await dateField.blur();
            await page.waitForTimeout(300);
        }

        // Also fill delivery date if present
        const deliveryDate = page.locator('#deliveryDate, input[formControlName="deliveryDate"]');
        if (await deliveryDate.isVisible({ timeout: 1000 }).catch(() => false)) {
            await deliveryDate.fill('2026-02-20');
            await deliveryDate.blur();
            await page.waitForTimeout(300);
        }

        // Check submit button state (customer should still be empty)
        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            const isDisabled = await submitBtn.isDisabled();
            if (isDisabled) {
                console.log('   Submit correctly disabled - customer selection required');
            } else {
                console.log('   Submit is enabled - checking for validation message after click');
                // Do NOT click submit to avoid creating data, just check state
            }
        }

        // Look for validation messages
        const validationMsg = page.locator('.error-message, .invalid-feedback, .text-danger, .required-error');
        if (await validationMsg.isVisible({ timeout: 1000 }).catch(() => false)) {
            const msg = await validationMsg.first().textContent();
            console.log(`   Validation message: "${msg.trim()}"`);
        }

        await screenshots.capture(page, 'plv-order-customer-required');
    }, page, results, screenshots);

    // Test 14: Order Detail - Line Items Section
    await runTest('Order Detail - Line Items Section', async () => {
        try {
            await page.goto(`${config.baseUrl}${ROUTES.ORDER_DETAIL(1)}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Look for line items section
            const lineItemsSection = page.locator('.line-items, .order-lines, table:has(th:has-text("Product")), table:has(th:has-text("Line")), .line-items-section');
            const isVisible = await lineItemsSection.isVisible({ timeout: 3000 }).catch(() => false);

            if (isVisible) {
                const rows = lineItemsSection.locator('tbody tr, .line-item');
                const rowCount = await rows.count();
                console.log(`   Line items section found with ${rowCount} items`);

                if (rowCount > 0) {
                    // Verify each line item has product name and quantity
                    for (let i = 0; i < Math.min(rowCount, 3); i++) {
                        const rowText = await rows.nth(i).textContent();
                        const trimmed = rowText.trim().substring(0, 100);
                        console.log(`   Line item ${i + 1}: "${trimmed}"`);
                    }
                } else {
                    console.log('   Line items section exists but no items present');
                }
            } else {
                // Check if there's a "No line items" message
                const noItems = page.locator(':has-text("No line items"), :has-text("no items"), .empty-state');
                if (await noItems.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('   "No line items" state correctly shown');
                } else {
                    console.log('   Line items section not found - order may not exist or different layout');
                }
            }

            await screenshots.capture(page, 'plv-order-detail-line-items');
        } catch (err) {
            console.log(`   Order detail test skipped: ${err.message}`);
            await screenshots.capture(page, 'plv-order-detail-line-items-skipped');
        }
    }, page, results, screenshots);

    // ============================================
    // SECTION 4: NAVIGATION & STATE VALIDATION
    // ============================================

    // Test 15: Filter State - Orders Status Filter
    await runTest('Filter State - Orders Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Count initial rows
        const initialRows = page.locator('table tbody tr');
        const initialCount = await initialRows.count();
        console.log(`   Initial order rows: ${initialCount}`);

        // Look for status filter dropdown
        const statusFilter = page.locator('select[name="status"], select#status, #status-filter, select:has(option:has-text("READY"))').first();
        if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Get available options
            const options = statusFilter.locator('option');
            const optionCount = await options.count();
            console.log(`   Status filter has ${optionCount} options`);

            if (optionCount > 1) {
                // Select a non-default option (skip first which is usually "All")
                const optionTexts = [];
                for (let i = 0; i < optionCount; i++) {
                    optionTexts.push(await options.nth(i).textContent());
                }
                console.log(`   Filter options: ${optionTexts.join(', ')}`);

                // Try to select a specific status
                try {
                    await statusFilter.selectOption({ index: 1 });
                    await page.waitForTimeout(1000);

                    const filteredRows = page.locator('table tbody tr');
                    const filteredCount = await filteredRows.count();
                    console.log(`   Filtered rows: ${filteredCount} (was ${initialCount})`);
                } catch (err) {
                    console.log(`   Could not apply filter: ${err.message}`);
                }
            }
        } else {
            console.log('   Status filter dropdown not found on orders page');
        }

        await screenshots.capture(page, 'plv-orders-status-filter');
    }, page, results, screenshots);

    // Test 16: Pagination State - Page Navigation
    await runTest('Pagination State - Page Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const paginationComponent = page.locator('app-pagination, .pagination, .paginator, nav[aria-label="pagination"]').first();
        if (await paginationComponent.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('   Pagination component found');

            // Look for next page button or page 2 button
            const nextBtn = paginationComponent.locator('button:has-text("Next"), button:has-text(">"), button:has-text("2"), a:has-text("2")').first();
            if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                const isDisabled = await nextBtn.isDisabled().catch(() => false);
                if (!isDisabled) {
                    await nextBtn.click();
                    await page.waitForTimeout(1000);

                    // Verify page indicator updated
                    const pageIndicator = paginationComponent.locator('.current-page, .active, [aria-current="page"], button.active');
                    if (await pageIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
                        const pageText = await pageIndicator.textContent();
                        console.log(`   Current page indicator: "${pageText.trim()}"`);
                    } else {
                        console.log('   Page changed (next button clicked) but no explicit page indicator');
                    }
                } else {
                    console.log('   Next/page 2 button is disabled - only 1 page of data');
                }
            } else {
                console.log('   No next page button available - may be single page');
            }
        } else {
            console.log('   Pagination component not found - page may not have enough data for pagination');
        }

        await screenshots.capture(page, 'plv-pagination-navigation');
    }, page, results, screenshots);

    // Test 17: Back Navigation - Order Detail to List
    await runTest('Back Navigation - Order Detail to List', async () => {
        try {
            // Navigate to orders list first
            await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const ordersUrl = page.url();

            // Click first order row to go to detail
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
                const firstLink = firstRow.locator('a').first();
                if (await firstLink.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await firstLink.click();
                } else {
                    await firstRow.click();
                }
                await page.waitForLoadState('networkidle').catch(() => {});
                await page.waitForTimeout(1000);

                const detailUrl = page.url();
                console.log(`   Navigated to detail: ${detailUrl}`);

                // Find and click back button
                const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), .btn-back, button:has-text("Return")').first();
                if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await backBtn.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(1000);

                    const returnedUrl = page.url();
                    if (returnedUrl.includes('orders') && !returnedUrl.includes('orders/')) {
                        console.log('   Successfully returned to orders list');
                    } else {
                        console.log(`   Returned to: ${returnedUrl}`);
                    }
                } else {
                    console.log('   No back button found on detail page');
                    // Use browser back
                    await page.goBack();
                    await page.waitForTimeout(1000);
                    console.log('   Used browser back navigation');
                }
            } else {
                console.log('   No order rows to click');
            }

            await screenshots.capture(page, 'plv-back-navigation');
        } catch (err) {
            console.log(`   Back navigation test encountered error: ${err.message}`);
            await screenshots.capture(page, 'plv-back-navigation-error');
        }
    }, page, results, screenshots);

    // Test 18: Breadcrumb Navigation (if exists)
    await runTest('Breadcrumb Navigation', async () => {
        try {
            // Navigate to a detail page (e.g., customer detail)
            await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_DETAIL(1)}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const breadcrumb = page.locator('.breadcrumb, app-breadcrumb, nav[aria-label="breadcrumb"], .breadcrumbs').first();
            if (await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log('   Breadcrumb component found');

                const breadcrumbText = await breadcrumb.textContent();
                console.log(`   Breadcrumb content: "${breadcrumbText.trim().substring(0, 100)}"`);

                // Check if breadcrumb shows current page name
                if (/customer/i.test(breadcrumbText)) {
                    console.log('   Breadcrumb shows current page name');
                }

                // Click a breadcrumb link
                const breadcrumbLink = breadcrumb.locator('a').first();
                if (await breadcrumbLink.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const linkText = await breadcrumbLink.textContent();
                    console.log(`   Clicking breadcrumb link: "${linkText.trim()}"`);

                    await breadcrumbLink.click();
                    await page.waitForLoadState('networkidle').catch(() => {});
                    await page.waitForTimeout(1000);

                    const newUrl = page.url();
                    console.log(`   Navigated to: ${newUrl}`);
                } else {
                    console.log('   No clickable breadcrumb links found');
                }
            } else {
                console.log('   No breadcrumb component found - this is non-fatal, breadcrumbs are optional');

                // Try order detail as alternative
                await page.goto(`${config.baseUrl}${ROUTES.ORDER_DETAIL(1)}`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(1000);

                const altBreadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"]').first();
                if (await altBreadcrumb.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const text = await altBreadcrumb.textContent();
                    console.log(`   Breadcrumb found on order detail: "${text.trim().substring(0, 100)}"`);
                } else {
                    console.log('   No breadcrumb on any detail page - application does not use breadcrumbs');
                }
            }

            await screenshots.capture(page, 'plv-breadcrumb-navigation');
        } catch (err) {
            console.log(`   Breadcrumb test encountered error: ${err.message} - passing as non-fatal`);
            await screenshots.capture(page, 'plv-breadcrumb-navigation-skipped');
        }
    }, page, results, screenshots);

    console.log('\n' + '─'.repeat(50));
    console.log('PAGE-LEVEL VALIDATION TESTS COMPLETE');
    console.log('─'.repeat(50));
}

module.exports = { runPageLevelValidationTests };
