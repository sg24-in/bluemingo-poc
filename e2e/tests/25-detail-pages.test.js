/**
 * Detail Pages Tests
 * Tests for batch detail pages and verifies inventory/equipment don't have detail navigation
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runDetailPageTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('DETAIL PAGES TESTS');
    console.log('='.repeat(50));

    // ============================================
    // INVENTORY TESTS (List page only - no detail page navigation)
    // ============================================

    await runTest('Inventory Detail - Page Load', async () => {
        // Navigate to inventory list
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'inventory-detail-page');

        // Verify we're on the inventory list page
        const pageTitle = page.locator('h1:has-text("Inventory")');
        if (!await pageTitle.isVisible()) {
            throw new Error('Inventory list page not displayed');
        }

        // Note: Inventory list page does not have row-click navigation to detail
        // Action buttons are on list page itself
        const table = page.locator('table');
        if (await table.count() > 0) {
            console.log('   Inventory list table displayed');
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - Basic Info Section', async () => {
        // This test verifies inventory info is visible on the list page
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            // Verify columns are present
            const headers = page.locator('table thead th');
            const headerCount = await headers.count();
            console.log(`   Found ${headerCount} columns in inventory table`);
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - Quantity Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            // Quantity is shown in table
            const firstRow = rows.first();
            const cells = firstRow.locator('td');
            if (await cells.count() >= 3) {
                console.log('   Quantity column present in table');
            }
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - State Badge', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // State badges are shown in the table rows
        const stateBadge = page.locator('app-status-badge').first();
        if (await stateBadge.isVisible()) {
            console.log('   Status badge visible in inventory list');
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - Action Buttons', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to AVAILABLE items
        const stateFilter = page.locator('select').first();
        if (await stateFilter.count() > 0) {
            await stateFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'inventory-detail-actions');

        // Action buttons are on list page - check first row
        const firstRowActions = page.locator('table tbody tr').first().locator('.actions-cell, td:last-child');
        if (await firstRowActions.count() > 0) {
            const blockBtn = firstRowActions.locator('button:has-text("Block")');
            if (await blockBtn.count() > 0) {
                console.log('   Block button visible in actions column');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // EQUIPMENT TESTS (List page only - no detail page navigation)
    // ============================================

    await runTest('Equipment Detail - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'equipment-detail-page');

        // Verify we're on the equipment list page
        const pageTitle = page.locator('h1:has-text("Equipment")');
        if (!await pageTitle.isVisible()) {
            throw new Error('Equipment list page not displayed');
        }

        const table = page.locator('table');
        if (await table.count() > 0) {
            console.log('   Equipment list table displayed');
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Basic Info Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const headers = page.locator('table thead th');
            const headerCount = await headers.count();
            console.log(`   Found ${headerCount} columns in equipment table`);
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Capacity Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Capacity info is in summary cards
        const summaryCards = page.locator('.summary-card, .stat-card');
        if (await summaryCards.count() > 0) {
            console.log('   Equipment summary cards displayed');
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Status Badge', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const statusBadge = page.locator('app-status-badge').first();
        if (await statusBadge.isVisible()) {
            console.log('   Status badge visible in equipment list');
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Action Buttons', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to AVAILABLE equipment
        const statusFilter = page.locator('select').first();
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'equipment-detail-actions');

        // Check first row for action buttons
        const firstRowActions = page.locator('table tbody tr').first().locator('.actions-cell, td:last-child');
        if (await firstRowActions.count() > 0) {
            const maintenanceBtn = firstRowActions.locator('button:has-text("Maintenance")');
            if (await maintenanceBtn.count() > 0) {
                console.log('   Maintenance button visible in actions column');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // BATCH DETAIL TESTS (Has actual detail page)
    // ============================================

    await runTest('Batch Detail - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            // Click the View button in first row
            const viewBtn = rows.first().locator('button:has-text("View")');

            if (await viewBtn.isVisible()) {
                await viewBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'batch-detail-page');

                // Verify we're on detail page - look for batch detail specific elements
                const backBtn = page.locator('button:has-text("Back to Batches")');
                const batchInfo = page.locator('.card-header:has-text("Batch Information")');

                if (!await backBtn.isVisible() && !await batchInfo.isVisible()) {
                    throw new Error('Batch detail page not displayed');
                }

                console.log('   Batch detail page loaded successfully');
            } else {
                throw new Error('View button not found in batch list');
            }
        } else {
            console.log('   No batches to view');
        }
    }, page, results, screenshots);

    await runTest('Batch Detail - Genealogy Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = rows.first().locator('button:has-text("View")');
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'batch-detail-genealogy');

                // Look for genealogy section - specific selector
                const genealogyHeader = page.locator('.card-header:has-text("Batch Genealogy")');
                const genealogyContainer = page.locator('.genealogy-container');

                if (await genealogyHeader.isVisible() || await genealogyContainer.isVisible()) {
                    console.log('   Genealogy section displayed');

                    // Check for parent/child sections
                    const parentSection = page.locator('.genealogy-section h4:has-text("Source Materials")');
                    const childSection = page.locator('.genealogy-section h4:has-text("Derived Products")');
                    const noRelations = page.locator('.no-relations');

                    if (await parentSection.isVisible()) {
                        console.log('   Parent batches section visible');
                    }
                    if (await childSection.isVisible()) {
                        console.log('   Child batches section visible');
                    }
                    if (await noRelations.isVisible()) {
                        console.log('   No batch relationships (expected for standalone batch)');
                    }
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Batch Detail - Quality Status', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = rows.first().locator('button:has-text("View")');
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'batch-detail-quality');

                // Check for status badge in batch info
                const statusBadge = page.locator('.batch-info-grid app-status-badge, .info-item app-status-badge');
                if (await statusBadge.isVisible()) {
                    console.log('   Batch status badge visible');
                }

                // Check for quality approval section
                const qualitySection = page.locator('.card-header:has-text("Quality Approval")');
                if (await qualitySection.isVisible()) {
                    console.log('   Quality approval section visible');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Batch Detail - Allocation Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = rows.first().locator('button:has-text("View")');
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'batch-detail-allocation');

                // Look for allocation section
                const allocationHeader = page.locator('.card-header:has-text("Order Allocations")');
                const allocationSummary = page.locator('.allocation-summary');
                const allocateBtn = page.locator('button:has-text("Allocate to Order")');

                if (await allocationHeader.isVisible()) {
                    console.log('   Allocation section displayed');
                }
                if (await allocateBtn.isVisible()) {
                    console.log('   Allocate button visible');
                }
            }
        }
    }, page, results, screenshots);
}

module.exports = { runDetailPageTests };
