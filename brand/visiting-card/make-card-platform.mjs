import { readFileSync, writeFileSync, mkdirSync, createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const { Resvg } = require('@resvg/resvg-js');

const here = dirname(fileURLToPath(import.meta.url));
const logoPath = 'D:/sugamFlow/sugamflow-seowebsite/assets/branding/sugamflow-logo.png';
const logoB64 = readFileSync(logoPath).toString('base64');
const logoBuf = readFileSync(logoPath);
const logoW = logoBuf.readUInt32BE(16);
const logoH = logoBuf.readUInt32BE(20);

function vcardEscape(value) {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

const companyProfile = [
  'SugamFlow ERP Solutions Pvt. Ltd. Integrated ERP and CRM Solutions.',
  'One Platform. Every Business. Smarter Growth.',
  'ERP: inventory, billing, purchasing, sales, finance and GST.',
  'CRM: leads, pipeline, customer records, follow-ups and field sales.',
  'Industry: school ERP, hospital, clinic, retail, wholesale and pharmacy.',
  'Digital: cloud applications, APIs and business automation.',
].join('\n');

const vcard = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Thakur;Suman;;;',
  'FN:Suman Thakur',
  'ORG:SugamFlow ERP Solutions Pvt. Ltd.',
  'TITLE:Director & Founder',
  'TEL;TYPE=CELL:+918800706663',
  'EMAIL;TYPE=INTERNET:suman.thakur@sugamflow.com',
  'URL:https://sugamflow.com',
  'ADR;TYPE=WORK:;;F-836\\, Galaxy North Avenue 2\\, Gaur City 2;Greater Noida;Uttar Pradesh;201301;India',
  `NOTE:${vcardEscape(companyProfile)}`,
  'END:VCARD',
].join('\r\n');

const qrPayload = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Thakur;Suman;;;',
  'FN:Suman Thakur',
  'ORG:SugamFlow ERP Solutions Pvt. Ltd.',
  'TITLE:Director & Founder',
  'TEL;TYPE=CELL:+918800706663',
  'EMAIL:suman.thakur@sugamflow.com',
  'URL:https://sugamflow.com',
  'ADR;TYPE=WORK:;;F-836 Galaxy North Avenue 2;Greater Noida;UP;201301;India',
  'END:VCARD',
].join('\r\n');

const companyQrPayload = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Thakur;Suman;;;',
  'FN:Suman Thakur',
  'ORG:SugamFlow ERP Solutions Pvt. Ltd.',
  'TITLE:Director & Founder',
  'TEL;TYPE=CELL:+918800706663',
  'EMAIL:suman.thakur@sugamflow.com',
  'URL:https://sugamflow.com',
  'ADR;TYPE=WORK:;;F-836 Galaxy North Avenue 2;Greater Noida;UP;201301;India',
  `NOTE:${vcardEscape(companyProfile)}`,
  'END:VCARD',
].join('\r\n');

const qr = QRCode.create(qrPayload, { errorCorrectionLevel: 'M' });
const companyQr = QRCode.create(companyQrPayload, { errorCorrectionLevel: 'M' });
const n = qr.modules.size;
const quiet = 4;
const cells = n + quiet * 2;

function qrSvg(x, y, box) {
  const cell = box / cells;
  let out = `<rect x="${x}" y="${y}" width="${box}" height="${box}" rx="${box * 0.06}" fill="#ffffff"/>`;
  const ox = x + quiet * cell;
  const oy = y + quiet * cell;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        out += `<rect x="${(ox + c * cell).toFixed(2)}" y="${(oy + r * cell).toFixed(2)}" width="${(cell + 0.35).toFixed(2)}" height="${(cell + 0.35).toFixed(2)}" fill="#0c1624"/>`;
      }
    }
  }
  return out;
}

const drawW = 236;
const drawH = (drawW * logoH) / logoW;
const nameY = 26 + drawH + 32;
const green = '#0a7a5a';
const greenBright = '#14a36e';

function strokeIcon(x, y, body) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${green}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
}

function phoneIcon(x, y) {
  return strokeIcon(x, y, `<path d="M-5.2-6.2c.3-.9 1.3-1.3 2.1-.9l1 .6c.7.4.9 1.2.5 1.8l-.7 1.2a7 7 0 0 0 3.4 3.4l1.2-.7c.6-.4 1.4-.2 1.8.5l.6 1c.4.8 0 1.8-.9 2.1l-.8.3c-.9.3-1.8.1-2.6-.5A11.4 11.4 0 0 1-6.4-3.6c-.6-.8-.8-1.7-.4-2.6z"/>`);
}

