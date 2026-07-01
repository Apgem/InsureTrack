-- InsureTrack — Initial schema migration
-- Single-tenant v1: one login = one agent = one book of business.
-- Multi-producer/agency support is intentionally out of scope.
--
-- RLS NOTE: Tables with an agent_id column scope on `agent_id = auth.uid()`.
-- Tables WITHOUT an agent_id (sequence_steps, sequence_enrollments) must scope
-- via a subquery against sequences — the naive agent_id pattern would not
-- compile and, if worked around carelessly, would leak other agents' data.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- profiles  (extends auth.users, one row per agent)
-- ---------------------------------------------------------------------------
create table profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  full_name           text,
  agency_name         text,
  phone               text,
  timezone            text default 'America/New_York',
  stripe_customer_id  text,
  subscription_status text default 'trialing'
                        check (subscription_status in
                          ('trialing','active','past_due','canceled','incomplete')),
  trial_ends_at       timestamptz,
  created_at          timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table clients (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references profiles (id) on delete cascade,
  full_name     text not null,
  email         text,
  phone         text,
  address       text,
  notes         text,
  tags          text[],
  sms_opted_out boolean not null default false,   -- TCPA: set true on inbound STOP
  created_at    timestamptz default now()
);
create index clients_agent_id_idx on clients (agent_id);

-- ---------------------------------------------------------------------------
-- policies
-- ---------------------------------------------------------------------------
create table policies (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references profiles (id) on delete cascade,
  client_id     uuid not null references clients (id) on delete cascade,
  policy_type   text not null
                  check (policy_type in
                    ('auto','home','life','health','commercial')),
  carrier       text,
  policy_number text,
  premium       numeric,
  renewal_date  date not null,
  status        text default 'active'
                  check (status in ('active','renewed','lapsed','cancelled')),
  created_at    timestamptz default now()
);
create index policies_agent_id_idx on policies (agent_id);
create index policies_client_id_idx on policies (client_id);
create index policies_renewal_date_idx on policies (renewal_date);

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table leads (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references profiles (id) on delete cascade,
  full_name     text not null,
  email         text,
  phone         text,
  source        text check (source in ('referral','facebook','website','cold')),
  interested_in text[],
  status        text default 'new'
                  check (status in ('new','contacted','quoted','won','lost')),
  notes         text,
  created_at    timestamptz default now()
);
create index leads_agent_id_idx on leads (agent_id);

-- ---------------------------------------------------------------------------
-- sequences
-- ---------------------------------------------------------------------------
create table sequences (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references profiles (id) on delete cascade,
  name         text not null,
  trigger_type text not null
                 check (trigger_type in
                   ('renewal_30','renewal_60','renewal_90','new_lead','new_client')),
  is_active    boolean default true,
  created_at   timestamptz default now()
);
create index sequences_agent_id_idx on sequences (agent_id);

-- ---------------------------------------------------------------------------
-- sequence_steps  (no agent_id — scoped via parent sequence)
-- ---------------------------------------------------------------------------
create table sequence_steps (
  id          uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references sequences (id) on delete cascade,
  step_order  int not null,
  channel     text not null check (channel in ('email','sms')),
  delay_days  int default 0,   -- days AFTER enrolled_at (cumulative from enrollment)
  subject     text,            -- email only
  body        text not null,   -- supports {{first_name}}, {{renewal_date}}, {{policy_type}}
  unique (sequence_id, step_order)
);
create index sequence_steps_sequence_id_idx on sequence_steps (sequence_id);

-- ---------------------------------------------------------------------------
-- sequence_enrollments  (no agent_id — scoped via parent sequence)
-- An enrollment targets either a client OR a lead, not both.
-- ---------------------------------------------------------------------------
create table sequence_enrollments (
  id           uuid primary key default gen_random_uuid(),
  sequence_id  uuid not null references sequences (id) on delete cascade,
  client_id    uuid references clients (id) on delete cascade,
  lead_id      uuid references leads (id) on delete cascade,
  current_step int default 0,
  status       text default 'active'
                 check (status in ('active','completed','cancelled')),
  enrolled_at  timestamptz default now(),
  check (
    (client_id is not null and lead_id is null) or
    (client_id is null and lead_id is not null)
  )
);
create index sequence_enrollments_sequence_id_idx on sequence_enrollments (sequence_id);

-- Prevent double-enrollment (and the double-sends that follow) while a prior
-- enrollment is still active. NULLs are distinct in Postgres, so client and
-- lead enrollments do not collide with each other.
create unique index sequence_enrollments_active_client_uniq
  on sequence_enrollments (sequence_id, client_id)
  where status = 'active' and client_id is not null;
create unique index sequence_enrollments_active_lead_uniq
  on sequence_enrollments (sequence_id, lead_id)
  where status = 'active' and lead_id is not null;

-- ---------------------------------------------------------------------------
-- messages_log  (audit trail of every email/SMS sent)
-- ---------------------------------------------------------------------------
create table messages_log (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references profiles (id) on delete cascade,
  client_id     uuid references clients (id) on delete set null,
  lead_id       uuid references leads (id) on delete set null,
  enrollment_id uuid references sequence_enrollments (id) on delete set null,
  channel       text check (channel in ('email','sms')),
  subject       text,
  body          text,
  status        text check (status in ('sent','delivered','failed')),
  sent_at       timestamptz default now()
);
create index messages_log_agent_id_idx on messages_log (agent_id);
create index messages_log_client_id_idx on messages_log (client_id);

-- ===========================================================================
-- Row-Level Security
-- ===========================================================================
alter table profiles             enable row level security;
alter table clients              enable row level security;
alter table policies             enable row level security;
alter table leads                enable row level security;
alter table sequences            enable row level security;
alter table sequence_steps       enable row level security;
alter table sequence_enrollments enable row level security;
alter table messages_log         enable row level security;

-- profiles: a user sees only their own profile row
create policy "Own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Tables WITH agent_id: scope directly
create policy "Own clients" on clients
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

create policy "Own policies" on policies
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

create policy "Own leads" on leads
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

create policy "Own sequences" on sequences
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

create policy "Own messages" on messages_log
  for all using (agent_id = auth.uid()) with check (agent_id = auth.uid());

-- Tables WITHOUT agent_id: scope through the parent sequence
create policy "Own sequence steps" on sequence_steps
  for all
  using (
    sequence_id in (select id from sequences where agent_id = auth.uid())
  )
  with check (
    sequence_id in (select id from sequences where agent_id = auth.uid())
  );

create policy "Own sequence enrollments" on sequence_enrollments
  for all
  using (
    sequence_id in (select id from sequences where agent_id = auth.uid())
  )
  with check (
    sequence_id in (select id from sequences where agent_id = auth.uid())
  );
