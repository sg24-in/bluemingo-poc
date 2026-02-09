const { mdToPdf } = require('md-to-pdf');
const path = require('path');
const fs = require('fs');

async function convert(inputFile) {
    const outputFile = inputFile.replace(/\.md$/, '.pdf');
    const inputDir = path.dirname(inputFile);
    console.log(`Converting: ${path.basename(inputFile)} -> ${path.basename(outputFile)}`);

    // Read markdown and embed images as base64 data URIs
    let content = fs.readFileSync(inputFile, 'utf-8');
    let imageCount = 0;

    content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imgPath) => {
        if (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:')) {
            return match;
        }
        const absPath = path.resolve(inputDir, imgPath);
        if (fs.existsSync(absPath)) {
            const ext = path.extname(absPath).toLowerCase().replace('.', '');
            const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
            const base64 = fs.readFileSync(absPath).toString('base64');
            imageCount++;
            console.log(`  [${imageCount}] Embedded: ${path.basename(imgPath)} (${(base64.length * 0.75 / 1024).toFixed(0)} KB)`);
            return `![${alt}](data:${mime};base64,${base64})`;
        } else {
            console.log(`  MISSING: ${imgPath}`);
            return match;
        }
    });

    console.log(`  Total images embedded: ${imageCount}`);

    const pdf = await mdToPdf(
        { content },
        {
            dest: outputFile,
            basedir: inputDir,
            pdf_options: {
                format: 'A4',
                margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
                printBackground: true
            },
            css: `
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.5; }
                h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 6px; }
                h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 24px; }
                h3 { font-size: 14px; margin-top: 16px; }
                table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10px; }
                th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                th { background: #f5f5f5; font-weight: 600; }
                code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-size: 10px; }
                pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 9px; }
                pre code { background: none; padding: 0; }
                img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin: 8px 0; }
            `
        }
    );

    if (pdf) {
        const size = fs.statSync(outputFile).size;
        const unit = size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${(size / 1024).toFixed(0)} KB`;
        console.log(`  Done: ${outputFile} (${unit})`);
    }
}

async function main() {
    const docsDir = path.join(__dirname, '..', 'documents');

    const files = [
        path.join(docsDir, 'MES-Demo-Data-Reference.md'),
        path.join(docsDir, 'MES-User-Guide-Complete.md'),
    ];

    for (const file of files) {
        if (fs.existsSync(file)) {
            await convert(file);
        } else {
            console.log(`Skipped (not found): ${file}`);
        }
    }

    console.log('\nAll conversions complete.');
}

main().catch(console.error);