function mailIcon(x, y) {
  return strokeIcon(x, y, `<rect x="-7" y="-5" width="14" height="10" rx="1.4"/><path d="M-6.4-4.2 L0 1.2 L6.4-4.2"/>`);
}

function globeIcon(x, y, color = green) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="0" cy="0" r="6.2"/><path d="M-6.2 0h12.4M0-6.2c1.8 1.7 2.7 4 2.7 6.2s-.9 4.5-2.7 6.2c-1.8-1.7-2.7-4-2.7-6.2s.9-4.5 2.7-6.2"/></g>`;
}

function pinIcon(x, y, color = green) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M0-7.2a4.3 4.3 0 0 0-4.3 4.3c0 3.3 4.3 8.4 4.3 8.4s4.3-5.1 4.3-8.4A4.3 4.3 0 0 0 0-7.2z"/><circle cx="0" cy="-2.9" r="1.45" fill="${color}" stroke="none"/></g>`;
}

const groups = [
  ['ERP', 'Inventory, billing, purchase, GST'],
  ['CRM', 'Leads, follow-up, field sales'],
  ['Industry', 'Retail, wholesale, clinic, hospital, school'],
  ['Digital', 'Cloud software and business automation'],
];

function groupBlock(index) {
  const y = 148 + index * 52;
  const [title, detail] = groups[index];
  return `<text x="40" y="${y}" font-family="Segoe UI" font-size="16" font-weight="700" fill="${greenBright}">${title}</text>
  <text x="40" y="${y + 20}" font-family="Segoe UI" font-size="14" fill="#e7eef4">${detail}</text>`;
}

const front = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500">
  <rect width="900" height="500" fill="#ffffff"/>
  <rect y="378" width="900" height="122" fill="#f3f5f4"/>
  <line x1="0" y1="378" x2="900" y2="378" stroke="${green}" stroke-width="2.5"/>
  <image href="data:image/png;base64,${logoB64}" x="44" y="26" width="${drawW}" height="${drawH}"/>
  <text x="48" y="${nameY}" font-family="Segoe UI" font-size="32" font-weight="700" fill="#0c1624">Suman Thakur</text>
  <text x="48" y="${nameY + 26}" font-family="Segoe UI" font-size="16" font-weight="600" fill="${green}">Director &amp; Founder</text>
  <text x="48" y="${nameY + 48}" font-family="Segoe UI" font-size="16" fill="#243044">SugamFlow ERP Solutions Pvt. Ltd.</text>
  <text x="48" y="${nameY + 74}" font-family="Segoe UI" font-size="15" font-weight="600" fill="${green}">Integrated ERP &amp; CRM Solutions</text>
  ${phoneIcon(62, nameY + 100)}
  <text x="84" y="${nameY + 106}" font-family="Segoe UI" font-size="16" fill="#0c1624">+91 88007 06663</text>
  ${mailIcon(62, nameY + 130)}
  <text x="84" y="${nameY + 136}" font-family="Segoe UI" font-size="15" fill="#243044">suman.thakur@sugamflow.com</text>
  ${globeIcon(62, nameY + 160)}
  <text x="84" y="${nameY + 166}" font-family="Segoe UI" font-size="15" font-weight="600" fill="${green}">sugamflow.com</text>
  ${pinIcon(58, 436)}
  <text x="80" y="424" font-family="Segoe UI" font-size="15" fill="#243044">F-836, Galaxy North Avenue 2, Gaur City 2,</text>
  <text x="80" y="448" font-family="Segoe UI" font-size="15" fill="#243044">Greater Noida, UP 201301</text>
