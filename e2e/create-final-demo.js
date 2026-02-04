/**
 * MES Production Confirmation - Final Demo Creator
 *
 * Creates a complete demo video with voiceover audio.
 * Uses ffmpeg-static (no manual FFmpeg installation required).
 *
 * Prerequisites:
 *   - Backend running: gradlew bootRun --args="--spring.profiles.active=demo"
 *   - Frontend running: npm start
 *
 * Usage:
 *   npm install ffmpeg-static fluent-ffmpeg google-tts-api
 *   node e2e/create-final-demo.js
 *
 * Output:
 *   - Final video: e2e/output/final/demo-{timestamp}.mp4
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Check and load dependencies
let ffmpegPath, ffprobePath, ffmpeg, googleTTS;
try {
    ffmpegPath = require('ffmpeg-static');
    ffprobePath = require('ffprobe-static').path;
    ffmpeg = require('fluent-ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    googleTTS = require('google-tts-api');
} catch (err) {
    console.error('Missing dependencies. Please run:');
    console.error('  npm install ffmpeg-static ffprobe-static fluent-ffmpeg google-tts-api');
    process.exit(1);
}

const BASE_URL = 'http://localhost:4200';

const CREDENTIALS = {
    email: 'admin@mes.com',
    password: 'admin123'
};

// Simplified demo script with voiceover text for each scene
const DEMO_SCENES = [
    {
        id: '01',
        title: 'Introduction',
        voiceover: 'Welcome to the MES Production Confirmation system. This Manufacturing Execution System helps track production workflows, material consumption, and batch traceability.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
        },
        duration: 5000
    },
    {
        id: '02',
        title: 'Login',
        voiceover: 'Users authenticate with their email and password. The system uses JWT tokens for secure authentication.',
        action: async (page) => {
            await page.fill('input[formControlName="email"]', CREDENTIALS.email);
            await page.fill('input[formControlName="password"]', CREDENTIALS.password);
        },
        duration: 4000
    },
    {
        id: '03',
        title: 'Sign In',
        voiceover: 'Upon successful login, users are redirected to the Dashboard.',
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
            await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        },
        duration: 4000
    },
    {
        id: '04',
        title: 'Dashboard',
        voiceover: 'The Dashboard shows key production metrics: Total Orders, Operations Ready, Active Holds, and Today\'s Confirmations.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
        },
        duration: 6000
    },
    {
        id: '05',
        title: 'Orders List',
        voiceover: 'The Orders module displays all customer orders with server-side pagination. Filter by status and search by order number.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/orders`, { waitUntil: 'networkidle' });
        },
        duration: 5000
    },
    {
        id: '06',
        title: 'Order Detail',
        voiceover: 'Click on an order to view its details, including line items and the operations timeline.',
        action: async (page) => {
            const rows = page.locator('table tbody tr');
            if (await rows.count() > 0) {
                await rows.first().click();
                await page.waitForLoadState('networkidle');
            }
        },
        duration: 5000
    },
    {
        id: '07',
        title: 'Production Form',
        voiceover: 'The Production Confirmation form is the core workflow. Operators record completed production work here.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/production/confirm`, { waitUntil: 'networkidle' });
        },
        duration: 4000
    },
    {
        id: '08',
        title: 'Select Order and Operation',
        voiceover: 'Select an Order and Operation. The system suggests material consumption based on the Bill of Materials.',
        action: async (page) => {
            const orderDropdown = page.locator('select#order, select[formControlName="order"]');
            if (await orderDropdown.count() > 0) {
                await orderDropdown.selectOption({ index: 1 }).catch(() => {});
                await page.waitForTimeout(1000);
            }
            const opDropdown = page.locator('select#operation, select[formControlName="operation"]');
            if (await opDropdown.count() > 0) {
                await opDropdown.selectOption({ index: 1 }).catch(() => {});
            }
        },
        duration: 5000
    },
    {
        id: '09',
        title: 'Enter Production Details',
        voiceover: 'Enter start time, end time, and quantities. Process parameters are validated against configured limits.',
        action: async (page) => {
            const startTime = page.locator('input[type="datetime-local"][formControlName="startTime"]');
            const endTime = page.locator('input[type="datetime-local"][formControlName="endTime"]');
            if (await startTime.count() > 0) await startTime.fill('2024-02-04T08:00');
            if (await endTime.count() > 0) await endTime.fill('2024-02-04T12:00');
            const producedQty = page.locator('input[formControlName="producedQty"]');
            if (await producedQty.count() > 0) await producedQty.fill('100');
        },
        duration: 5000
    },
    {
        id: '10',
        title: 'Inventory List',
        voiceover: 'The Inventory module tracks all materials. Filter by state and type. Block or scrap inventory as needed.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/inventory`, { waitUntil: 'networkidle' });
        },
        duration: 5000
    },
    {
        id: '11',
        title: 'Batches List',
        voiceover: 'Batches are trackable units of material with unique auto-generated numbers.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/batches`, { waitUntil: 'networkidle' });
        },
        duration: 4000
    },
    {
        id: '12',
        title: 'Batch Genealogy',
        voiceover: 'The Genealogy view shows parent and child batches for complete traceability. Critical for quality investigations.',
        action: async (page) => {
            const rows = page.locator('table tbody tr');
            if (await rows.count() > 0) {
                await rows.first().click();
                await page.waitForLoadState('networkidle');
            }
        },
        duration: 5000
    },
    {
        id: '13',
        title: 'Holds Management',
        voiceover: 'The Holds module manages temporary blocks on materials, equipment, or operations.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/holds`, { waitUntil: 'networkidle' });
        },
        duration: 4000
    },
    {
        id: '14',
        title: 'Equipment List',
        voiceover: 'The Equipment module tracks production equipment status: available, in use, maintenance, or on hold.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/equipment`, { waitUntil: 'networkidle' });
        },
        duration: 4000
    },
    {
        id: '15',
        title: 'Quality Inspection',
        voiceover: 'The Quality module shows processes pending inspection. Accept or reject items to control production flow.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/quality`, { waitUntil: 'networkidle' });
        },
        duration: 4000
    },
    {
        id: '16',
        title: 'Conclusion',
        voiceover: 'The system includes 499 backend tests, 257 frontend tests, and 65 E2E tests. All passing at 100 percent. Thank you for watching.',
        action: async (page) => {
            await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
            const logoutBtn = page.locator('button:has-text("Logout")');
            if (await logoutBtn.count() > 0) {
                await logoutBtn.click();
            }
        },
        duration: 6000
    }
];

// Generate voiceover audio for a scene
async function generateAudio(text, outputPath) {
    if (text.length > 200) {
        const results = await googleTTS.getAllAudioBase64(text, { lang: 'en', slow: false });
        const buffers = results.map(r => Buffer.from(r.base64, 'base64'));
        fs.writeFileSync(outputPath, Buffer.concat(buffers));
    } else {
        const audioBase64 = await googleTTS.getAudioBase64(text, { lang: 'en', slow: false });
        fs.writeFileSync(outputPath, Buffer.from(audioBase64, 'base64'));
    }
}

// Concatenate audio files
function concatAudio(inputFiles, outputFile) {
    return new Promise((resolve, reject) => {
        const cmd = ffmpeg();
        inputFiles.forEach(file => cmd.input(file));
        cmd.on('error', reject)
           .on('end', resolve)
           .mergeToFile(outputFile, path.dirname(outputFile));
    });
}

// Combine video and audio
function combineVideoAudio(videoFile, audioFile, outputFile) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoFile)
            .input(audioFile)
            .outputOptions([
                '-c:v libx264',
                '-c:a aac',
                '-shortest',
                '-preset fast'
            ])
            .output(outputFile)
            .on('error', reject)
            .on('end', resolve)
            .run();
    });
}

// Show text overlay on page
async function showOverlay(page, title) {
    await page.evaluate((t) => {
        const existing = document.getElementById('demo-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'demo-overlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                bottom: 30px;
                left: 30px;
                right: 30px;
                background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(30,30,30,0.9));
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                border: 1px solid rgba(255,255,255,0.1);
            ">
                <h3 style="margin: 0; font-size: 28px; color: #4CAF50;">${t}</h3>
            </div>
        `;
        document.body.appendChild(overlay);
    }, title);
}

async function createFinalDemo() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, 'output', 'final', timestamp);
    const audioDir = path.join(outputDir, 'audio');
    const videoDir = path.join(outputDir, 'video');

    fs.mkdirSync(audioDir, { recursive: true });
    fs.mkdirSync(videoDir, { recursive: true });

    console.log('═'.repeat(70));
    console.log('MES PRODUCTION CONFIRMATION - FINAL DEMO CREATOR');
    console.log('═'.repeat(70));
    console.log(`Output: ${outputDir}`);
    console.log('═'.repeat(70));

    // Step 1: Generate all voiceover audio
    console.log('\n📢 Step 1: Generating voiceover audio...');
    const audioFiles = [];
    for (const scene of DEMO_SCENES) {
        const audioPath = path.join(audioDir, `${scene.id}.mp3`);
        console.log(`   Generating: ${scene.id} - ${scene.title}`);
        await generateAudio(scene.voiceover, audioPath);
        audioFiles.push(audioPath);
        await new Promise(r => setTimeout(r, 500)); // Rate limit
    }
    console.log(`   ✅ Generated ${audioFiles.length} audio files`);

    // Step 2: Concatenate audio
    console.log('\n🎵 Step 2: Concatenating audio...');
    const combinedAudio = path.join(outputDir, 'combined_voiceover.mp3');
    await concatAudio(audioFiles, combinedAudio);
    console.log(`   ✅ Combined audio: ${combinedAudio}`);

    // Step 3: Record video
    console.log('\n🎬 Step 3: Recording video...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: { dir: videoDir, size: { width: 1920, height: 1080 } }
    });
    const page = await context.newPage();

    try {
        for (const scene of DEMO_SCENES) {
            console.log(`   Recording: ${scene.id} - ${scene.title}`);
            await scene.action(page);
            await showOverlay(page, scene.title);
            await page.waitForTimeout(scene.duration);
        }
        console.log('   ✅ Video recording complete');
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
    }

    await page.close();
    await context.close();
    await browser.close();

    // Find the recorded video file
    const videoFiles = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
    if (videoFiles.length === 0) {
        console.error('   ❌ No video file found');
        return;
    }
    const videoPath = path.join(videoDir, videoFiles[0]);
    console.log(`   Video file: ${videoPath}`);

    // Step 4: Combine video and audio
    console.log('\n🎞️  Step 4: Combining video and audio...');
    const finalOutput = path.join(outputDir, `MES-Demo-${timestamp}.mp4`);
    await combineVideoAudio(videoPath, combinedAudio, finalOutput);
    console.log(`   ✅ Final video: ${finalOutput}`);

    console.log('\n' + '═'.repeat(70));
    console.log('DEMO CREATION COMPLETE!');
    console.log('═'.repeat(70));
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`🎬 Final video: ${finalOutput}`);
    console.log('═'.repeat(70));
}

// Check if servers are running
async function checkServers() {
    const http = require('http');

    const checkUrl = (url) => new Promise((resolve) => {
        http.get(url, (res) => resolve(res.statusCode < 600)) // Any HTTP response means server is up
            .on('error', () => resolve(false));
    });

    const frontend = await checkUrl('http://localhost:4200');
    const backend = await checkUrl('http://localhost:8080/api/dashboard/stats');

    if (!frontend || !backend) {
        console.error('═'.repeat(70));
        console.error('ERROR: Servers not running!');
        console.error('═'.repeat(70));
        if (!backend) console.error('❌ Backend not running. Start with:');
        if (!backend) console.error('   cd backend && gradlew bootRun --args="--spring.profiles.active=demo"');
        if (!frontend) console.error('❌ Frontend not running. Start with:');
        if (!frontend) console.error('   cd frontend && npm start');
        console.error('═'.repeat(70));
        process.exit(1);
    }
}

// Run
checkServers().then(() => createFinalDemo()).catch(console.error);
