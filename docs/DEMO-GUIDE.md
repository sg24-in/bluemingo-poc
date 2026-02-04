# MES Production Confirmation - Demo Guide

This guide explains how to create demo videos and voiceovers for the MES Production Confirmation system.

---

## Quick Start

### Create Final Demo with Voiceover (Recommended)
```bash
# Terminal 1 - Start backend
cd backend && gradlew bootRun --args="--spring.profiles.active=demo"

# Terminal 2 - Start frontend
cd frontend && npm start

# Terminal 3 - Create final demo (video + audio)
npm install ffmpeg-static ffprobe-static fluent-ffmpeg google-tts-api
node e2e/create-final-demo.js
```

**Output:** `e2e/output/final/{timestamp}/MES-Demo-{timestamp}.mp4`

### Generate Voiceover Audio Only (No servers required)
```bash
cd e2e
npm install google-tts-api
node generate-voiceover.js
```

### Record Demo Video Only (Requires running servers)
```bash
# Terminal 1 - Start backend
cd backend && gradlew bootRun --args="--spring.profiles.active=demo"

# Terminal 2 - Start frontend
cd frontend && npm start

# Terminal 3 - Record demo
node e2e/record-demo-video.js
```

---

## Demo Recording Tools

### 1. Final Demo Creator (All-in-One)
**File:** `e2e/create-final-demo.js`

Creates a complete demo with synchronized video and voiceover:
- Generates 16 voiceover audio segments using Google TTS
- Records video with Playwright (1920x1080)
- Combines video and audio with ffmpeg
- No manual FFmpeg installation required (uses ffmpeg-static)

**Output:**
- Final video: `e2e/output/final/{timestamp}/MES-Demo-{timestamp}.mp4`
- Individual audio: `e2e/output/final/{timestamp}/audio/*.mp3`
- Combined audio: `e2e/output/final/{timestamp}/combined_voiceover.mp3`
- Source video: `e2e/output/final/{timestamp}/video/*.webm`

**Prerequisites:**
```bash
npm install ffmpeg-static ffprobe-static fluent-ffmpeg google-tts-api
```

### 2. Demo Video Recorder
**File:** `e2e/record-demo-video.js`

Records a comprehensive demo video with:
- 11 chapters covering all features
- Text overlays explaining each action
- 1920x1080 HD resolution
- WebM video format
- Screenshots at each step

**Output:**
- Video: `e2e/output/videos/demo-{timestamp}/*.webm`
- Screenshots: `e2e/output/screenshots/demo-{timestamp}/*.png`

### 2. Voiceover Generator
**File:** `e2e/generate-voiceover.js`

Generates MP3 audio files using Google Text-to-Speech (free, no API key):
- 21 audio segments covering all features
- Natural-sounding speech
- Ready to combine with video

**Output:**
- Audio: `e2e/output/voiceover/{timestamp}/*.mp3`
- File list: `e2e/output/voiceover/{timestamp}/filelist.txt`

### 3. User Journey Recorder
**File:** `e2e/record-user-journey.js`

Simpler recording for quick demos:
- Basic user journey through the app
- Screenshots at key interactions
- Video recording

---

## Demo Content Structure

### Chapters

| # | Chapter | Duration | Content |
|---|---------|----------|---------|
| 1 | Authentication | 45 sec | Login flow, JWT authentication |
| 2 | Dashboard | 75 sec | Metrics, inventory, orders, audit trail |
| 3 | Orders | 60 sec | List, filters, pagination, detail view |
| 4 | Production | 90 sec | Form, BOM suggestions, validation, confirmation |
| 5 | Inventory | 60 sec | List, block/unblock, scrap, filters |
| 6 | Batches | 60 sec | List, detail, genealogy, traceability |
| 7 | Holds | 45 sec | Apply, release, management |
| 8 | Equipment | 45 sec | List, maintenance, holds |
| 9 | Quality | 45 sec | Queue, accept/reject workflow |
| 10 | Summary | 30 sec | Key features recap |
| 11 | Logout | 15 sec | Session end |

**Total Duration:** ~8-10 minutes

---

## Combining Video and Voiceover

### Prerequisites
Install FFmpeg: https://ffmpeg.org/download.html

### Step 1: Concatenate Audio Files
```bash
cd e2e/output/voiceover/{timestamp}
ffmpeg -f concat -safe 0 -i filelist.txt -c copy combined_voiceover.mp3
```

### Step 2: Combine Video and Audio
```bash
ffmpeg -i ../videos/demo-{timestamp}/*.webm -i combined_voiceover.mp3 -c:v copy -c:a aac -shortest final_demo.mp4
```

