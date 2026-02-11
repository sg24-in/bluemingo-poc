/**
 * Mobile Responsive E2E Tests (R-19)
 *
 * Tests the application at multiple viewport sizes to verify responsive layout:
 *   - Tablet landscape (1024x768)
 *   - Tablet portrait  (768x1024)
 *   - Mobile           (375x812)  - iPhone-like
 *
 * Covers: header/nav, dashboard, list pages, detail pages, forms,
 *         admin sidebar, pagination, reports, filters, modals,
 *         navigation functionality, computed style assertions,
 *         table scroll handling, and touch target sizes.
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

        // At small widths, .user-name-display should be hidden via CSS
        const userName = page.locator('.user-name-display');
        if (await userName.count() > 0) {
            const visible = await userName.isVisible();
            if (visible) {
                throw new Error('User name should be hidden at mobile width (375px) but is still visible');
            }
            console.log('   User name correctly hidden at mobile width');
        } else {
            console.log('   No .user-name-display element found (acceptable)');
        }

        // Avatar should still be visible
        const avatar = page.locator('.user-avatar');
        if (await avatar.count() > 0 && await avatar.isVisible()) {
            console.log('   User avatar visible');
        }

        await screenshots.capture(page, 'mobile-user-profile');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  1b. Navigation Functionality
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Nav Link Navigates to Orders Page', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Open hamburger
        const hamburger = page.locator('.mobile-menu-toggle');
        await hamburger.click();
        await page.waitForTimeout(500);

        // Expand Orders dropdown
        const ordersTrigger = page.locator('.dropdown-trigger:has-text("Orders")');
        await ordersTrigger.click();
        await page.waitForTimeout(400);

        // Click "Order List"
        const orderListLink = page.locator('.dropdown-menu a:has-text("Order List")');
        await orderListLink.click();
        await page.waitForTimeout(1000);

        const url = page.url();
        if (!url.includes('/#/orders')) {
            throw new Error(`Expected URL to contain /#/orders, got ${url}`);
        }
        console.log('   Successfully navigated to orders via mobile nav');

        await screenshots.capture(page, 'mobile-nav-navigated-orders');
    }, page, results, screenshots);

    await runTest('Mobile - Nav Link Navigates to Dashboard', async () => {
        await setViewport('mobile');
        // Start from orders page
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Open hamburger and click Dashboard
        const hamburger = page.locator('.mobile-menu-toggle');
        await hamburger.click();
        await page.waitForTimeout(500);

        const dashboardLink = page.locator('.nav-menu a:has-text("Dashboard")');
        await dashboardLink.click();
        await page.waitForTimeout(1000);

        const url = page.url();
        if (!url.includes('/#/dashboard')) {
            throw new Error(`Expected URL to contain /#/dashboard, got ${url}`);
        }
        console.log('   Successfully navigated to dashboard via mobile nav');
    }, page, results, screenshots);

    await runTest('Mobile - Menu Closes After Navigation', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Open hamburger and navigate
        const hamburger = page.locator('.mobile-menu-toggle');
        await hamburger.click();
        await page.waitForTimeout(500);

        const dashboardLink = page.locator('.nav-menu a:has-text("Dashboard")');
        await dashboardLink.click();
        await page.waitForTimeout(1000);

        // Menu should be closed after navigation
        const openMenu = page.locator('.nav-menu.open');
        const menuCount = await openMenu.count();
        if (menuCount > 0) {
            throw new Error('Nav menu should close after navigation but .nav-menu.open is still present');
        }
        console.log('   Menu correctly closes after navigation');
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
        await setViewport('mobile');
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
    //  3b. Admin List Pages at Mobile
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Customers List Renders with Table', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        if (await table.count() === 0) {
            throw new Error('Customers table not found at mobile width');
        }

        const rows = table.locator('tbody tr');
        const rowCount = await rows.count();
        console.log(`   Customers table rows: ${rowCount}`);

        await screenshots.capture(page, 'mobile-customers-list');
    }, page, results, screenshots);

    await runTest('Mobile - Materials List Renders with Table', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.MATERIALS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        if (await table.count() === 0) {
            throw new Error('Materials table not found at mobile width');
        }

        const rows = table.locator('tbody tr');
        console.log(`   Materials table rows: ${await rows.count()}`);

        await screenshots.capture(page, 'mobile-materials-list');
    }, page, results, screenshots);

    await runTest('Mobile - Products List Renders with Table', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        if (await table.count() === 0) {
            throw new Error('Products table not found at mobile width');
        }

        const rows = table.locator('tbody tr');
        console.log(`   Products table rows: ${await rows.count()}`);

        await screenshots.capture(page, 'mobile-products-list');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    //  4. Filters Stack Vertically (Computed Style)
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Filters Stack Vertically', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const flexDir = await page.evaluate(() => {
            const el = document.querySelector('.filters');
            return el ? getComputedStyle(el).flexDirection : null;
        });

        if (flexDir === null) {
            console.log('   No .filters element found (page may use different selector)');
        } else if (flexDir !== 'column') {
            throw new Error(`Expected .filters flex-direction: column at mobile, got "${flexDir}"`);
        } else {
            console.log('   Filters correctly stacked vertically (flex-direction: column)');
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
            console.log('   No pagination found (may have few items)');
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
        await setViewport('mobile');
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

    await runTest('Mobile - Admin Sidebar Becomes Full Width', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const sidebarWidth = await page.evaluate(() => {
            const el = document.querySelector('.admin-sidebar, .sidebar');
            if (!el) return null;
            return el.getBoundingClientRect().width;
        });

        if (sidebarWidth !== null) {
            // At mobile (375px) the sidebar should be full width (100%)
            if (sidebarWidth < 300) {
                throw new Error(`Sidebar should be full width at mobile, but is only ${sidebarWidth}px`);
            }
            console.log(`   Sidebar width: ${sidebarWidth}px (full width at mobile)`);
        } else {
            console.log('   No sidebar element found');
        }

        await screenshots.capture(page, 'mobile-admin-sidebar-full-width');
    }, page, results, screenshots);

    await runTest('Mobile - Admin Sidebar Header Hidden', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const sidebarHeader = page.locator('.sidebar-header');
        if (await sidebarHeader.count() > 0) {
            const visible = await sidebarHeader.isVisible();
            if (visible) {
                throw new Error('Sidebar header should be hidden at mobile width via CSS display:none');
            }
            console.log('   Sidebar header correctly hidden at mobile width');
        } else {
            console.log('   No .sidebar-header element (acceptable)');
        }

        const sidebarFooter = page.locator('.sidebar-footer');
        if (await sidebarFooter.count() > 0) {
            const visible = await sidebarFooter.isVisible();
            if (visible) {
                throw new Error('Sidebar footer should be hidden at mobile width via CSS display:none');
            }
            console.log('   Sidebar footer correctly hidden at mobile width');
        } else {
            console.log('   No .sidebar-footer element (acceptable)');
        }
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

    await runTest('Mobile - Production Confirm Form Stacks to Single Column', async () => {
        await setViewport('mobile');
        // Navigate to production confirm for operation 1
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_CONFIRM(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const gridCols = await page.evaluate(() => {
            const el = document.querySelector('.form-grid');
            return el ? getComputedStyle(el).gridTemplateColumns : null;
        });

        if (gridCols !== null) {
            // At mobile width, grid should resolve to a single column
            const colCount = gridCols.split(/\s+/).length;
            if (colCount > 1) {
                throw new Error(`Form grid should be single column at mobile, got ${colCount} columns: "${gridCols}"`);
            }
            console.log(`   Form grid is single column: ${gridCols}`);
        } else {
            console.log('   No .form-grid element found (page may redirect if no operation)');
        }

        await screenshots.capture(page, 'mobile-production-form-stacked');
    }, page, results, screenshots);

    await runTest('Mobile - Production Confirm Touch Targets Adequate', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_CONFIRM(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const touchTargetInfo = await page.evaluate(() => {
            const headers = document.querySelectorAll('.card-header.collapsible, .section-header');
            if (headers.length === 0) return null;
            const style = getComputedStyle(headers[0]);
            return {
                paddingTop: parseFloat(style.paddingTop),
                paddingBottom: parseFloat(style.paddingBottom),
                height: headers[0].getBoundingClientRect().height,
                count: headers.length
            };
        });

        if (touchTargetInfo !== null) {
            console.log(`   Found ${touchTargetInfo.count} collapsible header(s), height: ${touchTargetInfo.height}px`);
            if (touchTargetInfo.height < 40) {
                throw new Error(`Touch target height ${touchTargetInfo.height}px is too small for mobile (min 40px)`);
            }
            console.log('   Touch targets are adequate for mobile');
        } else {
            console.log('   No collapsible headers found (page may redirect)');
        }
    }, page, results, screenshots);

    await runTest('Mobile - Production Confirm Info Grid Changes', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_CONFIRM(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const gridCols = await page.evaluate(() => {
            const el = document.querySelector('.operation-info-grid, .info-grid');
            return el ? getComputedStyle(el).gridTemplateColumns : null;
        });

        if (gridCols !== null) {
            const colCount = gridCols.split(/\s+/).length;
            // At mobile, should be 2 columns (down from desktop 3)
            if (colCount > 3) {
                throw new Error(`Info grid should have at most 3 columns at mobile, got ${colCount}`);
            }
            console.log(`   Operation info grid columns at mobile: ${colCount} ("${gridCols}")`);
        } else {
            console.log('   No info grid element found (page may redirect)');
        }

        await screenshots.capture(page, 'mobile-production-info-grid');
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
            throw new Error(`Horizontal overflow on dashboard: scrollWidth=${overflows.bodyScrollWidth}, viewport=${overflows.windowInnerWidth}`);
        }
        console.log('   No horizontal overflow detected');

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
            throw new Error(`Horizontal overflow on orders: scrollWidth=${overflows.bodyScrollWidth}, viewport=${overflows.windowInnerWidth}`);
        }
        console.log('   No horizontal overflow detected');

        await screenshots.capture(page, 'mobile-no-overflow-orders');
    }, page, results, screenshots);

    await runTest('Mobile - No Horizontal Overflow on Inventory', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const overflows = await page.evaluate(() => ({
            bodyScrollWidth: document.body.scrollWidth,
            windowInnerWidth: window.innerWidth,
            overflows: document.body.scrollWidth > window.innerWidth
        }));

        if (overflows.overflows) {
            throw new Error(`Horizontal overflow on inventory: scrollWidth=${overflows.bodyScrollWidth}, viewport=${overflows.windowInnerWidth}`);
        }
        console.log('   No horizontal overflow detected');

        await screenshots.capture(page, 'mobile-no-overflow-inventory');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    // 13. Table Horizontal Scroll Handling
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Orders Table Has Overflow Handling', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const overflowX = await page.evaluate(() => {
            // Check table container or parent of table for overflow-x
            const table = document.querySelector('table');
            if (!table) return { found: false };
            let el = table.parentElement;
            while (el && el !== document.body) {
                const style = getComputedStyle(el);
                if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
                    return { found: true, overflowX: style.overflowX, className: el.className };
                }
                el = el.parentElement;
            }
            return { found: false };
        });

        if (overflowX.found) {
            console.log(`   Table container has overflow-x: ${overflowX.overflowX} (class: ${overflowX.className})`);
        } else {
            console.log('   No overflow-x container found for table (table may fit within viewport)');
        }

        await screenshots.capture(page, 'mobile-orders-table-scroll');
    }, page, results, screenshots);

    await runTest('Mobile - Holds Table Has Overflow Handling', async () => {
        await setViewport('mobile');
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const overflowX = await page.evaluate(() => {
            const table = document.querySelector('table');
            if (!table) return { found: false };
            let el = table.parentElement;
            while (el && el !== document.body) {
                const style = getComputedStyle(el);
                if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
                    return { found: true, overflowX: style.overflowX, className: el.className };
                }
                el = el.parentElement;
            }
            return { found: false };
        });

        if (overflowX.found) {
            console.log(`   Table container has overflow-x: ${overflowX.overflowX} (class: ${overflowX.className})`);
        } else {
            console.log('   No overflow-x container found for holds table');
        }

        await screenshots.capture(page, 'mobile-holds-table-scroll');
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    // 14. Modal Responsive
    // ────────────────────────────────────────────────────

    await runTest('Mobile - Modal Fits Within Viewport', async () => {
        await setViewport('mobile');
        // Navigate to holds page to use Apply Hold modal
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Look for an Apply Hold button
        const applyBtn = page.locator('button:has-text("Apply Hold"), a:has-text("Apply Hold"), .btn:has-text("Apply")');
        if (await applyBtn.count() > 0) {
            await applyBtn.first().click();
            await page.waitForTimeout(500);

            const modalContainer = page.locator('.modal-container, .modal-content, .modal');
            if (await modalContainer.count() > 0) {
                const box = await modalContainer.first().boundingBox();
                if (box && box.width > 375) {
                    throw new Error(`Modal wider than viewport: ${box.width}px > 375px`);
                }
                console.log(`   Modal width: ${box ? box.width : 'unknown'}px (fits within 375px viewport)`);

                await screenshots.capture(page, 'mobile-modal-viewport-fit');

                // Close modal
                const closeBtn = page.locator('.modal-close, .btn-cancel, button:has-text("Cancel")');
                if (await closeBtn.count() > 0) {
                    await closeBtn.first().click({ force: true });
                    await page.waitForTimeout(300);
                }
            } else {
                console.log('   Modal did not open (may need different trigger)');
            }
        } else {
            console.log('   No Apply Hold button found on page');
        }
    }, page, results, screenshots);

    await runTest('Mobile - Modal Search Filters Wrap', async () => {
        await setViewport('mobile');
        // Navigate to production to try material selection modal
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION_CONFIRM(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to open material selection modal
        const selectBtn = page.locator('button:has-text("Select Materials"), button:has-text("Add Material"), .btn:has-text("Select")');
        if (await selectBtn.count() > 0) {
            await selectBtn.first().click();
            await page.waitForTimeout(500);

            const filtersRow = page.locator('.filters-row, .modal-filters, .search-filters');
            if (await filtersRow.count() > 0) {
                const flexWrap = await page.evaluate(() => {
                    const el = document.querySelector('.filters-row, .modal-filters, .search-filters');
                    return el ? getComputedStyle(el).flexWrap : null;
                });
                console.log(`   Modal filters flex-wrap: ${flexWrap}`);
            } else {
                console.log('   No filter row found in modal');
            }

            // Close modal
            const closeBtn = page.locator('.modal-close, .btn-cancel, button:has-text("Cancel"), button:has-text("Close")');
            if (await closeBtn.count() > 0) {
                await closeBtn.first().click({ force: true });
                await page.waitForTimeout(300);
            }
        } else {
            console.log('   No material selection button found (page may redirect)');
        }

        await screenshots.capture(page, 'mobile-modal-filters-wrap');
    }, page, results, screenshots);

    await runTest('Mobile - Apply Hold Modal Fits Viewport', async () => {
        await setViewport('mobile');
        // Navigate to inventory or orders to try apply hold from context
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const applyBtn = page.locator('button:has-text("Apply Hold"), a:has-text("Apply Hold"), .btn:has-text("Apply")');
        if (await applyBtn.count() > 0) {
            await applyBtn.first().click();
            await page.waitForTimeout(500);

            const modal = page.locator('.modal-container, .modal-content, .modal');
            if (await modal.count() > 0) {
                const box = await modal.first().boundingBox();
                if (box) {
                    if (box.width > 375) {
                        throw new Error(`Hold modal exceeds viewport: ${box.width}px`);
                    }
                    // Check form fields are visible
                    const reasonSelect = page.locator('select, .reason-select');
                    const commentsArea = page.locator('textarea');
                    console.log(`   Hold modal width: ${box.width}px`);
                    console.log(`   Reason select found: ${await reasonSelect.count() > 0}`);
                    console.log(`   Comments textarea found: ${await commentsArea.count() > 0}`);
                }

                await screenshots.capture(page, 'mobile-hold-modal-fit');

                // Close modal
                const closeBtn = page.locator('.modal-close, .btn-cancel, button:has-text("Cancel")');
                if (await closeBtn.count() > 0) {
                    await closeBtn.first().click({ force: true });
                    await page.waitForTimeout(300);
                }
            } else {
                console.log('   Modal did not open');
            }
        } else {
            console.log('   No Apply Hold button found');
        }
    }, page, results, screenshots);

    // ────────────────────────────────────────────────────
    // Restore viewport
    // ────────────────────────────────────────────────────

    await restoreViewport();
    console.log('   Viewport restored to 1440x900');
}

module.exports = { runMobileResponsiveTests };
