# Infinity Soma Wellness Clinic: website + bookings

Next.js 16 (App Router, Cache Components) + Tailwind CSS v4 + Postgres (Neon in production).

- **Public site:** Home, Treatments, Skincare, Corporate, Training, About, Contact, Book
- **Online booking:** clients pick a treatment, date and time; the slot is held as *pending* until staff confirm
- **Staff dashboard** (`/dashboard`): confirm/decline/cancel bookings, enquiries, treatments & prices, opening hours & closed days
- **Emails via Resend:** request received (client), new booking (staff), confirmed / declined / cancelled (client), new enquiry (staff)

## Local development

```bash
npm install
cp .env.example .env.local        # set DATABASE_URL (local Postgres or Neon)
npm run db:migrate                # create tables (safe to re-run)
npm run db:seed                   # treatments + placeholder opening hours (never overwrites edits)
npm run staff:create -- you@example.com "Your Name"   # prompts for a password
npm run dev                       # http://localhost:3000, dashboard at /dashboard
npm test                          # slot-availability tests
```

## Going live (Vercel + Neon)

1. Create a Neon project and copy its **pooled** connection string.
2. Run `npm run db:migrate` and `npm run db:seed` against it (`DATABASE_URL=... npx tsx scripts/migrate.mts`, or temporarily point `.env.local` at Neon).
3. Create the staff accounts with `npm run staff:create` (Banathi and the receptionist).
4. In Resend, verify the `infinitysoma.co.za` domain and create an API key.
5. In Vercel, set `DATABASE_URL`, `SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_EMAIL`, then deploy.

## Where things live

- `src/lib/site.ts`: business details and fixed page copy
- `src/lib/slots.ts`: availability rules (30-min grid, 2h notice, 8 weeks ahead, SAST)
- `src/lib/data.ts`: cached reads of treatments and hours (refreshed when staff edit them)
- `src/app/actions.ts`: public booking + enquiry server actions
- `src/app/dashboard/`: staff dashboard and its server actions
- `db/schema.sql`: database schema. The `bookings_no_overlap` constraint makes double-booking impossible.
- `docs/superpowers/specs/`: design notes
