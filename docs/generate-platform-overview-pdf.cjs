/**
 * Generates:
 *   docs/SugamFlow-Business-Types.pdf
 *   docs/SugamFlow-Platform-Architecture.pdf
 *
 * Usage:
 *   cd docs && npm install && npm run pdf:platform
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { marked } = require("marked");
const puppeteer = require("puppeteer");

const docsDir = __dirname;
const cssPath = path.join(docsDir, "polyclinic-guides", "pdf-print-english.css");

/** Puppeteer header/footer — pageNumber/totalPages only work inside these templates. */
function pdfHeaderFooter(docLabel) {
  const pageNum =
    'Page <span class="pageNumber"></span> of <span class="totalPages"></span>';
  const header = `<div style="width:100%;box-sizing:border-box;font-family:Segoe UI,system-ui,sans-serif;font-size:9px;color:#5c6b7a;padding:4px 16mm 6px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #c5ccd6;">
    <span style="font-weight:600;color:#0d3b8e;">SugamFlow ERP</span>
    <span>${pageNum}</span>
  </div>`;
  const footer = `<div style="width:100%;box-sizing:border-box;font-family:Segoe UI,system-ui,sans-serif;font-size:9px;color:#5c6b7a;padding:6px 16mm 4px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #c5ccd6;">
    <span>${docLabel}</span>
    <span>${pageNum}</span>
  </div>`;
  return { header, footer };
}

const PDF_MARGINS = { top: "20mm", right: "16mm", bottom: "20mm", left: "16mm" };

const documents = [
  {
    input: path.join(docsDir, "SUGAMFLOW-BUSINESS-TYPES.md"),
    output: path.join(docsDir, "SugamFlow-Business-Types.pdf"),
    title: "SugamFlow — Supported Business Types",
    footer: "SugamFlow Business Types",
  },
  {
    input: path.join(docsDir, "SUGAMFLOW-PLATFORM-ARCHITECTURE.md"),
    output: path.join(docsDir, "SugamFlow-Platform-Architecture.pdf"),
    title: "SugamFlow — Platform Architecture",
    footer: "SugamFlow Platform Architecture",
  },
];

function buildHtml({ bodyHtml, cssText, title }) {
  const date = new Date().toISOString().slice(0, 10);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${cssText}</style>
</head>
<body>
  <p class="doc-meta">SugamFlow ERP · ${title} · ${date} · Document v1.0</p>
  ${bodyHtml}
</body>
</html>`;
}

async function mdToPdf({ input, output, title, footer }, cssText) {
  if (!fs.existsSync(input)) {
    throw new Error(`Missing input: ${input}`);
  }
  const md = fs.readFileSync(input, "utf8");
  const bodyHtml = marked.parse(md, { gfm: true, breaks: false });
  const html = buildHtml({ bodyHtml, cssText, title });
  const tmpHtml = path.join(docsDir, `.tmp-${path.basename(output, ".pdf")}.html`);
  fs.writeFileSync(tmpHtml, html, "utf8");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: "networkidle0", timeout: 120000 });
    const { header, footer: footerHtml } = pdfHeaderFooter(footer);
    await page.pdf({
      path: output,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      scale: 1,
      margin: PDF_MARGINS,
      displayHeaderFooter: true,
      headerTemplate: header,
      footerTemplate: footerHtml,
    });
    console.log("Wrote", output);
  } finally {
    await browser.close();
    try {
      fs.unlinkSync(tmpHtml);
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  const cssText = fs.readFileSync(cssPath, "utf8");
  for (const doc of documents) {
    await mdToPdf(doc, cssText);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
