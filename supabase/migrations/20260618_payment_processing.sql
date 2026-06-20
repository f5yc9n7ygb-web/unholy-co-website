-- ============================================================================
-- Durable, atomic payment-processing claim + state machine
-- Audit P0 #3 (non-atomic KV claim) and #4 (no processing state machine).
--
-- Replaces the racy Cloudflare KV `get`+`put` idempotency guard
-- (claimProcessedPayment) with a single-statement atomic claim backed by a
-- Postgres unique constraint, plus an explicit state machine:
--
--   (no row)            --claim-->  processing
--   processing          --success-> completed        (terminal)
--   processing          --failure-> failed_retryable
--   failed_retryable    --claim-->  processing        (retry allowed)
--   processing (stale)  --claim-->  processing        (crashed-worker takeover)
--   completed           --claim-->  DENIED            (never re-fulfils)
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists payment_processing (
  payment_id   text primary key,
  state        text not null default 'processing'
                 check (state in ('processing', 'completed', 'failed_retryable')),
  attempts     int  not null default 1,
  last_error   text,
  claimed_at   timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Atomic claim. Grants to exactly one caller per payment_id.
-- Re-grants when the prior attempt failed retryably, or when a 'processing'
-- claim has gone stale (worker crashed) beyond the takeover window.
-- Never re-grants a 'completed' payment.
create or replace function claim_payment_processing(
  p_payment_id text,
  p_stale_after_seconds int default 120
)
returns table(granted boolean, state text, attempts int)
language plpgsql
as $$
declare
  existing payment_processing%rowtype;
begin
  -- Fast path: first ever claim for this payment_id.
  insert into payment_processing (payment_id) values (p_payment_id)
  on conflict (payment_id) do nothing;
  if found then
    return query select true, 'processing'::text, 1;
    return;
  end if;

  -- Row exists — lock it so concurrent claimers serialize on this decision.
  select * into existing from payment_processing
    where payment_id = p_payment_id
    for update;

  if existing.state = 'completed' then
    return query select false, existing.state, existing.attempts;
    return;
  end if;

  if existing.state = 'failed_retryable'
     or (existing.state = 'processing'
         and existing.claimed_at < now() - make_interval(secs => p_stale_after_seconds)) then
    update payment_processing
      set state = 'processing',
          attempts = existing.attempts + 1,
          claimed_at = now(),
          updated_at = now(),
          last_error = null
      where payment_id = p_payment_id;
    return query select true, 'processing'::text, existing.attempts + 1;
    return;
  end if;

  -- A fresh 'processing' claim is held by another worker → deny.
  return query select false, existing.state, existing.attempts;
end;
$$;

-- Server-only table: RLS on (no anon/authenticated policies) + service_role grant,
-- matching the existing schema convention.
alter table public.payment_processing enable row level security;
grant select, insert, update, delete on public.payment_processing to service_role;
