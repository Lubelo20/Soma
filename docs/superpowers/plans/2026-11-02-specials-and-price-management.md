# Specials Pop-up + Price Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clinic staff manage prices (including permanent delete) and run on/off poster specials that visitors can see in a pop-up and book from.

**Architecture:** Specials are `treatments` rows with `category = 'special'` and a `poster_url`, so availability, `/book?treatment=<id>` and cache invalidation are reused. Posters live in Vercel Blob and are uploaded directly from the browser. Bookings copy a special flag and the package price, so later edits or deletion don't change what the client was told.

**Tech Stack:** Next.js 16.4 (App Router, Cache Components), React 19, Tailwind v4, Postgres via `postgres`, `@vercel/blob`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-02-specials-and-price-management-design.md`

## Global Constraints

- `AGENTS.md` applies: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
- Work on branch `specials-and-prices`. **Do not push until Task 7's approved go-live step:** pushing `main` deploys production.
- No production change (Blob store, migration, price check, push) without the user's confirmation at that step.
- `db/schema.sql` must stay safe to re-run. `@/lib/db` camel-cases columns (`poster_url` → `posterUrl`).
- Every staff action calls `requireStaff()`, writes `audit()`, and calls `updateTag("treatments")` + `refresh()` if it changes treatments.
- Delete confirmation uses the existing no-JS `<details>` pattern from `ReasonAction` in `BookingActions.tsx`, not `window.confirm`.
- Client wording, verbatim wherever a special is booked: **"This books your first session. The clinic will arrange the rest of your package with you."**
- Poster limits: JPG or PNG, maximum 10 MB. Minutes 10–480.

## Review Focus

1. A real phone PNG over 4.5 MB uploads successfully; an oversized or HEIC file gives a clear error and keeps what was typed (Task 4).
2. Blocked or throwing browser storage: the pop-up still opens and closes and the site doesn't crash (Task 5).
3. Only one special on: no arrows or dots, and the pop-up doesn't look broken (Task 5).
4. A special deleted while its booking is pending: the confirmation email still carries the wording and price (Task 3, verified in Task 7).
5. Adding "Specials" to the menu doesn't wrap or overflow the desktop header at exactly 1024px (Task 6).

---

### Task 0: Branch

- [ ] **Step 1:** From clean `main`, run `git switch -c specials-and-prices`.
- [ ] **Step 2:** Commit the spec and this plan: `git add docs/superpowers && git commit -m "Docs: specials and price management design and plan"`.

### Task 1: Price parser and comma fix

**Files:**
- Create: `src/lib/price.ts`, `src/lib/price.test.ts`
- Modify: `src/app/dashboard/actions.ts` (`saveTreatment`)

**Interfaces:**
- Produces: `parsePriceCents(raw: string): { ok: true; cents: number | null } | { ok: false }`. Empty input gives `cents: null`.

- [ ] **Step 1: Write the failing test**

```ts
it.each([
  ["450", 45000], ["1462,5", 146250], ["1462,50", 146250], ["1462.50", 146250],
  ["R1 462,50", 146250], ["r 450", 45000], ["1,462.50", 146250], ["1 462", 146200],
  ["1,462", 146200], ["1 462,50", 146250], ["0", 0],
])("parses %s", (raw, cents) => expect(parsePriceCents(raw)).toEqual({ ok: true, cents }));

it.each(["", "  ", "R"])("treats %j as no price", (raw) => expect(parsePriceCents(raw)).toEqual({ ok: true, cents: null }));

it.each(["abc", "1,2,3", "1.2.3", "1.462", "1462,505", "-5", "12x", "4,50,00"])(
  "rejects %s", (raw) => expect(parsePriceCents(raw)).toEqual({ ok: false }));
```

`"R"` counts as no price because stripping the currency marker leaves nothing.

- [ ] **Step 2:** Run `npx vitest run src/lib/price.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `parsePriceCents` in `src/lib/price.ts`.** Strip a leading `R` and all whitespace (including NBSP). Then accept only: plain digits; digits with a final `[.,]\d{1,2}`; or `\d{1,3}(,\d{3})+` optionally followed by `.\d{1,2}`. Calculate cents without floating-point drift. The file is pure, with no `server-only`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** In `saveTreatment`, replace the `priceRaw` handling with `parsePriceCents`. On `ok: false` return `{ error: "Price must be a number, e.g. 450 or 450,50." }`.
- [ ] **Step 6:** Run `npx tsc --noEmit && npx vitest run`. Expected: clean, all pass.
- [ ] **Step 7:** Commit: `Prices: accept comma decimals instead of multiplying them`.

