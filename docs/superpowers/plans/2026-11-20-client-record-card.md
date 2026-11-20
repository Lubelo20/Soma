# Client Record Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff fill in the clinic's paper Client Record Card in the dashboard, on a phone or the reception computer, with an on-screen consent signature and a running treatment log.

**Architecture:** A new Clients area in the staff dashboard backed by new Postgres tables. Client details are plain columns; sections 2–4 are saved as JSON answers in an append-only `client_sections` table (newest row per section is current, older rows are the "earlier versions"). Consents are append-only with a snapshot of the card. Field definitions, parsers and warning rules are pure functions in `src/lib/record-card.ts`, so they are unit-tested without a database.

**Tech Stack:** Next.js 16.4 (App Router, Cache Components, server actions), React 19, Tailwind v4, Postgres via `postgres` (camel-case transform), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-client-record-card-design.md`

## Global Constraints

- `AGENTS.md` applies: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
- Code lives in `~/Projects/soma`. Never move it under `~/Documents` (iCloud evicts files).
- Work on branch `client-record-card`. **Do not push** until Task 10's go-live step: pushing `main` deploys production. No production change (`npm run db:live`, push, merge) without the user's confirmation at that step.
- Local development uses `postgres://localhost/infinity_soma` from `.env.local`. Back up `.env.local` before running any `vercel` CLI command that might overwrite it.
- `db/schema.sql` must stay safe to re-run. `@/lib/db` camel-cases columns (`full_name` → `fullName`).
- Every Clients page calls `requireStaff()`. Every Clients **form action** uses `staffCheck()` (Task 3), which returns `{ error: SIGNED_OUT }` instead of redirecting, so typed answers are never lost to a redirect.
- `audit()` entries for clients carry only the event and the client's internal id. Never names, phone numbers or answers. No `console.error` that includes form data or card contents.
- No client data in emails, URLs (other than the internal uuid) or browser storage (`localStorage`, `sessionStorage`, IndexedDB).
- Pages use `export const instant = false;` like the other dashboard pages, and the existing classes (`card`, `field`, `label`, `btn btn-solid`, `page-title`, `eyebrow`, `pill`, `note`, `tab-underline`).
- Delete confirmations use the existing no-JS `<details>` pattern (see the treatments page), not `window.confirm`.
- Consent statements, verbatim:
  1. "I confirm the information provided is accurate and truthful."
  2. "I will inform my therapist of any health changes."
  3. "I understand treatment results vary per individual."
  4. "I understand there are no refunds on services/products."
  5. "I consent to treatment under the therapist's professional judgment."
  6. "I consent to the use of my before and after photos, provided my permission is obtained prior to use."
  Statements 1–5 required; 6 optional and recorded.
- Dashboard idle sign-out: 60 minutes (was 12 hours). The 30-day cookie limit is unchanged.

## Review Focus

1. Session ends mid-card (idle over 60 minutes, or signed out on another device), then staff press Next: the answers stay on screen with the signed-out message, and saving works after signing in again in another tab (Task 6).
2. Connection drops while saving a section on a phone: the action throws, the form shows "Couldn't save. Check your connection and try again." and nothing is cleared (Task 6).
3. Two family members on one phone number: the second card is created after "This is a different person", and each card's bookings list shows the booking's own name (Tasks 5 and 7).
4. A client signs, then staff edit the health history: the card shows "Health history changed since last signed", and the earlier consent's snapshot still shows the old answers (Tasks 7 and 8).
5. The signing screen on a 360px-wide phone: the signature pad fills the width, drawing doesn't scroll the page, and there is no dashboard menu or link to another client (Task 8).

---

### Task 0: Branch and setup

- [ ] **Step 1:** In `~/Projects/soma`, from clean `main`: `git switch -c client-record-card`.
- [ ] **Step 2:** `npm install` (node_modules is not present). Then `npx vitest run`. Expected: all existing tests pass.
- [ ] **Step 3:** Confirm the local database is running: `psql postgres://localhost/infinity_soma -c 'select 1'`. If not, `brew services start postgresql` (or the installed version) and `npm run db:migrate && npm run db:seed`.
- [ ] **Step 4:** Commit the spec and this plan: `git add docs/superpowers && git commit -m "Docs: client record card design and plan"`.

