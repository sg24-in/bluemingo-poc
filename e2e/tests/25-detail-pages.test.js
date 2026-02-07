/**
 * Detail Pages Tests
 * Tests for inventory detail, equipment detail, and batch detail pages
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runDetailPageTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('DETAIL PAGES TESTS');
    console.log('='.repeat(50));

    // ============================================
    // INVENTORY DETAIL TESTS
    // ============================================

    await runTest('Inventory Detail - Page Load', async () => {
        // First go to inventory list
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Click on first inventory row to go to detail
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            // Click on the first row or its view button
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View"), .btn-view').first();
            const clickableRow = rows.first().locator('td').first();

            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await clickableRow.click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'inventory-detail-page');

            // Verify we're on detail page
            const detailHeader = page.locator('h1:has-text("Inventory Detail"), h1:has-text("Inventory Details")');
            const detailCard = page.locator('.detail-card, .detail-container');

            if (!await detailHeader.isVisible() && !await detailCard.isVisible()) {
                throw new Error('Inventory detail page not displayed');
            }
        } else {
            console.log('   No inventory items to view');
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - Basic Info Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            const clickableRow = rows.first().locator('td').first();

            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await clickableRow.click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify basic info section
            const basicInfoSection = page.locator('.detail-section h3:has-text("Basic Information")');
            if (await basicInfoSection.isVisible()) {
                await screenshots.capture(page, 'inventory-detail-basic-info');

                // Verify key fields are present
                const inventoryId = page.locator('.detail-row:has-text("Inventory ID")');
                const materialId = page.locator('.detail-row:has-text("Material ID")');
                const type = page.locator('.detail-row:has-text("Type")');

                if (!await inventoryId.isVisible()) {
                    throw new Error('Inventory ID not visible in detail');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - Quantity Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify quantity section
            const quantitySection = page.locator('.detail-section h3:has-text("Quantity")');
            const quantityDisplay = page.locator('.quantity-display, .qty-value');

            if (await quantitySection.isVisible() || await quantityDisplay.isVisible()) {
                await screenshots.capture(page, 'inventory-detail-quantity');
            }
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - State Badge', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify state badge
            const stateBadge = page.locator('.state-badge, .status-badge');
            if (await stateBadge.isVisible()) {
                await screenshots.capture(page, 'inventory-detail-state-badge');

                const badgeText = await stateBadge.textContent();
                const validStates = ['AVAILABLE', 'BLOCKED', 'RESERVED', 'CONSUMED', 'SCRAPPED', 'ON_HOLD'];
                const hasValidState = validStates.some(s => badgeText.includes(s));

                if (!hasValidState) {
                    throw new Error(`Invalid state badge: ${badgeText}`);
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - Action Buttons', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to AVAILABLE items
        const stateFilter = page.locator('select[name="state"], select#state');
        if (await stateFilter.count() > 0) {
            await stateFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify action buttons
            const editBtn = page.locator('button:has-text("Edit")');
            const blockBtn = page.locator('button:has-text("Block")');
            const scrapBtn = page.locator('button:has-text("Scrap")');

            await screenshots.capture(page, 'inventory-detail-actions');

            // For AVAILABLE state, should see Block and Scrap buttons
            if (await blockBtn.isVisible()) {
                console.log('   Block button visible');
            }
            if (await scrapBtn.isVisible()) {
                console.log('   Scrap button visible');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // EQUIPMENT DETAIL TESTS
    // ============================================

    await runTest('Equipment Detail - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View"), .btn-view').first();
            const clickableRow = rows.first().locator('td').first();

            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await clickableRow.click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'equipment-detail-page');

            // Verify we're on detail page
            const detailHeader = page.locator('h1:has-text("Equipment Detail"), h1:has-text("Equipment Details")');
            const detailCard = page.locator('.detail-card, .detail-container');

            if (!await detailHeader.isVisible() && !await detailCard.isVisible()) {
                throw new Error('Equipment detail page not displayed');
            }
        } else {
            console.log('   No equipment items to view');
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Basic Info Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify basic info section
            const basicInfoSection = page.locator('.detail-section h3:has-text("Basic Information")');
            if (await basicInfoSection.isVisible()) {
                await screenshots.capture(page, 'equipment-detail-basic-info');

                // Verify key fields
                const equipmentId = page.locator('.detail-row:has-text("Equipment ID")');
                const equipmentCode = page.locator('.detail-row:has-text("Equipment Code")');

                if (!await equipmentId.isVisible() && !await equipmentCode.isVisible()) {
                    throw new Error('Equipment identification not visible');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Capacity Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify capacity section
            const capacitySection = page.locator('.detail-section h3:has-text("Capacity")');
            const capacityRow = page.locator('.detail-row:has-text("Capacity")');

            if (await capacitySection.isVisible() || await capacityRow.isVisible()) {
                await screenshots.capture(page, 'equipment-detail-capacity');
            }
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Status Badge', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify status badge
            const statusBadge = page.locator('.status-badge');
            if (await statusBadge.isVisible()) {
                await screenshots.capture(page, 'equipment-detail-status-badge');

                const badgeText = await statusBadge.textContent();
                const validStatuses = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'ON_HOLD'];
                const hasValidStatus = validStatuses.some(s => badgeText.includes(s));

                if (!hasValidStatus) {
                    throw new Error(`Invalid status badge: ${badgeText}`);
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Action Buttons', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to AVAILABLE equipment
        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify action buttons
            const editBtn = page.locator('button:has-text("Edit")');
            const maintenanceBtn = page.locator('button:has-text("Start Maintenance"), button:has-text("Maintenance")');
            const holdBtn = page.locator('button:has-text("Put on Hold"), button:has-text("Hold")');

            await screenshots.capture(page, 'equipment-detail-actions');

            // For AVAILABLE status, should see maintenance and hold buttons
            if (await maintenanceBtn.isVisible()) {
                console.log('   Maintenance button visible');
            }
            if (await holdBtn.isVisible()) {
                console.log('   Hold button visible');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // BATCH DETAIL TESTS
    // ============================================

    await runTest('Batch Detail - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();

        if (rowCount > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View"), .btn-view').first();
            const clickableRow = rows.first().locator('td').first();

            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await clickableRow.click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'batch-detail-page');

            // Verify we're on detail page
            const detailHeader = page.locator('h1:has-text("Batch Detail"), h1:has-text("Batch Details")');
            const detailCard = page.locator('.detail-card, .detail-container');

            if (!await detailHeader.isVisible() && !await detailCard.isVisible()) {
                throw new Error('Batch detail page not displayed');
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
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Look for genealogy section or tab
            const genealogySection = page.locator('.genealogy, h3:has-text("Genealogy"), h4:has-text("Genealogy"), .tab:has-text("Genealogy")');
            const genealogyTab = page.locator('button:has-text("Genealogy"), .nav-link:has-text("Genealogy")');

            if (await genealogyTab.isVisible()) {
                await genealogyTab.click();
                await page.waitForTimeout(500);
            }

            await screenshots.capture(page, 'batch-detail-genealogy');

            // Verify genealogy elements
            const parentBatches = page.locator('.parent-batches, :has-text("Parent")');
            const childBatches = page.locator('.child-batches, :has-text("Child")');

            if (await parentBatches.isVisible() || await childBatches.isVisible()) {
                console.log('   Genealogy information displayed');
            }
        }
    }, page, results, screenshots);

    await runTest('Batch Detail - Quality Status', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify quality status elements
            const statusBadge = page.locator('.status-badge');
            const qualitySection = page.locator('.quality-status, h3:has-text("Quality")');
            const approveBtn = page.locator('button:has-text("Approve")');
            const rejectBtn = page.locator('button:has-text("Reject")');

            await screenshots.capture(page, 'batch-detail-quality');

            if (await statusBadge.isVisible()) {
                const statusText = await statusBadge.textContent();
                console.log(`   Batch status: ${statusText}`);
            }
        }
    }, page, results, screenshots);

    await runTest('Batch Detail - Allocation Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await rows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Look for allocation section
            const allocationSection = page.locator('.allocation, h3:has-text("Allocation"), h4:has-text("Order Allocation")');
            const allocationTab = page.locator('button:has-text("Allocation"), .nav-link:has-text("Allocation")');

            if (await allocationTab.isVisible()) {
                await allocationTab.click();
                await page.waitForTimeout(500);
            }

            await screenshots.capture(page, 'batch-detail-allocation');

            // Verify allocation elements
            const allocateBtn = page.locator('button:has-text("Allocate")');
            const allocationTable = page.locator('.allocation-table, table:has-text("Order")');

            if (await allocateBtn.isVisible()) {
                console.log('   Allocate button visible');
            }
        }
    }, page, results, screenshots);
}

module.exports = { runDetailPageTests };
