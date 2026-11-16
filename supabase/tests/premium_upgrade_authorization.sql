-- Run only against an isolated/local database after applying migrations:
-- psql "$LOCAL_TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
--   -f supabase/tests/premium_upgrade_authorization.sql
-- All synthetic users and content are rolled back, including on disconnect.
begin;

do $$
declare
  v_user_id uuid := gen_random_uuid();
  v_payload jsonb := '{"entities":{"recipes":[],"notes":[],"folders":[]}}';
  v_result jsonb;
  v_before public.user_entitlements%rowtype;
  v_after public.user_entitlements%rowtype;
begin
  if has_function_privilege('anon', 'public.premium_upgrade_merge(uuid,text,jsonb)', 'execute')
     or has_function_privilege('authenticated', 'public.premium_upgrade_merge(uuid,text,jsonb)', 'execute') then
    raise exception 'Untrusted roles can execute the privileged merge';
  end if;
  if not has_function_privilege('service_role', 'public.premium_upgrade_merge(uuid,text,jsonb)', 'execute') then
    raise exception 'Backend cannot execute the merge';
  end if;

  insert into auth.users (id) values (v_user_id);
  delete from public.user_entitlements where user_id = v_user_id;

  begin
    perform public.premium_upgrade_merge(v_user_id, 'year', v_payload);
    raise exception 'Merge accepted a missing entitlement';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from public.user_entitlements where user_id = v_user_id) then
    raise exception 'Merge created an entitlement';
  end if;

  insert into public.user_entitlements (user_id, plan, billing_cycle)
  values (v_user_id, 'free', 'month');
  begin
    perform public.premium_upgrade_merge(v_user_id, 'year', v_payload);
    raise exception 'Merge accepted a Free account';
  exception when insufficient_privilege then null;
  end;

  -- An old client-requested Premium grant has no provider event timestamp.
  update public.user_entitlements set plan = 'premium', store_event_at = null where user_id = v_user_id;
  begin
    perform public.premium_upgrade_merge(v_user_id, 'year', v_payload);
    raise exception 'Merge accepted an unverified legacy Premium flag';
  exception when insufficient_privilege then null;
  end;

  perform public.apply_revenuecat_entitlement_event(v_user_id, 'premium', 'month', now());
  select * into v_before from public.user_entitlements where user_id = v_user_id;
  v_payload := jsonb_build_object('entities', jsonb_build_object('recipes', jsonb_build_array(
    jsonb_build_object('localId', 'fixture-recipe', 'version', 1, 'updatedAt', now(), 'data',
      jsonb_build_object('title', 'Synthetic recipe', 'ingredientsJson', '[]', 'foldersJson', '[]'))
  )));
  v_result := public.premium_upgrade_merge(v_user_id, 'year', v_payload);
  select * into v_after from public.user_entitlements where user_id = v_user_id;
  if v_after is distinct from v_before then
    raise exception 'Content merge changed the server entitlement';
  end if;
  if v_result #>> '{entitlement,billingCycle}' <> 'month' then
    raise exception 'Client billing cycle overrode the verified billing cycle';
  end if;
  if (select count(*) from public.recipes where user_id = v_user_id and client_id = 'fixture-recipe') <> 1 then
    raise exception 'Verified subscriber could not merge a recipe';
  end if;
  perform public.premium_upgrade_merge(v_user_id, 'year', v_payload);
  if (select count(*) from public.recipes where user_id = v_user_id and client_id = 'fixture-recipe') <> 1 then
    raise exception 'Repeated merge duplicated the recipe';
  end if;

  -- A newer expiration wins over an older verified snapshot.
  perform public.apply_revenuecat_entitlement_event(v_user_id, 'free', 'month', now() + interval '1 second');
  perform public.apply_revenuecat_entitlement_event(v_user_id, 'premium', 'year', now());
  begin
    perform public.premium_upgrade_merge(v_user_id, 'year', v_payload);
    raise exception 'Merge reactivated an expired subscription';
  exception when insufficient_privilege then null;
  end;
  if (select plan from public.user_entitlements where user_id = v_user_id) <> 'free' then
    raise exception 'Older verification overwrote a newer expiration';
  end if;

  raise notice 'PASS: merge authorization, no self-upgrade, verified purchase, retries and newer revocation';
end;
$$;

rollback;
