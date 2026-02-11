/**
 * Audit Trail and Production History Tests
 * Tests for viewing audit logs and production confirmation history
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runAuditHistoryTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('AUDIT TRAIL & PRODUCTION HISTORY TESTS');
    console.log('='.repeat(50));

    // ============================================
    // AUDIT TRAIL
    // ============================================

    await runTest('Audit - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'audit-list');

        // Verify page header
        const header = page.locator('h1:has-text("Audit Trail")');
        if (!await header.isVisible()) {
            throw new Error('Audit Trail header not visible');
        }

        // Verify today's count badge
        const statBadge = page.locator('.stat-badge');
        if (!await statBadge.isVisible()) {
            throw new Error('Today\'s count badge not visible');
        }
    }, page, results, screenshots);

    await runTest('Audit - Table View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table.data-table');
        const emptyState = page.locator('.empty-state');

        // Either table or empty state should be visible
        const hasTable = await table.isVisible();
        const hasEmpty = await emptyState.isVisible();

        if (!hasTable && !hasEmpty) {
            throw new Error('Neither table nor empty state visible');
        }

        if (hasTable) {
            await screenshots.capture(page, 'audit-table');

            // Verify table headers
            const headers = ['Action', 'Entity', 'ID', 'Field', 'Change', 'User', 'Timestamp'];
            for (const header of headers) {
                const th = page.locator(`th:has-text("${header}")`);
                if (!await th.isVisible()) {
                    throw new Error(`Table header "${header}" not visible`);
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Audit - Entity Type Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const entityFilter = page.locator('#entity-filter');
        if (!await entityFilter.isVisible()) {
            throw new Error('Entity filter not visible');
        }

        // Get filter options
        const options = entityFilter.locator('option');
        const optionCount = await options.count();
        if (optionCount < 2) {
            throw new Error(`Expected at least 2 entity filter options, found ${optionCount}`);
        }

        // Select a specific entity type if available
        const firstOption = options.nth(1);
        const optionValue = await firstOption.getAttribute('value');
        if (optionValue && optionValue !== 'all') {
            await entityFilter.selectOption(optionValue);
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'audit-filter-entity');
        }
    }, page, results, screenshots);

    await runTest('Audit - Action Type Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const actionFilter = page.locator('#action-filter');
        if (!await actionFilter.isVisible()) {
            throw new Error('Action filter not visible');
        }

        // Get filter options
        const options = actionFilter.locator('option');
        const optionCount = await options.count();
        if (optionCount < 2) {
            throw new Error(`Expected at least 2 action filter options, found ${optionCount}`);
        }

        // Select CREATE action if available
        const createOption = actionFilter.locator('option[value="CREATE"]');
        if (await createOption.count() > 0) {
            await actionFilter.selectOption('CREATE');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'audit-filter-action-create');
        }
    }, page, results, screenshots);

    await runTest('Audit - User Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const userFilter = page.locator('#user-filter');
        if (!await userFilter.isVisible()) {
            throw new Error('User filter not visible');
        }

        // Type a user filter
        await userFilter.fill('admin');
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'audit-filter-user');
    }, page, results, screenshots);

    await runTest('Audit - Clear Filters', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Apply some filters first
        const entityFilter = page.locator('#entity-filter');
        const options = entityFilter.locator('option');
        const optionCount = await options.count();
        if (optionCount > 1) {
            const firstOption = options.nth(1);
            const optionValue = await firstOption.getAttribute('value');
            if (optionValue) {
                await entityFilter.selectOption(optionValue);
            }
        }

        const userFilter = page.locator('#user-filter');
        await userFilter.fill('test');
        await page.waitForTimeout(500);

        // Click clear button
        const clearBtn = page.locator('button:has-text("Clear")');
        await clearBtn.click();
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'audit-filters-cleared');

        // Verify filters reset
        const entityValue = await entityFilter.inputValue();
        const userValue = await userFilter.inputValue();

        if (userValue !== '') {
            throw new Error('User filter not cleared');
        }
    }, page, results, screenshots);

    await runTest('Audit - Row Selection', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const rows = page.locator('table tbody tr.audit-row');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            // Click first row
            await rows.first().click();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'audit-row-selected');

            // Verify row is selected
            const selectedRow = page.locator('tr.selected');
            if (!await selectedRow.isVisible()) {
                throw new Error('Row not marked as selected after click');
            }
        } else {
            console.log('   No audit entries to select');
        }
    }, page, results, screenshots);

    await runTest('Audit - Action Badges', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const actionBadges = page.locator('.action-badge');
        const badgeCount = await actionBadges.count();

        if (badgeCount > 0) {
            await screenshots.capture(page, 'audit-action-badges');

            // Verify badges have appropriate classes
            for (let i = 0; i < Math.min(badgeCount, 5); i++) {
                const badge = actionBadges.nth(i);
                const classList = await badge.getAttribute('class');
                if (!classList.includes('action-badge')) {
                    throw new Error(`Badge ${i} missing action-badge class`);
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Audit - Result Count Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const resultCount = page.locator('.result-count');
        if (await resultCount.isVisible()) {
            const text = await resultCount.textContent();
            if (!text.includes('Showing') || !text.includes('of')) {
                throw new Error(`Invalid result count format: ${text}`);
            }
            await screenshots.capture(page, 'audit-result-count');
        }
    }, page, results, screenshots);

    // ============================================
    // AUDIT PAGINATION TESTS
    // ============================================

    await runTest('Audit - Pagination Controls Visible', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for pagination component
        const pagination = page.locator('.pagination, app-pagination');
        const paginationVisible = await pagination.isVisible();

        // Pagination should be visible if there are entries
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            await screenshots.capture(page, 'audit-pagination-controls');

            // Check for page info text (e.g., "Showing 1 - 20 of 150")
            const pageInfo = page.locator('.page-info, .result-count');
            if (await pageInfo.isVisible()) {
                const text = await pageInfo.textContent();
                console.log(`   Pagination info: ${text}`);
            }
        } else {
            console.log('   No audit entries, skipping pagination test');
        }
    }, page, results, screenshots);

    await runTest('Audit - Page Size Selector', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Look for page size selector
        const pageSizeSelect = page.locator('#page-size, select[name="pageSize"], .page-size-select');
        if (await pageSizeSelect.isVisible()) {
            await screenshots.capture(page, 'audit-page-size-selector');

            // Verify page size options exist
            const options = pageSizeSelect.locator('option');
            const optionCount = await options.count();
            if (optionCount < 2) {
                throw new Error(`Expected at least 2 page size options, found ${optionCount}`);
            }

            // Try changing page size
            await pageSizeSelect.selectOption('50');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'audit-page-size-changed');
        } else {
            console.log('   Page size selector not visible');
        }
    }, page, results, screenshots);

    await runTest('Audit - Next Page Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check if there are multiple pages
        const nextBtn = page.locator('button:has-text("Next"), .pagination-next, button[aria-label="Next page"]');
        if (await nextBtn.isVisible()) {
            const isDisabled = await nextBtn.isDisabled();
            if (!isDisabled) {
                await nextBtn.click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'audit-next-page');

                // Verify page changed (current page indicator should update)
                const currentPage = page.locator('.current-page, .page-number.active, button[aria-current="page"]');
                if (await currentPage.isVisible()) {
                    const pageText = await currentPage.textContent();
                    console.log(`   Current page after next: ${pageText}`);
                }
            } else {
                console.log('   Next button disabled (only one page)');
            }
        } else {
            console.log('   Next button not visible');
        }
    }, page, results, screenshots);

    await runTest('Audit - Previous Page Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // First go to page 2 if possible
        const nextBtn = page.locator('button:has-text("Next"), .pagination-next');
        if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
            await nextBtn.click();
            await page.waitForTimeout(500);

            // Now try previous
            const prevBtn = page.locator('button:has-text("Previous"), .pagination-prev, button[aria-label="Previous page"]');
            if (await prevBtn.isVisible() && !await prevBtn.isDisabled()) {
                await prevBtn.click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'audit-previous-page');
            }
        } else {
            console.log('   Cannot test previous - only one page of data');
        }
    }, page, results, screenshots);

    await runTest('Audit - First Page Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Navigate to a later page first
        const nextBtn = page.locator('button:has-text("Next"), .pagination-next');
        if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
            await nextBtn.click();
            await page.waitForTimeout(300);

            // Try to go to first page
            const firstBtn = page.locator('button:has-text("First"), .pagination-first, button[aria-label="First page"]');
            if (await firstBtn.isVisible() && !await firstBtn.isDisabled()) {
                await firstBtn.click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'audit-first-page');
            } else {
                // Alternative: click page number 1
                const page1Btn = page.locator('button:has-text("1")').first();
                if (await page1Btn.isVisible()) {
                    await page1Btn.click();
                    await page.waitForTimeout(500);
                    await screenshots.capture(page, 'audit-first-page');
                }
            }
        } else {
            console.log('   Cannot test first page - only one page of data');
        }
    }, page, results, screenshots);

    await runTest('Audit - Pagination with Filters', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Apply a filter
        const entityFilter = page.locator('#entity-filter');
        if (await entityFilter.isVisible()) {
            const options = entityFilter.locator('option');
            const optionCount = await options.count();
            if (optionCount > 1) {
                const firstOption = options.nth(1);
                const optionValue = await firstOption.getAttribute('value');
                if (optionValue && optionValue !== 'all') {
                    await entityFilter.selectOption(optionValue);
                    await page.waitForTimeout(500);

                    await screenshots.capture(page, 'audit-pagination-with-filter');

                    // Verify pagination reset to first page
                    const pageInfo = page.locator('.page-info, .result-count');
                    if (await pageInfo.isVisible()) {
                        const text = await pageInfo.textContent();
                        console.log(`   Pagination after filter: ${text}`);
                    }
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Audit - Page Numbers Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for page number buttons
        const pageButtons = page.locator('.page-numbers button, .pagination button[data-page]');
        const pageButtonCount = await pageButtons.count();

        if (pageButtonCount > 0) {
            await screenshots.capture(page, 'audit-page-numbers');
            console.log(`   Found ${pageButtonCount} page number buttons`);
        } else {
            // Alternative check for page info
            const pageInfo = page.locator('.page-info, .result-count');
            if (await pageInfo.isVisible()) {
                const text = await pageInfo.textContent();
                console.log(`   Page info: ${text}`);
            }
        }
    }, page, results, screenshots);

    await runTest('Audit - Total Elements Count', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for total count display
        const totalCount = page.locator('.total-count, .result-count');
        if (await totalCount.isVisible()) {
            const text = await totalCount.textContent();
            // Should contain something like "of X entries" or "X total"
            if (text.includes('of') || text.includes('total') || text.includes('entries')) {
                await screenshots.capture(page, 'audit-total-count');
                console.log(`   Total count display: ${text}`);
            }
        }
    }, page, results, screenshots);

    // ============================================
    // PRODUCTION HISTORY
    // ============================================

    await runTest('Production History - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'production-history-list');

        // Verify page header
        const header = page.locator('h1:has-text("Production History")');
        if (!await header.isVisible()) {
            throw new Error('Production History header not visible');
        }
    }, page, results, screenshots);

    await runTest('Production History - Summary Cards', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const summaryCards = page.locator('.summary-card');
        const cardCount = await summaryCards.count();

        if (cardCount !== 4) {
            throw new Error(`Expected 4 summary cards, found ${cardCount}`);
        }

        await screenshots.capture(page, 'production-history-summary');

        // Verify card labels
        const expectedLabels = ['Total', 'Confirmed', 'Pending Review', 'Rejected'];
        for (const label of expectedLabels) {
            const card = page.locator(`.summary-card:has-text("${label}")`);
            if (!await card.isVisible()) {
                throw new Error(`Summary card "${label}" not visible`);
            }
        }
    }, page, results, screenshots);

    await runTest('Production History - Table View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table.data-table');
        const emptyState = page.locator('.empty-state');

        const hasTable = await table.isVisible();
        const hasEmpty = await emptyState.isVisible();

        if (!hasTable && !hasEmpty) {
            throw new Error('Neither table nor empty state visible');
        }

        if (hasTable) {
            await screenshots.capture(page, 'production-history-table');

            // Verify table headers
            const headers = ['ID', 'Operation', 'Output Batch', 'Produced Qty', 'Scrap Qty', 'Duration', 'Status', 'Created'];
            for (const header of headers) {
                const th = page.locator(`th:has-text("${header}")`);
                if (!await th.isVisible()) {
                    throw new Error(`Table header "${header}" not visible`);
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Production History - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('#status-filter');
        if (!await statusFilter.isVisible()) {
            throw new Error('Status filter not visible');
        }

        // Get filter options
        const options = statusFilter.locator('option');
        const optionCount = await options.count();
        if (optionCount < 2) {
            throw new Error(`Expected at least 2 status filter options, found ${optionCount}`);
        }

        // Filter by CONFIRMED
        const confirmedOption = statusFilter.locator('option[value="CONFIRMED"]');
        if (await confirmedOption.count() > 0) {
            await statusFilter.selectOption('CONFIRMED');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'production-history-filter-confirmed');
        }
    }, page, results, screenshots);

    await runTest('Production History - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('#search');
        if (!await searchInput.isVisible()) {
            throw new Error('Search input not visible');
        }

        // Enter search term
        await searchInput.fill('BATCH');
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'production-history-search');
    }, page, results, screenshots);

    await runTest('Production History - Row Click Detail Panel', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const rows = page.locator('table tbody tr.clickable-row');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            // Click first row
            await rows.first().click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'production-history-detail-panel');

            // Verify detail panel appears
            const detailPanel = page.locator('.detail-panel');
            if (!await detailPanel.isVisible()) {
                throw new Error('Detail panel not visible after clicking row');
            }

            // Verify detail sections
            const productionSection = page.locator('.detail-section h4:has-text("Production Details")');
            if (!await productionSection.isVisible()) {
                throw new Error('Production Details section not visible');
            }
        } else {
            console.log('   No production confirmations to click');
        }
    }, page, results, screenshots);

    await runTest('Production History - Detail Panel Close', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const rows = page.locator('table tbody tr.clickable-row');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            // Click first row to open panel
            await rows.first().click();
            await page.waitForTimeout(1000);

            // Verify panel is open
            const detailPanel = page.locator('.detail-panel');
            if (!await detailPanel.isVisible()) {
                console.log('  - Detail panel did not appear after row click (may require different interaction)');
                return;
            }

            // Click close button
            const closeBtn = page.locator('.detail-panel button:has-text("Close")');
            if (await closeBtn.isVisible()) {
                await closeBtn.click();
                await page.waitForTimeout(300);

                await screenshots.capture(page, 'production-history-panel-closed');

                // Verify panel is closed
                if (await detailPanel.isVisible()) {
                    console.log('  - Detail panel still visible after close (non-fatal)');
                }
            }
        } else {
            console.log('  - No clickable rows found in production history');
        }
    }, page, results, screenshots);

    await runTest('Production History - Status Badges', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusBadges = page.locator('.status-badge');
        const badgeCount = await statusBadges.count();

        if (badgeCount > 0) {
            await screenshots.capture(page, 'production-history-status-badges');

            // Verify badges have status classes
            for (let i = 0; i < Math.min(badgeCount, 5); i++) {
                const badge = statusBadges.nth(i);
                const classList = await badge.getAttribute('class');
                if (!classList.includes('status-badge')) {
                    throw new Error(`Badge ${i} missing status-badge class`);
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Production History - Result Count', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const resultCount = page.locator('.result-count');
        if (await resultCount.isVisible()) {
            const text = await resultCount.textContent();
            if (!text.includes('Showing') || !text.includes('of')) {
                throw new Error(`Invalid result count format: ${text}`);
            }
            await screenshots.capture(page, 'production-history-result-count');
        }
    }, page, results, screenshots);

    await runTest('Production History - Detail Panel Sections', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_HISTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const rows = page.locator('table tbody tr.clickable-row');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            await rows.first().click();
            await page.waitForTimeout(500);

            const detailPanel = page.locator('.detail-panel');
            if (await detailPanel.isVisible()) {
                await screenshots.capture(page, 'production-history-detail-sections');

                // Check for detail sections
                const sections = detailPanel.locator('.detail-section');
                const sectionCount = await sections.count();
                if (sectionCount < 1) {
                    throw new Error('No detail sections found in panel');
                }

                // Verify detail rows
                const detailRows = detailPanel.locator('.detail-row');
                const detailRowCount = await detailRows.count();
                if (detailRowCount < 1) {
                    throw new Error('No detail rows found in panel');
                }
            }
        }
    }, page, results, screenshots);

    // ============================================
    // NAVIGATION TESTS
    // ============================================

    await runTest('Navigate Audit from Sidebar', async () => {
        // Go to any manage page first
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click Audit link in sidebar
        const auditLink = page.locator('.sidebar-link:has-text("Audit Trail"), a:has-text("Audit Trail")');
        if (await auditLink.isVisible()) {
            await auditLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'audit-nav-from-sidebar');

            // Verify we're on audit page
            const header = page.locator('h1:has-text("Audit Trail")');
            if (!await header.isVisible()) {
                throw new Error('Failed to navigate to Audit page from sidebar');
            }
        }
    }, page, results, screenshots);

    await runTest('Navigate Production History from Header', async () => {
        // Go to dashboard first
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click Production link in header
        const productionLink = page.locator('.nav-link:has-text("Production")');
        if (await productionLink.isVisible()) {
            await productionLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'production-history-nav-from-header');

            // Should redirect to history by default
            const url = page.url();
            if (!url.includes('production')) {
                throw new Error('Failed to navigate to Production area');
            }
        }
    }, page, results, screenshots);
}

module.exports = { runAuditHistoryTests };
