# NanoTech Laps — static site: deploy notes

Self-hostable static site for nanotechlaps.com (replaces the GoDaddy Website Builder page).
No build tools, no backend: plain HTML/CSS/JS. Any static host works.

## PRICING TO CONFIRM — placeholder inventory

All price lines use `$XX` tokens. Replace them with David's real numbers before launch:

- `products.html` line ~113: Finishing Ladder Kit (1000 + 1500 + 2000 + 4000, 4 syringes) — `$XX` per kit
- `products.html` line ~114: Bulk syringes — 10g `$XX`, 20g `$XX`
- `products.html` line ~115: Repeat-grit multipacks — 5× `$XX`, 10× `$XX`
- Paste line items in the configurator are spec'd in the quote email (no per-line price on the site).

Also awaiting David's confirmation: glass lap price table (products page), "Made in USA" claim,
phone number and return address on the contact page.

Market anchors gathered 2026-10-10 (typical retail, for positioning only — not our prices):
- Economy 5 g diamond paste syringe: ~$11 each, grits 320–10 000 (rubblerockandgem.com)
- TechDiamondTools: 3-syringe sets $16–22, 5-syringe $28–34.50, 12-syringe $63–78
- Lapping film, 6×9 in, 25 sheets: ~$32 (Gesswein catalog)
- Lapmaster Wolters: quote-only consumables, no published prices, no glass laps, no finishing kit

## Deploy on GoDaddy (shared hosting, cPanel)

1. cPanel → File Manager → `public_html` (or FTP to it with the Hosting Control Center account).
2. Upload the **contents** of this folder (not the folder itself): `index.html`, `products.html`,
   `configurator.html`, `contact.html`, `css/`, `js/`, `images/`.
3. `index.html` then serves at `https://nanotechlaps.com/`. Enable the free SSL in cPanel if not on.
4. Cancel the GoDaddy Website Builder subscription only after the site is live and checked.

## Shipping wording (client rule)

Site copy says only: "shipped via UPS or PirateShip, with tracking." Do NOT describe how
items are packaged (no crating/foam/box/bubble-wrap details) and do not expose carrier
selection. Keep it that way in any future copy edits.

## Configurator URL presets (product-page buttons)

Every product-page CTA deep-links into `configurator.html` with the spec preloaded:
`?shape=round|square|rectangle&size=6&length=8&width=6&thickness=3/8&glass=frosted|clear&grit=600&paste=kit|tin|syringe|multipack|none&paste_grit=1000`
Unknown/missing values fall back to form defaults silently. Paste presets add one paste line
(mix-and-match: users can add more lines in the form).

## Finishing Ladder Kit (hero product)

Sells **as-is** — NO grit/size/pack selection in the configurator. The kit is a fixed
4-syringe set: 1000 + 1500 + 2000 + 4000 grit. In the configurator, selecting the kit
hides the grit/size/pack fields (only the kit line shows). Preset deep-link:
`configurator.html?...&paste=kit` (no paste_grit needed). The quote email line reads
"Finishing Ladder Kit (1000 + 1500 + 2000 + 4000 grit, 4 syringes)".

## Session handoff (for the next session)

- **Working dir:** `/home/chad/Desktop/MauriceVault/Zuppo/nanotech-site/`
- **Live preview:** https://crystalmethchristian.github.io/nanotechlaps/ (GitHub Pages)
- **Repo:** crystalmethchristian/nanotechlaps, branch main. Push with `git push -q origin main`.
- **Pages:** index.html, products.html, configurator.html, contact.html. Plain HTML/CSS/JS, no build tools (GoDaddy shared hosting).
- **Brand palette (locked):** #175EF8 (blue), #F0DC2A (gold), #000000 (dominant bg). Tagline "MAKE IT POP."
- **Quote flow:** mailto:Zuppo1976@yahoo.com, prefilled subject/body. No backend.
- **ABSOLUTE RULES:**
  - All NanoTech prices = `$XX` placeholders. NEVER invent real prices.
  - Shipping wording only: "shipped via UPS or PirateShip with tracking." Never expose packaging/shipping method detail.
  - Custom sizes not in the hosted dropdown → direct-email flow, note longer lead time + higher cost.
  - NO competitor brand names (Maxiflow, Consolidated, Farris, Bopp & Reutter) — describe valve types generically. Competitor names only in factual comparison/pricing context.
  - NO "diamond paste" for our product — it's "NanoTech diamond-equivalent lapping paste."
  - Images must be free-use (public domain or CC) with attribution footer on products.html.
