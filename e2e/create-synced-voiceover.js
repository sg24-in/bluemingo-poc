/**
 * Create Synced Voiceover for Comprehensive Demo
 *
 * Generates voiceover that exactly matches the 33 screenshots captured.
 * Each segment is ~2.5 seconds to match video timing.
 */

const path = require('path');
const fs = require('fs');

// Load dependencies
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
    console.error('  npm install ffmpeg-static ffprobe-static fluent-ffmpeg google-tts-api');
    process.exit(1);
}

// Voiceover matching exactly the 33 screenshots in order
// Each matches the caption shown at bottom of that screenshot
const SCENE_VOICEOVER = [
    // 001-005: Authentication
    { file: '001-login-page', text: "Login Page. MES Production Confirmation System with secure user authentication." },
    { file: '002-login-email-entered', text: "Enter your registered email address." },
    { file: '003-login-password-entered', text: "Enter your password. The field is securely masked." },
    { file: '004-login-before-submit', text: "Click the Sign In button to authenticate." },
    { file: '005-login-success', text: "Login successful. JWT token stored. Redirected to Dashboard." },

    // 006-009: Dashboard
    { file: '006-dashboard-overview', text: "Dashboard Overview. Key metrics show Total Orders, Operations Ready, Active Holds, and Today's Confirmations." },
    { file: '007-dashboard-inventory-summary', text: "Inventory Summary. Material status showing Available, Blocked, On-Hold, and Consumed counts." },
    { file: '008-dashboard-orders-confirmations', text: "Orders Ready for Production and Recent Confirmations. Quick access to pending work." },
    { file: '009-dashboard-audit-trail', text: "Audit Trail. Complete activity log for compliance and traceability." },

    // 010-014: Orders
    { file: '010-orders-list', text: "Orders List. All production orders displayed with server-side pagination." },
    { file: '011-orders-filter-applied', text: "Filter Orders by status. Options include Created, In Progress, and Completed." },
    { file: '012-order-detail-header', text: "Order Detail. Shows order header with status, priority, and due date." },
    { file: '013-order-line-items', text: "Line Items. Products ordered with quantities and SKU specifications." },
    { file: '014-order-operations-timeline', text: "Operations Timeline. Production steps progress from Not Started to Ready to In Progress to Confirmed." },

    // 015-019: Inventory
    { file: '015-inventory-list', text: "Inventory Management. All materials with batch numbers and status badges." },
    { file: '016-inventory-status-cards', text: "Status Summary cards. Quick counts for Available, Blocked, On-Hold, and Scrapped materials." },
    { file: '017-inventory-filter-available', text: "Filter showing Available materials. These are ready for production use." },
    { file: '018-inventory-filter-blocked', text: "Filter showing Blocked materials. These are pending quality investigation." },
    { file: '019-inventory-filter-type', text: "Filter by material type. Raw Materials, Intermediate, and Finished Goods." },

    // 020-021: Batches
    { file: '020-batches-list', text: "Batch Traceability. All batches with auto-generated unique numbers." },
    { file: '021-batches-filter-consumed', text: "Filter showing Consumed batches. These have been used in production." },

    // 022-026: Holds
    { file: '022-holds-list', text: "Hold Management. Active holds on materials, equipment, and operations." },
    { file: '023-holds-filter-inventory', text: "Filter showing Inventory holds only." },
    { file: '024-holds-apply-modal', text: "Apply Hold Modal. Select entity type, reason, and add comments." },
    { file: '025-holds-select-entity-type', text: "Select Entity Type. Choose from Operation, Process, Inventory, Batch, or Equipment." },
    { file: '026-holds-release-modal', text: "Release Hold Modal. Add release comments before removing the hold." },

    // 027-029: Equipment
    { file: '027-equipment-list', text: "Equipment Management. Production equipment with status tracking." },
    { file: '028-equipment-status-summary', text: "Equipment Status. Shows Available, In-Use, Maintenance, and On-Hold counts." },
    { file: '029-equipment-filter-maintenance', text: "Filter showing equipment currently under Maintenance." },

    // 030: Quality
    { file: '030-quality-pending-list', text: "Quality Inspection. Processes pending quality approval with accept or reject options." },

    // 031-033: Logout
    { file: '031-before-logout', text: "Session Complete. Click Logout to end the session securely." },
    { file: '032-after-logout', text: "Logged Out. Session ended and JWT token cleared." },
    { file: '033-demo-complete', text: "Demo Complete. MES Production Confirmation POC with 499 backend, 257 frontend, and 67 E2E tests. All passing at 100 percent." }
];

