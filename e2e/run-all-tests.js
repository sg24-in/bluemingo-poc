/**
 * MES Production Confirmation - Master E2E Test Runner
 *
 * Runs all E2E tests and captures screenshots for documentation.
 *
 * Usage:
 *   node e2e/run-all-tests.js              # Run without form submissions
 *   node e2e/run-all-tests.js --submit     # Run WITH actual form submissions
 *   node e2e/run-all-tests.js --video      # Record video of test run
 *   node e2e/run-all-tests.js --submit --video  # Both
 *
 * Prerequisites:
 *   - Backend running: cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=demo
 *   - Frontend running: cd frontend && npm start
 */

const { chromium } = require('playwright');
const path = require('path');
const config = require('./config/playwright.config');
const { ScreenshotManager, TestResults, runTest } = require('./utils/test-helpers');

// Import test modules
const { runAuthTests } = require('./tests/01-auth.test');
const { runDashboardTests } = require('./tests/02-dashboard.test');
const { runOrdersTests } = require('./tests/03-orders.test');
const { runProductionTests } = require('./tests/04-production.test');
const { runInventoryTests } = require('./tests/05-inventory.test');
const { runBatchesTests } = require('./tests/06-batches.test');
const { runHoldsTests } = require('./tests/07-holds.test');
const { runEquipmentTests } = require('./tests/08-equipment.test');
const { runQualityTests } = require('./tests/09-quality.test');
const { runPaginationTests } = require('./tests/10-pagination.test');
const { runCrudTests } = require('./tests/11-crud.test');
const { runEntityCrudTests } = require('./tests/12-entity-crud.test');
const { runBomCrudTests } = require('./tests/13-bom-crud.test');
const { runConfigCrudTests } = require('./tests/14-config-crud.test');
const { runAuditHistoryTests } = require('./tests/15-audit-history.test');
const { runOperatorsTests } = require('./tests/16-operators.test');
const { runOperationsTests } = require('./tests/17-operations.test');
const { runProcessesTests } = require('./tests/18-processes.test');
const { runUserProfileTests } = require('./tests/19-user-profile.test');
const { runUsersTests } = require('./tests/20-users.test');

// Parse command line arguments
const args = process.argv.slice(2);
const submitActions = args.includes('--submit');
const recordVideo = args.includes('--video');

