/**
 * MES Production Confirmation - Comprehensive E2E Tests
 * Covers ALL actions, modals, popups, forms, and interactions
 *
 * Prerequisites:
 *   - Backend running: cd backend && ./gradlew bootRun --args="--spring.profiles.active=demo"
 *   - Frontend running: cd frontend && npm start
 *
 * Run: node screenshots/e2e-comprehensive.spec.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'e2e-full');
const BASE_URL = 'http://localhost:4200';

const TEST_USER = { email: 'admin@mes.com', password: 'admin123' };

// Ensure directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Screenshot counter for ordering
let screenshotCounter = 0;

async function screenshot(page, name, fullPage = false) {
    screenshotCounter++;
    const filename = `${String(screenshotCounter).padStart(3, '0')}-${name}.png`;
    await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, filename),
        fullPage
    });
    console.log(`   📸 ${filename}`);
    return filename;
}

async function beforeAfter(page, name, action, fullPageAfter = false) {
    await screenshot(page, `${name}-before`);
    await action();
    await page.waitForTimeout(500);
    await screenshot(page, `${name}-after`, fullPageAfter);
}

// Test tracking
const results = { passed: 0, failed: 0, skipped: 0, tests: [] };

async function test(name, fn, page) {
    console.log(`\n🧪 ${name}`);
    try {
        await fn();
        results.passed++;
        results.tests.push({ name, status: '✅ PASSED' });
        console.log(`   ✅ PASSED`);
    } catch (error) {
        results.failed++;
        results.tests.push({ name, status: '❌ FAILED', error: error.message });
        console.log(`   ❌ FAILED: ${error.message}`);
        await screenshot(page, `error-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`);
    }
}

async function skip(name, reason) {
    console.log(`\n⏭️  ${name}`);
    console.log(`   ⏭️  SKIPPED: ${reason}`);
    results.skipped++;
    results.tests.push({ name, status: '⏭️ SKIPPED', reason });
}

async function runComprehensiveTests() {
    console.log('═'.repeat(70));
    console.log('MES Production Confirmation - COMPREHENSIVE E2E Tests');
    console.log('═'.repeat(70));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
            // Suppress non-critical errors in output
        }
    });

    try {
        // ═══════════════════════════════════════════════════════════════
        // SECTION 1: AUTHENTICATION
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 1: AUTHENTICATION');
        console.log('─'.repeat(50));

        await test('1.1 Login Page - Empty Form Display', async () => {
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
            await page.waitForSelector('input[formControlName="email"]');
            await screenshot(page, 'login-empty-form');
        }, page);

        await test('1.2 Login Page - Fill Email Field', async () => {
            await beforeAfter(page, 'login-fill-email', async () => {
                await page.fill('input[formControlName="email"]', TEST_USER.email);
            });
        }, page);

        await test('1.3 Login Page - Fill Password Field', async () => {
            await beforeAfter(page, 'login-fill-password', async () => {
                await page.fill('input[formControlName="password"]', TEST_USER.password);
            });
        }, page);

        await test('1.4 Login Page - Submit and Authenticate', async () => {
            await screenshot(page, 'login-before-submit');

            const [response] = await Promise.all([
                page.waitForResponse(r => r.url().includes('/api/auth/login')),
                page.click('button[type="submit"]')
            ]);

            if (response.status() !== 200) throw new Error('Login failed');

            const loginData = await response.json();
            await page.evaluate((data) => {
                localStorage.setItem('mes_token', data.accessToken);
                localStorage.setItem('mes_user', JSON.stringify(data.user));
            }, loginData);

            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'login-success-dashboard');
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 2: DASHBOARD
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 2: DASHBOARD');
        console.log('─'.repeat(50));

        await test('2.1 Dashboard - View All Statistics Cards', async () => {
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'dashboard-full-view', true);
        }, page);

        await test('2.2 Dashboard - Click Orders Card', async () => {
            const ordersCard = page.locator('text=Total Orders').first();
            if (await ordersCard.isVisible()) {
                await beforeAfter(page, 'dashboard-click-orders', async () => {
                    await ordersCard.click();
                    await page.waitForLoadState('networkidle');
                });
            }
        }, page);

        await test('2.3 Dashboard - Navigate Back and Click Holds Card', async () => {
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);
            const holdsCard = page.locator('text=Active Holds').first();
            if (await holdsCard.isVisible()) {
                await beforeAfter(page, 'dashboard-click-holds', async () => {
                    await holdsCard.click();
                    await page.waitForLoadState('networkidle');
                });
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 3: ORDERS MODULE
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 3: ORDERS MODULE');
        console.log('─'.repeat(50));

        await test('3.1 Orders - View List', async () => {
            await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'orders-list-view');
        }, page);

        await test('3.2 Orders - Filter by Status (In Progress)', async () => {
            const statusFilter = page.locator('select').first();
            if (await statusFilter.isVisible()) {
                await beforeAfter(page, 'orders-filter-inprogress', async () => {
                    await statusFilter.selectOption({ label: 'In Progress' });
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('3.3 Orders - Filter by Status (All)', async () => {
            const statusFilter = page.locator('select').first();
            if (await statusFilter.isVisible()) {
                await statusFilter.selectOption({ index: 0 });
                await page.waitForTimeout(500);
                await screenshot(page, 'orders-filter-all');
            }
        }, page);

        await test('3.4 Orders - Click to View Order Detail', async () => {
            const orderRow = page.locator('table tbody tr').first();
            if (await orderRow.isVisible()) {
                await beforeAfter(page, 'orders-view-detail', async () => {
                    await orderRow.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                }, true);
            }
        }, page);

        await test('3.5 Orders - View Operations Timeline', async () => {
            // Already on order detail page
            await screenshot(page, 'orders-operations-timeline', true);
        }, page);

        await test('3.6 Orders - Click Start Production Button', async () => {
            const startBtn = page.locator('button:has-text("Start Production"), button:has-text("Continue Production")').first();
            if (await startBtn.isVisible()) {
                await beforeAfter(page, 'orders-start-production', async () => {
                    await startBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                }, true);
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 4: PRODUCTION CONFIRMATION
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 4: PRODUCTION CONFIRMATION');
        console.log('─'.repeat(50));

        await test('4.1 Production - View Empty Confirmation Form', async () => {
            await page.goto(`${BASE_URL}/production/confirm`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'production-form-empty', true);
        }, page);

        // Navigate to a specific operation for full form test
        await test('4.2 Production - Navigate to Ready Operation', async () => {
            await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Click first order
            const orderRow = page.locator('table tbody tr').first();
            if (await orderRow.isVisible()) {
                await orderRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Find start production button
                const startBtn = page.locator('button:has-text("Start Production")').first();
                if (await startBtn.isVisible()) {
                    await startBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1500);
                    await screenshot(page, 'production-form-with-operation', true);
                }
            }
        }, page);

        await test('4.3 Production - Fill Start Time', async () => {
            const startTime = page.locator('input[type="datetime-local"]').first();
            if (await startTime.isVisible()) {
                const now = new Date();
                now.setHours(now.getHours() - 2);
                const timeStr = now.toISOString().slice(0, 16);
                await beforeAfter(page, 'production-fill-starttime', async () => {
                    await startTime.fill(timeStr);
                });
            }
        }, page);

        await test('4.4 Production - Fill End Time', async () => {
            const endTime = page.locator('input[type="datetime-local"]').nth(1);
            if (await endTime.isVisible()) {
                const now = new Date();
                now.setHours(now.getHours() - 1);
                const timeStr = now.toISOString().slice(0, 16);
                await beforeAfter(page, 'production-fill-endtime', async () => {
                    await endTime.fill(timeStr);
                });
            }
        }, page);

        await test('4.5 Production - Fill Quantity Produced', async () => {
            const qtyInput = page.locator('input[formcontrolname="quantityProduced"], input[id*="produced"], input[placeholder*="produced"]').first();
            if (await qtyInput.isVisible()) {
                await beforeAfter(page, 'production-fill-quantity', async () => {
                    await qtyInput.fill('50');
                });
            }
        }, page);

        await test('4.6 Production - Add Material from Available Inventory', async () => {
            const addBtn = page.locator('button:has-text("Add"), button.btn-success').first();
            if (await addBtn.isVisible()) {
                await beforeAfter(page, 'production-add-material', async () => {
                    await addBtn.click();
                    await page.waitForTimeout(500);
                }, true);
            }
        }, page);

        await test('4.7 Production - Select Equipment (Checkbox)', async () => {
            const equipmentCheckbox = page.locator('input[type="checkbox"]').first();
            if (await equipmentCheckbox.isVisible()) {
                await beforeAfter(page, 'production-select-equipment', async () => {
                    await equipmentCheckbox.check();
                });
            }
        }, page);

        await test('4.8 Production - Select Operator (Checkbox)', async () => {
            const checkboxes = page.locator('input[type="checkbox"]');
            const count = await checkboxes.count();
            if (count > 1) {
                await beforeAfter(page, 'production-select-operator', async () => {
                    // Find an unchecked operator checkbox
                    for (let i = 0; i < count; i++) {
                        const cb = checkboxes.nth(i);
                        if (!await cb.isChecked()) {
                            await cb.check();
                            break;
                        }
                    }
                });
            }
        }, page);

        await test('4.9 Production - Fill Delay Duration', async () => {
            const delayInput = page.locator('input[formcontrolname="delayMinutes"], input[type="number"]').last();
            if (await delayInput.isVisible()) {
                await beforeAfter(page, 'production-fill-delay', async () => {
                    await delayInput.fill('15');
                });
            }
        }, page);

        await test('4.10 Production - Select Delay Reason', async () => {
            const delayDropdown = page.locator('select[formcontrolname="delayReason"]');
            if (await delayDropdown.isVisible()) {
                await beforeAfter(page, 'production-select-delay-reason', async () => {
                    await delayDropdown.selectOption({ index: 1 });
                });
            }
        }, page);

        await test('4.11 Production - Fill Notes', async () => {
            const notesField = page.locator('textarea').first();
            if (await notesField.isVisible()) {
                await beforeAfter(page, 'production-fill-notes', async () => {
                    await notesField.fill('Production completed successfully with no issues.');
                });
            }
        }, page);

        await test('4.12 Production - View Completed Form (Ready to Submit)', async () => {
            await screenshot(page, 'production-form-complete', true);
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 5: INVENTORY MODULE
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 5: INVENTORY MODULE');
        console.log('─'.repeat(50));

        await test('5.1 Inventory - View List', async () => {
            await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'inventory-list-view', true);
        }, page);

        await test('5.2 Inventory - Filter by State (Available)', async () => {
            const stateFilter = page.locator('select').first();
            if (await stateFilter.isVisible()) {
                await beforeAfter(page, 'inventory-filter-available', async () => {
                    await stateFilter.selectOption({ label: 'Available' });
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('5.3 Inventory - Filter by Type (Raw Material)', async () => {
            const typeFilter = page.locator('select').nth(1);
            if (await typeFilter.isVisible()) {
                await beforeAfter(page, 'inventory-filter-rm', async () => {
                    await typeFilter.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('5.4 Inventory - Search by Batch Number', async () => {
            // Reset filters first
            await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
            if (await searchInput.isVisible()) {
                await beforeAfter(page, 'inventory-search', async () => {
                    await searchInput.fill('RM-BATCH');
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('5.5 Inventory - Open Block Modal', async () => {
            await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const blockBtn = page.locator('button:has-text("Block")').first();
            if (await blockBtn.isVisible()) {
                await beforeAfter(page, 'inventory-block-modal', async () => {
                    await blockBtn.click();
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('5.6 Inventory - Fill Block Reason in Modal', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const reasonField = modal.locator('textarea').first();
                if (await reasonField.isVisible()) {
                    await beforeAfter(page, 'inventory-block-reason', async () => {
                        await reasonField.fill('Quality investigation required - suspected contamination');
                    });
                }
            }
        }, page);

        await test('5.7 Inventory - Close Block Modal (Cancel)', async () => {
            const cancelBtn = page.locator('button:has-text("Cancel")').first();
            if (await cancelBtn.isVisible()) {
                await beforeAfter(page, 'inventory-block-cancel', async () => {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('5.8 Inventory - Open Scrap Modal', async () => {
            const scrapBtn = page.locator('button:has-text("Scrap")').first();
            if (await scrapBtn.isVisible()) {
                await beforeAfter(page, 'inventory-scrap-modal', async () => {
                    await scrapBtn.click();
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('5.9 Inventory - Fill Scrap Reason in Modal', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const reasonField = modal.locator('textarea').first();
                if (await reasonField.isVisible()) {
                    await beforeAfter(page, 'inventory-scrap-reason', async () => {
                        await reasonField.fill('Material damaged beyond recovery - water contamination');
                    });
                }
            }
        }, page);

        await test('5.10 Inventory - Close Scrap Modal (Cancel)', async () => {
            const cancelBtn = page.locator('button:has-text("Cancel")').first();
            if (await cancelBtn.isVisible()) {
                await cancelBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'inventory-scrap-cancelled');
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 6: BATCHES MODULE
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 6: BATCHES MODULE');
        console.log('─'.repeat(50));

        await test('6.1 Batches - View List', async () => {
            await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'batches-list-view');
        }, page);

        await test('6.2 Batches - Filter by State (Available)', async () => {
            const stateFilter = page.locator('select').first();
            if (await stateFilter.isVisible()) {
                await beforeAfter(page, 'batches-filter-available', async () => {
                    await stateFilter.selectOption({ label: 'Available' });
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('6.3 Batches - Search by Batch Number', async () => {
            const searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
            if (await searchInput.isVisible()) {
                await beforeAfter(page, 'batches-search', async () => {
                    await searchInput.fill('IM-BATCH');
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('6.4 Batches - Click to View Batch Detail', async () => {
            await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const batchRow = page.locator('table tbody tr').first();
            if (await batchRow.isVisible()) {
                await beforeAfter(page, 'batches-view-detail', async () => {
                    await batchRow.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                }, true);
            }
        }, page);

        await test('6.5 Batches - View Genealogy (Traceability)', async () => {
            // Already on batch detail
            await screenshot(page, 'batches-genealogy-view', true);
        }, page);

        await test('6.6 Batches - Open Split Batch Modal', async () => {
            const splitBtn = page.locator('button:has-text("Split")').first();
            if (await splitBtn.isVisible()) {
                await beforeAfter(page, 'batches-split-modal', async () => {
                    await splitBtn.click();
                    await page.waitForTimeout(500);
                });
            } else {
                await skip('6.6 Batches - Open Split Batch Modal', 'Split button not available for this batch');
            }
        }, page);

        await test('6.7 Batches - Fill Split Quantities', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const qtyInput = modal.locator('input[type="number"]').first();
                if (await qtyInput.isVisible()) {
                    await beforeAfter(page, 'batches-split-fill', async () => {
                        await qtyInput.fill('25');
                    });
                }
                // Close modal
                const cancelBtn = modal.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                }
            }
        }, page);

        await test('6.8 Batches - Open Merge Batches Modal', async () => {
            const mergeBtn = page.locator('button:has-text("Merge")').first();
            if (await mergeBtn.isVisible()) {
                await beforeAfter(page, 'batches-merge-modal', async () => {
                    await mergeBtn.click();
                    await page.waitForTimeout(500);
                });
                // Close modal
                const cancelBtn = page.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                }
            } else {
                await skip('6.8 Batches - Open Merge Batches Modal', 'Merge button not available for this batch');
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 7: HOLDS MODULE
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 7: HOLDS MODULE');
        console.log('─'.repeat(50));

        await test('7.1 Holds - View Active Holds List', async () => {
            await page.goto(`${BASE_URL}/holds`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'holds-list-view');
        }, page);

        await test('7.2 Holds - Open Apply Hold Modal', async () => {
            const applyBtn = page.locator('button:has-text("Apply Hold")').first();
            if (await applyBtn.isVisible()) {
                await beforeAfter(page, 'holds-apply-modal', async () => {
                    await applyBtn.click();
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('7.3 Holds - Select Entity Type', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const entityTypeSelect = modal.locator('select').first();
                if (await entityTypeSelect.isVisible()) {
                    await beforeAfter(page, 'holds-select-entity-type', async () => {
                        await entityTypeSelect.selectOption({ index: 1 });
                        await page.waitForTimeout(500);
                    });
                }
            }
        }, page);

        await test('7.4 Holds - Select Specific Entity', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const entitySelect = modal.locator('select').nth(1);
                if (await entitySelect.isVisible()) {
                    await beforeAfter(page, 'holds-select-entity', async () => {
                        await entitySelect.selectOption({ index: 1 });
                        await page.waitForTimeout(300);
                    });
                }
            }
        }, page);

        await test('7.5 Holds - Select Hold Reason', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const reasonSelect = modal.locator('select').nth(2);
                if (await reasonSelect.isVisible()) {
                    await beforeAfter(page, 'holds-select-reason', async () => {
                        await reasonSelect.selectOption({ index: 1 });
                    });
                }
            }
        }, page);

        await test('7.6 Holds - Fill Comments', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const commentsField = modal.locator('textarea').first();
                if (await commentsField.isVisible()) {
                    await beforeAfter(page, 'holds-fill-comments', async () => {
                        await commentsField.fill('Pending quality investigation - sample sent to lab');
                    });
                }
            }
        }, page);

        await test('7.7 Holds - View Completed Apply Hold Form', async () => {
            await screenshot(page, 'holds-apply-form-complete');
        }, page);

        await test('7.8 Holds - Cancel Apply Hold Modal', async () => {
            const cancelBtn = page.locator('button:has-text("Cancel")').first();
            if (await cancelBtn.isVisible()) {
                await cancelBtn.click();
                await page.waitForTimeout(500);
                await screenshot(page, 'holds-apply-cancelled');
            }
        }, page);

        await test('7.9 Holds - Open Release Hold Modal', async () => {
            const releaseBtn = page.locator('button:has-text("Release")').first();
            if (await releaseBtn.isVisible()) {
                await beforeAfter(page, 'holds-release-modal', async () => {
                    await releaseBtn.click();
                    await page.waitForTimeout(500);
                });
            } else {
                await skip('7.9 Holds - Open Release Hold Modal', 'No active holds to release');
            }
        }, page);

        await test('7.10 Holds - Fill Release Comments', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const commentsField = modal.locator('textarea').first();
                if (await commentsField.isVisible()) {
                    await beforeAfter(page, 'holds-release-comments', async () => {
                        await commentsField.fill('Investigation complete - cleared for production');
                    });
                }
                // Close modal
                const cancelBtn = modal.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                }
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 8: EQUIPMENT MODULE
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 8: EQUIPMENT MODULE');
        console.log('─'.repeat(50));

        await test('8.1 Equipment - View List', async () => {
            await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'equipment-list-view');
        }, page);

        await test('8.2 Equipment - Filter by Status', async () => {
            const statusFilter = page.locator('select').first();
            if (await statusFilter.isVisible()) {
                await beforeAfter(page, 'equipment-filter-status', async () => {
                    await statusFilter.selectOption({ index: 1 });
                    await page.waitForTimeout(500);
                });
            }
        }, page);

        await test('8.3 Equipment - Open Maintenance Modal', async () => {
            await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const maintBtn = page.locator('button:has-text("Maintenance")').first();
            if (await maintBtn.isVisible()) {
                await beforeAfter(page, 'equipment-maintenance-modal', async () => {
                    await maintBtn.click();
                    await page.waitForTimeout(500);
                });
            } else {
                await skip('8.3 Equipment - Open Maintenance Modal', 'Maintenance button not available');
            }
        }, page);

        await test('8.4 Equipment - Fill Maintenance Reason', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const reasonField = modal.locator('textarea').first();
                if (await reasonField.isVisible()) {
                    await beforeAfter(page, 'equipment-maintenance-reason', async () => {
                        await reasonField.fill('Scheduled preventive maintenance - bearing replacement');
                    });
                }
                // Close modal
                const cancelBtn = modal.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                }
            }
        }, page);

        await test('8.5 Equipment - Open Hold Modal', async () => {
            const holdBtn = page.locator('button:has-text("Hold")').first();
            if (await holdBtn.isVisible()) {
                await beforeAfter(page, 'equipment-hold-modal', async () => {
                    await holdBtn.click();
                    await page.waitForTimeout(500);
                });
                // Close modal
                const cancelBtn = page.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                }
            } else {
                await skip('8.5 Equipment - Open Hold Modal', 'Hold button not available');
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 9: QUALITY INSPECTION
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 9: QUALITY INSPECTION');
        console.log('─'.repeat(50));

        await test('9.1 Quality - View Quality Pending List', async () => {
            await page.goto(`${BASE_URL}/processes/quality-pending`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await screenshot(page, 'quality-pending-view');
        }, page);

        await test('9.2 Quality - Open Accept Modal', async () => {
            const acceptBtn = page.locator('button:has-text("Accept")').first();
            if (await acceptBtn.isVisible()) {
                await beforeAfter(page, 'quality-accept-modal', async () => {
                    await acceptBtn.click();
                    await page.waitForTimeout(500);
                });
                // Close modal
                const cancelBtn = page.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                }
            } else {
                await skip('9.2 Quality - Open Accept Modal', 'No pending quality inspections');
            }
        }, page);

        await test('9.3 Quality - Open Reject Modal', async () => {
            const rejectBtn = page.locator('button:has-text("Reject")').first();
            if (await rejectBtn.isVisible()) {
                await beforeAfter(page, 'quality-reject-modal', async () => {
                    await rejectBtn.click();
                    await page.waitForTimeout(500);
                });
            } else {
                await skip('9.3 Quality - Open Reject Modal', 'No pending quality inspections');
            }
        }, page);

        await test('9.4 Quality - Fill Rejection Reason', async () => {
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                const reasonField = modal.locator('textarea').first();
                if (await reasonField.isVisible()) {
                    await beforeAfter(page, 'quality-reject-reason', async () => {
                        await reasonField.fill('Product does not meet quality specifications - surface defects detected');
                    });
                }
                // Close modal
                const cancelBtn = modal.locator('button:has-text("Cancel")').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                }
            }
        }, page);

        // ═══════════════════════════════════════════════════════════════
        // SECTION 10: NAVIGATION & HEADER
        // ═══════════════════════════════════════════════════════════════
        console.log('\n' + '─'.repeat(50));
        console.log('📂 SECTION 10: NAVIGATION & HEADER');
        console.log('─'.repeat(50));

        await test('10.1 Navigation - Complete Menu Flow', async () => {
            const routes = [
                { path: 'dashboard', name: 'dashboard' },
                { path: 'orders', name: 'orders' },
                { path: 'inventory', name: 'inventory' },
                { path: 'batches', name: 'batches' },
                { path: 'production/confirm', name: 'production' },
                { path: 'holds', name: 'holds' },
                { path: 'equipment', name: 'equipment' }
            ];

            for (const route of routes) {
                await page.goto(`${BASE_URL}/${route.path}`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(500);
                await screenshot(page, `nav-${route.name}`);
            }
        }, page);

        await test('10.2 Header - User Info Display', async () => {
            await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Focus on header area
            const header = page.locator('header, .header, nav').first();
            if (await header.isVisible()) {
                await screenshot(page, 'header-user-info');
            }
        }, page);

    } catch (error) {
        console.error('\n💥 FATAL ERROR:', error.message);
        await screenshot(page, 'fatal-error', true);
    } finally {
        await browser.close();
    }

    // Print summary
    console.log('\n' + '═'.repeat(70));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`📊 Total Tests: ${results.passed + results.failed + results.skipped}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`📸 Screenshots: ${screenshotCounter}`);
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);

    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.tests.filter(t => t.status.includes('FAILED')).forEach(t => {
            console.log(`   - ${t.name}: ${t.error}`);
        });
    }

    console.log('═'.repeat(70));

    return results.failed === 0;
}

runComprehensiveTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('Runner failed:', err);
        process.exit(1);
    });
