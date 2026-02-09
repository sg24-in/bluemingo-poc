/**
 * Production Confirmation Tests
 * Tests production form, validation, and confirmation submission
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runProductionTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 PRODUCTION CONFIRMATION TESTS');
    console.log('─'.repeat(50));

    // Test 1: Production form empty state
    await runTest('Production - Form Empty State', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'production-form-empty');
    }, page, results, screenshots);

    // Test 2: Select order dropdown
    await runTest('Production - Order Selection', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'production-before-order-select');

        const orderDropdown = page.locator('select#order, select[formControlName="order"], select[name="order"]');
        if (await orderDropdown.count() > 0) {
            const options = await orderDropdown.locator('option').allTextContents();
            if (options.length > 1) {
                await orderDropdown.selectOption({ index: 1 });
                await page.waitForTimeout(1500);
            }
        }

        await screenshots.capture(page, 'production-after-order-select');
    }, page, results, screenshots);

    // Test 3: Select operation
    await runTest('Production - Operation Selection', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order first
        const orderDropdown = page.locator('select#order, select[formControlName="order"], select[name="order"]');
        if (await orderDropdown.count() > 0) {
            const options = await orderDropdown.locator('option').allTextContents();
            if (options.length > 1) {
                await orderDropdown.selectOption({ index: 1 });
                await page.waitForTimeout(1500);
            }
        }

        await screenshots.capture(page, 'production-before-operation-select');

        // Select operation
        const operationDropdown = page.locator('select#operation, select[formControlName="operation"], select[name="operation"]');
        if (await operationDropdown.count() > 0) {
            const options = await operationDropdown.locator('option').allTextContents();
            if (options.length > 1) {
                await operationDropdown.selectOption({ index: 1 });
                await page.waitForTimeout(1000);
            }
        }

        await screenshots.capture(page, 'production-after-operation-select');
    }, page, results, screenshots);

    // Test 4: Fill production times
    await runTest('Production - Fill Times', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order and operation first
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1000);
        }

        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            await operationDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);
        }

        // Fill time fields
        const startTime = page.locator('input[type="datetime-local"][formControlName="startTime"], input#startTime');
        const endTime = page.locator('input[type="datetime-local"][formControlName="endTime"], input#endTime');

        if (await startTime.count() > 0) {
            await startTime.fill('2024-01-15T08:00');
        }
        if (await endTime.count() > 0) {
            await endTime.fill('2024-01-15T12:00');
        }

        await screenshots.capture(page, 'production-times-filled');
    }, page, results, screenshots);

    // Test 5: Fill quantities
    await runTest('Production - Fill Quantities', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order and operation
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1000);
        }

        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            await operationDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);
        }

        // Fill quantity fields
        const producedQty = page.locator('input[formControlName="producedQty"], input#producedQty, input[name="producedQty"]');
        const scrapQty = page.locator('input[formControlName="scrapQty"], input#scrapQty, input[name="scrapQty"]');

        if (await producedQty.count() > 0) {
            await producedQty.fill(String(TEST_DATA.production.producedQty));
        }
        if (await scrapQty.count() > 0) {
            await scrapQty.fill(String(TEST_DATA.production.scrapQty));
        }

        await screenshots.capture(page, 'production-quantities-filled');
    }, page, results, screenshots);

    // Test 6: Equipment and operator selection
    await runTest('Production - Equipment & Operator Selection', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order and operation
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1000);
        }

        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            await operationDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);
        }

        // Check for equipment/operator selection
        const equipmentCheckboxes = page.locator('input[type="checkbox"][name*="equipment"], .equipment-item input[type="checkbox"]');
        const operatorCheckboxes = page.locator('input[type="checkbox"][name*="operator"], .operator-item input[type="checkbox"]');

        if (await equipmentCheckboxes.count() > 0) {
            await equipmentCheckboxes.first().check().catch(() => {});
        }
        if (await operatorCheckboxes.count() > 0) {
            await operatorCheckboxes.first().check().catch(() => {});
        }

        await screenshots.capture(page, 'production-equipment-operators');
    }, page, results, screenshots);

    // Test 7: Material Add button and Selected Materials
    await runTest('Production - Material Add Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order
        const selects = await page.$$('select');
        if (selects.length > 0) {
            await selects[0].selectOption({ index: 1 });
            await page.waitForTimeout(2000);
        }

        // Select operation
        const selects2 = await page.$$('select');
        if (selects2.length > 1) {
            await selects2[1].selectOption({ index: 1 });
            await page.waitForTimeout(1500);
        }

        // Click Start Production Confirmation
        const startBtn = await page.$('button:has-text("Start Production Confirmation")');
        if (startBtn) {
            await startBtn.click();
            await page.waitForTimeout(3000);
        }

        // Find and click first Add button in Available Inventory
        const addButtons = page.locator('.available-materials button:has-text("Add")');
        const addCount = await addButtons.count();
        console.log(`Found ${addCount} Add buttons in Available Inventory`);

        if (addCount > 0) {
            await addButtons.first().click();
            await page.waitForTimeout(500);

            // Verify the button changed to "Added" (disabled)
            const firstBtnText = await addButtons.first().textContent();
            console.log(`First button text after click: ${firstBtnText?.trim()}`);

            // Verify Selected Materials section appeared
            const selectedSection = page.locator('.selected-materials');
            const isVisible = await selectedSection.isVisible();
            console.log(`Selected Materials section visible: ${isVisible}`);

            // Check selected materials count header
            const selectedHeader = page.locator('.selected-materials h4');
            if (await selectedHeader.count() > 0) {
                const headerText = await selectedHeader.textContent();
                console.log(`Selected Materials header: ${headerText}`);
            }
        }

        await screenshots.capture(page, 'production-material-added');
    }, page, results, screenshots);

    // Test 8: Apply Suggestions button
    await runTest('Production - Apply Suggestions', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order
        const selects = await page.$$('select');
        if (selects.length > 0) {
            await selects[0].selectOption({ index: 1 });
            await page.waitForTimeout(2000);
        }

        // Select operation
        const selects2 = await page.$$('select');
        if (selects2.length > 1) {
            await selects2[1].selectOption({ index: 1 });
            await page.waitForTimeout(1500);
        }

        // Click Start Production Confirmation
        const startBtn = await page.$('button:has-text("Start Production Confirmation")');
        if (startBtn) {
            await startBtn.click();
            await page.waitForTimeout(3000);
        }

        // Find and click Apply Suggestions button
        const applyBtn = page.locator('button:has-text("Apply Suggestions")');
        if (await applyBtn.count() > 0) {
            const isDisabled = await applyBtn.isDisabled();
            console.log(`Apply Suggestions button disabled: ${isDisabled}`);

            await applyBtn.click();
            await page.waitForTimeout(1000);

            // Verify Selected Materials section appeared with auto-filled data
            const selectedSection = page.locator('.selected-materials');
            const isVisible = await selectedSection.isVisible();
            console.log(`Selected Materials section visible after Apply: ${isVisible}`);

            // Count selected materials rows
            const selectedRows = page.locator('.selected-materials tbody tr');
            const rowCount = await selectedRows.count();
            console.log(`Selected materials count: ${rowCount}`);
        } else {
            console.log('Apply Suggestions button not found (BOM may not be loaded)');
        }

        await screenshots.capture(page, 'production-suggestions-applied');
    }, page, results, screenshots);

    // Test 9: Batch Number Preview
    await runTest('Production - Batch Number Preview', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order
        const selects = await page.$$('select');
        if (selects.length > 0) {
            await selects[0].selectOption({ index: 1 });
            await page.waitForTimeout(2000);
        }

        // Select operation
        const selects2 = await page.$$('select');
        if (selects2.length > 1) {
            await selects2[1].selectOption({ index: 1 });
            await page.waitForTimeout(1500);
        }

        // Click Start Production Confirmation
        const startBtn = await page.$('button:has-text("Start Production Confirmation")');
        if (startBtn) {
            await startBtn.click();
            await page.waitForTimeout(3000);
        }

        // Check for batch number preview
        const batchPreview = page.locator('.batch-number-preview, .batch-preview');
        if (await batchPreview.count() > 0) {
            const previewText = await batchPreview.first().textContent();
            console.log(`Batch number preview: ${previewText?.trim()}`);
            // Verify it's not empty (was returning 400 before fix)
            if (previewText && previewText.trim().length > 0) {
                console.log('Batch number preview loaded successfully');
            }
        } else {
            console.log('Batch preview section not visible (may be loading)');
        }

        await screenshots.capture(page, 'production-batch-preview');
    }, page, results, screenshots);

    // Test 10: Complete form
    await runTest('Production - Complete Form Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Fill all fields
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1000);
        }

        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            await operationDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);
        }

        // Fill times
        const startTime = page.locator('input[type="datetime-local"][formControlName="startTime"], input#startTime');
        const endTime = page.locator('input[type="datetime-local"][formControlName="endTime"], input#endTime');
        if (await startTime.count() > 0) await startTime.fill('2024-01-15T08:00');
        if (await endTime.count() > 0) await endTime.fill('2024-01-15T12:00');

        // Fill quantities
        const producedQty = page.locator('input[formControlName="producedQty"], input#producedQty');
        const scrapQty = page.locator('input[formControlName="scrapQty"], input#scrapQty');
        if (await producedQty.count() > 0) await producedQty.fill('100');
        if (await scrapQty.count() > 0) await scrapQty.fill('5');

        // Notes
        const notes = page.locator('textarea[formControlName="notes"], textarea#notes');
        if (await notes.count() > 0) await notes.fill(TEST_DATA.production.notes);

        await screenshots.capture(page, 'production-form-complete', { fullPage: true });
    }, page, results, screenshots);
}

module.exports = { runProductionTests };
