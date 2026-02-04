/**
 * MES Production Confirmation - User Journey Recorder
 *
 * Records a complete user journey through the application with video
 * and captures screenshots at key interaction points for documentation.
 *
 * Usage:
 *   node e2e/record-user-journey.js
 *
 * Output:
 *   - Video: e2e/output/videos/user-journey-{timestamp}.webm
 *   - Screenshots: e2e/output/screenshots/user-journey-{timestamp}/
 *
 * Prerequisites:
 *   - Backend running in demo mode
 *   - Frontend running
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('./config/playwright.config');

async function recordUserJourney() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const screenshotDir = path.join(__dirname, 'output', 'screenshots', `user-journey-${timestamp}`);
    const videoDir = path.join(__dirname, 'output', 'videos');

    // Ensure directories exist
    fs.mkdirSync(screenshotDir, { recursive: true });
    fs.mkdirSync(videoDir, { recursive: true });

    console.log('═'.repeat(70));
    console.log('MES PRODUCTION CONFIRMATION - USER JOURNEY RECORDER');
    console.log('═'.repeat(70));
    console.log(`Screenshots: ${screenshotDir}`);
    console.log(`Videos: ${videoDir}`);
    console.log('═'.repeat(70));

    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-web-security']
    });

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        recordVideo: {
            dir: videoDir,
            size: { width: 1440, height: 900 }
        }
    });

    const page = await context.newPage();
    let stepNum = 0;

    // Helper function
    async function captureStep(name, waitTime = 1000) {
        stepNum++;
        const paddedNum = String(stepNum).padStart(3, '0');
        const filename = `${paddedNum}-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
        await page.waitForTimeout(waitTime);
        await page.screenshot({
            path: path.join(screenshotDir, filename),
            fullPage: false
        });
        console.log(`   📸 ${filename}`);
    }

    try {
        // ===== CHAPTER 1: LOGIN =====
        console.log('\n📖 Chapter 1: Authentication');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle' });
        await captureStep('login-page-empty');

        await page.fill('input[formControlName="email"]', config.credentials.admin.email);
        await captureStep('login-email-entered');

        await page.fill('input[formControlName="password"]', config.credentials.admin.password);
        await captureStep('login-credentials-complete');

        const [loginResponse] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
            page.click('button[type="submit"]')
        ]);

        const loginData = await loginResponse.json();
        await page.evaluate((data) => {
            localStorage.setItem('mes_token', data.accessToken);
            localStorage.setItem('mes_user', JSON.stringify(data.user));
        }, loginData);

        await page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle' });
        await captureStep('dashboard-after-login', 1500);
        console.log('   ✅ Login successful');

        // ===== CHAPTER 2: DASHBOARD OVERVIEW =====
        console.log('\n📖 Chapter 2: Dashboard Overview');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle' });
        await captureStep('dashboard-overview');

        // ===== CHAPTER 3: ORDERS MANAGEMENT =====
        console.log('\n📖 Chapter 3: Orders Management');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/orders`, { waitUntil: 'networkidle' });
        await captureStep('orders-list');

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            await orderRows.first().click();
            await page.waitForLoadState('networkidle');
            await captureStep('order-detail-view', 1500);

            // Back to list
            await page.goto(`${config.baseUrl}/orders`, { waitUntil: 'networkidle' });
        }

        // ===== CHAPTER 4: PRODUCTION CONFIRMATION =====
        console.log('\n📖 Chapter 4: Production Confirmation');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/production/confirm`, { waitUntil: 'networkidle' });
        await captureStep('production-form-empty');

        // Select order
        const orderDropdown = page.locator('select#order, select[formControlName="order"]');
        if (await orderDropdown.count() > 0) {
            await orderDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1500);
            await captureStep('production-order-selected');
        }

        // Select operation
        const operationDropdown = page.locator('select#operation, select[formControlName="operation"]');
        if (await operationDropdown.count() > 0) {
            await operationDropdown.selectOption({ index: 1 }).catch(() => {});
            await page.waitForTimeout(1000);
            await captureStep('production-operation-selected');
        }

        // Fill form
        const startTime = page.locator('input[type="datetime-local"][formControlName="startTime"]');
        const endTime = page.locator('input[type="datetime-local"][formControlName="endTime"]');
        if (await startTime.count() > 0) await startTime.fill('2024-01-15T08:00');
        if (await endTime.count() > 0) await endTime.fill('2024-01-15T12:00');

        const producedQty = page.locator('input[formControlName="producedQty"]');
        if (await producedQty.count() > 0) await producedQty.fill('100');

        await captureStep('production-form-filled');

        // ===== CHAPTER 5: INVENTORY MANAGEMENT =====
        console.log('\n📖 Chapter 5: Inventory Management');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/inventory`, { waitUntil: 'networkidle' });
        await captureStep('inventory-list');

        // Filter by state
        const stateFilter = page.locator('select[name="state"], select#state');
        if (await stateFilter.count() > 0) {
            await stateFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
            await captureStep('inventory-available-filter');

            await stateFilter.selectOption('BLOCKED').catch(() => {});
            await page.waitForTimeout(500);
            await captureStep('inventory-blocked-filter');
        }

        // ===== CHAPTER 6: BATCH TRACEABILITY =====
        console.log('\n📖 Chapter 6: Batch Traceability');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/batches`, { waitUntil: 'networkidle' });
        await captureStep('batches-list');

        const batchRows = page.locator('table tbody tr');
        if (await batchRows.count() > 0) {
            await batchRows.first().click();
            await page.waitForLoadState('networkidle');
            await captureStep('batch-detail-view', 1500);

            // Look for genealogy
            const genealogySection = page.locator('.genealogy, .batch-tree');
            if (await genealogySection.count() > 0) {
                await captureStep('batch-genealogy');
            }
        }

        // ===== CHAPTER 7: HOLDS MANAGEMENT =====
        console.log('\n📖 Chapter 7: Holds Management');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/holds`, { waitUntil: 'networkidle' });
        await captureStep('holds-list');

        // Open apply hold modal
        const applyHoldBtn = page.locator('button:has-text("Apply Hold"), button:has-text("New Hold")');
        if (await applyHoldBtn.count() > 0) {
            await applyHoldBtn.first().click();
            await page.waitForTimeout(500);
            await captureStep('holds-apply-modal');

            // Cancel
            const cancelBtn = page.locator('.modal button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) await cancelBtn.click();
        }

        // ===== CHAPTER 8: EQUIPMENT MANAGEMENT =====
        console.log('\n📖 Chapter 8: Equipment Management');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/equipment`, { waitUntil: 'networkidle' });
        await captureStep('equipment-list');

        // Filter by status
        const equipStatusFilter = page.locator('select[name="status"], select#status');
        if (await equipStatusFilter.count() > 0) {
            await equipStatusFilter.selectOption('AVAILABLE').catch(() => {});
            await page.waitForTimeout(500);
            await captureStep('equipment-available');

            await equipStatusFilter.selectOption('MAINTENANCE').catch(() => {});
            await page.waitForTimeout(500);
            await captureStep('equipment-maintenance');
        }

        // ===== CHAPTER 9: QUALITY INSPECTION =====
        console.log('\n📖 Chapter 9: Quality Inspection');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/quality`, { waitUntil: 'networkidle' });
        await captureStep('quality-pending');

        const rejectedTab = page.locator('button:has-text("Rejected"), .tab:has-text("Rejected")');
        if (await rejectedTab.count() > 0) {
            await rejectedTab.first().click();
            await page.waitForTimeout(500);
            await captureStep('quality-rejected');
        }

        // ===== CHAPTER 10: LOGOUT =====
        console.log('\n📖 Chapter 10: Logout');
        console.log('─'.repeat(50));

        await page.goto(`${config.baseUrl}/dashboard`, { waitUntil: 'networkidle' });
        await captureStep('before-logout');

        const logoutBtn = page.locator('button:has-text("Logout"), .logout-btn');
        if (await logoutBtn.count() > 0) {
            await logoutBtn.first().click();
            await page.waitForTimeout(1000);
            await captureStep('after-logout');
        }

        console.log('\n✅ User journey recording complete!');

    } catch (error) {
        console.error('\n❌ Error during recording:', error.message);
        await page.screenshot({
            path: path.join(screenshotDir, 'error.png'),
            fullPage: true
        });
    } finally {
        await page.close();
        await context.close();
        await browser.close();
    }

    console.log('\n' + '═'.repeat(70));
    console.log('RECORDING COMPLETE');
    console.log('═'.repeat(70));
    console.log(`📸 Screenshots: ${screenshotDir}`);
    console.log(`🎬 Video saved to: ${videoDir}`);
    console.log('═'.repeat(70));
}

// Run
recordUserJourney().catch(console.error);
