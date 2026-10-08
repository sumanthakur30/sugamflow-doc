/**
 * Generates PDF for PO / Supplier testing walkthrough.
 *
 * Prerequisites:
 *   cd docs && npm install
 *   npm run pdf:procurement
 *
 * Output:
 *   procurement-guides/PO-Supplier-Testing-Walkthrough-GEN-DEMO-01.pdf
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { marked } = require("marked");
const puppeteer = require("puppeteer");

const docsDir = __dirname;
const guidesDir = path.join(docsDir, "procurement-guides");

const BUILDS = [
  {
    input: path.join(docsDir, "PO-SUPPLIER-TESTING-STEPS-PDF.md"),
    output: path.join(guidesDir, "PO-Supplier-Testing-Walkthrough-GEN-DEMO-01.pdf"),
    css: path.join(guidesDir, "pdf-print-english.css"),
    title: "SugamFlow — PO & Supplier Testing Walkthrough (GEN-DEMO-01)",
    lang: "en",
  },
];

function buildHtml({ bodyHtml, css, title, lang }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  <p class="doc-meta">SugamFlow · Procurement &amp; Purchase Orders · ${new Date().toISOString().slice(0, 10)}</p>
  ${bodyHtml}
</body>
</html>`;
}

async function mdToPdf(build) {
  if (!fs.existsSync(build.input)) {
    throw new Error(`Missing input: ${build.input}`);
  }
  const md = fs.readFileSync(build.input, "utf8");
  const bodyHtml = marked.parse(md, { gfm: true, breaks: false });
  const css = fs.readFileSync(build.css, "utf8");
  const html = buildHtml({ bodyHtml, css, title: build.title, lang: build.lang });

  fs.mkdirSync(guidesDir, { recursive: true });
  const tmpHtml = path.join(guidesDir, `.tmp-${path.basename(build.output, ".pdf")}.html`);
  fs.writeFileSync(tmpHtml, html, "utf8");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: "networkidle0", timeout: 120000 });
    await page.pdf({
      path: build.output,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale: 1,
      margin: { top: "14mm", right: "16mm", bottom: "14mm", left: "16mm" },
    });
    console.log("Wrote", build.output);
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
  for (const build of BUILDS) {
    await mdToPdf(build);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
