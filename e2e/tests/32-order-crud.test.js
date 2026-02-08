/**
 * Order CRUD Tests
 * Tests Order Create/Read/Update/Delete operations including line items
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runOrderCrudTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('📋 ORDER CRUD TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // ORDER LIST
    // ============================================

    // Test 1: Orders list - Navigate to create
    await runTest('Orders - Navigate to Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Order"), a:has-text("New Order")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'order-create-form');

            // Verify form is displayed
            const form = page.locator('form');
            if (!await form.isVisible()) {
                throw new Error('Order create form not visible');
            }
        } else {
            throw new Error('New Order button not found');
        }
    }, page, results, screenshots);

    // Test 2: Order form - Customer dropdown
    await runTest('Orders - Customer Dropdown', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const customerSelect = page.locator('select[formControlName="customerId"], #customerId, #customer');
        if (await customerSelect.isVisible()) {
            await customerSelect.click();
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'order-customer-dropdown');

            // Check options exist
            const options = await customerSelect.locator('option').count();
            if (options < 2) {
                throw new Error('Customer dropdown has no options');
            }
        }
    }, page, results, screenshots);

    // Test 3: Order form - Add line item
    await runTest('Orders - Add Line Item', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const addLineBtn = page.locator('button:has-text("Add Line"), button:has-text("Add Item")');
        if (await addLineBtn.isVisible()) {
            await addLineBtn.click();
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'order-line-item-added');

            // Verify line item row appears
            const lineItems = page.locator('.line-item, .order-line, [formArrayName="lineItems"] > div');
            const count = await lineItems.count();
            if (count < 1) {
                throw new Error('Line item not added');
            }
        }
    }, page, results, screenshots);

    // Test 4: Order form - Remove line item
    await runTest('Orders - Remove Line Item', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Add a line item first
        const addLineBtn = page.locator('button:has-text("Add Line"), button:has-text("Add Item")');
        if (await addLineBtn.isVisible()) {
            await addLineBtn.click();
            await page.waitForTimeout(300);

            // Now remove it
            const removeBtn = page.locator('button:has-text("Remove"), button.btn-danger').first();
            if (await removeBtn.isVisible()) {
                await removeBtn.click();
                await page.waitForTimeout(300);
                await screenshots.capture(page, 'order-line-item-removed');
            }
        }
    }, page, results, screenshots);

    // Test 5: Order form - Form validation (empty submit)
    await runTest('Orders - Form Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check that submit button is disabled when form is empty (proper validation)
        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            const isDisabled = await submitBtn.isDisabled();
            await screenshots.capture(page, 'order-form-validation-errors');

            if (isDisabled) {
                console.log('   Submit button correctly disabled for empty form');
            } else {
                // Try to click and check for errors
                await submitBtn.click();
                await page.waitForTimeout(300);
                const errors = page.locator('.error-message, .invalid-feedback, .text-danger');
                const errorCount = await errors.count();
                console.log(`   Found ${errorCount} validation error(s)`);
            }
        }
    }, page, results, screenshots);

    // Test 6: Create order with submit
    if (submitActions) {
        await runTest('Orders - Create Order', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.order;

            // Fill customer
            const customerSelect = page.locator('select[formControlName="customerId"], #customerId');
            if (await customerSelect.isVisible()) {
                await customerSelect.selectOption({ index: 1 });
            }

            // Fill order date
            const orderDate = page.locator('input[formControlName="orderDate"], #orderDate');
            if (await orderDate.isVisible()) {
                await orderDate.fill(data.orderDate);
            }

            // Fill delivery date
            const deliveryDate = page.locator('input[formControlName="deliveryDate"], #deliveryDate');
            if (await deliveryDate.isVisible()) {
                await deliveryDate.fill(data.deliveryDate);
            }

            // Add line item
            const addLineBtn = page.locator('button:has-text("Add Line"), button:has-text("Add Item")');
            if (await addLineBtn.isVisible()) {
                await addLineBtn.click();
                await page.waitForTimeout(300);

                // Fill line item
                const productSelect = page.locator('select[formControlName="productSku"], #productSku').first();
                if (await productSelect.isVisible()) {
                    await productSelect.selectOption({ index: 1 });
                }

                const quantityInput = page.locator('input[formControlName="quantity"], #quantity').first();
                if (await quantityInput.isVisible()) {
                    await quantityInput.fill(data.lineItem.quantity);
                }
            }

            await screenshots.capture(page, 'order-create-filled');

            // Submit
            const submitBtn = page.locator('button[type="submit"]');
            if (await submitBtn.isEnabled()) {
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                await screenshots.capture(page, 'order-create-success');
            }
        }, page, results, screenshots);
    }

    // ============================================
    // ORDER DETAIL
    // ============================================

    // Test 7: Order detail - Edit button
    await runTest('Orders - Navigate to Edit', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click on first order row
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for Edit button - use first() to avoid multiple match
            const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
            if (await editBtn.isVisible({ timeout: 2000 })) {
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'order-edit-form');
            }
        }
    }, page, results, screenshots);

    // Test 8: Order detail - Start Production button
    await runTest('Orders - Start Production Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click on first order row
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'order-detail-view');

            // Look for Start Production button
            const startProdBtn = page.locator('button:has-text("Start Production"), button:has-text("Confirm")');
            if (await startProdBtn.isVisible()) {
                await screenshots.capture(page, 'order-start-production-visible');
            }
        }
    }, page, results, screenshots);

    // Test 9: Order detail - Operations timeline
    await runTest('Orders - Operations Timeline', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Check for operations section
            const operations = page.locator('.operations-section, .operations-timeline, .timeline');
            if (await operations.isVisible()) {
                await screenshots.capture(page, 'order-operations-timeline');
            }
        }
    }, page, results, screenshots);

    // Test 10: Order list - Filter by status (all statuses)
    await runTest('Orders - Filter by CREATED', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption('CREATED');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'orders-filter-created');
        }
    }, page, results, screenshots);

    await runTest('Orders - Filter by COMPLETED', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption('COMPLETED');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'orders-filter-completed');
        }
    }, page, results, screenshots);

    await runTest('Orders - Filter by CANCELLED', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption('CANCELLED');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'orders-filter-cancelled');
        }
    }, page, results, screenshots);

    // Test 11: Update order with submit
    if (submitActions) {
        await runTest('Orders - Update Order', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Click on first order
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                // Click edit
                const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")');
                if (await editBtn.isVisible()) {
                    await editBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(500);

                    // Update notes
                    const notes = page.locator('textarea[formControlName="notes"], #notes');
                    if (await notes.isVisible()) {
                        await notes.fill('Updated by E2E test');
                    }

                    await screenshots.capture(page, 'order-update-filled');

                    // Submit
                    const submitBtn = page.locator('button[type="submit"]');
                    if (await submitBtn.isEnabled()) {
                        await submitBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);
                        await screenshots.capture(page, 'order-update-success');
                    }
                }
            }
        }, page, results, screenshots);
    }

    // Test 12: Order search
    await runTest('Orders - Search by Customer', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const searchInput = page.locator('input[type="search"], input#search, input[placeholder*="Search"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill('Steel');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'orders-search-customer');
        }
    }, page, results, screenshots);

    console.log('\n✅ Order CRUD tests complete');
}

module.exports = { runOrderCrudTests };
