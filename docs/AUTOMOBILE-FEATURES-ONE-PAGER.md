# SugamFlow Automobile — One-Page Sales Summary

**Print this page** · June 2026 · For field sales & shop-owner meetings

---

## Who is it for?

| Shop type | Hindi | Demo login |
|-----------|-------|------------|
| Spare parts counter | स्पेयर पार्ट्स दुकान | `AUTO-DEMO-01` / `demo` / `Demo@2026` |
| Garage / workshop | वर्कशॉप / गैरेज | `WORKSHOP-DEMO-01` |
| Tyre & battery | टायर व बैटरी | `TYRE-DEMO-01` |
| Parts distributor | थोक वितरक | `DIST-DEMO-01` |
| Vehicle dealer* | डीलर (*basic) | `DEALER-DEMO-01` |

Login → **Shop owner mode** → **Show demo login card** on login screen.

---

## Top 10 selling points

1. **OEM + barcode counter billing** — scan or type part number; GST bill in seconds  
2. **Vehicle-wise parts search** — Maruti Swift 2023 → only compatible parts  
3. **Full spare parts master** — OEM no., brand, HSN/GST, shelf location, low-stock alert  
4. **Purchase order → GRN → stock** — supplier PO, goods receipt, batch & cost  
5. **Workshop job cards** — reserve parts on job; auto-consume when job closes  
6. **Warranty & core returns** — track claims and deposit (core) parts  
7. **Vehicle owner CRM** — customers linked to registration numbers  
8. **Multi-user staff** — counter boy, storekeeper, manager — role permissions  
9. **Works on phone & tablet** — counter and stock usable on mobile browser  
10. **India GST ready** — HSN, GST %, inclusive pricing on bills  

---

## What you can demo in 15 minutes

| Step | Screen | Show |
|------|--------|------|
| 1 | `/auto-parts` | Dashboard & quick links |
| 2 | `/auto-parts/finder` | Search parts by vehicle or OEM number |
| 3 | `/auto-parts/counter` | Bill 2–3 parts with GST |
| 4 | `/products` | Part master with OEM & fitment |
| 5 | `/stocks/purchase-orders` | Open PO → receive stock (if seeded) |
| 6 | `/auto-parts/workshop` | Job card with parts (workshop demo shop) |

**Seed demos:** `.\scripts\seed-automobile-demo.ps1`

---

## Included vs not included (be honest)

| Included today | Not yet |
|----------------|---------|
| Counter POS, orders, print | Dealer CRM (leads, booking, delivery) |
| PO, GRN, suppliers, stock | VIN auto-decode |
| Workshop job cards | Native Android/iOS app |
| Warranty & core tracking | Online payment at signup |
| Excel product import | TecDoc/OEM catalog feed |
| Low-stock alerts | Inter-warehouse transfer |

---

## Pricing conversation (template)

- **Subscription:** Monthly or yearly (configured per shop)  
- **Setup:** Shop onboarding + owner login invite  
- **Training:** 1–2 sessions on counter + stock + PO  
- **Support:** Web app; no offline mode  

---

## Contact & next steps

1. Owner agrees → collect shop name, mobile, GST (optional), shop type  
2. Register at `/register` (Automotive) **or** super admin creates shop  
3. Owner sets password → lands on **Auto Parts** home  
4. Optional: import parts Excel or start with manual entry  

**Full feature list:** `docs/AUTOMOBILE-FEATURES.md`  
**Demo setup:** `docs/AUTOMOBILE-DEMO-SETUP.md`  
**Salesman phone demo:** `docs/FIELDFORCE-DEMO-LOGIN-CARD.md`

---

*SugamFlow — Automobile spare parts, workshop & distribution software*
