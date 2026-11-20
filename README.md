# Infinity Soma Wellness Clinic: website + bookings

Next.js 16 (App Router, Cache Components) + Tailwind CSS v4 + Postgres (Neon in production).

- **Public site:** Home, Treatments, Skincare, Corporate, Training, About, Contact, Book
- **Online booking:** clients pick a treatment, date and time; the slot is held as *pending* until staff confirm
- **Staff dashboard** (`/dashboard`): confirm/decline/cancel bookings, enquiries, treatments & prices, opening hours & closed days, one shared staff password. A session ends after 60 minutes without activity, and an open screen locks itself after the same hour.
- **Clients / record cards** (`/dashboard/clients`): each client's details, health history (with warnings), massage profile with a body map, skincare profile, treatment log, and a consent the client signs with a finger on the signing screen (`/dashboard/sign/<id>`). Health information is special personal information under POPIA: none of it goes in URLs, logs, emails or browser storage.
- **Emails via Resend:** request received (client), new booking (staff), confirmed / declined / cancelled (client), new enquiry (staff)

## Local development

```bash
npm install
cp .env.example .env.local        # set DATABASE_URL (local Postgres or Neon)
npm run db:migrate                # create tables (safe to re-run)
npm run db:seed                   # treatments + placeholder opening hours (never overwrites edits)
npm run password:set                                 # prompts for the shared staff password
npm run dev                       # http://localhost:3000, dashboard at /dashboard
npm test                          # unit tests (slots, prices, emails, record card, signatures)
```

## Going live (Vercel + Neon)

1. Create a Neon project and copy its **pooled** connection string.
2. Run `npm run db:migrate` and `npm run db:seed` against it (`DATABASE_URL=... npx tsx scripts/migrate.mts`, or temporarily point `.env.local` at Neon).
3. Set `SETUP_CODE` in Vercel, then open `/dashboard/setup` on the live site to choose the shared staff password. Change it later from the dashboard's **Password** page; if it's forgotten, reset it from a terminal with `npm run password:set` (pointed at the live `DATABASE_URL`).
4. In Resend, verify the `infinitysoma.co.za` domain and create an API key.
5. In Vercel, set `DATABASE_URL`, `SETUP_CODE`, `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_EMAIL`, then deploy.

## Updating the live database

`npm run db:live` applies database structure changes to production and leaves all content alone. The team owns live prices through the dashboard.

`npm run db:menu` and `npm run db:seed` are for setting up a fresh database only. Run against the live site, they would restore deleted treatments, and `db:menu` would also overwrite the team's prices and hours.

## Where things live

- `src/lib/site.ts`: business details and fixed page copy
- `src/lib/slots.ts`: availability rules (30-min grid, 2h notice, 8 weeks ahead, SAST)
- `src/lib/data.ts`: cached reads of treatments and hours (refreshed when staff edit them)
- `src/app/actions.ts`: public booking + enquiry server actions
- `src/app/dashboard/`: staff dashboard and its server actions
- `src/app/dashboard/clients-actions.ts`, `src/app/dashboard/(app)/clients/`, `src/app/dashboard/sign/`: client record cards, their server actions and the signing screen
- `src/lib/record-card.ts`: record card fields, parsers and health warnings; `src/lib/clients.ts`: record card reads; `src/lib/signature.ts`: signature path rules
- `src/lib/session-rules.ts`: the 60-minute idle limit, shared by the session check and the screen lock
- `db/schema.sql`: database schema. The `bookings_no_overlap` constraint makes double-booking impossible.
- `docs/superpowers/specs/`: design notes
