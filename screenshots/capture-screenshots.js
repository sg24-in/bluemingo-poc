const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname);
const BASE_URL = 'http://localhost:4200';
const API_URL = 'http://localhost:8080';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshots() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-web-security']
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Listen for console messages for debugging
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('   Browser error:', msg.text());
        }
    });

    try {
        console.log('Starting screenshot capture...\n');

        // 1. Login Page (empty)
        console.log('1. Capturing Login Page...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
        await page.waitForSelector('input[formControlName="email"]', { timeout: 10000 });
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '01-login-page.png'),
            fullPage: false
        });
        console.log('   Saved: 01-login-page.png');

        // Fill login form
        console.log('   Filling login form...');
        await page.fill('input[formControlName="email"]', 'admin@mes.com');
        await page.fill('input[formControlName="password"]', 'admin123');
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '02-login-filled.png'),
            fullPage: false
        });
        console.log('   Saved: 02-login-filled.png');

        // Submit login and wait for response
        console.log('   Submitting login...');
        const [response] = await Promise.all([
            page.waitForResponse(response =>
                response.url().includes('/api/auth/login'),
                { timeout: 10000 }
            ),
            page.click('button:has-text("Sign In")')
        ]);

        console.log('   API Response status:', response.status());

        if (response.status() !== 200) {
            const body = await response.json();
            console.log('   Login failed:', body);
            throw new Error('Login failed');
        }

        // Get the response body and inject token into localStorage
        const loginData = await response.json();
        console.log('   Got access token, injecting into localStorage...');

        await page.evaluate((data) => {
            localStorage.setItem('mes_token', data.accessToken);
            localStorage.setItem('mes_user', JSON.stringify(data.user));
        }, loginData);

        // Navigate to dashboard with the token now in localStorage
        console.log('   Navigating to dashboard...');
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        console.log('   Login successful!');

        // 2. Dashboard
        console.log('2. Capturing Dashboard...');
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '03-dashboard.png'),
            fullPage: false
        });
        console.log('   Saved: 03-dashboard.png');

        // 3. Orders List
        console.log('3. Capturing Orders List...');
        await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '04-orders-list.png'),
            fullPage: false
        });
        console.log('   Saved: 04-orders-list.png');

        // 4. Order Detail - click on first order
        console.log('4. Capturing Order Detail...');
        const orderRows = page.locator('table tbody tr');
        const orderCount = await orderRows.count();
        if (orderCount > 0) {
            await orderRows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '05-order-detail.png'),
                fullPage: true
            });
            console.log('   Saved: 05-order-detail.png');
        } else {
            console.log('   No orders found, skipping order detail');
        }

        // 5. Inventory List
        console.log('5. Capturing Inventory List...');
        await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '06-inventory-list.png'),
            fullPage: false
        });
        console.log('   Saved: 06-inventory-list.png');

        // 6. Batches List
        console.log('6. Capturing Batches List...');
        await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '07-batches-list.png'),
            fullPage: false
        });
        console.log('   Saved: 07-batches-list.png');

        // 7. Batch Detail
        console.log('7. Capturing Batch Detail...');
        const batchRows = page.locator('table tbody tr');
        const batchCount = await batchRows.count();
        if (batchCount > 0) {
            await batchRows.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await page.screenshot({
                path: path.join(SCREENSHOTS_DIR, '08-batch-detail.png'),
                fullPage: true
            });
            console.log('   Saved: 08-batch-detail.png');
        } else {
            console.log('   No batches found, skipping batch detail');
        }

        // 8. Production Confirmation Form
        console.log('8. Capturing Production Confirmation...');
        await page.goto(`${BASE_URL}/production/confirm`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '09-production-confirm.png'),
            fullPage: false
        });
        console.log('   Saved: 09-production-confirm.png');

        // Try to select an order if there's a dropdown
        const orderDropdown = page.locator('select#order');
        if (await orderDropdown.count() > 0) {
            const options = await orderDropdown.locator('option').allTextContents();
            if (options.length > 1) {
                await orderDropdown.selectOption({ index: 1 });
                await page.waitForTimeout(1500);
                await page.screenshot({
                    path: path.join(SCREENSHOTS_DIR, '10-production-order-selected.png'),
                    fullPage: true
                });
                console.log('   Saved: 10-production-order-selected.png');
            }
        }

        // 9. Holds page
        console.log('9. Capturing Holds page...');
        await page.goto(`${BASE_URL}/holds`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '11-holds-list.png'),
            fullPage: false
        });
        console.log('   Saved: 11-holds-list.png');

        console.log('\n========================================');
        console.log('Screenshot capture completed successfully!');
        console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
        console.log('========================================');

    } catch (error) {
        console.error('Error capturing screenshots:', error.message);
        // Take a debug screenshot
        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'error-screenshot.png'),
            fullPage: true
        });
        console.log('Debug screenshot saved: error-screenshot.png');
        console.log('Current URL:', page.url());
    } finally {
        await browser.close();
    }
}

captureScreenshots();
