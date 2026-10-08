# Field Force guide PDFs

| Output | Source |
|--------|--------|
| `FIELDFORCE-Salesman-Promoter-Guide-English.pdf` | `../FIELDFORCE-SALESMAN-PROMOTER-GUIDE.md` |
| `FIELDFORCE-Salesman-Promoter-Guide-Hindi.pdf` | `../FIELDFORCE-SALESMAN-PROMOTER-GUIDE-Hindi.md` |
| `FIELDFORCE-Daily-Checklist-English.pdf` | `../FIELDFORCE-DAILY-CHECKLIST.md` |

## Generate

```bash
cd docs
npm install
npm run pdf:fieldforce:all
```

`pdf:fieldforce:all` renders Mermaid diagrams under `docs/diagrams/` then builds both PDFs.

PDF-only (diagrams already rendered):

```bash
npm run pdf:fieldforce
```

## Print from browser (standard A4)

**Do not use Ctrl+P on the full app page** — the sidebar/layout can shrink content to a corner.

| Method | How |
|--------|-----|
| **In app (best)** | Field Force Workspace → **Print quick reference** or **Print lead** |
| **Standalone HTML** | Open `print-quick-reference.html` in Chrome/Edge → Print. Scale **100%**, margins **Default** |
| **PDF guide** | Open the generated `.pdf` → Print. Scale **100%** (not “Fit to printable area”) |