### Task 1: Record card definitions, parsers and warnings

**Files:**
- Create: `src/lib/record-card.ts`, `src/lib/record-card.test.ts`

**Interfaces:**
- Produces (pure, no `server-only`):
  - `HEALTH_CONDITIONS: readonly { key: HealthKey; label: string; noteLabel?: string }[]`, keys in order: `bloodPressure` "High/low blood pressure", `heart` "Heart condition", `diabetes` "Diabetes", `epilepsy` "Epilepsy/seizures", `respiratory` "Asthma or respiratory conditions", `pregnancy` "Pregnancy" (noteLabel "Trimester"), `chronicPain` "Chronic pain/fibromyalgia", `recentSurgery` "Recent surgery (last 6 months)", `injuries` "Joint or muscle injuries", `skinAllergies` "Skin allergies/dermatitis" (noteLabel "Trigger"), `medications` "Medications" (noteLabel "List").
  - `type HealthAnswers = Record<HealthKey, { answer: "yes" | "no" | null; note: string }>`
  - `SKIN_ROWS: readonly { key: SkinKey; label: string; pick: "one" | "many" | "yesno"; options: readonly { value: string; label: string }[]; noteLabel?: string; hasOther?: boolean }[]`:
    - `skinType` "Skin type", one: normal, dry, oily, combination, sensitive
    - `concerns` "Current skin concerns", many: acne, hyperpigmentation, congestion, aging, scarring, texture, skinTags "Skin tags", other (`hasOther`)
    - `allergies` "Allergies to products", yesno, noteLabel "Specify"
    - `sensitivities` "Sensitivities", many: fragrance, essentialOil "Essential oil", acids, retinols
    - `previousTreatments` "Previous skin treatments", many: chemicalPeel, microdermabrasion, dermaplaning, acneFacial, none
    - `homeCare` "Home care products", many: retinol, ahaBha "AHA/BHA", hydrocortisone, benzoylPeroxide "Benzoyl peroxide", spf "SPF", none, other (`hasOther`)
    - `contraindications` "Contraindications present", many: activeAcne, openWounds, photosensitivity, accutane "Accutane", none
  - `type SkinAnswers = Record<SkinKey, { selected: string[]; note: string; other: string }>` (yesno rows use `selected: ["yes"]` / `["no"]` / `[]`)
  - `BODY_AREAS: readonly { id: string; label: string; view: "front" | "back" | "side" }[]`. Front: head, neck, leftShoulder, rightShoulder, chest, abdomen, leftArm, rightArm, leftHand, rightHand, hips, leftThigh, rightThigh, leftKnee, rightKnee, leftShin, rightShin, leftFoot, rightFoot. Back: upperBack, midBack, lowerBack, glutes, leftHamstring, rightHamstring, leftCalf, rightCalf. Side: sideNeck "Side of neck", sideHip "Side of hip", sideLeg "Outer leg". Ids are unique across views.
  - `type MassageAnswers = { areas: string[]; notes: string }`
  - `CONSENT_STATEMENTS: readonly string[]` (the six, verbatim from Global Constraints) and `REQUIRED_CONSENT_COUNT = 5`.
  - `parseHealth(fd: FormData): HealthAnswers` reads `health.<key>` ("yes"/"no") and `health.<key>.note` (max 500).
  - `parseSkin(fd: FormData): SkinAnswers` reads `skin.<key>` (all values), `skin.<key>.note` (max 500), `skin.<key>.other` (max 200). Unknown values dropped. A "one" row keeps only its first valid value. If `none` is selected with other options, `none` is dropped (keeps the real findings).
  - `parseMassage(fd: FormData): MassageAnswers` reads `massage.areas` (unknown ids dropped, de-duplicated, in `BODY_AREAS` order) and `massage.notes` (max 2000).
  - `healthWarnings(card: { health?: HealthAnswers | null; skin?: SkinAnswers | null }): string[]`
  - `areaLabels(ids: string[]): string` e.g. `"Lower back, left shoulder"` (first label as written, the rest lower-cased).
  - `normalizePhone(raw: string): string` digits only; a leading `0` becomes `27`.
  - `isUnder18(dob: string, today: string): boolean` (YYYY-MM-DD strings; false for empty dob).

