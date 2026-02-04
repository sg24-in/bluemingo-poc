/**
 * MES Production Confirmation - Demo with Synced Voiceover
 *
 * Records demo with CONSISTENT timing per scene (3 seconds each)
 * so voiceover stays perfectly in sync.
 *
 * Prerequisites:
 *   - Backend: gradlew bootRun --args="--spring.profiles.active=demo"
 *   - Frontend: npm start
 *   - Dependencies: npm install google-tts-api ffmpeg-static ffprobe-static fluent-ffmpeg
 *
 * Usage:
 *   node e2e/record-demo-synced.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load audio dependencies
let ffmpegPath, ffprobePath, ffmpeg, googleTTS;
try {
    ffmpegPath = require('ffmpeg-static');
    ffprobePath = require('ffprobe-static').path;
    ffmpeg = require('fluent-ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    googleTTS = require('google-tts-api');
} catch (err) {
    console.error('Missing dependencies. Run:');
    console.error('  npm install google-tts-api ffmpeg-static ffprobe-static fluent-ffmpeg');
    process.exit(1);
}

const BASE_URL = 'http://localhost:4200';
const CREDENTIALS = { email: 'admin@mes.com', password: 'admin123' };

// FIXED duration per scene - keeps video and audio in sync
const SCENE_DURATION = 3000; // 3 seconds per scene

// Demo scenes - each scene is exactly SCENE_DURATION milliseconds
const SCENES = [
    // LOGIN (5 scenes)
    {
        id: '001', name: 'login-page',
        caption: 'Login Page',
        voiceover: 'MES Production Confirmation System. Secure login with email and password.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
        }
    },
    {
        id: '002', name: 'login-email',
        caption: 'Enter Email',
        voiceover: 'Enter your registered email address.',
        action: async (page) => {
            await page.fill('input[formControlName="email"]', CREDENTIALS.email);
        }
    },
    {
        id: '003', name: 'login-password',
        caption: 'Enter Password',
        voiceover: 'Enter your password. The field is securely masked.',
        action: async (page) => {
            await page.fill('input[formControlName="password"]', CREDENTIALS.password);
        }
    },
    {
        id: '004', name: 'login-submit',
        caption: 'Sign In',
        voiceover: 'Click Sign In to authenticate with JWT token.',
        action: async (page) => {
            await Promise.all([
                page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
                page.click('button[type="submit"]')
            ]);
        }
    },
    {
        id: '005', name: 'dashboard-redirect',
        caption: 'Dashboard',
        voiceover: 'Login successful. Redirected to Dashboard with key metrics.',
        action: async (page) => {
            await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {});
            await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        }
    },

    // DASHBOARD (4 scenes)
    {
        id: '006', name: 'dashboard-metrics',
        caption: 'Key Metrics',
        voiceover: 'Dashboard shows Total Orders, Operations Ready, Active Holds, and Confirmations.',
        action: async (page) => {
            await page.evaluate(() => window.scrollTo(0, 0));
        }
    },
    {
        id: '007', name: 'dashboard-inventory',
        caption: 'Inventory Summary',
        voiceover: 'Inventory summary displays Available, Blocked, On-Hold, and Consumed materials.',
        action: async (page) => {
            await page.evaluate(() => window.scrollBy(0, 300));
        }
    },
    {
        id: '008', name: 'dashboard-orders',
        caption: 'Orders Ready',
        voiceover: 'Orders Ready for Production with quick navigation links.',
        action: async (page) => {
            await page.evaluate(() => window.scrollBy(0, 200));
        }
    },
    {
        id: '009', name: 'dashboard-audit',
        caption: 'Audit Trail',
        voiceover: 'Audit Trail provides complete activity logging for compliance.',
        action: async (page) => {
            await page.evaluate(() => window.scrollBy(0, 200));
        }
    },

    // ORDERS (4 scenes)
    {
        id: '010', name: 'orders-list',
        caption: 'Orders List',
        voiceover: 'Orders module displays all production orders with server-side pagination.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/orders`, { waitUntil: 'networkidle' });
        }
    },
    {
        id: '011', name: 'orders-filter',
        caption: 'Filter Orders',
        voiceover: 'Filter orders by status: Created, In Progress, or Completed.',
        action: async (page) => {
            const filter = page.locator('select').first();
            if (await filter.count() > 0) {
                await filter.selectOption({ index: 1 }).catch(() => {});
            }
        }
    },
    {
        id: '012', name: 'order-detail',
        caption: 'Order Detail',
        voiceover: 'Order detail shows customer information, dates, and priority level.',
        action: async (page) => {
            const viewBtn = page.locator('button:has-text("View")').first();
            if (await viewBtn.count() > 0) {
                await viewBtn.click().catch(() => {});
                await page.waitForLoadState('networkidle');
            }
        }
    },
    {
        id: '013', name: 'order-operations',
        caption: 'Operations Timeline',
        voiceover: 'Operations timeline shows production steps with status flow.',
        action: async (page) => {
            await page.evaluate(() => window.scrollBy(0, 300));
        }
    },

    // INVENTORY (4 scenes)
    {
        id: '014', name: 'inventory-list',
        caption: 'Inventory List',
        voiceover: 'Inventory Management tracks all materials with batch numbers and status.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/inventory`, { waitUntil: 'networkidle' });
        }
    },
    {
        id: '015', name: 'inventory-available',
        caption: 'Available Materials',
        voiceover: 'Filter to show Available materials ready for production use.',
        action: async (page) => {
            const filter = page.locator('select').first();
            if (await filter.count() > 0) {
                await filter.selectOption('AVAILABLE').catch(() => {});
            }
        }
    },
    {
        id: '016', name: 'inventory-blocked',
        caption: 'Blocked Materials',
        voiceover: 'View Blocked materials pending quality investigation.',
        action: async (page) => {
            const filter = page.locator('select').first();
            if (await filter.count() > 0) {
                await filter.selectOption('BLOCKED').catch(() => {});
            }
        }
    },
    {
        id: '017', name: 'inventory-actions',
        caption: 'Inventory Actions',
        voiceover: 'Block, unblock, or scrap inventory items with reason tracking.',
        action: async (page) => {
            const filter = page.locator('select').first();
            if (await filter.count() > 0) {
                await filter.selectOption('').catch(() => {});
            }
        }
    },

    // BATCHES (3 scenes)
    {
        id: '018', name: 'batches-list',
        caption: 'Batch Traceability',
        voiceover: 'Batch Traceability tracks all batches with auto-generated unique numbers.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/batches`, { waitUntil: 'networkidle' });
        }
    },
    {
        id: '019', name: 'batches-filter',
        caption: 'Filter Batches',
        voiceover: 'Filter batches by status: Active, Consumed, or On-Hold.',
        action: async (page) => {
            const filter = page.locator('select').first();
            if (await filter.count() > 0) {
                await filter.selectOption({ index: 1 }).catch(() => {});
            }
        }
    },
    {
        id: '020', name: 'batch-genealogy',
        caption: 'Batch Genealogy',
        voiceover: 'View genealogy to trace parent-child relationships for full traceability.',
        action: async (page) => {
            const btn = page.locator('button:has-text("Genealogy")').first();
            if (await btn.count() > 0) {
                await btn.click().catch(() => {});
                await page.waitForLoadState('networkidle');
            }
        }
    },

    // HOLDS (4 scenes)
    {
        id: '021', name: 'holds-list',
        caption: 'Hold Management',
        voiceover: 'Hold Management shows active holds on materials, equipment, and operations.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/holds`, { waitUntil: 'networkidle' });
        }
    },
    {
        id: '022', name: 'holds-filter',
        caption: 'Filter Holds',
        voiceover: 'Filter holds by entity type: Inventory, Batch, Equipment, or Operation.',
        action: async (page) => {
            const filter = page.locator('select').first();
            if (await filter.count() > 0) {
                await filter.selectOption({ index: 1 }).catch(() => {});
            }
        }
    },
    {
        id: '023', name: 'holds-apply',
        caption: 'Apply Hold',
        voiceover: 'Apply Hold modal to block items pending investigation or approval.',
        action: async (page) => {
            const btn = page.locator('button:has-text("Apply Hold")');
            if (await btn.count() > 0) {
                await btn.click().catch(() => {});
                await page.waitForTimeout(500);
            }
        }
    },
    {
        id: '024', name: 'holds-modal',
        caption: 'Hold Details',
        voiceover: 'Select entity type, reason, and add comments for the hold record.',
        action: async (page) => {
            const cancelBtn = page.locator('button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) {
                await cancelBtn.click().catch(() => {});
            }
        }
    },

    // EQUIPMENT (3 scenes)
    {
        id: '025', name: 'equipment-list',
        caption: 'Equipment Management',
        voiceover: 'Equipment Management tracks production equipment with status tracking.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/equipment`, { waitUntil: 'networkidle' });
        }
    },
    {
        id: '026', name: 'equipment-status',
        caption: 'Equipment Status',
        voiceover: 'Status summary shows Available, In-Use, Maintenance, and On-Hold counts.',
        action: async (page) => {
            await page.evaluate(() => window.scrollTo(0, 0));
        }
    },
    {
        id: '027', name: 'equipment-maintenance',
        caption: 'Maintenance Mode',
        voiceover: 'Start or end maintenance with reason tracking and audit trail.',
        action: async (page) => {
            const filter = page.locator('select').first();
            if (await filter.count() > 0) {
                await filter.selectOption({ index: 1 }).catch(() => {});
            }
        }
    },

    // QUALITY (2 scenes)
    {
        id: '028', name: 'quality-list',
        caption: 'Quality Inspection',
        voiceover: 'Quality Inspection shows processes pending quality approval.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/quality`, { waitUntil: 'networkidle' });
        }
    },
    {
        id: '029', name: 'quality-actions',
        caption: 'Accept or Reject',
        voiceover: 'Accept or reject production with quality comments and audit logging.',
        action: async (page) => {
            await page.evaluate(() => window.scrollTo(0, 0));
        }
    },

    // LOGOUT (2 scenes)
    {
        id: '030', name: 'before-logout',
        caption: 'Session Complete',
        voiceover: 'Session complete. Click Logout to end the session securely.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        }
    },
    {
        id: '031', name: 'after-logout',
        caption: 'Logged Out',
        voiceover: 'Logged out. Session ended and JWT token cleared. Demo complete.',
        action: async (page) => {
            const logoutBtn = page.locator('button:has-text("Logout")');
            if (await logoutBtn.count() > 0) {
                await logoutBtn.click().catch(() => {});
            }
            await page.waitForTimeout(1000);
        }
    }
];

// Show caption overlay
async function showCaption(page, id, text) {
    await page.evaluate(({ id, text }) => {
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
                background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%);
                padding: 25px 40px 20px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            ">
                <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 15px;">
                    <span style="
                        background: #2196F3;
                        color: white;
                        padding: 6px 14px;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: 700;
                    ">${id}</span>
                    <span style="
                        font-size: 26px;
                        font-weight: 600;
                        color: white;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    ">${text}</span>
                </div>
            </div>
        `;
    }, { id, text });
}

// Generate TTS audio
async function generateAudio(text, outputPath) {
    try {
        const audioBase64 = await googleTTS.getAudioBase64(text, { lang: 'en', slow: false });
        fs.writeFileSync(outputPath, Buffer.from(audioBase64, 'base64'));
        return true;
    } catch (err) {
        console.error(`   Audio error: ${err.message}`);
        return false;
    }
}

// Get audio duration
function getAudioDuration(filePath) {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) resolve(2);
            else resolve(metadata.format.duration || 2);
        });
    });
}

// Create silence
function createSilence(duration, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input('anullsrc=r=44100:cl=mono')
            .inputFormat('lavfi')
            .duration(duration)
            .audioCodec('libmp3lame')
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

// Concatenate audio files
function concatAudio(files, outputPath) {
    return new Promise((resolve, reject) => {
        const listFile = outputPath.replace('.mp3', '_list.txt');
        fs.writeFileSync(listFile, files.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
        ffmpeg()
            .input(listFile)
            .inputOptions(['-f', 'concat', '-safe', '0'])
            .audioCodec('libmp3lame')
            .output(outputPath)
            .on('end', () => { fs.unlinkSync(listFile); resolve(); })
            .on('error', reject)
            .run();
    });
}

// Combine video + audio
function combineVideoAudio(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .outputOptions(['-c:v libx264', '-c:a aac', '-shortest', '-preset fast', '-crf 23'])
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

// Check servers
async function checkServers() {
    const check = (url) => new Promise((resolve) => {
        http.get(url, (res) => resolve(res.statusCode < 600)).on('error', () => resolve(false));
    });
    const frontend = await check('http://localhost:4200');
    const backend = await check('http://localhost:8080/api/dashboard/stats');
    if (!frontend || !backend) {
        console.error('Servers not running!');
        if (!backend) console.error('  Backend: gradlew bootRun --args="--spring.profiles.active=demo"');
        if (!frontend) console.error('  Frontend: npm start');
        process.exit(1);
    }
}

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, 'output', 'synced-demo', timestamp);
    const screenshotDir = path.join(outputDir, 'screenshots');
    const audioDir = path.join(outputDir, 'audio');

    fs.mkdirSync(screenshotDir, { recursive: true });
    fs.mkdirSync(audioDir, { recursive: true });

    console.log('='.repeat(70));
    console.log('MES DEMO WITH SYNCED VOICEOVER');
    console.log('='.repeat(70));
    console.log(`Output: ${outputDir}`);
    console.log(`Scenes: ${SCENES.length}`);
    console.log(`Duration per scene: ${SCENE_DURATION}ms`);
    console.log('='.repeat(70));

    await checkServers();

    // STEP 1: Generate all voiceover audio first
    console.log('\n[1/3] Generating voiceover audio...');
    const audioSegments = [];
    const sceneDurationSec = SCENE_DURATION / 1000;

    for (let i = 0; i < SCENES.length; i++) {
        const scene = SCENES[i];
        const voiceFile = path.join(audioDir, `${scene.id}-voice.mp3`);

        console.log(`   ${scene.id}: ${scene.caption}`);
        await generateAudio(scene.voiceover, voiceFile);

        const voiceDuration = await getAudioDuration(voiceFile);
        audioSegments.push(voiceFile);

        // Add padding silence if voice is shorter than scene duration
        if (voiceDuration < sceneDurationSec) {
            const padFile = path.join(audioDir, `${scene.id}-pad.mp3`);
            await createSilence(sceneDurationSec - voiceDuration, padFile);
            audioSegments.push(padFile);
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 300));
    }

    // Combine all audio
    const combinedAudio = path.join(outputDir, 'voiceover.mp3');
    await concatAudio(audioSegments, combinedAudio);
    console.log(`   Combined: ${combinedAudio}`);

    // STEP 2: Record video with exact same timing
    console.log('\n[2/3] Recording video...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } }
    });
    const page = await context.newPage();

    for (const scene of SCENES) {
        console.log(`   ${scene.id}: ${scene.caption}`);

        // Execute action
        await scene.action(page);

        // Show caption
        await showCaption(page, scene.id, scene.caption);

        // Take screenshot
        await page.screenshot({
            path: path.join(screenshotDir, `${scene.id}-${scene.name}.png`),
            fullPage: false
        });

        // Wait EXACT scene duration (keeps in sync with audio)
        await page.waitForTimeout(SCENE_DURATION);
    }

    await page.close();
    await context.close();
    await browser.close();

    // Find recorded video
    const files = fs.readdirSync(outputDir);
    const videoFile = files.find(f => f.endsWith('.webm'));
    const videoPath = path.join(outputDir, videoFile);
    console.log(`   Video: ${videoPath}`);

    // STEP 3: Combine video + audio
    console.log('\n[3/3] Creating final video with voiceover...');
    const finalOutput = path.join(outputDir, `MES-Demo-Final-${timestamp}.mp4`);
    await combineVideoAudio(videoPath, combinedAudio, finalOutput);

    const stats = fs.statSync(finalOutput);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(70));
    console.log(`Final Video: ${finalOutput}`);
    console.log(`Size: ${sizeMB} MB`);
    console.log(`Scenes: ${SCENES.length}`);
    console.log(`Total Duration: ~${(SCENES.length * SCENE_DURATION / 1000).toFixed(0)} seconds`);
    console.log('='.repeat(70));
}

main().catch(console.error);
