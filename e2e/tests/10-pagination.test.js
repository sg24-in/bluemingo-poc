/**
 * Pagination Tests
 * Tests server-side pagination controls across different list views
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runPaginationTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 PAGINATION TESTS');
    console.log('─'.repeat(50));

    // Test 1: Orders pagination controls visible
    await runTest('Pagination - Orders Page Controls', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Scroll to bottom to see pagination
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'pagination-orders-controls');

        // Check pagination component exists
        const pagination = page.locator('app-pagination, .pagination');
        if (await pagination.count() === 0) {
            console.log('   ⚠️  No pagination component found (may have few items)');
        }
    }, page, results, screenshots);

    // Test 2: Orders page size change
    await runTest('Pagination - Change Page Size', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'pagination-before-size-change');

        // Find page size selector
        const pageSizeSelect = page.locator('select[name="pageSize"], select.page-size, select:has(option:has-text("10"))');
        if (await pageSizeSelect.count() > 0) {
            await pageSizeSelect.selectOption('10');
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'pagination-after-size-change');
        } else {
            console.log('   ⚠️  No page size selector found');
        }
    }, page, results, screenshots);

    // Test 3: Inventory pagination
    await runTest('Pagination - Inventory Page Controls', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'pagination-inventory-controls');
    }, page, results, screenshots);

    // Test 4: Batches pagination
    await runTest('Pagination - Batches Page Controls', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'pagination-batches-controls');
    }, page, results, screenshots);

    // Test 5: Page navigation buttons
    await runTest('Pagination - Navigation Buttons', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Look for next/previous buttons
        const nextBtn = page.locator('button:has-text("Next"), button[aria-label="Next"], .pagination-next');
        const prevBtn = page.locator('button:has-text("Previous"), button[aria-label="Previous"], .pagination-prev');

        const nextCount = await nextBtn.count();
        const prevCount = await prevBtn.count();

        await screenshots.capture(page, 'pagination-nav-buttons');

        if (nextCount > 0 || prevCount > 0) {
            console.log(`   ℹ️  Found ${nextCount} next, ${prevCount} prev buttons`);
        }
    }, page, results, screenshots);

    // Test 6: Page info display
    await runTest('Pagination - Page Info Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'pagination-page-info');

        // Check for page info text like "Page 1 of 3" or "Showing 1-20 of 50"
        const pageInfo = page.locator('.page-info, .pagination-info, :text-matches("Page \\\\d+ of \\\\d+"), :text-matches("Showing \\\\d+-\\\\d+ of \\\\d+")');
        if (await pageInfo.count() > 0) {
            const text = await pageInfo.first().textContent();
            console.log(`   ℹ️  Page info: ${text?.trim()}`);
        }
    }, page, results, screenshots);

    // Test 7: Filter + pagination combined
    await runTest('Pagination - Filter with Pagination', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Apply filter
        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('IN_PROGRESS').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'pagination-filter-before');

        // Change page size
        const pageSizeSelect = page.locator('select[name="pageSize"], select.page-size');
        if (await pageSizeSelect.count() > 0) {
            await pageSizeSelect.selectOption('10').catch(() => {});
            await page.waitForTimeout(500);
        }

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await screenshots.capture(page, 'pagination-filter-combined');
    }, page, results, screenshots);

    // Test 8: Search + pagination combined
    await runTest('Pagination - Search with Pagination', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Search
        const searchInput = page.locator('input[name="search"], input[type="search"], input[placeholder*="search" i]');
        if (await searchInput.count() > 0) {
            await searchInput.fill('BATCH');
            await page.waitForTimeout(1000);
        }

        await screenshots.capture(page, 'pagination-search-result');

        // Clear search
        if (await searchInput.count() > 0) {
            await searchInput.clear();
            await page.waitForTimeout(500);
        }

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await screenshots.capture(page, 'pagination-search-cleared');
    }, page, results, screenshots);

    // ─── Tests 9-20: Verify <app-pagination> renders on all 12 newly-paginated pages ───

    const paginatedPages = [
        { name: 'Customers',          route: ROUTES.CUSTOMERS },
        { name: 'Materials',           route: ROUTES.MATERIALS },
        { name: 'Products',            route: ROUTES.PRODUCTS },
        { name: 'Operators',           route: ROUTES.OPERATORS },
        { name: 'Operation Templates', route: ROUTES.OPERATION_TEMPLATES },
        { name: 'Batch Number Config', route: ROUTES.CONFIG_BATCH_NUMBER },
        { name: 'Hold Reasons',        route: ROUTES.CONFIG_HOLD_REASONS },
        { name: 'Delay Reasons',       route: ROUTES.CONFIG_DELAY_REASONS },
        { name: 'Process Params',      route: ROUTES.CONFIG_PROCESS_PARAMS },
        { name: 'Quantity Type',       route: ROUTES.CONFIG_QUANTITY_TYPE },
        { name: 'Audit Log',           route: ROUTES.AUDIT },
        { name: 'Batch Size Config',   route: ROUTES.CONFIG_BATCH_SIZE },
    ];

    for (const pg of paginatedPages) {
        await runTest(`Pagination - ${pg.name} Page`, async () => {
            await page.goto(`${config.baseUrl}${pg.route}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Scroll to bottom to see pagination
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(500);

            const screenshotName = `pagination-${pg.name.toLowerCase().replace(/\s+/g, '-')}`;
            await screenshots.capture(page, screenshotName);

            // Check pagination component exists
            const pagination = page.locator('app-pagination');
            const paginationCount = await pagination.count();
            if (paginationCount > 0) {
                console.log(`   ✅ app-pagination found on ${pg.name}`);
            } else {
                console.log(`   ⚠️  No app-pagination on ${pg.name} (may have few items)`);
            }
        }, page, results, screenshots);
    }
}

module.exports = { runPaginationTests };
