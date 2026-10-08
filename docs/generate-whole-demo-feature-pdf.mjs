/**
 * Generate WHOLE-DEMO-01 feature catalogue + SugamFlow vs Marg Distri comparison PDF.
 * Usage: node docs/generate-whole-demo-feature-pdf.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { jsPDF } = require(path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'shop-management-ui',
  'node_modules',
  'jspdf'
));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'WHOLE-DEMO-01-Features-vs-Marg.pdf');

/** jsPDF default fonts only support WinAnsi — strip fancy Unicode that renders as garbage. */
function ascii(text) {
  return String(text ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-') // hyphens/dashes
    .replace(/[\u2190-\u21FF]/g, '->') // arrows
    .replace(/→/g, '->')
    .replace(/[•·∙]/g, '-')
    .replace(/[…]/g, '...')
    .replace(/[‘’‛‹›]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[✓✔]/g, 'Yes')
    .replace(/[✗✘×]/g, 'No')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
const pageW = doc.internal.pageSize.getWidth();
const pageH = doc.internal.pageSize.getHeight();
const margin = 14;
const maxW = pageW - margin * 2;
let y = margin;

function ensureSpace(need = 12) {
  if (y + need > pageH - 16) {
    doc.addPage();
    y = margin;
    footer();
  }
}

function footer() {
  const page = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text(
    ascii(
      `SugamFlow - WHOLE-DEMO-01 - Features vs Marg Distri - ${new Date().toISOString().slice(0, 10)} - p.${page}`
    ),
    margin,
    pageH - 8
  );
  doc.setTextColor(20);
}

function h1(text) {
  ensureSpace(16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text(ascii(text), margin, y);
  y += 8;
  doc.setDrawColor(40);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + maxW, y);
  y += 6;
}

function h2(text) {
  ensureSpace(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(ascii(text), margin, y);
  y += 6;
}

function para(text) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(ascii(text), maxW);
  for (const line of lines) {
    ensureSpace(5);
    doc.text(line, margin, y);
    y += 4.5;
  }
  y += 2;
}

function bullet(text) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(ascii(`-  ${text}`), maxW);
  for (const line of lines) {
    ensureSpace(5);
    doc.text(line, margin, y);
    y += 4.5;
  }
}

function table(headers, rows, colWeights) {
  const sum = colWeights.reduce((a, b) => a + b, 0);
  const widths = colWeights.map((w) => (w / sum) * maxW);
  const rowH = 6;
  const drawHeader = () => {
    ensureSpace(rowH + 2);
    doc.setFillColor(232, 232, 232);
    doc.rect(margin, y - 4, maxW, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    let x = margin + 1;
    headers.forEach((h, i) => {
      doc.text(ascii(h), x, y);
      x += widths[i];
    });
    y += rowH;
  };
  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rows.forEach((row, ri) => {
    const cellLines = row.map((cell, i) => doc.splitTextToSize(ascii(cell), widths[i] - 2));
    const linesNeeded = Math.max(...cellLines.map((l) => l.length), 1);
    const h = Math.max(rowH, linesNeeded * 3.6 + 2);
    if (y + h > pageH - 16) {
      doc.addPage();
      y = margin;
      footer();
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    if (ri % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y - 4, maxW, h, 'F');
    }
    let x = margin + 1;
    cellLines.forEach((lines, i) => {
      lines.forEach((line, li) => {
        doc.text(line, x, y + li * 3.6);
      });
      x += widths[i];
    });
    y += h;
  });
  y += 4;
}

// ---- Cover ----
footer();
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.text(ascii('SugamFlow Wholesale'), margin, y);
y += 9;
doc.setFontSize(14);
doc.text(ascii('WHOLE-DEMO-01 - Feature Catalogue & Sales Brief'), margin, y);
y += 7;
doc.setFont('helvetica', 'normal');
doc.setFontSize(11);
doc.text(ascii('Comparison vs Marg Distri (typical medical / pharma distribution ERP)'), margin, y);
y += 10;
para(
  'This document lists features available on the WHOLE-DEMO-01 demo depot (tenant 112), compares SugamFlow Wholesale with Marg Distri-class desktop ERP, and highlights SugamFlow selling points for medical distributors. Competitor columns describe typical Marg Distri / Marg Pharma posture by edition — not a single SKU verbatim.'
);
para(
  `Login (demo): Outlet WHOLE-DEMO-01 · Username demo / demo_WHOLE-DEMO-01 · Password Demo@2026 · URL https://sugamflow.com/wholesale · Generated ${new Date().toLocaleString('en-IN')}.`
);

h1('1. Why choose SugamFlow (sales highlights)');
para(
  'Lead with outcomes owners care about: run the depot from anywhere, collect faster, stay GST-ready, and keep wholesale + retail options under one cloud stack — without a LAN-only Marg box as the single source of truth.'
);
bullet(
  'Cloud command centre — Dayboard KPIs (sale, purchase, collection, credit) from phone or laptop; owner need not sit at the godown PC.'
);
bullet(
  'Medical B2B path that closes — SO → Confirm → Challan → Dispatch → FEFO Invoice → A4/PDF/WhatsApp GST print with IRN QR when live GSP is on.'
);
bullet(
  'Credit & cash discipline in-product — credit control board, temp limits, interest postings, collection desk (cheque/UPI), AR ageing — not a separate add-on spreadsheet.'
);
bullet(
  'GST go-live path — GSTR summary/export, GSTR-2B match, ITC eligibility ledger, live e-invoice / e-way via real GSP (mock for demo; http provider for production).'
);
bullet(
  'Field force ready — delivery run + POD signature/photo, beat day plan, GPS check-in / coverage, offline DRAFT wholesale SO queue for low signal beats.'
);
bullet(
  'Warehouse clarity — batch/expiry FEFO, rack/bin, stock intelligence (ABC/expiry), Code128 barcode labels (shelf/pack/batch).'
);
bullet(
  'One SaaS platform — same tenant can add retail pharmacy or clinic packs later; continuous cloud deploy vs on-prem install + USB training cycles.'
);
bullet(
  'Modern operator aids — Ctrl+K search, favourites/recent, F-key dayboard shortcuts, purchase bill hub — faster onboarding for staff who are not Marg veterans.'
);

h2('1.1 One-line pitch (use in calls)');
para(
  '"SugamFlow is cloud medical wholesale ERP: bill like a distributor, collect and control credit like finance, and go live on e-invoice/e-way — without locking the business to a single desktop PC."'
);

h1('2. Demo pack contents');
bullet('Shop: Wholesale Demo Depot (WHOLE-DEMO-01), GSTIN seeded, wholesale capability pack');
bullet('Catalog: 8 medical SKUs WHO-PH-001…008 (HSN + 12% GST)');
bullet('Buyers: Buyer 001…008 / chemist accounts with credit days');
bullet('Supplier: KM Medicos (Demo) for PO / GRN');
bullet('Ledger COA: Cash / Bank / Debtors / Creditors (+ interest income for credit interest demos)');
bullet('Opening stock batches with expiry for FEFO allocation');
bullet('Sample flow: Sales Order → Confirm → Challan → Dispatch → POD → Tax Invoice → IRN/e-way');

h1('3. WHOLE-DEMO-01 feature catalogue (live)');

h2('3.1 Wholesale billing & dispatch');
table(
  ['Feature', 'What you can demo'],
  [
    ['Dayboard / owner command centre', 'Today sale, purchase, collection, KPIs, F-key shortcuts'],
    ['Sale bill (SO workspace)', 'Buyer search, barcode scan, schemes, credit check, Create SO'],
    ['SO lifecycle', 'DRAFT → Confirm → Challan → Dispatch → Invoice'],
    ['Invoice (FEFO)', 'One-click challan + FEFO batch allocate + tax invoice'],
    ['GST tax invoice print', 'A4 / thermal / PDF / WhatsApp; IRN + signed QR when generated'],
    ['Generate IRN from sale bill', 'Compliance from wholesale workspace (mock or live GSP)'],
    ['Bill desk / estimate', 'Estimate to SO hand-off'],
    ['Delivery run / POD', 'Tablet run sheet, signature/photo POD'],
    ['Beat day plan + GPS', 'Route → buyers → Create SO; visit check-in & coverage'],
    ['Offline wholesale SO', 'DRAFT SO queue on device → sync when online'],
    ['Depot / MR salesmen', 'Salesman master + monthly targets'],
    ['Price categories & rate contracts', 'Buyer category PTR + party-product overrides'],
    ['Trade schemes + claims', 'Party/price-category scopes, evaluate, claim register'],
    ['Bulk import', 'Wholesale master import helpers'],
  ],
  [1.1, 1.6]
);

h2('3.2 Purchase & inventory');
table(
  ['Feature', 'What you can demo'],
  [
    ['Purchase bill hub', 'Entry point to PO receive / Direct GRN / AP (one distributor screen)'],
    ['Purchase PO / GRN / AP', 'PO → receive → AP invoice'],
    ['Procurement / auto PO', 'Low-stock driven replenishment'],
    ['Current stock', 'Batch / expiry / godown stock'],
    ['Stock intelligence', 'ABC / XYZ / FSN + demand / expiry hints'],
    ['Near expiry / ageing / margin', 'Batch risk and margin reports'],
    ['Rack / bin + transfers', 'Locations and warehouse transfers'],
    ['Barcode labels (Code128)', 'Shelf / pack / batch templates — scannable labels'],
  ],
  [1.1, 1.6]
);

h2('3.3 Finance, credit & GST');
table(
  ['Feature', 'What you can demo'],
  [
    ['Party ledger / collections', 'Receipts against buyer dues'],
    ['Collection desk', 'Cheque / UPI / deposit queue'],
    ['Credit control', 'Policy, overdue board, overrides, temp limits'],
    ['Credit interest', 'Interest post → ledger (Interest Income)'],
    ['AR / AP ageing', 'Receivable and payable buckets'],
    ['Cash / bank book + GL', 'CoA, vouchers, trial'],
    ['Final accounts', 'P&L / balance sheet views'],
    ['Sales analysis / MIS', 'Item / Company / HSN / Route / Area / Salesman; compare + CSV + drill'],
    ['Sales returns / CN', 'Trade returns with GST'],
    ['GSTR summary', 'GSTR-1 / 3B style period totals + export'],
    ['GSTR-2B match + ITC', 'Upload match, eligibility ledger, accept/dispute, CA export'],
    ['E-invoice / e-way (live path)', 'IRN, cancel, e-way, Part-B, bulk cancel/retry; GSP http provider'],
  ],
  [1.1, 1.6]
);

h2('3.4 Platform / ops');
table(
  ['Feature', 'What you can demo'],
  [
    ['Cloud web ERP', 'Browser access (desktop + responsive) — sugamflow.com'],
    ['Multi-branch scoping', 'Branch / godown headers'],
    ['Staff permissions', 'Role / permission packs'],
    ['Universal search (Ctrl+K)', 'Invoice / GSTIN / batch / HSN / barcode'],
    ['Favourites / recent / Help', 'Operator productivity + shortcut sheet'],
    ['Business alerts', 'Rules for stock / expiry / credit'],
    ['IP allowlist (optional)', 'Shop access policy + gateway filter'],
    ['Report centre', 'Catalogue of sales / stock / GST reports'],
    ['Audit trail', 'Wholesale transaction audit events'],
  ],
  [1.1, 1.6]
);

h1('4. SugamFlow vs Marg Distri — gap matrix (updated)');
para(
  'Legend: Available = shipped on WHOLE-DEMO-01 / wholesale pack; Partial = usable with limits; Desktop-strong = typical Marg strength; Lead = SugamFlow clearer advantage for most cloud buyers.'
);

table(
  ['Capability', 'SugamFlow WHOLE-DEMO-01', 'Marg Distri (typical)', 'Sales note'],
  [
    [
      'Deployment',
      'Lead — cloud SaaS (multi-service)',
      'Desktop / LAN-centric',
      'Owner access from anywhere; no PC as single failure point'
    ],
    [
      'Medical B2B billing',
      'Available (SO→Invoice FEFO)',
      'Available (very mature)',
      'Parity on core path; Marg wins pure keyboard veterans'
    ],
    [
      'Batch / FEFO / expiry',
      'Available',
      'Available (mature)',
      'Demo FEFO on invoice — must-show'
    ],
    [
      'Buyer credit & dues',
      'Available + control + temp limit + interest',
      'Available (deep)',
      'Sell credit discipline as built-in, not Excel'
    ],
    [
      'Schemes / free qty / claims',
      'Available (scopes + claim register)',
      'Available (deeper by edition)',
      'Enough for most depots; Marg wins exotic company schemes'
    ],
    [
      'Party rates / categories',
      'Available',
      'Available',
      'Parity'
    ],
    [
      'Challan + POD',
      'Lead — web + tablet signature/photo',
      'Available (often desktop)',
      'Field POD is a clear differentiator'
    ],
    [
      'Purchase PO / GRN / AP',
      'Available (+ purchase bill hub)',
      'Available (deep voucher culture)',
      'Hub helps first-time users; deeper one-screen bill still roadmap'
    ],
    [
      'Multi-godown',
      'Available (branches)',
      'Available',
      'Parity'
    ],
    [
      'GST B2B + GSTR export',
      'Available',
      'Available',
      'Parity for period returns'
    ],
    [
      'GSTR-2B / ITC recon',
      'Available (match + ITC ledger + CA export)',
      'Desktop-strong / CA tooling',
      'Closing the old "thin" gap; still iterate with CA feedback'
    ],
    [
      'E-invoice / e-way',
      'Available (live GSP http + Part-B + bulk ops)',
      'Available (edition / GSP dependent)',
      'Hard production blocker — SugamFlow has go-live path'
    ],
    [
      'Sales analysis / MIS',
      'Available (dims + compare + CSV + drill)',
      'Available (rich MIS)',
      'Strong enough for owner reviews'
    ],
    [
      'Dayboard / KPIs',
      'Lead — web command centre',
      'Dashboards vary by edition',
      'Open every demo on Dayboard'
    ],
    [
      'Collection desk',
      'Lead — in-product queue',
      'Partial / add-on patterns',
      'Highlight vs "accounts later"'
    ],
    [
      'Mobile / tablet POD',
      'Lead',
      'Partial (apps vary)',
      'Show delivery run on tablet'
    ],
    [
      'Offline / beat booking',
      'Partial (offline SO queue + GPS visits)',
      'Desktop-strong offline',
      'Honest: Marg still stronger offline resilience'
    ],
    [
      'Salesman beat / route',
      'Available (beat day plan + GPS coverage)',
      'Desktop-strong culture',
      'Much stronger than prior "route dims only"'
    ],
    [
      'Barcode label printing',
      'Available (Code128 shelf/pack/batch)',
      'Available',
      'Closed prior partial gap'
    ],
    [
      'Same tenant retail+clinic',
      'Lead — multi-pack SaaS',
      'Usually separate products',
      'Upsell path for groups with retail counters'
    ],
    [
      'Implementation',
      'Lead — SaaS continuous deploy',
      'On-prem install + training',
      'Faster go-live; lower IT burden'
    ],
  ],
  [1.0, 1.35, 1.15, 1.15]
);

h1('5. Where SugamFlow leads (use these in proposals)');
bullet('Anywhere access — dayboard, AR, stock, and GST screens without VPN to a shop PC.');
bullet('Collection + credit control + collection desk in the same product as billing.');
bullet('Tablet POD and beat GPS — delivery proof and field coverage without a separate app stack.');
bullet('Live e-invoice / e-way architecture (GSP adapter) — production-ready path medical distributors demand.');
bullet('GSTR-2B match and ITC workflow aimed at CA hand-off, not only GSTR summary.');
bullet('Multi-business packs under one tenant (wholesale today; pharmacy/clinic when needed).');
bullet('SaaS updates — features (schemes, MIS, compliance) ship continuously without CD installs.');

h1('6. Remaining honest gaps vs Marg (do not oversell)');
bullet('Keyboard muscle memory — Marg veterans may still type faster on pure desktop billing.');
bullet('Ultra-deep company scheme / claim settlement patterns on some Marg editions.');
bullet('Fully offline desktop resilience when internet is down for hours (SugamFlow: SO queue + sync; not full LAN ERP).');
bullet('One-screen purchase bill voucher depth — hub + GRN/AP exist; Marg-style single voucher still improving.');
bullet('Local CA "I already know Marg screens" familiarity — train with our demo script, not feature denial.');

h1('7. Objection handling (sales)');
table(
  ['Buyer says', 'SugamFlow reply'],
  [
    [
      'We already know Marg',
      'Keep Marg for nostalgia if needed — SugamFlow wins on owner visibility, POD, cloud, and GST live path. Staff learn Dayboard + Sale bill in one session.'
    ],
    [
      'Will e-invoice work?',
      'Yes — live GSP http provider; demo uses mock/fake adapter. Production needs your GSP credentials (ClearTax/IRIS/etc.).'
    ],
    [
      'Internet fails on beat',
      'Offline DRAFT wholesale SO syncs when back online; GPS check-in works for coverage. Not a full offline Marg PC — say so honestly.'
    ],
    [
      'Our CA wants 2B',
      'Show GSTR-2B match + ITC accept/dispute + CA export on WHOLE-DEMO-01.'
    ],
    [
      'Cost / IT headache',
      'Browser SaaS — no LAN server, no USB update cycle; multi-branch from day one.'
    ],
  ],
  [1.0, 2.0]
);

h1('8. Suggested client demo script (WHOLE-DEMO-01)');
bullet('1) Login → Dayboard KPIs (owner story: see money without sitting at godown)');
bullet('2) Sale bill → Buyer 005 → WHO-PH-001 → Create SO → Confirm → Invoice (FEFO)');
bullet('3) Print A4 GST invoice → Generate IRN → reprint with QR');
bullet('4) Delivery run / POD signature (tablet)');
bullet('5) Beat day plan → GPS check-in → Create SO from beat');
bullet('6) Purchase bill hub → KM Medicos PO/GRN');
bullet('7) Credit control + collection desk + AR ageing');
bullet('8) Sales analysis compare/CSV + GSTR summary + GSTR-2B match');
bullet('9) Stock intelligence (ABC / expiry) + Code128 barcode label');
bullet('10) Close with cloud + multi-pack + SaaS update story');

h1('9. Disclaimer');
para(
  'Marg, Marg Distri, and Marg Pharma are third-party products. Feature cells reflect category norms observed in Indian wholesale distribution software and SugamFlow WHOLE-DEMO-01 capabilities as of this document date. Exact Marg features depend on edition, modules purchased, and version. Validate compliance (GST, Drugs & Cosmetics, e-invoice) and obtain real GSP credentials before contractual go-live commitments.'
);

y += 4;
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text(ascii('SugamFlow ERP - Wholesale Demo (WHOLE-DEMO-01) - Confidential client / sales material'), margin, y);

doc.save(outPath);
console.log('Wrote', outPath);
