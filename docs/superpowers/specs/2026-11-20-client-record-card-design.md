# Client record card: design

Date: 2026-11-20 · Client: Infinity Soma Wellness Clinic · Builder: Lubelo Tech Solutions

## Intent
The clinic keeps a paper **Client Record Card** for each client: details, health history, massage and skincare profiles, a running treatment log, and a signed consent page. Staff want to fill it in online instead, in the staff dashboard, while the client is at the clinic. The paper originals (scans, 2026-11-20) are the source for every field and wording below.

## What exists today
- The staff dashboard (`src/app/dashboard/(app)/`) has Bookings, Calendar, Enquiries, Treatments & prices, Specials, Opening hours and Password tabs, listed in `DashboardNav.tsx`. It is phone-friendly: tiles on phones, a sidebar on desktop.
- There is one shared staff password (`src/lib/auth.ts`). A session lasts 12 hours of inactivity (`IDLE_HOURS`) and at most 30 days.
- Every staff change is written to the hosting logs with `audit()` in `src/app/dashboard/actions.ts`, without client details.
- There is no "client" in the system. Each booking holds its own name, phone and email.
- Database: Postgres (Neon); the schema is in `db/schema.sql` and is safe to re-run. `npm run db:live` applies schema changes to production.
- Posters are stored in public Vercel Blob storage. Nothing in this feature uses Blob.

## Goals
1. A **Clients** tab in the dashboard: search clients, open a client's card, start a new card.
2. Staff fill in sections 1–4 of the paper card with the client present, on a phone or the reception computer.
3. The client agrees to the consent statements and signs with a finger on screen. The card keeps the signature and when it was signed.
4. On every visit, staff add a treatment entry (section 5) to the client's card.
5. Health warnings (any "Yes" in the health history, pregnancy, allergies, contraindications) show at the top of the card and in the client list, so a therapist sees them before treating.
6. A client's card shows that client's online bookings, matched by phone or email.

## Non-goals
- Clients filling in the card themselves, online or before their visit.
- Before and after photos. The consent statement about photos stays as worded, but nothing is uploaded. This may come later.
- Individual staff logins or a record of who viewed a card. The user chose to keep the shared password.
- Capturing old paper cards. A client gets an online card on their next visit.
- Emailing clients a copy of the card or consent.
- Printing or exporting cards (can come later).
- Clients under 18. The clinic doesn't treat them, so there is no parent or guardian consent. If a date of birth entered makes the client under 18, the form shows a warning (builder's call); it doesn't block saving.

## Anti-goals
- Medical details reachable by anyone who is not signed in to the dashboard, including through a guessable link, a public file, an email or the hosting logs.
- A consent signature that can't be tied to the exact wording the client agreed to.
- A form that is tiring to fill in on a phone standing beside the client.
- Losing what was typed because the session ran out or the connection dropped mid-card.
- A therapist missing a health warning because it's buried in a section.

## Decided with the user
- Staff fill in the card at the venue. The client does not use their own device.
- It is used on both staff phones and the reception computer.
- Shared dashboard password stays. No individual logins.
- No photos for now.
- Built inside the existing dashboard and database (approach 1 below).

Proposed and not objected to:
- A short list of therapist names, managed in the dashboard, used in the treatment log's "Therapist" dropdown.
- The dashboard's idle sign-out drops from 12 hours to about 1 hour, because a signed-in phone would now expose medical details. This applies to the whole dashboard.
- The consent wording is fixed, word for word from the paper form.
- Health history can be updated on later visits, and the card shows when it was last updated.

## Approaches
1. **Inside the existing dashboard (chosen).** A Clients tab using the site's own database. Pros: one password and one place for staff, no extra monthly cost, links to bookings, the clinic controls where medical data lives. Cons: the most build work, roughly the size of the bookings feature.
2. **A ready-made form service** (Jotform, Google Forms with signatures). Pros: quick, no code. Cons: a second login, health data held by an overseas company, poor fit for an ongoing treatment log and searchable client list, no link to bookings, monthly cost.

Approach 2 covers half the paper card at best and moves medical data out of the clinic's control, so approach 1 was chosen.

## The card: fields

### 1. Client information
Full name (required), date of birth, ID/passport number, gender, phone (required), email, physical address, emergency contact name and number, occupation, date of initial appointment (defaults to today), client type (first time / returning; new cards default to first time).

### 2. Medical and health history
Each condition: Yes / No and a note.
High/low blood pressure · heart condition · diabetes · epilepsy/seizures · asthma or respiratory conditions · pregnancy (note labelled "Trimester") · chronic pain/fibromyalgia · recent surgery (last 6 months) · joint or muscle injuries · skin allergies/dermatitis (note labelled "Trigger") · medications (note labelled "List").

### 3. Massage treatment profile
- Areas of tension or discomfort, marked by tapping regions on front, back and side body outlines. The selected areas also show as a plain list (for example "Lower back, left shoulder"), so they read clearly without the picture.
- Additional notes (free text).

