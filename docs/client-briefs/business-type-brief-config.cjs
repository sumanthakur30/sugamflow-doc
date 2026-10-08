/**
 * Client brief content for every SugamFlow business type.
 * Used by generate-business-type-briefs.cjs and generate-business-type-brief-pdf.cjs
 */

const DOC_VERSION = "1.0";
const DOC_MONTH = "June 2026";

/** Shown in comparison tables — honest but positive wording for clients. */
const BARCODE_BILLING_SUGAMFLOW = "✓ Basic (scan + Enter)";

const RETAIL_OPS = [
  "Counter billing / POS with product lines, qty, MRP, discount %, INR totals",
  "Customer master, order history, outstanding / due tracking",
  "Product catalog, categories, barcode field; scan field on bill (Enter to add / merge qty)",
  "Inventory & stock per branch; batch/expiry where applicable",
  "Payments: cash, UPI, card, bank, credit; paid / unpaid / partial",
  "Purchase orders, supplier master, GRN",
  "GST billing, GSTIN, HSN; thermal-style receipt print",
  "Staff roles; multi-outlet branch scoping",
  "Owner dashboard with sales visibility",
];

const RETAIL_COMPETITORS = [
  { category: "Mobile billing apps", products: "Vyapar, myBillBook, Khatabook", strength: "Fast phone billing, low cost", limit: "Weak multi-branch ops" },
  { category: "Retail / GST ERP", products: "Marg ERP, GoFrugal, Logic ERP", strength: "Mature retail & reports", limit: "Desktop-heavy onboarding" },
  { category: "Accounting-first", products: "TallyPrime, Busy", strength: "Books & audit", limit: "Counter UX secondary" },
  { category: "Cloud SMB", products: "Zoho Books + Inventory", strength: "Cloud integrations", limit: "Config effort" },
];

const RETAIL_COMPARE = [
  ["Best for", "Web shop ops, multi-branch", "Solo counter", "Established retail", "Compliance", "Cloud SMB"],
  ["Multi-branch", "✓ Built-in", "Plan-dependent", "✓ Mature", "Via company", "✓ Locations"],
  ["Live stock at billing", "✓", "✓", "✓", "Add-on", "✓"],
  ["Customer dues", "✓", "✓", "✓", "Ledger", "✓"],
  ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "✓", "✓", "Add-on", "Varies"],
  ["GST billing", "✓", "✓", "✓", "✓", "✓"],
  ["PO / GRN", "✓", "Basic", "✓", "Module", "✓"],
  ["Deep reports", "Growing", "Basic", "Strong", "Strongest", "Moderate"],
];

const AUTO_OPS_BASE = [
  "OEM + barcode counter billing with GST",
  "Spare parts master: OEM no., HSN, shelf, low-stock alerts",
  "Vehicle master & fitment search (make/model/year)",
  "Purchase orders, GRN, supplier management",
  "Vehicle-owner CRM linked to registration numbers",
  "Warranty & core-return tracking",
  "Multi-user staff with role permissions",
];

const AUTO_COMPETITORS = [
  { category: "Auto parts ERP", products: "Autoline, Autosoft, AutoClick", strength: "Parts catalog depth", limit: "Legacy desktop" },
  { category: "Workshop software", products: "GaragePlug, AutoLeap, Workshop SW", strength: "Job cards & bay mgmt", limit: "Often siloed" },
  { category: "Generic retail ERP", products: "Marg, Vyapar", strength: "Billing familiarity", limit: "No vehicle fitment" },
  { category: "DMS (dealers)", products: "CDK, Reynolds (enterprise)", strength: "Full dealer lifecycle", limit: "Enterprise cost" },
];

const HEALTHCARE_PHARMA_OPS = [
  "Medicine catalog with salt, schedule, batch & expiry",
  "Strip/tablet multi-unit packaging (MARG-style)",
  "Prescription dispense queue (linked polyclinic Rx)",
  "Patient-centric labels & tenant-wide patient master",
  "GST pharmacy billing with HSN (3004 series)",
  "Excel/CSV medicine import wizard",
  "Stock, PO, GRN, supplier management",
  "Low-stock & expiry awareness on medicine list",
];

const PHARMA_COMPETITORS = [
  { category: "Pharmacy ERP", products: "Marg Pharma, Medeil, Pharmasoft", strength: "Schedule H, batch, expiry", limit: "Desktop / training" },
  { category: "Chain pharmacy", products: "Netmeds warehouse tools, Apollo systems", strength: "Scale & compliance", limit: "Enterprise only" },
  { category: "Mobile billing", products: "Vyapar (pharmacy mode)", strength: "Quick start", limit: "Rx workflow limited" },
  { category: "Hospital pharmacy", products: "HMIS modules (Birlamedisoft, etc.)", strength: "IPD integration", limit: "Heavy & costly" },
];

const POLYCLINIC_OPS = [
  "Reception queue & OPD token management",
  "Doctor dashboard & consultation pad",
  "E-prescription writing",
  "Lab order referrals to sibling path lab (same tenant)",
  "Pharmacy dispense tab for prescriptions",
  "Patient master (tenant-wide across healthcare outlets)",
  "Investigations & patient chart timeline",
  "Owner command center for clinic KPIs",
];

const POLYCLINIC_COMPETITORS = [
  { category: "Clinic EMR", products: "Practo Ray, HealthPlix, Lybrate Pro", strength: "OPD & Rx workflows", limit: "SaaS lock-in" },
  { category: "Hospital HMIS", products: "Birlamedisoft, Medeil Clinic", strength: "Full hospital stack", limit: "Overkill for small clinic" },
  { category: "Pharmacy ERP add-on", products: "Marg + clinic module", strength: "Billing integration", limit: "Fragmented UX" },
  { category: "Standalone billing", products: "Excel + paper Rx", strength: "Zero software cost", limit: "No audit trail" },
];

const PATH_LAB_OPS = [
  "Sample worklist with status lifecycle",
  "Walk-in & home-collection test booking",
  "Lab report entry & PDF release",
  "Tenant-wide lab orders from polyclinic referrals",
  "Test catalog & lab billing with GST",
  "Patient master (shared with clinic network)",
  "Barcode / sample tracking on worklist",
  "Dashboard KPIs for lab owner",
];

const PATH_LAB_COMPETITORS = [
  { category: "Lab LIMS", products: "CrelioHealth, Swaasa, LabSmart", strength: "Sample-to-report workflow", limit: "Subscription per lab" },
  { category: "Diagnostic chains", products: "Dr Lal PathLabs systems, Thyrocare tools", strength: "Scale & branding", limit: "Enterprise" },
  { category: "HMIS lab module", products: "Hospital-embedded LIS", strength: "IPD + OPD unified", limit: "Heavy deployment" },
  { category: "Manual / Excel", products: "Paper registers", strength: "No IT cost", limit: "Errors & delays" },
];