- **API 526 / DN spec table** is on products.html (orifices 1D2–8T10, areas, inlet/outlet, DN25–DN200).
- **Home hero:** copy only (size disc removed per client).
- **PRODUCTS, NOT A SERVICE:** NanoTech sells lapping glass + paste/consumables. Customers do the lapping themselves. Never imply NanoTech performs the lapping as a service ("we lap your valve seat", "have it lapped", "send us your part"). The API 526 / DN table is reference data showing what valve sizes our laps are cut to match — not a service menu.
- **Customers:** gunsmithing, optics/watch, relief valve nozzles, automotive engine rework, stone/glass art, knife/tool, shop plates/CNC.
- **Pricing to confirm:** see PRICING TO CONFIRM block below.
- **Next steps likely:** real product photos (nozzles, discs, thermal disc), David sets real prices, GoDaddy deploy to nanotechlaps.com.

## Product photos (attribution required)

All free-use, via Wikimedia Commons. Attribution footer is on `products.html` — keep it if the photos are kept.

- `images/navy-valve-seat.jpg` — U.S. Navy (public domain), photo by MCS2 Christopher Dollar
- `images/valve-dn25.jpg` — © RomanM82, CC BY-SA 4.0
- `images/valve-schematic.png` — © Mbeychok, CC BY-SA 3.0 (generic relief-valve cross-section, not a manufacturer diagram)
- `images/surface-damaged.jpg` — CC0 (public domain)
- `images/surface-lapped.jpg` — © Bestemrc, CC BY-SA 4.0

## API 526 / DN spec table (products page)

The "Standard relief valve sizes we lap to" table lists API 526 standard orifice
designations (1D2 … 8T10), effective areas, typical inlet/outlet, and common DN size.
Values are the standard's published effective areas (factual reference data — safe to
reproduce). The DN column is a convenience mapping (DN25=1" … DN200=8").

## Legal notes (client rule — check before adding any brand names)

- **Maxiflow / Consolidated / Farris:** do NOT use these brand names on the site. They are
  competitors' trademarks; a small shop has no need to invoke them. We describe the valve
  type generically ("spring-loaded pop-off valve", "full-bore relief valve") instead.
- **Schematics:** only generic, unbranded cross-sections. Never a specific manufacturer's
  product diagram, part numbers, or rendering.
- **API 526:** fine to reference — it's an industry standard and the data is factual.
  Don't claim API certification or ASME-stamped work.
- **Competitor names (Lapmaster Wolters, Gesswein, Rubble Rock & Gem, TechDiamondTools):**
  used only in factual comparison/market-anchor context. Keep comparisons factual, no
  disparagement, no "we are X" claims.
- **Photos:** only public-domain or CC-licensed images with attribution. No competitor
  product photos.
- **No "diamond paste"** for our product (see Naming rule below).

## Naming rule

Our paste is "NanoTech diamond-equivalent lapping paste" / "nano-crystalline lapping
compound." Never call our product "diamond paste." The word "diamond" may appear only in
competitor market-reference lines (e.g. "competitor diamond-grade pastes retail ~$11").

## Known limitation: the quote flow

"Request Quote" opens a `mailto:` link to Zuppo1976@yahoo.com prefilled with the full spec —
it needs the visitor to have a mail client configured. No orders are stored anywhere.

Upgrade path if that is too lossy: Formspree (drop-in form endpoint, free tier) or GoDaddy's
own Web Form widget pointed at a script host. The configurator already assembles the complete
plain-text summary — only the send target has to change (one function in `js/configurator.js`).
