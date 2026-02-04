/**
 * MES Production Confirmation - Demo Video Recorder with Captions
 *
 * Records a demo video with text overlays/captions showing actions.
 * No voiceover - just visual captions at the bottom of each scene.
 *
 * Prerequisites:
 *   - Backend running: gradlew bootRun --args="--spring.profiles.active=demo"
 *   - Frontend running: npm start
 *
 * Usage:
 *   node e2e/record-demo-with-captions.js
 *
 * Output:
 *   - Video: e2e/output/demo-captions/{timestamp}/demo.webm
 *   - Screenshots: e2e/output/demo-captions/{timestamp}/screenshots/
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const CREDENTIALS = { email: 'admin@mes.com', password: 'admin123' };

// Demo scenes with captions
const DEMO_SCENES = [
    // LOGIN
    {
        id: '01',
        caption: 'MES Production Confirmation System',
        subtext: 'Manufacturing Execution System for tracking production workflows',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },
    {
        id: '02',
        caption: 'User Authentication',
        subtext: 'Login with email and password credentials',
        action: async (page) => {
            await page.fill('input[formControlName="email"]', CREDENTIALS.email);
            await page.waitForTimeout(500);
            await page.fill('input[formControlName="password"]', CREDENTIALS.password);
        },
        duration: 3000
    },
    {
        id: '03',
        caption: 'Secure Login',
        subtext: 'JWT token authentication for secure access',
        action: async (page) => {
            const [response] = await Promise.all([
                page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
                page.click('button[type="submit"]')
            ]);
            // Store token from response
            try {
                const data = await response.json();
                await page.evaluate((loginData) => {
                    localStorage.setItem('mes_token', loginData.accessToken);
                    localStorage.setItem('mes_user', JSON.stringify(loginData.user));
                }, data);
            } catch (e) {}
            await page.waitForTimeout(2000);
            await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },

    // DASHBOARD
    {
        id: '04',
        caption: 'Dashboard Overview',
        subtext: 'Key metrics: Orders, Operations Ready, Active Holds, Confirmations',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        },
        duration: 4000
    },
    {
        id: '05',
        caption: 'Inventory Summary',
        subtext: 'Available, Blocked, On-Hold, and Scrapped materials',
        action: async (page) => {
            // Scroll to inventory section if needed
            await page.evaluate(() => window.scrollBy(0, 200));
        },
        duration: 3000
    },

    // ORDERS
    {
        id: '06',
        caption: 'Orders Management',
        subtext: 'View and manage production orders with server-side pagination',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/orders`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },
    {
        id: '07',
        caption: 'Filter Orders by Status',
        subtext: 'Filter: CREATED, IN_PROGRESS, COMPLETED',
        action: async (page) => {
            const statusFilter = page.locator('select').first();
            if (await statusFilter.count() > 0) {
                await statusFilter.selectOption({ index: 1 });
                await page.waitForTimeout(1000);
            }
        },
        duration: 3000
    },
    {
        id: '08',
        caption: 'Order Details',
        subtext: 'View line items and operations timeline',
        action: async (page) => {
            const viewBtn = page.locator('button:has-text("View Details")').first();
            if (await viewBtn.count() > 0) {
                await viewBtn.click();
                await page.waitForLoadState('networkidle');
            }
        },
        duration: 4000
    },

    // PRODUCTION
    {
        id: '09',
        caption: 'Production Confirmation',
        subtext: 'Core workflow for recording completed production work',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/production/confirm`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },
    {
        id: '10',
        caption: 'Select Order',
        subtext: 'Choose an order with READY operations',
        action: async (page) => {
            const orderSelect = page.locator('select').first();
            if (await orderSelect.count() > 0) {
                const options = await orderSelect.locator('option').count();
                if (options > 1) {
                    await orderSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(1000);
                }
            }
        },
        duration: 3000
    },
    {
        id: '11',
        caption: 'Select Operation',
        subtext: 'System suggests material consumption from Bill of Materials',
        action: async (page) => {
            const opSelect = page.locator('select').nth(1);
            if (await opSelect.count() > 0) {
                const options = await opSelect.locator('option').count();
                if (options > 1) {
                    await opSelect.selectOption({ index: 1 });
                    await page.waitForTimeout(1500);
                }
            }
        },
        duration: 4000
    },
    {
        id: '12',
        caption: 'Enter Production Details',
        subtext: 'Start time, end time, quantities with validation',
        action: async (page) => {
            const startTime = page.locator('input[type="datetime-local"]').first();
            const endTime = page.locator('input[type="datetime-local"]').nth(1);
            if (await startTime.count() > 0) {
                await startTime.fill('2024-02-04T08:00');
            }
            if (await endTime.count() > 0) {
                await endTime.fill('2024-02-04T12:00');
            }
            const producedQty = page.locator('input[formControlName="producedQty"], input[type="number"]').first();
            if (await producedQty.count() > 0) {
                await producedQty.fill('100');
            }
        },
        duration: 4000
    },

    // INVENTORY
    {
        id: '13',
        caption: 'Inventory Management',
        subtext: 'Track materials: Available, Blocked, On-Hold, Scrapped',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/inventory`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },
    {
        id: '14',
        caption: 'Filter by State',
        subtext: 'View inventory by availability status',
        action: async (page) => {
            const stateFilter = page.locator('select').first();
            if (await stateFilter.count() > 0) {
                await stateFilter.selectOption('AVAILABLE');
                await page.waitForTimeout(1000);
            }
        },
        duration: 3000
    },
    {
        id: '15',
        caption: 'Block Inventory',
        subtext: 'Block materials pending quality investigation',
        action: async (page) => {
            const blockBtn = page.locator('button:has-text("Block")').first();
            if (await blockBtn.count() > 0) {
                await blockBtn.click();
                await page.waitForTimeout(1000);
                // Close modal if opened
                const cancelBtn = page.locator('button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        },
        duration: 3000
    },

    // BATCHES
    {
        id: '16',
        caption: 'Batch Traceability',
        subtext: 'Track batches with unique auto-generated numbers',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/batches`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },
    {
        id: '17',
        caption: 'Batch Genealogy',
        subtext: 'View parent-child relationships for full traceability',
        action: async (page) => {
            const viewBtn = page.locator('button:has-text("View Genealogy")').first();
            if (await viewBtn.count() > 0) {
                await viewBtn.click();
                await page.waitForLoadState('networkidle');
            }
        },
        duration: 4000
    },

    // HOLDS
    {
        id: '18',
        caption: 'Hold Management',
        subtext: 'Apply and release holds on materials, equipment, operations',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/holds`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },
    {
        id: '19',
        caption: 'Apply Hold',
        subtext: 'Block items pending investigation or approval',
        action: async (page) => {
            const applyBtn = page.locator('button:has-text("Apply Hold")');
            if (await applyBtn.count() > 0) {
                await applyBtn.click();
                await page.waitForTimeout(1000);
                const cancelBtn = page.locator('button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        },
        duration: 3000
    },

    // EQUIPMENT
    {
        id: '20',
        caption: 'Equipment Management',
        subtext: 'Track equipment: Available, In-Use, Maintenance, On-Hold',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/equipment`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },
    {
        id: '21',
        caption: 'Equipment Maintenance',
        subtext: 'Start/end maintenance with reason tracking',
        action: async (page) => {
            const maintBtn = page.locator('button:has-text("Maintenance")').first();
            if (await maintBtn.count() > 0) {
                await maintBtn.click();
                await page.waitForTimeout(1000);
                const cancelBtn = page.locator('button:has-text("Cancel")');
                if (await cancelBtn.count() > 0) {
                    await cancelBtn.click();
                }
            }
        },
        duration: 3000
    },

    // QUALITY
    {
        id: '22',
        caption: 'Quality Inspection',
        subtext: 'Accept or reject production pending quality approval',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/quality`, { waitUntil: 'networkidle' });
        },
        duration: 3000
    },

    // CONCLUSION
    {
        id: '23',
        caption: 'Test Coverage Summary',
        subtext: '499 Backend + 257 Frontend + 67 E2E Tests = 100% Passing',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        },
        duration: 4000
    },
    {
        id: '24',
        caption: 'Thank You',
        subtext: 'MES Production Confirmation POC Demo Complete',
        action: async (page) => {
            const logoutBtn = page.locator('button:has-text("Logout")');
            if (await logoutBtn.count() > 0) {
                await logoutBtn.click();
            }
        },
        duration: 3000
    }
];

// Show caption overlay on page
async function showCaption(page, caption, subtext, sceneId) {
    await page.evaluate(({ caption, subtext, sceneId }) => {
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
                background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 70%, transparent 100%);
                padding: 30px 40px 25px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="
                    max-width: 1200px;
                    margin: 0 auto;
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        margin-bottom: 8px;
                    ">
                        <span style="
                            background: #2196F3;
                            color: white;
                            padding: 4px 12px;
                            border-radius: 4px;
                            font-size: 14px;
                            font-weight: 600;
                        ">${sceneId}</span>
                        <h2 style="
                            margin: 0;
                            font-size: 28px;
                            font-weight: 600;
                            color: white;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">${caption}</h2>
                    </div>
                    <p style="
                        margin: 0;
                        font-size: 18px;
                        color: rgba(255,255,255,0.85);
                        padding-left: 60px;
                    ">${subtext}</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }, { caption, subtext, sceneId });
}

async function recordDemo() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, 'output', 'demo-captions', timestamp);
    const screenshotDir = path.join(outputDir, 'screenshots');

    fs.mkdirSync(screenshotDir, { recursive: true });

    console.log('═'.repeat(70));
    console.log('MES PRODUCTION CONFIRMATION - DEMO VIDEO WITH CAPTIONS');
    console.log('═'.repeat(70));
    console.log(`Output: ${outputDir}`);
    console.log('═'.repeat(70));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } }
    });
    const page = await context.newPage();

    let screenshotCount = 0;

    try {
        for (const scene of DEMO_SCENES) {
            console.log(`\n🎬 Scene ${scene.id}: ${scene.caption}`);

            // Execute the action
            await scene.action(page);

            // Show caption overlay
            await showCaption(page, scene.caption, scene.subtext, scene.id);

            // Take screenshot
            screenshotCount++;
            const screenshotPath = path.join(screenshotDir, `${scene.id}-${scene.caption.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: false });
            console.log(`   📸 Screenshot saved`);

            // Wait for duration
            await page.waitForTimeout(scene.duration);
        }

        console.log('\n✅ Recording complete!');

    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
    }

    await page.close();
    await context.close();
    await browser.close();

    // Find recorded video
    const files = fs.readdirSync(outputDir);
    const videoFile = files.find(f => f.endsWith('.webm'));

    console.log('\n' + '═'.repeat(70));
    console.log('DEMO RECORDING COMPLETE');
    console.log('═'.repeat(70));
    console.log(`📁 Output directory: ${outputDir}`);
    if (videoFile) {
        console.log(`🎬 Video: ${path.join(outputDir, videoFile)}`);
    }
    console.log(`📸 Screenshots: ${screenshotCount} files`);
    console.log('═'.repeat(70));
}

// Check servers
async function checkServers() {
    const http = require('http');

    const checkUrl = (url) => new Promise((resolve) => {
        http.get(url, (res) => resolve(res.statusCode < 600))
            .on('error', () => resolve(false));
    });

    const frontend = await checkUrl('http://localhost:4200');
    const backend = await checkUrl('http://localhost:8080/api/dashboard/stats');

    if (!frontend || !backend) {
        console.error('═'.repeat(70));
        console.error('ERROR: Servers not running!');
        console.error('═'.repeat(70));
        if (!backend) console.error('❌ Backend: cd backend && gradlew bootRun --args="--spring.profiles.active=demo"');
        if (!frontend) console.error('❌ Frontend: cd frontend && npm start');
        console.error('═'.repeat(70));
        process.exit(1);
    }
}

checkServers().then(() => recordDemo()).catch(console.error);
