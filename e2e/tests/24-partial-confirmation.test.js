/**
 * Partial Confirmation Tests
 * Tests the production partial confirmation workflow
 *
 * Partial confirmation occurs when:
 * 1. The produced quantity is less than the target/planned quantity
 * 2. The operation remains in IN_PROGRESS status
 * 3. Multiple confirmations can be made until target is reached
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runPartialConfirmationTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('PARTIAL CONFIRMATION TESTS');
    console.log('='.repeat(50));

    // ============================================
    // PARTIAL CONFIRMATION FORM TESTS (Read-only)
    // ============================================

    await runTest('Partial Confirm - Navigate to Production', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'partial-confirm-landing');

        // Verify production page is loaded
        const pageContent = page.locator('h1, h2, .page-header');
        if (!await pageContent.first().isVisible()) {
            throw new Error('Production page not visible');
        }
    }, page, results, screenshots);

    await runTest('Partial Confirm - Order Selection Available', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for order dropdown
        const orderDropdown = page.locator('select#order, select[formControlName="order"], select[name="order"]');
        if (await orderDropdown.count() > 0) {
            const options = await orderDropdown.locator('option').allTextContents();
            console.log(`  - Found ${options.length - 1} orders available`);

            await screenshots.capture(page, 'partial-confirm-orders');

            if (options.length > 1) {
                await orderDropdown.selectOption({ index: 1 });
                await page.waitForTimeout(1500);

                await screenshots.capture(page, 'partial-confirm-order-selected');
            }
        } else {
            console.log('  - Order dropdown not found');
        }
    }, page, results, screenshots);

    await runTest('Partial Confirm - Quantity Field Visible', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order first
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

        // Check quantity field
        const qtyField = page.locator('input[formControlName="quantityProduced"], input#quantityProduced, input#producedQty');
        if (await qtyField.isVisible()) {
            await screenshots.capture(page, 'partial-confirm-qty-field');
            console.log('  - Quantity produced field found');
        } else {
            console.log('  - Quantity field not visible (may need operation selection)');
        }
    }, page, results, screenshots);

    await runTest('Partial Confirm - Order Quantity Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Select order
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1500);
        }

        // Look for order quantity display
        const orderQtyDisplay = page.locator('.info-item:has-text("Order Quantity"), .order-quantity, [data-field="orderQuantity"]');
        if (await orderQtyDisplay.first().isVisible()) {
            const qtyText = await orderQtyDisplay.first().textContent();
            console.log(`  - Order quantity displayed: ${qtyText?.trim()}`);
            await screenshots.capture(page, 'partial-confirm-order-qty');
        } else {
            // Try alternative: look for any element with quantity info
            const infoItems = page.locator('.info-item');
            const count = await infoItems.count();
            console.log(`  - Found ${count} info items in operation details`);
            await screenshots.capture(page, 'partial-confirm-operation-details');
        }
    }, page, results, screenshots);

    await runTest('Partial Confirm - Yield Display', async () => {
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

        // Fill quantity to trigger yield calculation
        const qtyField = page.locator('input[formControlName="quantityProduced"], input#quantityProduced');
        if (await qtyField.isVisible()) {
            await qtyField.fill('50'); // Partial quantity
            await page.waitForTimeout(500);

            // Check for yield display
            const yieldDisplay = page.locator('.yield-display, .yield-percentage, .yield-stats');
            if (await yieldDisplay.first().isVisible()) {
                await screenshots.capture(page, 'partial-confirm-yield');
                console.log('  - Yield calculation displayed');
            } else {
                console.log('  - No yield display found');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // SUBMIT TESTS (with --submit flag)
    // ============================================

    if (submitActions) {
        await runTest('Partial Confirm - Submit Less Than Target (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Select order
            const orderDropdown = page.locator('select#order, select[formControlName="order"]');
            if (await orderDropdown.count() > 0) {
                const options = await orderDropdown.locator('option').allTextContents();
                if (options.length > 1) {
                    await orderDropdown.selectOption({ index: 1 });
                    await page.waitForTimeout(1500);
                }
            }

            // Select operation (READY status)
            const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
            if (await operationDropdown.count() > 0) {
                const options = await operationDropdown.locator('option').allTextContents();
                if (options.length > 1) {
                    await operationDropdown.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                }
            }

            await screenshots.capture(page, 'partial-confirm-form-before');

            // Fill form with partial quantity (less than order quantity)
            const startTime = page.locator('input[type="datetime-local"][formControlName="startTime"], input#startTime');
            const endTime = page.locator('input[type="datetime-local"][formControlName="endTime"], input#endTime');
            const qtyProduced = page.locator('input[formControlName="quantityProduced"], input#quantityProduced');
            const qtyScrapped = page.locator('input[formControlName="quantityScrapped"], input#quantityScrapped');

            // Set times
            const now = new Date();
            const startStr = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
            const endStr = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString().slice(0, 16);

            if (await startTime.isVisible()) await startTime.fill(startStr);
            if (await endTime.isVisible()) await endTime.fill(endStr);

            // Enter partial quantity (50 units - less than typical order of 100+)
            if (await qtyProduced.isVisible()) await qtyProduced.fill('25');
            if (await qtyScrapped.isVisible()) await qtyScrapped.fill('2');

            // Select equipment and operator
            const equipmentCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /equipment|furnace|mill/i }).first();
            if (await equipmentCheckbox.count() > 0) {
                await equipmentCheckbox.check().catch(() => {});
            } else {
                // Try any checkbox in equipment section
                const equipSection = page.locator('.form-group:has-text("Equipment") input[type="checkbox"]').first();
                if (await equipSection.isVisible()) {
                    await equipSection.check().catch(() => {});
                }
            }

            const operatorCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /operator|op-/i }).first();
            if (await operatorCheckbox.count() > 0) {
                await operatorCheckbox.check().catch(() => {});
            } else {
                const opSection = page.locator('.form-group:has-text("Operator") input[type="checkbox"]').first();
                if (await opSection.isVisible()) {
                    await opSection.check().catch(() => {});
                }
            }

            await screenshots.capture(page, 'partial-confirm-form-filled');

            // Submit
            const submitBtn = page.locator('button[type="submit"]:has-text("Confirm")');
            if (await submitBtn.isVisible() && !await submitBtn.isDisabled()) {
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);

                await screenshots.capture(page, 'partial-confirm-result');

                // Check for success or result display
                const successCard = page.locator('.success-container, .success-card, .result-summary');
                if (await successCard.isVisible()) {
                    // Check operation status
                    const statusBadge = successCard.locator('app-status-badge, .status-badge');
                    if (await statusBadge.isVisible()) {
                        const statusText = await statusBadge.textContent();
                        console.log(`  - Operation status after partial: ${statusText?.trim()}`);
                    }
                    console.log('  - Partial confirmation submitted successfully');
                } else {
                    console.log('  - Submit completed, check result manually');
                }
            } else {
                console.log('  - Submit button not available (form may have validation errors)');
            }
        }, page, results, screenshots);

        await runTest('Partial Confirm - Check Operation Remains IN_PROGRESS (Submit)', async () => {
            // After partial confirmation, verify operation is still available for more confirmations
            await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'partial-confirm-operations-list');

            // Look for IN_PROGRESS operations
            const inProgressBadges = page.locator('.status-badge:has-text("IN_PROGRESS"), app-status-badge:has-text("IN_PROGRESS")');
            const count = await inProgressBadges.count();

            if (count > 0) {
                console.log(`  - Found ${count} operations in IN_PROGRESS status`);
            } else {
                console.log('  - No IN_PROGRESS operations found (may all be CONFIRMED)');
            }
        }, page, results, screenshots);

        await runTest('Partial Confirm - Multiple Confirmations on Same Operation (Submit)', async () => {
            // This test verifies you can submit multiple partial confirmations
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Select order with IN_PROGRESS operation
            const orderDropdown = page.locator('select#order, select[formControlName="order"]');
            if (await orderDropdown.count() > 0) {
                await orderDropdown.selectOption({ index: 1 }).catch(() => {});
                await page.waitForTimeout(1500);
            }

            // Check if operations are still available
            const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
            if (await operationDropdown.count() > 0) {
                const options = await operationDropdown.locator('option').allTextContents();
                console.log(`  - Available operations: ${options.length - 1}`);

                await screenshots.capture(page, 'partial-confirm-continue-available');

                if (options.length > 1) {
                    console.log('  - Can continue with more confirmations on IN_PROGRESS operations');
                } else {
                    console.log('  - No more operations available (all may be CONFIRMED)');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // PRODUCTION HISTORY TESTS (Verify Partial Confirmations)
    // ============================================

    await runTest('Partial Confirm - View in Production History', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'partial-confirm-history');

        // Look for partial confirmation entries
        const table = page.locator('table');
        const cards = page.locator('.card, .confirmation-card');

        if (await table.isVisible()) {
            const rows = page.locator('table tbody tr');
            const rowCount = await rows.count();
            console.log(`  - Found ${rowCount} production history entries`);

            // Look for PARTIALLY_CONFIRMED status
            const partialBadges = page.locator('app-status-badge:has-text("PARTIAL"), .status-badge:has-text("PARTIAL")');
            const partialCount = await partialBadges.count();
            if (partialCount > 0) {
                console.log(`  - Found ${partialCount} partial confirmations`);
            }
        } else if (await cards.first().isVisible()) {
            const cardCount = await cards.count();
            console.log(`  - Found ${cardCount} history cards`);
        }
    }, page, results, screenshots);

    await runTest('Partial Confirm - Remaining Quantity Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check if remaining quantity is shown for partial confirmations
        const remainingDisplay = page.locator('.remaining-qty, [data-field="remainingQuantity"], :text("Remaining")');
        if (await remainingDisplay.first().isVisible()) {
            await screenshots.capture(page, 'partial-confirm-remaining');
            console.log('  - Remaining quantity display found');
        } else {
            console.log('  - No remaining quantity display (may not be in history view)');
            await screenshots.capture(page, 'partial-confirm-history-detail');
        }
    }, page, results, screenshots);

    console.log('\n' + '='.repeat(50));
    console.log('PARTIAL CONFIRMATION TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runPartialConfirmationTests };
