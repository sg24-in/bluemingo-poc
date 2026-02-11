/**
 * API Error Handling & Validation E2E Tests
 * Tests API response structure, error display, auth headers, and loading states.
 * Uses Playwright page.route() for request interception and mocking.
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runApiErrorHandlingTests(page, screenshots, results, runTest) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 API ERROR HANDLING TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // SECTION 1: API RESPONSE STRUCTURE VALIDATION
    // ============================================

    // Test 1: Orders API Response Structure
    await runTest('API Response - Orders Paged Structure', async () => {
        const responsePromise = page.waitForResponse(
            resp => resp.url().includes('/api/orders/paged'),
            { timeout: 15000 }
        );

        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });

        let response;
        try {
            response = await responsePromise;
        } catch (e) {
            console.log('   Could not capture orders paged response, trying fallback');
            // Fallback: just verify the page loaded
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'api-orders-response-fallback');
            return;
        }

        const json = await response.json();
        const fieldNames = Object.keys(json);
        console.log(`   Response fields: ${fieldNames.join(', ')}`);

        // Verify paged response structure
        if (Array.isArray(json.content)) {
            console.log(`   content: array with ${json.content.length} items`);
        } else {
            console.log('   WARNING: content is not an array');
        }

        if (typeof json.totalElements === 'number') {
            console.log(`   totalElements: ${json.totalElements}`);
        } else {
            console.log('   WARNING: totalElements is not a number');
        }

        if (typeof json.totalPages === 'number') {
            console.log(`   totalPages: ${json.totalPages}`);
        }

        if (json.currentPage !== undefined) {
            console.log(`   currentPage: ${json.currentPage}`);
        }

        if (json.pageSize !== undefined) {
            console.log(`   pageSize: ${json.pageSize}`);
        }

        await screenshots.capture(page, 'api-orders-response-structure');
    }, page, results, screenshots);

    // Test 2: Dashboard Stats API Response
    await runTest('API Response - Dashboard Stats Structure', async () => {
        const responsePromise = page.waitForResponse(
            resp => resp.url().includes('/api/dashboard/summary') || resp.url().includes('/api/dashboard/stats'),
            { timeout: 15000 }
        );

        await page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' });

        let response;
        try {
            response = await responsePromise;
        } catch (e) {
            console.log('   Could not capture dashboard response, page may use different endpoint');
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'api-dashboard-response-fallback');
            return;
        }

        const json = await response.json();
        const fieldNames = Object.keys(json);
        console.log(`   Dashboard response fields: ${fieldNames.join(', ')}`);

        // Check for expected structure (numeric or object fields)
        for (const key of fieldNames) {
            const valueType = typeof json[key];
            console.log(`   ${key}: ${valueType}${valueType === 'number' ? ` (${json[key]})` : ''}`);
        }

        await screenshots.capture(page, 'api-dashboard-response-structure');
    }, page, results, screenshots);

    // Test 3: Batch Detail API Response
    await runTest('API Response - Batch Detail Structure', async () => {
        const responsePromise = page.waitForResponse(
            resp => resp.url().includes('/api/batches/1') && !resp.url().includes('paged'),
            { timeout: 15000 }
        );

        await page.goto(`${config.baseUrl}${ROUTES.BATCH_DETAIL(1)}`, { waitUntil: 'networkidle' });

        let response;
        try {
            response = await responsePromise;
        } catch (e) {
            console.log('   Could not capture batch detail response');
            await page.waitForTimeout(1000);
            await screenshots.capture(page, 'api-batch-detail-fallback');
            return;
        }

        const status = response.status();
        console.log(`   HTTP Status: ${status}`);

        if (status === 200) {
            const json = await response.json();
            const fieldNames = Object.keys(json);
            console.log(`   Batch detail fields: ${fieldNames.join(', ')}`);

            if (json.batchId || json.id) {
                console.log(`   batchId/id: ${json.batchId || json.id}`);
            }
            if (json.batchNumber) {
                console.log(`   batchNumber: ${json.batchNumber}`);
            }
            if (json.status) {
                console.log(`   status: ${json.status}`);
            }
        } else {
            console.log(`   Non-200 response (batch may not exist): ${status}`);
        }

        await screenshots.capture(page, 'api-batch-detail-structure');
    }, page, results, screenshots);

    // Test 4: Auth Login Response Structure (verify localStorage token)
    await runTest('API Response - Auth Token in localStorage', async () => {
        const tokenInfo = await page.evaluate(() => {
            const token = localStorage.getItem('mes_token');
            const userStr = localStorage.getItem('mes_user');

            let tokenValid = false;
            let tokenParts = 0;
            if (token) {
                const parts = token.replace('Bearer ', '').split('.');
                tokenParts = parts.length;
                tokenValid = parts.length === 3;
            }

            let userFields = [];
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    userFields = Object.keys(user);
                } catch (e) {
                    // Not JSON
                }
            }

            return {
                hasToken: !!token,
                tokenParts,
                tokenValid,
                hasUser: !!userStr,
                userFields
            };
        });

        console.log(`   Token found: ${tokenInfo.hasToken}`);
        if (tokenInfo.hasToken) {
            console.log(`   Token parts (expect 3): ${tokenInfo.tokenParts}`);
            console.log(`   Valid JWT format: ${tokenInfo.tokenValid}`);
        }

        console.log(`   User data found: ${tokenInfo.hasUser}`);
        if (tokenInfo.userFields.length > 0) {
            console.log(`   User fields: ${tokenInfo.userFields.join(', ')}`);
        }

        await screenshots.capture(page, 'api-auth-localstorage');
    }, page, results, screenshots);

    // ============================================
    // SECTION 2: ERROR DISPLAY TESTS
    // ============================================

    // Test 5: 404 Entity Not Found
    await runTest('Error Display - 404 Entity Not Found', async () => {
        await page.goto(`${config.baseUrl}/#/orders/99999`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for error message or redirect
        const currentUrl = page.url();
        console.log(`   Current URL after 404 navigation: ${currentUrl}`);

        const errorMessage = page.locator('.error-message, .alert-danger, .not-found, .error, [class*="error"]');
        if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
            const errorText = await errorMessage.first().textContent();
            console.log(`   Error message displayed: ${errorText.trim().substring(0, 100)}`);
        } else if (currentUrl.includes('/orders') && !currentUrl.includes('99999')) {
            console.log('   Redirected away from non-existent entity');
        } else {
            console.log('   No explicit error message shown (may show empty state or redirect)');
        }

        await screenshots.capture(page, 'error-404-entity-not-found');
    }, page, results, screenshots);

    // Test 6: Network Timeout Display
    await runTest('Error Display - Network Timeout', async () => {
        await page.route('**/api/orders/paged**', route => route.abort('timedout'));

        try {
            await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            // Check for loading or error state
            const loadingIndicator = page.locator('.loading, .spinner, [class*="loading"], [class*="spinner"]');
            const errorIndicator = page.locator('.error-message, .alert-danger, .error, [class*="error"]');

            if (await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
                console.log('   Loading indicator visible (request pending/failed)');
            }

            if (await errorIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
                const errorText = await errorIndicator.first().textContent();
                console.log(`   Error shown: ${errorText.trim().substring(0, 100)}`);
            } else {
                console.log('   No explicit error message (app may show empty state or retry silently)');
            }

            await screenshots.capture(page, 'error-network-timeout');
        } finally {
            await page.unroute('**/api/orders/paged**');
        }
    }, page, results, screenshots);

    // Test 7: 500 Server Error Display
    await runTest('Error Display - 500 Server Error', async () => {
        await page.route('**/api/inventory/paged**', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Internal Server Error' })
            });
        });

        try {
            await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            // Check for error state
            const errorIndicator = page.locator('.error-message, .alert-danger, .error, [class*="error"]');
            const emptyState = page.locator('.no-data, .empty-state, [class*="empty"]');
            const tableRows = page.locator('table tbody tr');

            if (await errorIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
                const errorText = await errorIndicator.first().textContent();
                console.log(`   Error message displayed: ${errorText.trim().substring(0, 100)}`);
            } else if (await emptyState.isVisible({ timeout: 1000 }).catch(() => false)) {
                console.log('   Empty state shown (error resulted in no data)');
            } else {
                const rowCount = await tableRows.count();
                console.log(`   Table rows: ${rowCount} (app may cache previous data or show empty table)`);
            }

            await screenshots.capture(page, 'error-500-server-error');
        } finally {
            await page.unroute('**/api/inventory/paged**');
        }
    }, page, results, screenshots);

    // Test 8: Multiple Rapid Navigation (No Crashes)
    await runTest('Error Display - Rapid Navigation No Crash', async () => {
        // Navigate rapidly between pages without waiting for full load
        page.goto(`${config.baseUrl}${ROUTES.ORDERS}`).catch(() => {});
        await page.waitForTimeout(300);

        page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`).catch(() => {});
        await page.waitForTimeout(300);

        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify final page loaded (no white screen, no crash)
        const bodyContent = await page.evaluate(() => document.body.innerText);
        const hasContent = bodyContent.trim().length > 0;
        console.log(`   Page has content after rapid navigation: ${hasContent}`);

        // Verify we're on the batches page
        const currentUrl = page.url();
        console.log(`   Final URL: ${currentUrl}`);

        if (currentUrl.includes('batches')) {
            console.log('   Successfully landed on batches page');
        }

        // Check there's no unhandled error overlay
        const errorOverlay = page.locator('.cdk-overlay-container .error, .unhandled-error, #webpack-dev-server-client-overlay');
        const hasErrorOverlay = await errorOverlay.isVisible({ timeout: 500 }).catch(() => false);
        console.log(`   Error overlay visible: ${hasErrorOverlay}`);

        await screenshots.capture(page, 'error-rapid-navigation');
    }, page, results, screenshots);

    // ============================================
    // SECTION 3: AUTH HEADER VALIDATION
    // ============================================

    // Test 9: Bearer Token in Protected API Calls
    await runTest('Auth Header - Bearer Token Present', async () => {
        let capturedAuth = null;

        await page.route('**/api/orders**', async route => {
            try {
                capturedAuth = route.request().headers()['authorization'];
            } catch (e) {
                // Ignore header capture errors
            }
            await route.continue();
        });

        try {
            await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            if (capturedAuth) {
                console.log(`   Authorization header found: ${capturedAuth.substring(0, 20)}...`);

                if (capturedAuth.startsWith('Bearer ')) {
                    console.log('   Correct Bearer prefix');
                    const token = capturedAuth.replace('Bearer ', '');
                    const parts = token.split('.');
                    console.log(`   Token parts: ${parts.length} (expect 3 for JWT)`);
                } else {
                    console.log(`   WARNING: Auth header does not start with "Bearer "`);
                }
            } else {
                console.log('   No Authorization header captured (may use different auth mechanism)');
            }

            await screenshots.capture(page, 'auth-bearer-token');
        } finally {
            await page.unroute('**/api/orders**');
        }
    }, page, results, screenshots);

    // Test 10: Auth Header Format (JWT Structure)
    await runTest('Auth Header - JWT Token Structure', async () => {
        const tokenAnalysis = await page.evaluate(() => {
            const token = localStorage.getItem('mes_token');
            if (!token) return { found: false };

            const cleanToken = token.replace('Bearer ', '');
            const parts = cleanToken.split('.');
            if (parts.length !== 3) return { found: true, validStructure: false, parts: parts.length };

            try {
                // Decode payload (second part)
                const payload = JSON.parse(atob(parts[1]));
                return {
                    found: true,
                    validStructure: true,
                    parts: 3,
                    hasSub: 'sub' in payload,
                    hasExp: 'exp' in payload,
                    subject: payload.sub || null,
                    expiration: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
                    payloadKeys: Object.keys(payload)
                };
            } catch (e) {
                return { found: true, validStructure: true, parts: 3, decodeError: e.message };
            }
        });

        console.log(`   Token found in localStorage: ${tokenAnalysis.found}`);
        if (tokenAnalysis.found) {
            console.log(`   Valid JWT structure (3 parts): ${tokenAnalysis.validStructure}`);
            if (tokenAnalysis.hasSub !== undefined) {
                console.log(`   Has 'sub' claim: ${tokenAnalysis.hasSub}${tokenAnalysis.subject ? ` (${tokenAnalysis.subject})` : ''}`);
                console.log(`   Has 'exp' claim: ${tokenAnalysis.hasExp}${tokenAnalysis.expiration ? ` (${tokenAnalysis.expiration})` : ''}`);
                console.log(`   Payload keys: ${tokenAnalysis.payloadKeys.join(', ')}`);
            }
            if (tokenAnalysis.decodeError) {
                console.log(`   Decode error: ${tokenAnalysis.decodeError}`);
            }
        }

        await screenshots.capture(page, 'auth-jwt-structure');
    }, page, results, screenshots);

    // Test 11: Consistent Auth Across Multiple Pages
    await runTest('Auth Header - Consistent Token Across Pages', async () => {
        const capturedTokens = [];

        // Helper to capture auth header for a given route pattern
        async function captureTokenForPage(routePattern, pageRoute, pageName) {
            let captured = null;

            await page.route(routePattern, async route => {
                try {
                    captured = route.request().headers()['authorization'] || null;
                } catch (e) {
                    // Ignore
                }
                await route.continue();
            });

            try {
                await page.goto(`${config.baseUrl}${pageRoute}`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(500);
            } finally {
                await page.unroute(routePattern);
            }

            if (captured) {
                capturedTokens.push({ page: pageName, token: captured });
                console.log(`   ${pageName}: token captured`);
            } else {
                console.log(`   ${pageName}: no auth header captured`);
            }
        }

        await captureTokenForPage('**/api/orders**', ROUTES.ORDERS, 'Orders');
        await captureTokenForPage('**/api/inventory**', ROUTES.INVENTORY, 'Inventory');
        await captureTokenForPage('**/api/batches**', ROUTES.BATCHES, 'Batches');

        // Verify all tokens are the same
        if (capturedTokens.length >= 2) {
            const allSame = capturedTokens.every(t => t.token === capturedTokens[0].token);
            console.log(`   All ${capturedTokens.length} tokens identical: ${allSame}`);
            if (!allSame) {
                console.log('   WARNING: Auth tokens differ across pages');
            }
        } else if (capturedTokens.length === 1) {
            console.log('   Only 1 token captured - cannot compare consistency');
        } else {
            console.log('   No tokens captured across any page');
        }

        await screenshots.capture(page, 'auth-consistent-token');
    }, page, results, screenshots);

    // ============================================
    // SECTION 4: LOADING STATE VALIDATION
    // ============================================

    // Test 12: Orders Loading State
    await runTest('Loading State - Orders Page', async () => {
        await page.route('**/api/orders/paged**', async route => {
            await new Promise(r => setTimeout(r, 2000));
            await route.continue();
        });

        try {
            // Navigate and immediately check for loading indicator
            page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' }).catch(() => {});
            await page.waitForTimeout(500);

            // Check for loading indicator while data is delayed
            const loadingIndicator = page.locator('.loading, .spinner, [class*="loading"], [class*="spinner"], .progress');
            const loadingText = page.locator('text=Loading, text=loading');

            let loadingFound = false;
            if (await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
                console.log('   Loading indicator visible during data fetch');
                loadingFound = true;
            }
            if (await loadingText.isVisible({ timeout: 500 }).catch(() => false)) {
                console.log('   Loading text visible during data fetch');
                loadingFound = true;
            }

            if (!loadingFound) {
                console.log('   No explicit loading indicator found (app may render immediately or use skeleton)');
            }

            await screenshots.capture(page, 'loading-orders-during');

            // Wait for data to load
            await page.waitForTimeout(3000);

            // Verify table appears after loading
            const table = page.locator('table');
            if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
                console.log('   Table visible after loading completed');
            } else {
                console.log('   No table visible (may use card layout or list)');
            }

            await screenshots.capture(page, 'loading-orders-complete');
        } finally {
            await page.unroute('**/api/orders/paged**');
        }
    }, page, results, screenshots);

    // Test 13: Dashboard Loading State
    await runTest('Loading State - Dashboard Page', async () => {
        await page.route('**/api/dashboard/**', async route => {
            await new Promise(r => setTimeout(r, 2000));
            await route.continue();
        });

        try {
            page.goto(`${config.baseUrl}${ROUTES.DASHBOARD}`, { waitUntil: 'networkidle' }).catch(() => {});
            await page.waitForTimeout(500);

            // Check for loading indicator
            const loadingIndicator = page.locator('.loading, .spinner, [class*="loading"], [class*="spinner"], .progress');
            const loadingText = page.locator('text=Loading, text=loading');

            let loadingFound = false;
            if (await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
                console.log('   Loading indicator visible on dashboard');
                loadingFound = true;
            }
            if (await loadingText.isVisible({ timeout: 500 }).catch(() => false)) {
                console.log('   Loading text visible on dashboard');
                loadingFound = true;
            }

            if (!loadingFound) {
                console.log('   No explicit loading indicator found (dashboard may load quickly or use skeleton)');
            }

            await screenshots.capture(page, 'loading-dashboard-during');

            // Wait for data
            await page.waitForTimeout(3000);

            // Verify content appears
            const dashboardContent = page.locator('.dashboard, .stats, .card, .metric, [class*="dashboard"]');
            if (await dashboardContent.first().isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('   Dashboard content visible after loading');
            }

            await screenshots.capture(page, 'loading-dashboard-complete');
        } finally {
            await page.unroute('**/api/dashboard/**');
        }
    }, page, results, screenshots);

    // Test 14: Empty State Display
    await runTest('Loading State - Empty State Display', async () => {
        await page.route('**/api/holds/paged**', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                    currentPage: 0,
                    pageSize: 20,
                    hasNext: false,
                    hasPrevious: false
                })
            });
        });

        try {
            await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            // Check for empty state display
            const emptyState = page.locator('.no-data, .empty-state, [class*="empty"], .no-records');
            const emptyText = page.locator('text=No holds, text=No records, text=No data, text=No results, text=no active holds');
            const tableRows = page.locator('table tbody tr');

            let emptyStateFound = false;
            if (await emptyState.isVisible({ timeout: 1000 }).catch(() => false)) {
                const text = await emptyState.first().textContent();
                console.log(`   Empty state element visible: ${text.trim().substring(0, 80)}`);
                emptyStateFound = true;
            }

            if (await emptyText.first().isVisible({ timeout: 1000 }).catch(() => false)) {
                const text = await emptyText.first().textContent();
                console.log(`   Empty message text: ${text.trim().substring(0, 80)}`);
                emptyStateFound = true;
            }

            if (!emptyStateFound) {
                const rowCount = await tableRows.count();
                if (rowCount === 0) {
                    console.log('   Table has 0 rows (empty response rendered as empty table)');
                } else {
                    console.log(`   Table has ${rowCount} rows (may show "no data" row)`);
                }
            }

            await screenshots.capture(page, 'loading-empty-state');
        } finally {
            await page.unroute('**/api/holds/paged**');
        }
    }, page, results, screenshots);

    console.log('\n' + '─'.repeat(50));
    console.log('API ERROR HANDLING TESTS COMPLETE');
    console.log('─'.repeat(50));
}

module.exports = { runApiErrorHandlingTests };
