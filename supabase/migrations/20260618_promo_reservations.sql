-- ============================================================================
-- Promo usage reservations — close limited-use promo fan-out (audit P0 #6)
--
-- Today a limited promo is only *checked* at order creation and *consumed* at
-- payment, so a user can spin up many discounted Razorpay orders before paying;
-- and when the consume increment fails at the cap, fulfilment continues anyway.
--
-- This reserves a promo slot atomically at order creation (counting toward the
-- cap immediately) and settles/releases it via only-once status transitions —
-- mirroring the inventory reservation ledger.
--
--   reserve (order create) --> reserved   (used_count += 1, capped)
--   pay success            --> consumed    (slot already counted)
--   fail/expire/cancel      --> released    (used_count -= 1, exactly once)
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists promo_reservations (
  reservation_id    text primary key,         -- the order contextId
  razorpay_order_id text,                      -- linked once the order is created
  code              text not null,
  status            text not null default 'reserved'
                      check (status in ('reserved', 'consumed', 'released', 'expired')),
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists promo_reservations_order_idx
  on promo_reservations (razorpay_order_id);
create index if not exists promo_reservations_status_expires_idx
  on promo_reservations (status, expires_at);

-- Atomically reserve a promo slot. Counts the reservation toward used_count so
-- concurrent reservations can't blow past usage_limit. Unknown/built-in codes
-- (no promo_codes row) and unlimited codes are granted without tracking.
create or replace function reserve_promo_usage(
  p_code text,
  p_reservation_id text,
  p_ttl_seconds int default 1800
)
returns table(granted boolean, reason text)
language plpgsql
as $$
declare
  promo promo_codes%rowtype;
begin
  select * into promo from promo_codes where code = upper(trim(p_code)) for update;
  if not found then
    return query select true, 'no_promo_row'::text; return;
  end if;
  if not promo.is_active then
    return query select false, 'inactive'::text; return;
  end if;
  if promo.usage_limit is not null and promo.usage_limit > 0
     and promo.used_count >= promo.usage_limit then
    return query select false, 'limit_reached'::text; return;
  end if;

  insert into promo_reservations (reservation_id, code, status, expires_at)
  values (p_reservation_id, promo.code, 'reserved', now() + make_interval(secs => p_ttl_seconds))
  on conflict (reservation_id) do nothing;

  if found then
    update promo_codes set used_count = used_count + 1 where code = promo.code;
    return query select true, 'reserved'::text; return;
  end if;

  -- Reservation already existed for this contextId (retry) — idempotent grant.
  return query select true, 'already_reserved'::text;
end;
$$;

-- Release a promo reservation exactly once (reserved -> released, used_count--).
create or replace function release_promo_reservation_by_order(p_order_id text)
returns boolean
language plpgsql
as $$
declare released_code text;
begin
  update promo_reservations
    set status = 'released', updated_at = now()
    where razorpay_order_id = p_order_id and status = 'reserved'
    returning code into released_code;
  if not found then return false; end if;
  update promo_codes set used_count = greatest(0, used_count - 1) where code = released_code;
  return true;
end;
$$;
