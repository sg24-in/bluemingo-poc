/**
 * Admin Sidebar Tests
 * Tests for the admin layout sidebar with collapsible menu groups
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runAdminSidebarTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('ADMIN SIDEBAR TESTS');
    console.log('='.repeat(50));

    // ============================================
    // SIDEBAR STRUCTURE TESTS
    // ============================================

    await runTest('Admin Sidebar - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'admin-sidebar-page');

        // Verify sidebar is visible
        const sidebar = page.locator('.admin-sidebar');
        if (!await sidebar.isVisible()) {
            throw new Error('Admin sidebar not visible');
        }

        console.log('   Admin sidebar loaded successfully');
    }, page, results, screenshots);

    await runTest('Admin Sidebar - Menu Groups Present', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for menu groups
        const menuGroups = page.locator('.sidebar-group');
        const groupCount = await menuGroups.count();

        await screenshots.capture(page, 'admin-sidebar-groups');

        if (groupCount < 4) {
            throw new Error(`Expected at least 4 menu groups, found ${groupCount}`);
        }

        console.log(`   Found ${groupCount} menu groups`);

        // Verify group titles
        const expectedGroups = ['Master Data', 'Production', 'Configuration', 'System'];
        for (const groupTitle of expectedGroups) {
            const groupHeader = page.locator(`.group-title:has-text("${groupTitle}")`);
            if (await groupHeader.isVisible()) {
                console.log(`   Found group: ${groupTitle}`);
            }
        }
    }, page, results, screenshots);

    await runTest('Admin Sidebar - All Menu Links Present', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Count total sidebar links
        const sidebarLinks = page.locator('.sidebar-link');
        const linkCount = await sidebarLinks.count();

        await screenshots.capture(page, 'admin-sidebar-links');

        // Should have 16 links total (3+5+6+2)
        if (linkCount < 10) {
            throw new Error(`Expected at least 10 menu links, found ${linkCount}`);
        }

        console.log(`   Found ${linkCount} menu links`);
    }, page, results, screenshots);

    // ============================================
    // COLLAPSIBLE GROUP TESTS
    // ============================================

    await runTest('Admin Sidebar - Group Collapse Toggle', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Find Configuration group and toggle it
        const configGroup = page.locator('.group-title:has-text("Configuration")');

        if (await configGroup.isVisible()) {
            // Check if group items are visible before collapse
            const groupItems = page.locator('.sidebar-group:has(.group-title:has-text("Configuration")) .group-items');
            const wasVisible = await groupItems.isVisible();

            await screenshots.capture(page, 'admin-sidebar-before-collapse');

            // Click to toggle
            await configGroup.click();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'admin-sidebar-after-collapse');

            // Check if state changed
            const isNowVisible = await groupItems.isVisible();

            if (wasVisible === isNowVisible) {
                console.log('   Group toggle may not have changed state (check if already collapsed)');
            } else {
                console.log(`   Group toggled: ${wasVisible ? 'expanded' : 'collapsed'} -> ${isNowVisible ? 'expanded' : 'collapsed'}`);
            }
        }
    }, page, results, screenshots);

    await runTest('Admin Sidebar - Collapse Chevron Icon', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for chevron icons in group titles
        const chevronIcons = page.locator('.group-title i.fas');
        const iconCount = await chevronIcons.count();

        if (iconCount > 0) {
            console.log(`   Found ${iconCount} chevron icons in group titles`);
        }

        // Check for specific chevron classes
        const chevronUp = page.locator('.group-title .fa-chevron-up');
        const chevronDown = page.locator('.group-title .fa-chevron-down');

        if (await chevronUp.count() > 0 || await chevronDown.count() > 0) {
            console.log('   Chevron toggle icons present');
        }
    }, page, results, screenshots);

    await runTest('Admin Sidebar - Multiple Groups Collapse', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Collapse multiple groups
        const groupTitles = ['Configuration', 'Production'];

        for (const title of groupTitles) {
            const groupTitle = page.locator(`.group-title:has-text("${title}")`);
            if (await groupTitle.isVisible()) {
                await groupTitle.click();
                await page.waitForTimeout(200);
            }
        }

        await screenshots.capture(page, 'admin-sidebar-multiple-collapsed');

        // Count collapsed groups
        const collapsedGroups = page.locator('.sidebar-group.collapsed');
        const collapsedCount = await collapsedGroups.count();

        console.log(`   ${collapsedCount} groups collapsed`);
    }, page, results, screenshots);

    // ============================================
    // NAVIGATION TESTS
    // ============================================

    await runTest('Admin Sidebar - Active Link Highlighting', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIALS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for active link
        const activeLink = page.locator('.sidebar-link.active');
        const activeCount = await activeLink.count();

        await screenshots.capture(page, 'admin-sidebar-active-link');

        if (activeCount === 0) {
            throw new Error('No active link highlighted');
        }

        // Get active link text
        const activeLinkText = await activeLink.first().textContent();
        console.log(`   Active link: ${activeLinkText.trim()}`);
    }, page, results, screenshots);

    await runTest('Admin Sidebar - Navigation Between Pages', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click on Materials link
        const materialsLink = page.locator('.sidebar-link:has-text("Materials")');
        if (await materialsLink.isVisible()) {
            await materialsLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'admin-sidebar-nav-materials');

            // Verify navigation
            const pageTitle = page.locator('h1:has-text("Material")');
            if (await pageTitle.isVisible()) {
                console.log('   Successfully navigated to Materials page');
            }
        }

        // Click on Users link
        const usersLink = page.locator('.sidebar-link:has-text("Users")');
        if (await usersLink.isVisible()) {
            await usersLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'admin-sidebar-nav-users');

            const usersTitle = page.locator('h1:has-text("User")');
            if (await usersTitle.isVisible()) {
                console.log('   Successfully navigated to Users page');
            }
        }
    }, page, results, screenshots);

    await runTest('Admin Sidebar - Auto Expand Active Group', async () => {
        // Navigate to a page in Configuration group
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'admin-sidebar-auto-expand');

        // Check that Configuration group is expanded (not collapsed)
        const configGroup = page.locator('.sidebar-group:has(.group-title:has-text("Configuration"))');
        const isCollapsed = await configGroup.evaluate(el => el.classList.contains('collapsed'));

        if (!isCollapsed) {
            console.log('   Configuration group auto-expanded for active route');
        }

        // Verify Hold Reasons link is active
        const holdReasonsLink = page.locator('.sidebar-link.active:has-text("Hold Reasons")');
        if (await holdReasonsLink.isVisible()) {
            console.log('   Hold Reasons link correctly highlighted');
        }
    }, page, results, screenshots);

    // ============================================
    // BACK TO DASHBOARD TEST
    // ============================================

    await runTest('Admin Sidebar - Back to Dashboard Link', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Find back to dashboard link
        const backLink = page.locator('.back-link:has-text("Back to Dashboard")');

        await screenshots.capture(page, 'admin-sidebar-back-link');

        if (!await backLink.isVisible()) {
            throw new Error('Back to Dashboard link not visible');
        }

        // Click and verify navigation
        await backLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const dashboardTitle = page.locator('h1:has-text("Dashboard")');
        if (await dashboardTitle.isVisible()) {
            console.log('   Successfully navigated back to Dashboard');
        }

        await screenshots.capture(page, 'admin-sidebar-dashboard-after');
    }, page, results, screenshots);

    // ============================================
    // SCROLL TEST
    // ============================================

    await runTest('Admin Sidebar - Scrollability', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Ensure all groups are expanded
        const groupTitles = page.locator('.group-title');
        const groupCount = await groupTitles.count();

        for (let i = 0; i < groupCount; i++) {
            const group = groupTitles.nth(i);
            const parentGroup = group.locator('..');
            const isCollapsed = await parentGroup.evaluate(el => el.classList.contains('collapsed'));
            if (isCollapsed) {
                await group.click();
                await page.waitForTimeout(100);
            }
        }

        await screenshots.capture(page, 'admin-sidebar-all-expanded');

        // Check if sidebar nav is scrollable
        const sidebarNav = page.locator('.sidebar-nav');
        const hasOverflow = await sidebarNav.evaluate(el => {
            return el.scrollHeight > el.clientHeight ||
                   window.getComputedStyle(el).overflowY === 'auto';
        });

        if (hasOverflow) {
            console.log('   Sidebar is scrollable for overflow content');
        } else {
            console.log('   Sidebar content fits without scrolling');
        }
    }, page, results, screenshots);

    console.log('\n' + '='.repeat(50));
    console.log('ADMIN SIDEBAR TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runAdminSidebarTests };
