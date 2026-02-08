/**
 * Equipment Tests
 * Tests equipment list, maintenance, and hold operations
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runEquipmentTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 EQUIPMENT TESTS');
    console.log('─'.repeat(50));

    // Test 1: Equipment list view
    await runTest('Equipment - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'equipment-list-view');
    }, page, results, screenshots);

    // Test 2: Filter by status
    await runTest('Equipment - Filter by Status', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'equipment-filter-before');

        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('AVAILABLE').catch(() => {
                return statusFilter.selectOption({ index: 1 });
            });
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'equipment-filter-after');
    }, page, results, screenshots);

    // Test 3: Start maintenance modal
    await runTest('Equipment - Start Maintenance Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to available equipment
        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'equipment-maint-before');

        const maintBtn = page.locator('button:has-text("Maintenance"), button:has-text("Start Maintenance"), .btn-maintenance');
        if (await maintBtn.count() > 0) {
            await maintBtn.first().click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'equipment-maint-modal-open');

            // Fill reason
            const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], textarea');
            if (await reasonInput.count() > 0) {
                await reasonInput.first().fill(TEST_DATA.reasons.maintenance);
            }

            await screenshots.capture(page, 'equipment-maint-modal-filled');

            if (submitActions) {
                const confirmBtn = page.locator('.modal button.btn-primary, .modal button:has-text("Start"), .modal button:has-text("Confirm")');
                if (await confirmBtn.count() > 0) {
                    await confirmBtn.click();
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'equipment-maint-success');
                }
            } else {
                const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        }
    }, page, results, screenshots);

    // Test 4: End maintenance
    await runTest('Equipment - End Maintenance', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to maintenance equipment
        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('MAINTENANCE').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'equipment-end-maint-before');

        const endMaintBtn = page.locator('button:has-text("End Maintenance"), button:has-text("Complete"), .btn-end-maintenance');
        if (await endMaintBtn.count() > 0 && submitActions) {
            await endMaintBtn.first().click();
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'equipment-end-maint-success');
        }
    }, page, results, screenshots);

    // Test 5: Put on hold modal
    await runTest('Equipment - Put On Hold Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to available equipment
        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'equipment-hold-before');

        const holdBtn = page.locator('button:has-text("Hold"), button:has-text("Put on Hold"), .btn-hold');
        if (await holdBtn.count() > 0) {
            await holdBtn.first().click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'equipment-hold-modal-open');

            // Fill reason
            const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], textarea');
            if (await reasonInput.count() > 0) {
                await reasonInput.first().fill('Equipment safety check required');
            }

            await screenshots.capture(page, 'equipment-hold-modal-filled');

            if (submitActions) {
                const confirmBtn = page.locator('.modal button.btn-primary, .modal button:has-text("Apply"), .modal button:has-text("Hold")');
                if (await confirmBtn.count() > 0) {
                    await confirmBtn.click();
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'equipment-hold-success');
                }
            } else {
                const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        }
    }, page, results, screenshots);

    // Test 6: Release from hold
    await runTest('Equipment - Release from Hold', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Filter to on-hold equipment
        const statusFilter = page.locator('select[name="status"], select#status');
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('ON_HOLD').catch(() => {});
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'equipment-release-before');

        const releaseBtn = page.locator('button:has-text("Release"), .btn-release');
        if (await releaseBtn.count() > 0 && submitActions) {
            await releaseBtn.first().click();
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'equipment-release-success');
        }
    }, page, results, screenshots);

    // Test 7: View equipment by type
    await runTest('Equipment - Filter by Type', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const typeFilter = page.locator('select[name="type"], select#type');
        if (await typeFilter.count() > 0) {
            await screenshots.capture(page, 'equipment-type-filter-before');

            await typeFilter.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'equipment-type-filter-after');
        }
    }, page, results, screenshots);

    // Test 8: Filter by Category (GAP-021)
    await runTest('Equipment - Filter by Category', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'equipment-category-filter-before');

        // Find category filter dropdown - look for the 3rd select in filters section
        const categoryFilter = page.locator('.filters select').nth(2);
        if (await categoryFilter.count() > 0) {
            // Select MELTING category
            await categoryFilter.selectOption('MELTING').catch(() => {
                return categoryFilter.selectOption({ index: 1 });
            });
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'equipment-category-filter-melting');

            // Check that category badges are visible in the table
            const categoryBadges = page.locator('.category-badge');
            const badgeCount = await categoryBadges.count();
            console.log(`  Found ${badgeCount} category badges in filtered results`);

            // Reset filter to All Categories
            await categoryFilter.selectOption({ value: 'all' }).catch(() => {
                return categoryFilter.selectOption({ index: 0 });
            });
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'equipment-category-filter-all');
        } else {
            console.log('  Category filter not found - skipping');
        }
    }, page, results, screenshots);

    // Test 9: Category badges display correctly
    await runTest('Equipment - Category Badges Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check that the Category column header exists
        const categoryHeader = page.locator('th:has-text("Category")');
        const headerExists = await categoryHeader.count() > 0;
        console.log(`  Category column header exists: ${headerExists}`);

        // Check that category badges are rendered
        const categoryBadges = page.locator('.category-badge');
        const badgeCount = await categoryBadges.count();
        console.log(`  Total category badges: ${badgeCount}`);

        // Check for specific category classes
        const meltingBadges = page.locator('.category-melting');
        const castingBadges = page.locator('.category-casting');
        const rollingBadges = page.locator('.category-rolling');

        console.log(`  Melting: ${await meltingBadges.count()}, Casting: ${await castingBadges.count()}, Rolling: ${await rollingBadges.count()}`);

        await screenshots.capture(page, 'equipment-category-badges');
    }, page, results, screenshots);
}

module.exports = { runEquipmentTests };
