/**
 * Production History Tests
 * Tests for production confirmation history page (/production/history)
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runProductionHistoryTests(page, screenshots, results, runTest) {
    console.log('\n' + '='.repeat(50));
    console.log('PRODUCTION HISTORY TESTS');
    console.log('='.repeat(50));

    // ============================================
    // HISTORY PAGE BASIC TESTS
    // ============================================

    await runTest('Production History - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'production-history-page');

        // Verify page is loaded
        const pageContent = page.locator('h1, h2, .page-header');
        if (!await pageContent.first().isVisible()) {
            throw new Error('Production History page content not visible');
        }
    }, page, results, screenshots);

    await runTest('Production History - Page Title', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for appropriate title
        const header = page.locator('h1, h2').filter({ hasText: /production|history|confirmation/i });
        const headerExists = await header.first().isVisible();

        if (!headerExists) {
            // Try looking for page-header class
            const pageHeader = page.locator('.page-header');
            if (!await pageHeader.isVisible()) {
                throw new Error('No page title or header found');
            }
        }

        await screenshots.capture(page, 'production-history-title');
    }, page, results, screenshots);

    // ============================================
    // TABLE/LIST DISPLAY
    // ============================================

    await runTest('Production History - Table or List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table').first();
        const cards = page.locator('.confirmation-card, .history-card, .card');
        const emptyState = page.locator('.empty-state, .no-data, :text("No data"), :text("No confirmations")');

        const hasTable = await table.isVisible();
        const hasCards = await cards.first().isVisible();
        const hasEmpty = await emptyState.first().isVisible();

        if (!hasTable && !hasCards && !hasEmpty) {
            throw new Error('No history list/table or empty state visible');
        }

        if (hasTable) {
            await screenshots.capture(page, 'production-history-table');
            console.log('  - Table view displayed');
        } else if (hasCards) {
            await screenshots.capture(page, 'production-history-cards');
            console.log('  - Card view displayed');
        } else if (hasEmpty) {
            await screenshots.capture(page, 'production-history-empty');
            console.log('  - Empty state displayed (no confirmations)');
        }
    }, page, results, screenshots);

    await runTest('Production History - Table Headers', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table').first();
        if (await table.isVisible()) {
            const headers = await table.locator('th').allTextContents();
            console.log('  - Table headers:', headers.join(', '));

            // Expect common headers for production history
            const expectedHeaders = ['order', 'operation', 'status', 'date', 'quantity', 'equipment'];
            const foundHeaders = headers.map(h => h.toLowerCase());
            const matchedHeaders = expectedHeaders.filter(exp =>
                foundHeaders.some(f => f.includes(exp))
            );

            console.log('  - Matched headers:', matchedHeaders.join(', '));
            await screenshots.capture(page, 'production-history-headers');
        } else {
            console.log('  - No table view available');
        }
    }, page, results, screenshots);

    // ============================================
    // FILTERS
    // ============================================

    await runTest('Production History - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"], select#statusFilter');
        if (await statusFilter.isVisible()) {
            const options = await statusFilter.locator('option').allTextContents();
            console.log('  - Status filter options:', options.join(', '));

            // Try filtering
            if (options.length > 1) {
                await statusFilter.selectOption({ index: 1 });
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'production-history-filtered-status');
            }
        } else {
            console.log('  - No status filter dropdown found');
        }
    }, page, results, screenshots);

    await runTest('Production History - Date Range Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const startDateInput = page.locator('input[type="date"][name*="start"], input#startDate');
        const endDateInput = page.locator('input[type="date"][name*="end"], input#endDate');

        if (await startDateInput.isVisible()) {
            await startDateInput.fill('2024-01-01');
            console.log('  - Start date filter available');
        }
        if (await endDateInput.isVisible()) {
            await endDateInput.fill('2024-12-31');
            console.log('  - End date filter available');
        }

        if (await startDateInput.isVisible() || await endDateInput.isVisible()) {
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'production-history-date-filter');
        } else {
            console.log('  - No date range filter found');
        }
    }, page, results, screenshots);

    await runTest('Production History - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input#search');
        if (await searchInput.isVisible()) {
            await searchInput.fill('ORD');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'production-history-search');
            console.log('  - Search functionality available');
        } else {
            console.log('  - No search input found');
        }
    }, page, results, screenshots);

    // ============================================
    // CONFIRMATION DETAILS
    // ============================================

    await runTest('Production History - Detail View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try clicking on a row to view details
        const tableRow = page.locator('table tbody tr').first();
        const card = page.locator('.confirmation-card, .history-card, .card').first();
        const viewButton = page.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")').first();

        if (await viewButton.isVisible()) {
            await viewButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'production-history-detail');
            console.log('  - Detail view opened');

            // Try to close if modal
            const closeButton = page.locator('button:has-text("Close"), button.close').first();
            if (await closeButton.isVisible()) {
                await closeButton.click();
                await page.waitForTimeout(300);
            }
        } else if (await tableRow.isVisible()) {
            const rowLink = tableRow.locator('a').first();
            if (await rowLink.isVisible()) {
                await rowLink.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'production-history-detail');
            } else {
                console.log('  - No clickable details found');
            }
        } else if (await card.isVisible()) {
            await card.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'production-history-detail');
        } else {
            console.log('  - No confirmation records to view');
        }
    }, page, results, screenshots);

    // ============================================
    // SUMMARY/STATS
    // ============================================

    await runTest('Production History - Summary Stats', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const summaryCards = page.locator('.summary-card, .stat-card, .stats-container');
        if (await summaryCards.first().isVisible()) {
            await screenshots.capture(page, 'production-history-summary');
            console.log('  - Summary statistics displayed');
        } else {
            console.log('  - No summary statistics found');
        }
    }, page, results, screenshots);

    // ============================================
    // SORTING
    // ============================================

    await runTest('Production History - Sorting', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table').first();
        if (await table.isVisible()) {
            // Try clicking on a sortable header
            const sortableHeader = table.locator('th[class*="sort"], th:has-text("Date")').first();
            if (await sortableHeader.isVisible()) {
                await sortableHeader.click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'production-history-sorted');
                console.log('  - Sorting applied');
            } else {
                console.log('  - No sortable headers found');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // PAGINATION
    // ============================================

    await runTest('Production History - Pagination', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const pagination = page.locator('.pagination, app-pagination');
        if (await pagination.isVisible()) {
            await screenshots.capture(page, 'production-history-pagination');

            // Try clicking next page
            const nextButton = pagination.locator('button:has-text("Next"), button:has-text(">")').first();
            if (await nextButton.isVisible() && await nextButton.isEnabled()) {
                await nextButton.click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'production-history-page-2');
                console.log('  - Pagination working');
            }
        } else {
            console.log('  - No pagination controls found');
        }
    }, page, results, screenshots);

    console.log('\n' + '='.repeat(50));
    console.log('PRODUCTION HISTORY TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runProductionHistoryTests };
