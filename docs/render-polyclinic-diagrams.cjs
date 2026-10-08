/**
 * Renders polyclinic diagram *.mmd files to PNG.
 * Run: npm run diagrams:polyclinic
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const diagramsDir = path.join(__dirname, "diagrams");
const files = fs
  .readdirSync(diagramsDir)
  .filter((f) => f.startsWith("0") && f.includes("polyclinic") && f.endsWith(".mmd"));

if (files.length === 0) {
  console.warn("No polyclinic .mmd files found in docs/diagrams/");
  process.exit(0);
}

for (const f of files) {
  const input = path.join(diagramsDir, f);
  const output = path.join(diagramsDir, f.replace(/\.mmd$/i, ".png"));
  const cmd = `npx mmdc -i "${input}" -o "${output}" -b white -w 1400 -H 900`;
  console.log(cmd);
  execSync(cmd, { stdio: "inherit", cwd: __dirname });
}

console.log("Polyclinic diagrams rendered.");
