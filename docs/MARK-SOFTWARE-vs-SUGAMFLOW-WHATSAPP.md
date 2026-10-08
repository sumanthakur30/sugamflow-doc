# Mark Software vs SugamFlow — share sheet _(WhatsApp / email)_

**Verified against current repo** (`shop-management-ui`, `stock-service`, `product-service`). **As of:** 2026-05-14.

**How to share on WhatsApp:** copy everything under **Paste-ready text** (from `*Mark Software vs SugamFlow*` through the compliance bullet). WhatsApp turns `*word*` into **bold**.

---

## Paste-ready text

*Mark Software vs SugamFlow*


• Architecture — Desktop/monolithic vs *Modern microservices + API gateway*

• Cloud support — Limited vs *Full cloud browser app*

• Multi-tenant SaaS — No vs *Yes*

• Docker — No vs *Yes*

• AWS-ready — Typically no vs *Yes (documented deploy path)*

• Subscription billing — License/AMC style vs *Subscription-aware SaaS UX*

• Inventory — Yes vs *Yes*

• Orders — Yes vs *Yes*

• Customers — Yes vs *Yes*

• Staff — Basic vs *Advanced — roles & permissions*

• Mobile-friendly — Limited vs *Responsive web (polish ongoing)*

• Barcode billing — Yes vs *Partial — product barcode + API lookup + billing scan field (Enter) & qty merge*

• GST billing — Strong vs *Partial — shop GST toggle/GSTIN/state; supplier GSTIN; GST on prints*

• Thermal printing — Yes vs *Yes — 80mm-style receipt + standard order print*

• Supplier management — Yes vs *Yes — CRUD under Stock→Suppliers*

• Purchase management — Yes vs *Partial — suppliers live; PO/GRN/full purchase docs next*

• Reports & analytics — Mature vs *Basic / growing*

• Real-time stock sync — Usually limited vs *Yes — centralized stock service*

• Multi-business — No vs *Yes*

• Polyclinic / vertical — Separate vs *Roadmap*

• Scalability — Medium vs *High*

• Modern UI/UX — Legacy vs *Modern web (iterate with users)*


*Why SugamFlow*

• SaaS + multi-shop: one system, many outlets
• Browser access — no installer on every PC
• Microservices — ship UI/API changes independently
• Cloud + Docker aligned with ops you want tomorrow


*Recommended next*

• Deeper *Billing/POS* — faster picking (typeahead), retail parity polish
• *Procurement* — purchase orders & inward tied to suppliers
• *Reporting* — sales/SKU aging & GST summaries
• *Compliance* depth where you commit (e‑invoice/e‑way)

---

## Same comparison as a markdown table _(for decks / PDF / screenshot)_

| Feature | Mark Software | SugamFlow |
|:---|:---|:---|
| Architecture | Traditional desktop/monolithic | Modern microservices + gateway |
| Cloud support | Limited | Full cloud browser access |
| Multi-tenant SaaS | No | Yes |
| Docker | No | Yes |
| AWS ready | No | Yes |
| Subscription | Typical license/AMC | Subscription SaaS UX |
| Inventory | Yes | Yes |
| Orders | Yes | Yes |
| Customers | Yes | Yes |
| Staff | Basic | Advanced (roles & permissions) |
| Mobile-friendly | Limited | Responsive (needs phone polish) |
| Barcode billing | Yes | **Partial** — field + `/products/lookup/barcode` + order scan row |
| GST billing | Yes | **Partial** — GSTIN/context + receipts; deepen statutory flows |
| Thermal printing | Yes | **Yes** — 80mm-style + standard prints |
| Supplier management | Yes | **Yes** — Stock → Suppliers |
| Purchase management | Yes | **Partial** — suppliers; PO/GRN next |
| Reports & analytics | Mature | Basic / evolving |
| Real-time stock sync | No | Yes |
| Multi-business | No | Yes |
| Polyclinic expansion | Rare | Planned |
| Scalability | Medium | High |
| Modern UI/UX | Average | Contemporary (iterate) |

---

## Disclaimer

*Mark-style* means typical legacy retail ERP on desktop — actual product editions differ. Confirm exact claims before client contracts.