### Task 2: Delete treatments; scripts stop touching live prices

**Files:**
- Modify: `src/app/dashboard/actions.ts`, `src/app/dashboard/(app)/treatments/page.tsx`, `scripts/apply-menu.mts`, `package.json`, `README.md`

**Interfaces:**
- Produces: server action `deleteTreatment(fd: FormData): Promise<void>` reading `id`.

- [ ] **Step 1:** Add `deleteTreatment`. SQL: `delete from treatments where id = ${id} and category <> 'special'`. Audit `treatment deleted`.
- [ ] **Step 2:** In `TreatmentRow`, below `TreatmentEditor`, add a `<details>` Delete control. Confirmation text: "Delete {name} permanently? Past bookings keep their details. To remove it temporarily, untick Show on website instead." Red submit button: "Delete treatment". The page stays a server component.
- [ ] **Step 3:** In `package.json`, change `db:live` to run `scripts/migrate.mts` only, still removing `.env.production.local` afterwards.
- [ ] **Step 4:** In `apply-menu.mts`, add `and category <> 'special'` to the hide query so it can never hide specials. In the README, note that `db:menu` and `db:seed` are for fresh databases only, because they would restore deleted treatments.
- [ ] **Step 5: Verify locally** with `npm run dev`. Create a test treatment, book it through `/book`, delete it. Expected: it's gone from `/treatments` and the booking form, and the booking still shows its treatment name at `/dashboard?view=all`.
- [ ] **Step 6:** Commit: `Dashboard: delete treatments; db:live no longer overwrites prices`.

### Task 3: Schema, specials data and booking wording

**Files:**
- Create: `src/lib/special-copy.ts`, `src/lib/special-copy.test.ts`
- Modify: `db/schema.sql`, `src/lib/data.ts`, `src/app/actions.ts`, `src/lib/email.ts`, `src/app/dashboard/actions.ts` (`updateBooking`), `src/app/(site)/book/page.tsx`, `src/components/BookingForm.tsx`, `src/app/dashboard/(app)/page.tsx`, `src/app/dashboard/(app)/treatments/page.tsx`

**Interfaces:**
- Produces, in `data.ts`:
  - `Treatment.category` gains `"special"`; `Treatment` gains `posterUrl: string | null`.
  - `type Special = { id: number; name: string; durationMin: number; priceCents: number; posterUrl: string }`.
  - `getActiveSpecials(): Promise<Special[]>`: cached, tag `treatments`, `order by created_at desc, id desc`, explicit columns only.
- Produces, in `special-copy.ts` (pure):
  - `FIRST_SESSION_NOTE` (the verbatim wording).
  - `clientSpecialLines(priceLabel: string): string` and `staffSpecialLines(priceLabel: string): string`.
- Produces: `BookableTreatment` gains `special: boolean`. `BookingState.booking` gains `specialPrice?: string`.
- DB: `treatments.poster_url text`; `bookings.is_special boolean not null default false`; `bookings.booked_price_cents integer`.

- [ ] **Step 1: Write the failing test**

```ts
expect(FIRST_SESSION_NOTE).toBe("This books your first session. The clinic will arrange the rest of your package with you.");
expect(clientSpecialLines("R1 489")).toContain("Package price: R1 489");
expect(clientSpecialLines("R1 489")).toContain(FIRST_SESSION_NOTE);
expect(staffSpecialLines("R1 489")).toContain("SPECIAL");
expect(staffSpecialLines("R1 489")).toContain("R1 489");
expect(staffSpecialLines("R1 489")).toContain("arrange the remaining sessions");
```

