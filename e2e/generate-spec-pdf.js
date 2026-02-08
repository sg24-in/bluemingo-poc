/**
 * Generate PDF from MES-POC-Specification-Clean.md using Playwright
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const INPUT_FILE = path.join(__dirname, '..', 'documents', 'MES-POC-Specification-Clean.md');
const OUTPUT_FILE = path.join(__dirname, '..', 'documents', 'MES-POC-Specification.pdf');

async function generatePDF() {
  console.log('Generating PDF from MES-POC-Specification-Clean.md...\n');

  // Read markdown file
  let markdown = fs.readFileSync(INPUT_FILE, 'utf-8');

  // Convert markdown to HTML
  const htmlContent = marked(markdown);

  // Create full HTML document with styling
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MES Production Confirmation POC - Specification</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm 15mm;
      color: #333;
    }
    h1 {
      color: #1a365d;
      border-bottom: 3px solid #2b6cb0;
      padding-bottom: 10px;
      font-size: 24pt;
    }
    h2 {
      color: #2c5282;
      border-bottom: 2px solid #4299e1;
      padding-bottom: 8px;
      margin-top: 30px;
      font-size: 18pt;
      page-break-after: avoid;
    }
    h3 {
      color: #2d3748;
      margin-top: 20px;
      font-size: 14pt;
      page-break-after: avoid;
    }
    h4 {
      color: #4a5568;
      font-size: 12pt;
      page-break-after: avoid;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 15px 0;
      font-size: 10pt;
    }
    th, td {
      border: 1px solid #cbd5e0;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #edf2f7;
      font-weight: 600;
      color: #2d3748;
    }
    tr:nth-child(even) {
      background-color: #f7fafc;
    }
    code {
      background-color: #edf2f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 10pt;
    }
    pre {
      background-color: #1a202c;
      color: #e2e8f0;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.4;
      page-break-inside: avoid;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      color: #e2e8f0;
    }
    hr {
      border: none;
      border-top: 2px solid #e2e8f0;
      margin: 30px 0;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 25px;
    }
    li {
      margin: 5px 0;
    }
    strong {
      color: #2d3748;
    }
    blockquote {
      border-left: 4px solid #4299e1;
      margin: 15px 0;
      padding: 10px 20px;
      background-color: #ebf8ff;
      color: #2c5282;
    }
    .page-break {
      page-break-before: always;
    }
    @media print {
      body {
        padding: 0;
      }
      h2 {
        page-break-before: auto;
      }
      pre, table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
`;

  // Write temporary HTML file
  const tempHtmlFile = path.join(__dirname, 'temp-spec.html');
  fs.writeFileSync(tempHtmlFile, fullHtml);

  // Launch browser and generate PDF
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load the HTML file
  await page.goto(`file:///${tempHtmlFile.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle'
  });

  // Wait for content to render
  await page.waitForTimeout(1000);

  // Generate PDF
  await page.pdf({
    path: OUTPUT_FILE,
    format: 'A4',
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 9px; color: #666; width: 100%; text-align: center; padding: 5px 0;">
        MES Production Confirmation POC - Specification
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 9px; color: #666; width: 100%; text-align: center; padding: 5px 0;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span> | BLUEMINGO TECH PRIVATE LIMITED
      </div>
    `
  });

  await browser.close();

  // Clean up temp file
  fs.unlinkSync(tempHtmlFile);

  console.log('===========================================');
  console.log('PDF generated successfully!');
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('===========================================');

  // Get file size
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`File size: ${Math.round(stats.size / 1024)} KB`);
}

generatePDF().catch(console.error);