### Step 3: (Optional) Add Padding/Sync
If video and audio need synchronization:
```bash
# Add 2 second delay to audio
ffmpeg -i video.webm -i audio.mp3 -itsoffset 2 -i audio.mp3 -map 0:v -map 2:a -c:v copy -c:a aac output.mp4
```

---

## Voiceover Script Segments

| File | Content |
|------|---------|
| `01-intro.mp3` | Welcome and system overview |
| `02-login.mp3` | Authentication explanation |
| `03-dashboard-metrics.mp3` | Key metrics overview |
| `04-dashboard-inventory.mp3` | Inventory summary |
| `05-dashboard-audit.mp3` | Audit trail feature |
| `06-orders-list.mp3` | Orders module overview |
| `07-orders-detail.mp3` | Order detail and timeline |
| `08-production-form.mp3` | Production form intro |
| `09-production-select.mp3` | Order/operation selection |
| `10-production-bom.mp3` | BOM suggestions |
| `11-production-params.mp3` | Parameter validation |
| `12-production-complete.mp3` | Confirmation process |
| `13-inventory-list.mp3` | Inventory management |
| `14-inventory-block.mp3` | Block/scrap features |
| `15-batches-list.mp3` | Batch tracking |
| `16-batches-genealogy.mp3` | Genealogy/traceability |
| `17-holds-management.mp3` | Hold management |
| `18-equipment-list.mp3` | Equipment tracking |
| `19-quality-queue.mp3` | Quality inspection |
| `20-summary.mp3` | Test coverage summary |
| `21-outro.mp3` | Thank you/logout |

---

## Existing Demo Assets

### Screenshots (38 images)
Location: `e2e/output/screenshots/demo-2026-02-04T07-29-42/`

### Video
Location: `e2e/output/videos/demo-2026-02-04T07-29-42/`

### Voiceover Audio (21 files)
Location: `e2e/output/voiceover/2026-02-04T13-04-19/`

---

## Customizing the Demo

### Modify Demo Script
Edit `e2e/record-demo-video.js`:
- Add/remove chapters in `DEMO_SCRIPT` array
- Change text overlays (title, description)
- Adjust timing (wait property in milliseconds)
- Modify actions (Playwright commands)

### Modify Voiceover Script
Edit `e2e/generate-voiceover.js`:
- Update `VOICEOVER_SCRIPT` array
- Change text for each segment
- Add/remove segments

### Change Voice Settings
In `generate-voiceover.js`, modify the google-tts-api options:
```javascript
const audioBase64 = await googleTTS.getAudioBase64(text, {
    lang: 'en',      // Language code
    slow: false,     // Set true for slower speech
    host: 'https://translate.google.com',
});
```

Available languages: en, es, fr, de, it, pt, ja, ko, zh-CN, etc.

---

## Troubleshooting

### Video recording fails
- Ensure backend is running in demo mode: `--spring.profiles.active=demo`
- Ensure frontend is running on localhost:4200
- Check browser can access the application

### Voiceover generation fails
- Ensure internet connection (uses Google TTS API)
- Try again if rate limited (script has 1s delay between requests)
- Check `google-tts-api` package is installed

### FFmpeg not found
- Install FFmpeg: https://ffmpeg.org/download.html
- Add to system PATH
- Restart terminal after installation

### Video/audio sync issues
- Use `-shortest` flag to match shorter duration
- Use `-itsoffset` to add delays
- Edit in video software for precise sync

---

## Alternative Tools

### Text-to-Speech Services
- [Google Cloud TTS](https://cloud.google.com/text-to-speech) - Higher quality, requires API key
- [AWS Polly](https://aws.amazon.com/polly/) - Neural voices, requires AWS account
- [Azure Speech](https://azure.microsoft.com/services/cognitive-services/speech-services/) - Natural voices
- [ElevenLabs](https://elevenlabs.io/) - AI voice cloning

### Video Editing Software
- [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve/) - Free, professional
- [Shotcut](https://shotcut.org/) - Free, open source
- [OpenShot](https://www.openshot.org/) - Free, easy to use
- [Kdenlive](https://kdenlive.org/) - Free, Linux/Windows

### Screen Recording
- [OBS Studio](https://obsproject.com/) - Free, powerful
- [ShareX](https://getsharex.com/) - Free, Windows
- [Loom](https://www.loom.com/) - Easy sharing

---

## Sources

- [google-tts-api - npm](https://www.npmjs.com/package/google-tts-api)
- [Playwright Video Recording](https://playwright.dev/docs/videos)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
