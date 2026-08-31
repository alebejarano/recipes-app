alter table public.user_entitlements
  add column if not exists store_event_at timestamptz;

create or replace function public.apply_revenuecat_entitlement_event(
  p_user_id uuid,
  p_plan text,
  p_billing_cycle text,
  p_event_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_plan not in ('free', 'premium') then
    raise exception 'Invalid plan';
  end if;

  if p_billing_cycle not in ('month', 'year') then
    raise exception 'Invalid billing cycle';
  end if;

  if p_event_at is null then
    raise exception 'p_event_at is required';
  end if;

  insert into public.user_entitlements (
    user_id,
    plan,
    billing_cycle,
    activated_at,
    updated_at,
    store_event_at
  )
  values (
    p_user_id,
    p_plan,
    p_billing_cycle,
    now(),
    now(),
    p_event_at
  )
  on conflict (user_id) do update
  set
    plan = excluded.plan,
    billing_cycle = excluded.billing_cycle,
    activated_at = case
      when excluded.plan = 'premium' then excluded.activated_at
      else user_entitlements.activated_at
    end,
    updated_at = now(),
    store_event_at = excluded.store_event_at
  where user_entitlements.store_event_at is null
    or user_entitlements.store_event_at <= excluded.store_event_at;
end;
$$;

revoke all on function public.apply_revenuecat_entitlement_event(uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.apply_revenuecat_entitlement_event(uuid, text, text, timestamptz)
  to service_role;
