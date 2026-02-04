/**
 * MES Production Confirmation - Demo Video Recorder
 *
 * Creates a comprehensive demo video with text overlays explaining
 * each feature and action in the application.
 *
 * Usage:
 *   node e2e/record-demo-video.js
 *
 * Output:
 *   - Video: e2e/output/videos/demo-{timestamp}/
 *   - Screenshots: e2e/output/screenshots/demo-{timestamp}/
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const API_URL = 'http://localhost:8080';

const CREDENTIALS = {
    email: 'admin@mes.com',
    password: 'admin123'
};

// Demo script with steps and explanations
const DEMO_SCRIPT = [
    // CHAPTER 1: LOGIN
    {
        chapter: 'Authentication',
        steps: [
            {
                title: 'Login Page',
                description: 'The MES Production Confirmation system requires authentication. Users enter their credentials to access the system.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
                },
                wait: 2000
            },
            {
                title: 'Enter Email',
                description: 'Enter your registered email address. This identifies you in the system and determines your access permissions.',
                action: async (page) => {
                    await page.fill('input[formControlName="email"]', CREDENTIALS.email);
                },
                wait: 1500
            },
            {
                title: 'Enter Password',
                description: 'Enter your secure password. The system uses JWT tokens for secure authentication.',
                action: async (page) => {
                    await page.fill('input[formControlName="password"]', CREDENTIALS.password);
                },
                wait: 1500
            },
            {
                title: 'Sign In',
                description: 'Click Sign In to authenticate. Upon success, you will be redirected to the Dashboard.',
                action: async (page) => {
                    const [response] = await Promise.all([
                        page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
                        page.click('button[type="submit"]')
                    ]);
                    const data = await response.json();
                    await page.evaluate((loginData) => {
                        localStorage.setItem('mes_token', loginData.accessToken);
                        localStorage.setItem('mes_user', JSON.stringify(loginData.user));
                    }, data);
                    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
                },
                wait: 2000
            }
        ]
    },

    // CHAPTER 2: DASHBOARD
    {
        chapter: 'Dashboard Overview',
        steps: [
            {
                title: 'Dashboard - Key Metrics',
                description: 'The Dashboard shows key production metrics at a glance: Total Orders, Operations Ready for production, Active Holds, Today\'s Confirmations, and Quality Pending items.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
                },
                wait: 3000
            },
            {
                title: 'Dashboard - Inventory Summary',
                description: 'The Inventory section shows total inventory count, available items, consumed materials, and items on hold.',
                action: async (page) => {
                    // Just highlight the section
                },
                wait: 2000
            },
            {
                title: 'Dashboard - Orders Ready',
                description: 'Orders Ready for Production lists orders that have operations in READY status, waiting to be processed.',
                action: async (page) => {
                    // Highlight orders section
                },
                wait: 2000
            },
            {
                title: 'Dashboard - Recent Confirmations',
                description: 'Recent Confirmations shows the latest production activities with operation name, product, and quantity produced.',
                action: async (page) => {
                    // Highlight confirmations section
                },
                wait: 2000
            },
            {
                title: 'Dashboard - Audit Trail',
                description: 'The Audit Trail tracks all system activities with field-level change tracking. Every modification logs old value, new value, timestamp, and user for complete traceability.',
                action: async (page) => {
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                },
                wait: 2000
            }
        ]
    },

    // CHAPTER 3: ORDERS
    {
        chapter: 'Orders Management',
        steps: [
            {
                title: 'Orders List',
                description: 'The Orders module displays all customer orders with server-side pagination. Filter by status, search by order number, and navigate through pages.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
                },
                wait: 2500
            },
            {
                title: 'Filter Orders',
                description: 'Use the status filter to show only orders of a specific status. This helps focus on orders that need attention.',
                action: async (page) => {
                    const filter = page.locator('select[name="status"], select#status');
                    if (await filter.count() > 0) {
                        await filter.selectOption('IN_PROGRESS').catch(() => {});
                    }
                },
                wait: 2000
            },
            {
                title: 'Pagination Controls',
                description: 'Server-side pagination handles large datasets efficiently. Use page controls to navigate and change items per page (10, 20, 50, 100).',
                action: async (page) => {
                    // Show pagination controls at bottom of page
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                },
                wait: 2000
            },
            {
                title: 'Order Detail',
                description: 'Click on an order to view its details, including line items (products ordered) and the production operations timeline.',
                action: async (page) => {
                    const rows = page.locator('table tbody tr');
                    if (await rows.count() > 0) {
                        await rows.first().click();
                        await page.waitForLoadState('networkidle');
                    }
                },
                wait: 2500
            },
            {
                title: 'Operations Timeline',
                description: 'The operations timeline shows each production stage (Melting, Casting, Rolling, etc.) with its current status. Green = Completed, Blue = Ready, Yellow = In Progress.',
                action: async (page) => {
                    // View operations section
                },
                wait: 2000
            }
        ]
    },

    // CHAPTER 4: PRODUCTION CONFIRMATION
    {
        chapter: 'Production Confirmation',
        steps: [
            {
                title: 'Production Form',
                description: 'The Production Confirmation form is used to record completed production work. This is the core workflow of the MES system.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/production/confirm`, { waitUntil: 'networkidle' });
                },
                wait: 2000
            },
            {
                title: 'Select Order',
                description: 'First, select an Order from the dropdown. Only orders with READY operations are available.',
                action: async (page) => {
                    const orderDropdown = page.locator('select#order, select[formControlName="order"]');
                    if (await orderDropdown.count() > 0) {
                        await orderDropdown.selectOption({ index: 1 }).catch(() => {});
                    }
                },
                wait: 2000
            },
            {
                title: 'Select Operation',
                description: 'Select the specific Operation to confirm. The system automatically suggests material consumption based on the Bill of Materials (BOM) configuration.',
                action: async (page) => {
                    const opDropdown = page.locator('select#operation, select[formControlName="operation"]');
                    if (await opDropdown.count() > 0) {
                        await opDropdown.selectOption({ index: 1 }).catch(() => {});
                    }
                },
                wait: 2000
            },
            {
                title: 'Enter Times',
                description: 'Enter the Start Time and End Time of the production run. This tracks actual production duration.',
                action: async (page) => {
                    const startTime = page.locator('input[type="datetime-local"][formControlName="startTime"]');
                    const endTime = page.locator('input[type="datetime-local"][formControlName="endTime"]');
                    if (await startTime.count() > 0) await startTime.fill('2024-02-04T08:00');
                    if (await endTime.count() > 0) await endTime.fill('2024-02-04T12:00');
                },
                wait: 1500
            },
            {
                title: 'BOM Suggested Consumption',
                description: 'The system suggests material consumption based on Bill of Materials (BOM). Stock availability is shown (Sufficient/Insufficient). Click "Apply Suggestions" to auto-fill material selections.',
                action: async (page) => {
                    // Highlight BOM suggestions section if visible
                },
                wait: 2000
            },
            {
                title: 'Enter Quantities',
                description: 'Enter Produced Quantity (good output) and Scrap Quantity (rejected output). Process parameters are validated against configurable min/max values with warnings for out-of-range values.',
                action: async (page) => {
                    const producedQty = page.locator('input[formControlName="producedQty"]');
                    const scrapQty = page.locator('input[formControlName="scrapQty"]');
                    if (await producedQty.count() > 0) await producedQty.fill('100');
                    if (await scrapQty.count() > 0) await scrapQty.fill('5');
                },
                wait: 1500
            },
            {
                title: 'Process Parameter Validation',
                description: 'Process parameters (temperature, pressure) are validated in real-time. Errors show if values exceed min/max limits. Warnings appear when values are within 10% of limits.',
                action: async (page) => {
                    // Show validation messages if any
                },
                wait: 1500
            },
            {
                title: 'Select Equipment & Operators',
                description: 'Select the Equipment used and Operators involved. This enables traceability and resource tracking.',
                action: async (page) => {
                    const eqCheckboxes = page.locator('input[type="checkbox"][name*="equipment"]');
                    const opCheckboxes = page.locator('input[type="checkbox"][name*="operator"]');
                    if (await eqCheckboxes.count() > 0) await eqCheckboxes.first().check().catch(() => {});
                    if (await opCheckboxes.count() > 0) await opCheckboxes.first().check().catch(() => {});
                },
                wait: 1500
            },
            {
                title: 'Form Complete',
                description: 'The completed form shows all production details. Clicking Confirm will: update operation status, create output batch, record the confirmation, and update inventory.',
                action: async (page) => {
                    // Show complete form
                },
                wait: 2500
            }
        ]
    },

    // CHAPTER 5: INVENTORY
    {
        chapter: 'Inventory Management',
        steps: [
            {
                title: 'Inventory List',
                description: 'The Inventory module tracks all materials with server-side pagination. Filter by state (AVAILABLE, BLOCKED, etc.) and type (RM, IM, FG). Search across material IDs and batch numbers.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
                },
                wait: 2500
            },
            {
                title: 'Filter by State',
                description: 'Filter inventory by state to find specific materials. AVAILABLE items can be used in production.',
                action: async (page) => {
                    const filter = page.locator('select[name="state"], select#state');
                    if (await filter.count() > 0) {
                        await filter.selectOption('AVAILABLE').catch(() => {});
                    }
                },
                wait: 2000
            },
            {
                title: 'Block Inventory',
                description: 'The Block action temporarily prevents material from being used. This is used for quality holds or investigations.',
                action: async (page) => {
                    const blockBtn = page.locator('button:has-text("Block")');
                    if (await blockBtn.count() > 0) {
                        await blockBtn.first().click();
                        await page.waitForTimeout(500);
                    }
                },
                wait: 2000
            },
            {
                title: 'Block Reason',
                description: 'When blocking inventory, you must provide a reason. This creates an audit trail for traceability.',
                action: async (page) => {
                    const reasonInput = page.locator('textarea, input[name="reason"]');
                    if (await reasonInput.count() > 0) {
                        await reasonInput.first().fill('Quality inspection required');
                    }
                    // Cancel to not actually block
                    const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                    if (await cancelBtn.count() > 0) await cancelBtn.click();
                },
                wait: 2000
            },
            {
                title: 'View Blocked Items',
                description: 'Blocked items are shown with their block reason. These cannot be used until unblocked.',
                action: async (page) => {
                    const filter = page.locator('select[name="state"], select#state');
                    if (await filter.count() > 0) {
                        await filter.selectOption('BLOCKED').catch(() => {});
                    }
                },
                wait: 2000
            },
            {
                title: 'Unblock Inventory',
                description: 'Click Unblock to release blocked inventory. The item returns to AVAILABLE state and can be used in production again.',
                action: async (page) => {
                    const unblockBtn = page.locator('button:has-text("Unblock")');
                    if (await unblockBtn.count() > 0) {
                        // Don't actually click
                    }
                },
                wait: 1500
            },
            {
                title: 'Scrap Inventory',
                description: 'The Scrap action permanently marks inventory as waste. Enter a reason for traceability. Scrapped items cannot be recovered.',
                action: async (page) => {
                    const filter = page.locator('select[name="state"], select#state');
                    if (await filter.count() > 0) {
                        await filter.selectOption('AVAILABLE').catch(() => {});
                    }
                    const scrapBtn = page.locator('button:has-text("Scrap")');
                    if (await scrapBtn.count() > 0) {
                        await scrapBtn.first().click();
                        await page.waitForTimeout(500);
                        const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                        if (await cancelBtn.count() > 0) await cancelBtn.click();
                    }
                },
                wait: 2000
            },
            {
                title: 'Filter by Type',
                description: 'Filter by inventory type: RM (Raw Material), IM (Intermediate), FG (Finished Goods). This helps locate specific material categories.',
                action: async (page) => {
                    const typeFilter = page.locator('select[name="type"], select#type');
                    if (await typeFilter.count() > 0) {
                        await typeFilter.selectOption('FG').catch(() => {});
                    }
                },
                wait: 1500
            }
        ]
    },

    // CHAPTER 6: BATCHES
    {
        chapter: 'Batch Traceability',
        steps: [
            {
                title: 'Batches List',
                description: 'Batches are trackable units of material. Each batch has a unique number generated based on configurable patterns (operation type, product, date sequence).',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
                },
                wait: 2500
            },
            {
                title: 'Batch Detail',
                description: 'Click on a batch to view its details including material type, quantity, status, and location.',
                action: async (page) => {
                    const rows = page.locator('table tbody tr');
                    if (await rows.count() > 0) {
                        await rows.first().click();
                        await page.waitForLoadState('networkidle');
                    }
                },
                wait: 2500
            },
            {
                title: 'Batch Genealogy',
                description: 'The Genealogy view shows the complete history of a batch: parent materials (inputs) and child materials (outputs). This is critical for quality investigations and recalls.',
                action: async (page) => {
                    const genealogyTab = page.locator('button:has-text("Genealogy"), .tab:has-text("Genealogy")');
                    if (await genealogyTab.count() > 0) {
                        await genealogyTab.first().click();
                    }
                },
                wait: 2500
            },
            {
                title: 'Batch Operations',
                description: 'Batches support SPLIT (divide into smaller portions) and MERGE (combine multiple batches). Each operation creates new batch numbers following configurable patterns.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/batches`, { waitUntil: 'networkidle' });
                },
                wait: 2000
            },
            {
                title: 'Configurable Batch Numbers',
                description: 'Batch numbers are generated automatically based on: operation type (FURNACE, CASTER, ROLLING), product SKU, date format, and sequence. Sequences can reset daily, monthly, or yearly.',
                action: async (page) => {
                    // Just informational
                },
                wait: 2000
            }
        ]
    },

    // CHAPTER 7: HOLDS
    {
        chapter: 'Hold Management',
        steps: [
            {
                title: 'Active Holds',
                description: 'The Holds module manages temporary blocks on materials, equipment, or operations. Active holds prevent production until released.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/holds`, { waitUntil: 'networkidle' });
                },
                wait: 2500
            },
            {
                title: 'Apply Hold',
                description: 'Click Apply Hold to create a new hold. You can hold: Orders, Operations, Batches, Inventory, or Equipment.',
                action: async (page) => {
                    const applyBtn = page.locator('button:has-text("Apply Hold"), button:has-text("New Hold")');
                    if (await applyBtn.count() > 0) {
                        await applyBtn.first().click();
                        await page.waitForTimeout(500);
                    }
                },
                wait: 2000
            },
            {
                title: 'Hold Details',
                description: 'When applying a hold, select the entity type, specific item, reason, and add comments. All holds are tracked in the audit trail.',
                action: async (page) => {
                    // Cancel
                    const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                    if (await cancelBtn.count() > 0) await cancelBtn.click();
                },
                wait: 2000
            },
            {
                title: 'Release Hold',
                description: 'To release a hold, click Release and add release comments. The item returns to its previous state and can be used in production.',
                action: async (page) => {
                    const releaseBtn = page.locator('button:has-text("Release")');
                    if (await releaseBtn.count() > 0) {
                        // Don't actually click
                    }
                },
                wait: 2000
            }
        ]
    },

    // CHAPTER 8: EQUIPMENT
    {
        chapter: 'Equipment Management',
        steps: [
            {
                title: 'Equipment List',
                description: 'The Equipment module tracks all production equipment. Status can be: AVAILABLE, IN_USE, MAINTENANCE, or ON_HOLD.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/equipment`, { waitUntil: 'networkidle' });
                },
                wait: 2500
            },
            {
                title: 'Equipment Status',
                description: 'Filter by status to view equipment in different states. AVAILABLE equipment can be used in production.',
                action: async (page) => {
                    const filter = page.locator('select[name="status"], select#status');
                    if (await filter.count() > 0) {
                        await filter.selectOption('AVAILABLE').catch(() => {});
                    }
                },
                wait: 2000
            },
            {
                title: 'Start Maintenance',
                description: 'The Maintenance action marks equipment as unavailable for scheduled maintenance. Enter the reason and expected end time.',
                action: async (page) => {
                    const maintBtn = page.locator('button:has-text("Maintenance")');
                    if (await maintBtn.count() > 0) {
                        await maintBtn.first().click();
                        await page.waitForTimeout(500);
                        const cancelBtn = page.locator('.modal button:has-text("Cancel")');
                        if (await cancelBtn.count() > 0) await cancelBtn.click();
                    }
                },
                wait: 2000
            },
            {
                title: 'Equipment Hold',
                description: 'Equipment can be put ON_HOLD for issues requiring investigation. Hold prevents equipment from being used in production confirmations.',
                action: async (page) => {
                    const holdBtn = page.locator('button:has-text("Hold")');
                    if (await holdBtn.count() > 0) {
                        // Show the button
                    }
                },
                wait: 1500
            },
            {
                title: 'Equipment Pagination',
                description: 'Equipment list supports server-side pagination with filters by status and equipment type. Navigate through pages using pagination controls.',
                action: async (page) => {
                    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                },
                wait: 1500
            }
        ]
    },

    // CHAPTER 9: QUALITY
    {
        chapter: 'Quality Inspection',
        steps: [
            {
                title: 'Quality Queue',
                description: 'The Quality module shows processes pending quality inspection. Quality decisions determine if production can proceed.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/quality`, { waitUntil: 'networkidle' });
                },
                wait: 2500
            },
            {
                title: 'Pending Tab',
                description: 'The Pending tab shows items awaiting quality decision. Status badges indicate PENDING (yellow), APPROVED (green), or REJECTED (red).',
                action: async (page) => {
                    const pendingTab = page.locator('button:has-text("Pending"), .tab:has-text("Pending")');
                    if (await pendingTab.count() > 0) {
                        await pendingTab.first().click();
                    }
                },
                wait: 2000
            },
            {
                title: 'Accept Item',
                description: 'Click Accept to approve an item for the next production stage. The item\'s quality status changes to APPROVED.',
                action: async (page) => {
                    const acceptBtn = page.locator('button:has-text("Accept")');
                    if (await acceptBtn.count() > 0) {
                        // Don't actually click
                    }
                },
                wait: 1500
            },
            {
                title: 'Reject Item',
                description: 'Click Reject and provide a reason. Rejected items require investigation and may trigger holds on related batches.',
                action: async (page) => {
                    const rejectBtn = page.locator('button:has-text("Reject")');
                    if (await rejectBtn.count() > 0) {
                        // Don't actually click
                    }
                },
                wait: 1500
            },
            {
                title: 'Quality History',
                description: 'The All tab shows complete quality history with outcomes and timestamps. This provides audit trail for quality decisions.',
                action: async (page) => {
                    const allTab = page.locator('button:has-text("All"), .tab:has-text("All")');
                    if (await allTab.count() > 0) {
                        await allTab.first().click();
                    }
                },
                wait: 2000
            }
        ]
    },

    // CHAPTER 10: SYSTEM FEATURES SUMMARY
    {
        chapter: 'System Features Summary',
        steps: [
            {
                title: 'Audit Trail',
                description: 'All changes are tracked with field-level auditing. Old value, new value, timestamp, and user are recorded for every modification. Critical for compliance and traceability.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
                },
                wait: 2000
            },
            {
                title: 'Server-Side Pagination',
                description: 'All list pages use server-side pagination for optimal performance. Supports page size selection (10, 20, 50, 100), sorting, and filtering.',
                action: async (page) => {
                    // Summary slide
                },
                wait: 2000
            },
            {
                title: 'Real-Time Validation',
                description: 'Forms validate input in real-time. Required fields show errors immediately. Process parameters warn when values approach limits.',
                action: async (page) => {
                    // Summary slide
                },
                wait: 2000
            },
            {
                title: 'Test Coverage',
                description: 'Comprehensive test suite: 499 backend tests, 257 frontend tests, 65 E2E tests. All tests passing at 100%.',
                action: async (page) => {
                    // Summary slide
                },
                wait: 2000
            }
        ]
    },

    // CHAPTER 11: LOGOUT
    {
        chapter: 'Logout',
        steps: [
            {
                title: 'Logout',
                description: 'Click Logout to end your session. Your JWT token is invalidated and you are returned to the login page.',
                action: async (page) => {
                    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
                    const logoutBtn = page.locator('button:has-text("Logout"), .logout-btn');
                    if (await logoutBtn.count() > 0) {
                        await logoutBtn.first().click();
                    }
                },
                wait: 2000
            }
        ]
    }
];

async function recordDemoVideo() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const screenshotDir = path.join(__dirname, 'output', 'screenshots', `demo-${timestamp}`);
    const videoDir = path.join(__dirname, 'output', 'videos', `demo-${timestamp}`);

    fs.mkdirSync(screenshotDir, { recursive: true });
    fs.mkdirSync(videoDir, { recursive: true });

    console.log('═'.repeat(70));
    console.log('MES PRODUCTION CONFIRMATION - DEMO VIDEO RECORDER');
    console.log('═'.repeat(70));
    console.log(`Screenshots: ${screenshotDir}`);
    console.log(`Videos: ${videoDir}`);
    console.log('═'.repeat(70));

    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-web-security']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: {
            dir: videoDir,
            size: { width: 1920, height: 1080 }
        }
    });

    const page = await context.newPage();
    let stepNum = 0;

    // Create a text overlay function
    async function showOverlay(title, description) {
        await page.evaluate(({ title, description }) => {
            // Remove existing overlay
            const existing = document.getElementById('demo-overlay');
            if (existing) existing.remove();

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'demo-overlay';
            overlay.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 12px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                ">
                    <h3 style="margin: 0 0 10px 0; font-size: 24px; color: #4CAF50;">${title}</h3>
                    <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #e0e0e0;">${description}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }, { title, description });
    }

    async function removeOverlay() {
        await page.evaluate(() => {
            const overlay = document.getElementById('demo-overlay');
            if (overlay) overlay.remove();
        });
    }

    async function captureStep(name) {
        stepNum++;
        const paddedNum = String(stepNum).padStart(3, '0');
        const filename = `${paddedNum}-${name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
        await page.screenshot({
            path: path.join(screenshotDir, filename),
            fullPage: false
        });
        console.log(`   📸 ${filename}`);
    }

    try {
        for (const chapter of DEMO_SCRIPT) {
            console.log(`\n📖 Chapter: ${chapter.chapter}`);
            console.log('─'.repeat(50));

            for (const step of chapter.steps) {
                console.log(`\n   🎬 ${step.title}`);

                // Execute the action
                await step.action(page);

                // Show text overlay
                await showOverlay(step.title, step.description);

                // Wait for the specified time
                await page.waitForTimeout(step.wait);

                // Capture screenshot
                await captureStep(step.title);

                // Remove overlay for clean transition
                await removeOverlay();
                await page.waitForTimeout(500);
            }
        }

        console.log('\n✅ Demo recording complete!');

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
    console.log('DEMO RECORDING COMPLETE');
    console.log('═'.repeat(70));
    console.log(`📸 Screenshots (${stepNum} total): ${screenshotDir}`);
    console.log(`🎬 Video: ${videoDir}`);
    console.log('═'.repeat(70));
}

// Run
recordDemoVideo().catch(console.error);