// Generate audio
async function generateAudio(text, outputPath) {
    try {
        if (text.length > 200) {
            const results = await googleTTS.getAllAudioBase64(text, { lang: 'en', slow: false });
            const buffers = results.map(r => Buffer.from(r.base64, 'base64'));
            fs.writeFileSync(outputPath, Buffer.concat(buffers));
        } else {
            const audioBase64 = await googleTTS.getAudioBase64(text, { lang: 'en', slow: false });
            fs.writeFileSync(outputPath, Buffer.from(audioBase64, 'base64'));
        }
        return true;
    } catch (err) {
        console.error(`   Error: ${err.message}`);
        return false;
    }
}

// Get audio duration
function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration);
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
function concatAudioFiles(audioFiles, outputPath) {
    return new Promise((resolve, reject) => {
        const listFile = outputPath.replace('.mp3', '_list.txt');
        const listContent = audioFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
        fs.writeFileSync(listFile, listContent);

        ffmpeg()
            .input(listFile)
            .inputOptions(['-f', 'concat', '-safe', '0'])
            .audioCodec('libmp3lame')
            .output(outputPath)
            .on('end', () => {
                fs.unlinkSync(listFile);
                resolve();
            })
            .on('error', reject)
            .run();
    });
}

// Combine video and audio
function combineVideoAudio(videoPath, audioPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .outputOptions([
                '-c:v libx264',
                '-c:a aac',
                '-shortest',
                '-preset fast',
                '-crf 23'
            ])
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

async function createSyncedVoiceover(demoFolder) {
    console.log('═'.repeat(70));
    console.log('CREATE SYNCED VOICEOVER FOR DEMO');
    console.log('═'.repeat(70));

    // Find video file
    const files = fs.readdirSync(demoFolder);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (!videoFile) {
        console.error('No video file found');
        process.exit(1);
    }
    const videoPath = path.join(demoFolder, videoFile);
    console.log(`Video: ${videoPath}`);

    // Create audio folder
    const audioDir = path.join(demoFolder, 'synced-audio');
    fs.mkdirSync(audioDir, { recursive: true });

    // Each scene in video is approximately 2.5 seconds (based on recording durations)
    const SCENE_DURATION = 2.5; // seconds per scene

    console.log('\n📢 Step 1: Generating voiceover for each scene...');
    const audioSegments = [];

    for (let i = 0; i < SCENE_VOICEOVER.length; i++) {
        const scene = SCENE_VOICEOVER[i];
        const audioFile = path.join(audioDir, `${String(i + 1).padStart(3, '0')}-voice.mp3`);

        console.log(`   ${i + 1}/${SCENE_VOICEOVER.length}: ${scene.file}`);

        // Generate voiceover
        await generateAudio(scene.text, audioFile);

        // Get actual audio duration
        let audioDuration = SCENE_DURATION;
        try {
            audioDuration = await getAudioDuration(audioFile);
        } catch (e) {}

        audioSegments.push(audioFile);

        // If audio is shorter than scene duration, add padding silence
        if (audioDuration < SCENE_DURATION) {
            const silenceFile = path.join(audioDir, `${String(i + 1).padStart(3, '0')}-pad.mp3`);
            await createSilence(SCENE_DURATION - audioDuration, silenceFile);
            audioSegments.push(silenceFile);
        }

        // Rate limit for Google TTS
        await new Promise(r => setTimeout(r, 350));
    }

    console.log(`   ✅ Generated ${SCENE_VOICEOVER.length} voiceover segments`);

    // Step 2: Concatenate all audio
    console.log('\n🎵 Step 2: Concatenating audio...');
    const combinedAudio = path.join(demoFolder, 'synced-voiceover.mp3');
    await concatAudioFiles(audioSegments, combinedAudio);
    console.log(`   ✅ Combined: ${combinedAudio}`);

    // Step 3: Combine with video
    console.log('\n🎬 Step 3: Creating final video with synced voiceover...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const finalOutput = path.join(demoFolder, `MES-Demo-Synced-${timestamp}.mp4`);
    await combineVideoAudio(videoPath, combinedAudio, finalOutput);

    const stats = fs.statSync(finalOutput);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

    console.log('\n' + '═'.repeat(70));
    console.log('SYNCED VOICEOVER COMPLETE');
    console.log('═'.repeat(70));
    console.log(`📁 Folder: ${demoFolder}`);
    console.log(`🎬 Final: ${finalOutput}`);
    console.log(`📦 Size: ${sizeMB} MB`);
    console.log('═'.repeat(70));
}

// Get demo folder
const args = process.argv.slice(2);
let demoFolder;

if (args.length > 0) {
    demoFolder = path.resolve(args[0]);
} else {
    const baseDir = path.join(__dirname, 'output', 'comprehensive-demo');
    if (fs.existsSync(baseDir)) {
        const folders = fs.readdirSync(baseDir).sort().reverse();
        if (folders.length > 0) {
            demoFolder = path.join(baseDir, folders[0]);
        }
    }
}

if (!demoFolder || !fs.existsSync(demoFolder)) {
    console.error('Demo folder not found');
    process.exit(1);
}

createSyncedVoiceover(demoFolder).catch(console.error);
