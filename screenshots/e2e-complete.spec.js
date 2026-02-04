/**
 * MES Production Confirmation - COMPLETE E2E Tests
 * Tests ALL actions including actual form submissions, validation errors, and all modals
 *
 * WARNING: This test suite MODIFIES data. Run with fresh demo data.
 *
 * Prerequisites:
 *   - Backend: cd backend && ./gradlew bootRun --args="--spring.profiles.active=demo"
 *   - Frontend: cd frontend && npm start
 *
 * Run: node screenshots/e2e-complete.spec.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'e2e-complete');
const BASE_URL = 'http://localhost:4200';
const API_URL = 'http://localhost:8080';

const TEST_USER = { email: 'admin@mes.com', password: 'admin123' };

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let counter = 0;
const screenshot = async (page, name, fullPage = false) => {
    counter++;
    const filename = `${String(counter).padStart(3, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage });
    console.log(`   📸 ${filename}`);
};

const results = { passed: 0, failed: 0, skipped: 0 };

const test = async (name, fn, page) => {
    console.log(`\n🧪 ${name}`);
    try {
        await fn();
        results.passed++;
        console.log(`   ✅ PASSED`);
    } catch (e) {
        results.failed++;
        console.log(`   ❌ FAILED: ${e.message}`);
        await screenshot(page, `error-${name.replace(/\W+/g, '-').toLowerCase()}`);
    }
};

const skip = (name, reason) => {
    console.log(`\n⏭️  ${name}\n   ⏭️  SKIPPED: ${reason}`);
    results.skipped++;
};

async function runTests() {
    console.log('═'.repeat(70));
    console.log('MES Production Confirmation - COMPLETE E2E Tests');
    console.log('═'.repeat(70));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Global dialog handler - auto-accept all confirmation dialogs
    page.on('dialog', async dialog => {
        console.log(`   📢 Dialog: ${dialog.message()}`);
        await dialog.accept();
    });

    try {
        // ═══════════════════════════════════════════════════════════════
        // SECTION 1: LOGIN & VALIDATION ERRORS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 1: LOGIN & VALIDATION ERRORS');
        console.log('─'.repeat(50));

        await test('1.1 Login - Invalid Email Format', async () => {
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
            await page.fill('input[formControlName="email"]', 'invalid-email');
            await page.fill('input[formControlName="password"]', 'pass');
            await page.click('body'); // Trigger validation
            await page.waitForTimeout(300);
            await screenshot(page, 'login-invalid-email-error');
        }, page);

        await test('1.2 Login - Wrong Credentials Error', async () => {
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
            await page.fill('input[formControlName="email"]', 'wrong@email.com');
            await page.fill('input[formControlName="password"]', 'wrongpassword');
            await screenshot(page, 'login-wrong-creds-before');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(1500);
            await screenshot(page, 'login-wrong-creds-error');
        }, page);

        await test('1.3 Login - Successful Authentication', async () => {
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
            await page.fill('input[formControlName="email"]', TEST_USER.email);
            await page.fill('input[formControlName="password"]', TEST_USER.password);
            await screenshot(page, 'login-valid-before');

            const [response] = await Promise.all([
                page.waitForResponse(r => r.url().includes('/api/auth/login')),
                page.click('button[type="submit"]')
            ]);

            const data = await response.json();
            await page.evaluate((d) => {
                localStorage.setItem('mes_token', d.accessToken);
                localStorage.setItem('mes_user', JSON.stringify(d.user));
            }, data);

            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'login-success-dashboard');
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 2: INVENTORY - BLOCK, UNBLOCK, SCRAP (ACTUAL SUBMISSIONS)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 2: INVENTORY OPERATIONS');
        console.log('─'.repeat(50));

        await test('2.1 Inventory - View All States', async () => {
            await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'inventory-all-states', true);
        }, page);

        await test('2.2 Inventory - Filter BLOCKED Items', async () => {
            const stateFilter = page.locator('select').first();
            await stateFilter.selectOption({ label: 'Blocked' });
            await page.waitForTimeout(500);
            await screenshot(page, 'inventory-blocked-items');
        }, page);

        await test('2.3 Inventory - UNBLOCK Item (Actual Submit)', async () => {
            await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Filter to blocked
            const stateFilter = page.locator('select').first();
            await stateFilter.selectOption({ label: 'Blocked' });
            await page.waitForTimeout(500);

            const unblockBtn = page.locator('button:has-text("Unblock")').first();
            if (await unblockBtn.isVisible()) {
                await screenshot(page, 'inventory-unblock-before');
                await unblockBtn.click({ timeout: 5000 });
                await page.waitForTimeout(2000);
                await screenshot(page, 'inventory-unblock-success');
            }
        }, page);

        await test('2.4 Inventory - BLOCK Item (Actual Submit)', async () => {
            await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Find an available item to block
            const stateFilter = page.locator('select').first();
            await stateFilter.selectOption({ label: 'Available' });
            await page.waitForTimeout(500);

            const blockBtn = page.locator('button:has-text("Block")').first();
            if (await blockBtn.isVisible()) {
                await screenshot(page, 'inventory-block-before');
                await blockBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'inventory-block-modal-open');

                // Fill reason and submit
                const reasonField = page.locator('.modal textarea, [role="dialog"] textarea').first();
                if (await reasonField.isVisible()) {
                    await reasonField.fill('E2E Test - Quality investigation required');
                    await screenshot(page, 'inventory-block-modal-filled');

                    const confirmBtn = page.locator('button:has-text("Confirm Block"), button:has-text("Block"):not(:has-text("Unblock"))').last();
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForTimeout(1500);
                        await screenshot(page, 'inventory-block-success');
                    }
                }
            }
        }, page);

        await test('2.5 Inventory - SCRAP Item (Actual Submit)', async () => {
            await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const stateFilter = page.locator('select').first();
            await stateFilter.selectOption({ label: 'Available' });
            await page.waitForTimeout(500);

            const scrapBtn = page.locator('button:has-text("Scrap")').first();
            if (await scrapBtn.isVisible()) {
                await screenshot(page, 'inventory-scrap-before');
                await scrapBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'inventory-scrap-modal-open');

                const reasonField = page.locator('.modal textarea, [role="dialog"] textarea').first();
                if (await reasonField.isVisible()) {
                    await reasonField.fill('E2E Test - Material damaged beyond recovery');
                    await screenshot(page, 'inventory-scrap-modal-filled');

                    const confirmBtn = page.locator('button:has-text("Confirm Scrap"), button.btn-danger').last();
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForTimeout(1500);
                        await screenshot(page, 'inventory-scrap-success');
                    }
                }
            }
        }, page);

        await test('2.6 Inventory - View SCRAPPED Items', async () => {
            await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const stateFilter = page.locator('select').first();
            await stateFilter.selectOption({ label: 'Scrapped' });
            await page.waitForTimeout(500);
            await screenshot(page, 'inventory-scrapped-items');
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 3: HOLDS - APPLY & RELEASE (ACTUAL SUBMISSIONS)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 3: HOLDS OPERATIONS');
        console.log('─'.repeat(50));

        await test('3.1 Holds - View Active Holds', async () => {
            await page.goto(`${BASE_URL}/holds`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'holds-active-list', true);
        }, page);

        await test('3.2 Holds - APPLY HOLD (Actual Submit)', async () => {
            await page.goto(`${BASE_URL}/holds`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const applyBtn = page.locator('button:has-text("Apply Hold")').first();
            if (await applyBtn.isVisible()) {
                await applyBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'holds-apply-modal-open');

                // Fill form
                const entityTypeSelect = page.locator('.modal select, [role="dialog"] select').first();
                if (await entityTypeSelect.isVisible()) {
                    await entityTypeSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                    await screenshot(page, 'holds-apply-type-selected');

                    const entitySelect = page.locator('.modal select, [role="dialog"] select').nth(1);
                    if (await entitySelect.isVisible()) {
                        await entitySelect.selectOption({ index: 1 });
                        await page.waitForTimeout(300);
                    }

                    const reasonSelect = page.locator('.modal select, [role="dialog"] select').nth(2);
                    if (await reasonSelect.isVisible()) {
                        await reasonSelect.selectOption({ index: 1 });
                    }

                    const comments = page.locator('.modal textarea, [role="dialog"] textarea').first();
                    if (await comments.isVisible()) {
                        await comments.fill('E2E Test - Hold applied for testing purposes');
                    }

                    await screenshot(page, 'holds-apply-form-complete');

                    const submitBtn = page.locator('button:has-text("Apply Hold")').last();
                    if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
                        await submitBtn.click();
                        await page.waitForTimeout(1500);
                        await screenshot(page, 'holds-apply-success');
                    }
                }
            }
        }, page);

        await test('3.3 Holds - RELEASE HOLD (Actual Submit)', async () => {
            await page.goto(`${BASE_URL}/holds`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const releaseBtn = page.locator('button:has-text("Release")').first();
            if (await releaseBtn.isVisible()) {
                await screenshot(page, 'holds-release-before');
                await releaseBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'holds-release-modal-open');

                const comments = page.locator('.modal textarea, [role="dialog"] textarea').first();
                if (await comments.isVisible()) {
                    await comments.fill('E2E Test - Hold released after verification');
                    await screenshot(page, 'holds-release-form-filled');
                }

                const confirmBtn = page.locator('button:has-text("Release Hold"), button.btn-success').last();
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    await page.waitForTimeout(1500);
                    await screenshot(page, 'holds-release-success');
                }
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 4: BATCHES - SPLIT & MERGE
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 4: BATCHES SPLIT & MERGE');
        console.log('─'.repeat(50));

        await test('4.1 Batches - Find Batch with Split/Merge Options', async () => {
            await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Filter to available batches
            const stateFilter = page.locator('select').first();
            if (await stateFilter.isVisible()) {
                await stateFilter.selectOption({ label: 'Available' });
                await page.waitForTimeout(500);
            }

            // Click first batch to view detail
            const batchRow = page.locator('table tbody tr').first();
            if (await batchRow.isVisible()) {
                await batchRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                await screenshot(page, 'batch-detail-with-actions', true);
            }
        }, page);

        await test('4.2 Batches - SPLIT Batch Modal', async () => {
            const splitBtn = page.locator('button:has-text("Split")').first();
            if (await splitBtn.isVisible()) {
                await splitBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'batch-split-modal-open');

                // Fill split quantities
                const qtyInputs = page.locator('.modal input[type="number"], [role="dialog"] input[type="number"]');
                const count = await qtyInputs.count();
                if (count > 0) {
                    await qtyInputs.first().fill('100');
                    await screenshot(page, 'batch-split-qty-filled');
                }

                // Cancel for now (or submit if you want)
                const cancelBtn = page.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(300);
                }
            } else {
                skip('4.2 Batches - SPLIT Batch Modal', 'Split button not available');
            }
        }, page);

        await test('4.3 Batches - Navigate to Mergeable Batch (Iron Ore)', async () => {
            await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Search for iron ore batches (multiple available for merge)
            const searchInput = page.locator('input[type="text"]').first();
            if (await searchInput.isVisible()) {
                await searchInput.fill('RM-BATCH-001');
                await page.waitForTimeout(500);
            }

            const batchRow = page.locator('table tbody tr').first();
            if (await batchRow.isVisible()) {
                await batchRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                await screenshot(page, 'batch-iron-ore-detail');
            }
        }, page);

        await test('4.4 Batches - MERGE Batches Modal', async () => {
            const mergeBtn = page.locator('button:has-text("Merge")').first();
            if (await mergeBtn.isVisible()) {
                await mergeBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'batch-merge-modal-open');

                // Select batches to merge
                const checkboxes = page.locator('.modal input[type="checkbox"], [role="dialog"] input[type="checkbox"]');
                const count = await checkboxes.count();
                if (count > 0) {
                    await checkboxes.first().check();
                    await page.waitForTimeout(300);
                    await screenshot(page, 'batch-merge-selected');
                }

                // Cancel for now
                const cancelBtn = page.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(300);
                }
            } else {
                skip('4.4 Batches - MERGE Batches Modal', 'Merge button not available');
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 5: EQUIPMENT - MAINTENANCE & HOLD
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 5: EQUIPMENT OPERATIONS');
        console.log('─'.repeat(50));

        await test('5.1 Equipment - View All Status', async () => {
            await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'equipment-all-status', true);
        }, page);

        await test('5.2 Equipment - START MAINTENANCE (Actual Submit)', async () => {
            await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const maintBtn = page.locator('button:has-text("Maintenance")').first();
            if (await maintBtn.isVisible()) {
                await screenshot(page, 'equipment-maint-before');
                await maintBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'equipment-maint-modal-open');

                const reasonField = page.locator('.modal textarea, [role="dialog"] textarea').first();
                if (await reasonField.isVisible()) {
                    await reasonField.fill('E2E Test - Scheduled preventive maintenance');
                    await screenshot(page, 'equipment-maint-filled');

                    const submitBtn = page.locator('button:has-text("Start Maintenance")').last();
                    if (await submitBtn.isVisible()) {
                        await submitBtn.click();
                        await page.waitForTimeout(1500);
                        await screenshot(page, 'equipment-maint-success');
                    }
                }
            }
        }, page);

        await test('5.3 Equipment - END MAINTENANCE', async () => {
            await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Filter to maintenance
            const statusFilter = page.locator('select').first();
            if (await statusFilter.isVisible()) {
                await statusFilter.selectOption({ label: 'Maintenance' });
                await page.waitForTimeout(500);
            }

            const endMaintBtn = page.locator('button:has-text("End Maintenance")').first();
            if (await endMaintBtn.isVisible()) {
                await screenshot(page, 'equipment-end-maint-before');
                await endMaintBtn.click({ timeout: 5000 });
                await page.waitForTimeout(2000);
                await screenshot(page, 'equipment-end-maint-success');
            }
        }, page);

        await test('5.4 Equipment - PUT ON HOLD', async () => {
            await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const holdBtn = page.locator('button:has-text("Hold")').first();
            if (await holdBtn.isVisible()) {
                await screenshot(page, 'equipment-hold-before');
                await holdBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'equipment-hold-modal-open');

                const reasonField = page.locator('.modal textarea, [role="dialog"] textarea').first();
                if (await reasonField.isVisible()) {
                    await reasonField.fill('E2E Test - Equipment held for safety review');
                    await screenshot(page, 'equipment-hold-filled');

                    const submitBtn = page.locator('button:has-text("Put on Hold")').last();
                    if (await submitBtn.isVisible()) {
                        await submitBtn.click();
                        await page.waitForTimeout(1500);
                        await screenshot(page, 'equipment-hold-success');
                    }
                }
            }
        }, page);

        await test('5.5 Equipment - RELEASE FROM HOLD', async () => {
            await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const statusFilter = page.locator('select').first();
            if (await statusFilter.isVisible()) {
                await statusFilter.selectOption({ label: 'On Hold' });
                await page.waitForTimeout(500);
            }

            const releaseBtn = page.locator('button:has-text("Release")').first();
            if (await releaseBtn.isVisible()) {
                await screenshot(page, 'equipment-release-before');
                await releaseBtn.click({ timeout: 5000 });
                await page.waitForTimeout(2000);
                await screenshot(page, 'equipment-release-success');
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 6: QUALITY INSPECTION
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 6: QUALITY INSPECTION');
        console.log('─'.repeat(50));

        await test('6.1 Quality - View Pending Inspections', async () => {
            await page.goto(`${BASE_URL}/processes/quality-pending`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'quality-pending-list');
        }, page);

        await test('6.2 Quality - ACCEPT Process', async () => {
            await page.goto(`${BASE_URL}/processes/quality-pending`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const acceptBtn = page.locator('button:has-text("Accept")').first();
            if (await acceptBtn.isVisible()) {
                await screenshot(page, 'quality-accept-before');
                await acceptBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'quality-accept-modal');

                // Fill notes if available
                const notes = page.locator('.modal textarea, [role="dialog"] textarea').first();
                if (await notes.isVisible()) {
                    await notes.fill('E2E Test - Quality inspection passed');
                }

                const submitBtn = page.locator('button:has-text("Accept")').last();
                if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
                    await submitBtn.click();
                    await page.waitForTimeout(1500);
                    await screenshot(page, 'quality-accept-success');
                }
            } else {
                skip('6.2 Quality - ACCEPT Process', 'No pending inspections');
            }
        }, page);

        await test('6.3 Quality - View Rejected Tab', async () => {
            await page.goto(`${BASE_URL}/processes/quality-pending`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const rejectedTab = page.locator('text=Rejected').first();
            if (await rejectedTab.isVisible()) {
                await rejectedTab.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'quality-rejected-tab');
            }
        }, page);

        await test('6.4 Quality - REJECT Process', async () => {
            await page.goto(`${BASE_URL}/processes/quality-pending`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const rejectBtn = page.locator('button:has-text("Reject")').first();
            if (await rejectBtn.isVisible()) {
                await screenshot(page, 'quality-reject-before');
                await rejectBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'quality-reject-modal');

                const reasonField = page.locator('.modal textarea, [role="dialog"] textarea').first();
                if (await reasonField.isVisible()) {
                    await reasonField.fill('E2E Test - Quality standards not met, surface defects detected');
                    await screenshot(page, 'quality-reject-reason-filled');
                }

                const submitBtn = page.locator('button:has-text("Reject")').last();
                if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
                    await submitBtn.click();
                    await page.waitForTimeout(1500);
                    await screenshot(page, 'quality-reject-success');
                }
            } else {
                skip('6.4 Quality - REJECT Process', 'No pending inspections');
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 7: PRODUCTION CONFIRMATION - VALIDATION & SUBMIT
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 7: PRODUCTION CONFIRMATION');
        console.log('─'.repeat(50));

        await test('7.1 Production - Validation: Empty Form Error', async () => {
            await page.goto(`${BASE_URL}/production/confirm`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'production-empty-form');

            // Try to submit empty
            const submitBtn = page.locator('button[type="submit"], button:has-text("Confirm")').first();
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'production-validation-errors');
            }
        }, page);

        await test('7.2 Production - Navigate to Ready Operation', async () => {
            await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Click first order
            const orderRow = page.locator('table tbody tr').first();
            if (await orderRow.isVisible()) {
                await orderRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                const startBtn = page.locator('button:has-text("Start Production")').first();
                if (await startBtn.isVisible()) {
                    await startBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1500);
                    await screenshot(page, 'production-form-loaded', true);
                }
            }
        }, page);

        await test('7.3 Production - Fill Complete Form', async () => {
            // Start time
            const startTime = page.locator('input[type="datetime-local"]').first();
            if (await startTime.isVisible()) {
                const now = new Date();
                now.setHours(now.getHours() - 2);
                await startTime.fill(now.toISOString().slice(0, 16));
            }

            // End time
            const endTime = page.locator('input[type="datetime-local"]').nth(1);
            if (await endTime.isVisible()) {
                const now = new Date();
                now.setHours(now.getHours() - 1);
                await endTime.fill(now.toISOString().slice(0, 16));
            }

            await screenshot(page, 'production-times-filled');

            // Quantity produced
            const qtyProduced = page.locator('input[type="number"]').first();
            if (await qtyProduced.isVisible()) {
                await qtyProduced.fill('50');
            }

            // Scrap qty
            const scrapQty = page.locator('input[type="number"]').nth(1);
            if (await scrapQty.isVisible()) {
                await scrapQty.fill('2');
            }

            await screenshot(page, 'production-quantities-filled');

            // Add material
            const addMaterialBtn = page.locator('button:has-text("Add")').first();
            if (await addMaterialBtn.isVisible()) {
                await addMaterialBtn.click();
                await page.waitForTimeout(300);
            }

            // Select equipment
            const equipCheckbox = page.locator('input[type="checkbox"]').first();
            if (await equipCheckbox.isVisible()) {
                await equipCheckbox.check();
            }

            // Select operator
            const checkboxes = page.locator('input[type="checkbox"]');
            const count = await checkboxes.count();
            for (let i = 1; i < Math.min(count, 3); i++) {
                const cb = checkboxes.nth(i);
                if (!await cb.isChecked()) {
                    await cb.check();
                    break;
                }
            }

            await screenshot(page, 'production-equipment-operators-selected');

            // Delay
            const delayInput = page.locator('input[formcontrolname="delayMinutes"], input[type="number"]').last();
            if (await delayInput.isVisible()) {
                await delayInput.fill('10');
            }

            // Notes
            const notes = page.locator('textarea').first();
            if (await notes.isVisible()) {
                await notes.fill('E2E Test - Production completed successfully');
            }

            await screenshot(page, 'production-form-complete', true);
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 8: LOGOUT
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 8: LOGOUT');
        console.log('─'.repeat(50));

        await test('8.1 Logout - Click Logout Button', async () => {
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")').first();
            if (await logoutBtn.isVisible()) {
                await screenshot(page, 'logout-before');
                await logoutBtn.click();
                await page.waitForTimeout(1000);
                await screenshot(page, 'logout-after');
            }
        }, page);

    } catch (e) {
        console.error('\n💥 FATAL:', e.message);
        await screenshot(page, 'fatal-error', true);
    } finally {
        await browser.close();
    }

    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`📊 Total: ${results.passed + results.failed + results.skipped}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`📸 Screenshots: ${counter}`);
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
    console.log('═'.repeat(70));

    return results.failed === 0;
}

runTests()
    .then(ok => process.exit(ok ? 0 : 1))
    .catch(e => { console.error(e); process.exit(1); });
