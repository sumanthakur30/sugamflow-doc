/**
 * Renders docs/diagrams/*.mmd to PNG (requires @mermaid-js/mermaid-cli).
 * Run: node render-diagrams.cjs
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const diagramsDir = path.join(__dirname, "diagrams");
const files = fs.readdirSync(diagramsDir).filter((f) => f.endsWith(".mmd"));

for (const f of files) {
  const input = path.join(diagramsDir, f);
  const output = path.join(diagramsDir, f.replace(/\.mmd$/i, ".png"));
  const cmd = `npx mmdc -i "${input}" -o "${output}" -b transparent -w 1200`;
  console.log(cmd);
  execSync(cmd, { stdio: "inherit", cwd: __dirname });
}
