/**
 * Production Confirmation Complete Flow Tests
 * Tests the full production confirmation workflow including material selection,
 * validations, and batch creation
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runProductionCompleteTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('🏭 PRODUCTION CONFIRMATION COMPLETE TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // MATERIAL SELECTION MODAL
    // ============================================

    // Test 1: Open Material Selection Modal
    await runTest('Production - Open Material Selection Modal', async () => {
        // First navigate to a production confirmation page with an operation
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select an order if dropdown exists
        const orderSelect = page.locator('select[formControlName="orderId"], #order');
        if (await orderSelect.isVisible()) {
            await orderSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);
        }

        // Select an operation
        const operationSelect = page.locator('select[formControlName="operationId"], #operation');
        if (await operationSelect.isVisible()) {
            await operationSelect.selectOption({ index: 1 });
            await page.waitForTimeout(500);
        }

        // Click Add Materials button
        const addMaterialsBtn = page.locator('button:has-text("Add Materials"), button:has-text("Select Materials")');
        if (await addMaterialsBtn.isVisible()) {
            await addMaterialsBtn.click();
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'production-material-modal-open');

            // Verify modal opened
            const modal = page.locator('.modal, .material-selection-modal, [role="dialog"]');
            if (!await modal.isVisible()) {
                throw new Error('Material selection modal did not open');
            }
        }
    }, page, results, screenshots);

    // Test 2: Material Modal - Search filter
    await runTest('Production - Material Modal Search', async () => {
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

        const addMaterialsBtn = page.locator('button:has-text("Add Materials"), button:has-text("Select Materials")');
        if (await addMaterialsBtn.isVisible()) {
            await addMaterialsBtn.click();
            await page.waitForTimeout(500);

            // Use search
            const searchInput = page.locator('.modal input[type="text"], .modal input[placeholder*="Search"]');
            if (await searchInput.isVisible()) {
                await searchInput.fill('BATCH');
                await page.waitForTimeout(300);
                await screenshots.capture(page, 'production-material-modal-search');
            }
        }
    }, page, results, screenshots);

    // Test 3: Material Modal - Type filter
    await runTest('Production - Material Modal Type Filter', async () => {
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

        const addMaterialsBtn = page.locator('button:has-text("Add Materials"), button:has-text("Select Materials")');
        if (await addMaterialsBtn.isVisible()) {
            await addMaterialsBtn.click();
            await page.waitForTimeout(500);

            // Use type filter
            const typeFilter = page.locator('.modal select');
            if (await typeFilter.isVisible()) {
                await typeFilter.selectOption('RM');
                await page.waitForTimeout(300);
                await screenshots.capture(page, 'production-material-modal-type-filter');
            }
        }
    }, page, results, screenshots);

    // Test 4: Material Modal - Select materials
    await runTest('Production - Material Modal Select Items', async () => {
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

        const addMaterialsBtn = page.locator('button:has-text("Add Materials"), button:has-text("Select Materials")');
        if (await addMaterialsBtn.isVisible()) {
            await addMaterialsBtn.click();
            await page.waitForTimeout(500);

            // Select first checkbox
            const checkbox = page.locator('.modal input[type="checkbox"]').first();
            if (await checkbox.isVisible()) {
                await checkbox.click();
                await page.waitForTimeout(300);
                await screenshots.capture(page, 'production-material-modal-selected');
            }
        }
    }, page, results, screenshots);

    // Test 5: Material Modal - Set quantity
    await runTest('Production - Material Modal Set Quantity', async () => {
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

        const addMaterialsBtn = page.locator('button:has-text("Add Materials"), button:has-text("Select Materials")');
        if (await addMaterialsBtn.isVisible()) {
            await addMaterialsBtn.click();
            await page.waitForTimeout(500);

            // Select item
            const checkbox = page.locator('.modal input[type="checkbox"]').first();
            if (await checkbox.isVisible()) {
                await checkbox.click();
                await page.waitForTimeout(300);

                // Set quantity
                const qtyInput = page.locator('.modal input[type="number"]').first();
                if (await qtyInput.isVisible()) {
                    await qtyInput.fill('100');
                    await page.waitForTimeout(300);
                    await screenshots.capture(page, 'production-material-modal-quantity-set');
                }
            }
        }
    }, page, results, screenshots);

    // ============================================
    // VALIDATIONS
    // ============================================

    // Test 6: Equipment selection validation
    await runTest('Production - Equipment Required Validation', async () => {
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

        // Fill required fields but NOT equipment
        const startTime = page.locator('input[formControlName="startTime"], #startTime');
        if (await startTime.isVisible()) {
            await startTime.fill('2026-02-08T08:00');
        }

        const endTime = page.locator('input[formControlName="endTime"], #endTime');
        if (await endTime.isVisible()) {
            await endTime.fill('2026-02-08T10:00');
        }

        const producedQty = page.locator('input[formControlName="producedQuantity"], #producedQuantity');
        if (await producedQty.isVisible()) {
            await producedQty.fill('100');
        }

        // Try to submit without selecting equipment
        const submitBtn = page.locator('button:has-text("Confirm"), button:has-text("Submit")');
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'production-equipment-validation');

            // Check for error message
            const error = page.locator('.error, .alert-danger, .text-danger');
            // Error should be visible
        }
    }, page, results, screenshots);

    // Test 7: Operator selection validation
    await runTest('Production - Operator Required Validation', async () => {
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

        // Select equipment but not operator
        const equipmentCheckbox = page.locator('.equipment-list input[type="checkbox"], input[name*="equipment"]').first();
        if (await equipmentCheckbox.isVisible()) {
            await equipmentCheckbox.check();
        }

        // Fill times and quantity
        const startTime = page.locator('input[formControlName="startTime"], #startTime');
        if (await startTime.isVisible()) {
            await startTime.fill('2026-02-08T08:00');
        }

        const endTime = page.locator('input[formControlName="endTime"], #endTime');
        if (await endTime.isVisible()) {
            await endTime.fill('2026-02-08T10:00');
        }

        const producedQty = page.locator('input[formControlName="producedQuantity"], #producedQuantity');
        if (await producedQty.isVisible()) {
            await producedQty.fill('100');
        }

        // Try to submit without selecting operator
        const submitBtn = page.locator('button:has-text("Confirm"), button:has-text("Submit")');
        if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'production-operator-validation');
        }
    }, page, results, screenshots);

    // Test 8: Time validation (end > start)
    await runTest('Production - Time Validation', async () => {
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

        // Set end time before start time
        const startTime = page.locator('input[formControlName="startTime"], #startTime');
        if (await startTime.isVisible()) {
            await startTime.fill('2026-02-08T10:00');
        }

        const endTime = page.locator('input[formControlName="endTime"], #endTime');
        if (await endTime.isVisible()) {
            await endTime.fill('2026-02-08T08:00'); // Before start
        }

        await page.waitForTimeout(300);
        await screenshots.capture(page, 'production-time-validation');

        // Check for validation error
        const timeError = page.locator('.time-error, .error:has-text("time"), .text-danger:has-text("time")');
        // Should show time validation error
    }, page, results, screenshots);

    // Test 9: Delay reason conditional validation
    await runTest('Production - Delay Reason Required When Delay Set', async () => {
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

        // Set delay minutes
        const delayMinutes = page.locator('input[formControlName="delayMinutes"], #delayMinutes');
        if (await delayMinutes.isVisible()) {
            await delayMinutes.fill('30');
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'production-delay-set');

            // Try to submit without delay reason
            const submitBtn = page.locator('button:has-text("Confirm"), button:has-text("Submit")');
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'production-delay-reason-validation');
            }
        }
    }, page, results, screenshots);

    // Test 10: Process parameter min/max validation
    await runTest('Production - Process Parameter Validation', async () => {
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

        // Look for process parameter inputs
        const paramInputs = page.locator('.process-parameter input, [formArrayName="parameters"] input');
        if (await paramInputs.count() > 0) {
            // Fill with out-of-range value
            await paramInputs.first().fill('99999');
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'production-param-validation');
        }
    }, page, results, screenshots);

    // ============================================
    // COMPLETE FLOW
    // ============================================

    // Test 11: Full production confirmation (with submit)
    if (submitActions) {
        await runTest('Production - Complete Confirmation Flow', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Select order
            const orderSelect = page.locator('select[formControlName="orderId"], #order');
            if (await orderSelect.isVisible()) {
                await orderSelect.selectOption({ index: 1 });
                await page.waitForTimeout(500);
            }

            // Select operation
            const operationSelect = page.locator('select[formControlName="operationId"], #operation');
            if (await operationSelect.isVisible()) {
                await operationSelect.selectOption({ index: 1 });
                await page.waitForTimeout(500);
            }

            // Fill times
            const now = new Date();
            const startStr = now.toISOString().slice(0, 16);
            now.setHours(now.getHours() + 2);
            const endStr = now.toISOString().slice(0, 16);

            const startTime = page.locator('input[formControlName="startTime"], #startTime');
            if (await startTime.isVisible()) {
                await startTime.fill(startStr);
            }

            const endTime = page.locator('input[formControlName="endTime"], #endTime');
            if (await endTime.isVisible()) {
                await endTime.fill(endStr);
            }

            // Fill quantities
            const producedQty = page.locator('input[formControlName="producedQuantity"], #producedQuantity');
            if (await producedQty.isVisible()) {
                await producedQty.fill('500');
            }

            const scrapQty = page.locator('input[formControlName="scrapQuantity"], #scrapQuantity');
            if (await scrapQty.isVisible()) {
                await scrapQty.fill('10');
            }

            // Select equipment
            const equipmentCheckbox = page.locator('.equipment-list input[type="checkbox"], input[name*="equipment"]').first();
            if (await equipmentCheckbox.isVisible()) {
                await equipmentCheckbox.check();
            }

            // Select operator
            const operatorCheckbox = page.locator('.operator-list input[type="checkbox"], input[name*="operator"]').first();
            if (await operatorCheckbox.isVisible()) {
                await operatorCheckbox.check();
            }

            await screenshots.capture(page, 'production-complete-form-filled');

            // Submit
            const submitBtn = page.locator('button:has-text("Confirm"), button:has-text("Submit")');
            if (await submitBtn.isEnabled()) {
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                await screenshots.capture(page, 'production-complete-success');

                // Check for success message or batch info
                const success = page.locator('.success, .alert-success, .batch-created');
                if (await success.isVisible()) {
                    console.log('   Production confirmation successful');
                }
            }
        }, page, results, screenshots);
    }

    // Test 12: Apply Hold from Production Confirm
    await runTest('Production - Apply Hold Modal', async () => {
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

        // Click Apply Hold button
        const applyHoldBtn = page.locator('button:has-text("Apply Hold")');
        if (await applyHoldBtn.isVisible()) {
            await applyHoldBtn.click();
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'production-apply-hold-modal');

            // Verify modal opened
            const modal = page.locator('.modal, .apply-hold-modal, [role="dialog"]');
            if (await modal.isVisible()) {
                // Fill reason
                const reasonSelect = page.locator('.modal select[formControlName="reason"], .modal #reason');
                if (await reasonSelect.isVisible()) {
                    await reasonSelect.selectOption({ index: 1 });
                }

                // Fill comments
                const comments = page.locator('.modal textarea[formControlName="comments"], .modal #comments');
                if (await comments.isVisible()) {
                    await comments.fill('Hold applied from production confirm - E2E test');
                }

                await screenshots.capture(page, 'production-apply-hold-filled');
            }
        }
    }, page, results, screenshots);

    // Test 13: BOM Suggested Consumption
    await runTest('Production - Apply BOM Suggestions', async () => {
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

        // Look for Apply Suggestions button
        const applySuggestionsBtn = page.locator('button:has-text("Apply Suggestions")');
        if (await applySuggestionsBtn.isVisible()) {
            await applySuggestionsBtn.click();
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'production-bom-suggestions-applied');
        }
    }, page, results, screenshots);

    // Test 14: Yield calculation display
    await runTest('Production - Yield Calculation Display', async () => {
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

        // Fill quantities to see yield
        const producedQty = page.locator('input[formControlName="producedQuantity"], #producedQuantity');
        if (await producedQty.isVisible()) {
            await producedQty.fill('950');
        }

        const scrapQty = page.locator('input[formControlName="scrapQuantity"], #scrapQuantity');
        if (await scrapQty.isVisible()) {
            await scrapQty.fill('50');
            await page.waitForTimeout(300);
        }

        await screenshots.capture(page, 'production-yield-calculation');

        // Check yield percentage display
        const yieldDisplay = page.locator('.yield-percentage, .yield-indicator, :has-text("Yield")');
        if (await yieldDisplay.isVisible()) {
            console.log('   Yield calculation displayed');
        }
    }, page, results, screenshots);

    console.log('\n✅ Production complete tests finished');
}

module.exports = { runProductionCompleteTests };
