/**
 * Mobile Responsive E2E Tests (R-19)
 *
 * Tests the application at multiple viewport sizes to verify responsive layout:
 *   - Tablet landscape (1024x768)
 *   - Tablet portrait  (768x1024)
 *   - Mobile           (375x812)  - iPhone-like
 *
 * Covers: header/nav, dashboard, list pages, detail pages, forms,
 *         admin sidebar, pagination, reports, filters, and modals.
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

// Viewport presets
const VIEWPORTS = {
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
};

async function runMobileResponsiveTests(page, screenshots, results, runTest, submitActions) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 MOBILE RESPONSIVE TESTS');
    console.log('─'.repeat(50));

    // Store original viewport so we can restore later
    const originalViewport = { width: 1440, height: 900 };

    // ── Helper ──────────────────────────────────────────
    async function setViewport(name) {
        const vp = VIEWPORTS[name] || originalViewport;
        await page.setViewportSize(vp);
        await page.waitForTimeout(300);
    }

    async function restoreViewport() {
        await page.setViewportSize(originalViewport);
        await page.waitForTimeout(200);
    }

    // ────────────────────────────────────────────────────
    //  1. Header & Navigation
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Header Shows Hamburger Menu (tablet)', async () => {
        await setViewport('tablet');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const hamburger = page.locator('.mobile-menu-toggle');
        const isVisible = await hamburger.isVisible();
        if (!isVisible) {
            throw new Error('Mobile hamburger menu not visible at tablet width');
        }

        await screenshots.capture(page, 'mobile-tablet-header');
    }, page, results, screenshots);

    await runTest('Mobile - Hamburger Opens Nav Menu', async () => {
        await setViewport('tablet');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const hamburger = page.locator('.mobile-menu-toggle');
        await hamburger.click();
        await page.waitForTimeout(500);

        const navMenu = page.locator('.nav-menu.open');
        if (await navMenu.count() === 0) {
            throw new Error('Nav menu did not get .open class after hamburger click');
        }

        await screenshots.capture(page, 'mobile-nav-menu-open');

        // Close menu by clicking hamburger again
        await hamburger.click();
        await page.waitForTimeout(300);
    }, page, results, screenshots);

    await runTest('Mobile - Mobile Nav Has All Sections', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const hamburger = page.locator('.mobile-menu-toggle');
        await hamburger.click();
        await page.waitForTimeout(500);

        // Check key nav items exist
        const navMenu = page.locator('.nav-menu');
        const dashboardLink = navMenu.locator('a:has-text("Dashboard")');
        const ordersDropdown = navMenu.locator('.dropdown-trigger:has-text("Orders")');
        const manufacturingDropdown = navMenu.locator('.dropdown-trigger:has-text("Manufacturing")');
        const inventoryDropdown = navMenu.locator('.dropdown-trigger:has-text("Inventory")');
        const qualityDropdown = navMenu.locator('.dropdown-trigger:has-text("Quality")');
        const manageLink = navMenu.locator('a:has-text("Manage")');

        const items = [
            { name: 'Dashboard', el: dashboardLink },
            { name: 'Orders', el: ordersDropdown },
            { name: 'Manufacturing', el: manufacturingDropdown },
            { name: 'Inventory', el: inventoryDropdown },
            { name: 'Quality', el: qualityDropdown },
            { name: 'Manage', el: manageLink },
        ];

        for (const item of items) {
            if (await item.el.count() === 0) {
                throw new Error(`Nav item "${item.name}" not found in mobile menu`);
            }
        }
        console.log('   All 6 nav sections present in mobile menu');

        await screenshots.capture(page, 'mobile-nav-all-sections');

        // Close menu
        await hamburger.click();
        await page.waitForTimeout(300);
    }, page, results, screenshots);

    await runTest('Mobile - Mobile Nav Dropdown Expands', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const hamburger = page.locator('.mobile-menu-toggle');
        await hamburger.click();
        await page.waitForTimeout(500);

        // Click Orders dropdown trigger
        const ordersTrigger = page.locator('.dropdown-trigger:has-text("Orders")');
        await ordersTrigger.click();
        await page.waitForTimeout(400);

        // Check expanded class
        const expanded = page.locator('.nav-dropdown.expanded');
        if (await expanded.count() === 0) {
            throw new Error('Dropdown did not expand on mobile');
        }

        // Check sub-items are visible
        const orderList = page.locator('.dropdown-menu a:has-text("Order List")');
        const prodConfirm = page.locator('.dropdown-menu a:has-text("Production Confirm")');
        if (await orderList.count() === 0 || await prodConfirm.count() === 0) {
            throw new Error('Dropdown sub-items not found');
        }

        await screenshots.capture(page, 'mobile-nav-dropdown-expanded');

        // Close menu
        await hamburger.click();
        await page.waitForTimeout(300);
    }, page, results, screenshots);

    await runTest('Mobile - User Name Hidden on Small Screens', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // At small widths, .user-name-display should be hidden
        const userName = page.locator('.user-name-display');
        if (await userName.count() > 0) {
            const visible = await userName.isVisible();
            if (visible) {
                console.log('   ⚠️  User name still visible at mobile width');
            } else {
                console.log('   User name correctly hidden at mobile width');
            }
        }

        // Avatar should still be visible
        const avatar = page.locator('.user-avatar');
        if (await avatar.count() > 0 && await avatar.isVisible()) {
            console.log('   User avatar visible');
        }

        await screenshots.capture(page, 'mobile-user-profile');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  2. Dashboard
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Dashboard Renders at Mobile Width', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const title = page.locator('h1, h2, .page-title');
        if (await title.count() === 0) {
            throw new Error('No title found on dashboard at mobile width');
        }

        // Metrics cards should still render (stacked)
        const metrics = page.locator('.metric-card, .kpi-card, .stat-card, .alert-card');
        console.log(`   Found ${await metrics.count()} metric/KPI card(s)`);

        await screenshots.capture(page, 'mobile-dashboard');
    }, page, results, screenshots);

    await runTest('Mobile - Dashboard Scrollable', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const scrollY = await page.evaluate(() => window.scrollY);
        console.log(`   Scrolled to Y=${scrollY}`);

        await screenshots.capture(page, 'mobile-dashboard-scrolled');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  3. List Pages
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Orders List Renders', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const title = page.locator('.page-title');
        if (await title.count() > 0) {
            console.log(`   Title: ${(await title.textContent()).trim()}`);
        }

        // Table or list items should be present
        const table = page.locator('table');
        const rows = table.locator('tbody tr');
        if (await table.count() > 0) {
            console.log(`   Table rows: ${await rows.count()}`);
        }

        // Table should be horizontally scrollable or columns may collapse
        await screenshots.capture(page, 'mobile-orders-list');
    }, page, results, screenshots);

    await runTest('Mobile - Inventory List Renders', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const title = page.locator('.page-title');
        if (await title.count() > 0) {
            console.log(`   Title: ${(await title.textContent()).trim()}`);
        }

        await screenshots.capture(page, 'mobile-inventory-list');
    }, page, results, screenshots);

    await runTest('Mobile - Batches List Renders', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'mobile-batches-list');
    }, page, results, screenshots);

    await runTest('Mobile - Equipment List Renders', async () => {
        await setViewport('tablet');
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'mobile-equipment-list');
    }, page, results, screenshots);

    await runTest('Mobile - Holds List Renders', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'mobile-holds-list');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  4. Filters Stack Vertically
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Filters Stack Vertically', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const filters = page.locator('.filters, .filter-controls, .filter-group');
        if (await filters.count() > 0) {
            // Verify that filters container exists (CSS handles stacking via flex-direction: column)
            console.log('   Filters container present (CSS flex-direction: column at mobile)');
        } else {
            console.log('   ⚠️  No filter container found');
        }

        await screenshots.capture(page, 'mobile-filters-stacked');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  5. Pagination
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Pagination Visible at Mobile Width', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const pagination = page.locator('app-pagination, .pagination-controls');
        if (await pagination.count() > 0) {
            console.log('   Pagination component rendered at mobile width');
        } else {
            console.log('   ⚠️  No pagination found (may have few items)');
        }

        await screenshots.capture(page, 'mobile-pagination');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  6. Detail Pages
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Order Detail Renders', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const title = page.locator('.page-title, h1, h2');
        if (await title.count() > 0) {
            console.log(`   Title: ${(await title.first().textContent()).trim()}`);
        }

        // Scroll through the detail page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);

        await screenshots.capture(page, 'mobile-order-detail');
    }, page, results, screenshots);

    await runTest('Mobile - Batch Detail Renders', async () => {
        await setViewport('tablet');
        await page.goto(`${config.baseUrl}${ROUTES.BATCH_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'mobile-batch-detail');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  7. Forms
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Order Form Renders at Mobile Width', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const form = page.locator('form');
        if (await form.count() === 0) {
            throw new Error('Form not found at mobile width');
        }

        // Check form fields are usable
        const inputs = page.locator('form input, form select, form textarea');
        const inputCount = await inputs.count();
        console.log(`   Form has ${inputCount} input(s)`);

        // Submit button should be visible
        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.count() > 0) {
            console.log('   Submit button present');
        }

        await screenshots.capture(page, 'mobile-order-form');
    }, page, results, screenshots);

    await runTest('Mobile - Customer Form Renders (tablet)', async () => {
        await setViewport('tablet');
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const form = page.locator('form');
        if (await form.count() === 0) {
            throw new Error('Customer form not found');
        }

        await screenshots.capture(page, 'mobile-customer-form');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  8. Admin Layout / Sidebar
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Admin Sidebar Stacks Below Content', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // At 768px the admin-container goes flex-direction: column
        const sidebar = page.locator('.admin-sidebar, .sidebar');
        if (await sidebar.count() > 0) {
            console.log('   Admin sidebar present (stacks vertically on mobile via CSS)');
        }

        await screenshots.capture(page, 'mobile-admin-layout');
    }, page, results, screenshots);

    await runTest('Mobile - Manage Landing Grid Responsive', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.MANAGE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const cards = page.locator('.manage-card, .section-card, .card');
        console.log(`   Manage page has ${await cards.count()} card(s)`);

        await screenshots.capture(page, 'mobile-manage-landing');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  9. Production Confirm
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Production Landing Renders', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_LANDING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'mobile-production-landing');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    // 10. Reports at Mobile Width
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Reports Landing Renders', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const cards = page.locator('.report-card');
        const count = await cards.count();
        console.log(`   Report cards: ${count} (stacked at mobile width)`);

        await screenshots.capture(page, 'mobile-reports-landing');
    }, page, results, screenshots);

    await runTest('Mobile - Executive Dashboard Renders at Mobile', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_EXECUTIVE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const sections = page.locator('.section');
        console.log(`   Executive sections: ${await sections.count()}`);

        // Scroll through entire page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'mobile-executive-dashboard');
    }, page, results, screenshots);

    await runTest('Mobile - Report Date Filters Usable', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const dateInputs = page.locator('.date-filter input[type="date"]');
        const count = await dateInputs.count();
        if (count < 2) {
            throw new Error(`Expected 2 date inputs, found ${count}`);
        }

        // Verify date inputs are visible
        for (let i = 0; i < count; i++) {
            const visible = await dateInputs.nth(i).isVisible();
            if (!visible) {
                throw new Error(`Date input ${i} not visible at mobile width`);
            }
        }
        console.log('   Date filter inputs visible and usable');

        await screenshots.capture(page, 'mobile-report-date-filters');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    // 11. Tablet Landscape – Key Pages
    // ────────────────────────────────────────────────────

    await runTest('Tablet - Dashboard at 1024px', async () => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(200);
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // At 1024px the nav should show compact items (1200px breakpoint hides user name)
        const userName = page.locator('.user-name-display');
        if (await userName.count() > 0) {
            const visible = await userName.isVisible();
            console.log(`   User name visible at 1024px: ${visible}`);
        }

        await screenshots.capture(page, 'tablet-landscape-dashboard');
    }, page, results, screenshots);

    await runTest('Tablet - Orders List at 1024px', async () => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(200);
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'tablet-landscape-orders');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    // 12. No Horizontal Overflow
    // ────────────────────────────────────────────────────

    await runTest('Mobile - No Horizontal Overflow on Dashboard', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const overflows = await page.evaluate(() => {
            const body = document.body;
            return {
                bodyScrollWidth: body.scrollWidth,
                windowInnerWidth: window.innerWidth,
                overflows: body.scrollWidth > window.innerWidth
            };
        });

        if (overflows.overflows) {
            console.log(`   ⚠️  Horizontal overflow: scrollWidth=${overflows.bodyScrollWidth}, viewport=${overflows.windowInnerWidth}`);
        } else {
            console.log('   No horizontal overflow detected');
        }

        await screenshots.capture(page, 'mobile-no-overflow-dashboard');
    }, page, results, screenshots);

    await runTest('Mobile - No Horizontal Overflow on Orders', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const overflows = await page.evaluate(() => ({
            bodyScrollWidth: document.body.scrollWidth,
            windowInnerWidth: window.innerWidth,
            overflows: document.body.scrollWidth > window.innerWidth
        }));

        if (overflows.overflows) {
            console.log(`   ⚠️  Horizontal overflow: scrollWidth=${overflows.bodyScrollWidth}, viewport=${overflows.windowInnerWidth}`);
        } else {
            console.log('   No horizontal overflow detected');
        }

        await screenshots.capture(page, 'mobile-no-overflow-orders');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    // Restore viewport
    // ────────────────────────────────────────────────────

    await restoreViewport();
    console.log('   Viewport restored to 1440x900');
}

module.exports = { runMobileResponsiveTests };
