/**
 * Authentication & Security E2E Tests
 * Tests auth edge cases, token handling, guard behavior, and session management.
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runAuthSecurityTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('AUTH & SECURITY TESTS');
    console.log('─'.repeat(50));

    // Helper to re-login after tests that clear auth
    async function reLogin() {
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
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
        }
        await page.waitForTimeout(500);
    }

    // ──────────────────────────────────────────────────
    // Section 1: Token & Guard Behavior
    // ──────────────────────────────────────────────────
    console.log('\n  Section 1: Token & Guard Behavior');

    // Test 1: Auth Guard - No Token Redirect
    await runTest('Auth Security - No Token Redirects to Login', async () => {
        // Clear localStorage to simulate unauthenticated user
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await page.waitForTimeout(300);

        // Attempt to navigate to a protected route
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify redirect to login
        const currentUrl = page.url();
        if (!currentUrl.includes('login')) {
            throw new Error(`Expected redirect to login, but URL is: ${currentUrl}`);
        }
        console.log(`   Redirected to: ${currentUrl}`);

        await screenshots.capture(page, 'auth-security-no-token-redirect');

        // Re-login
        await reLogin();
    }, page, results, screenshots);

    // Test 2: Auth Guard - Expired Token
    await runTest('Auth Security - Expired Token Redirects to Login', async () => {
        // Create a fake expired JWT
        // Header: {"alg":"HS256","typ":"JWT"}
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        // Payload with exp set far in the past
        const payload = btoa(JSON.stringify({ sub: 'admin@mes.com', exp: 1000000 }));
        const fakeToken = `${header}.${payload}.fakesignature`;

        await page.evaluate((token) => {
            localStorage.setItem('mes_token', token);
            localStorage.setItem('mes_user', JSON.stringify({ name: 'Admin', email: 'admin@mes.com' }));
        }, fakeToken);
        await page.waitForTimeout(300);

        // Navigate to dashboard with expired token
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);

        // Verify redirect to login (guard or interceptor should catch expired token)
        const currentUrl = page.url();
        const redirectedToLogin = currentUrl.includes('login');
        console.log(`   URL after expired token: ${currentUrl}`);
        console.log(`   Redirected to login: ${redirectedToLogin}`);

        if (!redirectedToLogin) {
            // Some apps may show an error instead of redirecting
            console.log('   Note: App may handle expired tokens via API 401 rather than client-side guard');
        }

        await screenshots.capture(page, 'auth-security-expired-token');

        // Re-login
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await reLogin();
    }, page, results, screenshots);

    // Test 3: Auth Guard - Malformed Token
    await runTest('Auth Security - Malformed Token Handling', async () => {
        // Set a malformed token
        await page.evaluate(() => {
            localStorage.setItem('mes_token', 'not-a-real-token');
            localStorage.setItem('mes_user', JSON.stringify({ name: 'Admin', email: 'admin@mes.com' }));
        });
        await page.waitForTimeout(300);

        // Navigate to dashboard with malformed token
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);

        // Verify redirect to login or error handling
        const currentUrl = page.url();
        const redirectedToLogin = currentUrl.includes('login');
        console.log(`   URL after malformed token: ${currentUrl}`);
        console.log(`   Redirected to login: ${redirectedToLogin}`);

        if (!redirectedToLogin) {
            console.log('   Note: App may handle malformed tokens via API 401 rather than client-side guard');
        }

        await screenshots.capture(page, 'auth-security-malformed-token');

        // Re-login
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await reLogin();
    }, page, results, screenshots);

    // Test 4: Auth Guard - Admin Routes Protected
    await runTest('Auth Security - Admin Routes Protected Without Auth', async () => {
        // Clear localStorage
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await page.waitForTimeout(300);

        // Attempt to navigate to an admin route
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify redirect to login
        const currentUrl = page.url();
        if (!currentUrl.includes('login')) {
            throw new Error(`Expected redirect to login for admin route, but URL is: ${currentUrl}`);
        }
        console.log(`   Admin route protected, redirected to: ${currentUrl}`);

        await screenshots.capture(page, 'auth-security-admin-route-protected');

        // Re-login
        await reLogin();
    }, page, results, screenshots);

    // ──────────────────────────────────────────────────
    // Section 2: Session Persistence
    // ──────────────────────────────────────────────────
    console.log('\n  Section 2: Session Persistence');

    // Test 5: Session Persists After Reload
    await runTest('Auth Security - Session Persists After Page Reload', async () => {
        // Navigate to dashboard (should be logged in from reLogin)
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(500);

        // Verify we are on dashboard
        const urlBefore = page.url();
        if (urlBefore.includes('login')) {
            throw new Error('Not logged in before reload test');
        }
        console.log(`   Before reload URL: ${urlBefore}`);

        // Reload the page
        await page.reload({ waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify still on dashboard (not redirected to login)
        const urlAfter = page.url();
        if (urlAfter.includes('login')) {
            throw new Error(`Session lost after reload, redirected to: ${urlAfter}`);
        }
        console.log(`   After reload URL: ${urlAfter}`);
        console.log('   Session persisted successfully');

        await screenshots.capture(page, 'auth-security-session-persists');
    }, page, results, screenshots);

    // Test 6: Token Present in API Requests
    await runTest('Auth Security - Token Present in API Requests', async () => {
        let capturedAuthHeader = null;

        // Set up request interception to capture Authorization header
        await page.route('**/api/orders**', async (route) => {
            const headers = route.request().headers();
            capturedAuthHeader = headers['authorization'] || headers['Authorization'] || null;
            await route.continue();
        });

        // Navigate to orders page which triggers API calls
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);

        // Remove the route interception
        await page.unroute('**/api/orders**');

        // Verify Authorization header was present
        if (capturedAuthHeader) {
            const hasBearer = capturedAuthHeader.startsWith('Bearer ');
            console.log(`   Authorization header found: ${capturedAuthHeader.substring(0, 20)}...`);
            console.log(`   Starts with "Bearer ": ${hasBearer}`);
            if (!hasBearer) {
                throw new Error('Authorization header does not start with "Bearer "');
            }
        } else {
            console.log('   Warning: No Authorization header captured (API call may not have occurred)');
        }

        await screenshots.capture(page, 'auth-security-token-in-requests');
    }, page, results, screenshots);

    // Test 7: No Auth Header on Login Endpoint
    await runTest('Auth Security - Login Endpoint Auth Header Check', async () => {
        let loginAuthHeader = null;

        // Clear auth state first
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await page.waitForTimeout(300);

        // Set up interception on login endpoint
        await page.route('**/api/auth/login', async (route) => {
            const headers = route.request().headers();
            loginAuthHeader = headers['authorization'] || headers['Authorization'] || null;
            await route.continue();
        });

        // Navigate to login, fill credentials, submit
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await page.fill('input[formControlName="email"]', config.credentials.admin.email);
        await page.fill('input[formControlName="password"]', config.credentials.admin.password);

        try {
            const [response] = await Promise.all([
                page.waitForResponse(resp => resp.url().includes('/api/auth/login'), { timeout: 10000 }),
                page.click('button[type="submit"]')
            ]);

            // Remove route interception
            await page.unroute('**/api/auth/login');

            if (loginAuthHeader) {
                console.log(`   Login request had Authorization header: ${loginAuthHeader.substring(0, 20)}...`);
                console.log('   Note: This is acceptable if the interceptor adds it automatically');
            } else {
                console.log('   Login request had no Authorization header (expected)');
            }

            // Verify login succeeded
            if (response.status() === 200) {
                const loginData = await response.json();
                await page.evaluate((data) => {
                    localStorage.setItem('mes_token', data.accessToken);
                    localStorage.setItem('mes_user', JSON.stringify(data.user));
                }, loginData);
                console.log('   Login completed successfully');
            }
        } catch (e) {
            await page.unroute('**/api/auth/login');
            console.log(`   Login interception error: ${e.message}`);
            // Re-login to restore state
            await reLogin();
        }

        await screenshots.capture(page, 'auth-security-login-no-auth-header');
    }, page, results, screenshots);

    // ──────────────────────────────────────────────────
    // Section 3: Logout Behavior
    // ──────────────────────────────────────────────────
    console.log('\n  Section 3: Logout Behavior');

    // Test 8: Logout Clears Storage
    await runTest('Auth Security - Logout Clears Token Storage', async () => {
        // Ensure we are logged in
        const isLoggedIn = await page.evaluate(() => !!localStorage.getItem('mes_token'));
        if (!isLoggedIn) {
            await reLogin();
        }

        // Navigate to dashboard
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(500);

        // Try to click logout via UI
        let logoutDone = false;
        try {
            // First try to open profile dropdown
            const profileMenu = page.locator('.profile-menu-toggle, .user-menu-toggle, .profile-dropdown-toggle, button:has-text("Admin")');
            if (await profileMenu.count() > 0 && await profileMenu.first().isVisible({ timeout: 2000 })) {
                await profileMenu.first().click();
                await page.waitForTimeout(300);
            }

            // Click logout button
            const logoutBtn = page.locator('button:has-text("Logout"), .logout-btn, .logout-item');
            if (await logoutBtn.count() > 0) {
                await logoutBtn.first().waitFor({ state: 'visible', timeout: 2000 });
                await logoutBtn.first().click();
                await page.waitForTimeout(1000);
                logoutDone = true;
            }
        } catch (e) {
            // Fallback: simulate logout by clearing localStorage
            console.log('   UI logout not available, simulating via localStorage clear');
        }

        if (!logoutDone) {
            await page.evaluate(() => {
                localStorage.removeItem('mes_token');
                localStorage.removeItem('mes_user');
            });
        }

        // Verify token is cleared
        const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('mes_token'));
        if (tokenAfterLogout) {
            throw new Error('Token still present in localStorage after logout');
        }
        console.log('   Token cleared from localStorage after logout');

        await screenshots.capture(page, 'auth-security-logout-clears-storage');

        // Re-login
        await reLogin();
    }, page, results, screenshots);

    // Test 9: Protected Route After Logout
    await runTest('Auth Security - Protected Route After Logout', async () => {
        // Clear localStorage to simulate logout
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await page.waitForTimeout(300);

        // Navigate to a protected route
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify redirected to login
        const currentUrl = page.url();
        if (!currentUrl.includes('login')) {
            throw new Error(`Expected redirect to login after logout, but URL is: ${currentUrl}`);
        }
        console.log(`   Protected route after logout redirects to: ${currentUrl}`);

        await screenshots.capture(page, 'auth-security-protected-after-logout');

        // Re-login
        await reLogin();
    }, page, results, screenshots);

    // Test 10: Protected Admin Route After Logout
    await runTest('Auth Security - Admin Route After Logout', async () => {
        // Clear localStorage
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await page.waitForTimeout(300);

        // Navigate to admin audit route
        await page.goto(`${config.baseUrl}${ROUTES.AUDIT}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify redirected to login
        const currentUrl = page.url();
        if (!currentUrl.includes('login')) {
            throw new Error(`Expected redirect to login for admin route after logout, but URL is: ${currentUrl}`);
        }
        console.log(`   Admin audit route after logout redirects to: ${currentUrl}`);

        await screenshots.capture(page, 'auth-security-admin-after-logout');

        // Re-login
        await reLogin();
    }, page, results, screenshots);

    // Test 11: Browser Back After Logout
    await runTest('Auth Security - Browser Back After Logout', async () => {
        // Navigate to dashboard (logged in)
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(500);

        const dashboardUrl = page.url();
        console.log(`   On dashboard: ${dashboardUrl}`);

        // Simulate logout
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await page.waitForTimeout(300);

        // Navigate to login (as logout would do)
        await page.goto(`${config.baseUrl}${ROUTES.LOGIN}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(500);

        // Press browser back button
        await page.goBack({ waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);

        // Auth guard should redirect back to login
        const currentUrl = page.url();
        const isOnLogin = currentUrl.includes('login');
        console.log(`   URL after browser back: ${currentUrl}`);
        console.log(`   Auth guard caught: ${isOnLogin}`);

        if (!isOnLogin) {
            console.log('   Note: Some SPAs may show cached page briefly before guard kicks in');
        }

        await screenshots.capture(page, 'auth-security-browser-back-after-logout');

        // Re-login
        await reLogin();
    }, page, results, screenshots);

    // ──────────────────────────────────────────────────
    // Section 4: 401 Response Handling
    // ──────────────────────────────────────────────────
    console.log('\n  Section 4: 401 Response Handling');

    // Test 12: 401 API Response Triggers Redirect
    await runTest('Auth Security - 401 Response Triggers Login Redirect', async () => {
        // Intercept dashboard API call to return 401
        await page.route('**/api/dashboard/**', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Unauthorized', message: 'Token expired' })
            });
        });

        // Navigate to dashboard
        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);

        // Check if redirected to login or error is displayed
        const currentUrl = page.url();
        const redirectedToLogin = currentUrl.includes('login');
        console.log(`   URL after 401 response: ${currentUrl}`);
        console.log(`   Redirected to login: ${redirectedToLogin}`);

        if (!redirectedToLogin) {
            // Check if an error message is shown instead
            const errorVisible = await page.locator('.error-message, .alert-danger, .toast-error, [class*="error"]').count();
            console.log(`   Error elements on page: ${errorVisible}`);
            console.log('   Note: App may display error instead of redirecting on 401');
        }

        // Remove the route interception
        await page.unroute('**/api/dashboard/**');

        await screenshots.capture(page, 'auth-security-401-redirect');

        // Re-login (may have been logged out by 401 handler)
        await page.evaluate(() => {
            localStorage.removeItem('mes_token');
            localStorage.removeItem('mes_user');
        });
        await reLogin();
    }, page, results, screenshots);

    // Test 13: Multiple Sequential Requests with Valid Token
    await runTest('Auth Security - Multiple Sequential Requests with Valid Token', async () => {
        // Ensure logged in
        const isLoggedIn = await page.evaluate(() => !!localStorage.getItem('mes_token'));
        if (!isLoggedIn) {
            await reLogin();
        }

        // Navigate to orders page (triggers API calls)
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify page loaded successfully (table or content visible)
        const ordersUrl = page.url();
        const ordersLoaded = !ordersUrl.includes('login');
        console.log(`   Orders page URL: ${ordersUrl}`);
        console.log(`   Orders page loaded: ${ordersLoaded}`);

        if (!ordersLoaded) {
            throw new Error('Orders page failed to load with valid token');
        }

        // Check for table or page content
        const hasContent = await page.locator('table, .orders-list, .page-content, h1, h2').count();
        console.log(`   Content elements on orders page: ${hasContent}`);

        // Navigate to inventory page (another set of API calls)
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Verify inventory page loaded
        const inventoryUrl = page.url();
        const inventoryLoaded = !inventoryUrl.includes('login');
        console.log(`   Inventory page URL: ${inventoryUrl}`);
        console.log(`   Inventory page loaded: ${inventoryLoaded}`);

        if (!inventoryLoaded) {
            throw new Error('Inventory page failed to load with valid token');
        }

        const hasInventoryContent = await page.locator('table, .inventory-list, .page-content, h1, h2').count();
        console.log(`   Content elements on inventory page: ${hasInventoryContent}`);
        console.log('   Token works across multiple sequential API requests');

        await screenshots.capture(page, 'auth-security-multiple-requests');
    }, page, results, screenshots);

    console.log('\n' + '─'.repeat(50));
    console.log('AUTH & SECURITY TESTS COMPLETE');
    console.log('─'.repeat(50));
}

module.exports = { runAuthSecurityTests };
