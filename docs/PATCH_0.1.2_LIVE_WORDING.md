# Patch 0.1.2 — presentation-only wording removed (5 Nov 2026)

Rule applied: if the live site will not use a piece of wording, remove it from the presentation site. The live site will use real photographs.

## Removed or neutralised
- Image framing on the home page: "Photorealistic…", "Illustrative…", "Illustrated…" in alt text and notices. Alt text now simply describes the garment or scene. The notice "These are style references, not a record of completed customer projects" is gone.
- Showroom image alt text: "concept view" / "digital concept" removed (about 70 strings in `ttc-integration.js`).
- Legal and policy pages: "provisional business identity and demonstration content", "Provisional business brand … street address pending verification", "Development demonstration", "demonstration website", "seeded demonstration orders", and the claim that images are concept renders or generated stock.
- Portal and customer headers: "DEMONSTRATION ENVIRONMENT", "Fictional test records", "Demo records are labeled", and the sentence about demonstration records and listings.
- Staff screens: "within this demonstration only", "seeded … fictional", "fixture suppliers … fictional", a demo e-mail placeholder.

## Kept on purpose
- **"Colour preview pending" labels**: they appear only when a colour has no image; they vanish once real images are uploaded.
- **Data-driven DEMO badges** in the portal and QMS (shown only for records flagged `demo`).
- **Statements of real commercial limits**: images are not a stock guarantee, colour selectors are preferences, a showroom selection is not an order or quotation.
- **Placeholders awaiting real facts** in legal pages (controller legal name, address, privacy contact, retention schedule, seller and returns details). These need your real details before publishing.
- **`image-credits.html`** (AI-generated concept disclosure and "Provisional branding"): accuracy depends on which images remain. Rewrite or remove it when the real photographs are in.

## Still demo in the data and backend (not wording)
- Seeded demo accounts, jobs, orders, suppliers and stock rows in the database.
- Careers: the API notice "sample demonstration positions".
- `POST /api/v2/orders` creates every order with `demo=true`, so live orders would be labelled demo.
