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

create table if not exists staff (
  id            serial primary key,
  email         text not null unique,  -- stored lower-case
  name          text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  token_hash text primary key,
  staff_id   integer not null references staff(id) on delete cascade,
  expires_at timestamptz not null
);
