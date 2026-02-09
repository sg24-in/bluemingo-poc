/**
 * Comprehensive Screenshot Capture for User Guide
 * Captures every screen, panel, button, status color, and action
 * Output: e2e/output/user-guide-screenshots/{timestamp}/
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const CREDS = { email: 'admin@mes.com', password: 'admin123' };

let outputDir;
let counter = 0;

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function screenshot(page, name, opts = {}) {
    counter++;
    const num = String(counter).padStart(3, '0');
    const safeName = name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const filename = `${num}-${safeName}.png`;
    const filepath = path.join(outputDir, filename);

    if (opts.locator) {
        // Element-specific screenshot (cropped)
        try {
            await opts.locator.screenshot({ path: filepath });
        } catch (e) {
            // Fallback to full page if element not found
            await page.screenshot({ path: filepath, fullPage: opts.fullPage || false });
        }
    } else {
        await page.screenshot({ path: filepath, fullPage: opts.fullPage || false });
    }
    console.log(`  [${num}] ${name}`);
    return filename;
}

async function login(page) {
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('input[formControlName="email"]', CREDS.email);
    await page.fill('input[formControlName="password"]', CREDS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
}

async function run() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    outputDir = path.join(__dirname, 'output', 'user-guide-screenshots', timestamp);
    ensureDir(outputDir);

    console.log(`\nCapturing screenshots to: ${outputDir}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
        // =====================================================
        // SECTION 1: LOGIN
        // =====================================================
        console.log('\n--- 1. LOGIN ---');
        await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await screenshot(page, 'login-page-empty');

        // Fill email only
        await page.fill('input[formControlName="email"]', CREDS.email);
        await screenshot(page, 'login-email-entered');

        // Fill password
        await page.fill('input[formControlName="password"]', CREDS.password);
        await screenshot(page, 'login-credentials-filled');

        // Login form area cropped
        const loginForm = page.locator('.login-container, .login-form, form').first();
        await screenshot(page, 'login-form-cropped', { locator: loginForm });

        // Click login
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await screenshot(page, 'login-success-redirect-dashboard');

        // =====================================================
        // SECTION 2: DASHBOARD
        // =====================================================
        console.log('\n--- 2. DASHBOARD ---');
        await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await screenshot(page, 'dashboard-full-view', { fullPage: true });

        // Header/Navigation bar
        const header = page.locator('app-header, .main-header, header').first();
        await screenshot(page, 'dashboard-header-navigation', { locator: header });

        // Stats cards section
        const statsSection = page.locator('.stats-cards, .stats-section, .dashboard-stats').first();
        if (await statsSection.count() > 0) {
            await screenshot(page, 'dashboard-stats-cards', { locator: statsSection });
        }

        // Individual stat cards
        const statCards = page.locator('.stat-card, .stats-card, .card');
        const cardCount = await statCards.count();
        for (let i = 0; i < Math.min(cardCount, 6); i++) {
            await screenshot(page, `dashboard-stat-card-${i + 1}`, { locator: statCards.nth(i) });
        }

        // Chart areas
        const charts = page.locator('.chart-container, [echarts], .echarts-container, canvas');
        const chartCount = await charts.count();
        for (let i = 0; i < Math.min(chartCount, 4); i++) {
            await screenshot(page, `dashboard-chart-${i + 1}`, { locator: charts.nth(i) });
        }

        // Recent activity / audit trail section
        const auditSection = page.locator('.recent-activity, .audit-trail, .activity-section').first();
        if (await auditSection.count() > 0) {
            await screenshot(page, 'dashboard-recent-activity', { locator: auditSection });
        }

        // =====================================================
        // SECTION 3: ORDERS
        // =====================================================
        console.log('\n--- 3. ORDERS ---');
        await page.goto(`${BASE_URL}/#/orders`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'orders-list-full', { fullPage: true });

        // Filter area
        const orderFilters = page.locator('.filters, .filter-section, .search-filter').first();
        if (await orderFilters.count() > 0) {
            await screenshot(page, 'orders-filter-area', { locator: orderFilters });
        }

        // Orders table
        const orderTable = page.locator('table').first();
        if (await orderTable.count() > 0) {
            await screenshot(page, 'orders-table', { locator: orderTable });
        }

        // Status badges in table (capture first few rows showing different statuses)
        const statusBadges = page.locator('.status-badge, app-status-badge');
        if (await statusBadges.count() > 0) {
            // Take a wider crop of the first few badges
            for (let i = 0; i < Math.min(await statusBadges.count(), 5); i++) {
                await screenshot(page, `orders-status-badge-${i + 1}`, { locator: statusBadges.nth(i) });
            }
        }

        // Pagination
        const pagination = page.locator('app-pagination, .pagination').first();
        if (await pagination.count() > 0) {
            await screenshot(page, 'orders-pagination', { locator: pagination });
        }

        // Filter by IN_PROGRESS
        const statusFilter = page.locator('select#status-filter, select[name="status"]').first();
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('IN_PROGRESS').catch(() => {});
            await page.waitForTimeout(1000);
            await screenshot(page, 'orders-filtered-in-progress');
        }

        // Reset filter
        if (await statusFilter.count() > 0) {
            await statusFilter.selectOption('').catch(() => {});
            await page.waitForTimeout(500);
        }

        // Order Detail - IN_PROGRESS order (order 1)
        await page.goto(`${BASE_URL}/#/orders/1`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await screenshot(page, 'order-detail-in-progress-full', { fullPage: true });

        // Page header with status badge and buttons
        const pageHeader = page.locator('.page-header, .page-header-actions').first();
        if (await pageHeader.count() > 0) {
            await screenshot(page, 'order-detail-header-with-buttons', { locator: pageHeader });
        }

        // Order info cards
        const orderInfoCards = page.locator('.order-info, .info-cards, .detail-cards').first();
        if (await orderInfoCards.count() > 0) {
            await screenshot(page, 'order-detail-info-cards', { locator: orderInfoCards });
        }

        // Line items section
        const lineItemsSection = page.locator('.line-items-section, .order-items').first();
        if (await lineItemsSection.count() > 0) {
            await screenshot(page, 'order-detail-line-items', { locator: lineItemsSection });
        }

        // Process flow chart
        const flowChart = page.locator('.process-flow-container').first();
        if (await flowChart.count() > 0) {
            await screenshot(page, 'order-detail-process-flow', { locator: flowChart });
        }

        // Order Detail - COMPLETED order (order 5)
        await page.goto(`${BASE_URL}/#/orders/5`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'order-detail-completed', { fullPage: true });

        // Multi-stage order (order 42 - 4 processes)
        await page.goto(`${BASE_URL}/#/orders/42`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await screenshot(page, 'order-detail-multi-stage-4proc', { fullPage: true });

        // Process flow for multi-stage
        if (await flowChart.count() > 0) {
            await screenshot(page, 'order-multi-stage-flow-chart', { locator: flowChart });
        }

        // Order Detail - ON_HOLD (order 8)
        await page.goto(`${BASE_URL}/#/orders/8`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'order-detail-on-hold');

        // Order Creation Form
        await page.goto(`${BASE_URL}/#/orders/new`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'order-create-form-empty', { fullPage: true });

        // =====================================================
        // SECTION 4: PRODUCTION
        // =====================================================
        console.log('\n--- 4. PRODUCTION ---');
        await page.goto(`${BASE_URL}/#/production`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'production-landing-page');

        // Available orders for production
        const availableOrders = page.locator('.available-orders, .order-selection, table').first();
        if (await availableOrders.count() > 0) {
            await screenshot(page, 'production-available-orders', { locator: availableOrders });
        }

        // Production Confirm - navigate to a READY operation
        await page.goto(`${BASE_URL}/#/production/confirm/6`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await screenshot(page, 'production-confirm-form', { fullPage: true });

        // Operation info header
        const opHeader = page.locator('.operation-info, .confirm-header, .card').first();
        if (await opHeader.count() > 0) {
            await screenshot(page, 'production-operation-info', { locator: opHeader });
        }

        // Equipment selection
        const equipSection = page.locator('.equipment-section, .equipment-list').first();
        if (await equipSection.count() > 0) {
            await screenshot(page, 'production-equipment-selection', { locator: equipSection });
        }

        // Operator selection
        const operatorSection = page.locator('.operator-section, .operator-list').first();
        if (await operatorSection.count() > 0) {
            await screenshot(page, 'production-operator-selection', { locator: operatorSection });
        }

        // Process parameters section
        const paramsSection = page.locator('.process-parameters, .parameters-section').first();
        if (await paramsSection.count() > 0) {
            await screenshot(page, 'production-process-parameters', { locator: paramsSection });
        }

        // Material consumption section
        const materialSection = page.locator('.material-consumption, .consumption-section').first();
        if (await materialSection.count() > 0) {
            await screenshot(page, 'production-material-consumption', { locator: materialSection });
        }

        // BOM Suggestions section
        const bomSection = page.locator('.bom-suggestions, .suggested-consumption').first();
        if (await bomSection.count() > 0) {
            await screenshot(page, 'production-bom-suggestions', { locator: bomSection });
        }

        // Available Inventory section
        const availInv = page.locator('.available-materials, .available-inventory').first();
        if (await availInv.count() > 0) {
            await screenshot(page, 'production-available-inventory', { locator: availInv });
        }

        // Batch preview section
        const batchPreview = page.locator('.batch-number-preview, .batch-preview').first();
        if (await batchPreview.count() > 0) {
            await screenshot(page, 'production-batch-number-preview', { locator: batchPreview });
        }

        // Submit button area
        const submitArea = page.locator('.form-actions, .submit-section, button:has-text("Confirm")').first();
        if (await submitArea.count() > 0) {
            await screenshot(page, 'production-submit-button', { locator: submitArea });
        }

        // Production History
        await page.goto(`${BASE_URL}/#/production/history`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'production-history-list', { fullPage: true });

        // =====================================================
        // SECTION 5: INVENTORY
        // =====================================================
        console.log('\n--- 5. INVENTORY ---');
        await page.goto(`${BASE_URL}/#/inventory`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'inventory-list-full', { fullPage: true });

        // Status summary cards
        const invStatusCards = page.locator('.status-cards, .inventory-summary, .summary-cards').first();
        if (await invStatusCards.count() > 0) {
            await screenshot(page, 'inventory-status-cards', { locator: invStatusCards });
        }

        // Filter area
        const invFilters = page.locator('.filters, .filter-section').first();
        if (await invFilters.count() > 0) {
            await screenshot(page, 'inventory-filter-area', { locator: invFilters });
        }

        // Inventory table
        const invTable = page.locator('table').first();
        if (await invTable.count() > 0) {
            await screenshot(page, 'inventory-table', { locator: invTable });
        }

        // Filter by AVAILABLE
        const invStateFilter = page.locator('select#status-filter, select[name="status"]').first();
        if (await invStateFilter.count() > 0) {
            await invStateFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(800);
            await screenshot(page, 'inventory-filtered-available');
            // Reset
            await invStateFilter.selectOption('').catch(() => {});
            await page.waitForTimeout(500);
        }

        // Filter by type RM
        const invTypeFilter = page.locator('select#type-filter, select[name="type"]').first();
        if (await invTypeFilter.count() > 0) {
            await invTypeFilter.selectOption('RM').catch(() => {});
            await page.waitForTimeout(800);
            await screenshot(page, 'inventory-filtered-type-rm');
            await invTypeFilter.selectOption('').catch(() => {});
            await page.waitForTimeout(500);
        }

        // Receive Material page
        await page.goto(`${BASE_URL}/#/inventory/receive`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'inventory-receive-material-form', { fullPage: true });

        // =====================================================
        // SECTION 6: BATCHES
        // =====================================================
        console.log('\n--- 6. BATCHES ---');
        await page.goto(`${BASE_URL}/#/batches`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'batches-list-full', { fullPage: true });

        // Batch filters
        const batchFilters = page.locator('.filters, .filter-section').first();
        if (await batchFilters.count() > 0) {
            await screenshot(page, 'batches-filter-area', { locator: batchFilters });
        }

        // Batch table
        const batchTable = page.locator('table').first();
        if (await batchTable.count() > 0) {
            await screenshot(page, 'batches-table', { locator: batchTable });
        }

        // Batch Detail page (batch 1)
        await page.goto(`${BASE_URL}/#/batches/1`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'batch-detail-full', { fullPage: true });

        // Batch genealogy section
        const genealogy = page.locator('.genealogy, .batch-genealogy, .genealogy-section').first();
        if (await genealogy.count() > 0) {
            await screenshot(page, 'batch-genealogy-tree', { locator: genealogy });
        }

        // Batch with full chain (FG batch)
        await page.goto(`${BASE_URL}/#/batches/22`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'batch-detail-finished-goods', { fullPage: true });

        // =====================================================
        // SECTION 7: HOLDS
        // =====================================================
        console.log('\n--- 7. HOLDS ---');
        await page.goto(`${BASE_URL}/#/holds`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'holds-list-full', { fullPage: true });

        // Hold filters
        const holdFilters = page.locator('.filters, .filter-section').first();
        if (await holdFilters.count() > 0) {
            await screenshot(page, 'holds-filter-area', { locator: holdFilters });
        }

        // Hold table
        const holdTable = page.locator('table').first();
        if (await holdTable.count() > 0) {
            await screenshot(page, 'holds-table', { locator: holdTable });
        }

        // Hold status badges
        const holdBadges = page.locator('.status-badge, app-status-badge');
        if (await holdBadges.count() > 0) {
            await screenshot(page, 'holds-status-badge-active', { locator: holdBadges.first() });
        }

        // =====================================================
        // SECTION 8: EQUIPMENT
        // =====================================================
        console.log('\n--- 8. EQUIPMENT ---');
        await page.goto(`${BASE_URL}/#/equipment`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'equipment-list-full', { fullPage: true });

        // Equipment status summary
        const equipStatusCards = page.locator('.status-cards, .equipment-summary, .summary-cards').first();
        if (await equipStatusCards.count() > 0) {
            await screenshot(page, 'equipment-status-summary', { locator: equipStatusCards });
        }

        // Equipment table
        const equipTable = page.locator('table').first();
        if (await equipTable.count() > 0) {
            await screenshot(page, 'equipment-table', { locator: equipTable });
        }

        // =====================================================
        // SECTION 9: ADMIN PAGES
        // =====================================================
        console.log('\n--- 9. ADMIN PAGES ---');

        // Customers
        await page.goto(`${BASE_URL}/#/manage/customers`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-customers-list', { fullPage: true });

        // Admin sidebar
        const adminSidebar = page.locator('.admin-sidebar, .sidebar, aside').first();
        if (await adminSidebar.count() > 0) {
            await screenshot(page, 'admin-sidebar-navigation', { locator: adminSidebar });
        }

        // Materials
        await page.goto(`${BASE_URL}/#/manage/materials`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-materials-list', { fullPage: true });

        // Products
        await page.goto(`${BASE_URL}/#/manage/products`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-products-list', { fullPage: true });

        // Processes
        await page.goto(`${BASE_URL}/#/manage/processes`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-processes-list', { fullPage: true });

        // Routing
        await page.goto(`${BASE_URL}/#/manage/routing`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-routing-list', { fullPage: true });

        // Equipment management
        await page.goto(`${BASE_URL}/#/manage/equipment`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-equipment-list');

        // Operators
        await page.goto(`${BASE_URL}/#/manage/operators`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-operators-list', { fullPage: true });

        // BOM
        await page.goto(`${BASE_URL}/#/manage/bom`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-bom-list', { fullPage: true });

        // BOM Tree view
        await page.goto(`${BASE_URL}/#/manage/bom/HR-COIL-2MM/tree`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'admin-bom-tree-hr-coil', { fullPage: true });

        // Config - Hold Reasons
        await page.goto(`${BASE_URL}/#/manage/config/hold-reasons`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-config-hold-reasons');

        // Config - Process Parameters
        await page.goto(`${BASE_URL}/#/manage/config/process-params`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-config-process-params', { fullPage: true });

        // Config - Batch Number
        await page.goto(`${BASE_URL}/#/manage/config/batch-number`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-config-batch-number', { fullPage: true });

        // Users
        await page.goto(`${BASE_URL}/#/manage/users`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-users-list');

        // Audit Trail
        await page.goto(`${BASE_URL}/#/manage/audit`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'admin-audit-trail', { fullPage: true });

        // Operation Templates
        await page.goto(`${BASE_URL}/#/manage/operation-templates`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await screenshot(page, 'admin-operation-templates', { fullPage: true });

        // =====================================================
        // SECTION 10: FORM EXAMPLES (Create forms)
        // =====================================================
        console.log('\n--- 10. FORM EXAMPLES ---');

        // Customer create form
        await page.goto(`${BASE_URL}/#/manage/customers/new`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await screenshot(page, 'form-customer-create', { fullPage: true });

        // Material create form
        await page.goto(`${BASE_URL}/#/manage/materials/new`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await screenshot(page, 'form-material-create', { fullPage: true });

        // Product create form
        await page.goto(`${BASE_URL}/#/manage/products/new`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await screenshot(page, 'form-product-create', { fullPage: true });

        // =====================================================
        // SECTION 11: STATUS COLOR REFERENCE
        // =====================================================
        console.log('\n--- 11. STATUS COLOR REFERENCE ---');

        // Orders with different statuses - go back to order list
        await page.goto(`${BASE_URL}/#/orders`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'status-colors-orders-overview');

        // Inventory with different states
        await page.goto(`${BASE_URL}/#/inventory`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'status-colors-inventory-overview');

        // Equipment with different statuses
        await page.goto(`${BASE_URL}/#/equipment`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await screenshot(page, 'status-colors-equipment-overview');

        // =====================================================
        // SECTION 12: NAVIGATION & USER ACTIONS
        // =====================================================
        console.log('\n--- 12. NAVIGATION & USER ACTIONS ---');

        // Header with navigation links
        await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        const navBar = page.locator('nav, .main-nav, .navbar').first();
        if (await navBar.count() > 0) {
            await screenshot(page, 'navigation-bar', { locator: navBar });
        }

        // User menu
        const userMenu = page.locator('.user-menu, .user-dropdown').first();
        if (await userMenu.count() > 0) {
            await screenshot(page, 'user-menu-area', { locator: userMenu });
        }

        console.log(`\n=== Screenshot capture complete ===`);
        console.log(`Total screenshots: ${counter}`);
        console.log(`Output: ${outputDir}`);

    } catch (error) {
        console.error('Error during screenshot capture:', error.message);
        await screenshot(page, 'error-state');
    } finally {
        await browser.close();
    }

    // Write manifest file
    const manifest = {
        timestamp,
        totalScreenshots: counter,
        outputDir,
        sections: {
            login: '001-005',
            dashboard: '006-015',
            orders: '016-030',
            production: '031-045',
            inventory: '046-055',
            batches: '056-062',
            holds: '063-067',
            equipment: '068-072',
            admin: '073-090',
            forms: '091-093',
            statusColors: '094-096',
            navigation: '097-098'
        }
    };
    fs.writeFileSync(
        path.join(outputDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
}

run().catch(console.error);
