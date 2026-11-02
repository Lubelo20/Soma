# Specials pop-up + price management: design

Date: 2026-11-02 · Client: Infinity Soma Wellness Clinic · Builder: Lubelo Tech Solutions

## Intent
The clinic runs specials as designed posters on social media, such as three Black Friday packages at once. The team wants to run those on the website themselves, without a developer: upload a poster, switch it on, and let visitors book from it. They also need full control of the prices on the live site, including permanent deletion.

## What exists today
- The dashboard's Treatments & prices page (`src/app/dashboard/(app)/treatments/`) can add, edit and hide treatments. Changes reach the live site straight away through `updateTag("treatments")`. There is no delete.
- `saveTreatment` strips commas from prices, so "1462,5" saves as R14,625. South African prices are commonly written with a comma, and the clinic's posters do this.
- `npm run db:live` runs `scripts/apply-menu.mts`, which overwrites staff price edits, restores deleted treatments, hides anything not on its list and resets weekly hours.
- Booking is one slot per booking. `/book?treatment=<id>` already preselects a treatment.

## Goals
1. A new **Specials** dashboard tab where staff add, edit, delete and switch specials on and off.
2. A pop-up on the public site showing the specials that are on, with a route to book each one.
3. Permanent delete for treatments, and correct handling of comma prices.
4. Live prices belong to the team: no script overwrites them.

## Non-goals
- Online payment, or tracking a client's remaining package sessions.
- Booking every session of a package online.
- Scheduled start and end dates. On and off is manual.
- Building posters on the site, or a drag-to-reorder control.
- Connecting the domain and email. That is the next piece of work, separately.

## Anti-goals
- A client believing the whole package is scheduled when only the first session is booked.
- A client believing a booking is confirmed when it is only requested (existing rule).
- A pop-up that gets in the way of someone already booking, or can't easily be closed.
- A special that can still be booked after it is switched off.
- Deleting a treatment or special damaging past or upcoming booking records.

## Decided with the user
- Staff upload a finished poster image; the site does not lay out the poster.
- Pop-up layout A: one poster at a time, filling the pop-up, with swipe and arrows to move between specials, and a "Book this special" button that books the one showing.
- Several specials can be on at once.
- Specials are always packages with several sessions, so the first-session wording applies to every special and there is no single-treatment type. The staff form says this briefly.
- The client books the **first session only**, and the clinic arranges the rest.
- Each special has its own on/off switch.

The user also accepted the behaviour below when it was played back to them.

## Visitor behaviour
- **When:** the pop-up opens about 2 seconds after arriving on any public page except `/book`, only if at least one special is on. It never appears on `/dashboard`.
- **Closing:** the X, "Not now", the backdrop or Esc. Once closed, it stays closed until the next visit (`sessionStorage`; if storage is unavailable, the site still works).
- **Finding it again:** while any special is on, a "Specials" link appears in the desktop and mobile menus, going to a `/specials` page showing the same posters with book buttons.
- **Reading:** tapping a poster opens it larger so the small print is readable. Posters are portrait and text-heavy, and must not be cropped.
- **Booking:** "Book this special" opens `/book` with the special selected. The client then picks a date and time as normal.
- **Wording:** the booking form, success screen, and client and staff emails name the special and its price, and state that this books the first session and the clinic will arrange the rest.
- **Slot held:** the first-session length set on the special.
- **Switched off:** the special disappears from the pop-up, the Specials page and the booking form. Existing bookings stand. An old `/book?treatment=<id>` link falls back to the normal empty form (existing behaviour).

## Staff behaviour
**Specials tab**, added to `DashboardNav`, listing each special with a poster thumbnail, name, price, first-session length, on/off switch, Edit and Delete.
- Fields, all required: poster image, name, price, first-session minutes (10–480, as for treatments).
- Replacing a poster and changing details are both done through Edit.
- Switching and editing take effect on the live site straight away.
- Delete asks for confirmation and removes the special and its stored image.
- List order is pop-up order, newest first.

**Treatments & prices tab**
- A Delete action with a confirmation step. The confirmation mentions Hide as the alternative for anything temporary.
- Past and upcoming bookings keep their treatment name and details (`treatment_name` is already copied on to the booking, and the foreign key is `on delete set null`).

