-- ============================================================================
-- First-class, order-scoped inventory reservations (audit P0 #5)
--
-- Today inventory is a bare `reserved` counter plus a 15-min KV key, and the
-- counter is released by pack+qty from cart status — so superseded carts leak
-- reservations, repeated failures can over-release, and unpaid holds linger for
-- up to 72h. This adds a per-reservation ledger whose *status transition* is the
-- atomic, only-once gate in front of every counter mutation:
--
--   reserved --consume-->  consumed   (paid)        terminal
--   reserved --release-->  released   (failed/cancelled/superseded) terminal
--   reserved --expire-->   expired    (TTL elapsed) terminal
--
-- A conditional UPDATE (... WHERE status = 'reserved') is atomic per row, so a
-- reservation can be released/consumed/expired exactly once regardless of how
-- many webhook retries, cron passes, or supersede sweeps race on it.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists reservations (
  reservation_id    text primary key,
  razorpay_order_id text,
  pack_id           text not null,
  quantity          int  not null,
  customer_email    text,
  status            text not null default 'reserved'
                      check (status in ('reserved', 'consumed', 'released', 'expired')),
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists reservations_status_expires_idx
  on reservations (status, expires_at);
create index if not exists reservations_email_status_idx
  on reservations (customer_email, status);
create index if not exists reservations_order_idx
  on reservations (razorpay_order_id);

-- Server-only table: RLS on (no anon/authenticated policies) + service_role grant.
alter table public.reservations enable row level security;
grant select, insert, update, delete on public.reservations to service_role;
