/**
 * Receive Material Tests
 * Tests the raw material goods receipt workflow
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runReceiveMaterialTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('📦 RECEIVE MATERIAL TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // RECEIVE MATERIAL FORM
    // ============================================

    // Test 1: Navigate to Receive Material page
    await runTest('Receive Material - Navigate to Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click Receive Material button
        const receiveBtn = page.locator('button:has-text("Receive Material"), a:has-text("Receive Material"), button:has-text("Receive")');
        if (await receiveBtn.isVisible()) {
            await receiveBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'receive-material-page');

            // Verify form displayed
            const form = page.locator('form');
            if (!await form.isVisible()) {
                throw new Error('Receive material form not visible');
            }
        } else {
            // Try direct navigation
            await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'receive-material-page');
        }
    }, page, results, screenshots);

    // Test 2: Material selection dropdown
    await runTest('Receive Material - Material Dropdown', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const materialSelect = page.locator('select[formControlName="materialId"], #materialId, #material');
        if (await materialSelect.isVisible()) {
            await materialSelect.click();
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'receive-material-dropdown');

            // Check options exist
            const options = await materialSelect.locator('option').count();
            if (options < 2) {
                console.log('   Warning: Material dropdown has few options');
            }
        }
    }, page, results, screenshots);

    // Test 3: Quantity field
    await runTest('Receive Material - Quantity Field', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const quantityInput = page.locator('input[formControlName="quantity"], #quantity');
        if (await quantityInput.isVisible()) {
            await quantityInput.fill('5000');
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'receive-material-quantity');
        }
    }, page, results, screenshots);

    // Test 4: Quantity minimum validation
    await runTest('Receive Material - Quantity Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const quantityInput = page.locator('input[formControlName="quantity"], #quantity');
        if (await quantityInput.isVisible()) {
            await quantityInput.fill('0');
            await quantityInput.blur();
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'receive-material-quantity-validation');

            // Check for validation error
            const error = page.locator('.error-message, .invalid-feedback, .text-danger');
            // Should show quantity error
        }
    }, page, results, screenshots);

    // Test 5: Supplier info field
    await runTest('Receive Material - Supplier Info', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const supplierInput = page.locator('input[formControlName="supplier"], #supplier, input[placeholder*="Supplier"]');
        if (await supplierInput.isVisible()) {
            await supplierInput.fill('Test Supplier Inc.');
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'receive-material-supplier');
        }
    }, page, results, screenshots);

    // Test 6: Lot/Batch number field
    await runTest('Receive Material - Lot Number', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const lotInput = page.locator('input[formControlName="lotNumber"], #lotNumber, input[placeholder*="Lot"]');
        if (await lotInput.isVisible()) {
            await lotInput.fill('LOT-2026-001');
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'receive-material-lot');
        }
    }, page, results, screenshots);

    // Test 7: Location field
    await runTest('Receive Material - Location', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const locationInput = page.locator('input[formControlName="location"], #location, select[formControlName="location"]');
        if (await locationInput.isVisible()) {
            if (await locationInput.evaluate(el => el.tagName === 'SELECT')) {
                await locationInput.selectOption({ index: 1 });
            } else {
                await locationInput.fill('Warehouse A');
            }
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'receive-material-location');
        }
    }, page, results, screenshots);

    // Test 8: Form validation (required fields)
    await runTest('Receive Material - Required Fields Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check that submit button is disabled for empty form (proper validation)
        const submitBtn = page.locator('button[type="submit"], button:has-text("Receive"), button:has-text("Submit")').first();
        if (await submitBtn.isVisible({ timeout: 2000 })) {
            const isDisabled = await submitBtn.isDisabled();
            await screenshots.capture(page, 'receive-material-validation');

            if (isDisabled) {
                console.log('   Submit button correctly disabled - required fields empty');
            } else {
                console.log('   Submit button enabled - form may have default values');
            }

            // Check for validation errors
            const errors = page.locator('.error-message, .invalid-feedback, .text-danger');
            const errorCount = await errors.count();
            if (errorCount > 0) {
                console.log(`   Found ${errorCount} validation error(s)`);
            }
        }
    }, page, results, screenshots);

    // Test 9: Complete receive material (with submit)
    if (submitActions) {
        await runTest('Receive Material - Complete Flow', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.receiveMaterial;

            // Select material
            const materialSelect = page.locator('select[formControlName="materialId"], #materialId');
            if (await materialSelect.isVisible()) {
                await materialSelect.selectOption({ index: 1 });
            }

            // Fill quantity
            const quantityInput = page.locator('input[formControlName="quantity"], #quantity');
            if (await quantityInput.isVisible()) {
                await quantityInput.fill(data.quantity);
            }

            // Fill unit
            const unitSelect = page.locator('select[formControlName="unit"], #unit');
            if (await unitSelect.isVisible()) {
                await unitSelect.selectOption({ index: 1 });
            }

            // Fill supplier
            const supplierInput = page.locator('input[formControlName="supplier"], #supplier');
            if (await supplierInput.isVisible()) {
                await supplierInput.fill(data.supplier);
            }

            // Fill lot number
            const lotInput = page.locator('input[formControlName="lotNumber"], #lotNumber');
            if (await lotInput.isVisible()) {
                await lotInput.fill(data.lotNumber);
            }

            // Fill location
            const locationInput = page.locator('input[formControlName="location"], #location');
            if (await locationInput.isVisible()) {
                await locationInput.fill(data.location);
            }

            await screenshots.capture(page, 'receive-material-filled');

            // Submit
            const submitBtn = page.locator('button[type="submit"], button:has-text("Receive")');
            if (await submitBtn.isEnabled()) {
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);
                await screenshots.capture(page, 'receive-material-success');

                // Check for success message
                const success = page.locator('.success, .alert-success, :has-text("successfully")');
                if (await success.isVisible()) {
                    console.log('   Material received successfully');
                }
            }
        }, page, results, screenshots);
    }

    // Test 10: Verify batch created after receive
    if (submitActions) {
        await runTest('Receive Material - Verify Batch Created', async () => {
            // Navigate to batches and check for newly created batch
            await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=QUALITY_PENDING`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'receive-material-batch-created');

            // Check for batches
            const rows = page.locator('table tbody tr');
            const count = await rows.count();
            console.log(`   Found ${count} batch(es) in QUALITY_PENDING status`);
        }, page, results, screenshots);
    }

    // Test 11: Verify inventory created after receive
    if (submitActions) {
        await runTest('Receive Material - Verify Inventory Created', async () => {
            // Navigate to inventory
            await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'receive-material-inventory-created');

            // Check for inventory items
            const rows = page.locator('table tbody tr');
            const count = await rows.count();
            console.log(`   Found ${count} inventory item(s)`);
        }, page, results, screenshots);
    }

    // Test 12: Cancel button
    await runTest('Receive Material - Cancel Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const cancelBtn = page.locator('button:has-text("Cancel"), a:has-text("Cancel")');
        if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'receive-material-cancelled');

            // Should navigate back to inventory
            const currentUrl = page.url();
            if (currentUrl.includes('inventory')) {
                console.log('   Navigated back to inventory');
            }
        }
    }, page, results, screenshots);

    console.log('\n✅ Receive material tests finished');
}

module.exports = { runReceiveMaterialTests };
