create extension if not exists pg_cron;

create or replace function public.reconcile_recipe_document_imports(
  p_limit integer default 1000,
  p_delete_storage_orphans boolean default false
)
returns table (
  storage_orphans bigint,
  metadata_orphans bigint,
  repaired_metadata bigint,
  deleted_storage bigint
)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_role text := current_setting('request.jwt.claim.role', true);
  v_user text := current_user;
begin
  if v_role <> 'service_role' and v_user not in ('postgres', 'supabase_admin') then
    raise exception 'Service role or scheduler role required.';
  end if;

  with storage_orphan_rows as (
    select o.id
    from storage.objects o
    left join public.recipe_document_imports rdi
      on rdi.storage_bucket = o.bucket_id
     and rdi.storage_path = o.name
     and rdi.deleted_at is null
    where o.bucket_id = 'recipe-imports'
      and rdi.id is null
    limit greatest(1, least(coalesce(p_limit, 1000), 5000))
  ),
  metadata_orphan_rows as (
    select rdi.id
    from public.recipe_document_imports rdi
    left join storage.objects o
      on o.bucket_id = rdi.storage_bucket
     and o.name = rdi.storage_path
    where rdi.storage_bucket = 'recipe-imports'
      and rdi.deleted_at is null
      and rdi.status in ('uploaded', 'processing', 'ready')
      and o.id is null
    limit greatest(1, least(coalesce(p_limit, 1000), 5000))
  ),
  repaired as (
    update public.recipe_document_imports rdi
    set status = 'failed',
        failed_reason = 'Storage object missing during reconciliation.',
        updated_at = now()
    where rdi.id in (select id from metadata_orphan_rows)
    returning 1
  ),
  deleted as (
    delete from storage.objects o
    where p_delete_storage_orphans
      and o.id in (select id from storage_orphan_rows)
    returning 1
  )
  select
    (select count(*) from storage_orphan_rows),
    (select count(*) from metadata_orphan_rows),
    (select count(*) from repaired),
    (select count(*) from deleted)
  into storage_orphans, metadata_orphans, repaired_metadata, deleted_storage;

  return next;
end;
$$;

do $schedule$
declare
  v_job_id bigint;
begin
  select jobid
    into v_job_id
  from cron.job
  where jobname = 'recipe-document-imports-nightly-repair';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'recipe-document-imports-nightly-repair',
    '15 3 * * *',
    $job$select public.reconcile_recipe_document_imports(1000, false);$job$
  );
end
$schedule$;

-- Future weekly destructive cleanup template.
-- Keep disabled for MVP until storage orphan volume justifies automatic deletion.
--
-- do $schedule$
-- declare
--   v_job_id bigint;
-- begin
--   select jobid
--     into v_job_id
--   from cron.job
--   where jobname = 'recipe-document-imports-weekly-storage-cleanup';
--
--   if v_job_id is not null then
--     perform cron.unschedule(v_job_id);
--   end if;
--
--   perform cron.schedule(
--     'recipe-document-imports-weekly-storage-cleanup',
--     '30 4 * * 0',
--     $job$select public.reconcile_recipe_document_imports(1000, true);$job$
--   );
-- end
-- $schedule$;
