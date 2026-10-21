# Multi-page site + bookings dashboard: design

Date: 2026-10-21 · Client: Infinity Soma Wellness Clinic · Builder: Lubelo Tech Solutions

## Intent
Turn the one-page site into a multi-page site where clients book in-clinic treatments online, and clinic staff confirm them from a private dashboard.

## Decided with the user
- Clients **pick a treatment, date and time slot**; the booking is **pending until the clinic confirms**.
- **Resend** emails both staff and client.
- **One client at a time** (single resource). Slots come from opening hours and treatment length.
- Database: **Neon** (Postgres).
- Dashboard users: **the receptionist and Banathi, same access**.
- Pages: Home, Treatments, Skincare, Corporate Wellness, Training, About, Contact, Book.
- Prices and durations unknown → **placeholders, editable from the dashboard**.

## Builder's calls (flag if wrong)
- Hosting on **Vercel**; local development uses a local Postgres with the same schema.
- Driver: `postgres` (postgres.js) over TCP, so the same code runs against local Postgres and Neon's pooled connection string. Plain SQL, no ORM; schema in `db/schema.sql`.
- **Double-booking guard in the database**: a GiST exclusion constraint on the booked time range for `pending` and `confirmed` bookings.
- A **pending booking holds its slot**. Declining or cancelling frees it.
- Slot grid: 30 minutes. Bookable from 2 hours ahead up to 8 weeks out. Times in **Africa/Johannesburg** (UTC+2, no daylight saving).
- **Mobile, corporate and training** requests stay as enquiries (form), stored in the DB and listed in the dashboard, not slot bookings.
- Emails:
  - New booking: client gets "request received", staff get "new booking".
  - Confirm: client gets confirmation.
  - Decline or cancel: client gets a notice with an optional reason.
  - New enquiry: staff get an email.
  - Without `RESEND_API_KEY`, emails are logged to the console.
- Auth: email + password (bcrypt). Sessions are random tokens stored in a DB table, set in an httpOnly cookie, and expire after 30 days. Accounts are created with a seed script, not a sign-up page. Staff can change their own password.
- Dashboard pages:
  - Bookings: pending first, then upcoming; confirm, decline, cancel, mark completed.
  - Treatments: name, category, duration, price, active, description.
  - Opening hours: per weekday, plus closed dates.
  - Enquiries.
  - Account.
- Placeholder opening hours: Mon–Fri 09:00–17:00, Sat 09:00–13:00, Sun closed. Flagged in the dashboard as needing confirmation.
- Prices: nullable. Empty shows "Price on request".
- About page uses only facts from the business profile; no invented names (advisory board described generically).

## Non-goals (for now)
Online payment, client accounts, SMS/WhatsApp automation, multiple therapists/rooms, recurring bookings, roles/permissions.

## Anti-goals
- Two clients booked into the same time.
- A client believing a booking is confirmed when it is only requested.
- Credentials or client data exposed publicly.
