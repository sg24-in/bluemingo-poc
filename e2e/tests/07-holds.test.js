/**
 * Holds Tests
 * Tests active holds list, apply hold, and release hold
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runHoldsTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 HOLDS TESTS');
    console.log('─'.repeat(50));

    // Test 1: Holds list view
    await runTest('Holds - Active Holds List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'holds-list-view');
    }, page, results, screenshots);

    // Test 2: Apply hold modal
    await runTest('Holds - Apply Hold Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'holds-before-apply');

        const applyHoldBtn = page.locator('button:has-text("Apply Hold"), button:has-text("New Hold"), .btn-apply-hold');
        if (await applyHoldBtn.count() > 0) {
            await applyHoldBtn.first().click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'holds-apply-modal-open');

            // Fill the form
            const entityTypeSelect = page.locator('select[name="entityType"], select#entityType');
            if (await entityTypeSelect.count() > 0) {
                await entityTypeSelect.selectOption({ index: 1 }).catch(() => {});
            }

            const entityIdInput = page.locator('input[name="entityId"], input#entityId, select[name="entityId"]');
            if (await entityIdInput.count() > 0) {
                if (await entityIdInput.evaluate(el => el.tagName.toLowerCase()) === 'select') {
                    await entityIdInput.selectOption({ index: 1 }).catch(() => {});
                } else {
                    await entityIdInput.fill('1');
                }
            }

            const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], select[name="reason"]');
            if (await reasonInput.count() > 0) {
                if (await reasonInput.evaluate(el => el.tagName.toLowerCase()) === 'select') {
                    await reasonInput.selectOption({ index: 1 }).catch(() => {});
                } else {
                    await reasonInput.fill(TEST_DATA.reasons.hold);
                }
            }

            const commentsInput = page.locator('textarea[name="comments"], textarea#comments');
            if (await commentsInput.count() > 0) {
                await commentsInput.fill('E2E test hold application');
            }

            await screenshots.capture(page, 'holds-apply-modal-filled');

            if (submitActions) {
                const confirmBtn = page.locator('.modal button.btn-primary, .modal button:has-text("Apply"), .modal button:has-text("Submit")');
                if (await confirmBtn.count() > 0) {
                    await confirmBtn.click();
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'holds-apply-success');
                }
            } else {
                const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        }
    }, page, results, screenshots);

    // Test 3: Release hold modal
    await runTest('Holds - Release Hold Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'holds-before-release');

        const releaseBtn = page.locator('button:has-text("Release"), .btn-release');
        if (await releaseBtn.count() > 0) {
            await releaseBtn.first().click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'holds-release-modal-open');

            // Fill release comments
            const commentsInput = page.locator('textarea[name="releaseComments"], textarea#releaseComments, textarea');
            if (await commentsInput.count() > 0) {
                await commentsInput.first().fill('E2E test hold release');
            }

            await screenshots.capture(page, 'holds-release-modal-filled');

            if (submitActions) {
                const confirmBtn = page.locator('.modal button.btn-primary, .modal button:has-text("Release"), .modal button:has-text("Confirm")');
                if (await confirmBtn.count() > 0) {
                    await confirmBtn.click();
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'holds-release-success');
                }
            } else {
                const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        }
    }, page, results, screenshots);

    // Test 4: View hold details
    await runTest('Holds - View Hold Details', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rows = page.locator('table tbody tr');
        if (await rows.count() > 0) {
            // Check if rows are clickable for detail view
            const firstRow = rows.first();
            const viewBtn = firstRow.locator('button:has-text("View"), .btn-view');

            if (await viewBtn.count() > 0) {
                await viewBtn.click();
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'holds-detail-view');
            } else {
                await screenshots.capture(page, 'holds-list-with-details');
            }
        }
    }, page, results, screenshots);

    // Test 5: Filter by entity type
    await runTest('Holds - Filter by Entity Type', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const entityTypeFilter = page.locator('select[name="entityType"], select#entityType');
        if (await entityTypeFilter.count() > 0) {
            await screenshots.capture(page, 'holds-filter-before');

            await entityTypeFilter.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'holds-filter-after');
        }
    }, page, results, screenshots);
}

module.exports = { runHoldsTests };
