/**
 * MES Production Confirmation - Final Demo with Title
 *
 * Records demo video with opening title screen and text captions.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const BASE_URL = 'http://localhost:4200';
const CREDENTIALS = { email: 'admin@mes.com', password: 'admin123' };

// Show title screen
async function showTitleScreen(page) {
    await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    width: 1920px;
                    height: 1080px;
                    background: linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: white;
                }
                .logo {
                    font-size: 80px;
                    margin-bottom: 40px;
                }
                h1 {
                    font-size: 80px;
                    font-weight: 700;
                    margin-bottom: 25px;
                    text-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                h2 {
                    font-size: 40px;
                    font-weight: 400;
                    opacity: 0.9;
                }
                .footer {
                    position: absolute;
                    bottom: 50px;
                    font-size: 24px;
                    opacity: 0.7;
                }
            </style>
        </head>
        <body>
            <div class="logo">🏭</div>
            <h1>MES Production Confirmation</h1>
            <h2>Manufacturing Execution System - Proof of Concept</h2>
            <div class="footer">Bluemingo POC Demo</div>
        </body>
        </html>
    `);
}

// Show caption overlay
async function showCaption(page, id, title, subtitle) {
    await page.evaluate(({ id, title, subtitle }) => {
        let overlay = document.getElementById('demo-caption');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'demo-caption';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
            <div style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 60%, transparent 100%);
                padding: 30px 50px 25px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            ">
                <div style="max-width: 1400px; margin: 0 auto;">
                    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 8px;">
                        <span style="
                            background: linear-gradient(135deg, #2196F3, #1976D2);
                            color: white;
                            padding: 8px 18px;
                            border-radius: 8px;
                            font-size: 18px;
                            font-weight: 700;
                            box-shadow: 0 2px 8px rgba(33,150,243,0.4);
                        ">${id}</span>
                        <span style="
                            font-size: 32px;
                            font-weight: 600;
                            color: white;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                        ">${title}</span>
                    </div>
                    <p style="
                        margin: 0;
                        padding-left: 75px;
                        font-size: 20px;
                        color: rgba(255,255,255,0.85);
                    ">${subtitle}</p>
                </div>
            </div>
        `;
    }, { id, title, subtitle });
}

// Demo scenes
const SCENES = [
    // TITLE
    { id: 'TITLE', title: null, subtitle: null, duration: 4000, action: async (page) => await showTitleScreen(page) },

    // LOGIN
    { id: '01', title: 'Login Page', subtitle: 'Secure authentication with email and password', duration: 3000,
      action: async (page) => { await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' }); }
    },
    { id: '02', title: 'Enter Credentials', subtitle: 'Email: admin@mes.com | Password masked for security', duration: 3000,
      action: async (page) => {
          await page.fill('input[formControlName="email"]', CREDENTIALS.email);
          await page.fill('input[formControlName="password"]', CREDENTIALS.password);
      }
    },
    { id: '03', title: 'JWT Authentication', subtitle: 'Secure token-based authentication system', duration: 3000,
      action: async (page) => {
          const [response] = await Promise.all([
              page.waitForResponse(r => r.url().includes('/api/auth/login')),
              page.click('button[type="submit"]')
          ]);
          // Store JWT token from response
          try {
              const data = await response.json();
              await page.evaluate((loginData) => {
                  localStorage.setItem('mes_token', loginData.accessToken);
                  localStorage.setItem('mes_user', JSON.stringify(loginData.user));
              }, data);
          } catch (e) { console.log('Token storage error:', e.message); }
          await page.waitForTimeout(1000);
          await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
      }
    },

    // DASHBOARD
    { id: '04', title: 'Dashboard Overview', subtitle: 'Key metrics: Orders, Operations Ready, Active Holds, Confirmations', duration: 3500,
      action: async (page) => { await page.evaluate(() => window.scrollTo(0, 0)); }
    },
    { id: '05', title: 'Inventory Summary', subtitle: 'Track Available, Blocked, On-Hold, and Consumed materials', duration: 3000,
      action: async (page) => { await page.evaluate(() => window.scrollBy(0, 350)); }
    },

    // ORDERS
    { id: '06', title: 'Orders Management', subtitle: 'Production orders with server-side pagination and filtering', duration: 3000,
      action: async (page) => { await page.goto(`${BASE_URL}/#/orders`, { waitUntil: 'networkidle' }); }
    },
    { id: '07', title: 'Filter by Status', subtitle: 'CREATED → IN_PROGRESS → COMPLETED workflow', duration: 3000,
      action: async (page) => {
          const filter = page.locator('select').first();
          if (await filter.count() > 0) await filter.selectOption({ index: 1 }).catch(() => {});
      }
    },
    { id: '08', title: 'Order Details', subtitle: 'Customer info, line items, and operations timeline', duration: 3500,
      action: async (page) => {
          const btn = page.locator('button:has-text("View")').first();
          if (await btn.count() > 0) { await btn.click().catch(() => {}); await page.waitForLoadState('networkidle'); }
      }
    },

    // PRODUCTION
    { id: '09', title: 'Production Confirmation', subtitle: 'Core workflow for recording completed production work', duration: 3000,
      action: async (page) => { await page.goto(`${BASE_URL}/#/production/confirm`, { waitUntil: 'networkidle' }); }
    },
    { id: '10', title: 'Select Order & Operation', subtitle: 'Choose order and operation to confirm', duration: 3000,
      action: async (page) => {
          const orderSel = page.locator('select').first();
          if (await orderSel.count() > 0 && await orderSel.locator('option').count() > 1) {
              await orderSel.selectOption({ index: 1 }).catch(() => {});
              await page.waitForTimeout(800);
          }
      }
    },
    { id: '11', title: 'Production Details', subtitle: 'Times, quantities, equipment, and operator selection', duration: 3500,
      action: async (page) => {
          const opSel = page.locator('select').nth(1);
          if (await opSel.count() > 0 && await opSel.locator('option').count() > 1) {
              await opSel.selectOption({ index: 1 }).catch(() => {});
          }
      }
    },

    // INVENTORY
    { id: '12', title: 'Inventory Management', subtitle: 'Track materials with batch numbers and status badges', duration: 3000,
      action: async (page) => { await page.goto(`${BASE_URL}/#/inventory`, { waitUntil: 'networkidle' }); }
    },
    { id: '13', title: 'Inventory States', subtitle: 'AVAILABLE | BLOCKED | ON_HOLD | SCRAPPED', duration: 3000,
      action: async (page) => {
          const filter = page.locator('select').first();
          if (await filter.count() > 0) await filter.selectOption('AVAILABLE').catch(() => {});
      }
    },
    { id: '14', title: 'Block/Unblock Actions', subtitle: 'Manage material availability with reason tracking', duration: 3000,
      action: async (page) => {
          const filter = page.locator('select').first();
          if (await filter.count() > 0) await filter.selectOption('BLOCKED').catch(() => {});
      }
    },

    // BATCHES
    { id: '15', title: 'Batch Traceability', subtitle: 'Auto-generated batch numbers with full genealogy', duration: 3000,
      action: async (page) => { await page.goto(`${BASE_URL}/#/batches`, { waitUntil: 'networkidle' }); }
    },
    { id: '16', title: 'Batch Genealogy', subtitle: 'Parent-child relationships for complete traceability', duration: 3500,
      action: async (page) => {
          const btn = page.locator('button:has-text("Genealogy")').first();
          if (await btn.count() > 0) { await btn.click().catch(() => {}); await page.waitForLoadState('networkidle'); }
      }
    },

    // HOLDS
    { id: '17', title: 'Hold Management', subtitle: 'Apply holds on Operations, Inventory, Batches, Equipment', duration: 3000,
      action: async (page) => { await page.goto(`${BASE_URL}/#/holds`, { waitUntil: 'networkidle' }); }
    },
    { id: '18', title: 'Apply & Release Holds', subtitle: 'Block items pending investigation with audit trail', duration: 3500,
      action: async (page) => {
          const btn = page.locator('button:has-text("Apply Hold")');
          if (await btn.count() > 0) { await btn.click().catch(() => {}); await page.waitForTimeout(800); }
          const cancel = page.locator('button:has-text("Cancel")');
          if (await cancel.count() > 0) await cancel.click().catch(() => {});
      }
    },

    // EQUIPMENT
    { id: '19', title: 'Equipment Management', subtitle: 'Track equipment status: Available, In-Use, Maintenance', duration: 3000,
      action: async (page) => { await page.goto(`${BASE_URL}/#/equipment`, { waitUntil: 'networkidle' }); }
    },
    { id: '20', title: 'Maintenance Tracking', subtitle: 'Start/end maintenance with reason and duration logging', duration: 3000,
      action: async (page) => {
          const filter = page.locator('select').first();
          if (await filter.count() > 0) await filter.selectOption({ index: 1 }).catch(() => {});
      }
    },

    // QUALITY
    { id: '21', title: 'Quality Inspection', subtitle: 'Accept or reject production pending QA approval', duration: 3000,
      action: async (page) => { await page.goto(`${BASE_URL}/#/quality`, { waitUntil: 'networkidle' }); }
    },

    // LOGOUT
    { id: '22', title: 'Session Complete', subtitle: 'Secure logout clears JWT token', duration: 3000,
      action: async (page) => {
          await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
          const logout = page.locator('button:has-text("Logout")');
          if (await logout.count() > 0) await logout.click().catch(() => {});
      }
    },

    // END TITLE
    { id: 'END', title: null, subtitle: null, duration: 4000, action: async (page) => {
        await page.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        width: 1920px;
                        height: 1080px;
                        background: linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%);
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        color: white;
                    }
                    .check { font-size: 120px; margin-bottom: 40px; }
                    h1 { font-size: 80px; font-weight: 700; margin-bottom: 25px; }
                    h2 { font-size: 40px; font-weight: 400; opacity: 0.9; }
                </style>
            </head>
            <body>
                <div class="check">✅</div>
                <h1>Demo Complete</h1>
                <h2>MES Production Confirmation POC</h2>
            </body>
            </html>
        `);
    }}
];

async function checkServers() {
    const check = (url) => new Promise((resolve) => {
        http.get(url, (res) => resolve(res.statusCode < 600)).on('error', () => resolve(false));
    });
    const frontend = await check('http://localhost:4200');
    const backend = await check('http://localhost:8080/api/dashboard/stats');
    if (!frontend || !backend) {
        console.error('Servers not running!');
        process.exit(1);
    }
}

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, 'output', 'final-demo', timestamp);
    const screenshotDir = path.join(outputDir, 'screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });

    console.log('='.repeat(70));
    console.log('MES PRODUCTION CONFIRMATION - FINAL DEMO');
    console.log('='.repeat(70));
    console.log(`Output: ${outputDir}`);
    console.log('='.repeat(70));

    await checkServers();

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } }
    });
    const page = await context.newPage();

    for (const scene of SCENES) {
        if (scene.id === 'TITLE' || scene.id === 'END') {
            console.log(`🎬 ${scene.id === 'TITLE' ? 'Opening Title' : 'Closing Title'}`);
        } else {
            console.log(`🎬 Scene ${scene.id}: ${scene.title}`);
        }

        await scene.action(page);

        if (scene.title) {
            await showCaption(page, scene.id, scene.title, scene.subtitle);
        }

        await page.screenshot({
            path: path.join(screenshotDir, `${scene.id}-${(scene.title || scene.id).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`),
            fullPage: false
        });

        await page.waitForTimeout(scene.duration);
    }

    await page.close();
    await context.close();
    await browser.close();

    const files = fs.readdirSync(outputDir);
    const videoFile = files.find(f => f.endsWith('.webm'));

    console.log('\n' + '='.repeat(70));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(70));
    console.log(`Video: ${path.join(outputDir, videoFile)}`);
    console.log(`Screenshots: ${screenshotDir}`);
    console.log('='.repeat(70));
}

main().catch(console.error);
