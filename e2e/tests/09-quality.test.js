/**
 * Quality Inspection Tests
 * Tests quality pending list, accept, and reject operations
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runQualityTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 QUALITY INSPECTION TESTS');
    console.log('─'.repeat(50));

    // Test 1: Quality pending list
    await runTest('Quality - Pending Inspections List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'quality-pending-list');
    }, page, results, screenshots);

    // Test 2: View pending tab
    await runTest('Quality - Pending Tab', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const pendingTab = page.locator('button:has-text("Pending"), .tab:has-text("Pending"), a:has-text("Pending")');
        if (await pendingTab.count() > 0) {
            await pendingTab.first().click();
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'quality-pending-tab');
    }, page, results, screenshots);

    // Test 3: Accept process
    await runTest('Quality - Accept Process', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'quality-accept-before');

        const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Approve"), .btn-accept');
        if (await acceptBtn.count() > 0) {
            if (submitActions) {
                await acceptBtn.first().click();
                await page.waitForTimeout(500);

                // Check for confirmation modal
                const modal = page.locator('.modal');
                if (await modal.isVisible()) {
                    await screenshots.capture(page, 'quality-accept-modal');

                    const confirmBtn = page.locator('.modal button.btn-primary, .modal button:has-text("Confirm")');
                    if (await confirmBtn.count() > 0) {
                        await confirmBtn.click();
                        await page.waitForTimeout(1000);
                    }
                }

                await screenshots.capture(page, 'quality-accept-success');
            } else {
                await screenshots.capture(page, 'quality-accept-button-available');
            }
        } else {
            console.log('   ⏭️  No pending inspections to accept');
        }
    }, page, results, screenshots);

    // Test 4: View rejected tab
    await runTest('Quality - Rejected Tab', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const rejectedTab = page.locator('button:has-text("Rejected"), .tab:has-text("Rejected"), a:has-text("Rejected")');
        if (await rejectedTab.count() > 0) {
            await rejectedTab.first().click();
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'quality-rejected-tab');
    }, page, results, screenshots);

    // Test 5: Reject process modal
    await runTest('Quality - Reject Process Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Go to pending tab
        const pendingTab = page.locator('button:has-text("Pending"), .tab:has-text("Pending")');
        if (await pendingTab.count() > 0) {
            await pendingTab.first().click();
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'quality-reject-before');

        const rejectBtn = page.locator('button:has-text("Reject"), .btn-reject');
        if (await rejectBtn.count() > 0) {
            await rejectBtn.first().click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'quality-reject-modal-open');

            // Fill rejection reason
            const reasonInput = page.locator('textarea[name="reason"], input[name="reason"], textarea');
            if (await reasonInput.count() > 0) {
                await reasonInput.first().fill('Quality standards not met - E2E test');
            }

            await screenshots.capture(page, 'quality-reject-modal-filled');

            if (submitActions) {
                const confirmBtn = page.locator('.modal button.btn-danger, .modal button:has-text("Reject"), .modal button.btn-primary');
                if (await confirmBtn.count() > 0) {
                    await confirmBtn.click();
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'quality-reject-success');
                }
            } else {
                const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        }
    }, page, results, screenshots);

    // Test 6: View all quality records
    await runTest('Quality - All Records View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const allTab = page.locator('button:has-text("All"), .tab:has-text("All"), a:has-text("All")');
        if (await allTab.count() > 0) {
            await allTab.first().click();
            await page.waitForTimeout(500);
        }

        await screenshots.capture(page, 'quality-all-records');
    }, page, results, screenshots);
}

module.exports = { runQualityTests };
