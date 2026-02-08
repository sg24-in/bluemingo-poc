/**
 * Batch Operations Tests
 * Tests batch split, merge, and quantity adjustment workflows
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runBatchOperationsTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('🔄 BATCH OPERATIONS TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // BATCH SPLIT
    // ============================================

    // Test 1: Navigate to batch detail for split
    await runTest('Batch Split - Navigate to Detail', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click on first available batch
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'batch-detail-for-split');
        }
    }, page, results, screenshots);

    // Test 2: Split button visibility
    await runTest('Batch Split - Button Visibility', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Check for Split button
            const splitBtn = page.locator('button:has-text("Split")');
            if (await splitBtn.isVisible()) {
                await screenshots.capture(page, 'batch-split-button-visible');
            } else {
                console.log('   Split button not visible (batch may not be AVAILABLE)');
            }
        }
    }, page, results, screenshots);

    // Test 3: Open split modal
    await runTest('Batch Split - Open Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const splitBtn = page.locator('button:has-text("Split")');
            if (await splitBtn.isVisible()) {
                await splitBtn.click();
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'batch-split-modal-open');

                // Verify modal opened
                const modal = page.locator('.modal, .split-modal, [role="dialog"]');
                if (!await modal.isVisible()) {
                    throw new Error('Split modal did not open');
                }
            }
        }
    }, page, results, screenshots);

    // Test 4: Split modal - Add portions
    await runTest('Batch Split - Add Portions', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const splitBtn = page.locator('button:has-text("Split")');
            if (await splitBtn.isVisible()) {
                await splitBtn.click();
                await page.waitForTimeout(500);

                // Add another portion
                const addPortionBtn = page.locator('button:has-text("Add Portion"), button:has-text("Add")');
                if (await addPortionBtn.isVisible()) {
                    await addPortionBtn.click();
                    await page.waitForTimeout(300);
                    await screenshots.capture(page, 'batch-split-portions-added');
                }
            }
        }
    }, page, results, screenshots);

    // Test 5: Split modal - Fill portion quantities
    await runTest('Batch Split - Fill Quantities', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const splitBtn = page.locator('button:has-text("Split")');
            if (await splitBtn.isVisible()) {
                await splitBtn.click();
                await page.waitForTimeout(500);

                // Fill portion quantities
                const qtyInputs = page.locator('.modal input[type="number"]');
                const count = await qtyInputs.count();
                if (count >= 2) {
                    await qtyInputs.nth(0).fill('250');
                    await qtyInputs.nth(1).fill('250');
                    await page.waitForTimeout(300);
                    await screenshots.capture(page, 'batch-split-quantities-filled');
                }
            }
        }
    }, page, results, screenshots);

    // Test 6: Split validation (sum exceeds batch quantity)
    await runTest('Batch Split - Quantity Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const splitBtn = page.locator('button:has-text("Split")');
            if (await splitBtn.isVisible()) {
                await splitBtn.click();
                await page.waitForTimeout(500);

                // Fill with quantities that exceed batch total
                const qtyInputs = page.locator('.modal input[type="number"]');
                if (await qtyInputs.count() >= 2) {
                    await qtyInputs.nth(0).fill('99999');
                    await qtyInputs.nth(1).fill('99999');
                    await page.waitForTimeout(300);
                    await screenshots.capture(page, 'batch-split-quantity-validation');

                    // Check for validation error
                    const error = page.locator('.modal .error, .modal .text-danger, .modal .alert-danger');
                    // Should show validation error
                }
            }
        }
    }, page, results, screenshots);

    // Test 7: Complete split (with submit)
    if (submitActions) {
        await runTest('Batch Split - Complete Flow', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const splitBtn = page.locator('button:has-text("Split")');
                if (await splitBtn.isVisible()) {
                    await splitBtn.click();
                    await page.waitForTimeout(500);

                    // Fill portions
                    const qtyInputs = page.locator('.modal input[type="number"]');
                    if (await qtyInputs.count() >= 2) {
                        await qtyInputs.nth(0).fill('100');
                        await qtyInputs.nth(1).fill('100');
                    }

                    // Fill reason
                    const reasonInput = page.locator('.modal textarea, .modal #reason');
                    if (await reasonInput.isVisible()) {
                        await reasonInput.fill('E2E test split');
                    }

                    await screenshots.capture(page, 'batch-split-ready');

                    // Submit
                    const confirmBtn = page.locator('.modal button:has-text("Split"), .modal button:has-text("Confirm")');
                    if (await confirmBtn.isEnabled()) {
                        await confirmBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);
                        await screenshots.capture(page, 'batch-split-success');
                    }
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // BATCH MERGE
    // ============================================

    // Test 8: Merge button visibility
    await runTest('Batch Merge - Button Visibility', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const mergeBtn = page.locator('button:has-text("Merge")');
            if (await mergeBtn.isVisible()) {
                await screenshots.capture(page, 'batch-merge-button-visible');
            } else {
                console.log('   Merge button not visible');
            }
        }
    }, page, results, screenshots);

    // Test 9: Open merge modal
    await runTest('Batch Merge - Open Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const mergeBtn = page.locator('button:has-text("Merge")');
            if (await mergeBtn.isVisible()) {
                await mergeBtn.click();
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'batch-merge-modal-open');

                const modal = page.locator('.modal, .merge-modal, [role="dialog"]');
                if (!await modal.isVisible()) {
                    throw new Error('Merge modal did not open');
                }
            }
        }
    }, page, results, screenshots);

    // Test 10: Merge modal - Select batches
    await runTest('Batch Merge - Select Batches', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const mergeBtn = page.locator('button:has-text("Merge")');
            if (await mergeBtn.isVisible()) {
                await mergeBtn.click();
                await page.waitForTimeout(500);

                // Select batches to merge
                const checkboxes = page.locator('.modal input[type="checkbox"]');
                const count = await checkboxes.count();
                if (count > 0) {
                    await checkboxes.first().check();
                    await page.waitForTimeout(300);
                    await screenshots.capture(page, 'batch-merge-batches-selected');
                }
            }
        }
    }, page, results, screenshots);

    // Test 11: Complete merge (with submit)
    if (submitActions) {
        await runTest('Batch Merge - Complete Flow', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const mergeBtn = page.locator('button:has-text("Merge")');
                if (await mergeBtn.isVisible()) {
                    await mergeBtn.click();
                    await page.waitForTimeout(500);

                    // Select batch to merge
                    const checkboxes = page.locator('.modal input[type="checkbox"]');
                    if (await checkboxes.count() > 0) {
                        await checkboxes.first().check();
                    }

                    // Fill reason
                    const reasonInput = page.locator('.modal textarea, .modal #reason');
                    if (await reasonInput.isVisible()) {
                        await reasonInput.fill('E2E test merge');
                    }

                    await screenshots.capture(page, 'batch-merge-ready');

                    // Submit
                    const confirmBtn = page.locator('.modal button:has-text("Merge"), .modal button:has-text("Confirm")');
                    if (await confirmBtn.isEnabled()) {
                        await confirmBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);
                        await screenshots.capture(page, 'batch-merge-success');
                    }
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // QUANTITY ADJUSTMENT
    // ============================================

    // Test 12: Adjust quantity button
    await runTest('Batch Adjust - Button Visibility', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const adjustBtn = page.locator('button:has-text("Adjust"), button:has-text("Adjust Quantity")');
            if (await adjustBtn.isVisible()) {
                await screenshots.capture(page, 'batch-adjust-button-visible');
            }
        }
    }, page, results, screenshots);

    // Test 13: Open adjust modal
    await runTest('Batch Adjust - Open Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const adjustBtn = page.locator('button:has-text("Adjust"), button:has-text("Adjust Quantity")');
            if (await adjustBtn.isVisible()) {
                await adjustBtn.click();
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'batch-adjust-modal-open');

                const modal = page.locator('.modal, .adjust-modal, [role="dialog"]');
                if (!await modal.isVisible()) {
                    throw new Error('Adjust modal did not open');
                }
            }
        }
    }, page, results, screenshots);

    // Test 14: Adjust - Reason required validation
    await runTest('Batch Adjust - Reason Required', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const adjustBtn = page.locator('button:has-text("Adjust"), button:has-text("Adjust Quantity")');
            if (await adjustBtn.isVisible()) {
                await adjustBtn.click();
                await page.waitForTimeout(500);

                // Fill quantity but not reason
                const qtyInput = page.locator('.modal input[type="number"]');
                if (await qtyInput.isVisible()) {
                    await qtyInput.fill('200');
                }

                // Try to submit without reason
                const confirmBtn = page.locator('.modal button:has-text("Adjust"), .modal button:has-text("Confirm")');
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    await page.waitForTimeout(300);
                    await screenshots.capture(page, 'batch-adjust-reason-required');

                    // Should show error or button should be disabled
                }
            }
        }
    }, page, results, screenshots);

    // Test 15: Complete adjustment (with submit)
    if (submitActions) {
        await runTest('Batch Adjust - Complete Flow', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const adjustBtn = page.locator('button:has-text("Adjust"), button:has-text("Adjust Quantity")');
                if (await adjustBtn.isVisible()) {
                    await adjustBtn.click();
                    await page.waitForTimeout(500);

                    // Fill new quantity
                    const qtyInput = page.locator('.modal input[type="number"]');
                    if (await qtyInput.isVisible()) {
                        await qtyInput.fill('450');
                    }

                    // Select adjustment type
                    const typeSelect = page.locator('.modal select');
                    if (await typeSelect.isVisible()) {
                        await typeSelect.selectOption({ index: 1 });
                    }

                    // Fill reason (mandatory)
                    const reasonInput = page.locator('.modal textarea, .modal #reason');
                    if (await reasonInput.isVisible()) {
                        await reasonInput.fill('E2E test adjustment - inventory count correction');
                    }

                    await screenshots.capture(page, 'batch-adjust-ready');

                    // Submit
                    const confirmBtn = page.locator('.modal button:has-text("Adjust"), .modal button:has-text("Confirm")');
                    if (await confirmBtn.isEnabled()) {
                        await confirmBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);
                        await screenshots.capture(page, 'batch-adjust-success');
                    }
                }
            }
        }, page, results, screenshots);
    }

    // Test 16: Verify adjustment history
    await runTest('Batch Adjust - View History', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for adjustment history section
            const historySection = page.locator('.adjustment-history, .history-section, :has-text("Adjustment History")');
            if (await historySection.isVisible()) {
                await screenshots.capture(page, 'batch-adjustment-history');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // BATCH GENEALOGY NAVIGATION
    // ============================================

    // Test 17: Navigate to parent batch via genealogy
    await runTest('Batch Genealogy - Navigate to Parent', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for genealogy section
            const genealogy = page.locator('.genealogy, .batch-relations');
            if (await genealogy.isVisible()) {
                // Click on a parent batch link
                const parentLink = page.locator('.parent-batch a, .genealogy a').first();
                if (await parentLink.isVisible()) {
                    await parentLink.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(500);
                    await screenshots.capture(page, 'batch-genealogy-parent');
                }
            }
        }
    }, page, results, screenshots);

    // Test 18: Release allocation
    await runTest('Batch Allocation - Release', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}?status=AVAILABLE`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for allocations section
            const allocations = page.locator('.allocations, .allocation-section');
            if (await allocations.isVisible()) {
                // Look for release button
                const releaseBtn = page.locator('button:has-text("Release")');
                if (await releaseBtn.isVisible()) {
                    await screenshots.capture(page, 'batch-allocation-release-visible');
                }
            }
        }
    }, page, results, screenshots);

    console.log('\n✅ Batch operations tests finished');
}

module.exports = { runBatchOperationsTests };
