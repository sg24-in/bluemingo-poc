/**
 * Batches Tests
 * Tests batch list, detail view, genealogy, split, and merge
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runBatchesTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 BATCHES TESTS');
    console.log('─'.repeat(50));

    // Test 1: Batches list view
    await runTest('Batches - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'batches-list-view');
    }, page, results, screenshots);

    // Test 2: Filter by status
    await runTest('Batches - Filter by Status', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'batches-filter-before');

        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('AVAILABLE').catch(() => {
                return statusFilter.selectOption({ index: 1 });
            });
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'batches-filter-after');
    }, page, results, screenshots);

    // Test 3: Search batches
    await runTest('Batches - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'batches-search-before');

        const searchInput = page.locator('input[name="search"], input[type="search"], input[placeholder*="search" i]');
        if (await searchInput.count() > 0) {
            await searchInput.fill('B-IM');
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'batches-search-after');
    }, page, results, screenshots);

    // Test 4: View batch detail
    await runTest('Batches - View Detail', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'batches-before-row-click');

        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'batches-detail-view', { fullPage: true });
        } else {
            throw new Error('No batches found in table');
        }
    }, page, results, screenshots);

    // Test 5: Batch genealogy view
    await runTest('Batches - Genealogy View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Look for genealogy section or tab
            const genealogyTab = page.locator('button:has-text("Genealogy"), a:has-text("Genealogy"), .tab:has-text("Genealogy")');
            if (await genealogyTab.count() > 0) {
                await genealogyTab.first().click();
                await page.waitForTimeout(500);
            }

            const genealogySection = page.locator('.genealogy, .batch-tree, [class*="genealogy"]');
            if (await genealogySection.count() > 0) {
                await screenshots.capture(page, 'batches-genealogy-view');
            } else {
                await screenshots.capture(page, 'batches-detail-full', { fullPage: true });
            }
        }
    }, page, results, screenshots);

    // Test 6: Split batch modal (if available)
    await runTest('Batches - Split Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const splitBtn = page.locator('button:has-text("Split"), .btn-split');
            if (await splitBtn.count() > 0 && await splitBtn.first().isEnabled()) {
                await screenshots.capture(page, 'batches-split-before');

                await splitBtn.first().click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'batches-split-modal');

                // Cancel
                const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            } else {
                console.log('   ⏭️  Split button not available');
            }
        }
    }, page, results, screenshots);

    // Test 7: Merge batch modal (if available)
    await runTest('Batches - Merge Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const mergeBtn = page.locator('button:has-text("Merge"), .btn-merge');
            if (await mergeBtn.count() > 0 && await mergeBtn.first().isEnabled()) {
                await screenshots.capture(page, 'batches-merge-before');

                await mergeBtn.first().click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'batches-merge-modal');

                // Cancel
                const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            } else {
                console.log('   ⏭️  Merge button not available');
            }
        }
    }, page, results, screenshots);

    // Test 8: Batch with relations
    await runTest('Batches - View Relations', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Try to find a batch with relations (intermediate or finished goods)
        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
            await rows.nth(i).click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Check if this batch has relations
            const relationsSection = page.locator('.relations, .parent-batches, .child-batches, [class*="relation"]');
            if (await relationsSection.count() > 0) {
                await screenshots.capture(page, 'batches-with-relations', { fullPage: true });
                break;
            }

            // Go back to list
            await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(300);
        }
    }, page, results, screenshots);

    // Test 9: Batch Allocations Section (GAP-001)
    await runTest('Batches - View Allocations', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Check for allocations section
            const allocationSection = page.locator('.allocation-summary, [class*="allocation"], .card:has-text("Allocations")');
            if (await allocationSection.count() > 0) {
                await screenshots.capture(page, 'batches-allocations-section');
            }
        }
    }, page, results, screenshots);

    // Test 10: Batch Allocation Modal (GAP-001)
    await runTest('Batches - Allocation Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const allocateBtn = page.locator('button:has-text("Allocate"), button:has-text("Allocate to Order")');
            if (await allocateBtn.count() > 0 && await allocateBtn.first().isEnabled()) {
                await screenshots.capture(page, 'batches-allocation-before');

                await allocateBtn.first().click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'batches-allocation-modal');

                // Cancel
                const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal-footer button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            } else {
                console.log('   ⏭️  Allocate button not available (batch may be fully allocated or not available)');
            }
        }
    }, page, results, screenshots);

    // ========================================================================
    // B22: Batch Approval Workflow E2E Tests (Phase 8E)
    // Per MES Batch Management Specification:
    // - New batches start in QUALITY_PENDING status
    // - Batches require approval before becoming AVAILABLE
    // ========================================================================

    // Test 11: Filter QUALITY_PENDING batches
    await runTest('Batches - Filter Quality Pending', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'batches-pending-filter-before');

        const statusFilter = page.locator('select[name="status"], select#status, select.status-filter');
        if (await statusFilter.count() > 0) {
            // Try to select QUALITY_PENDING
            await statusFilter.selectOption('QUALITY_PENDING').catch(async () => {
                // Fallback: check all options
                const options = await statusFilter.locator('option').all();
                for (const opt of options) {
                    const text = await opt.textContent();
                    if (text && text.includes('PENDING')) {
                        await statusFilter.selectOption(await opt.getAttribute('value') || text);
                        break;
                    }
                }
            });
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'batches-pending-filter-after');
    }, page, results, screenshots);

    // Test 12: Batch Approval UI
    await runTest('Batches - Approval Buttons Visible', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to show QUALITY_PENDING batches
        const statusFilter = page.locator('select[name="status"], select#status, select.status-filter');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('QUALITY_PENDING').catch(() => {});
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for Approve/Reject buttons
            const approveBtn = page.locator('button:has-text("Approve"), .btn-approve');
            const rejectBtn = page.locator('button:has-text("Reject"), .btn-reject');

            if (await approveBtn.count() > 0 || await rejectBtn.count() > 0) {
                await screenshots.capture(page, 'batches-approval-buttons');
                console.log('   ✅ Approval buttons found');
            } else {
                console.log('   ⏭️  No QUALITY_PENDING batches or approval buttons not visible');
            }
        }
    }, page, results, screenshots);

    // Test 13: Batch Approval Modal
    await runTest('Batches - Approval Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter QUALITY_PENDING
        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('QUALITY_PENDING').catch(() => {});
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const approveBtn = page.locator('button:has-text("Approve"), .btn-approve');
            if (await approveBtn.count() > 0 && await approveBtn.first().isEnabled()) {
                await approveBtn.first().click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'batches-approval-modal');

                // Cancel without submitting
                const cancelBtn = page.locator('.modal button:has-text("Cancel"), button.btn-secondary');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.first().click();
                }
            } else {
                console.log('   ⏭️  No approvals pending or button not enabled');
            }
        }
    }, page, results, screenshots);

    // Test 14: Batch Rejection Modal
    await runTest('Batches - Rejection Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('QUALITY_PENDING').catch(() => {});
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const rejectBtn = page.locator('button:has-text("Reject"), .btn-reject, .btn-danger:has-text("Reject")');
            if (await rejectBtn.count() > 0 && await rejectBtn.first().isEnabled()) {
                await rejectBtn.first().click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'batches-rejection-modal');

                // Cancel without submitting
                const cancelBtn = page.locator('.modal button:has-text("Cancel"), button.btn-secondary');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.first().click();
                }
            } else {
                console.log('   ⏭️  No rejections pending or button not enabled');
            }
        }
    }, page, results, screenshots);

    // Test 15: Batch Quantity Adjustment
    await runTest('Batches - Quantity Adjustment', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Look for an AVAILABLE batch
        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const adjustBtn = page.locator('button:has-text("Adjust Quantity"), button:has-text("Adjust"), .btn-adjust');
            if (await adjustBtn.count() > 0 && await adjustBtn.first().isEnabled()) {
                await adjustBtn.first().click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'batches-adjustment-modal');

                // Cancel without submitting
                const cancelBtn = page.locator('.modal button:has-text("Cancel"), button.btn-secondary');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.first().click();
                }
            } else {
                console.log('   ⏭️  Adjustment button not available');
            }
        }
    }, page, results, screenshots);

    // Test 16: Batch Adjustment History
    await runTest('Batches - Adjustment History', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            await rows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for adjustment history section or tab
            const historyTab = page.locator('button:has-text("History"), a:has-text("Adjustments"), .tab:has-text("History")');
            if (await historyTab.count() > 0) {
                await historyTab.first().click();
                await page.waitForTimeout(500);
            }

            const historySection = page.locator('.adjustment-history, [class*="history"], .adjustments-table');
            if (await historySection.count() > 0) {
                await screenshots.capture(page, 'batches-adjustment-history');
            } else {
                await screenshots.capture(page, 'batches-detail-with-history', { fullPage: true });
            }
        }
    }, page, results, screenshots);
}

module.exports = { runBatchesTests };
