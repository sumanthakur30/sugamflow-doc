/**
 * Writes all business-type client brief markdown files from config.
 *
 * Usage: node client-briefs/generate-business-type-briefs.cjs
 */
const fs = require("fs");
const path = require("path");
const { getAllBriefs, renderMarkdown } = require("./business-type-brief-config.cjs");

const briefsDir = __dirname;

function main() {
  const briefs = getAllBriefs();
  for (const brief of briefs) {
    const filename = `SugamFlow-${brief.code.replace(/_/g, "-")}-Client-Brief.md`;
    const outPath = path.join(briefsDir, filename);
    fs.writeFileSync(outPath, renderMarkdown(brief), "utf8");
    console.log("Wrote", outPath);
  }
  console.log(`Done — ${briefs.length} briefs.`);
}

main();
