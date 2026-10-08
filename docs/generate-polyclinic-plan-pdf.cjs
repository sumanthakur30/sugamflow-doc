/**
 * Generates docs/Polyclinic-Management-Implementation-Plan-SugamFlow.pdf
 *
 * Prerequisites:
 *   cd docs && npm install
 *   npm run diagrams:polyclinic   (optional; embeds PNG flow charts)
 *   npm run pdf:polyclinic
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { marked } = require("marked");
const puppeteer = require("puppeteer");

const docsDir = __dirname;
const diagramsDir = path.join(docsDir, "diagrams");
const input = path.join(docsDir, "POLYCLINIC-MANAGEMENT-IMPLEMENTATION-PLAN.md");
const output = path.join(docsDir, "Polyclinic-Management-Implementation-Plan-SugamFlow.pdf");
const css = path.join(docsDir, "polyclinic-guides", "pdf-print-english.css");

function preprocessMarkdown(md) {
  return md.replace(/!\[([^\]]*)\]\(diagrams\/([^)]+)\)/g, (_, alt, file) => {
    const png = file.endsWith(".png") ? file : file.replace(/\.mmd$/i, ".png");
    const abs = path.join(diagramsDir, png);
    if (!fs.existsSync(abs)) {
      return `\n\n> _Diagram missing: ${png}. Run \`npm run diagrams:polyclinic\` in docs/_\n\n`;
    }
    const src = pathToFileURL(abs).href;
    return `\n<div class="diagram"><img src="${src}" alt="${alt}" /><p class="diagram-caption">${alt}</p></div>\n`;
  });
}

function buildHtml({ bodyHtml, cssText, title }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${cssText}</style>
</head>
<body>
  <p class="doc-meta">SugamFlow ERP · Polyclinic Management Module · ${new Date().toISOString().slice(0, 10)} · Document v1.0</p>
  ${bodyHtml}
</body>
</html>`;
}

async function mdToPdf() {
  if (!fs.existsSync(input)) {
    throw new Error(`Missing input: ${input}`);
  }
  const md = preprocessMarkdown(fs.readFileSync(input, "utf8"));
  const bodyHtml = marked.parse(md, { gfm: true, breaks: false });
  const cssText = fs.readFileSync(css, "utf8");
  const title = "SugamFlow Polyclinic Management — Technical Implementation Plan";
  const html = buildHtml({ bodyHtml, cssText, title });

  const tmpHtml = path.join(docsDir, ".tmp-polyclinic-plan.html");
  fs.writeFileSync(tmpHtml, html, "utf8");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: "networkidle0", timeout: 120000 });
    await page.pdf({
      path: output,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale: 1,
      margin: { top: "14mm", right: "16mm", bottom: "14mm", left: "16mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate:
        '<span style="font-size:8px;width:100%;text-align:center;color:#666;padding:0 16mm;">SugamFlow Polyclinic Implementation Plan · Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>',
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

mdToPdf().catch((err) => {
  console.error(err);
  process.exit(1);
});
