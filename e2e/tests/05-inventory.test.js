/**
 * Inventory Tests
 * Tests inventory list, filtering, blocking, and scrapping
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runInventoryTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 INVENTORY TESTS');
    console.log('─'.repeat(50));

    // Test 1: Inventory list view
    await runTest('Inventory - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'inventory-list-view');
    }, page, results, screenshots);

    // Test 2: Filter by state
    await runTest('Inventory - Filter by State', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'inventory-filter-before');

        const stateFilter = page.locator('select[name="state"], select#state, select:has(option:has-text("AVAILABLE"))');
        if (await stateFilter.count() > 0) {
            await stateFilter.first().selectOption('AVAILABLE').catch(() => {
                return stateFilter.first().selectOption({ index: 1 });
            });
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-filter-available');
    }, page, results, screenshots);

    // Test 3: Filter by type
    await runTest('Inventory - Filter by Type', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const typeFilter = page.locator('select[name="type"], select#type, select:has(option:has-text("RAW"))');
        if (await typeFilter.count() > 0) {
            await typeFilter.first().selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-filter-type');
    }, page, results, screenshots);

    // Test 4: Search functionality
    await runTest('Inventory - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'inventory-search-before');

        const searchInput = page.locator('input[name="search"], input[type="search"], input[placeholder*="search" i]');
        if (await searchInput.count() > 0) {
            await searchInput.fill('BATCH');
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-search-after');
    }, page, results, screenshots);

    // Test 5: View blocked items
    await runTest('Inventory - View Blocked Items', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const stateFilter = page.locator('select[name="state"], select#state');
        if (await stateFilter.count() > 0) {
            await stateFilter.selectOption('BLOCKED').catch(() => {
                return stateFilter.selectOption({ label: 'BLOCKED' });
            }).catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-blocked-items');
    }, page, results, screenshots);

    // Test 6: Block modal
    await runTest('Inventory - Block Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to available items
        const stateFilter = page.locator('select[name="state"], select#state');
        if (await stateFilter.count() > 0) {
            await stateFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-block-before');

        // Find and click block button
        const blockBtn = page.locator('button:has-text("Block"), .btn-block');
        if (await blockBtn.count() > 0) {
            await blockBtn.first().click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'inventory-block-modal-open');

            // Fill reason
            const reasonInput = page.locator('textarea, input[name="reason"], input[formControlName="reason"]');
            if (await reasonInput.count() > 0) {
                await reasonInput.fill(TEST_DATA.reasons.block);
            }

            await screenshots.capture(page, 'inventory-block-modal-filled');

            // Cancel or submit based on flag
            if (submitActions) {
                const confirmBtn = page.locator('.modal button.btn-primary, .modal button:has-text("Confirm"), .modal button:has-text("Block")');
                if (await confirmBtn.count() > 0) {
                    await confirmBtn.click();
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'inventory-block-success');
                }
            } else {
                const cancelBtn = page.locator('.modal button:has-text("Cancel"), .btn-secondary');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        }
    }, page, results, screenshots);

    // Test 7: Unblock action
    await runTest('Inventory - Unblock Action', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to blocked items
        const stateFilter = page.locator('select[name="state"], select#state');
        if (await stateFilter.count() > 0) {
            await stateFilter.selectOption('BLOCKED').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-unblock-before');

        const unblockBtn = page.locator('button:has-text("Unblock"), .btn-unblock');
        if (await unblockBtn.count() > 0 && submitActions) {
            await unblockBtn.first().click();
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'inventory-unblock-success');
        }
    }, page, results, screenshots);

    // Test 8: Scrap modal
    await runTest('Inventory - Scrap Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to available items
        const stateFilter = page.locator('select[name="state"], select#state');
        if (await stateFilter.count() > 0) {
            await stateFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-scrap-before');

        const scrapBtn = page.locator('button:has-text("Scrap"), .btn-scrap');
        if (await scrapBtn.count() > 0) {
            await scrapBtn.first().click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'inventory-scrap-modal-open');

            // Fill reason
            const reasonInput = page.locator('textarea, input[name="reason"]');
            if (await reasonInput.count() > 0) {
                await reasonInput.fill(TEST_DATA.reasons.scrap);
            }

            await screenshots.capture(page, 'inventory-scrap-modal-filled');

            if (submitActions) {
                const confirmBtn = page.locator('.modal button.btn-primary, .modal button:has-text("Confirm")');
                if (await confirmBtn.count() > 0) {
                    await confirmBtn.click();
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'inventory-scrap-success');
                }
            } else {
                const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        }
    }, page, results, screenshots);

    // Test 9: View scrapped items
    await runTest('Inventory - View Scrapped Items', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const stateFilter = page.locator('select[name="state"], select#state');
        if (await stateFilter.count() > 0) {
            await stateFilter.selectOption('SCRAPPED').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-scrapped-items');
    }, page, results, screenshots);
}

module.exports = { runInventoryTests };