- [ ] **Step 2:** Run `npx vitest run src/lib/special-copy.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `special-copy.ts`. Run the test. Expected: PASS.
- [ ] **Step 4:** In `schema.sql`, add the columns with `add column if not exists`. Replace the category check idempotently: `alter table treatments drop constraint if exists treatments_category_check;` then add it allowing `'wellness', 'skincare', 'special'`.
- [ ] **Step 5:** Run `npm run db:migrate` twice against local. Expected: both succeed.
- [ ] **Step 6:** Add `getActiveSpecials`. Exclude specials from the Treatments & prices page query (`where category <> 'special'`) and guard `saveTreatment`'s update with `and category <> 'special'`.
- [ ] **Step 7:** In `createBooking`, insert `is_special` and `booked_price_cents` when the treatment is a special. Add `specialPrice` to the emails' `BookingSummary` as optional. Append `clientSpecialLines` to `bookingReceived` and `bookingConfirmed`, and `staffSpecialLines` to `staffNewBooking`. Declined and cancelled emails don't change, because nothing is booked. In `updateBooking`, read the price from the booking row, never from `treatments`.
- [ ] **Step 8:** Update `/book` and `BookingForm`:
  - The page sorts specials first and passes `special`.
  - Their group label is `Specials`, and the option text is `{name} · first session {min} min · {price}`.
  - When a special is selected, show the note and price beside the summary and on the success screen.
- [ ] **Step 9:** On the dashboard Bookings page, when `isSpecial`, show a "Special: first session" pill and the package price so staff know to arrange the rest.
- [ ] **Step 10: Verify:** insert a special locally with SQL, then book it via `/book?treatment=<id>`.
  - Expected: preselected; the console email shows the wording and price; `/treatments` and `/skincare` don't list it.
  - Delete the row, then confirm the booking. Expected: the console email still shows the wording and price.
- [ ] **Step 11:** Run `npx tsc --noEmit && npx eslint && npx vitest run`, then commit: `Specials: data model and first-session booking wording`.

### Task 4: Specials dashboard tab and poster upload

**Files:**
- Create: `src/lib/poster.ts`, `src/lib/poster.test.ts`, `src/app/dashboard/(app)/specials/page.tsx`, `src/app/dashboard/(app)/specials/SpecialEditor.tsx`, `src/app/dashboard/specials/upload/route.ts`
- Modify: `package.json` (`@vercel/blob`), `.env.example`, `next.config.ts`, `src/app/dashboard/actions.ts`, `src/app/dashboard/(app)/DashboardNav.tsx`

**Interfaces:**
- Consumes: `parsePriceCents`; `Special`; the `treatments` columns from Task 3.
- Produces, in `poster.ts` (pure):
  - `posterFileError(file: { type: string; size: number }): string | null`
  - `isBlobUrl(url: string): boolean`
- Produces, server actions:
  - `saveSpecial(_prev: FormResult, fd: FormData): Promise<FormResult>` (fields `id?`, `name`, `price`, `durationMin`, `posterUrl`)
  - `setSpecialActive(fd: FormData): Promise<void>` (`id`, `active`)
  - `deleteSpecial(fd: FormData): Promise<void>` (`id`)

- [ ] **Step 1: Ask the user to confirm creating a separate development Blob store.** Check `npx vercel blob --help` for the current command. Do not connect it to the production environment. Put its token in `.env.local` as `BLOB_READ_WRITE_TOKEN`, and add the empty key to `.env.example`. Warn in `.env.example` that `vercel env pull` overwrites `.env.local`.
- [ ] **Step 2:** Run `npm install @vercel/blob`.
- [ ] **Step 3: Write the failing test**

```ts
const MB = 1024 * 1024;
expect(posterFileError({ type: "image/png", size: 6 * MB })).toBeNull();
expect(posterFileError({ type: "image/jpeg", size: 10 * MB })).toBeNull();
expect(posterFileError({ type: "image/png", size: 10 * MB + 1 })).toMatch(/10 MB/);
expect(posterFileError({ type: "image/heic", size: MB })).toMatch(/JPG or PNG/);
expect(posterFileError({ type: "application/pdf", size: MB })).toMatch(/JPG or PNG/);
expect(isBlobUrl("https://abc.public.blob.vercel-storage.com/p.png")).toBe(true);
expect(isBlobUrl("https://evil.example.com/p.png")).toBe(false);
expect(isBlobUrl("http://abc.public.blob.vercel-storage.com/p.png")).toBe(false);
expect(isBlobUrl("not a url")).toBe(false);
```

- [ ] **Step 4:** Run `npx vitest run src/lib/poster.test.ts`. Expected: FAIL. Implement. Expected: PASS.
- [ ] **Step 5:** Add the upload route using `handleUpload` from `@vercel/blob/client`. In `onBeforeGenerateToken`, check `isSignedIn()` and throw if false (don't redirect from a fetch). Allow `image/jpeg` and `image/png`, `maximumSizeInBytes` 10 MB, random suffix on. Omit the completion callback, because Vercel's webhook has no session cookie and the proxy would redirect it. Confirm the callback's optionality against the installed package's types.
- [ ] **Step 6:** Add `remotePatterns` for `https://*.public.blob.vercel-storage.com` in `next.config.ts`, checking `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md`.
- [ ] **Step 7:** Implement the actions. `saveSpecial` requires a name of at least 2 characters, a non-null price, minutes 10–480, and `isBlobUrl(posterUrl)`, and returns `values` on error. New specials get section `Specials`, slug `special-<base>-<time>`, and **`active = false`** so nothing appears until someone switches it on (builder's call). Every query is scoped with `category = 'special'`. After replacing a poster or deleting a special, remove the old file with `del()` inside try/catch, logging failures. Audit each action.
- [ ] **Step 8:** Build `SpecialEditor` (client). On submit: run `posterFileError` if a file was chosen, call `upload()` from `@vercel/blob/client`, set `posterUrl`, then call the action. Uploading at submit avoids orphaned files from abandoned forms. Show "Uploading…", show errors inline, and keep typed values. The poster is required when adding and optional when editing. Include the hint: "Specials are packages. Clients book the first session here and you arrange the rest. Enter the full package price shown on the poster."
- [ ] **Step 9:** Build the page to match the approved mockup:
  - `requireStaff()`, `export const instant = false`, a "+ Add a new special" `<details>`.
  - Rows, newest first: `next/image` thumbnail, name, `formatPrice`, first-session length, on/off control (a form posting to `setSpecialActive`), Edit, `<details>` Delete.
  - Intro: "Specials switched on appear in the website pop-up straight away."
  - Add the nav link `{ href: "/dashboard/specials", label: "Specials", icon: "sparkle" }` after Treatments & prices.
- [ ] **Step 10: Verify** with `~/Downloads/IMG_3569.PNG` and with a PNG over 4.5 MB (make one if needed). Expected: both upload; `1462,50` shows as R1 462.50; the switch works; deleting removes the row and the Blob file; a `.pdf` shows the error with fields kept; a signed-out POST to the upload route is refused.
- [ ] **Step 11:** Run `npx tsc --noEmit && npx eslint && npx vitest run`, then commit: `Dashboard: Specials tab with poster upload`.

### Task 5: Website pop-up

**Files:**
- Create: `src/lib/specials-popup.ts`, `src/lib/specials-popup.test.ts`, `src/components/SpecialsPopup.tsx`, `src/components/PosterZoom.tsx`
- Modify: `src/app/(site)/layout.tsx`

**Interfaces:**
- Consumes: `getActiveSpecials`, `Special`.
- Produces, in `specials-popup.ts` (pure):
  - `shouldOpenPopup(pathname: string, count: number, dismissed: boolean): boolean`
  - `wasDismissed(storage: Pick<Storage, "getItem"> | undefined): boolean`
  - `markDismissed(storage: Pick<Storage, "setItem"> | undefined): void`
  - `wrapIndex(i: number, n: number): number`
- Produces: `<PosterZoom src alt>`, a tappable poster that opens full-width and scrollable with a close control. Later tasks reuse it.

- [ ] **Step 1: Write the failing test**

```ts
expect(shouldOpenPopup("/", 2, false)).toBe(true);
expect(shouldOpenPopup("/treatments", 1, false)).toBe(true);
expect(shouldOpenPopup("/book", 2, false)).toBe(false);
expect(shouldOpenPopup("/", 0, false)).toBe(false);
expect(shouldOpenPopup("/", 2, true)).toBe(false);

const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
expect(wasDismissed(throwing)).toBe(false);
expect(() => markDismissed(throwing)).not.toThrow();
expect(wasDismissed(undefined)).toBe(false);

expect(wrapIndex(3, 3)).toBe(0);
expect(wrapIndex(-1, 3)).toBe(2);
```

- [ ] **Step 2:** Run `npx vitest run src/lib/specials-popup.test.ts`. Expected: FAIL. Implement. Expected: PASS. Use `sessionStorage` key `specials-dismissed`.
- [ ] **Step 3:** Build `SpecialsPopup({ specials: Special[] })` using a native `<dialog>` and `showModal()`, which provides the focus trap, Esc and focus restore. Add `aria-label="Current specials"`.
  - Opens after 2000 ms if `shouldOpenPopup` allows, using `usePathname`.
  - Closes if the route changes to `/book`.
  - Closes via X, "Not now", backdrop click or Esc, all calling `markDismissed`.
  - Slider: horizontal CSS scroll-snap for native swiping. Arrows and dots only when `specials.length > 1`, driving `scrollTo`, with smooth scrolling only if motion is allowed.
  - Posters: `next/image` with `fill` and `object-contain` so they're never cropped. Alt text is the special's name.
  - "Book this special" is a `Link` to `/book?treatment=<id>` for the current slide, and it marks dismissed.
  - Esc while zoomed closes the zoom first (handle the dialog's `cancel` event).
  - Renders nothing with no specials.
- [ ] **Step 4:** In `(site)/layout.tsx`, add an async wrapper that awaits `getActiveSpecials()` and renders the pop-up, alongside `BusinessJsonLd`.
- [ ] **Step 5: Verify:** run `npm run build`. Expected: it succeeds, and public pages stay in the static/partial output with no new dynamic-rendering errors.
- [ ] **Step 6: Verify in a browser** at 360px, 390px and 1440px using true device emulation, because headless window sizes clip below 500px:
  - Three specials: swipe, arrows and Book each go to the right special; the whole poster is visible.
  - One special: no arrows or dots.
  - Close, navigate: it stays closed. New tab: it reopens.
  - `/book`: it never opens. Switch all off: nothing renders.
  - With storage blocked (DevTools, or override `sessionStorage` to throw): no crash.
- [ ] **Step 7:** Commit: `Website: specials pop-up`.

### Task 6: Specials page and menu link

**Files:**
- Create: `src/app/(site)/specials/page.tsx`
- Modify: `src/components/Header.tsx`, `src/app/(site)/layout.tsx`

**Interfaces:**
- Consumes: `getActiveSpecials`, `PosterZoom`, `FIRST_SESSION_NOTE`, `formatPrice`.
- Produces: `Header({ showSpecials }: { showSpecials: boolean })`.

- [ ] **Step 1:** Build `/specials` with `pageMetadata`, `BreadcrumbJsonLd` and `PageHero`. Do not add it to `navLinks`, so the sitemap stays unchanged. For each special show `PosterZoom`, the name and price as real text, `FIRST_SESSION_NOTE`, and a "Book this special" link. With none on, show "No specials right now" and a link to `/treatments`.
- [ ] **Step 2:** In `Header`, insert `{ href: "/specials", label: "Specials" }` after Skincare in both menus when `showSpecials` is true. In the layout, wrap `Header` with an async component passing `(await getActiveSpecials()).length > 0`.
- [ ] **Step 3: Verify:** at exactly 1024px and 1280px, the desktop header doesn't wrap or overflow with all 7 links (measure `scrollWidth`). If it does at 1024px, reduce the nav gap at that width only. Switching all specials off removes the link. `curl /sitemap.xml` doesn't list `/specials`.
- [ ] **Step 4:** Run `npx tsc --noEmit && npx eslint && npx vitest run && npm run build`, then commit: `Website: Specials page and menu link`.

### Task 7: End-to-end check and go-live

**Files:** `docs/superpowers/specs/` work record only if something changed.

- [ ] **Step 1: Full local run-through:** add a real phone PNG poster, see it pop up on desktop and at 360px and 390px, book its first session, confirm from the dashboard, switch it off, then delete it. Also delete a treatment and confirm its bookings display correctly. Expected: every step in the spec's "Checks before calling it done".
- [ ] **Step 2:** Run `npx tsc --noEmit && npx eslint && npx vitest run && npm run build`. Expected: all clean.
- [ ] **Step 3:** Request code review of the branch and fix what's confirmed.
- [ ] **Step 4: Stop and ask the user before each production step:**
  1. Read-only comparison of live prices against `scripts/menu.mts`; show the differences to the user, and staff correct real errors.
  2. Create the production Blob store and connect it to the project (Production only).
  3. `npm run db:live` (now migrations only).
  4. Merge to `main` and push, then check with `vercel ls soma`.
- [ ] **Step 5:** After deploy, verify on the live URL with one real poster, then switch it off unless the client wants it up. Don't submit a booking on production without the user's agreement.
