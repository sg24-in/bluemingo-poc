/**
 * MES Production Confirmation - Comprehensive Demo Video
 *
 * Captures EVERY detail: status flows, button actions, popups, forms
 * With text overlays explaining each action.
 *
 * Prerequisites:
 *   - Backend running: gradlew bootRun --args="--spring.profiles.active=demo"
 *   - Frontend running: npm start
 *
 * Usage:
 *   node e2e/record-comprehensive-demo.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const CREDENTIALS = { email: 'admin@mes.com', password: 'admin123' };

// Helper to show caption overlay
async function showCaption(page, sceneNum, title, description) {
    await page.evaluate(({ sceneNum, title, description }) => {
        const existing = document.getElementById('demo-caption');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'demo-caption';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 80%, transparent 100%);
                padding: 25px 40px 20px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="max-width: 1400px; margin: 0 auto;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
                        <span style="
                            background: #2196F3;
                            color: white;
                            padding: 3px 10px;
                            border-radius: 4px;
                            font-size: 13px;
                            font-weight: 600;
                        ">${sceneNum}</span>
                        <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: white;">${title}</h2>
                    </div>
                    <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.85); padding-left: 50px;">${description}</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }, { sceneNum, title, description });
}

// Helper to take screenshot
async function capture(page, screenshotDir, name, counter) {
    const filename = `${String(counter).padStart(3, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: false });
    console.log(`   📸 ${filename}`);
    return counter + 1;
}

async function recordComprehensiveDemo() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, 'output', 'comprehensive-demo', timestamp);
    const screenshotDir = path.join(outputDir, 'screenshots');

    fs.mkdirSync(screenshotDir, { recursive: true });

    console.log('═'.repeat(70));
    console.log('MES PRODUCTION - COMPREHENSIVE DEMO VIDEO');
    console.log('═'.repeat(70));
    console.log(`Output: ${outputDir}`);
    console.log('═'.repeat(70));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } }
    });
    const page = await context.newPage();

    let shotNum = 1;

    try {
        // ═══════════════════════════════════════════════════════════════
        // SECTION 1: AUTHENTICATION
        // ═══════════════════════════════════════════════════════════════
        console.log('\n🔐 SECTION 1: AUTHENTICATION');

        // Login page
        await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
        await showCaption(page, '1.1', 'Login Page', 'MES Production Confirmation - Secure user authentication');
        shotNum = await capture(page, screenshotDir, 'login-page', shotNum);
        await page.waitForTimeout(2000);

        // Enter email
        await page.fill('input[formControlName="email"]', CREDENTIALS.email);
        await showCaption(page, '1.2', 'Enter Email', 'User enters their registered email address');
        shotNum = await capture(page, screenshotDir, 'login-email-entered', shotNum);
        await page.waitForTimeout(1500);

        // Enter password
        await page.fill('input[formControlName="password"]', CREDENTIALS.password);
        await showCaption(page, '1.3', 'Enter Password', 'Password field with secure input masking');
        shotNum = await capture(page, screenshotDir, 'login-password-entered', shotNum);
        await page.waitForTimeout(1500);

        // Submit login
        await showCaption(page, '1.4', 'Sign In', 'Click Sign In button to authenticate');
        shotNum = await capture(page, screenshotDir, 'login-before-submit', shotNum);

        const [loginResponse] = await Promise.all([
            page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
            page.click('button[type="submit"]')
        ]);

        // Store token
        try {
            const data = await loginResponse.json();
            await page.evaluate((loginData) => {
                localStorage.setItem('mes_token', loginData.accessToken);
                localStorage.setItem('mes_user', JSON.stringify(loginData.user));
            }, data);
        } catch (e) {}

        await page.waitForTimeout(2000);
        await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        await showCaption(page, '1.5', 'Login Success', 'JWT token stored - Redirected to Dashboard');
        shotNum = await capture(page, screenshotDir, 'login-success', shotNum);
        await page.waitForTimeout(2000);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 2: DASHBOARD
        // ═══════════════════════════════════════════════════════════════
        console.log('\n📊 SECTION 2: DASHBOARD');

        await showCaption(page, '2.1', 'Dashboard Overview', 'Key metrics: Total Orders, Operations Ready, Active Holds, Confirmations');
        shotNum = await capture(page, screenshotDir, 'dashboard-overview', shotNum);
        await page.waitForTimeout(2500);

        // Scroll to show more content
        await page.evaluate(() => window.scrollBy(0, 300));
        await showCaption(page, '2.2', 'Inventory Summary', 'Material status: Available, Blocked, On-Hold, Consumed');
        shotNum = await capture(page, screenshotDir, 'dashboard-inventory-summary', shotNum);
        await page.waitForTimeout(2000);

        await page.evaluate(() => window.scrollBy(0, 200));
        await showCaption(page, '2.3', 'Orders Ready & Recent Confirmations', 'Quick access to pending work and production history');
        shotNum = await capture(page, screenshotDir, 'dashboard-orders-confirmations', shotNum);
        await page.waitForTimeout(2000);

        await page.evaluate(() => window.scrollBy(0, 300));
        await showCaption(page, '2.4', 'Audit Trail', 'Complete activity log for compliance and traceability');
        shotNum = await capture(page, screenshotDir, 'dashboard-audit-trail', shotNum);
        await page.waitForTimeout(2000);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 3: ORDERS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n📋 SECTION 3: ORDERS');

        await page.goto(`${BASE_URL}/#/orders`, { waitUntil: 'networkidle' });
        await showCaption(page, '3.1', 'Orders List', 'All production orders with server-side pagination');
        shotNum = await capture(page, screenshotDir, 'orders-list', shotNum);
        await page.waitForTimeout(2000);

        // Filter by status
        const orderStatusFilter = page.locator('select').first();
        if (await orderStatusFilter.count() > 0) {
            try {
                await orderStatusFilter.selectOption({ index: 1 });
                await page.waitForTimeout(1000);
                await showCaption(page, '3.2', 'Filter Orders', 'Filter by status: CREATED, IN_PROGRESS, COMPLETED');
                shotNum = await capture(page, screenshotDir, 'orders-filter-applied', shotNum);
                await page.waitForTimeout(2000);

                // Reset filter
                await orderStatusFilter.selectOption({ index: 0 });
                await page.waitForTimeout(500);
            } catch (e) { console.log('   ⚠️ Filter option not available'); }
        }

        // View order detail
        const viewDetailBtn = page.locator('button:has-text("View Details")').first();
        if (await viewDetailBtn.count() > 0) {
            await viewDetailBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await showCaption(page, '3.4', 'Order Detail', 'Order header with customer info, dates, and priority');
            shotNum = await capture(page, screenshotDir, 'order-detail-header', shotNum);
            await page.waitForTimeout(2000);

            await page.evaluate(() => window.scrollBy(0, 300));
            await showCaption(page, '3.5', 'Line Items', 'Products ordered with quantities and specifications');
            shotNum = await capture(page, screenshotDir, 'order-line-items', shotNum);
            await page.waitForTimeout(2000);

            await page.evaluate(() => window.scrollBy(0, 300));
            await showCaption(page, '3.6', 'Operations Timeline', 'Production steps with status: NOT_STARTED → READY → IN_PROGRESS → CONFIRMED');
            shotNum = await capture(page, screenshotDir, 'order-operations-timeline', shotNum);
            await page.waitForTimeout(2500);
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION 4: INVENTORY
        // ═══════════════════════════════════════════════════════════════
        console.log('\n📦 SECTION 4: INVENTORY');

        await page.goto(`${BASE_URL}/#/inventory`, { waitUntil: 'networkidle' });
        await showCaption(page, '4.1', 'Inventory List', 'All materials with batch tracking and status badges');
        shotNum = await capture(page, screenshotDir, 'inventory-list', shotNum);
        await page.waitForTimeout(2000);

        // Status summary cards
        await showCaption(page, '4.2', 'Status Summary', 'Quick counts: Available, Blocked, On-Hold, Scrapped');
        shotNum = await capture(page, screenshotDir, 'inventory-status-cards', shotNum);
        await page.waitForTimeout(2000);

        // Filter by state - AVAILABLE
        const stateFilter = page.locator('select').first();
        if (await stateFilter.count() > 0) {
            try {
                await stateFilter.selectOption('AVAILABLE');
                await page.waitForTimeout(1000);
                await showCaption(page, '4.3', 'Filter: AVAILABLE', 'Show only materials available for production');
                shotNum = await capture(page, screenshotDir, 'inventory-filter-available', shotNum);
                await page.waitForTimeout(2000);

                await stateFilter.selectOption('BLOCKED');
                await page.waitForTimeout(1000);
                await showCaption(page, '4.4', 'Filter: BLOCKED', 'Materials blocked pending quality investigation');
                shotNum = await capture(page, screenshotDir, 'inventory-filter-blocked', shotNum);
                await page.waitForTimeout(2000);

                // Reset
                await stateFilter.selectOption({ index: 0 });
                await page.waitForTimeout(500);
            } catch (e) { console.log('   ⚠️ Inventory state filter failed'); }
        }

        // Filter by type
        const typeFilter = page.locator('select').nth(1);
        if (await typeFilter.count() > 0) {
            try {
                await typeFilter.selectOption({ index: 1 });
                await page.waitForTimeout(1000);
                await showCaption(page, '4.5', 'Filter by Type', 'Raw Materials (RM), Intermediate (IM), Finished Goods (FG)');
                shotNum = await capture(page, screenshotDir, 'inventory-filter-type', shotNum);
                await page.waitForTimeout(2000);
                await typeFilter.selectOption({ index: 0 });
            } catch (e) { console.log('   ⚠️ Inventory type filter failed'); }
        }

        // Block inventory modal
        const blockBtn = page.locator('button:has-text("Block")').first();
        if (await blockBtn.count() > 0) {
            await blockBtn.click();
            await page.waitForTimeout(800);
            await showCaption(page, '4.6', 'Block Inventory Modal', 'Enter reason to block material from production use');
            shotNum = await capture(page, screenshotDir, 'inventory-block-modal', shotNum);
            await page.waitForTimeout(2000);

            // Fill reason
            const reasonInput = page.locator('textarea, input[type="text"]').last();
            if (await reasonInput.count() > 0) {
                await reasonInput.fill('Quality investigation required');
                await showCaption(page, '4.7', 'Block Reason', 'Documenting why material is being blocked');
                shotNum = await capture(page, screenshotDir, 'inventory-block-reason-filled', shotNum);
                await page.waitForTimeout(2000);
            }

            // Cancel
            const cancelBtn = page.locator('button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) await cancelBtn.click();
            await page.waitForTimeout(500);
        }

        // Scrap modal
        const scrapBtn = page.locator('button:has-text("Scrap")').first();
        if (await scrapBtn.count() > 0) {
            await scrapBtn.click();
            await page.waitForTimeout(800);
            await showCaption(page, '4.8', 'Scrap Inventory Modal', 'Permanently mark material as scrapped with reason');
            shotNum = await capture(page, screenshotDir, 'inventory-scrap-modal', shotNum);
            await page.waitForTimeout(2000);

            const cancelBtn = page.locator('button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) await cancelBtn.click();
            await page.waitForTimeout(500);
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION 5: BATCHES
        // ═══════════════════════════════════════════════════════════════
        console.log('\n🏷️ SECTION 5: BATCHES');

        await page.goto(`${BASE_URL}/#/batches`, { waitUntil: 'networkidle' });
        await showCaption(page, '5.1', 'Batch Traceability', 'All batches with auto-generated numbers and tracking');
        shotNum = await capture(page, screenshotDir, 'batches-list', shotNum);
        await page.waitForTimeout(2000);

        // Filter by state
        const batchStateFilter = page.locator('select').first();
        if (await batchStateFilter.count() > 0) {
            try {
                await batchStateFilter.selectOption('CONSUMED');
                await page.waitForTimeout(1000);
                await showCaption(page, '5.2', 'Filter: CONSUMED', 'Batches that have been used in production');
                shotNum = await capture(page, screenshotDir, 'batches-filter-consumed', shotNum);
                await page.waitForTimeout(2000);
                await batchStateFilter.selectOption({ index: 0 });
            } catch (e) { console.log('   ⚠️ Batch state filter failed'); }
        }

        // Search
        const searchInput = page.locator('input[placeholder*="Search"]').first();
        if (await searchInput.count() > 0) {
            await searchInput.fill('B-IM');
            await page.waitForTimeout(1000);
            await showCaption(page, '5.3', 'Search Batches', 'Find batches by number or material ID');
            shotNum = await capture(page, screenshotDir, 'batches-search', shotNum);
            await page.waitForTimeout(2000);
            await searchInput.clear();
            await page.waitForTimeout(500);
        }

        // View genealogy
        const genealogyBtn = page.locator('button:has-text("View Genealogy")').first();
        if (await genealogyBtn.count() > 0) {
            await genealogyBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            await showCaption(page, '5.4', 'Batch Detail', 'Complete batch information with properties and history');
            shotNum = await capture(page, screenshotDir, 'batch-detail', shotNum);
            await page.waitForTimeout(2000);

            // Scroll to genealogy
            await page.evaluate(() => window.scrollBy(0, 400));
            await showCaption(page, '5.5', 'Batch Genealogy', 'Parent-child relationships for full traceability (forward/backward)');
            shotNum = await capture(page, screenshotDir, 'batch-genealogy', shotNum);
            await page.waitForTimeout(2500);
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION 6: HOLDS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n⏸️ SECTION 6: HOLDS');

        await page.goto(`${BASE_URL}/#/holds`, { waitUntil: 'networkidle' });
        await showCaption(page, '6.1', 'Hold Management', 'Active holds on materials, equipment, operations');
        shotNum = await capture(page, screenshotDir, 'holds-list', shotNum);
        await page.waitForTimeout(2000);

        // Filter by entity type
        const entityTypeFilter = page.locator('select').nth(1);
        if (await entityTypeFilter.count() > 0) {
            try {
                await entityTypeFilter.selectOption('INVENTORY');
                await page.waitForTimeout(1000);
                await showCaption(page, '6.2', 'Filter: INVENTORY Holds', 'View holds on inventory items only');
                shotNum = await capture(page, screenshotDir, 'holds-filter-inventory', shotNum);
                await page.waitForTimeout(2000);
                await entityTypeFilter.selectOption({ index: 0 });
            } catch (e) { console.log('   ⚠️ Holds entity type filter failed'); }
        }

        // Apply hold modal
        const applyHoldBtn = page.locator('button:has-text("Apply Hold")');
        if (await applyHoldBtn.count() > 0) {
            await applyHoldBtn.click();
            await page.waitForTimeout(800);
            await showCaption(page, '6.3', 'Apply Hold Modal', 'Select entity type, entity, reason, and comments');
            shotNum = await capture(page, screenshotDir, 'holds-apply-modal', shotNum);
            await page.waitForTimeout(2000);

            // Select entity type
            const entityTypeSelect = page.locator('#entityType, select[formControlName="entityType"]');
            if (await entityTypeSelect.count() > 0) {
                await entityTypeSelect.selectOption({ index: 1 });
                await page.waitForTimeout(800);
                await showCaption(page, '6.4', 'Select Entity Type', 'Choose: Operation, Process, Order Line, Inventory, Batch, Equipment');
                shotNum = await capture(page, screenshotDir, 'holds-select-entity-type', shotNum);
                await page.waitForTimeout(2000);
            }

            const cancelBtn = page.locator('button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) await cancelBtn.click();
            await page.waitForTimeout(500);
        }

        // Release hold modal
        const releaseBtn = page.locator('button:has-text("Release")').first();
        if (await releaseBtn.count() > 0) {
            await releaseBtn.click();
            await page.waitForTimeout(800);
            await showCaption(page, '6.5', 'Release Hold Modal', 'Add release comments before removing hold');
            shotNum = await capture(page, screenshotDir, 'holds-release-modal', shotNum);
            await page.waitForTimeout(2000);

            const cancelBtn = page.locator('button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) await cancelBtn.click();
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION 7: EQUIPMENT
        // ═══════════════════════════════════════════════════════════════
        console.log('\n⚙️ SECTION 7: EQUIPMENT');

        await page.goto(`${BASE_URL}/#/equipment`, { waitUntil: 'networkidle' });
        await showCaption(page, '7.1', 'Equipment Management', 'Production equipment with status tracking');
        shotNum = await capture(page, screenshotDir, 'equipment-list', shotNum);
        await page.waitForTimeout(2000);

        // Status summary
        await showCaption(page, '7.2', 'Equipment Status', 'Available, In-Use, Maintenance, On-Hold counts');
        shotNum = await capture(page, screenshotDir, 'equipment-status-summary', shotNum);
        await page.waitForTimeout(2000);

        // Filter by status
        const equipStatusFilter = page.locator('select').first();
        if (await equipStatusFilter.count() > 0) {
            try {
                await equipStatusFilter.selectOption('MAINTENANCE');
                await page.waitForTimeout(1000);
                await showCaption(page, '7.3', 'Filter: MAINTENANCE', 'Equipment currently under maintenance');
                shotNum = await capture(page, screenshotDir, 'equipment-filter-maintenance', shotNum);
                await page.waitForTimeout(2000);
                await equipStatusFilter.selectOption({ index: 0 });
            } catch (e) { console.log('   ⚠️ Equipment status filter failed'); }
        }

        // Start maintenance modal
        const maintBtn = page.locator('button:has-text("Maintenance")').first();
        if (await maintBtn.count() > 0) {
            await maintBtn.click();
            await page.waitForTimeout(800);
            await showCaption(page, '7.4', 'Start Maintenance Modal', 'Document maintenance reason and expected completion');
            shotNum = await capture(page, screenshotDir, 'equipment-maintenance-modal', shotNum);
            await page.waitForTimeout(2000);

            const cancelBtn = page.locator('button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) await cancelBtn.click();
        }

        // Put on hold modal
        const equipHoldBtn = page.locator('button:has-text("Hold")').first();
        if (await equipHoldBtn.count() > 0) {
            await equipHoldBtn.click();
            await page.waitForTimeout(800);
            await showCaption(page, '7.5', 'Equipment Hold Modal', 'Block equipment from production use');
            shotNum = await capture(page, screenshotDir, 'equipment-hold-modal', shotNum);
            await page.waitForTimeout(2000);

            const cancelBtn = page.locator('button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) await cancelBtn.click();
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION 8: QUALITY
        // ═══════════════════════════════════════════════════════════════
        console.log('\n✅ SECTION 8: QUALITY');

        await page.goto(`${BASE_URL}/#/quality`, { waitUntil: 'networkidle' });
        await showCaption(page, '8.1', 'Quality Inspection', 'Processes pending quality approval');
        shotNum = await capture(page, screenshotDir, 'quality-pending-list', shotNum);
        await page.waitForTimeout(2000);

        // Pending tab
        const pendingTab = page.locator('button:has-text("Pending"), .tab:has-text("Pending")').first();
        if (await pendingTab.count() > 0) {
            await pendingTab.click();
            await page.waitForTimeout(800);
            await showCaption(page, '8.2', 'Pending Inspections', 'Items awaiting quality accept/reject decision');
            shotNum = await capture(page, screenshotDir, 'quality-pending-tab', shotNum);
            await page.waitForTimeout(2000);
        }

        // Rejected tab
        const rejectedTab = page.locator('button:has-text("Rejected"), .tab:has-text("Rejected")').first();
        if (await rejectedTab.count() > 0) {
            await rejectedTab.click();
            await page.waitForTimeout(800);
            await showCaption(page, '8.3', 'Rejected Items', 'Items that failed quality inspection');
            shotNum = await capture(page, screenshotDir, 'quality-rejected-tab', shotNum);
            await page.waitForTimeout(2000);
        }

        // All records tab
        const allTab = page.locator('button:has-text("All"), .tab:has-text("All")').first();
        if (await allTab.count() > 0) {
            await allTab.click();
            await page.waitForTimeout(800);
            await showCaption(page, '8.4', 'All Quality Records', 'Complete quality inspection history');
            shotNum = await capture(page, screenshotDir, 'quality-all-records', shotNum);
            await page.waitForTimeout(2000);
        }

        // ═══════════════════════════════════════════════════════════════
        // SECTION 9: LOGOUT
        // ═══════════════════════════════════════════════════════════════
        console.log('\n🚪 SECTION 9: LOGOUT');

        await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        await showCaption(page, '9.1', 'Session Complete', 'Click Logout to end session securely');
        shotNum = await capture(page, screenshotDir, 'before-logout', shotNum);
        await page.waitForTimeout(2000);

        const logoutBtn = page.locator('button:has-text("Logout")');
        if (await logoutBtn.count() > 0) {
            await logoutBtn.click();
            await page.waitForTimeout(1500);
            await showCaption(page, '9.2', 'Logged Out', 'Session ended - JWT token cleared');
            shotNum = await capture(page, screenshotDir, 'after-logout', shotNum);
            await page.waitForTimeout(2000);
        }

        // Final frame
        await showCaption(page, 'END', 'Demo Complete', 'MES Production Confirmation POC - 499 Backend + 257 Frontend + 67 E2E Tests');
        shotNum = await capture(page, screenshotDir, 'demo-complete', shotNum);
        await page.waitForTimeout(3000);

        console.log('\n✅ Recording complete!');

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
    }

    await page.close();
    await context.close();
    await browser.close();

    // Find video file
    const files = fs.readdirSync(outputDir);
    const videoFile = files.find(f => f.endsWith('.webm'));

    console.log('\n' + '═'.repeat(70));
    console.log('COMPREHENSIVE DEMO COMPLETE');
    console.log('═'.repeat(70));
    console.log(`📁 Output: ${outputDir}`);
    if (videoFile) console.log(`🎬 Video: ${path.join(outputDir, videoFile)}`);
    console.log(`📸 Screenshots: ${shotNum - 1} files`);
    console.log('═'.repeat(70));
}

// Check servers
async function checkServers() {
    const http = require('http');
    const checkUrl = (url) => new Promise((resolve) => {
        http.get(url, (res) => resolve(res.statusCode < 600)).on('error', () => resolve(false));
    });

    const frontend = await checkUrl('http://localhost:4200');
    const backend = await checkUrl('http://localhost:8080/api/dashboard/stats');

    if (!frontend || !backend) {
        console.error('ERROR: Servers not running!');
        if (!backend) console.error('Backend: cd backend && gradlew bootRun --args="--spring.profiles.active=demo"');
        if (!frontend) console.error('Frontend: cd frontend && npm start');
        process.exit(1);
    }
}

checkServers().then(() => recordComprehensiveDemo()).catch(console.error);
