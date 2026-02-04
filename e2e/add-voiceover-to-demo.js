/**
 * Add Voiceover to Comprehensive Demo Video
 *
 * Generates synced voiceover audio and combines with video.
 *
 * Usage:
 *   node e2e/add-voiceover-to-demo.js <video-folder-path>
 *
 * Example:
 *   node e2e/add-voiceover-to-demo.js e2e/output/comprehensive-demo/2026-02-04T13-54-41
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

// Voiceover script matching the comprehensive demo scenes
// Each entry has timing (seconds from start) and text
const VOICEOVER_SCRIPT = [
    // Section 1: Authentication
    { time: 0, duration: 3, text: "Welcome to the MES Production Confirmation System." },
    { time: 3, duration: 3, text: "Users authenticate with email and password." },
    { time: 6, duration: 3, text: "Password is securely masked." },
    { time: 9, duration: 3, text: "Click Sign In to authenticate." },
    { time: 12, duration: 4, text: "Login successful. JWT token stored. Redirected to Dashboard." },

    // Section 2: Dashboard
    { time: 16, duration: 4, text: "The Dashboard shows key metrics: Total Orders, Operations Ready, Active Holds, and Confirmations." },
    { time: 20, duration: 3, text: "Inventory summary shows Available, Blocked, On-Hold, and Consumed materials." },
    { time: 23, duration: 3, text: "Quick access to Orders Ready for Production and Recent Confirmations." },
    { time: 26, duration: 3, text: "Audit Trail provides complete activity logging for compliance." },

    // Section 3: Orders
    { time: 29, duration: 3, text: "The Orders module displays all production orders with server-side pagination." },
    { time: 32, duration: 3, text: "Filter orders by status: Created, In Progress, or Completed." },
    { time: 35, duration: 3, text: "Order detail shows customer information, dates, and priority." },
    { time: 38, duration: 3, text: "Line items display products ordered with quantities." },
    { time: 41, duration: 4, text: "Operations timeline shows production steps with status flow." },

    // Section 4: Inventory
    { time: 45, duration: 3, text: "Inventory Management tracks all materials with batch numbers and status." },
    { time: 48, duration: 3, text: "Status cards show quick counts by state." },
    { time: 51, duration: 3, text: "Filter to show only Available materials for production." },
    { time: 54, duration: 3, text: "View Blocked materials pending quality investigation." },
    { time: 57, duration: 3, text: "Filter by material type: Raw Materials, Intermediate, or Finished Goods." },

    // Section 5: Batches
    { time: 60, duration: 3, text: "Batch Traceability tracks all batches with auto-generated numbers." },
    { time: 63, duration: 3, text: "Filter to view Consumed batches used in production." },

    // Section 6: Holds
    { time: 66, duration: 3, text: "Hold Management shows active holds on materials, equipment, and operations." },
    { time: 69, duration: 3, text: "Filter to view holds on Inventory items only." },
    { time: 72, duration: 3, text: "Apply Hold modal to block items pending investigation." },
    { time: 75, duration: 3, text: "Select entity type, entity, reason, and add comments." },
    { time: 78, duration: 3, text: "Release Hold modal to remove holds with release comments." },

    // Section 7: Equipment
    { time: 81, duration: 3, text: "Equipment Management tracks production equipment status." },
    { time: 84, duration: 3, text: "Status summary shows Available, In-Use, Maintenance, and On-Hold counts." },
    { time: 87, duration: 3, text: "Filter to view equipment currently under Maintenance." },

    // Section 8: Quality
    { time: 90, duration: 3, text: "Quality Inspection shows processes pending quality approval." },

    // Section 9: Logout
    { time: 93, duration: 3, text: "Click Logout to end the session securely." },
    { time: 96, duration: 3, text: "Session ended. JWT token cleared." },
    { time: 99, duration: 4, text: "Demo complete. The system includes 499 backend tests, 257 frontend tests, and 67 E2E tests. All passing." }
];

// Generate audio for a text segment
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
        console.error(`   Error generating audio: ${err.message}`);
        return false;
    }
}

// Get audio duration using ffprobe
function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration);
        });
    });
}

// Create silence audio of specified duration
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

// Concatenate audio files with timing
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

async function addVoiceover(demoFolder) {
    console.log('═'.repeat(70));
    console.log('ADD VOICEOVER TO COMPREHENSIVE DEMO');
    console.log('═'.repeat(70));

    // Find video file
    const files = fs.readdirSync(demoFolder);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (!videoFile) {
        console.error('No video file found in folder');
        process.exit(1);
    }
    const videoPath = path.join(demoFolder, videoFile);
    console.log(`Video: ${videoPath}`);

    // Create audio folder
    const audioDir = path.join(demoFolder, 'audio');
    fs.mkdirSync(audioDir, { recursive: true });

    // Step 1: Generate all voiceover audio segments
    console.log('\n📢 Step 1: Generating voiceover audio...');
    const audioSegments = [];
    let currentTime = 0;

    for (let i = 0; i < VOICEOVER_SCRIPT.length; i++) {
        const segment = VOICEOVER_SCRIPT[i];
        const segmentFile = path.join(audioDir, `segment_${String(i).padStart(3, '0')}.mp3`);

        // Add silence if there's a gap
        if (segment.time > currentTime) {
            const silenceDuration = segment.time - currentTime;
            const silenceFile = path.join(audioDir, `silence_${String(i).padStart(3, '0')}.mp3`);
            console.log(`   Creating ${silenceDuration}s silence...`);
            await createSilence(silenceDuration, silenceFile);
            audioSegments.push(silenceFile);
            currentTime = segment.time;
        }

        // Generate voiceover
        console.log(`   ${i + 1}/${VOICEOVER_SCRIPT.length}: "${segment.text.substring(0, 50)}..."`);
        await generateAudio(segment.text, segmentFile);
        audioSegments.push(segmentFile);

        // Get actual duration of generated audio
        try {
            const audioDuration = await getAudioDuration(segmentFile);
            currentTime += audioDuration;
        } catch (e) {
            currentTime += segment.duration;
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`   ✅ Generated ${audioSegments.length} audio segments`);

    // Step 2: Concatenate all audio
    console.log('\n🎵 Step 2: Concatenating audio...');
    const combinedAudio = path.join(demoFolder, 'voiceover.mp3');
    await concatAudioFiles(audioSegments, combinedAudio);
    console.log(`   ✅ Combined audio: ${combinedAudio}`);

    // Step 3: Combine video and audio
    console.log('\n🎬 Step 3: Combining video and audio...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const finalOutput = path.join(demoFolder, `MES-Demo-WithVoiceover-${timestamp}.mp4`);
    await combineVideoAudio(videoPath, combinedAudio, finalOutput);
    console.log(`   ✅ Final video: ${finalOutput}`);

    // Get file size
    const stats = fs.statSync(finalOutput);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);

    console.log('\n' + '═'.repeat(70));
    console.log('VOICEOVER ADDED SUCCESSFULLY');
    console.log('═'.repeat(70));
    console.log(`📁 Folder: ${demoFolder}`);
    console.log(`🎬 Final Video: ${finalOutput}`);
    console.log(`📦 Size: ${fileSizeMB} MB`);
    console.log('═'.repeat(70));
}

// Get folder from command line or use latest
const args = process.argv.slice(2);
let demoFolder;

if (args.length > 0) {
    demoFolder = path.resolve(args[0]);
} else {
    // Find latest comprehensive demo folder
    const baseDir = path.join(__dirname, 'output', 'comprehensive-demo');
    if (fs.existsSync(baseDir)) {
        const folders = fs.readdirSync(baseDir).sort().reverse();
        if (folders.length > 0) {
            demoFolder = path.join(baseDir, folders[0]);
        }
    }
}

if (!demoFolder || !fs.existsSync(demoFolder)) {
    console.error('Demo folder not found. Usage:');
    console.error('  node e2e/add-voiceover-to-demo.js <demo-folder-path>');
    process.exit(1);
}

addVoiceover(demoFolder).catch(console.error);
