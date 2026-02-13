-- Fair-use guardrails for premium import processing.
-- Abuse triggers:
-- 1) Rate: max 10 uploads / 10 minutes / user
-- 2) Concurrency: max 2 active processing uploads / user
-- 3) Daily soft threshold: 2 GB processed / day / user -> 15 min cooldown
-- 4) Monthly soft threshold: 50 GB processed / month / user -> review required

create table if not exists public.import_upload_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  bytes bigint not null check (bytes > 0),
  status text not null check (status in ('processing', 'completed', 'failed', 'rejected')),
  reason text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists import_upload_events_user_created_idx
  on public.import_upload_events(user_id, created_at desc);

create index if not exists import_upload_events_user_status_idx
  on public.import_upload_events(user_id, status);

create table if not exists public.import_upload_user_state (
  user_id uuid primary key,
  cooldown_until timestamptz,
  review_required boolean not null default false,
  review_reason text,
  updated_at timestamptz not null default now()
);

create or replace function public.begin_import_upload_guard(
  p_user_id uuid,
  p_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_rate_limit_count integer := 0;
  v_active_count integer := 0;
  v_daily_bytes bigint := 0;
  v_monthly_bytes bigint := 0;
  v_event_id uuid;
  v_cooldown_until timestamptz;
  v_review_required boolean := false;
  v_retry_seconds integer := null;
  v_delay_ms integer := 0;
  v_daily_limit bigint := 2147483648; -- 2 GB
  v_monthly_limit bigint := 53687091200; -- 50 GB
begin
  if p_user_id is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'unauthorized'
    );
  end if;

  if p_bytes is null or p_bytes <= 0 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_file_size'
    );
  end if;

  -- Serialize per-user decisions to keep counters coherent.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  insert into public.import_upload_user_state (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select cooldown_until, review_required
    into v_cooldown_until, v_review_required
  from public.import_upload_user_state
  where user_id = p_user_id;

  if v_review_required then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_review_required'
    );
  end if;

  if v_cooldown_until is not null and v_cooldown_until > v_now then
    v_retry_seconds := greatest(1, ceil(extract(epoch from (v_cooldown_until - v_now)))::integer);
    return jsonb_build_object(
      'allowed', false,
      'reason', 'cooldown_active',
      'retry_after_seconds', v_retry_seconds
    );
  end if;

  select count(*)
    into v_rate_limit_count
  from public.import_upload_events
  where user_id = p_user_id
    and created_at >= (v_now - interval '10 minutes')
    and status in ('processing', 'completed');

  if v_rate_limit_count >= 10 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'retry_after_seconds', 600
    );
  end if;

  select count(*)
    into v_active_count
  from public.import_upload_events
  where user_id = p_user_id
    and status = 'processing';

  if v_active_count >= 2 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'concurrency_limited',
      'retry_after_seconds', 30
    );
  end if;

  select coalesce(sum(bytes), 0)
    into v_daily_bytes
  from public.import_upload_events
  where user_id = p_user_id
    and status = 'completed'
    and created_at >= date_trunc('day', v_now);

  select coalesce(sum(bytes), 0)
    into v_monthly_bytes
  from public.import_upload_events
  where user_id = p_user_id
    and status = 'completed'
    and created_at >= date_trunc('month', v_now);

  if (v_monthly_bytes + p_bytes) > v_monthly_limit then
    update public.import_upload_user_state
      set review_required = true,
          review_reason = 'monthly_soft_threshold_exceeded',
          updated_at = v_now
    where user_id = p_user_id;

    return jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_threshold_support'
    );
  end if;

  if (v_daily_bytes + p_bytes) > v_daily_limit then
    update public.import_upload_user_state
      set cooldown_until = (v_now + interval '15 minutes'),
          updated_at = v_now
    where user_id = p_user_id;

    return jsonb_build_object(
      'allowed', false,
      'reason', 'daily_cooldown',
      'retry_after_seconds', 900
    );
  end if;

  -- Soft slowdown zone near daily threshold.
  if (v_daily_bytes + p_bytes) > (v_daily_limit * 9 / 10) then
    v_delay_ms := 2000;
  end if;

  insert into public.import_upload_events (user_id, bytes, status, created_at)
  values (p_user_id, p_bytes, 'processing', v_now)
  returning id into v_event_id;

  return jsonb_build_object(
    'allowed', true,
    'event_id', v_event_id,
    'delay_ms', v_delay_ms
  );
end;
$$;

create or replace function public.finish_import_upload_guard(
  p_event_id uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_id is null then
    return;
  end if;

  if p_status not in ('completed', 'failed', 'rejected') then
    raise exception 'Invalid guard status: %', p_status;
  end if;

  update public.import_upload_events
    set status = p_status,
        reason = coalesce(p_reason, reason),
        finished_at = now()
  where id = p_event_id;
end;
$$;