- [ ] **Step 1: Write the failing tests**

```ts
const fd = (pairs: [string, string][]) => { const f = new FormData(); pairs.forEach(([k, v]) => f.append(k, v)); return f; };

it("parses yes/no and notes, unknown answers become null", () => {
  const h = parseHealth(fd([["health.pregnancy", "yes"], ["health.pregnancy.note", "2nd"], ["health.heart", "maybe"]]));
  expect(h.pregnancy).toEqual({ answer: "yes", note: "2nd" });
  expect(h.heart).toEqual({ answer: null, note: "" });
  expect(Object.keys(h)).toHaveLength(11);
});

it("drops 'none' when real options are also ticked", () => {
  const s = parseSkin(fd([["skin.contraindications", "none"], ["skin.contraindications", "activeAcne"]]));
  expect(s.contraindications.selected).toEqual(["activeAcne"]);
});
it("keeps only the first skin type and drops unknown values", () => {
  const s = parseSkin(fd([["skin.skinType", "bogus"], ["skin.skinType", "dry"], ["skin.skinType", "oily"]]));
  expect(s.skinType.selected).toEqual(["dry"]);
});

it("keeps known body areas in order without duplicates", () => {
  const m = parseMassage(fd([["massage.areas", "lowerBack"], ["massage.areas", "nope"], ["massage.areas", "leftShoulder"], ["massage.areas", "lowerBack"]]));
  expect(m.areas).toEqual(["leftShoulder", "lowerBack"]);
});

it("lists warnings for yes answers, product allergies and contraindications", () => {
  const health = parseHealth(fd([["health.pregnancy", "yes"], ["health.pregnancy.note", "2nd trimester"], ["health.diabetes", "yes"], ["health.heart", "no"]]));
  const skin = parseSkin(fd([["skin.allergies", "yes"], ["skin.allergies.note", "nuts"], ["skin.contraindications", "accutane"]]));
  expect(healthWarnings({ health, skin })).toEqual(["Diabetes", "Pregnancy: 2nd trimester", "Product allergy: nuts", "Contraindication: Accutane"]);
  expect(healthWarnings({ health: null, skin: null })).toEqual([]);
});

it("normalises South African phone numbers", () => {
  expect(normalizePhone("063 880 4946")).toBe("27638804946");
  expect(normalizePhone("+27 (63) 880-4946")).toBe("27638804946");
});

it("knows who is under 18", () => {
  expect(isUnder18("2008-11-21", "2026-11-20")).toBe(true);
  expect(isUnder18("2008-11-20", "2026-11-20")).toBe(false);
  expect(isUnder18("", "2026-11-20")).toBe(false);
});

it("has the six consent statements, five required", () => {
  expect(CONSENT_STATEMENTS).toHaveLength(6);
  expect(CONSENT_STATEMENTS[3]).toBe("I understand there are no refunds on services/products.");
  expect(REQUIRED_CONSENT_COUNT).toBe(5);
});
```

Warning order: health conditions in `HEALTH_CONDITIONS` order, then product allergy, then contraindications in option order. Warning text is the condition label, plus `: <note>` when a note exists.

