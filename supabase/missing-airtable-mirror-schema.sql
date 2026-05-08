-- Supplemental schema for the Airtable -> Supabase migration.
-- Run this in Supabase SQL Editor if the REST API still cannot see these
-- tables after running supabase/schema.sql.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.payments add column if not exists airtable_record_id text;
alter table public.orders add column if not exists airtable_record_id text;
alter table public.inventory add column if not exists airtable_record_id text;

create unique index if not exists payments_airtable_record_id_idx on public.payments (airtable_record_id);
create unique index if not exists orders_airtable_record_id_idx on public.orders (airtable_record_id);
create unique index if not exists inventory_airtable_record_id_idx on public.inventory (airtable_record_id);

create table if not exists public.promo_codes (
  code text primary key,
  airtable_record_id text,
  discount_type text not null default 'flat',
  discount_value numeric(12, 2) not null default 0,
  min_order numeric(12, 2) not null default 0,
  usage_limit integer,
  used_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists promo_codes_airtable_record_id_idx on public.promo_codes (airtable_record_id);
drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
before update on public.promo_codes
for each row execute function public.set_updated_at();

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text,
  order_id text not null,
  payment_id text,
  customer_email text,
  customer_name text,
  amount numeric(12, 2),
  reason text,
  details text,
  status text not null default 'requested',
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists refunds_airtable_record_id_idx on public.refunds (airtable_record_id);
drop trigger if exists refunds_set_updated_at on public.refunds;
create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function public.set_updated_at();

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  inquiry_type text,
  source text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_email_idx on public.contact_submissions (lower(email));
create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create unique index if not exists contact_submissions_airtable_record_id_idx on public.contact_submissions (airtable_record_id);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text,
  email text not null unique,
  name text,
  source text,
  status text not null default 'confirmed',
  source_payload jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_airtable_record_id_idx on public.subscriptions (airtable_record_id);
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text,
  context text not null,
  severity text not null default 'error',
  message text,
  stack text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists error_logs_airtable_record_id_idx on public.error_logs (airtable_record_id);

alter table public.promo_codes enable row level security;
alter table public.refunds enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.error_logs enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.promo_codes to service_role;
grant select, insert, update, delete on public.refunds to service_role;
grant select, insert, update, delete on public.contact_submissions to service_role;
grant select, insert, update, delete on public.subscriptions to service_role;
grant select, insert, update, delete on public.error_logs to service_role;

notify pgrst, 'reload schema';
