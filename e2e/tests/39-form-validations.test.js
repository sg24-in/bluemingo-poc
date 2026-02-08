/**
 * Form Validations Tests
 * Tests form validation rules across all modules
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runFormValidationsTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('✅ FORM VALIDATIONS TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // AUTH VALIDATIONS
    // ============================================

    // Test 1: Login - Password min length
    await runTest('Auth - Password Min Length', async () => {
        await page.goto(`${config.baseUrl}/#/login`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const emailInput = page.locator('input[formControlName="email"], #email, input[type="email"]');
        const passwordInput = page.locator('input[formControlName="password"], #password, input[type="password"]');

        if (await emailInput.isVisible({ timeout: 3000 })) {
            await emailInput.fill('test@test.com');
            await passwordInput.fill('123'); // Too short
            await passwordInput.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'auth-password-min-validation');

            const error = page.locator('.error-message, .invalid-feedback, .text-danger');
            if (await error.isVisible({ timeout: 1000 })) {
                console.log('   Password min length validation shown');
            } else {
                // Check if submit button is disabled
                const submitBtn = page.locator('button[type="submit"]');
                if (await submitBtn.isDisabled()) {
                    console.log('   Form invalid - submit button disabled');
                }
            }
        } else {
            console.log('   Already logged in - skipping login validation test');
        }
    }, page, results, screenshots);

    // ============================================
    // ORDER VALIDATIONS
    // ============================================

    // Test 2: Order - Required customer
    await runTest('Order - Required Customer', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check that submit button is disabled without customer (proper validation)
        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            const isDisabled = await submitBtn.isDisabled();
            await screenshots.capture(page, 'order-customer-required');

            if (isDisabled) {
                console.log('   Submit button correctly disabled - customer required');
            } else {
                console.log('   Submit button enabled - form may not require customer selection first');
            }
        }
    }, page, results, screenshots);

    // Test 3: Order Line - Quantity min
    await runTest('Order - Line Item Quantity Min', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Add a line item
        const addLineBtn = page.locator('button:has-text("Add Line"), button:has-text("Add Item")');
        if (await addLineBtn.isVisible()) {
            await addLineBtn.click();
            await page.waitForTimeout(300);

            // Fill with 0 quantity
            const qtyInput = page.locator('input[formControlName="quantity"], #quantity').first();
            if (await qtyInput.isVisible()) {
                await qtyInput.fill('0');
                await qtyInput.blur();
                await page.waitForTimeout(300);

                await screenshots.capture(page, 'order-line-quantity-min');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // CUSTOMER VALIDATIONS
    // ============================================

    // Test 4: Customer - Email format
    await runTest('Customer - Email Format', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const emailInput = page.locator('#email, input[formControlName="email"]');
        if (await emailInput.isVisible()) {
            await emailInput.fill('invalid-email');
            await emailInput.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'customer-email-validation');
        }
    }, page, results, screenshots);

    // Test 5: Customer - Required name
    await runTest('Customer - Required Name', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            const isDisabled = await submitBtn.isDisabled();
            await screenshots.capture(page, 'customer-name-required');

            if (isDisabled) {
                console.log('   Submit button correctly disabled - name required');
            } else {
                console.log('   Submit button enabled - checking for validation errors on click');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // MATERIAL VALIDATIONS
    // ============================================

    // Test 6: Material - Required fields
    await runTest('Material - Required Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIAL_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            const isDisabled = await submitBtn.isDisabled();
            await screenshots.capture(page, 'material-required-fields');

            if (isDisabled) {
                console.log('   Submit button correctly disabled - required fields empty');
            } else {
                console.log('   Submit button enabled');
            }
        }
    }, page, results, screenshots);

    // Test 7: Material - Unique ID (if duplicate submitted)
    if (submitActions) {
        await runTest('Material - Unique ID', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.MATERIAL_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Fill with existing material ID
            const codeInput = page.locator('#materialCode, input[formControlName="materialCode"]');
            if (await codeInput.isVisible()) {
                await codeInput.fill('RM-IRON-001'); // Likely existing
            }

            const nameInput = page.locator('#materialName, input[formControlName="materialName"]');
            if (await nameInput.isVisible()) {
                await nameInput.fill('Duplicate Test');
            }

            const typeSelect = page.locator('#materialType, select[formControlName="materialType"]');
            if (await typeSelect.isVisible()) {
                await typeSelect.selectOption({ index: 1 });
            }

            const unitSelect = page.locator('#baseUnit, select[formControlName="baseUnit"]');
            if (await unitSelect.isVisible()) {
                await unitSelect.selectOption({ index: 1 });
            }

            const submitBtn = page.locator('button[type="submit"]');
            if (await submitBtn.isEnabled()) {
                await submitBtn.click();
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'material-unique-id-error');
            }
        }, page, results, screenshots);
    }

    // ============================================
    // PRODUCT VALIDATIONS
    // ============================================

    // Test 8: Product - Required SKU
    await runTest('Product - Required SKU', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCT_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            const isDisabled = await submitBtn.isDisabled();
            await screenshots.capture(page, 'product-sku-required');

            if (isDisabled) {
                console.log('   Submit button correctly disabled - SKU required');
            } else {
                console.log('   Submit button enabled');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // PRODUCTION VALIDATIONS
    // ============================================

    // Test 9: Production - Time start ≤ now
    await runTest('Production - Start Time Future', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderSelect = page.locator('select[formControlName="orderId"], #order');
        if (await orderSelect.isVisible()) {
            await orderSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);
        }

        const operationSelect = page.locator('select[formControlName="operationId"], #operation');
        if (await operationSelect.isVisible()) {
            await operationSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);
        }

        // Set future start time
        const startTime = page.locator('input[formControlName="startTime"], #startTime');
        if (await startTime.isVisible()) {
            await startTime.fill('2030-12-31T23:59'); // Future date
            await startTime.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'production-start-time-future');
        }
    }, page, results, screenshots);

    // Test 10: Production - Quantity positive
    await runTest('Production - Quantity Positive', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderSelect = page.locator('select[formControlName="orderId"], #order');
        if (await orderSelect.isVisible()) {
            await orderSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);
        }

        const operationSelect = page.locator('select[formControlName="operationId"], #operation');
        if (await operationSelect.isVisible()) {
            await operationSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);
        }

        const producedQty = page.locator('input[formControlName="producedQuantity"], #producedQuantity');
        if (await producedQty.isVisible()) {
            await producedQty.fill('-10');
            await producedQty.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'production-quantity-positive');
        }
    }, page, results, screenshots);

    // ============================================
    // USER VALIDATIONS
    // ============================================

    // Test 11: User - Email format
    await runTest('User - Email Format', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const emailInput = page.locator('#email, input[formControlName="email"]');
        if (await emailInput.isVisible()) {
            await emailInput.fill('not-an-email');
            await emailInput.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'user-email-validation');
        }
    }, page, results, screenshots);

    // Test 12: User - Password min length
    await runTest('User - Password Min Length', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const passwordInput = page.locator('#password, input[formControlName="password"]');
        if (await passwordInput.isVisible()) {
            await passwordInput.fill('123');
            await passwordInput.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'user-password-validation');
        }
    }, page, results, screenshots);

    // ============================================
    // CHANGE PASSWORD VALIDATIONS
    // ============================================

    // Test 13: Change Password - Mismatch
    await runTest('Change Password - Mismatch', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newPassword = page.locator('#newPassword, input[formControlName="newPassword"]');
        const confirmPassword = page.locator('#confirmPassword, input[formControlName="confirmPassword"]');

        if (await newPassword.isVisible() && await confirmPassword.isVisible()) {
            await newPassword.fill('Password123!');
            await confirmPassword.fill('Different456!');
            await confirmPassword.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'change-password-mismatch');
        }
    }, page, results, screenshots);

    // ============================================
    // CONFIG VALIDATIONS
    // ============================================

    // Test 14: Process Params - Min < Max
    await runTest('Process Params - Min Max Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_PROCESS_PARAMS_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const minInput = page.locator('#minValue, input[formControlName="minValue"]');
        const maxInput = page.locator('#maxValue, input[formControlName="maxValue"]');

        if (await minInput.isVisible() && await maxInput.isVisible()) {
            await minInput.fill('1000');
            await maxInput.fill('100'); // Max < Min (invalid)
            await maxInput.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'process-params-min-max');
        }
    }, page, results, screenshots);

    // ============================================
    // BATCH VALIDATIONS
    // ============================================

    // Test 15: Batch Adjust - Reason required
    await runTest('Batch Adjust - Reason Required', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const adjustBtn = page.locator('button:has-text("Adjust")');
            if (await adjustBtn.isVisible()) {
                await adjustBtn.click();
                await page.waitForTimeout(500);

                // Fill quantity but no reason
                const qtyInput = page.locator('.modal input[type="number"]');
                if (await qtyInput.isVisible()) {
                    await qtyInput.fill('100');
                }

                // Try to submit
                const confirmBtn = page.locator('.modal button:has-text("Adjust"), .modal button:has-text("Confirm")');
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    await page.waitForTimeout(300);

                    await screenshots.capture(page, 'batch-adjust-reason-required');
                }
            }
        }
    }, page, results, screenshots);

    // ============================================
    // EQUIPMENT VALIDATIONS
    // ============================================

    // Test 16: Equipment - Required code
    await runTest('Equipment - Required Code', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            const isDisabled = await submitBtn.isDisabled();
            await screenshots.capture(page, 'equipment-code-required');

            if (isDisabled) {
                console.log('   Submit button correctly disabled - code required');
            } else {
                console.log('   Submit button enabled');
            }
        }
    }, page, results, screenshots);

    // Test 17: Equipment - Capacity positive
    await runTest('Equipment - Capacity Positive', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const capacityInput = page.locator('#capacity, input[formControlName="capacity"]');
        if (await capacityInput.isVisible()) {
            await capacityInput.fill('-100');
            await capacityInput.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'equipment-capacity-positive');
        }
    }, page, results, screenshots);

    // ============================================
    // ROUTING VALIDATIONS
    // ============================================

    // Test 18: Routing - Required name
    await runTest('Routing - Required Name', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'routing-name-required');
        }
    }, page, results, screenshots);

    // Test 19: Routing Step - Sequence number min
    await runTest('Routing Step - Sequence Min', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const addStepBtn = page.locator('button:has-text("Add Step")').first();
        if (await addStepBtn.isVisible({ timeout: 2000 })) {
            await addStepBtn.click();
            await page.waitForTimeout(500);

            const seqInput = page.locator('.modal #sequenceNumber, .modal input[formControlName="sequenceNumber"]');
            if (await seqInput.isVisible({ timeout: 2000 })) {
                await seqInput.fill('0'); // Should be >= 1
                await seqInput.blur();
                await page.waitForTimeout(300);

                await screenshots.capture(page, 'routing-step-sequence-min');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // BOM VALIDATIONS
    // ============================================

    // Test 20: BOM - Quantity required
    await runTest('BOM Node - Quantity Required', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Try to find a product to add node to
        const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
        if (await viewBtn.isVisible({ timeout: 3000 })) {
            await viewBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const addNodeBtn = page.locator('button:has-text("Add Node"), button:has-text("Add")').first();
            if (await addNodeBtn.isVisible({ timeout: 2000 })) {
                await addNodeBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const submitBtn = page.locator('button[type="submit"]');
                if (await submitBtn.isVisible()) {
                    const isDisabled = await submitBtn.isDisabled();
                    await screenshots.capture(page, 'bom-node-quantity-required');

                    if (isDisabled) {
                        console.log('   Submit button correctly disabled - quantity required');
                    } else {
                        console.log('   Submit button enabled');
                    }
                }
            }
        } else {
            console.log('   No BOM products to test - skipping');
        }
    }, page, results, screenshots);

    console.log('\n✅ Form validations tests finished');
}

module.exports = { runFormValidationsTests };
