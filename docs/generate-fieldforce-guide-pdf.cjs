/**
 * Generates PDFs for Field Force salesman/promoter guides.
 *
 * Prerequisites:
 *   cd docs && npm install
 *   npm run diagrams          (optional; embeds PNG flow charts)
 *   npm run pdf:fieldforce
 *
 * Outputs:
 *   fieldforce-guides/FIELDFORCE-Salesman-Promoter-Guide-English.pdf
 *   fieldforce-guides/FIELDFORCE-Salesman-Promoter-Guide-Hindi.pdf
 *   fieldforce-guides/FIELDFORCE-Daily-Checklist-English.pdf
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { marked } = require("marked");
const puppeteer = require("puppeteer");

const docsDir = __dirname;
const diagramsDir = path.join(docsDir, "diagrams");
const guidesDir = path.join(docsDir, "fieldforce-guides");

const BUILDS = [
  {
    input: path.join(docsDir, "FIELDFORCE-SALESMAN-PROMOTER-GUIDE.md"),
    output: path.join(guidesDir, "FIELDFORCE-Salesman-Promoter-Guide-English.pdf"),
    css: path.join(guidesDir, "pdf-print-english.css"),
    title: "SugamFlow Field Force — Salesman/Promoter Guide",
    lang: "en",
  },
  {
    input: path.join(docsDir, "FIELDFORCE-SALESMAN-PROMOTER-GUIDE-Hindi.md"),
    output: path.join(guidesDir, "FIELDFORCE-Salesman-Promoter-Guide-Hindi.pdf"),
    css: path.join(guidesDir, "pdf-print-hindi.css"),
    title: "SugamFlow फ़ील्ड फ़ोर्स — सेल्समैन/प्रमोटर गाइड",
    lang: "hi",
  },
  {
    input: path.join(docsDir, "FIELDFORCE-DAILY-CHECKLIST.md"),
    output: path.join(guidesDir, "FIELDFORCE-Daily-Checklist-English.pdf"),
    css: path.join(guidesDir, "pdf-print-english.css"),
    title: "SugamFlow Field Force — Daily Checklist (Ravi's Guide)",
    lang: "en",
  },
];

function preprocessMarkdown(md) {
  let out = md;
  out = out.replace(/```mermaid\n([\s\S]*?)```/g, (_, body) => {
    const trimmed = body.trim();
    const png =
      trimmed.startsWith("sequenceDiagram") ?
        "05-fieldforce-conversion-seq.png" :
        "04-fieldforce-lead-flow.png";
    const abs = path.join(diagramsDir, png);
    if (!fs.existsSync(abs)) {
      return `\n\n> _Diagram: run \`npm run diagrams\` in docs/ to generate ${png}_\n\n`;
    }
    const src = pathToFileURL(abs).href;
    return `\n<div class="diagram"><img src="${src}" alt="Flow diagram" /></div>\n`;
  });
  return out;
}

function buildHtml({ bodyHtml, css, title, lang }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  <p class="doc-meta">SugamFlow · Field Force · ${new Date().toISOString().slice(0, 10)}</p>
  ${bodyHtml}
</body>
</html>`;
}

async function mdToPdf(build) {
  if (!fs.existsSync(build.input)) {
    throw new Error(`Missing input: ${build.input}`);
  }
  const md = preprocessMarkdown(fs.readFileSync(build.input, "utf8"));
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
