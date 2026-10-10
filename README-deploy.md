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

## Product photos (attribution required)

- `images/valve-bopp-reutter.jpg` — © CEphoto, Uwe Aranas, CC BY-SA 3.0, via Wikimedia Commons
- `images/valve-dn25.jpg` — © RomanM82, CC BY-SA 4.0, via Wikimedia Commons
- `images/valve-schematic.png` — © Mbeychok, CC BY-SA 3.0, via Wikimedia Commons

Attribution footer is on `products.html`. Keep it if the photos are kept.

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