- [ ] **Step 2:** `npx vitest run src/lib/record-card.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3:** Implement the module.
- [ ] **Step 4:** Same command. Expected: PASS.
- [ ] **Step 5:** Commit: `Record card: field definitions, parsers and health warnings`.

### Task 2: Signature path validation

**Files:**
- Create: `src/lib/signature.ts`, `src/lib/signature.test.ts`

**Interfaces:**
- Produces (pure):
  - `SIGNATURE_VIEWBOX = { width: 600, height: 200 }`
  - `type Point = [number, number]`; `strokesToPath(strokes: Point[][]): string`, giving `"M x y L x y …"` with coordinates rounded to 1 decimal and clamped to the viewbox.
  - `isValidSignaturePath(path: string): boolean`: only `M`/`L` commands with numbers inside the viewbox, at most 60,000 characters, at least 10 points in total.

- [ ] **Step 1: Write the failing tests**

```ts
it("turns strokes into a path", () => {
  expect(strokesToPath([[[1, 2], [3.04, 4.06]], [[700, -5]]])).toBe("M1 2 L3 4.1 M600 0");
});
it("accepts a real signature and rejects junk", () => {
  const path = strokesToPath([Array.from({ length: 12 }, (_, i) => [i * 10, 50] as Point)]);
  expect(isValidSignaturePath(path)).toBe(true);
  expect(isValidSignaturePath("M1 2 L3 4")).toBe(false);            // a dot, not a signature
  expect(isValidSignaturePath(path + " Z")).toBe(false);
  expect(isValidSignaturePath('M1 2"/><script>')).toBe(false);
  expect(isValidSignaturePath("M1 2 L" + "9 9 L".repeat(20000) + "9 9")).toBe(false);
});
```

- [ ] **Step 2:** `npx vitest run src/lib/signature.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same command. Expected: PASS.
- [ ] **Step 5:** Commit: `Record card: signature path helpers`.

### Task 3: Tables, data access, 60-minute sign-out

**Files:**
- Modify: `db/schema.sql`, `src/lib/auth.ts`
- Create: `src/lib/clients.ts` (`server-only`)

**Interfaces:**
- Consumes: Task 1 types and `healthWarnings`, `normalizePhone`.
- Produces:
  - Tables (append to `db/schema.sql`, all `create table if not exists`):
    - `clients`: `id uuid pk default gen_random_uuid()`, `full_name text not null`, `phone text not null`, `phone_digits text not null`, `email text not null default ''`, `id_number text not null default ''`, `date_of_birth date`, `gender text not null default ''`, `address text not null default ''`, `emergency_contact text not null default ''`, `occupation text not null default ''`, `initial_appointment date not null default current_date`, `client_type text not null default 'first' check (client_type in ('first','returning'))`, `created_at`, `updated_at timestamptz not null default now()`. Indexes on `phone_digits`, `lower(email)`, `id_number`, `lower(full_name)`.
    - `client_sections`: `id serial pk`, `client_id uuid not null references clients on delete cascade`, `section text not null check (section in ('health','massage','skin'))`, `answers jsonb not null`, `saved_at timestamptz not null default now()`. Index `(client_id, section, saved_at desc)`.
    - `consents`: `id serial pk`, `client_id uuid … on delete cascade`, `statements jsonb not null` (the exact texts shown), `photo_consent boolean not null`, `initials text not null`, `signature_path text not null`, `snapshot jsonb not null`, `signed_at timestamptz not null default now()`.
    - `therapists`: `id serial pk`, `name text not null`, `active boolean not null default true`.
    - `treatment_entries`: `id serial pk`, `client_id uuid … on delete cascade`, `booking_id uuid references bookings on delete set null`, `day date not null`, `kind text not null check (kind in ('skin','massage'))`, `products text not null default ''`, `notes text not null default ''`, `therapist_id integer references therapists on delete set null`, `created_at`, `edited_at timestamptz`, `deleted_at timestamptz`.
  - `src/lib/auth.ts`: replace `IDLE_HOURS = 12` with `IDLE_MINUTES = 60` and use `make_interval(mins => ${IDLE_MINUTES})` in both places; update the comment. Add `export const SIGNED_OUT = "Your session has ended. Sign in again in a new tab, then press Save here. Nothing you typed has been lost.";` and `export async function staffCheck(): Promise<boolean>` (= `isSignedIn()`).
  - `src/lib/clients.ts`:
    - `type ClientDetails` (the `clients` columns, camel-cased; `dateOfBirth`/`initialAppointment` as `YYYY-MM-DD` strings via `to_char` in queries)
    - `type Card = { client: ClientDetails; health: HealthAnswers | null; massage: MassageAnswers | null; skin: SkinAnswers | null; sectionsSavedAt: Partial<Record<"health"|"massage"|"skin", Date>>; consents: Consent[] /* newest first */; entries: TreatmentEntry[] /* not deleted, newest first */; bookings: MatchedBooking[]; warnings: string[]; changedSinceSigned: boolean }`
    - `type ClientListItem = { id: string; fullName: string; phone: string; lastVisit: string | null; warnings: string[] }`
    - `searchClients(q: string): Promise<ClientListItem[]>`: empty `q` gives the 50 most recently updated; otherwise matches name (`ilike`) or `phone_digits` containing `normalizePhone(q)` when q has ≥4 digits. `lastVisit` = latest treatment entry day.
    - `getCard(id: string): Promise<Card | null>` (returns null for a non-uuid id without querying).
    - `getSectionHistory(id: string): Promise<{ section: string; answers: unknown; savedAt: Date }[]>` and `getDeletedEntries(id: string): Promise<TreatmentEntry[]>`
    - `findDuplicates(input: { phone: string; idNumber: string; excludeId?: string }): Promise<{ id: string; fullName: string }[]>` (by `phone_digits` or non-empty `id_number`)
    - `clientForBooking(bookingId: string): Promise<string | null>` (client id whose `phone_digits` or email matches the booking; newest card if several)
    - `MatchedBooking = { id; ref; treatmentName; startsAt; status; clientName }`, matched where `normalizePhone(client_phone) = phone_digits` (do it in SQL with `regexp_replace`, mirroring `normalizePhone`) or `lower(client_email) = lower(email)` when email is non-empty.
    - `changedSinceSigned` = a health or skin section saved after the newest consent's `signed_at` (false when there is no consent).
    - `listTherapists(includeRemoved = false): Promise<{ id: number; name: string; active: boolean }[]>`

