/**
 * New Detail Pages Tests
 * Tests for routing-detail and operation-template-detail pages
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runNewDetailPageTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('ROUTING & TEMPLATE DETAIL PAGE TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // ROUTING DETAIL PAGE
    // ============================================

    await runTest('Routing Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'routing-list-before-detail');

        // Look for view/detail button or clickable row
        const viewBtn = page.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")').first();
        if (await viewBtn.isVisible({ timeout: 3000 })) {
            await viewBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'routing-detail-page');

            // Verify we navigated to a detail page
            const url = page.url();
            if (url.includes('/routing/')) {
                console.log('   Navigated to routing detail page');
            }
        } else {
            // Try clicking a table row
            const row = page.locator('table tbody tr').first();
            if (await row.isVisible({ timeout: 2000 })) {
                await row.click();
                await page.waitForTimeout(1000);
                await screenshots.capture(page, 'routing-detail-page');
            } else {
                console.log('   No routing rows found to click');
            }
        }
    }, page, results, screenshots);

    await runTest('Routing Detail - Direct URL Navigation', async () => {
        // Navigate directly to routing detail (ID 1)
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'routing-detail-direct');

        // Check for routing info sections
        const heading = page.locator('h1, h2, .page-title, .routing-name');
        if (await heading.isVisible({ timeout: 3000 })) {
            const text = await heading.textContent();
            console.log(`   Page heading: ${text.trim().substring(0, 50)}`);
        }

        // Check for routing steps section
        const stepsSection = page.locator('text=Steps, text=Routing Steps, h3:has-text("Steps")');
        if (await stepsSection.isVisible({ timeout: 2000 })) {
            console.log('   Routing steps section visible');
        }
    }, page, results, screenshots);

    await runTest('Routing Detail - Status and Actions', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for status badge
        const statusBadge = page.locator('.status-badge, .badge, [class*="status"]').first();
        if (await statusBadge.isVisible({ timeout: 2000 })) {
            const statusText = await statusBadge.textContent();
            console.log(`   Routing status: ${statusText.trim()}`);
        }

        // Check for action buttons (activate, deactivate, hold, release)
        const actionBtns = page.locator('button:has-text("Activate"), button:has-text("Deactivate"), button:has-text("Hold"), button:has-text("Release")');
        const actionCount = await actionBtns.count();
        console.log(`   Found ${actionCount} action button(s)`);

        await screenshots.capture(page, 'routing-detail-status-actions');
    }, page, results, screenshots);

    await runTest('Routing Detail - Back Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), .back-link, .btn-back').first();
        if (await backBtn.isVisible({ timeout: 2000 })) {
            await backBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const url = page.url();
            if (url.includes('/routing') && !url.match(/\/routing\/\d+/)) {
                console.log('   Successfully navigated back to routing list');
            }
            await screenshots.capture(page, 'routing-detail-back-to-list');
        } else {
            console.log('   No back button found');
        }
    }, page, results, screenshots);

    // ============================================
    // OPERATION TEMPLATE DETAIL PAGE
    // ============================================

    await runTest('Operation Template Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'op-template-list-before-detail');

        const viewBtn = page.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")').first();
        if (await viewBtn.isVisible({ timeout: 3000 })) {
            await viewBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'op-template-detail-page');

            const url = page.url();
            if (url.includes('/operation-templates/')) {
                console.log('   Navigated to operation template detail page');
            }
        } else {
            const row = page.locator('table tbody tr').first();
            if (await row.isVisible({ timeout: 2000 })) {
                await row.click();
                await page.waitForTimeout(1000);
                await screenshots.capture(page, 'op-template-detail-page');
            } else {
                console.log('   No template rows found to click');
            }
        }
    }, page, results, screenshots);

    await runTest('Operation Template Detail - Direct URL Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'op-template-detail-direct');

        const heading = page.locator('h1, h2, .page-title');
        if (await heading.isVisible({ timeout: 3000 })) {
            const text = await heading.textContent();
            console.log(`   Page heading: ${text.trim().substring(0, 50)}`);
        }

        // Check for template configuration section
        const configSection = page.locator('text=Configuration, text=Template Info, h3:has-text("Config")');
        if (await configSection.isVisible({ timeout: 2000 })) {
            console.log('   Template configuration section visible');
        }
    }, page, results, screenshots);

    await runTest('Operation Template Detail - Template Information', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for template details (name, type, status)
        const statusBadge = page.locator('.status-badge, .badge, [class*="status"]').first();
        if (await statusBadge.isVisible({ timeout: 2000 })) {
            const statusText = await statusBadge.textContent();
            console.log(`   Template status: ${statusText.trim()}`);
        }

        // Check for action buttons
        const actionBtns = page.locator('button:has-text("Activate"), button:has-text("Deactivate"), button:has-text("Edit")');
        const actionCount = await actionBtns.count();
        console.log(`   Found ${actionCount} action button(s)`);

        await screenshots.capture(page, 'op-template-detail-info');
    }, page, results, screenshots);

    await runTest('Operation Template Detail - Back Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), .back-link, .btn-back').first();
        if (await backBtn.isVisible({ timeout: 2000 })) {
            await backBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const url = page.url();
            if (url.includes('/operation-templates') && !url.match(/\/operation-templates\/\d+/)) {
                console.log('   Successfully navigated back to templates list');
            }
            await screenshots.capture(page, 'op-template-detail-back-to-list');
        } else {
            console.log('   No back button found');
        }
    }, page, results, screenshots);
}

module.exports = { runNewDetailPageTests };