</svg>`;

const back = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500">
  <rect width="900" height="500" fill="#0c1624"/>
  <rect width="10" height="500" fill="${green}"/>
  <text x="40" y="64" font-family="Segoe UI" font-size="26" font-weight="700">
    <tspan fill="#ffffff">One Platform. </tspan><tspan fill="${greenBright}">Every Business.</tspan>
  </text>
  <text x="40" y="98" font-family="Segoe UI" font-size="18" font-weight="700" fill="${greenBright}">Smarter Growth.</text>
  ${groups.map((_, index) => groupBlock(index)).join('\n  ')}
  <line x1="28" y1="372" x2="900" y2="372" stroke="${green}" stroke-width="2"/>
  ${pinIcon(48, 424, greenBright)}
  <text x="70" y="416" font-family="Segoe UI" font-size="14" fill="#e7eef4">F-836, Galaxy North Avenue 2, Gaur City 2,</text>
  <text x="70" y="438" font-family="Segoe UI" font-size="14" fill="#e7eef4">Greater Noida, UP 201301</text>
  <line x1="620" y1="392" x2="620" y2="468" stroke="#2c3d52" stroke-width="1.5"/>
  ${globeIcon(656, 428, greenBright)}
  <text x="678" y="434" font-family="Segoe UI" font-size="16" font-weight="600" fill="${greenBright}">sugamflow.com</text>
  ${qrSvg(640, 118, 220)}
  <text x="750" y="356" text-anchor="middle" font-family="Segoe UI" font-size="12" fill="#c5d0dc">Scan to save contact</text>
</svg>`;

const font = {
  fontFiles: ['C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/segoeuib.ttf'],
  loadSystemFonts: false,
  defaultFontFamily: 'Segoe UI',
};

function render(svg, file) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1063 }, font });
  writeFileSync(join(here, file), resvg.render().asPng());
}

function qrStandaloneSvg(size) {
  const modules = companyQr.modules.size;
  const standaloneCells = modules + quiet * 2;
  const cell = size / standaloneCells;
  let out = `<rect width="${size}" height="${size}" fill="#ffffff"/>`;
  const ox = quiet * cell;
  const oy = quiet * cell;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (companyQr.modules.get(r, c)) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        out += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(cell + 0.5).toFixed(2)}" height="${(cell + 0.5).toFixed(2)}" fill="#0c1624"/>`;
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${out}
</svg>`;
}

const qrPx = 2400;
const qrSvgDoc = qrStandaloneSvg(qrPx);
writeFileSync(join(here, 'SugamFlow-contact-qr.svg'), qrSvgDoc);
const qrPng = new Resvg(qrSvgDoc, { fitTo: { mode: 'width', value: qrPx } }).render().asPng();
writeFileSync(join(here, 'SugamFlow-contact-qr.png'), qrPng);

mkdirSync(here, { recursive: true });
writeFileSync(join(here, 'front-platform.svg'), front);
writeFileSync(join(here, 'back-platform.svg'), back);
render(front, 'SugamFlow-visiting-card-platform-front.png');
render(back, 'SugamFlow-visiting-card-platform-back.png');

const preview = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1900" height="620" viewBox="0 0 1900 620">
  <rect width="1900" height="620" fill="#e7ece9"/>
  <g transform="translate(40,60)">${front.replace(/^<\?xml[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g>
  <g transform="translate(980,60)">${back.replace(/^<\?xml[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g>
</svg>`;
const previewPng = new Resvg(preview, { fitTo: { mode: 'width', value: 1900 }, font }).render().asPng();
writeFileSync(join(here, 'SugamFlow-visiting-card-platform-preview.png'), previewPng);

const mm = 72 / 25.4;
const pageW = 90 * mm;
const pageH = 50 * mm;
const doc = new PDFDocument({ size: [pageW, pageH], margin: 0 });
const pdfPath = join(here, 'SugamFlow-Suman-Thakur-visiting-card-platform.pdf');
const pdfStream = createWriteStream(pdfPath);
doc.pipe(pdfStream);
doc.image(join(here, 'SugamFlow-visiting-card-platform-front.png'), 0, 0, { width: pageW, height: pageH });
doc.addPage({ size: [pageW, pageH], margin: 0 });
doc.image(join(here, 'SugamFlow-visiting-card-platform-back.png'), 0, 0, { width: pageW, height: pageH });
doc.end();
pdfStream.on('finish', () => {
  writeFileSync(join(here, 'contact-platform.vcf'), vcard);
  const { PNG } = require('pngjs');
  const jsQR = require('jsqr');
  const decoded = PNG.sync.read(readFileSync(join(here, 'SugamFlow-contact-qr.png')));
  const scanned = jsQR(new Uint8ClampedArray(decoded.data), decoded.width, decoded.height);
  console.log(JSON.stringify({
    logoW,
    logoH,
    drawH: Number(drawH.toFixed(2)),
    nameY: Number(nameY.toFixed(2)),
    qrModules: n,
    companyQrModules: companyQr.modules.size,
    qrPx: decoded.width,
    qrScans: Boolean(scanned && scanned.data.includes('Integrated ERP') && scanned.data.includes('field sales')),
    pdf: pdfPath,
  }));
});
