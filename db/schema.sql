-- Infinity Soma schema. Safe to run repeatedly (npm run db:migrate).

create extension if not exists btree_gist;

create table if not exists treatments (
  id           serial primary key,
  slug         text not null unique,
  name         text not null,
  category     text not null check (category in ('wellness', 'skincare')),
  description  text not null default '',
  duration_min integer not null check (duration_min between 10 and 480),
  price_cents  integer check (price_cents >= 0),  -- null = "Price on request"
  active       boolean not null default true,
  sort         integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Heading the treatment is listed under on its page, e.g. "Massage Therapy" or "Ladies' Waxing".
alter table treatments add column if not exists section text not null default '';

-- Specials are treatments with a poster: 'active' is their on/off switch and duration_min is the first session.
alter table treatments add column if not exists poster_url text;
alter table treatments drop constraint if exists treatments_category_check;
alter table treatments add constraint treatments_category_check check (category in ('wellness', 'skincare', 'special'));

-- One row per weekday (0 = Sunday). Null opens/closes = closed that day.
create table if not exists opening_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  opens   time,
  closes  time,
  check ((opens is null) = (closes is null)),
  check (opens is null or opens < closes)
);

create table if not exists closures (
  day  date primary key,
  note text not null default ''
);

create table if not exists bookings (
  id             uuid primary key default gen_random_uuid(),
  ref            text not null unique,
  treatment_id   integer references treatments(id) on delete set null,
  treatment_name text not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  status         text not null default 'pending'
                 check (status in ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  client_name    text not null,
  client_phone   text not null,
  client_email   text not null,
  notes          text not null default '',
  staff_note     text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ends_at > starts_at),
  -- One client at a time: active bookings may never overlap.
  constraint bookings_no_overlap exclude using gist (tstzrange(starts_at, ends_at) with &&)
    where (status in ('pending', 'confirmed', 'completed'))
);

create index if not exists bookings_starts_at_idx on bookings (starts_at);

-- Copied from the special when it's booked, so later edits or deletion don't change what the client was told.
alter table bookings add column if not exists is_special boolean not null default false;
alter table bookings add column if not exists booked_price_cents integer;

create table if not exists enquiries (
  id         serial primary key,
  kind       text not null,
  name       text not null,
  phone      text not null,
  email      text not null default '',
  interest   text not null default '',
  message    text not null default '',
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Key/value settings. 'dashboard_password_hash' holds the bcrypt hash of the one password all staff share.
create table if not exists settings (
  key   text primary key,
  value text not null
);

-- Sessions used to belong to individual staff accounts. Those accounts are gone, so their sessions are
-- cleared (once) and the staff table is dropped.
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'sessions' and column_name = 'staff_id') then
    delete from sessions;
    alter table sessions drop column staff_id;
  end if;
end $$;
drop table if exists staff;

create table if not exists sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);

-- Recent sign-in failures and form submissions, used to slow down password guessing and form spam.
-- Rows older than a day are deleted as new ones arrive. (Also created on demand by src/lib/rate-limit.ts.)
create table if not exists rate_events (
  kind text not null,
  key  text not null,
  at   timestamptz not null default now()
);
create index if not exists rate_events_lookup on rate_events (kind, key, at);

-- Client Record Card (staff dashboard). Holds health information, which POPIA treats as special personal
-- information: only ever read or written behind the staff sign-in.
create table if not exists clients (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text not null,
  phone               text not null,
  phone_digits        text not null,  -- digits only, leading 0 as 27 (mirrors normalizePhone in src/lib/record-card.ts)
  email               text not null default '',
  id_number           text not null default '',
  date_of_birth       date,
  gender              text not null default '',
  address             text not null default '',
  emergency_contact   text not null default '',
  occupation          text not null default '',
  initial_appointment date not null default current_date,
  client_type         text not null default 'first' check (client_type in ('first', 'returning')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists clients_phone_digits_idx on clients (phone_digits);
create index if not exists clients_email_idx on clients (lower(email));
create index if not exists clients_id_number_idx on clients (id_number);
create index if not exists clients_name_idx on clients (lower(full_name));

-- Each save of a form section adds a row; the newest row per section is the current answer, older rows are history.
create table if not exists client_sections (
  id        serial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  section   text not null check (section in ('health', 'massage', 'skin')),
  answers   jsonb not null,
  saved_at  timestamptz not null default now()
);
create index if not exists client_sections_lookup on client_sections (client_id, section, saved_at desc);

-- A signed consent: the exact statements shown, plus a snapshot of the card at the time of signing.
create table if not exists consents (
  id             serial primary key,
  client_id      uuid not null references clients(id) on delete cascade,
  statements     jsonb not null,
  photo_consent  boolean not null,
  initials       text not null,
  signature_path text not null,
  snapshot       jsonb not null,
  signed_at      timestamptz not null default now()
);
create index if not exists consents_client_idx on consents (client_id, signed_at desc);

create table if not exists therapists (
  id     serial primary key,
  name   text not null,
  active boolean not null default true
);

-- Treatment notes. Deleting one only sets deleted_at, so the history is kept.
create table if not exists treatment_entries (
  id           serial primary key,
  client_id    uuid not null references clients(id) on delete cascade,
  booking_id   uuid references bookings(id) on delete set null,
  day          date not null,
  kind         text not null check (kind in ('skin', 'massage')),
  products     text not null default '',
  notes        text not null default '',
  therapist_id integer references therapists(id) on delete set null,
  created_at   timestamptz not null default now(),
  edited_at    timestamptz,
  deleted_at   timestamptz
);
create index if not exists treatment_entries_client_idx on treatment_entries (client_id, day desc);