### 4. Skincare profile
Each row: options plus a notes field.
- Skin type, pick one: normal, dry, oily, combination, sensitive.
- Current skin concerns, any: acne, hyperpigmentation, congestion, aging, scarring, texture, skin tags, other (text).
- Allergies to products: yes / no, specify.
- Sensitivities, any: fragrance, essential oil, acids, retinols.
- Previous skin treatments, any: chemical peel, microdermabrasion, dermaplaning, acne facial, none.
- Home care products, any: retinol, AHA/BHA, hydrocortisone, benzoyl peroxide, SPF, none, other. The paper form shows "Benzoyl" and "Peroxided" as two boxes; this is one product.
- Contraindications present, any: active acne, open wounds, photosensitivity, Accutane, none.

"None" clears the other options in its row.

### 5. Treatment record (continuous use)
A list on the card, newest first. Each entry: date (defaults to today), treatment type (skin / massage), products and tools used, notes and skin response, therapist (from the names list). Optionally linked to one of the client's bookings. Entries can be edited and deleted.

### 6. Client consent and agreements
The six statements, worded exactly as on the paper form (spelling corrected):
1. I confirm the information provided is accurate and truthful.
2. I will inform my therapist of any health changes.
3. I understand treatment results vary per individual.
4. I understand there are no refunds on services/products.
5. I consent to treatment under the therapist's professional judgment.
6. I consent to the use of my before and after photos, provided my permission is obtained prior to use.

The client ticks each, types their initials and signs on screen. Statements 1–5 are required to save the consent. Statement 6 is optional, and the card records whether it was given. The date and time are recorded automatically. A saved consent can't be edited. If something changes, the client signs a new consent, and the card keeps earlier ones.

## Staff behaviour
- **Clients tab** in `DashboardNav`: a search box (name or phone) and a list showing name, phone, last visit and health warnings. "New record card" button.
- **New card on a phone:** one section per screen with Next and Back. Big Yes/No buttons. Consent is the last step. Each section saves when staff move on, so nothing is lost if the phone locks or the session ends.
- **On the reception computer:** the same card on one longer page.
- **Signing at the computer:** awkward with a mouse, so staff can open that card's consent step on a phone and have the client sign there.
- **Client's card:** health warnings at the top, then tabs or sections for details, health, massage, skin, treatments and consent. A consent badge shows whether a current consent is on file.
- **Bookings link:** the card lists the client's bookings by matching phone or email. From a booking in the Bookings tab, staff can open the matching card or start one with that booking's details filled in.
- **Duplicates:** when starting a card, if a client with the same phone or ID number exists, staff are shown that card instead of creating a second one.
- **Therapists:** a small list of names managed in the dashboard (add, rename, remove; removed names still show on old entries).

## Privacy and security (POPIA)
Health information is special personal information under POPIA.
- Every Clients page and action calls `requireStaff()`. Cards are found by internal IDs, never by name or phone in the URL.
- Audit log entries say what kind of change happened and the card's internal ID, never names or health details.
- Error messages and logs never include card contents.
- No card data is sent by email.
- The website's privacy notice (`/privacy`) is updated to say the clinic keeps client records, including health information, for treatment purposes.
- Deleting a client removes their card, consents and treatment entries. Bookings are unaffected.

## Builder's calls (from the design review, for the user to check)
- **Current consent:** a consent stays current until a newer one is signed. No expiry. Each consent keeps a copy of the card's answers (sections 1–4) at the moment of signing, so it is clear what the client confirmed. Editing the card later doesn't clear the badge, but the card shows "Health history changed since last signed" so staff can ask for a fresh signature.
- **Signing screen:** signing opens a full-screen view with only the statements, initials and signature pad: no dashboard menu, no links to other clients. "Done" returns to that client's card. To sign on a phone after filling in the card at the computer, staff sign in on the phone, search for the client and open their consent step. No signing links or QR codes, so every page still needs a staff sign-in.
- **Losing typed answers:** nothing is stored in browser storage, so no health details stay on a shared phone. Each section saves to the server when staff move on. Activity keeps the session alive. If a save fails because the session has ended or the connection dropped, the answers stay on screen with a message to sign in again (in another tab) or retry, and nothing is cleared.
- **Earlier versions:** health history and skincare answers keep their previous versions when edited, viewable from the card ("Earlier versions"). Treatment entries record when they were last edited. A deleted entry is hidden rather than erased, and staff can still see it under "Deleted entries".
- **Duplicates:** a matching phone or ID number shows a warning with the existing card and an "Open this card" button. Staff can still choose "This is a different person", because family members often share a phone. The card's bookings list is matched by phone or email and shows the name on each booking, so a parent's bookings on a shared number are easy to spot.

## Left to the builder
- Table layout (a `clients` table with searchable core fields, plus section answers stored as JSON, and separate tables for treatment entries, consents and therapists is the suggested shape).
- How the signature is stored (a small image or the stroke data, kept in the database rather than Blob).
- The body outline drawing and its tappable regions.
- Exact screen layouts, following the existing dashboard style.
- Whether the idle sign-out is exactly 1 hour or close to it.
