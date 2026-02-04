/**
 * MES Production Confirmation - Voiceover Generator
 *
 * Generates MP3 audio files for demo voiceover using Google TTS (free, no API key).
 *
 * Usage:
 *   npm install google-tts-api
 *   node e2e/generate-voiceover.js
 *
 * Output:
 *   - Audio files: e2e/output/voiceover/{timestamp}/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Voiceover script - each item becomes an MP3 file
const VOICEOVER_SCRIPT = [
    {
        id: '01-intro',
        text: 'Welcome to the MES Production Confirmation system. This Manufacturing Execution System helps track production workflows, material consumption, and batch traceability in steel manufacturing environments.'
    },
    {
        id: '02-login',
        text: 'Users authenticate using their registered email and password. The system uses JWT tokens for secure authentication, ensuring only authorized personnel can access production data.'
    },
    {
        id: '03-dashboard-metrics',
        text: 'The Dashboard displays key production metrics at a glance. Here we see Total Orders, Operations Ready for production, Active Holds, Today\'s Confirmations, and items Pending Quality inspection.'
    },
    {
        id: '04-dashboard-inventory',
        text: 'The Inventory section shows a breakdown of material status: total inventory count, available items ready for production, materials already consumed, and items currently on hold.'
    },
    {
        id: '05-dashboard-audit',
        text: 'Every action in the system is tracked in the Audit Trail with field-level change tracking. When any data is modified, the system logs the old value, new value, timestamp, and the user who made the change.'
    },
    {
        id: '06-orders-list',
        text: 'The Orders module displays all customer orders with server-side pagination. Large datasets are handled efficiently. You can filter by status, search by order number, and navigate through pages of results.'
    },
    {
        id: '07-orders-detail',
        text: 'Clicking on an order opens its detail view, showing all line items and the operations timeline. Color coding indicates status: green for completed, blue for ready, yellow for in progress.'
    },
    {
        id: '08-production-form',
        text: 'The Production Confirmation form is the core workflow of this MES system. This is where operators record completed production work.'
    },
    {
        id: '09-production-select',
        text: 'First, select an Order from the dropdown. Only orders with operations in READY status are available. Then select the specific Operation to confirm.'
    },
    {
        id: '10-production-bom',
        text: 'The system automatically suggests material consumption based on the Bill of Materials configuration. It shows what materials are needed and whether sufficient stock is available.'
    },
    {
        id: '11-production-params',
        text: 'Process parameters like temperature and pressure are validated in real-time. Errors are displayed if values exceed configured limits. Warnings appear when values approach the limits.'
    },
    {
        id: '12-production-complete',
        text: 'When the form is complete, clicking Confirm will update the operation status, create an output batch with an auto-generated batch number, and update inventory records.'
    },
    {
        id: '13-inventory-list',
        text: 'The Inventory module tracks all materials with server-side pagination. Filter by state: AVAILABLE, BLOCKED, CONSUMED, or SCRAPPED. And by type: Raw Materials, Intermediate products, or Finished Goods.'
    },
    {
        id: '14-inventory-block',
        text: 'The Block action temporarily prevents material from being used. This is typically used when quality issues are suspected and investigation is needed. A reason must be provided for traceability.'
    },
    {
        id: '15-batches-list',
        text: 'Batches are trackable units of material. Each batch has a unique number generated based on configurable patterns, incorporating operation type, product code, date, and sequence number.'
    },
    {
        id: '16-batches-genealogy',
        text: 'The Genealogy view is critical for quality investigations and recalls. It shows the complete history of a batch: parent materials that went into it, and child materials that were produced from it.'
    },
    {
        id: '17-holds-management',
        text: 'The Holds module manages temporary blocks on production resources. You can apply holds to Orders, Operations, Batches, Inventory items, or Equipment. Active holds prevent usage until released.'
    },
    {
        id: '18-equipment-list',
        text: 'The Equipment module tracks all production equipment. Status can be AVAILABLE, IN_USE, MAINTENANCE, or ON_HOLD. Equipment can be put into maintenance mode or held for investigation.'
    },
    {
        id: '19-quality-queue',
        text: 'The Quality module shows processes pending quality inspection. Click Accept to approve an item, or Reject with a reason. Quality decisions determine whether production can proceed.'
    },
    {
        id: '20-summary',
        text: 'The system includes comprehensive test coverage: 499 backend unit tests, 257 frontend tests, and 65 end-to-end tests. All tests are passing at 100 percent, ensuring reliability and quality.'
    },
    {
        id: '21-outro',
        text: 'Thank you for watching this demonstration of the MES Production Confirmation system. Click Logout to end your session securely.'
    }
];

// Google TTS URL generator (uses Google Translate's free TTS)
function getGoogleTTSUrl(text, lang = 'en') {
    const encodedText = encodeURIComponent(text);
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;
}

// Split long text into chunks (Google TTS has ~200 char limit)
function splitText(text, maxLength = 180) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxLength) {
            currentChunk += sentence;
        } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
}

// Download audio from URL
function downloadAudio(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                https.get(response.headers.location, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(outputPath, () => {});
            reject(err);
        });
    });
}

// Alternative: Use google-tts-api package if installed
async function generateWithGoogleTTSApi(text, outputPath) {
    try {
        const googleTTS = require('google-tts-api');
        const audioBase64 = await googleTTS.getAudioBase64(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
        });
        const buffer = Buffer.from(audioBase64, 'base64');
        fs.writeFileSync(outputPath, buffer);
        return true;
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            return false; // Package not installed
        }
        throw err;
    }
}

// Main function
async function generateVoiceover() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, 'output', 'voiceover', timestamp);
    fs.mkdirSync(outputDir, { recursive: true });

    console.log('═'.repeat(70));
    console.log('MES PRODUCTION CONFIRMATION - VOICEOVER GENERATOR');
    console.log('═'.repeat(70));
    console.log(`Output: ${outputDir}`);
    console.log('═'.repeat(70));

    // Check if google-tts-api is installed
    let usePackage = false;
    try {
        require.resolve('google-tts-api');
        usePackage = true;
        console.log('Using: google-tts-api package\n');
    } catch (e) {
        console.log('Note: Install google-tts-api for better quality:');
        console.log('  npm install google-tts-api\n');
        console.log('Using: Direct Google Translate TTS\n');
    }

    let successCount = 0;
    let failCount = 0;

    for (const item of VOICEOVER_SCRIPT) {
        const outputPath = path.join(outputDir, `${item.id}.mp3`);
        console.log(`Generating: ${item.id}`);
        console.log(`  Text: "${item.text.substring(0, 50)}..."`);

        try {
            if (usePackage) {
                // Use google-tts-api package (handles long text automatically)
                const googleTTS = require('google-tts-api');

                if (item.text.length > 200) {
                    // Get multiple audio URLs for long text
                    const results = await googleTTS.getAllAudioBase64(item.text, {
                        lang: 'en',
                        slow: false,
                    });

                    // Combine all audio chunks
                    const buffers = results.map(r => Buffer.from(r.base64, 'base64'));
                    const combined = Buffer.concat(buffers);
                    fs.writeFileSync(outputPath, combined);
                } else {
                    const audioBase64 = await googleTTS.getAudioBase64(item.text, {
                        lang: 'en',
                        slow: false,
                    });
                    const buffer = Buffer.from(audioBase64, 'base64');
                    fs.writeFileSync(outputPath, buffer);
                }
            } else {
                // Fallback: Use direct Google Translate TTS URL
                const chunks = splitText(item.text);
                const buffers = [];

                for (let i = 0; i < chunks.length; i++) {
                    const chunkPath = path.join(outputDir, `${item.id}_chunk${i}.mp3`);
                    const url = getGoogleTTSUrl(chunks[i]);
                    await downloadAudio(url, chunkPath);
                    buffers.push(fs.readFileSync(chunkPath));
                    fs.unlinkSync(chunkPath); // Clean up chunk
                }

                // Combine chunks
                const combined = Buffer.concat(buffers);
                fs.writeFileSync(outputPath, combined);
            }

            console.log(`  ✅ Saved: ${item.id}.mp3`);
            successCount++;

            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('VOICEOVER GENERATION COMPLETE');
    console.log('═'.repeat(70));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📁 Output: ${outputDir}`);
    console.log('═'.repeat(70));

    // Create a script to combine with video
    const combineScript = `
# Combine voiceover with video using FFmpeg
#
# Prerequisites: Install FFmpeg (https://ffmpeg.org/download.html)
#
# Usage:
#   1. Concatenate all audio files:
#      ffmpeg -f concat -safe 0 -i filelist.txt -c copy combined_voiceover.mp3
#
#   2. Combine video and audio:
#      ffmpeg -i demo_video.webm -i combined_voiceover.mp3 -c:v copy -c:a aac final_demo.mp4

# File list for concatenation:
${VOICEOVER_SCRIPT.map(item => `file '${item.id}.mp3'`).join('\n')}
`;

    fs.writeFileSync(path.join(outputDir, 'filelist.txt'),
        VOICEOVER_SCRIPT.map(item => `file '${item.id}.mp3'`).join('\n'));

    fs.writeFileSync(path.join(outputDir, 'combine_instructions.txt'), combineScript);

    console.log('\nNext steps:');
    console.log('1. Install FFmpeg if not already installed');
    console.log('2. Run: ffmpeg -f concat -safe 0 -i filelist.txt -c copy combined.mp3');
    console.log('3. Combine with video: ffmpeg -i video.webm -i combined.mp3 -c:v copy -c:a aac final.mp4');
}

// Run
generateVoiceover().catch(console.error);