**Prices**, wherever staff type them:
- Accept `1462,5`, `1462,50`, `1462.50`, `R1 462,50`, `1,462.50` and `1 462`.
- A comma or dot followed by 1–2 final digits is the decimal mark. A comma followed by exactly 3 digits is a thousands separator.
- Anything else is rejected with a clear error, never guessed.
- This parser is pure and has unit tests.

## Scripts
- `db:live` runs migrations only and no longer applies the price list.
- `db:menu` and `db:seed` remain for setting up a fresh database, and must not be part of any routine live deploy. Update the README accordingly.

## Builder's calls (flag if wrong)
- **Specials are rows in `treatments`:** a new `special` category plus a nullable `poster_url`. Availability, `/book?treatment=<id>`, caching and the booking insert then work unchanged. The category check constraint is altered in `db/schema.sql`, which must stay safe to re-run. `active` is the on/off switch.
- **Separation:** the public Treatments and Skincare menus, and the dashboard's Treatments & prices page including its Hidden list, exclude specials. In the booking form, specials appear in their own "Specials" group.
- **Booking record:** whatever the wording needs (special flag, price at the time of booking) is copied on to the booking, so later edits or deletion don't change what the client was told. A confirmation sent after a special has been deleted must still include the first-session note and price.
- **One poster, one special:** the typed price is the total shown on the poster, not the price of the first session.
- **Image storage:** Vercel Blob, public read, using the Vercel project already in place. `BLOB_READ_WRITE_TOKEN` is required in production and locally. Local work uses its own separate store, so test uploads and deletes can never touch live posters. It is created early in the build, with the user's confirmation.
- **Uploads:** must accept a typical phone PNG, which can exceed Vercel's 4.5 MB request limit for functions. Use direct client upload or resize in the browser. Accept JPG and PNG, maximum 10 MB, checked on the server. Only signed-in staff can upload; anything outside `/dashboard` is not covered by the proxy, so call `requireStaff()` explicitly.
- **Image cleanup:** the old file is removed from storage when a poster is replaced or a special is deleted. A failed cleanup doesn't fail the staff action; log it.
- **Caching:** public reads use the existing cached treatments read, so the `treatments` tag already covers specials. Keep Cache Components working: the menu link and pop-up must not make public pages dynamic.
- **Accessibility:** the pop-up is a labelled dialog that traps and restores focus, and supports Esc and swiping. Poster alt text is the special's name. Respect reduced motion. The poster's wording is only in the image, so the special's name and price also appear as real text on `/specials`.
- **SEO:** `/specials` is not in the sitemap, because its content comes and goes. With nothing on, it shows a short "no specials right now" message with a link to treatments.
- **Audit:** special add, edit, switch and delete, plus treatment delete, go through the existing `audit()` logging.

## Known limits, accepted for now
- The poster price and the typed price are separate. The site can't detect a mismatch, so staff must keep them the same.
- Nothing ends a special automatically. A poster stays up until someone switches it off.
- The home page's service summaries (`services` in `src/lib/site.ts`) are fixed text, so deleting a treatment doesn't remove its name from that list. Those summaries are not prices.
- Production email isn't configured yet, so the booking emails described here won't send until the domain and Resend work is done. The on-screen wording works regardless.

## Checks before calling it done
- Type check, lint and tests pass, with new tests for the price parser.
- End to end against a local database: add a special with a real phone PNG, see it pop up on desktop and at 360px and 390px, book its first session, confirm it from the dashboard, then switch it off and delete it.
- A deleted treatment no longer appears publicly, and its existing bookings still display correctly.

## Going live
Production steps are outward-facing, so the builder confirms with the user before each:
1. Do a read-only comparison of live prices against `scripts/menu.mts`, to find any already inflated by the comma bug (`450,00` would be live as R45,000). Differences may be genuine staff edits, so show them to the user; staff correct real errors in the dashboard.
2. Create the production Blob store and connect it to the project.
3. Run the schema migration against production.
4. Push to `main`, which triggers Vercel's production build.
