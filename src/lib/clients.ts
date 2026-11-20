import "server-only";
import { sql } from "./db";
import {
  cardForBooking,
  healthWarnings,
  normalizePhone,
  unansweredHealthCount,
  type HealthAnswers,
  type MassageAnswers,
  type SkinAnswers,
} from "./record-card";
import { UUID_RE as UUID } from "./validation";
import { treatedName } from "./booking-for";

// Read-only access to client record cards. Health information is special personal information under POPIA,
// so every page or action that calls this must be behind the staff sign-in. Writes live in server actions.

type Section = "health" | "massage" | "skin";

export type ClientDetails = {
  id: string;
  fullName: string;
  phone: string;
  phoneDigits: string;
  email: string;
  idNumber: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  emergencyContact: string;
  occupation: string;
  initialAppointment: string;
  clientType: "first" | "returning";
  createdAt: Date;
  updatedAt: Date;
};

export type Consent = {
  id: number;
  statements: string[];
  photoConsent: boolean;
  initials: string;
  signaturePath: string;
  snapshot: unknown;
  signedAt: Date;
};

export type TreatmentEntry = {
  id: number;
  clientId: string;
  bookingId: string | null;
  day: string; // YYYY-MM-DD
  kind: "skin" | "massage";
  products: string;
  notes: string;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
};

export type MatchedBooking = {
  id: string;
  ref: string;
  treatmentName: string;
  startsAt: Date;
  status: string;
  clientName: string; // the booker
  forName: string; // the person treated, when booked for someone else; else ''
};

export type Card = {
  client: ClientDetails;
  health: HealthAnswers | null;
  massage: MassageAnswers | null;
  skin: SkinAnswers | null;
  sectionsSavedAt: Partial<Record<Section, Date>>;
  consents: Consent[]; // newest first
  entries: TreatmentEntry[]; // not deleted, newest first
  bookings: MatchedBooking[]; // newest first
  warnings: string[];
  changedSinceSigned: boolean;
};

export type ClientListItem = {
  id: string;
  fullName: string;
  phone: string;
  lastVisit: string | null;
  warnings: string[];
  // No health section saved, or the newest one has a condition answered neither Yes nor No.
  healthIncomplete: boolean;
};

/** SQL that mirrors normalizePhone for a text column or expression: digits only, a leading 0 becomes 27. */
function phoneDigitsSql(column: ReturnType<typeof sql>) {
  return sql`regexp_replace(regexp_replace(${column}, '[^0-9]', '', 'g'), '^0', '27')`;
}

const CLIENT_COLUMNS = sql`
  c.id, c.full_name, c.phone, c.phone_digits, c.email, c.id_number,
  to_char(c.date_of_birth, 'YYYY-MM-DD') as date_of_birth, c.gender, c.address, c.emergency_contact,
  c.occupation, to_char(c.initial_appointment, 'YYYY-MM-DD') as initial_appointment,
  c.client_type, c.created_at, c.updated_at`;

const ENTRY_COLUMNS = sql`
  e.id, e.client_id, e.booking_id, to_char(e.day, 'YYYY-MM-DD') as day, e.kind, e.products, e.notes,
  e.created_at, e.edited_at, e.deleted_at`;

// The bookings that belong to a client. A booking for the booker themselves (for_name empty): same phone number in
// any format, or same email when there is one. A booking made for someone else belongs to the person treated, never
// to the booker: it matches only by the phone given for them (for_phone), and with none it matches no card.
const BOOKING_MATCHES_CLIENT = sql`(
  (b.for_name = '' and (
    ${phoneDigitsSql(sql`b.client_phone`)} = c.phone_digits
    or (c.email <> '' and lower(b.client_email) = lower(c.email))
  ))
  or (b.for_name <> '' and b.for_phone <> '' and c.phone_digits <> ''
    and ${phoneDigitsSql(sql`b.for_phone`)} = c.phone_digits)
)`;

/** Newest health, massage and skin answers for each of the given clients, in one query. */
async function newestSections(ids: string[], sections: Section[]) {
  if (ids.length === 0) return [];
  return sql<{ clientId: string; section: Section; answers: unknown; savedAt: Date }[]>`
    select distinct on (client_id, section) client_id, section, answers, saved_at
    from client_sections
    where client_id in ${sql(ids)} and section in ${sql(sections)}
    order by client_id, section, saved_at desc, id desc`;
}

export async function searchClients(q: string): Promise<ClientListItem[]> {
  const term = q.trim();
  // Both the digits as typed and their normalised form, so "0821" finds a number starting 0821 (stored as 27821)
  // and also one with 0821 in the middle.
  const raw = term.replace(/\D/g, "");
  const digits = normalizePhone(term);
  const byPhone = raw.length >= 4;
  const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;

  const rows = await sql<{ id: string; fullName: string; phone: string; lastVisit: string | null }[]>`
    select c.id, c.full_name, c.phone,
      (select to_char(max(e.day), 'YYYY-MM-DD') from treatment_entries e
        where e.client_id = c.id and e.deleted_at is null) as last_visit
    from clients c
    ${
      term === ""
        ? sql``
        : byPhone
          ? sql`where c.full_name ilike ${pattern} or c.phone_digits like ${`%${digits}%`} or c.phone_digits like ${`%${raw}%`}`
          : sql`where c.full_name ilike ${pattern}`
    }
    order by c.updated_at desc
    limit 50`;

  const sections = await newestSections(
    rows.map((r) => r.id),
    ["health", "skin"],
  );
  return rows.map((r) => {
    const mine = (s: Section) => sections.find((x) => x.clientId === r.id && x.section === s)?.answers;
    const health = mine("health");
    return {
      ...r,
      healthIncomplete: health === undefined || unansweredHealthCount(health) > 0,
      warnings: healthWarnings({
        health: mine("health") as HealthAnswers | undefined,
        skin: mine("skin") as SkinAnswers | undefined,
      }),
    };
  });
}

