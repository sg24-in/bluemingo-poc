/**
 * MES Production Confirmation - E2E Tests with Before/After Screenshots
 *
 * These tests verify the UI flow and capture before/after screenshots for documentation.
 *
 * Prerequisites:
 *   - Backend running in demo mode: cd backend && ./gradlew bootRun --args="--spring.profiles.active=demo"
 *   - Frontend running: cd frontend && npm start
 *
 * Run tests: node screenshots/e2e-tests.spec.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'e2e');
const BASE_URL = 'http://localhost:4200';
const API_URL = 'http://localhost:8080';

// Test credentials
const TEST_USER = {
    email: 'admin@mes.com',
    password: 'admin123'
};

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper to capture before/after screenshots
async function captureBeforeAfter(page, testName, action) {
    const sanitizedName = testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    // Before screenshot
    await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${sanitizedName}-01-before.png`),
        fullPage: false
    });
    console.log(`   [Before] ${sanitizedName}-01-before.png`);

    // Perform the action
    await action();
    await page.waitForTimeout(500); // Allow UI to settle

    // After screenshot
    await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${sanitizedName}-02-after.png`),
        fullPage: false
    });
    console.log(`   [After]  ${sanitizedName}-02-after.png`);
}

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

async function runTest(name, testFn, page) {
    console.log(`\n[TEST] ${name}`);
    try {
        await testFn();
        testResults.passed++;
        testResults.tests.push({ name, status: 'PASSED' });
        console.log(`   [PASSED]`);
    } catch (error) {
        testResults.failed++;
        testResults.tests.push({ name, status: 'FAILED', error: error.message });
        console.log(`   [FAILED] ${error.message}`);
        // Capture error screenshot
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, `error-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`),
            fullPage: true
        });
    }
}

async function runE2ETests() {
    console.log('='.repeat(60));
    console.log('MES Production Confirmation - E2E Tests');
    console.log('='.repeat(60));

    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-web-security']
    });

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    let accessToken = null;

    // Listen for console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('   [Browser Error]', msg.text());
        }
    });

    try {
        // =========================================================
        // TEST 1: Login Flow
        // =========================================================
        await runTest('Login - Empty Form Display', async () => {
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
            await page.waitForSelector('input[formControlName="email"]', { timeout: 10000 });

            // Verify form elements exist
            const emailInput = await page.locator('input[formControlName="email"]');
            const passwordInput = await page.locator('input[formControlName="password"]');
            const submitButton = await page.locator('button[type="submit"]');

            if (!await emailInput.isVisible()) throw new Error('Email input not visible');
            if (!await passwordInput.isVisible()) throw new Error('Password input not visible');
            if (!await submitButton.isVisible()) throw new Error('Submit button not visible');

            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '01-login-empty-form.png'),
                fullPage: false
            });
        }, page);

        await runTest('Login - Fill Credentials', async () => {
            await captureBeforeAfter(page, '02-login-fill-credentials', async () => {
                await page.fill('input[formControlName="email"]', TEST_USER.email);
                await page.fill('input[formControlName="password"]', TEST_USER.password);
            });
        }, page);

        await runTest('Login - Submit and Authenticate', async () => {
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '03-login-before-submit.png'),
                fullPage: false
            });

            // Submit and capture API response
            const [response] = await Promise.all([
                page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }),
                page.click('button[type="submit"]')
            ]);

            if (response.status() !== 200) {
                throw new Error(`Login failed with status ${response.status()}`);
            }

            const loginData = await response.json();
            accessToken = loginData.accessToken;

            // Inject token into localStorage
            await page.evaluate((data) => {
                localStorage.setItem('mes_token', data.accessToken);
                localStorage.setItem('mes_user', JSON.stringify(data.user));
            }, loginData);

            // Navigate to dashboard
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '03-login-after-submit.png'),
                fullPage: false
            });
        }, page);

        // =========================================================
        // TEST 2: Dashboard
        // =========================================================
        await runTest('Dashboard - View Statistics', async () => {
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '04-dashboard-view.png'),
                fullPage: false
            });

            // Verify dashboard has content
            const pageContent = await page.content();
            if (!pageContent.includes('Dashboard') && !pageContent.includes('dashboard')) {
                throw new Error('Dashboard content not found');
            }
        }, page);

        // =========================================================
        // TEST 3: Orders Module
        // =========================================================
        await runTest('Orders - Navigate to List', async () => {
            await captureBeforeAfter(page, '05-orders-navigate', async () => {
                await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(1000);
            });
        }, page);

        await runTest('Orders - View Order Detail', async () => {
            await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '06-orders-list-before-click.png'),
                fullPage: false
            });

            const orderRows = page.locator('table tbody tr');
            const count = await orderRows.count();

            if (count > 0) {
                await orderRows.first().click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await page.screenshot({
                    path: path.join(SCREENSHOTS_DIR, '06-orders-detail-after-click.png'),
                    fullPage: true
                });
            } else {
                console.log('   [SKIP] No orders found to click');
            }
        }, page);

        // =========================================================
        // TEST 4: Inventory Module
        // =========================================================
        await runTest('Inventory - View List', async () => {
            await captureBeforeAfter(page, '07-inventory-navigate', async () => {
                await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(1000);
            });
        }, page);

        // =========================================================
        // TEST 5: Batches Module
        // =========================================================
        await runTest('Batches - Navigate to List', async () => {
            await captureBeforeAfter(page, '08-batches-navigate', async () => {
                await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(1000);
            });
        }, page);

        await runTest('Batches - View Batch Detail', async () => {
            await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '09-batches-list-before-click.png'),
                fullPage: false
            });

            const batchRows = page.locator('table tbody tr');
            const count = await batchRows.count();

            if (count > 0) {
                await batchRows.first().click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await page.screenshot({
                    path: path.join(SCREENSHOTS_DIR, '09-batches-detail-after-click.png'),
                    fullPage: true
                });
            } else {
                console.log('   [SKIP] No batches found to click');
            }
        }, page);

        // =========================================================
        // TEST 6: Production Confirmation
        // =========================================================
        await runTest('Production - Navigate to Confirmation Form', async () => {
            await captureBeforeAfter(page, '10-production-navigate', async () => {
                await page.goto(`${BASE_URL}/production/confirm`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(1000);
            });
        }, page);

        await runTest('Production - Select Order for Confirmation', async () => {
            await page.goto(`${BASE_URL}/production/confirm`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '11-production-before-select.png'),
                fullPage: false
            });

            // Try to select an order from dropdown
            const orderDropdown = page.locator('select#order, select[formControlName="order"], select[name="order"]');
            if (await orderDropdown.count() > 0) {
                const options = await orderDropdown.locator('option').allTextContents();
                if (options.length > 1) {
                    await orderDropdown.selectOption({ index: 1 });
                    await page.waitForTimeout(1500);

                    await page.screenshot({
                        path: path.join(SCREENSHOTS_DIR, '11-production-after-select.png'),
                        fullPage: true
                    });
                }
            }
        }, page);

        // =========================================================
        // TEST 7: Holds Module
        // =========================================================
        await runTest('Holds - View Active Holds', async () => {
            await captureBeforeAfter(page, '12-holds-navigate', async () => {
                await page.goto(`${BASE_URL}/holds`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(1000);
            });
        }, page);

        // =========================================================
        // TEST 8: Navigation Flow
        // =========================================================
        await runTest('Navigation - Header Menu Flow', async () => {
            // Start from dashboard
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '13-nav-01-dashboard.png'),
                fullPage: false
            });

            // Navigate through menu items if available
            const navLinks = ['orders', 'inventory', 'batches', 'production/confirm', 'holds'];
            let stepNum = 2;

            for (const link of navLinks) {
                try {
                    await page.goto(`${BASE_URL}/${link}`, { waitUntil: 'networkidle' });
                    await page.waitForTimeout(500);
                    await page.screenshot({
                        path: path.join(SCREENSHOTS_DIR, `13-nav-0${stepNum}-${link.replace('/', '-')}.png`),
                        fullPage: false
                    });
                    stepNum++;
                } catch (e) {
                    console.log(`   [SKIP] Could not navigate to /${link}`);
                }
            }
        }, page);

    } catch (error) {
        console.error('\n[FATAL ERROR]', error.message);
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'fatal-error.png'),
            fullPage: true
        });
    } finally {
        await browser.close();
    }

    // Print test summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log('\nScreenshots saved to:', SCREENSHOTS_DIR);

    if (testResults.failed > 0) {
        console.log('\nFailed Tests:');
        testResults.tests
            .filter(t => t.status === 'FAILED')
            .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }

    console.log('='.repeat(60));

    return testResults.failed === 0;
}

// Run the tests
runE2ETests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