- [ ] **Step 1:** Edit `db/schema.sql`, then `npm run db:migrate` twice. Expected: no errors both times.
- [ ] **Step 2:** Implement `src/lib/clients.ts` and the `auth.ts` change.
- [ ] **Step 3:** `npx tsc --noEmit && npx vitest run && npm run lint`. Expected: clean, all pass.
- [ ] **Step 4:** Smoke-check matching in SQL: insert a client with phone `063 880 4946` and a booking with `+27 63 880 4946`; `select` via the same `regexp_replace` expression. Expected: they match. Delete both rows.
- [ ] **Step 5:** Commit: `Clients: tables, data access, 60-minute dashboard sign-out`.

### Task 4: Therapist names

**Files:**
- Create: `src/app/dashboard/clients-actions.ts` ("use server"), `src/app/dashboard/(app)/clients/therapists/page.tsx`

**Interfaces:**
- Produces in `clients-actions.ts`: `type ClientResult = { error?: string; ok?: boolean; id?: string; values?: Record<string, string> }`; `saveTherapist(prev: ClientResult, fd: FormData): Promise<ClientResult>` (`id` optional, `name` 2–60 chars) and `setTherapistActive(fd: FormData): Promise<void>` (`id`, `active`). Removing sets `active = false`; old entries still show the name by joining.

- [ ] **Step 1:** Implement both actions with `staffCheck()`, `audit("therapist saved" | "therapist removed" | "therapist restored", { id })`, `refresh()`.
- [ ] **Step 2:** Page lists active names with Rename (inline form) and Remove, and a collapsed "Removed" list with Restore. Add form at top.
- [ ] **Step 3:** `npm run dev`, sign in, add "Test Therapist", rename, remove, restore. Expected: each change shows straight away.
- [ ] **Step 4:** Commit: `Clients: therapist names`.

### Task 5: Clients list and new card

**Files:**
- Modify: `src/app/dashboard/(app)/DashboardNav.tsx` (add `{ href: "/dashboard/clients", label: "Clients", icon: "person" }` after Enquiries; active when `pathname.startsWith("/dashboard/clients")`), `src/app/dashboard/clients-actions.ts`
- Create: `src/app/dashboard/(app)/clients/page.tsx`, `src/app/dashboard/(app)/clients/new/page.tsx`, `src/app/dashboard/(app)/clients/DetailsForm.tsx` (client component)

