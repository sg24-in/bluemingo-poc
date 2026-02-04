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
            await searchInput.fill('RM-BATCH');
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
}

module.exports = { runBatchesTests };
