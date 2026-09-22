create or replace function public.update_email_consent(
  p_preference text,
  p_opted_in boolean
)
returns table (
  preference text,
  is_opted_in boolean,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_previous_opt_in boolean;
  v_consent_version constant text := 'email-settings-v1-2026-07-28';
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_preference not in ('weekly_digest', 'cooking_tips') then
    raise exception 'Invalid email preference';
  end if;

  select ep.is_opted_in
  into v_previous_opt_in
  from public.email_preferences ep
  where ep.user_id = v_user_id
    and ep.preference = p_preference;

  if v_previous_opt_in is not null and v_previous_opt_in = p_opted_in then
    return query
    select ep.preference, ep.is_opted_in, ep.opted_in_at, ep.opted_out_at, ep.updated_at
    from public.email_preferences ep
    where ep.user_id = v_user_id
      and ep.preference = p_preference;
    return;
  end if;

  insert into public.email_preferences (
    user_id,
    preference,
    is_opted_in,
    opted_in_at,
    opted_out_at,
    consent_version,
    updated_at
  )
  values (
    v_user_id,
    p_preference,
    p_opted_in,
    case when p_opted_in then now() else null end,
    case when p_opted_in then null else now() end,
    v_consent_version,
    now()
  )
  on conflict on constraint email_preferences_pkey do update
  set
    is_opted_in = excluded.is_opted_in,
    opted_in_at = case when excluded.is_opted_in then now() else email_preferences.opted_in_at end,
    opted_out_at = case when excluded.is_opted_in then email_preferences.opted_out_at else now() end,
    consent_version = excluded.consent_version,
    updated_at = now();

  insert into public.email_consent_events (
    user_id,
    preference,
    event_type,
    consent_version,
    source
  )
  values (
    v_user_id,
    p_preference,
    case when p_opted_in then 'opted_in' else 'opted_out' end,
    v_consent_version,
    'settings'
  );

  return query
  select ep.preference, ep.is_opted_in, ep.opted_in_at, ep.opted_out_at, ep.updated_at
  from public.email_preferences ep
  where ep.user_id = v_user_id
    and ep.preference = p_preference;
end;
$$;

revoke all on function public.update_email_consent(text, boolean) from public, anon;
grant execute on function public.update_email_consent(text, boolean) to authenticated, service_role;
