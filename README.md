# Infinity Soma Wellness Clinic: website

Next.js 16 (App Router) + Tailwind CSS v4, built from the design mockup in `../Main.dc.html`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Where things live

- `src/lib/site.ts`: all business details and page copy (address, phone, services, qualifications, gallery)
- `src/app/page.tsx`: the home page sections
- `src/components/`: header (with mobile menu), enquiry form, icons
- `src/app/actions.ts`: enquiry form server action (emails via Resend when `RESEND_API_KEY` is set; see `.env.example`)
- `public/images/`: photos and logo