export async function getCard(id: string): Promise<Card | null> {
  if (!UUID.test(id)) return null;

  const [clients, sections, consents, entries, bookings] = await Promise.all([
    sql<ClientDetails[]>`select ${CLIENT_COLUMNS} from clients c where c.id = ${id}`,
    newestSections([id], ["health", "massage", "skin"]),
    sql<Consent[]>`
      select id, statements, photo_consent, initials, signature_path, snapshot, signed_at
      from consents where client_id = ${id} order by signed_at desc, id desc`,
    sql<TreatmentEntry[]>`
      select ${ENTRY_COLUMNS} from treatment_entries e
      where e.client_id = ${id} and e.deleted_at is null
      order by e.day desc, e.id desc`,
    sql<MatchedBooking[]>`
      select b.id, b.ref, b.treatment_name, b.starts_at, b.status, b.client_name, b.for_name
      from bookings b join clients c on c.id = ${id}
      where ${BOOKING_MATCHES_CLIENT}
      order by b.starts_at desc`,
  ]);
  const client = clients[0];
  if (!client) return null;

  const find = (s: Section) => sections.find((x) => x.section === s);
  const health = (find("health")?.answers as HealthAnswers | undefined) ?? null;
  const massage = (find("massage")?.answers as MassageAnswers | undefined) ?? null;
  const skin = (find("skin")?.answers as SkinAnswers | undefined) ?? null;
  const sectionsSavedAt: Card["sectionsSavedAt"] = {};
  for (const s of sections) sectionsSavedAt[s.section] = s.savedAt;

  const signed = consents[0]?.signedAt;
  const changedSinceSigned =
    signed !== undefined &&
    [sectionsSavedAt.health, sectionsSavedAt.skin].some((d) => d !== undefined && d > signed);

  return {
    client,
    health,
    massage,
    skin,
    sectionsSavedAt,
    consents,
    entries,
    bookings,
    warnings: healthWarnings({ health, skin }),
    changedSinceSigned,
  };
}

export async function getSectionHistory(id: string) {
  if (!UUID.test(id)) return [];
  return sql<{ section: string; answers: unknown; savedAt: Date }[]>`
    select section, answers, saved_at from client_sections
    where client_id = ${id} order by saved_at desc, id desc`;
}

export async function getDeletedEntries(id: string): Promise<TreatmentEntry[]> {
  if (!UUID.test(id)) return [];
  return sql<TreatmentEntry[]>`
    select ${ENTRY_COLUMNS} from treatment_entries e
    where e.client_id = ${id} and e.deleted_at is not null
    order by e.deleted_at desc, e.id desc`;
}

/** Other cards with the same phone number, or the same ID number when one is given. */
export async function findDuplicates(input: { phone: string; idNumber: string; excludeId?: string }) {
  const digits = normalizePhone(input.phone);
  const idNumber = input.idNumber.trim();
  const exclude = input.excludeId && UUID.test(input.excludeId) ? input.excludeId : null;
  return sql<{ id: string; fullName: string }[]>`
    select id, full_name from clients
    where (${digits !== "" ? sql`phone_digits = ${digits}` : sql`false`}
        or ${idNumber !== "" ? sql`id_number = ${idNumber}` : sql`false`})
      ${exclude ? sql`and id <> ${exclude}` : sql``}
    order by created_at desc`;
}

/**
 * The card a booking opens, or null to start a new one. Several cards can share a phone (a family), so the one
 * with the treated person's name (for_name when booked for someone else, else client_name) wins; else the only
 * matching card; else null (see cardForBooking).
 */
export async function clientForBooking(bookingId: string): Promise<string | null> {
  if (!UUID.test(bookingId)) return null;
  const rows = await sql<{ id: string; fullName: string; clientName: string; forName: string }[]>`
    select c.id, c.full_name, b.client_name, b.for_name
    from bookings b join clients c on ${BOOKING_MATCHES_CLIENT}
    where b.id = ${bookingId}
    order by c.created_at desc, c.id`;
  if (rows.length === 0) return null;
  return cardForBooking(treatedName(rows[0]), rows);
}

/** Whether a booking belongs to a client, by the same matching getCard uses (BOOKING_MATCHES_CLIENT). */
export async function bookingBelongsToClient(bookingId: string, clientId: string): Promise<boolean> {
  if (!UUID.test(bookingId) || !UUID.test(clientId)) return false;
  const [row] = await sql`
    select 1 from bookings b join clients c on c.id = ${clientId}
    where b.id = ${bookingId} and ${BOOKING_MATCHES_CLIENT}`;
  return row !== undefined;
}

/** Which of the given bookings have at least one matching record card, in one query. Ids that are not uuids are ignored. */
export async function bookingsWithCards(bookingIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(bookingIds.filter((id) => UUID.test(id)))];
  if (ids.length === 0) return new Set();
  const rows = await sql<{ id: string }[]>`
    select b.id from bookings b
    where b.id in ${sql(ids)}
      and exists (select 1 from clients c where ${BOOKING_MATCHES_CLIENT})`;
  return new Set(rows.map((r) => r.id));
}
