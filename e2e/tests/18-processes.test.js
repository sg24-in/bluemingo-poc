/**
 * Processes Tests
 * Tests for process list, detail, and quality pending pages under /processes
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runProcessesTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('PROCESSES TESTS');
    console.log('='.repeat(50));

    // ============================================
    // PROCESS LIST
    // ============================================

    await runTest('Processes - List Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'processes-list');

        // Verify page is loaded
        const pageContent = page.locator('h1, h2, .page-header');
        if (!await pageContent.first().isVisible()) {
            throw new Error('Processes page content not visible');
        }
    }, page, results, screenshots);

    await runTest('Processes - Table or Cards View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        const cards = page.locator('.process-card, .card');
        const emptyState = page.locator('.empty-state, .no-data');

        const hasTable = await table.isVisible();
        const hasCards = await cards.first().isVisible();
        const hasEmpty = await emptyState.isVisible();

        if (!hasTable && !hasCards && !hasEmpty) {
            throw new Error('No process list/cards or empty state visible');
        }

        if (hasTable) {
            await screenshots.capture(page, 'processes-table');
        } else if (hasCards) {
            await screenshots.capture(page, 'processes-cards');
        }
    }, page, results, screenshots);

    await runTest('Processes - Status Summary', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for status summary cards or badges
        const summaryCards = page.locator('.summary-card, .stat-card, .status-summary');
        if (await summaryCards.first().isVisible()) {
            await screenshots.capture(page, 'processes-summary');
        } else {
            console.log('  - No summary cards found');
        }
    }, page, results, screenshots);

    await runTest('Processes - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"], select#statusFilter');
        if (await statusFilter.isVisible()) {
            // Get available options
            const options = await statusFilter.locator('option').allTextContents();
            console.log('  - Available statuses:', options.join(', '));

            // Try filtering
            if (options.length > 1) {
                await statusFilter.selectOption({ index: 1 });
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-filtered');
            }
        } else {
            console.log('  - No status filter dropdown found');
        }
    }, page, results, screenshots);

    await runTest('Processes - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input#search');
        if (await searchInput.isVisible()) {
            await searchInput.fill('Melting');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'processes-search');
        } else {
            console.log('  - No search input found');
        }
    }, page, results, screenshots);

    // ============================================
    // PROCESS DETAIL
    // ============================================

    await runTest('Processes - Detail View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try clicking on a process to view details
        const tableRow = page.locator('table tbody tr').first();
        const card = page.locator('.process-card, .card').first();

        if (await tableRow.isVisible()) {
            const viewLink = tableRow.locator('a').first();
            if (await viewLink.isVisible()) {
                await viewLink.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-detail');
            }
        } else if (await card.isVisible()) {
            await card.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'processes-detail');
        } else {
            console.log('  - No processes to view');
        }
    }, page, results, screenshots);

    // ============================================
    // QUALITY PENDING
    // ============================================

    await runTest('Quality Pending - Page Load', async () => {
        // Try quality pending route
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'quality-pending-list');

        // Verify quality pending content
        const header = page.locator('h1, h2').filter({ hasText: /quality|pending/i });
        if (await header.isVisible()) {
            console.log('  - Quality pending page loaded');
        }
    }, page, results, screenshots);

    await runTest('Quality Pending - Table View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        const emptyState = page.locator('.empty-state, .no-data');

        if (await table.isVisible()) {
            await screenshots.capture(page, 'quality-pending-table');

            // Check for quality decision buttons
            const approveButton = page.locator('button:has-text("Approve")').first();
            const rejectButton = page.locator('button:has-text("Reject")').first();

            if (await approveButton.isVisible() || await rejectButton.isVisible()) {
                console.log('  - Quality decision buttons found');
            }
        } else if (await emptyState.isVisible()) {
            await screenshots.capture(page, 'quality-pending-empty');
            console.log('  - No pending quality items');
        }
    }, page, results, screenshots);

    await runTest('Quality Pending - Decision Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to open decision modal
        const actionButton = page.locator('button:has-text("Approve"), button:has-text("Decide"), button.btn-decision').first();
        if (await actionButton.isVisible()) {
            await actionButton.click();
            await page.waitForTimeout(500);

            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                await screenshots.capture(page, 'quality-decision-modal');

                // Close modal
                const closeButton = modal.locator('button:has-text("Cancel"), button.close');
                if (await closeButton.isVisible()) {
                    await closeButton.click();
                    await page.waitForTimeout(300);
                }
            }
        } else {
            console.log('  - No action buttons available');
        }
    }, page, results, screenshots);

    // ============================================
    // FILTER BY STATUS
    // ============================================

    await runTest('Processes - Filter QUALITY_PENDING', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            try {
                await statusFilter.selectOption('QUALITY_PENDING');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-quality-pending');
            } catch (e) {
                console.log('  - QUALITY_PENDING option not available');
            }
        }
    }, page, results, screenshots);

    await runTest('Processes - Filter COMPLETED', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            try {
                await statusFilter.selectOption('COMPLETED');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-completed');
            } catch (e) {
                console.log('  - COMPLETED option not available');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // QUALITY DECISIONS (with --submit flag)
    // ============================================

    if (submitActions) {
        await runTest('Quality - Approve Process (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const approveButton = page.locator('button:has-text("Approve")').first();
            if (await approveButton.isVisible()) {
                await approveButton.click();
                await page.waitForTimeout(500);

                const modal = page.locator('.modal, [role="dialog"]');
                if (await modal.isVisible()) {
                    // Fill any required fields
                    const notesInput = modal.locator('textarea, input[name="notes"]');
                    if (await notesInput.isVisible()) {
                        await notesInput.fill('Approved via E2E test');
                    }

                    await screenshots.capture(page, 'quality-approve-modal');

                    // Confirm
                    const confirmButton = modal.locator('button:has-text("Approve"), button:has-text("Confirm")');
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'quality-approve-success');
                    }
                }
            } else {
                console.log('  - No processes available to approve');
            }
        }, page, results, screenshots);

        await runTest('Quality - Reject Process (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const rejectButton = page.locator('button:has-text("Reject")').first();
            if (await rejectButton.isVisible()) {
                await rejectButton.click();
                await page.waitForTimeout(500);

                const modal = page.locator('.modal, [role="dialog"]');
                if (await modal.isVisible()) {
                    // Fill rejection reason
                    const reasonInput = modal.locator('textarea, input[name="reason"]');
                    if (await reasonInput.isVisible()) {
                        await reasonInput.fill('Rejected via E2E test - quality issue');
                    }

                    await screenshots.capture(page, 'quality-reject-modal');

                    // Confirm
                    const confirmButton = modal.locator('button:has-text("Reject"), button:has-text("Confirm")');
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'quality-reject-success');
                    }
                }
            } else {
                console.log('  - No processes available to reject');
            }
        }, page, results, screenshots);
    }

    console.log('\n' + '='.repeat(50));
    console.log('PROCESSES TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runProcessesTests };