**Interfaces:**
- Consumes: `searchClients`, `findDuplicates`, `staffCheck`, `SIGNED_OUT`, `isUnder18`.
- Produces: `saveDetails(prev: ClientResult, fd: FormData): Promise<ClientResult>`. Fields: `id?`, `fullName` (required, ≥2), `phone` (required, same `PHONE_RE` as `src/app/actions.ts`), `email` (optional, same `EMAIL_RE`), `idNumber`, `dateOfBirth`, `gender`, `address`, `emergencyContact`, `occupation`, `initialAppointment`, `clientType`, `differentPerson` ("on" skips the duplicate check). On a new card with duplicates and no `differentPerson`: returns `{ error: "duplicate", values }` plus the matches in a `duplicates` field (add `duplicates?: { id: string; fullName: string }[]` to `ClientResult`). On success returns `{ ok: true, id }`. Audit `client added` / `client details updated` with `{ id }`.
- `DetailsForm` props: `{ initial: Partial<ClientDetails>; onSaved?: "card" | "next" }`, used again by Task 6's wizard.

- [ ] **Step 1:** Clients page: `?q=` search box (GET form), "New record card" button, "Therapist names" link, list rows showing name, phone, last visit and up to two warnings (`⚠` pill, "+N more"). Empty state: "No record cards yet."
- [ ] **Step 2:** New page: `DetailsForm` with `initialAppointment` = today and `clientType` = first. If `?booking=<uuid>` is given, prefill name, phone and email from that booking.
- [ ] **Step 3:** `DetailsForm` keeps every value in React state (controlled inputs), so a failed save never clears it. It calls the action inside `startTransition` with `try/catch`; a thrown error shows "Couldn't save. Check your connection and try again." `SIGNED_OUT` shows the signed-out message. A duplicate result shows "A card with this phone or ID number already exists" with "Open this card" links and a "This is a different person" button that resubmits with `differentPerson=on`. Under 18 by date of birth shows the note "The clinic doesn't treat clients under 18." (does not block). On success it navigates to `/dashboard/clients/<id>/edit?step=health`.
- [ ] **Step 4:** Manual check in the dev server: create a card, then try another with the same phone (warning, then "different person" works); sign out in another tab and press Save (message, values kept); stop the dev server and press Save (connection message, values kept).
- [ ] **Step 5:** Commit: `Clients: list, search and new record card`.

### Task 6: Card sections (health, massage, skin)

**Files:**
- Create: `src/app/dashboard/(app)/clients/[id]/edit/page.tsx`, `src/app/dashboard/(app)/clients/CardWizard.tsx`, `src/app/dashboard/(app)/clients/BodyMap.tsx`, `src/app/dashboard/(app)/clients/SectionForms.tsx`
- Modify: `src/app/dashboard/clients-actions.ts`

**Interfaces:**
- Consumes: `parseHealth`, `parseSkin`, `parseMassage`, `HEALTH_CONDITIONS`, `SKIN_ROWS`, `BODY_AREAS`, `getCard`, `DetailsForm`.
- Produces: `saveSection(section: "health" | "massage" | "skin", prev: ClientResult, fd: FormData): Promise<ClientResult>`. Inserts a new `client_sections` row only when the parsed answers differ from the newest row for that section (so pressing Next without changes adds no version). Touches `clients.updated_at`. Audit `client section saved` with `{ id, section }`.
- `BodyMap` props: `{ value: string[]; onChange: (ids: string[]) => void }`. Renders three SVG outlines (front, back, side) with tappable regions for every `BODY_AREAS` id (each region a `<button>`-equivalent with `aria-pressed` and the area label), plus the `areaLabels` list underneath. Hidden inputs `massage.areas` carry the values.

