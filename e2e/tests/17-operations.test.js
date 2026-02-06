/**
 * Operations Tests
 * Tests for operation list, detail, and block/unblock functionality under /operations
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runOperationsTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('OPERATIONS TESTS');
    console.log('='.repeat(50));

    // ============================================
    // OPERATION LIST
    // ============================================

    await runTest('Operations - List Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'operations-list');

        // Verify page header
        const header = page.locator('h1, h2').filter({ hasText: /operations/i });
        if (!await header.isVisible()) {
            throw new Error('Operations page header not visible');
        }
    }, page, results, screenshots);

    await runTest('Operations - Table View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        const emptyState = page.locator('.empty-state, .no-data');

        // Either table or empty state should be visible
        const hasTable = await table.isVisible();
        const hasEmpty = await emptyState.isVisible();

        if (!hasTable && !hasEmpty) {
            throw new Error('Neither table nor empty state visible');
        }

        if (hasTable) {
            await screenshots.capture(page, 'operations-table');

            // Verify expected columns
            const headers = page.locator('table thead th');
            const headerCount = await headers.count();
            if (headerCount < 3) {
                throw new Error(`Expected at least 3 table columns, found ${headerCount}`);
            }
        }
    }, page, results, screenshots);

    await runTest('Operations - Status Summary Cards', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for status summary cards
        const summaryCards = page.locator('.summary-card, .stat-card, .status-card');
        if (await summaryCards.first().isVisible()) {
            await screenshots.capture(page, 'operations-summary');
        } else {
            console.log('  - No summary cards found');
        }
    }, page, results, screenshots);

    await runTest('Operations - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"], select#statusFilter');
        if (await statusFilter.isVisible()) {
            // Try filtering by a status
            await statusFilter.selectOption({ index: 1 });
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'operations-filtered');
        } else {
            // Try clicking status chips/buttons
            const statusChip = page.locator('.status-chip, .filter-chip').first();
            if (await statusChip.isVisible()) {
                await statusChip.click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'operations-filtered');
            } else {
                console.log('  - No status filter controls found');
            }
        }
    }, page, results, screenshots);

    await runTest('Operations - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input#search');
        if (await searchInput.isVisible()) {
            await searchInput.fill('Melting');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'operations-search');
        } else {
            console.log('  - No search input found');
        }
    }, page, results, screenshots);

    // ============================================
    // OPERATION DETAIL
    // ============================================

    await runTest('Operations - Row Click Detail', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const tableRow = page.locator('table tbody tr').first();
        if (await tableRow.isVisible()) {
            // Try clicking the row or finding a detail link
            const detailLink = tableRow.locator('a').first();
            if (await detailLink.isVisible()) {
                await detailLink.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'operations-detail');
            } else {
                // Try clicking the row itself
                await tableRow.click();
                await page.waitForTimeout(500);

                // Check if a detail panel appeared
                const detailPanel = page.locator('.detail-panel, .operation-detail, .side-panel');
                if (await detailPanel.isVisible()) {
                    await screenshots.capture(page, 'operations-detail-panel');
                } else {
                    console.log('  - No detail view triggered by row click');
                }
            }
        } else {
            console.log('  - No operations in table');
        }
    }, page, results, screenshots);

    // ============================================
    // BLOCK/UNBLOCK MODAL
    // ============================================

    await runTest('Operations - Block Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Find block button
        const blockButton = page.locator('button:has-text("Block"), button.btn-block').first();
        if (await blockButton.isVisible() && !await blockButton.isDisabled()) {
            await blockButton.click();
            await page.waitForTimeout(500);

            // Check for modal
            const modal = page.locator('.modal, .dialog, [role="dialog"]');
            if (await modal.isVisible()) {
                await screenshots.capture(page, 'operations-block-modal');

                // Check modal content
                const reasonInput = modal.locator('input, textarea, select').first();
                if (await reasonInput.isVisible()) {
                    console.log('  - Block modal has reason input');
                }

                // Close modal
                const closeButton = modal.locator('button:has-text("Cancel"), button.close, .btn-close');
                if (await closeButton.isVisible()) {
                    await closeButton.click();
                    await page.waitForTimeout(300);
                }
            } else {
                console.log('  - Block modal did not appear');
            }
        } else {
            console.log('  - Block button not available (operations may already be blocked or none available)');
        }
    }, page, results, screenshots);

    await runTest('Operations - Unblock Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Find unblock button (usually on blocked operations)
        const unblockButton = page.locator('button:has-text("Unblock"), button.btn-unblock').first();
        if (await unblockButton.isVisible()) {
            await screenshots.capture(page, 'operations-unblock-available');
        } else {
            console.log('  - No unblock button visible (no blocked operations)');
        }
    }, page, results, screenshots);

    // ============================================
    // STATUS FILTERING
    // ============================================

    await runTest('Operations - Filter by READY', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            try {
                await statusFilter.selectOption('READY');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'operations-filter-ready');
            } catch (e) {
                console.log('  - READY option not available');
            }
        }
    }, page, results, screenshots);

    await runTest('Operations - Filter by IN_PROGRESS', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            try {
                await statusFilter.selectOption('IN_PROGRESS');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'operations-filter-in-progress');
            } catch (e) {
                console.log('  - IN_PROGRESS option not available');
            }
        }
    }, page, results, screenshots);

    await runTest('Operations - Filter by CONFIRMED', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            try {
                await statusFilter.selectOption('CONFIRMED');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'operations-filter-confirmed');
            } catch (e) {
                console.log('  - CONFIRMED option not available');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // BLOCK/UNBLOCK ACTIONS (with --submit flag)
    // ============================================

    if (submitActions) {
        await runTest('Operations - Block Operation (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Find a READY operation to block
            const blockButton = page.locator('table tbody tr').filter({ hasText: 'READY' }).locator('button:has-text("Block")').first();
            if (await blockButton.isVisible()) {
                await blockButton.click();
                await page.waitForTimeout(500);

                const modal = page.locator('.modal, [role="dialog"]');
                if (await modal.isVisible()) {
                    // Fill reason
                    const reasonInput = modal.locator('input, textarea').first();
                    if (await reasonInput.isVisible()) {
                        await reasonInput.fill('E2E Test Block Reason');
                    }

                    await screenshots.capture(page, 'operations-block-filled');

                    // Confirm block
                    const confirmButton = modal.locator('button:has-text("Block"), button:has-text("Confirm")');
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'operations-block-success');
                    }
                }
            } else {
                console.log('  - No READY operations to block');
            }
        }, page, results, screenshots);

        await runTest('Operations - Unblock Operation (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATIONS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Find a BLOCKED operation to unblock
            const unblockButton = page.locator('table tbody tr').filter({ hasText: 'BLOCKED' }).locator('button:has-text("Unblock")').first();
            if (await unblockButton.isVisible()) {
                await unblockButton.click();
                await page.waitForTimeout(500);

                const modal = page.locator('.modal, [role="dialog"]');
                if (await modal.isVisible()) {
                    await screenshots.capture(page, 'operations-unblock-modal');

                    // Confirm unblock
                    const confirmButton = modal.locator('button:has-text("Unblock"), button:has-text("Confirm")');
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'operations-unblock-success');
                    }
                } else {
                    // Direct unblock without modal
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(500);
                    await screenshots.capture(page, 'operations-unblock-success');
                }
            } else {
                console.log('  - No BLOCKED operations to unblock');
            }
        }, page, results, screenshots);
    }

    console.log('\n' + '='.repeat(50));
    console.log('OPERATIONS TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runOperationsTests };
