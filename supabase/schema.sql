-- UNHOLY production schema for Supabase/Postgres.
-- Run this once from Supabase Dashboard > SQL Editor.

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

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_id text unique,
  order_id text not null unique,
  pack text not null default '',
  quantity integer not null default 0,
  amount numeric(12, 2) not null default 0,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text,
  full_shipping_address text,
  shipping_address text,
  shipping_city text,
  shipping_state text,
  shipping_pincode text,
  paid_at timestamptz,
  shipping_status text,
  shiprocket_order_id text,
  shipment_id text,
  awb_code text,
  courier_name text,
  estimated_delivery text,
  delivered_at text,
  invoice_seq integer unique,
  original_invoice_seq integer,
  invoice_no text unique,
  invoice_storage_path text,
  gst_number text,
  gst_business_name text,
  promo_code text,
  discount_amount numeric(12, 2) not null default 0,
  tax_type text check (tax_type in ('CGST+SGST', 'IGST')),
  migrated_from text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_customer_email_idx on public.payments (lower(customer_email));
create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_payment_id_idx on public.payments (payment_id);
create index if not exists payments_paid_at_idx on public.payments (paid_at desc);
create index if not exists payments_awb_code_idx on public.payments (awb_code);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  razorpay_order_id text unique,
  customer_email text,
  customer_name text,
  customer_phone text,
  pack text,
  quantity integer not null default 0,
  amount numeric(12, 2) not null default 0,
  status text not null default 'pending',
  shipping jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  email_1_sent_at timestamptz,
  email_2_sent_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent column adds for environments where the table already exists.
alter table public.orders add column if not exists email_1_sent_at timestamptz;
alter table public.orders add column if not exists email_2_sent_at timestamptz;
alter table public.orders add column if not exists converted_at timestamptz;

-- Backfill the timestamp columns from updated_at for any pre-existing rows so
-- the cron's `<column> < cutoff` filter (which excludes NULL) doesn't trap them.
update public.orders
set email_1_sent_at = coalesce(email_1_sent_at, updated_at)
where status in ('email_1_sent', 'email_2_sent') and email_1_sent_at is null;

update public.orders
set email_2_sent_at = coalesce(email_2_sent_at, updated_at)
where status = 'email_2_sent' and email_2_sent_at is null;

update public.orders
set converted_at = coalesce(converted_at, updated_at)
where status = 'converted' and converted_at is null;

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.inventory (
  pack_id text primary key,
  title text not null,
  available integer not null default 0,
  reserved integer not null default 0,
  sold integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists inventory_set_updated_at on public.inventory;
create trigger inventory_set_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

create table if not exists public.promo_codes (
  code text primary key,
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

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
before update on public.promo_codes
for each row execute function public.set_updated_at();

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
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

drop trigger if exists refunds_set_updated_at on public.refunds;
create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function public.set_updated_at();

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
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

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source text,
  status text not null default 'confirmed',
  source_payload jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  context text not null,
  severity text not null default 'error',
  message text,
  stack text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_counters (
  id text primary key,
  current_seq integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.invoice_counters (id, current_seq)
values ('global', 0)
on conflict (id) do nothing;

create or replace function public.next_invoice_seq()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_seq integer;
begin
  insert into public.invoice_counters (id, current_seq)
  values ('global', 0)
  on conflict (id) do nothing;

  update public.invoice_counters
  set current_seq = current_seq + 1,
      updated_at = now()
  where id = 'global'
  returning current_seq into next_seq;

  return next_seq;
end;
$$;

alter table public.payments enable row level security;
alter table public.orders enable row level security;
alter table public.inventory enable row level security;
alter table public.promo_codes enable row level security;
alter table public.refunds enable row level security;
alter table public.error_logs enable row level security;
alter table public.invoice_counters enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.subscriptions enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.payments to service_role;
grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.inventory to service_role;
grant select, insert, update, delete on public.promo_codes to service_role;
grant select, insert, update, delete on public.refunds to service_role;
grant select, insert, update, delete on public.error_logs to service_role;
grant select, insert, update, delete on public.invoice_counters to service_role;
grant select, insert, update, delete on public.contact_submissions to service_role;
grant select, insert, update, delete on public.subscriptions to service_role;
grant execute on function public.next_invoice_seq() to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 5242880, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf'];