- [ ] **Step 1:** Edit page: `requireStaff()`, `getCard` (404 via `notFound()` if null), renders `CardWizard` with the card and `?step=` (`details | health | massage | skin`, default `health`).
- [ ] **Step 2:** `CardWizard`: below `lg`, one section per screen with a step indicator, Back and Next (Next saves, then moves on; the last Next goes to the consent step `/dashboard/sign/<id>`). From `lg` up, all four sections on one page, each with its own Save button, and a "Ready for the client to sign" button at the end. Same save-failure handling as `DetailsForm` (controlled state, `try/catch`, signed-out message).
- [ ] **Step 3:** Health form: each condition is a row with large Yes / No toggle buttons (min 44px tall) and a note input; the note input is labelled with `noteLabel` when present. Skin form: chips for options (radio behaviour for "one", checkbox for "many", Yes/No for "yesno"); ticking "None" clears the row's other chips and ticking another clears "None"; `Other` reveals a text input.
- [ ] **Step 4:** Manual check on a 360px-wide viewport and at desktop width: fill all sections, reload, answers are back. Press Next twice without changes, then check `select count(*) from client_sections where client_id = …`. Expected: no extra rows.
- [ ] **Step 5:** Commit: `Clients: health, massage and skin sections with body map`.

### Task 7: The client's card and treatment log

**Files:**
- Create: `src/app/dashboard/(app)/clients/[id]/page.tsx`, `src/app/dashboard/(app)/clients/[id]/history/page.tsx`, `src/app/dashboard/(app)/clients/TreatmentEntryForm.tsx`
- Modify: `src/app/dashboard/clients-actions.ts`

