/**
 * Authentication Tests
 * Tests login flow, validation errors, and logout
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runAuthTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 AUTHENTICATION TESTS');
    console.log('─'.repeat(50));

    // Helper to clear auth state
    async function clearAuthState() {
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
    }

    // Test 1: Empty form display
    await runTest('Auth - Login Page Display', async () => {
        await clearAuthState();
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
        await page.waitForSelector(SELECTORS.login.emailInput, { timeout: 10000 });

        const emailInput = page.locator(SELECTORS.login.emailInput);
        const passwordInput = page.locator(SELECTORS.login.passwordInput);
        const submitButton = page.locator(SELECTORS.login.submitButton);

        if (!await emailInput.isVisible()) throw new Error('Email input not visible');
        if (!await passwordInput.isVisible()) throw new Error('Password input not visible');
        if (!await submitButton.isVisible()) throw new Error('Submit button not visible');

        await screenshots.capture(page, 'login-page-empty');
    }, page, results, screenshots);

    // Test 2: Invalid email format (shows validation, button disabled)
    await runTest('Auth - Invalid Email Validation', async () => {
        await clearAuthState();
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
        await page.waitForSelector(SELECTORS.login.emailInput, { timeout: 10000 });

        // Enter invalid email
        await page.fill(SELECTORS.login.emailInput, 'invalid-email');
        // Click elsewhere to trigger validation
        await page.fill(SELECTORS.login.passwordInput, 'password123');
        // Click back on email to blur and show validation
        await page.click(SELECTORS.login.emailInput);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);

        // Verify button is disabled (form invalid)
        const submitBtn = page.locator(SELECTORS.login.submitButton);
        const isDisabled = await submitBtn.isDisabled();
        if (!isDisabled) {
            throw new Error('Submit button should be disabled with invalid email');
        }

        await screenshots.capture(page, 'login-invalid-email-error');
    }, page, results, screenshots);

    // Test 3: Wrong credentials error
    await runTest('Auth - Wrong Credentials Error', async () => {
        await clearAuthState();
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
        await page.waitForSelector(SELECTORS.login.emailInput, { timeout: 10000 });

        await page.fill(SELECTORS.login.emailInput, 'wrong@email.com');
        await page.fill(SELECTORS.login.passwordInput, 'wrongpassword');

        await screenshots.capture(page, 'login-wrong-creds-before');

        await page.click(SELECTORS.login.submitButton);
        await page.waitForTimeout(1500);

        await screenshots.capture(page, 'login-wrong-creds-error');
    }, page, results, screenshots);

    // Test 4: Successful login
    await runTest('Auth - Successful Login', async () => {
        await clearAuthState();
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
        await page.waitForSelector(SELECTORS.login.emailInput, { timeout: 10000 });

        await page.fill(SELECTORS.login.emailInput, config.credentials.admin.email);
        await page.fill(SELECTORS.login.passwordInput, config.credentials.admin.password);

        await screenshots.capture(page, 'login-credentials-filled');

        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }),
            page.click(SELECTORS.login.submitButton)
        ]);

        if (response.status() !== 200) {
            throw new Error(`Login failed with status ${response.status()}`);
        }

        const loginData = await response.json();
        await page.evaluate((data) => {
            localStorage.setItem('mes_token', data.accessToken);
            localStorage.setItem('mes_user', JSON.stringify(data.user));
        }, loginData);

        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'login-success-dashboard');
    }, page, results, screenshots);

    // Test 5: Logout
    await runTest('Auth - Logout Flow', async () => {
        // Re-login if needed
        const isLoggedIn = await page.evaluate(() => {
            return !!localStorage.getItem('mes_token');
        });

        if (!isLoggedIn) {
            await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
            await page.fill(SELECTORS.login.emailInput, config.credentials.admin.email);
            await page.fill(SELECTORS.login.passwordInput, config.credentials.admin.password);

            const [response] = await Promise.all([
                page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }),
                page.click(SELECTORS.login.submitButton)
            ]);

            const loginData = await response.json();
            await page.evaluate((data) => {
                localStorage.setItem('mes_token', data.accessToken);
                localStorage.setItem('mes_user', JSON.stringify(data.user));
            }, loginData);
        }

        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'logout-before');

        const logoutBtn = page.locator('button:has-text("Logout"), .logout-btn');
        if (await logoutBtn.count() > 0) {
            await logoutBtn.first().click();
            await page.waitForTimeout(1000);
        }

        await screenshots.capture(page, 'logout-after');

        // Re-login for subsequent tests
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
        await page.fill(SELECTORS.login.emailInput, config.credentials.admin.email);
        await page.fill(SELECTORS.login.passwordInput, config.credentials.admin.password);

        const [response] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }),
            page.click(SELECTORS.login.submitButton)
        ]);

        const loginData = await response.json();
        await page.evaluate((data) => {
            localStorage.setItem('mes_token', data.accessToken);
            localStorage.setItem('mes_user', JSON.stringify(data.user));
        }, loginData);
    }, page, results, screenshots);
}

module.exports = { runAuthTests };
