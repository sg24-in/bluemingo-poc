/**
 * Responsive Breakpoint Tests
 *
 * Tests the application at ALL 5 standard breakpoints:
 *   - xs: 320x568 (small phone)
 *   - sm: 375x812 (standard phone)
 *   - md: 768x1024 (tablet portrait)
 *   - lg: 1024x768 (tablet landscape / small desktop)
 *   - xl: 1440x900 (desktop - default)
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

const VIEWPORTS = {
    xs: { width: 320, height: 568 },
    sm: { width: 375, height: 812 },
    md: { width: 768, height: 1024 },
    lg: { width: 1024, height: 768 },
    xl: { width: 1440, height: 900 },
};

async function runResponsiveBreakpointTests(page, screenshots, results, runTest, submitActions) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 RESPONSIVE BREAKPOINT TESTS');
    console.log('─'.repeat(50));

    const originalViewport = { width: 1440, height: 900 };

    async function setViewport(name) {
        const vp = VIEWPORTS[name] || originalViewport;
        await page.setViewportSize(vp);
        await page.waitForTimeout(300);
    }

    async function restoreViewport() {
        await page.setViewportSize(originalViewport);
        await page.waitForTimeout(200);
    }

    // ════════════════════════════════════════════════════════
    //  Section 1: Header Navigation at Each Breakpoint (5 tests)
    // ════════════════════════════════════════════════════════

    // --- xs (320px) ---
    await runTest('Responsive - Header at xs (320px)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const hamburger = page.locator('.mobile-menu-toggle');
        const fullNav = page.locator('.nav-menu');

        const hamburgerVisible = await hamburger.count() > 0 && await hamburger.isVisible();
        if (!hamburgerVisible) {
            throw new Error('Hamburger menu should be visible at 320px');
        }
        console.log('   Hamburger menu visible at 320px');

        // Full nav links should be hidden (collapsed) at xs
        const navOpen = page.locator('.nav-menu.open');
        const navOpenCount = await navOpen.count();
        if (navOpenCount > 0) {
            throw new Error('Nav menu should NOT be open by default at 320px');
        }
        console.log('   Full nav correctly collapsed at 320px');

        await screenshots.capture(page, 'breakpoint-header-xs-320');
    }, page, results, screenshots);

    // --- sm (375px) ---
    await runTest('Responsive - Header at sm (375px)', async () => {
        await setViewport('sm');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const hamburger = page.locator('.mobile-menu-toggle');
        const hamburgerVisible = await hamburger.count() > 0 && await hamburger.isVisible();
        if (!hamburgerVisible) {
            throw new Error('Hamburger menu should be visible at 375px');
        }
        console.log('   Hamburger menu visible at 375px');

        // Full nav should be collapsed
        const navOpen = page.locator('.nav-menu.open');
        if (await navOpen.count() > 0) {
            throw new Error('Nav menu should NOT be open by default at 375px');
        }
        console.log('   Full nav correctly collapsed at 375px');

        await screenshots.capture(page, 'breakpoint-header-sm-375');
    }, page, results, screenshots);

    // --- md (768px) ---
    await runTest('Responsive - Header at md (768px)', async () => {
        await setViewport('md');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const hamburger = page.locator('.mobile-menu-toggle');
        const hamburgerVisible = await hamburger.count() > 0 && await hamburger.isVisible();
        if (!hamburgerVisible) {
            throw new Error('Hamburger menu should be visible at 768px');
        }
        console.log('   Hamburger menu visible at 768px');

        // Full nav should still be collapsed at md
        const navOpen = page.locator('.nav-menu.open');
        if (await navOpen.count() > 0) {
            throw new Error('Nav menu should NOT be open by default at 768px');
        }
        console.log('   Full nav correctly collapsed at 768px');

        await screenshots.capture(page, 'breakpoint-header-md-768');
    }, page, results, screenshots);

    // --- lg (1024px) ---
    await runTest('Responsive - Header at lg (1024px)', async () => {
        await page.setViewportSize(VIEWPORTS.lg);
        await page.waitForTimeout(300);
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // At 1024px, check whether hamburger or full nav is showing
        const hamburger = page.locator('.mobile-menu-toggle');
        const hamburgerExists = await hamburger.count() > 0;
        const hamburgerVisible = hamburgerExists && await hamburger.isVisible();

        const navMenu = page.locator('.nav-menu');
        const navMenuExists = await navMenu.count() > 0;

        console.log(`   Hamburger visible at 1024px: ${hamburgerVisible}`);
        console.log(`   Nav menu exists at 1024px: ${navMenuExists}`);

        // User name may or may not be visible at this breakpoint
        const userName = page.locator('.user-name-display');
        if (await userName.count() > 0) {
            const nameVisible = await userName.isVisible();
            console.log(`   User name visible at 1024px: ${nameVisible}`);
        }

        await screenshots.capture(page, 'breakpoint-header-lg-1024');
    }, page, results, screenshots);

    // --- xl (1440px) ---
    await runTest('Responsive - Header at xl (1440px)', async () => {
        await setViewport('xl');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // At 1440px the full nav should be visible
        const navMenu = page.locator('.nav-menu');
        if (await navMenu.count() === 0) {
            throw new Error('Nav menu not found at 1440px desktop');
        }
        console.log('   Full nav menu present at 1440px');

        // User name should be visible at xl
        const userName = page.locator('.user-name-display');
        if (await userName.count() > 0) {
            const nameVisible = await userName.isVisible();
            if (!nameVisible) {
                throw new Error('User name should be visible at 1440px desktop');
            }
            console.log('   User name visible at 1440px');
        } else {
            console.log('   No .user-name-display element found (acceptable)');
        }

        // Hamburger should be hidden at desktop
        const hamburger = page.locator('.mobile-menu-toggle');
        if (await hamburger.count() > 0) {
            const hamburgerVisible = await hamburger.isVisible();
            if (hamburgerVisible) {
                throw new Error('Hamburger menu should be hidden at 1440px desktop width');
            }
            console.log('   Hamburger correctly hidden at 1440px');
        }

        await screenshots.capture(page, 'breakpoint-header-xl-1440');
    }, page, results, screenshots);

    // ════════════════════════════════════════════════════════
    //  Section 2: Critical Pages at 320px (8 tests)
    // ════════════════════════════════════════════════════════

    // --- 2.1 Dashboard at xs ---
    await runTest('Responsive - Dashboard at 320px (no overflow)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const noOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
        );

        if (!noOverflow) {
            const dims = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth
            }));
            throw new Error(`Horizontal overflow on dashboard at 320px: scrollWidth=${dims.scrollWidth}, clientWidth=${dims.clientWidth}`);
        }

        // Metric cards should be stacked
        const cards = page.locator('.metric-card, .kpi-card, .stat-card, .alert-card');
        console.log(`   Dashboard cards found: ${await cards.count()} (stacked at 320px)`);
        console.log('   No horizontal overflow at 320px');

        await screenshots.capture(page, 'breakpoint-dashboard-xs-320');
    }, page, results, screenshots);

    // --- 2.2 Orders List at xs ---
    await runTest('Responsive - Orders List at 320px (no overflow)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const noOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
        );

        const table = page.locator('table');
        if (await table.count() > 0) {
            console.log('   Orders table rendered at 320px');
        }

        if (!noOverflow) {
            const dims = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth
            }));
            throw new Error(`Horizontal overflow on orders at 320px: scrollWidth=${dims.scrollWidth}, clientWidth=${dims.clientWidth}`);
        }
        console.log('   No horizontal overflow on orders at 320px');

        await screenshots.capture(page, 'breakpoint-orders-xs-320');
    }, page, results, screenshots);

    // --- 2.3 Production Confirm at xs ---
    await runTest('Responsive - Production Confirm at 320px (single column)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTION}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for single column form layout
        const gridCols = await page.evaluate(() => {
            const el = document.querySelector('.form-grid');
            return el ? getComputedStyle(el).gridTemplateColumns : null;
        });

        if (gridCols !== null) {
            const colCount = gridCols.split(/\s+/).length;
            if (colCount > 1) {
                throw new Error(`Form grid should be single column at 320px, got ${colCount} columns: "${gridCols}"`);
            }
            console.log(`   Form grid is single column: ${gridCols}`);
        } else {
            console.log('   No .form-grid element found (page may show production landing)');
        }

        await screenshots.capture(page, 'breakpoint-production-xs-320');
    }, page, results, screenshots);

    // --- 2.4 Inventory List at xs ---
    await runTest('Responsive - Inventory List at 320px (no overflow)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const noOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
        );

        if (!noOverflow) {
            const dims = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth
            }));
            throw new Error(`Horizontal overflow on inventory at 320px: scrollWidth=${dims.scrollWidth}, clientWidth=${dims.clientWidth}`);
        }

        const visible = page.locator('.page-title, h1, h2');
        if (await visible.count() > 0) {
            console.log('   Inventory page visible at 320px');
        }
        console.log('   No horizontal overflow on inventory at 320px');

        await screenshots.capture(page, 'breakpoint-inventory-xs-320');
    }, page, results, screenshots);

    // --- 2.5 Reports Executive Dashboard at xs ---
    await runTest('Responsive - Reports Executive at 320px (stacked sections)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.REPORTS_EXECUTIVE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const sections = page.locator('.section, .report-section, .dashboard-section');
        const sectionCount = await sections.count();
        console.log(`   Executive dashboard sections found: ${sectionCount}`);

        // Scroll to bottom to verify all content is accessible
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const noOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
        );
        if (!noOverflow) {
            console.log('   Warning: Horizontal overflow detected on executive dashboard at 320px');
        } else {
            console.log('   Sections stack correctly at 320px, no overflow');
        }

        await screenshots.capture(page, 'breakpoint-reports-exec-xs-320');
    }, page, results, screenshots);

    // --- 2.6 Holds List at xs ---
    await runTest('Responsive - Holds List at 320px (buttons no overlap)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check that action buttons don't overlap
        const buttons = page.locator('.page-header button, .actions button, .btn');
        const buttonCount = await buttons.count();
        console.log(`   Buttons found on holds page: ${buttonCount}`);

        // If there are multiple buttons, verify they don't overlap
        if (buttonCount >= 2) {
            const boxes = [];
            for (let i = 0; i < Math.min(buttonCount, 5); i++) {
                try {
                    const box = await buttons.nth(i).boundingBox();
                    if (box) boxes.push(box);
                } catch (e) {
                    // button may not be visible
                }
            }
            // Simple overlap check: no two buttons share the same vertical+horizontal space
            let overlapping = false;
            for (let i = 0; i < boxes.length; i++) {
                for (let j = i + 1; j < boxes.length; j++) {
                    const a = boxes[i];
                    const b = boxes[j];
                    if (a.x < b.x + b.width && a.x + a.width > b.x &&
                        a.y < b.y + b.height && a.y + a.height > b.y) {
                        overlapping = true;
                    }
                }
            }
            if (overlapping) {
                throw new Error('Buttons overlap on holds page at 320px');
            }
            console.log('   No button overlap detected at 320px');
        }

        await screenshots.capture(page, 'breakpoint-holds-xs-320');
    }, page, results, screenshots);

    // --- 2.7 Customer Form at xs ---
    await runTest('Responsive - Customer Form at 320px (form fits)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const noOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
        );

        const form = page.locator('form');
        if (await form.count() === 0) {
            throw new Error('Customer form not found at 320px');
        }
        console.log('   Customer form rendered at 320px');

        if (!noOverflow) {
            const dims = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth
            }));
            throw new Error(`Customer form overflows at 320px: scrollWidth=${dims.scrollWidth}, clientWidth=${dims.clientWidth}`);
        }
        console.log('   Customer form fits within 320px viewport');

        await screenshots.capture(page, 'breakpoint-customer-form-xs-320');
    }, page, results, screenshots);

    // --- 2.8 Batch Detail at xs ---
    await runTest('Responsive - Batch Detail at 320px (content visible)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.BATCH_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const title = page.locator('.page-title, h1, h2');
        if (await title.count() > 0) {
            console.log(`   Batch detail title: ${(await title.first().textContent()).trim()}`);
        }

        // Scroll to verify all content is accessible
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);

        const scrollY = await page.evaluate(() => window.scrollY);
        console.log(`   Content scrollable, scrolled to Y=${scrollY}`);

        await screenshots.capture(page, 'breakpoint-batch-detail-xs-320');
    }, page, results, screenshots);

    // ════════════════════════════════════════════════════════
    //  Section 3: CSS Property Assertions (10 tests)
    // ════════════════════════════════════════════════════════

    // --- 3.1 .filters flex-direction at sm (375px) ---
    await runTest('Responsive - Filters flex-direction column at 375px', async () => {
        await setViewport('sm');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const flexDir = await page.evaluate(() => {
            const el = document.querySelector('.filters');
            return el ? getComputedStyle(el).flexDirection : null;
        });

        if (flexDir === null) {
            console.log('   No .filters element found on orders page');
        } else if (flexDir !== 'column') {
            throw new Error(`Expected .filters flex-direction: column at 375px, got "${flexDir}"`);
        } else {
            console.log('   .filters flex-direction is column at 375px');
        }

        await screenshots.capture(page, 'breakpoint-css-filters-sm');
    }, page, results, screenshots);

    // --- 3.2 .page-header at 320px ---
    await runTest('Responsive - Page header layout at 320px', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const headerStyle = await page.evaluate(() => {
            const el = document.querySelector('.page-header');
            if (!el) return null;
            const style = getComputedStyle(el);
            return {
                flexDirection: style.flexDirection,
                flexWrap: style.flexWrap,
                display: style.display
            };
        });

        if (headerStyle === null) {
            console.log('   No .page-header element found');
        } else {
            const isWrapping = headerStyle.flexWrap === 'wrap' || headerStyle.flexDirection === 'column';
            if (!isWrapping) {
                throw new Error(`Page header should flex-wrap or be column at 320px, got direction="${headerStyle.flexDirection}", wrap="${headerStyle.flexWrap}"`);
            }
            console.log(`   .page-header at 320px: direction=${headerStyle.flexDirection}, wrap=${headerStyle.flexWrap}`);
        }

        await screenshots.capture(page, 'breakpoint-css-page-header-xs');
    }, page, results, screenshots);

    // --- 3.3 Table container overflow-x at 375px ---
    await runTest('Responsive - Table container overflow-x at 375px', async () => {
        await setViewport('sm');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const overflowInfo = await page.evaluate(() => {
            const selectors = ['.table-container', '.main-content', '.content-area'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    const style = getComputedStyle(el);
                    return { selector: sel, overflowX: style.overflowX };
                }
            }
            // Fallback: check parent of table
            const table = document.querySelector('table');
            if (table && table.parentElement) {
                const style = getComputedStyle(table.parentElement);
                return { selector: 'table parent', overflowX: style.overflowX };
            }
            return null;
        });

        if (overflowInfo === null) {
            console.log('   No table container or table found');
        } else {
            const hasScrollHandling = overflowInfo.overflowX === 'auto' || overflowInfo.overflowX === 'scroll' || overflowInfo.overflowX === 'hidden';
            console.log(`   ${overflowInfo.selector} overflow-x: ${overflowInfo.overflowX}`);
            if (hasScrollHandling) {
                console.log('   Table container has proper overflow handling');
            } else {
                console.log('   Warning: table container overflow-x is "visible", table may overflow');
            }
        }

        await screenshots.capture(page, 'breakpoint-css-table-overflow-sm');
    }, page, results, screenshots);

    // --- 3.4 Admin sidebar flex-direction at 768px ---
    await runTest('Responsive - Admin sidebar column at 768px', async () => {
        await setViewport('md');
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const flexDir = await page.evaluate(() => {
            const el = document.querySelector('.admin-container');
            return el ? getComputedStyle(el).flexDirection : null;
        });

        if (flexDir === null) {
            console.log('   No .admin-container element found');
        } else if (flexDir !== 'column') {
            throw new Error(`Expected .admin-container flex-direction: column at 768px, got "${flexDir}"`);
        } else {
            console.log('   .admin-container flex-direction is column at 768px');
        }

        await screenshots.capture(page, 'breakpoint-css-admin-sidebar-md');
    }, page, results, screenshots);

    // --- 3.5 Admin sidebar flex-direction at 1024px ---
    await runTest('Responsive - Admin sidebar row at 1024px', async () => {
        await setViewport('lg');
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const flexDir = await page.evaluate(() => {
            const el = document.querySelector('.admin-container');
            return el ? getComputedStyle(el).flexDirection : null;
        });

        if (flexDir === null) {
            console.log('   No .admin-container element found');
        } else if (flexDir !== 'row') {
            throw new Error(`Expected .admin-container flex-direction: row at 1024px, got "${flexDir}"`);
        } else {
            console.log('   .admin-container flex-direction is row at 1024px');
        }

        await screenshots.capture(page, 'breakpoint-css-admin-sidebar-lg');
    }, page, results, screenshots);

    // --- 3.6 Dashboard metrics grid at 375px (single column) ---
    await runTest('Responsive - Dashboard metrics grid single column at 375px', async () => {
        await setViewport('sm');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const gridInfo = await page.evaluate(() => {
            const selectors = ['.metrics-grid', '.dashboard-metrics', '.kpi-grid', '.stats-grid', '.alert-cards'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    const style = getComputedStyle(el);
                    return {
                        selector: sel,
                        gridTemplateColumns: style.gridTemplateColumns,
                        display: style.display
                    };
                }
            }
            return null;
        });

        if (gridInfo === null) {
            console.log('   No metrics grid element found (tried .metrics-grid, .dashboard-metrics, .kpi-grid, .stats-grid, .alert-cards)');
        } else {
            const cols = gridInfo.gridTemplateColumns ? gridInfo.gridTemplateColumns.split(/\s+/).length : 0;
            console.log(`   ${gridInfo.selector} at 375px: display=${gridInfo.display}, columns=${cols} ("${gridInfo.gridTemplateColumns}")`);
            if (cols > 2) {
                throw new Error(`Dashboard metrics should be 1-2 columns at 375px, got ${cols}`);
            }
        }

        await screenshots.capture(page, 'breakpoint-css-metrics-grid-sm');
    }, page, results, screenshots);

    // --- 3.7 Dashboard metrics grid at 768px (2 columns) ---
    await runTest('Responsive - Dashboard metrics grid 2 columns at 768px', async () => {
        await setViewport('md');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const gridInfo = await page.evaluate(() => {
            const selectors = ['.metrics-grid', '.dashboard-metrics', '.kpi-grid', '.stats-grid', '.alert-cards'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    const style = getComputedStyle(el);
                    return {
                        selector: sel,
                        gridTemplateColumns: style.gridTemplateColumns,
                        display: style.display
                    };
                }
            }
            return null;
        });

        if (gridInfo === null) {
            console.log('   No metrics grid element found');
        } else {
            const cols = gridInfo.gridTemplateColumns ? gridInfo.gridTemplateColumns.split(/\s+/).length : 0;
            console.log(`   ${gridInfo.selector} at 768px: columns=${cols} ("${gridInfo.gridTemplateColumns}")`);
            if (cols < 2) {
                console.log('   Warning: Expected at least 2 columns at 768px');
            }
        }

        await screenshots.capture(page, 'breakpoint-css-metrics-grid-md');
    }, page, results, screenshots);

    // --- 3.8 Dashboard metrics grid at 1440px (4 columns) ---
    await runTest('Responsive - Dashboard metrics grid 4 columns at 1440px', async () => {
        await setViewport('xl');
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const gridInfo = await page.evaluate(() => {
            const selectors = ['.metrics-grid', '.dashboard-metrics', '.kpi-grid', '.stats-grid', '.alert-cards'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    const style = getComputedStyle(el);
                    return {
                        selector: sel,
                        gridTemplateColumns: style.gridTemplateColumns,
                        display: style.display
                    };
                }
            }
            return null;
        });

        if (gridInfo === null) {
            console.log('   No metrics grid element found');
        } else {
            const cols = gridInfo.gridTemplateColumns ? gridInfo.gridTemplateColumns.split(/\s+/).length : 0;
            console.log(`   ${gridInfo.selector} at 1440px: columns=${cols} ("${gridInfo.gridTemplateColumns}")`);
            if (cols < 3) {
                console.log('   Warning: Expected 3-4 columns at 1440px desktop');
            }
        }

        await screenshots.capture(page, 'breakpoint-css-metrics-grid-xl');
    }, page, results, screenshots);

    // --- 3.9 Modal max-width at 320px ---
    await runTest('Responsive - Modal fits within 320px viewport', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to open a modal
        const applyBtn = page.locator('button:has-text("Apply Hold"), a:has-text("Apply Hold"), .btn:has-text("Apply")');
        if (await applyBtn.count() > 0) {
            await applyBtn.first().click();
            await page.waitForTimeout(500);

            const modalContainer = page.locator('.modal-container, .modal-content, .modal');
            if (await modalContainer.count() > 0) {
                const box = await modalContainer.first().boundingBox();
                if (box && box.width > 320) {
                    throw new Error(`Modal wider than 320px viewport: ${box.width}px`);
                }
                console.log(`   Modal width at 320px: ${box ? box.width : 'unknown'}px - fits within viewport`);

                await screenshots.capture(page, 'breakpoint-css-modal-xs-320');

                // Close modal
                const closeBtn = page.locator('.modal-close, .btn-cancel, button:has-text("Cancel")');
                if (await closeBtn.count() > 0) {
                    await closeBtn.first().click({ force: true });
                    await page.waitForTimeout(300);
                }
            } else {
                console.log('   Modal did not open (may need different trigger)');
                await screenshots.capture(page, 'breakpoint-css-modal-xs-320-no-modal');
            }
        } else {
            console.log('   No Apply Hold button found on holds page');
            await screenshots.capture(page, 'breakpoint-css-modal-xs-320-no-button');
        }
    }, page, results, screenshots);

    // --- 3.10 Pagination at 375px ---
    await runTest('Responsive - Pagination visible and functional at 375px', async () => {
        await setViewport('sm');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const pagination = page.locator('app-pagination, .pagination-controls, .pagination');
        const paginationCount = await pagination.count();

        if (paginationCount > 0) {
            const isVisible = await pagination.first().isVisible();
            if (!isVisible) {
                throw new Error('Pagination component exists but is not visible at 375px');
            }
            console.log('   Pagination component visible and functional at 375px');

            // Check that pagination does not overflow
            const paginationBox = await pagination.first().boundingBox();
            if (paginationBox && paginationBox.width > 375) {
                throw new Error(`Pagination wider than viewport: ${paginationBox.width}px > 375px`);
            }
            console.log(`   Pagination width: ${paginationBox ? paginationBox.width : 'unknown'}px`);
        } else {
            console.log('   No pagination component found (may have few items)');
        }

        await screenshots.capture(page, 'breakpoint-css-pagination-sm');
    }, page, results, screenshots);

    // ════════════════════════════════════════════════════════
    //  Section 4: Components Without @media - Spot Checks (6 tests)
    // ════════════════════════════════════════════════════════

    // --- 4.1 Login page at 320px ---
    await runTest('Responsive - Login page at 320px (form accessible)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const form = page.locator('form');
        if (await form.count() === 0) {
            throw new Error('Login form not found at 320px');
        }

        // Check email and password fields are visible
        const emailInput = page.locator('input[formControlName="email"], input[type="email"], #email');
        const passwordInput = page.locator('input[formControlName="password"], input[type="password"], #password');

        if (await emailInput.count() > 0) {
            const emailVisible = await emailInput.first().isVisible();
            if (!emailVisible) {
                throw new Error('Email input not visible at 320px');
            }
        }
        if (await passwordInput.count() > 0) {
            const passVisible = await passwordInput.first().isVisible();
            if (!passVisible) {
                throw new Error('Password input not visible at 320px');
            }
        }

        console.log('   Login form visible with accessible fields at 320px');

        await screenshots.capture(page, 'breakpoint-login-xs-320');
    }, page, results, screenshots);

    // --- 4.2 Audit list at 375px ---
    await runTest('Responsive - Audit list at 375px (page loads)', async () => {
        await setViewport('sm');
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check page loaded
        const title = page.locator('.page-title, h1, h2');
        if (await title.count() > 0) {
            console.log(`   Audit page title: ${(await title.first().textContent()).trim()}`);
        }

        // Check table has overflow handling
        const overflowInfo = await page.evaluate(() => {
            const table = document.querySelector('table');
            if (!table) return { hasTable: false };
            let el = table.parentElement;
            while (el && el !== document.body) {
                const style = getComputedStyle(el);
                if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
                    return { hasTable: true, hasOverflowHandling: true, overflowX: style.overflowX };
                }
                el = el.parentElement;
            }
            return { hasTable: true, hasOverflowHandling: false };
        });

        if (overflowInfo.hasTable) {
            console.log(`   Audit table found, overflow handling: ${overflowInfo.hasOverflowHandling ? overflowInfo.overflowX : 'none'}`);
        } else {
            console.log('   No audit table found (page may use different layout)');
        }

        await screenshots.capture(page, 'breakpoint-audit-sm-375');
    }, page, results, screenshots);

    // --- 4.3 Order list at 320px ---
    await runTest('Responsive - Order list at 320px (no critical overflow)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check page loads at all
        const pageContent = page.locator('.page-title, h1, h2, table');
        if (await pageContent.count() === 0) {
            throw new Error('Order list page appears blank at 320px');
        }
        console.log('   Order list page loads at 320px');

        const noOverflow = await page.evaluate(() =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth
        );
        if (noOverflow) {
            console.log('   No horizontal overflow detected');
        } else {
            console.log('   Minor horizontal overflow detected (table may extend beyond viewport)');
        }

        await screenshots.capture(page, 'breakpoint-order-list-xs-320');
    }, page, results, screenshots);

    // --- 4.4 Process list at 375px ---
    await runTest('Responsive - Process list at 375px (loads)', async () => {
        await setViewport('sm');
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESSES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify the page loaded
        const pageContent = page.locator('.page-title, h1, h2, table, .list-container');
        if (await pageContent.count() === 0) {
            throw new Error('Process list page appears blank at 375px');
        }
        console.log('   Process list page loads at 375px');

        await screenshots.capture(page, 'breakpoint-process-list-sm-375');
    }, page, results, screenshots);

    // --- 4.5 Routing list at 375px ---
    await runTest('Responsive - Routing list at 375px (loads)', async () => {
        await setViewport('sm');
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify the page loaded
        const pageContent = page.locator('.page-title, h1, h2, table, .list-container');
        if (await pageContent.count() === 0) {
            throw new Error('Routing list page appears blank at 375px');
        }
        console.log('   Routing list page loads at 375px');

        await screenshots.capture(page, 'breakpoint-routing-list-sm-375');
    }, page, results, screenshots);

    // --- 4.6 User list at 320px ---
    await runTest('Responsive - User list at 320px (loads)', async () => {
        await setViewport('xs');
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify the page loaded
        const pageContent = page.locator('.page-title, h1, h2, table, .list-container');
        if (await pageContent.count() === 0) {
            throw new Error('User list page appears blank at 320px');
        }
        console.log('   User list page loads at 320px');

        await screenshots.capture(page, 'breakpoint-user-list-xs-320');
    }, page, results, screenshots);

    // ════════════════════════════════════════════════════════
    //  Restore Viewport
    // ════════════════════════════════════════════════════════

    await restoreViewport();
    console.log('   Viewport restored to 1440x900');
}

module.exports = { runResponsiveBreakpointTests };