**Interfaces:**
- Consumes: `getCard`, `getSectionHistory`, `getDeletedEntries`, `listTherapists`, `areaLabels`, `HEALTH_CONDITIONS`, `SKIN_ROWS`.
- Produces:
  - `saveEntry(prev: ClientResult, fd: FormData): Promise<ClientResult>`: `clientId`, `id?`, `day` (YYYY-MM-DD, default today), `kind` (skin/massage), `products` (≤1000), `notes` (≤2000), `therapistId` (must be an active therapist, or empty), `bookingId` (optional, must be one of this client's matched bookings). Editing sets `edited_at = now()`. Audit `treatment entry saved` with `{ id: clientId }`.
  - `deleteEntry(fd: FormData): Promise<void>` sets `deleted_at`; `restoreEntry(fd)` clears it.
  - `deleteClient(fd: FormData): Promise<void>` deletes the client (cascades), audit `client deleted` `{ id }`, redirects to `/dashboard/clients`.

- [ ] **Step 1:** Card page, top to bottom: name and phone (tel and WhatsApp links like the Bookings page); a warnings box listing `card.warnings` (hidden when empty); consent badge: "Consent on file, signed <date>" / "No consent yet: Get signature" (links to `/dashboard/sign/<id>`); "Health history changed since last signed: Get a new signature" when `changedSinceSigned`; then Details, Health, Massage (with `areaLabels`), Skin as read-only summaries, each with an Edit link to the matching `?step=`; Treatments (add form on top, entries newest first with therapist name, "edited" note, Edit, Delete); Bookings (matched bookings with date, treatment, status pill and the booking's client name); Consents (each with date, photo consent yes/no and a "View" `<details>` showing statements, initials, the signature as an inline `<svg>` path, and the snapshot); links "Earlier versions and deleted entries" and "Delete this client" (`<details>` confirmation: "Delete <name>'s record card, consents and treatment entries permanently? Bookings are not affected.").
- [ ] **Step 2:** History page: each saved version of health, massage and skin (newest first, with date), and deleted treatment entries with Restore.
- [ ] **Step 3:** Manual check: add, edit, delete and restore an entry; link one to a booking; delete a test client and confirm its rows are gone from all four tables.
- [ ] **Step 4:** Commit: `Clients: record card view, treatment log and history`.

### Task 8: Signing screen

**Files:**
- Create: `src/app/dashboard/sign/[id]/page.tsx`, `src/app/dashboard/sign/[id]/SignatureForm.tsx`, `src/app/dashboard/sign/layout.tsx` (plain full-screen layout, no `DashboardNav`)
- Modify: `src/app/dashboard/clients-actions.ts`

**Interfaces:**
- Consumes: `CONSENT_STATEMENTS`, `REQUIRED_CONSENT_COUNT`, `strokesToPath`, `isValidSignaturePath`, `SIGNATURE_VIEWBOX`, `getCard`.
- Produces: `signConsent(prev: ClientResult, fd: FormData): Promise<ClientResult>`. Reads `clientId`, `agree` (indexes), `initials` (1–6 letters), `signature` (path). Rejects unless indexes 0–4 are all present: "Please tick statements 1 to 5." Invalid or missing signature: "Please sign in the box." Saves `statements` = `CONSENT_STATEMENTS` (as shown), `photo_consent` = index 5 present, and `snapshot` = `{ details, health, massage, skin }` from `getCard`. Audit `consent signed` `{ id }`. Success redirects to `/dashboard/clients/<id>`.

- [ ] **Step 1:** Layout and page: `requireStaff()`; the client's first name only as heading ("Consent for Thandi"), the six statements as large tick rows (numbered, 6 marked "optional"), initials input, signature pad, a Clear button, and "Sign and finish". A small "Cancel" link back to the card. No other links. The page lives outside `(app)`, so the dashboard menu doesn't render. `src/proxy.ts` already covers `/dashboard/sign/...`.
- [ ] **Step 2:** `SignatureForm`: a `<canvas>` sized to the container width and a 3:1 ratio, drawing with Pointer Events (`touch-action: none` on the canvas so drawing doesn't scroll), strokes stored in viewbox coordinates, `strokesToPath` into a hidden `signature` input on submit. Same failure handling as the other forms.
- [ ] **Step 3:** Manual check on a 360px viewport with touch emulation: drawing doesn't scroll; Clear empties it; submitting without ticks or a signature shows the right message and keeps initials; a successful sign shows the badge on the card. Then edit the health section. Expected: "Health history changed since last signed" shows, and the consent's snapshot still has the old answer.
- [ ] **Step 4:** Commit: `Clients: on-screen consent and signature`.

### Task 9: Bookings link and privacy notice

**Files:**
- Modify: `src/app/dashboard/(app)/page.tsx`, `src/app/(site)/privacy/page.tsx`
- Create: `src/app/dashboard/(app)/clients/from-booking/[bookingId]/route.ts`

**Interfaces:**
- Consumes: `clientForBooking`.
- Produces: GET route that, after `staffCheck()` (redirect to login if false), redirects to `/dashboard/clients/<id>` when a card matches, otherwise `/dashboard/clients/new?booking=<bookingId>`.

- [ ] **Step 1:** On each booking in the Bookings page, add a "Record card" text link (icon `person`) to that route, next to the WhatsApp link row.
- [ ] **Step 2:** Privacy notice: in "What we collect", add an item **"When you visit the clinic:"** your contact details, date of birth, ID or passport number, emergency contact, health and skin history, the treatments you receive, and your signed consent. In "Why we use it", add that health information is used only to treat you safely and is seen only by clinic staff. Keep the page's existing tone and markup.
- [ ] **Step 3:** `npx tsc --noEmit && npx vitest run && npm run lint && npm run build`. Expected: all clean.
- [ ] **Step 4:** Commit: `Clients: open a record card from a booking; privacy notice covers client records`.

### Task 10: Final check and go-live (needs the user)

- [ ] **Step 1:** Run the five Review Focus checks once more end to end in `npm run dev`. Report anything that fails before going on.
- [ ] **Step 2:** `grep -rn "console\.\(log\|error\|info\)" src/app/dashboard/clients-actions.ts src/lib/clients.ts`. Expected: only `audit(...)` lines, none logging form data.
- [ ] **Step 3:** Ask the user to confirm go-live. Tell them: staff will be signed out after 60 idle minutes from now on, and the live database gets five new tables (existing data untouched).
- [ ] **Step 4:** After confirmation: `npm run db:live` (applies `db/schema.sql` to production; content untouched). Expected: no errors.
- [ ] **Step 5:** Merge to `main` and push. Wait for the Vercel deployment, then on the live site: sign in, add "Test Client", fill every section, sign, add a treatment entry, then delete the test client.