async function runAllTests() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, 'output', 'screenshots', timestamp);
    const videoDir = path.join(__dirname, 'output', 'videos', timestamp);

    console.log('═'.repeat(70));
    console.log('MES PRODUCTION CONFIRMATION - E2E TEST SUITE');
    console.log('═'.repeat(70));
    console.log(`Mode: ${submitActions ? 'WITH SUBMISSIONS' : 'READ-ONLY'}`);
    console.log(`Video: ${recordVideo ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Output: ${outputDir}`);
    console.log('═'.repeat(70));

    // Initialize browser
    const browser = await chromium.launch({
        headless: config.browser.headless,
        args: config.browser.args,
        slowMo: config.browser.slowMo
    });

    const contextOptions = {
        viewport: config.viewport,
        deviceScaleFactor: config.viewport.deviceScaleFactor
    };

    if (recordVideo) {
        contextOptions.recordVideo = {
            dir: videoDir,
            size: config.video.size
        };
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // Global dialog handler
    page.on('dialog', async dialog => {
        console.log(`   📢 Dialog: ${dialog.message()}`);
        await dialog.accept();
    });

    // Console error listener
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('   [Browser Error]', msg.text());
        }
    });

    const screenshots = new ScreenshotManager(outputDir);
    const results = new TestResults();

    try {
        // Login first
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SETUP: LOGIN');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle' });
        await page.fill('input[formControlName="email"]', config.credentials.admin.email);
        await page.fill('input[formControlName="password"]', config.credentials.admin.password);

        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }),
            page.click('button[type="submit"]')
        ]);

        if (response.status() === 200) {
            const loginData = await response.json();
            await page.evaluate((data) => {
                localStorage.setItem('mes_token', data.accessToken);
                localStorage.setItem('mes_user', JSON.stringify(data.user));
            }, loginData);
            console.log('   ✅ Login successful');
        } else {
            throw new Error('Login failed');
        }

        // Run all test modules
        await runAuthTests(page, screenshots, results, runTest);
        await runDashboardTests(page, screenshots, results, runTest);
        await runOrdersTests(page, screenshots, results, runTest);
        await runProductionTests(page, screenshots, results, runTest);
        await runInventoryTests(page, screenshots, results, runTest, submitActions);
        await runBatchesTests(page, screenshots, results, runTest);
        await runHoldsTests(page, screenshots, results, runTest, submitActions);
        await runEquipmentTests(page, screenshots, results, runTest, submitActions);
        await runQualityTests(page, screenshots, results, runTest, submitActions);
        await runPaginationTests(page, screenshots, results, runTest);
        await runCrudTests(page, screenshots, results, runTest, submitActions);
        await runEntityCrudTests(page, screenshots, results, runTest, submitActions);
        await runBomCrudTests(page, screenshots, results, runTest, submitActions);
        await runConfigCrudTests(page, screenshots, results, runTest, submitActions);
        await runAuditHistoryTests(page, screenshots, results, runTest, submitActions);
        await runOperatorsTests(page, screenshots, results, runTest, submitActions);
        await runOperationsTests(page, screenshots, results, runTest, submitActions);
        await runProcessesTests(page, screenshots, results, runTest, submitActions);
        await runUserProfileTests(page, screenshots, results, runTest, submitActions);
        await runUsersTests(page, screenshots, results, runTest, submitActions);

        // Navigation flow test
        console.log('\n' + '─'.repeat(50));
        console.log('📂 NAVIGATION FLOW');
        console.log('─'.repeat(50));

        await runTest('Navigation - Complete Flow', async () => {
            const routes = [
                { path: '/#/dashboard', name: 'dashboard' },
                { path: '/#/orders', name: 'orders' },
                { path: '/#/inventory', name: 'inventory' },
                { path: '/#/batches', name: 'batches' },
                { path: '/#/production/confirm', name: 'production' },
                { path: '/#/holds', name: 'holds' },
                { path: '/#/equipment', name: 'equipment' },
                { path: '/#/processes/list', name: 'processes' },
                { path: '/#/processes/quality-pending', name: 'quality-pending' },
                { path: '/#/operations', name: 'operations' },
                { path: '/#/profile', name: 'profile' },
                { path: '/#/change-password', name: 'change-password' },
                { path: '/#/manage/customers', name: 'admin-customers' },
                { path: '/#/manage/materials', name: 'admin-materials' },
                { path: '/#/manage/products', name: 'admin-products' },
                { path: '/#/manage/bom', name: 'admin-bom' },
                { path: '/#/manage/operators', name: 'admin-operators' },
                { path: '/#/manage/users', name: 'admin-users' },
                { path: '/#/manage/config/hold-reasons', name: 'config-hold-reasons' },
                { path: '/#/manage/config/delay-reasons', name: 'config-delay-reasons' },
                { path: '/#/manage/config/process-params', name: 'config-process-params' },
                { path: '/#/manage/config/batch-number', name: 'config-batch-number' },
                { path: '/#/manage/config/quantity-type', name: 'config-quantity-type' },
                { path: '/#/manage/audit', name: 'audit' },
                { path: '/#/production/history', name: 'production-history' }
            ];

            for (const route of routes) {
                await page.goto(`${config.baseUrl}${route.path}`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(500);
                await screenshots.capture(page, `nav-${route.name}`);
            }
        }, page, results, screenshots);

    } catch (error) {
        console.error('\n[FATAL ERROR]', error.message);
        await screenshots.capture(page, 'fatal-error', { fullPage: true });
    } finally {
        await context.close();
        await browser.close();
    }

    // Print summary
    results.printSummary();
    console.log(`📁 Screenshots: ${outputDir}`);
    if (recordVideo) {
        console.log(`🎬 Videos: ${videoDir}`);
    }
    console.log('═'.repeat(70));

    return results.failed === 0;
}

// Run
runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
