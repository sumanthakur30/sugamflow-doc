/**
 * Generates client-facing business-type brief PDFs (one per business type).
 *
 * Usage:
 *   cd docs && npm run briefs:generate && npm run pdf:business-briefs
 *
 * Output: docs/client-briefs/SugamFlow-<TYPE>-Client-Brief.pdf (22 files)
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { marked } = require("marked");
const puppeteer = require("puppeteer");
const { getBriefFilenames } = require("./client-briefs/business-type-brief-config.cjs");

const docsDir = __dirname;
const briefsDir = path.join(docsDir, "client-briefs");
const cssPath = path.join(docsDir, "polyclinic-guides", "pdf-print-english.css");

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
  <p class="doc-meta">SugamFlow ERP · Client brief · ${date} · Document v1.0</p>
  ${bodyHtml}
</body>
</html>`;
}

async function mdToPdf(build, cssText, browser) {
  const input = path.join(briefsDir, build.md);
  const output = path.join(briefsDir, build.pdf);
  if (!fs.existsSync(input)) {
    throw new Error(`Missing input: ${input} — run npm run briefs:generate first`);
  }
  const md = fs.readFileSync(input, "utf8");
  const bodyHtml = marked.parse(md, { gfm: true, breaks: false });
  const html = buildHtml({ bodyHtml, cssText, title: build.title });
  const tmpHtml = path.join(briefsDir, `.tmp-${build.code}.html`);
  fs.writeFileSync(tmpHtml, html, "utf8");

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: "networkidle0", timeout: 120000 });
    const { header, footer } = pdfHeaderFooter(build.footer);
    await page.pdf({
      path: output,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      scale: 1,
      margin: PDF_MARGINS,
      displayHeaderFooter: true,
      headerTemplate: header,
      footerTemplate: footer,
    });
    await page.close();
    console.log("Wrote", output);
  } finally {
    try {
      fs.unlinkSync(tmpHtml);
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  const cssText = fs.readFileSync(cssPath, "utf8");
  const builds = getBriefFilenames();
  fs.mkdirSync(briefsDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    for (const build of builds) {
      await mdToPdf(build, cssText, browser);
    }
    console.log(`Done — ${builds.length} PDFs in ${briefsDir}`);
  } finally {
    try {
      await browser.close();
    } catch {
      /* Windows EPERM on Chrome temp profile cleanup — PDFs already written */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
