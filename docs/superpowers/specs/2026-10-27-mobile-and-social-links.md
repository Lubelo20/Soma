# Mobile polish + social links: work record

Date: 2026-10-27 · Commit: 3d95817 · Live: https://soma-sigma-wine.vercel.app

## Done

- Header keeps a compact "Book" button on phones; wordmark shrinks slightly and stays on one line (fits 360px).
- Mobile menu ends with a tap-to-call line and social icons.
- One `socials` list in `src/lib/site.ts` (Instagram, WhatsApp) feeds the footer icon row,
  the Contact page "Follow us" row, the mobile menu and the JSON-LD `sameAs`.
- Section padding and grid gaps reduced on small screens only (home page ~8490px → ~8050px tall).
- Form fields use 16px text on phones so iOS Safari does not zoom on focus.
- Underlined text links have a larger invisible tap area (no visual change).
- Booking date picker fits four dates per row on 360–390px phones.

Checks: `tsc`, `eslint`, `vitest` (6 slot tests) all pass. Verified visually at 360px and 390px.

## Pending from the client

- Facebook and TikTok links → uncomment and fill the entries in `socials` (`src/lib/site.ts`).
- Real domain, then `SITE_URL`, domain connection and Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_EMAIL`).
- Real prices, durations and opening hours (placeholders live now, editable from the dashboard).
- Higher-resolution hero photo.
- First staff account via `/dashboard/setup` with `SETUP_CODE` (live DB still has 0 staff).

## Deploy note

The push to `main` on 2026-10-27 triggered Vercel's automatic production build on its own.
Next time: push, check `vercel ls soma`, and only run `vercel --prod --yes` if no build appears.