/** @type {import('./business-type-brief-types').BusinessBriefConfig[]} */
const BUSINESS_BRIEFS = [
  {
    code: "GENERIC",
    title: "Generic Business",
    subtitle: "General retail / fallback profile",
    entityLabel: "Customers",
    summary: "Default retail toolkit for shops selling physical products—billing, inventory, customers, staff, purchases, and GST in one browser-based system. Use when no specialised vertical is needed.",
    whoFor: [
      ["Single-counter shops", "Stationery, gifts, hardware, general merchandise"],
      ["Multi-branch retail", "Same owner, multiple outlets"],
      ["Shops outgrowing notebooks", "Excel + manual billing → one live system"],
      ["Owners wanting visibility", "Sales, dues, stock from one dashboard"],
    ],
    operations: RETAIL_OPS,
    extras: [],
    competitors: RETAIL_COMPETITORS,
    compare: RETAIL_COMPARE,
    compareHeader: ["Feature", "SugamFlow", "Vyapar-class", "Marg-class", "Tally/Busy", "Zoho"],
    showBarcodeFootnote: true,
    whyChoose: [
      "One system for counter + back office—less double entry",
      "Cloud-first browser access—no install per PC",
      "Multi-branch ready from day one",
      "Extensible—add specialised outlets later without switching products",
    ],
    included: ["Web POS, catalog, stock, customers, PO/GRN", "Barcode scan on bill (Enter)", "GST billing & thermal print", "Multi-branch & roles", "Owner dashboard"],
    roadmap: ["Dedicated cashier POS screen", "Scale / weighed barcodes", "E-invoice automation", "ERP-grade statutory reports"],
    pitch: "SugamFlow Generic = web-based shop billing + inventory + customers + purchases for Indian retail—multi-branch ready.",
  },
  {
    code: "RETAIL",
    title: "General Retail",
    subtitle: "Standard retail shop profile",
    entityLabel: "Customers",
    summary: "Purpose-built retail profile for general merchandise shops—same full toolkit as Generic with retail-optimised owner dashboard playbooks (fast-moving SKU alerts, basket bundles).",
    whoFor: [
      ["Kirana & general stores", "Daily-needs, mixed SKU counters"],
      ["Specialty retail", "Cosmetics, home décor, toys"],
      ["Franchise counters", "Brand outlets with central owner"],
      ["Growing SMB retail", "2–10 staff, 1–5 branches"],
    ],
    operations: RETAIL_OPS,
    extras: ["Grocery-style fast-mover insights on owner dashboard", "Reorder alert playbooks for top SKUs"],
    competitors: RETAIL_COMPETITORS,
    compare: RETAIL_COMPARE,
    compareHeader: ["Feature", "SugamFlow", "Vyapar-class", "Marg-class", "Tally/Busy", "Zoho"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Retail-first counter flow with live stock per branch",
      "Customer dues & history at billing time",
      "Lighter than desktop ERP—faster staff onboarding",
      "Same platform scales to multi-branch",
    ],
    included: RETAIL_OPS.slice(0, 6).map((s) => s.split("—")[0].trim()),
    roadmap: ["Advanced promotions engine", "Loyalty points", "E-commerce connector"],
    pitch: "SugamFlow Retail = modern web POS + inventory for Indian general retail—dues, stock, and GST in one place.",
  },
  {
    code: "MEDICAL",
    title: "Medical Shop",
    subtitle: "Healthcare retail / medicine counter",
    entityLabel: "Patients",
    summary: "Medicine shop profile with patient labels, medicine-specific catalog (salt, schedule, batch/expiry), and prescription dispense when linked to a polyclinic network.",
    whoFor: [
      ["Standalone medical stores", "Neighbourhood medicine counters"],
      ["Clinic-attached pharmacies", "Dispense polyclinic prescriptions"],
      ["Chemist with batch tracking", "Schedule H awareness, expiry control"],
      ["Multi-branch medicine retail", "Same tenant, shared patient master"],
    ],
    operations: HEALTHCARE_PHARMA_OPS,
    extras: ["Tenant-wide product catalog when linked to clinic", "Patient label on healthcare bills"],
    competitors: PHARMA_COMPETITORS,
    compare: [
      ["Best for", "Clinic-linked pharmacy", "Standalone chemist", "Chain pharmacy", "Hospital IPD"],
      ["Batch & expiry", "✓", "✓", "✓", "✓"],
      ["Rx dispense queue", "✓ (tenant)", "Limited", "✓", "✓"],
      ["Patient master", "✓ Tenant-wide", "—", "Varies", "✓"],
      ["Medicine import", "✓ Excel", "Manual", "✓", "✓"],
      ["GST pharmacy", "✓", "✓", "✓", "✓"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Marg Pharma", "Vyapar", "Medeil", "HMIS module"],
    whyChoose: [
      "Same tenant as polyclinic + path lab—one patient record",
      "Prescription-to-dispense without paper chase",
      "Medicine import wizard with batch/expiry on load",
      "Web access for counter + owner on any PC",
    ],
    included: ["Medicine catalog, batch, expiry", "Patient labels", "Rx dispense (tenant)", "GST billing", "PO/GRN"],
    roadmap: ["Drug interaction alerts", "Online medicine orders", "CDSCO compliance depth"],
    pitch: "SugamFlow Medical Shop = pharmacy billing + batch/expiry + patient-aware dispense linked to your clinic network.",
  },
  {
    code: "PHARMACY",
    title: "Pharmacy",
    subtitle: "Retail pharmacy / chemist",
    entityLabel: "Patients",
    summary: "Full pharmacy profile with medicine master, strip/tablet units, prescription dispense from polyclinic, tenant-wide catalog, and pharmacy-chain procurement profile.",
    whoFor: [
      ["Retail pharmacies", "High-street chemist shops"],
      ["Pharmacy chains", "Multiple outlets, one owner tenant"],
      ["Trust-network pharmacies", "TRUST-PHAR pattern beside clinic & lab"],
      ["Wholesale-retail hybrid", "Counter + bulk buyers"],
    ],
    operations: HEALTHCARE_PHARMA_OPS,
    extras: ["Pharmacy-chain procurement profile", "Tenant-wide clinical records for Rx routing"],
    competitors: PHARMA_COMPETITORS,
    compare: [
      ["Best for", "Multi-outlet pharmacy + clinic", "Single chemist", "Desktop pharma ERP", "Hospital"],
      ["Strip/tablet units", "✓", "Varies", "✓", "✓"],
      ["Rx from polyclinic", "✓ Auto-route", "—", "Add-on", "✓"],
      ["Multi-branch patients", "✓", "—", "✓", "✓"],
      ["Schedule H fields", "✓", "Basic", "✓", "✓"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Marg Pharma", "Pharmasoft", "Vyapar", "Practo Ray pharmacy"],
    whyChoose: [
      "Designed for clinic + pharmacy + lab on one tenant",
      "Excel medicine import with batch/expiry",
      "Dispense queue—not just retail billing",
      "Cloud multi-branch without per-PC license",
    ],
    included: HEALTHCARE_PHARMA_OPS.slice(0, 7),
    roadmap: ["E-prescription PDF to patient", "Insurance / TPA billing", "Cold-chain tracking"],
    pitch: "SugamFlow Pharmacy = chemist billing + Rx dispense + batch/expiry—connected to your clinic and lab on one platform.",
  },
  {
    code: "POLYCLINIC",
    title: "Polyclinic / Clinic",
    subtitle: "Healthcare OPD & consultation",
    entityLabel: "Patients",
    summary: "OPD-focused clinic profile: reception queue, doctor dashboard, consultation pad, e-prescription, lab referrals, and pharmacy handoff within one healthcare tenant.",
    whoFor: [
      ["Multi-doctor polyclinics", "Several specialists, one front desk"],
      ["Single-doctor clinics", "GP, paediatric, dental (basic)"],
      ["Diagnostic + consultation", "Clinic that refers to own path lab"],
      ["Trust healthcare networks", "Clinic + lab + pharmacy siblings"],
    ],
    operations: POLYCLINIC_OPS,
    extras: ["Routes Rx to pharmacy outlet; lab orders to path lab (same tenant)"],
    competitors: POLYCLINIC_COMPETITORS,
    compare: [
      ["Best for", "Clinic + lab + pharmacy network", "SaaS clinic", "Desktop EMR", "Paper clinic"],
      ["OPD queue", "✓", "✓", "✓", "—"],
      ["E-prescription", "✓", "✓", "✓", "—"],
      ["Lab referral", "✓ Tenant", "Partner API", "Add-on", "Phone"],
      ["Pharmacy handoff", "✓ Same tenant", "—", "Separate SKU", "Walk"],
      ["Multi-doctor", "✓", "✓", "✓", "—"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Practo Ray", "HealthPlix", "Marg clinic", "Paper/Excel"],
    whyChoose: [
      "One tenant for clinic, lab, pharmacy—no integration project",
      "Doctor sees patient chart & lab timeline",
      "Web-based—no heavy HMIS deployment",
      "Indian GST posture for clinic billing where applicable",
    ],
    included: POLYCLINIC_OPS.slice(0, 6),
    roadmap: ["IPD / bed management", "Insurance TPA", "Teleconsultation"],
    pitch: "SugamFlow Polyclinic = OPD queue + doctor pad + Rx + lab & pharmacy routing on one healthcare tenant.",
  },
  {
    code: "PATH_LAB",
    title: "Pathology Lab",
    subtitle: "Diagnostics & sample-to-report",
    entityLabel: "Patients",
    summary: "Standalone pathology lab profile with sample worklist, test booking, report publishing, and automatic receipt of referrals from sibling polyclinic shops in the same tenant.",
    whoFor: [
      ["Standalone path labs", "Walk-in & referred patients"],
      ["Clinic-attached labs", "TRUST-MEDI-PATH pattern"],
      ["Home-collection labs", "Booking + sample tracking"],
      ["Multi-collection centres", "One lab, many sample points (roadmap)"],
    ],
    operations: PATH_LAB_OPS,
    extras: ["Receives polyclinic referrals with consultationId", "No retail product catalog—lab-focused UI"],
    competitors: PATH_LAB_COMPETITORS,
    compare: [
      ["Best for", "Clinic-linked lab network", "Standalone LIMS SaaS", "Chain lab", "Manual lab"],
      ["Sample worklist", "✓", "✓", "✓", "Paper"],
      ["Clinic referrals", "✓ Tenant auto", "HL7/integration", "Internal", "Phone"],
      ["Report PDF", "✓", "✓", "✓", "Word/Excel"],
      ["Lab billing", "✓", "✓", "✓", "Manual"],
    ],
    compareHeader: ["Feature", "SugamFlow", "CrelioHealth", "LabSmart", "HMIS LIS", "Manual"],
    whyChoose: [
      "Referrals from your polyclinic appear automatically—no re-entry",
      "Patient shared with clinic & pharmacy",
      "Lighter than full HMIS—lab-first screens",
      "GST-ready lab billing",
    ],
    included: PATH_LAB_OPS.slice(0, 6),
    roadmap: ["Instrument interfacing (ASTM/HL7)", "NABL compliance pack", "Consumer report portal"],
    pitch: "SugamFlow Path Lab = sample worklist + reports + billing—wired to your clinic referrals on one tenant.",
  },
  {
    code: "BEAUTY_PARLOR",
    title: "Beauty Parlor / Salon",
    subtitle: "Salon & personal care services",
    entityLabel: "Clients",
    summary: "Salon profile with client-centric labels, retail product sales, service billing, and owner playbooks for repeat visits and service+product bundles.",
    whoFor: [
      ["Beauty parlours", "Hair, skin, bridal services"],
      ["Unisex salons", "Cut, colour, grooming"],
      ["Spa-lite centres", "Services + retail products"],
      ["Multi-chair salons", "Several stylists, one owner"],
    ],
    operations: [...RETAIL_OPS.slice(0, 5), "Service + product line billing on same order", "Client history & repeat-visit context"],
    extras: ["Owner playbook: appointment reminders & bundle upsell", "Client label (not Customer)"],
    competitors: [
      { category: "Salon SaaS", products: "Zenoti, Fresha, MioSalon", strength: "Appointments & marketing", limit: "SaaS lock-in" },
      { category: "Retail POS", products: "Vyapar, Marg", strength: "Product billing", limit: "No salon workflow" },
      { category: "Spa enterprise", products: "SpaSoft, Book4Time", strength: "Multi-location spa", limit: "Enterprise pricing" },
      { category: "Notebook", products: "Paper register", strength: "Zero cost", limit: "No client history" },
    ],
    compare: [
      ["Best for", "Salon + product retail", "Appointment SaaS", "Generic POS", "Enterprise spa"],
      ["Client records", "✓", "✓", "Basic", "✓"],
      ["Product retail", "✓", "Add-on", "✓", "✓"],
      ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "—", "✓", "—"],
      ["Multi-branch", "✓", "✓", "Varies", "✓"],
      ["Appointment calendar", "Roadmap", "✓ Core", "—", "✓"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Fresha/Zenoti", "Vyapar", "MioSalon", "Marg"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Retail + services on one bill—products and treatments together",
      "Client-centric UX without enterprise spa cost",
      "Multi-branch for salon chains",
      "Owner insights for repeat visits",
    ],
    included: ["Client master", "Service + product billing", "Stock for retail SKUs", "GST bills", "Staff roles"],
    roadmap: ["Online appointment booking", "Stylist commission reports", "SMS reminders"],
    pitch: "SugamFlow Salon = client billing + retail products + stock—lighter than enterprise spa SaaS.",
  },
  {
    code: "JEWELRY",
    title: "Jewelry Shop",
    subtitle: "Fine jewelry & ornaments retail",
    entityLabel: "Customers",
    summary: "Jewelry retail profile with high-value SKU tracking, customer relationship context, and owner playbooks for collection showcase and premium customer follow-up.",
    whoFor: [
      ["Gold & silver showrooms", "Counter sales with MRP/discount"],
      ["Diamond & fashion jewelry", "High-margin SKU tracking"],
      ["Multi-branch jewelers", "Same brand, several showrooms"],
      ["Repair & custom order shops", "Service lines on orders (basic)"],
    ],
    operations: RETAIL_OPS,
    extras: ["Owner playbook: high-margin collection highlights", "Slow-moving design campaign alerts"],
    competitors: [
      { category: "Jewelry ERP", products: "Ginesys, Ornate, JewelAcc", strength: "Karat, making charges", limit: "Desktop / training" },
      { category: "Retail ERP", products: "Marg, Tally + inventory", strength: "GST & stock", limit: "No jewelry-specific UI" },
      { category: "Mobile billing", products: "Vyapar", strength: "Quick bills", limit: "High-value audit weak" },
      { category: "Legacy", products: "Manual tags + notebook", strength: "Familiar", limit: "Shrinkage risk" },
    ],
    compare: [
      ["Best for", "Multi-branch jewelry retail", "Desktop jewelry ERP", "Generic ERP", "Mobile only"],
      ["High-value SKU tracking", "✓ Catalog", "✓ Karat/making", "Basic", "Basic"],
      ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "✓", "✓", "✓"],
      ["Customer history", "✓", "✓", "✓", "Limited"],
      ["GST billing", "✓", "✓", "✓", "✓"],
      ["Making charges / wastage", "Roadmap", "✓", "Manual", "—"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Ginesys/Ornate", "Marg", "Vyapar", "Tally"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Modern web UX for showroom counters",
      "Customer purchase history for premium buyers",
      "Multi-showroom visibility for owner",
      "Extensible catalog for designs & collections",
    ],
    included: ["Product catalog", "POS billing", "Customer CRM", "Stock", "GST"],
    roadmap: ["Making charge / wastage modules", "Old gold exchange", "Hallmark integration"],
    pitch: "SugamFlow Jewelry = showroom billing + customer history + multi-branch stock—modern web alternative to legacy jewelry ERP.",
  },
  {
    code: "GROCERY",
    title: "Grocery / Supermarket",
    subtitle: "Kirana, mini-mart & supermarket",
    entityLabel: "Customers",
    summary: "Grocery profile with expiry-aware inventory, fast-mover dashboard playbooks, and full retail POS—ideal for kirana, mini-mart, and supermarket counters.",
    whoFor: [
      ["Kirana stores", "Neighbourhood daily needs"],
      ["Mini-marts & supermarkets", "Wider SKU, multiple aisles"],
      ["Organic / specialty food", "Batch & expiry important"],
      ["Multi-branch grocery chains", "Central owner, local counters"],
    ],
    operations: [...RETAIL_OPS, "Expiry-aware inventory batches", "Fast-moving SKU reorder playbooks"],
    extras: ["Grocery-oriented owner dashboard insights"],
    competitors: [
      { category: "Grocery POS", products: "GoFrugal, Posist, SnappOS", strength: "F&B + grocery depth", limit: "Subscription / setup" },
      { category: "Kirana apps", products: "Vyapar, Khatabook", strength: "Fast billing", limit: "Expiry workflows basic" },
      { category: "Supermarket ERP", products: "Marg, Logic ERP", strength: "Scale & distribution", limit: "Heavy" },
      { category: "Modern trade", products: "SAP Retail, Oracle", strength: "Enterprise", limit: "Not for SMB" },
    ],
    compare: [
      ["Best for", "SMB grocery multi-branch", "Kirana app", "Supermarket ERP", "Enterprise"],
      ["Expiry batches", "✓", "Basic", "✓", "✓"],
      ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "✓", "✓", "✓"],
      ["PO / GRN", "✓", "Basic", "✓", "✓"],
      ["Multi-branch", "✓", "Varies", "✓", "✓"],
    ],
    compareHeader: ["Feature", "SugamFlow", "GoFrugal", "Vyapar", "Marg", "Posist"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Expiry tracking for perishables",
      "Cloud access—no server in back room",
      "Owner sees fast movers across branches",
      "Procurement PO → GRN → stock linked",
    ],
    included: ["POS", "Batch/expiry stock", "PO/GRN", "Barcode scan (Enter)", "Multi-branch", "GST"],
    roadmap: ["Weighed / scale barcodes", "Online grocery orders", "Shelf-edge label print"],
    pitch: "SugamFlow Grocery = kirana/supermarket billing + expiry stock + multi-branch—cloud-ready for Indian grocery.",
  },
  {
    code: "FASHION",
    title: "Fashion / Apparel",
    subtitle: "Clothing & apparel retail",
    entityLabel: "Customers",
    summary: "Apparel retail profile with size/colour variant-friendly catalog, basket upsell playbooks, and standard retail POS for boutiques and fashion chains.",
    whoFor: [
      ["Boutiques", "Seasonal collections, limited SKUs"],
      ["Apparel chains", "Multi-store fashion brands"],
      ["Footwear & accessories", "Size-based inventory"],
      ["Factory outlets", "Discount-led high volume"],
    ],
    operations: RETAIL_OPS,
    extras: ["Owner playbook: size/colour stock balance before weekends", "Look-based cross-sell suggestions"],
    competitors: [
      { category: "Apparel ERP", products: "Ginesys, Candela, Reach", strength: "Size/colour matrix", limit: "Desktop" },
      { category: "Retail POS", products: "Marg, GoFrugal", strength: "Billing & stock", limit: "Fashion UX generic" },
      { category: "Mobile", products: "Vyapar", strength: "Quick start", limit: "Variants weak" },
      { category: "Enterprise", products: "SAP Apparel", strength: "Global brands", limit: "Enterprise" },
    ],
    compare: [
      ["Best for", "SMB fashion multi-branch", "Apparel ERP", "Generic ERP", "Mobile"],
      ["Variant attributes", "✓ Catalog", "✓ Matrix", "Basic", "Basic"],
      ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "✓", "✓", "✓"],
      ["Seasonal collections", "✓ Categories", "✓", "✓", "—"],
      ["Multi-branch stock", "✓", "✓", "✓", "—"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Ginesys/Candela", "Marg", "Vyapar", "Reach"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Web POS tuned for apparel counters",
      "Owner insights on size/colour movement",
      "Multi-store stock visibility",
      "GST-ready without enterprise apparel ERP cost",
    ],
    included: ["Catalog with attributes", "POS", "Stock per branch", "Customer history", "GST"],
    roadmap: ["Size/colour matrix UI polish", "Lookbooks", "E-commerce sync"],
    pitch: "SugamFlow Fashion = apparel billing + variant catalog + multi-branch stock for Indian boutiques and chains.",
  },
  {
    code: "ELECTRONICS",
    title: "Electronics Store",
    subtitle: "Consumer electronics & appliances",
    entityLabel: "Customers",
    summary: "Electronics retail with AI-style owner dashboard insights, serial-friendly catalog, warranty-aware product fields, and full GST POS for appliances & gadgets.",
    whoFor: [
      ["Mobile & gadget shops", "Phones, accessories, repairs retail"],
      ["Appliance showrooms", "AC, fridge, TV counters"],
      ["Computer & IT retail", "Laptops, peripherals"],
      ["Multi-branch electronics chains", "Regional dealers"],
    ],
    operations: RETAIL_OPS,
    extras: ["Electronics AI insights on owner dashboard", "Warranty period on product master"],
    competitors: [
      { category: "Electronics ERP", products: "Marg, Busy, Logic", strength: "GST & serial tracking", limit: "Legacy UI" },
      { category: "Mobile POS", products: "Vyapar, myBillBook", strength: "Quick billing", limit: "Warranty/serial weak" },
      { category: "Brand DMS", products: "Samsung/LG dealer portals", strength: "Scheme compliance", limit: "Brand-specific" },
      { category: "Cloud", products: "Zoho Inventory", strength: "Integrations", limit: "Retail counter polish" },
    ],
    compare: [
      ["Best for", "Electronics multi-branch", "Desktop ERP", "Mobile POS", "Brand DMS"],
      ["Serial / warranty fields", "✓ Product", "✓", "—", "✓"],
      ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "✓", "✓", "—"],
      ["GST billing", "✓", "✓", "✓", "✓"],
      ["Owner AI insights", "✓", "—", "—", "—"],
      ["Multi-branch", "✓", "✓", "Varies", "Brand"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Marg", "Vyapar", "Busy", "Zoho"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Electronics-specific owner dashboard",
      "Warranty context on product master",
      "Multi-branch for regional dealers",
      "Modern web counter UX",
    ],
    included: ["POS", "Catalog + warranty fields", "Stock", "GST", "Owner AI insights", "PO/GRN"],
    roadmap: ["IMEI/serial scan at billing", "AMC/service job cards", "Brand scheme import"],
    pitch: "SugamFlow Electronics = appliance & gadget billing + warranty-aware catalog + owner insights.",
  },
  {
    code: "RESTAURANT",
    title: "Restaurant / F&B",
    subtitle: "Food & beverage service",
    entityLabel: "Guests",
    summary: "Restaurant profile with guest-centric labels, F&B-oriented GST flows, combo/add-on billing playbooks, and inventory for ingredients and packaged items.",
    whoFor: [
      ["Restaurants & diners", "Table service, takeaway"],
      ["Cafés & bakeries", "Quick service counters"],
      ["Fast food", "High-volume counter"],
      ["Multi-outlet F&B brands", "Same menu, several locations"],
    ],
    operations: [
      "Guest (not customer) labels throughout UI",
      "Menu-style product catalog & categories",
      "Counter billing with combos & add-ons",
      "Ingredient / packaged stock tracking",
      "GST F&B billing (restaurant GST profile)",
      "Staff roles per outlet",
      "Purchase orders for suppliers",
      "Owner playbook: peak-hour & upsell insights",
    ],
    extras: ["Restaurant-specific GST mapping on orders"],
    competitors: [
      { category: "Restaurant POS", products: "Petpooja, Posist, Restroworks", strength: "KOT, table mgmt", limit: "Subscription" },
      { category: "Cloud F&B", products: "Dotpe, UrbanPiper", strength: "Aggregator integration", limit: "Aggregator-centric" },
      { category: "Generic POS", products: "Vyapar, Marg", strength: "Billing", limit: "No KOT/table" },
      { category: "Enterprise", products: "Oracle MICROS", strength: "Hotels & chains", limit: "Enterprise cost" },
    ],
    compare: [
      ["Best for", "SMB F&B multi-outlet", "Restaurant SaaS", "Aggregators", "Generic POS"],
      ["Guest billing", "✓", "✓", "Online focus", "✓"],
      ["Menu catalog", "✓", "✓", "—", "Basic"],
      ["KOT / kitchen display", "Roadmap", "✓", "—", "—"],
      ["Inventory", "✓", "✓", "—", "✓"],
      ["Multi-branch", "✓", "✓", "✓", "Varies"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Petpooja", "Posist", "Vyapar", "Dotpe"],
    whyChoose: [
      "Guest-centric UX for F&B",
      "Same platform as retail if you also run a store",
      "Multi-outlet menu & stock",
      "Owner peak-hour playbooks",
    ],
    included: ["Guest billing", "Menu catalog", "Stock", "GST F&B", "Multi-branch", "PO"],
    roadmap: ["KOT & table management", "Swiggy/Zomato integration", "Recipe / BOM costing"],
    pitch: "SugamFlow Restaurant = guest billing + menu stock + multi-outlet F&B—extendable to full restaurant POS.",
  },
  {
    code: "WHOLESALE",
    title: "Wholesale / B2B",
    subtitle: "Bulk trade & distribution",
    entityLabel: "Buyers",
    summary: "B2B wholesale profile with buyer-centric labels, volume-oriented billing, credit/dues tracking, and procurement workflows for distributors and bulk traders.",
    whoFor: [
      ["Wholesale traders", "Bulk sale to retailers"],
      ["Distributors", "Brand / territory distribution"],
      ["B2B counters", "Credit-heavy buyer relationships"],
      ["Multi-warehouse operators", "Several godowns, one tenant"],
    ],
    operations: [
      "Buyer (not customer) labels",
      "Volume line-item billing with credit terms",
      "Outstanding & partial payment tracking",
      "Bulk SKU catalog & stock",
      "Purchase orders & GRN from suppliers",
      "Multi-branch / godown scoping",
      "GST B2B invoicing",
      "Owner playbook: top-buyer & lead-time focus",
    ],
    extras: ["B2B pricing posture on orders"],
    competitors: [
      { category: "Distributor ERP", products: "Marg Distri, Busy, Tally Prime", strength: "Credit & ledger", limit: "Desktop culture" },
      { category: "B2B platforms", products: "Udaan, Jumbotail (ordering)", strength: "Marketplace reach", limit: "Not your ERP" },
      { category: "Generic ERP", products: "SAP B1, Odoo", strength: "Scale", limit: "Implementation cost" },
      { category: "Mobile", products: "Vyapar wholesale mode", strength: "Quick bills", limit: "B2B depth" },
    ],
    compare: [
      ["Best for", "SMB distributor web ops", "Desktop distri ERP", "Marketplace", "Enterprise"],
      ["Buyer credit/dues", "✓", "✓", "Platform", "✓"],
      ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "✓", "Basic", "—"],
      ["Bulk PO/GRN", "✓", "✓", "—", "✓"],
      ["Multi-godown", "✓ Branches", "✓", "—", "✓"],
      ["GST B2B invoice", "✓", "✓", "—", "✓"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Marg Distri", "Busy", "Tally", "Udaan"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Buyer-centric B2B UX",
      "Cloud visibility across godowns",
      "Credit tracking without separate ledger app",
      "Same tenant can mix wholesale + retail outlets",
    ],
    included: ["Buyer master", "Credit billing", "PO/GRN", "Multi-branch", "GST B2B"],
    roadmap: ["Route planning", "Salesman beat / field force", "E-way integration"],
    pitch: "SugamFlow Wholesale = B2B billing + buyer dues + multi-godown stock—web-based distributor operations.",
  },
  {
    code: "OPTICAL",
    title: "Optical Shop",
    subtitle: "Eyewear & optical retail",
    entityLabel: "Customers",
    summary: "Optical retail profile with eyewear-friendly catalog, lens/frame attributes, standard retail POS, and procurement profile tuned for optical SKU management.",
    whoFor: [
      ["Optical shops", "Frames, lenses, sunglasses"],
      ["Eye care retail chains", "Multi-branch opticians"],
      ["Clinic-attached optical", "Prescription lens sales"],
      ["Contact lens counters", "SKU + expiry batches"],
    ],
    operations: [...RETAIL_OPS, "Optical attribute pack on products", "Lens/frame categorisation"],
    extras: ["Procurement profile: RETAIL with optical attribute pack"],
    competitors: [
      { category: "Optical software", products: "Optical POS India, iOptics", strength: "Prescription lens workflow", limit: "Niche vendors" },
      { category: "Retail ERP", products: "Marg, Ginesys", strength: "Stock & GST", limit: "No optical UX" },
      { category: "Chain systems", products: "LensKart internal tools", strength: "Scale", limit: "Not sold SMB" },
      { category: "Mobile", products: "Vyapar", strength: "Billing", limit: "Rx lens weak" },
    ],
    compare: [
      ["Best for", "SMB optical multi-branch", "Optical POS", "Generic ERP", "Mobile"],
      ["Frame/lens catalog", "✓ Attributes", "✓", "Basic", "Basic"],
      ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "✓", "✓", "Basic"],
      ["Prescription linkage", "Roadmap", "✓", "—", "—"],
      ["GST billing", "✓", "✓", "✓", "✓"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Optical POS", "Marg", "Vyapar", "Ginesys"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Optical product attributes out of the box",
      "Multi-branch for optician chains",
      "Integrated stock & procurement",
      "Web-based—no optical-only desktop lock-in",
    ],
    included: ["Optical catalog", "POS", "Stock", "GST", "PO/GRN", "Multi-branch"],
    roadmap: ["Prescription → lens order workflow", "Lab job sheet for edging", "Insurance tie-up"],
    pitch: "SugamFlow Optical = eyewear catalog + billing + stock for Indian optical shops and chains.",
  },
  {
    code: "BOOK_STORE",
    title: "Book Store",
    subtitle: "Books & stationery retail",
    entityLabel: "Customers",
    summary: "Book store profile with ISBN-friendly catalog fields, category-led browsing, and standard retail POS for bookshops and stationery counters.",
    whoFor: [
      ["Bookshops", "Trade, academic, regional language"],
      ["Stationery stores", "Books + stationery mix"],
      ["School supply counters", "Seasonal bulk sales"],
      ["Multi-branch book chains", "City-wide stores"],
    ],
    operations: [...RETAIL_OPS, "Book attribute pack (ISBN, author, publisher fields)", "Category-led catalog"],
    extras: ["Procurement profile: RETAIL with book attribute pack"],
    competitors: [
      { category: "Bookshop software", products: "Booklog, Indie commerce tools", strength: "ISBN lookup", limit: "Western-focused" },
      { category: "Retail ERP", products: "Marg, Vyapar", strength: "GST billing", limit: "No ISBN UX" },
      { category: "E-commerce", products: "Amazon Seller, Flipkart", strength: "Online reach", limit: "Not in-store POS" },
      { category: "Library systems", products: "KOHA", strength: "Lending", limit: "Not retail" },
    ],
    compare: [
      ["Best for", "In-store book retail", "ISBN-centric tools", "Generic POS", "Online only"],
      ["ISBN / metadata", "✓ Fields", "✓", "—", "—"],
      ["Barcode billing", BARCODE_BILLING_SUGAMFLOW, "✓", "✓", "—"],
      ["In-store POS", "✓", "Varies", "✓", "—"],
      ["Multi-branch", "✓", "—", "Varies", "—"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Booklog-class", "Marg", "Vyapar", "E-commerce"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Book-specific product fields",
      "Physical store POS + stock",
      "Multi-branch for book chains",
      "Same platform if you add café or stationery vertical",
    ],
    included: ["Book catalog fields", "POS", "Stock", "GST", "Customer history", "PO"],
    roadmap: ["ISBN barcode lookup API", "Publisher return workflow", "Online catalog sync"],
    pitch: "SugamFlow Book Store = bookshop billing + ISBN catalog + multi-branch stock.",
  },
  {
    code: "OTHER",
    title: "Other / Custom",
    subtitle: "Flexible retail fallback",
    entityLabel: "Customers",
    summary: "Catch-all profile with the full default retail toolkit when the shop type does not match a named vertical—same capabilities as Generic with customisable labels.",
    whoFor: [
      ["Mixed businesses", "Unique SKU mix not fitting a vertical"],
      ["Pilot deployments", "Start generic, refine type later"],
      ["Custom integrations", "Partner white-label shops"],
      ["Transitioning businesses", "Change businessType when ready"],
    ],
    operations: RETAIL_OPS,
    extras: ["Customisable header labels via shop settings", "Upgrade path to any vertical type"],
    competitors: RETAIL_COMPETITORS,
    compare: RETAIL_COMPARE,
    compareHeader: ["Feature", "SugamFlow", "Vyapar-class", "Marg-class", "Tally/Busy", "Zoho"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Start fast without picking wrong vertical",
      "Full retail toolkit included",
      "Switch business type when needs clarify",
      "Custom labels for your terminology",
    ],
    included: ["Full retail toolkit", "Custom labels", "Multi-branch", "GST", "PO/GRN"],
    roadmap: ["Per-tenant module toggles", "Custom attribute packs"],
    pitch: "SugamFlow Other = full retail platform with flexible labels—start now, specialise later.",
  },
];

function autoBrief(code, title, subtitle, whoFor, extras, workshop, pitch) {
  return {
    code,
    title,
    subtitle,
    entityLabel: "Vehicle owners",
    summary: `Automobile vertical profile for **${title.toLowerCase()}**—OEM parts catalog, vehicle fitment search, counter GST billing, procurement, and${workshop ? " workshop job cards with parts consumption" : " distributor-grade stock flows"}.`,
    whoFor,
    operations: [...AUTO_OPS_BASE, ...(workshop ? ["Workshop job cards—reserve & consume parts on job close"] : []), ...(code === "AUTO_DEALER" ? ["Basic vehicle sales counter (dealer CRM roadmap)"] : [])],
    extras,
    competitors: AUTO_COMPETITORS,
    compare: [
      ["Best for", title, "Auto parts ERP", "Workshop SaaS", "Generic POS", "Enterprise DMS"],
      ["OEM parts search", "✓", "✓", "Varies", "—", "✓"],
      ["Barcode / OEM billing", BARCODE_BILLING_SUGAMFLOW, "✓", "—", "Basic", "✓"],
      ["Vehicle fitment", "✓", "✓", "—", "—", "✓"],
      ["Job cards", workshop ? "✓" : "—", "Varies", "✓", "—", "✓"],
      ["PO / GRN", "✓", "✓", "Basic", "Basic", "✓"],
      ["Multi-branch", "✓", "Varies", "✓", "—", "✓"],
    ],
    compareHeader: ["Feature", "SugamFlow", "Autoline/Autosoft", "GaragePlug", "Vyapar", "Dealer DMS"],
    showBarcodeFootnote: true,
    whyChoose: [
      "Built for Indian auto aftermarket—not generic retail",
      "Vehicle-wise parts finder at counter",
      "Workshop + parts on one platform" + (workshop ? "" : ""),
      "Web browser—counter, store, and office",
    ],
    included: workshop
      ? ["Counter POS", "OEM catalog", "Vehicle master", "Job cards", "PO/GRN", "Warranty/core"]
      : ["Counter POS", "OEM catalog", "Vehicle master", "PO/GRN", "Stock alerts", "Warranty/core"],
    roadmap: code === "AUTO_DEALER"
      ? ["Dealer CRM (leads, booking)", "VIN decode", "Finance & insurance hooks"]
      : ["TecDoc/OEM feed", "Native mobile app", "Inter-warehouse transfer"],
    pitch,
  };
}

BUSINESS_BRIEFS.push(
  autoBrief(
    "AUTO_PARTS",
    "Automobile Spare Parts Shop",
    "Spare parts counter retail",
    [
      ["Spare parts counters", "OEM and aftermarket parts"],
      ["Multi-brand auto stores", "Several marques, one shop"],
      ["Highway / city parts shops", "Fast barcode billing"],
      ["Franchise parts outlets", "Brand-compliant counters"],
    ],
    ["Demo shop: AUTO-DEMO-01"],
    false,
    "SugamFlow Auto Parts = OEM counter billing + vehicle fitment search + GST—for spare parts shops."
  ),
  autoBrief(
    "AUTO_WORKSHOP",
    "Automobile Workshop",
    "Garage & mechanic workshop",
    [
      ["Independent garages", "Mechanical repairs"],
      ["Multi-bay workshops", "Several jobs in parallel"],
      ["Brand-agnostic garages", "All makes serviced"],
      ["Workshop + parts shop", "Counter and bay together"],
    ],
    ["Demo shop: WORKSHOP-DEMO-01", "Parts consumption tied to job cards"],
    true,
    "SugamFlow Workshop = job cards + parts consumption + vehicle CRM—for Indian garages."
  ),
  autoBrief(
    "AUTO_SERVICE_CENTER",
    "Automobile Service Center",
    "Authorized service center",
    [
      ["Authorized service centres", "OEM-affiliated bays"],
      ["Multi-brand service points", "Several OEM lines"],
      ["Fleet maintenance bays", "Commercial vehicle servicing"],
      ["Service + parts revenue", "Labour and spares on one tenant"],
    ],
    ["Same workshop modules as AUTO_WORKSHOP", "OEM-compliant job tracking"],
    true,
    "SugamFlow Service Center = authorized-style job cards + OEM parts billing + GST."
  ),
  autoBrief(
    "AUTO_DEALER",
    "Automobile Dealer",
    "Vehicle sales showroom",
    [
      ["Vehicle showrooms", "New vehicle sales"],
      ["Used car dealers", "Pre-owned inventory"],
      ["Dealer + service combo", "Sales and after-sales"],
      ["Multi-location dealer groups", "Several showrooms"],
    ],
    ["Demo shop: DEALER-DEMO-01", "Basic dealer billing today; full CRM on roadmap"],
    true,
    "SugamFlow Dealer = showroom billing foundation + workshop module—dealer CRM expanding."
  ),
  autoBrief(
    "AUTO_PARTS_DISTRIBUTOR",
    "Automobile Parts Distributor",
    "Wholesale auto parts distribution",
    [
      ["Parts wholesalers", "Bulk to retailers and workshops"],
      ["Regional distributors", "Territory-based B2B"],
      ["OEM parts depots", "High SKU volume"],
      ["Multi-warehouse auto parts", "Godown network"],
    ],
    ["Demo shop: DIST-DEMO-01", "B2B volume billing with vehicle-owner CRM for workshops"],
    false,
    "SugamFlow Auto Distributor = B2B parts distribution + OEM catalog + multi-godown stock."
  ),
  autoBrief(
    "TYRE_BATTERY_SHOP",
    "Tyre & Battery Shop",
    "Tyre, tube & battery specialist",
    [
      ["Tyre retailers", "Passenger & commercial tyres"],
      ["Battery specialists", "Automotive batteries"],
      ["Tyre + alignment bays", "Product and service mix"],
      ["Highway tyre shops", "Fast fitment billing"],
    ],
    ["Demo shop: TYRE-DEMO-01", "Seasonal SKU and fitment-focused search"],
    false,
    "SugamFlow Tyre & Battery = specialist counter billing + vehicle fitment + stock alerts."
  ),
  autoBrief(
    "AUTO_MULTIBRAND",
    "Multi-Brand Automobile Store",
    "Multi-brand auto parts & accessories",
    [
      ["Multi-brand parts stores", "Several OEM lines one counter"],
      ["Accessories mega-stores", "Parts + car care products"],
      ["Franchise multi-brand", "Central catalog, local stock"],
      ["Urban auto retail", "High SKU diversity"],
    ],
    ["Uses full auto-parts module", "Cross-brand vehicle finder"],
    false,
    "SugamFlow Multi-Brand Auto = one counter for all marques—OEM search + GST billing."
  )
);

function slugify(code) {
  return code.replace(/_/g, "-");
}

function renderMarkdown(brief) {
  const lines = [];
  lines.push(`# SugamFlow — ${brief.title}`);
  lines.push("");
  lines.push("**Client overview & industry comparison**  ");
  lines.push(`**Business type:** \`${brief.code}\` (${brief.subtitle})  `);
  lines.push(`**Entity label:** ${brief.entityLabel}  `);
  lines.push(`**Document version:** ${DOC_VERSION} · **${DOC_MONTH}**`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Executive summary");
  lines.push("");
  lines.push(`**SugamFlow** is a cloud-based operations platform for Indian SMBs. **${brief.title}** (${brief.code}) ${brief.summary.replace(/\*\*/g, "")}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Who is this for?");
  lines.push("");
  lines.push("| Fit | Examples |");
  lines.push("|-----|----------|");
  for (const [fit, ex] of brief.whoFor) {
    lines.push(`| **${fit}** | ${ex} |`);
  }
  lines.push("");
  lines.push(`**Typical users:** Owner, counter staff${brief.entityLabel === "Patients" ? ", doctor/reception (healthcare)" : ""}${brief.entityLabel === "Vehicle owners" ? ", workshop manager" : ""}.`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Daily operations covered");
  lines.push("");
  lines.push("| Area | What SugamFlow does |");
  lines.push("|------|---------------------|");
  for (const op of brief.operations) {
    const parts = op.split("—");
    const area = parts[0].includes("/") ? parts[0].split("/")[0].trim() : parts[0].split(" with")[0].split(":")[0].trim();
    lines.push(`| **${area}** | ${op} |`);
  }
  if (brief.extras.length) {
    lines.push("");
    lines.push("**Also included:**");
    for (const e of brief.extras) {
      lines.push(`- ${e}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Industry software landscape (India)");
  lines.push("");
  lines.push("| Category | Representative products | Typical strength | Typical limitation |");
  lines.push("|----------|-------------------------|------------------|-------------------|");
  for (const c of brief.competitors) {
    lines.push(`| **${c.category}** | ${c.products} | ${c.strength} | ${c.limit} |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Feature comparison — SugamFlow vs industry software");
  lines.push("");
  const header = brief.compareHeader || ["Feature", "SugamFlow", "Alt A", "Alt B", "Alt C", "Alt D"];
  lines.push(`| ${header.join(" | ")} |`);
  lines.push(`|${header.map(() => ":---").join("|")}|`);
  for (const row of brief.compare) {
    lines.push(`| **${row[0]}** | ${row.slice(1).join(" | ")} |`);
  }
  lines.push("");
  if (brief.showBarcodeFootnote) {
    lines.push("### Barcode billing — what “Basic (scan + Enter)” means");
    lines.push("");
    lines.push("| **Included today** | **Not yet (full POS parity)** |");
    lines.push("|--------------------|-------------------------------|");
    lines.push("| Barcode on product catalog; API lookup per shop | Dedicated cashier-only POS screen |");
    lines.push("| **Scan barcode** field on bill—USB gun or keyboard + **Enter** | Weighing-scale / grocery embedded barcodes |");
    lines.push("| Adds line or **merges qty** when same SKU scanned again | Barcode label printer integration |");
    lines.push("| Works in counter mode; auto-parts also has OEM search | Scan beep, hardware drivers, offline scan cache |");
    lines.push("");
    lines.push("*Products must have barcodes loaded; missing/unknown codes show an error at scan time.*");
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push("## Why clients choose SugamFlow");
  lines.push("");
  brief.whyChoose.forEach((w, i) => lines.push(`${i + 1}. ${w}`));
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Included today vs roadmap");
  lines.push("");
  lines.push("| **Included today** | **Roadmap / not full parity yet** |");
  lines.push("|--------------------|-----------------------------------|");
  const maxLen = Math.max(brief.included.length, brief.roadmap.length);
  for (let i = 0; i < maxLen; i++) {
    lines.push(`| ${brief.included[i] || ""} | ${brief.roadmap[i] || ""} |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## One-line pitch");
  lines.push("");
  lines.push(`> ${brief.pitch}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Disclaimer");
  lines.push("");
  lines.push("- Competitor names are **category references**; features and pricing differ by edition.");
  lines.push("- Verify compliance claims (GST, healthcare regulations) before client commitments.");
  lines.push(`- Describes **${brief.code}** profile as of **${DOC_MONTH}**.`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(`**SugamFlow ERP** · Client brief · ${brief.title} · v${DOC_VERSION} · ${DOC_MONTH}`);
  lines.push("");
  return lines.join("\n");
}

function getAllBriefs() {
  return BUSINESS_BRIEFS;
}

function getBriefFilenames() {
  return BUSINESS_BRIEFS.map((b) => ({
    code: b.code,
    md: `SugamFlow-${slugify(b.code)}-Client-Brief.md`,
    pdf: `SugamFlow-${slugify(b.code)}-Client-Brief.pdf`,
    title: `SugamFlow — ${b.title} (Client Brief)`,
    footer: `${b.title} Client Brief`,
  }));
}

module.exports = {
  DOC_VERSION,
  DOC_MONTH,
  getAllBriefs,
  getBriefFilenames,
  renderMarkdown,
  slugify,
};
