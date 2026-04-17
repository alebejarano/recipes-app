alter table public.recipe_document_imports
  add column if not exists status text not null default 'uploading'
    check (status in ('uploading', 'uploaded', 'processing', 'ready', 'failed', 'deleted')),
  add column if not exists failed_reason text,
  add column if not exists source_type text not null default 'upload'
    check (source_type in ('upload')),
  add column if not exists extracted_metadata jsonb,
  add column if not exists uploaded_at timestamptz,
  add column if not exists processing_completed_at timestamptz;

update public.recipe_document_imports
set source_type = coalesce(source_type, source, 'upload')
where source_type is distinct from coalesce(source_type, source, 'upload');

update public.recipe_document_imports
set status = case
  when deleted_at is not null then 'deleted'
  else 'uploaded'
end
where status is null
   or status = 'uploading';

create index if not exists recipe_document_imports_user_created_id_idx
  on public.recipe_document_imports (user_id, created_at desc, id desc);

create or replace function public.get_recipe_document_import_usage()
returns table (
  total_count bigint,
  total_bytes bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) as total_count,
    coalesce(sum(bytes), 0) as total_bytes
  from public.recipe_document_imports
  where user_id = auth.uid()
    and deleted_at is null
    and status in ('uploading', 'uploaded', 'processing', 'ready');
$$;

create or replace function public.list_recipe_document_imports_page(
  p_limit integer default 50,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  title text,
  original_file_name text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  bytes bigint,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with scoped as (
    select
      rdi.id,
      rdi.title,
      rdi.original_file_name,
      rdi.storage_bucket,
      rdi.storage_path,
      rdi.mime_type,
      rdi.bytes,
      rdi.status,
      rdi.created_at
    from public.recipe_document_imports rdi
    where rdi.user_id = auth.uid()
      and rdi.deleted_at is null
      and rdi.status in ('uploaded', 'processing', 'ready')
      and (
        p_before_created_at is null
        or p_before_id is null
        or (rdi.created_at, rdi.id) < (p_before_created_at, p_before_id)
      )
    order by rdi.created_at desc, rdi.id desc
    limit greatest(1, least(coalesce(p_limit, 50), 100))
  )
  select *
  from scoped;
$$;

create or replace function public.reserve_recipe_document_import(
  p_user_id uuid,
  p_original_file_name text,
  p_title text,
  p_storage_bucket text,
  p_storage_path text,
  p_mime_type text,
  p_bytes bigint,
  p_checksum_sha256 text,
  p_source_type text default 'upload'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_retained_bytes bigint := 0;
  v_document_id uuid;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_bytes is null or p_bytes <= 0 then
    raise exception 'Invalid file size.';
  end if;

  if coalesce(trim(p_original_file_name), '') = '' then
    raise exception 'Original file name is required.';
  end if;

  if coalesce(trim(p_storage_bucket), '') <> 'recipe-imports' then
    raise exception 'Invalid storage bucket.';
  end if;

  if split_part(coalesce(p_storage_path, ''), '/', 1) <> p_user_id::text then
    raise exception 'Invalid storage path.';
  end if;

  select ue.plan
    into v_plan
  from public.user_entitlements ue
  where ue.user_id = p_user_id;

  if coalesce(v_plan, 'free') <> 'premium' then
    raise exception 'Premium plan required for cloud imports.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));

  select coalesce(sum(rdi.bytes), 0)
    into v_retained_bytes
  from public.recipe_document_imports rdi
  where rdi.user_id = p_user_id
    and rdi.deleted_at is null
    and rdi.status in ('uploading', 'uploaded', 'processing', 'ready');

  if (v_retained_bytes + p_bytes) > 5368709120 then
    raise exception 'Storage limit reached. Premium includes up to 5 GB total.';
  end if;

  insert into public.recipe_document_imports (
    user_id,
    title,
    original_file_name,
    storage_bucket,
    storage_path,
    mime_type,
    bytes,
    checksum_sha256,
    source,
    source_type,
    status,
    failed_reason,
    extracted_metadata
  )
  values (
    p_user_id,
    nullif(trim(coalesce(p_title, '')), ''),
    trim(p_original_file_name),
    p_storage_bucket,
    p_storage_path,
    p_mime_type,
    p_bytes,
    p_checksum_sha256,
    'upload',
    coalesce(nullif(trim(coalesce(p_source_type, '')), ''), 'upload'),
    'uploading',
    null,
    null
  )
  returning id into v_document_id;

  return v_document_id;
end;
$$;

create or replace function public.mark_recipe_document_import_uploaded(
  p_user_id uuid,
  p_document_id uuid,
  p_extracted_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.recipe_document_imports
  set status = 'uploaded',
      uploaded_at = coalesce(uploaded_at, now()),
      failed_reason = null,
      extracted_metadata = coalesce(p_extracted_metadata, extracted_metadata),
      updated_at = now()
  where id = p_document_id
    and user_id = p_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Document import not found.';
  end if;
end;
$$;

create or replace function public.mark_recipe_document_import_failed(
  p_user_id uuid,
  p_document_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.recipe_document_imports
  set status = 'failed',
      failed_reason = nullif(trim(coalesce(p_reason, '')), ''),
      updated_at = now()
  where id = p_document_id
    and user_id = p_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Document import not found.';
  end if;
end;
$$;

create or replace function public.delete_recipe_document_import(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_user_id uuid := auth.uid();
  v_bucket text;
  v_path text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select storage_bucket, storage_path
    into v_bucket, v_path
  from public.recipe_document_imports
  where id = p_document_id
    and user_id = v_user_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Document not found';
  end if;

  delete from storage.objects
  where bucket_id = v_bucket
    and name = v_path;

  update public.recipe_document_imports
    set deleted_at = now(),
        status = 'deleted',
        failed_reason = null,
        updated_at = now()
  where id = p_document_id
    and user_id = v_user_id
    and deleted_at is null;
end;
$$;

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
begin
  if v_role <> 'service_role' then
    raise exception 'Service role required.';
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

drop policy if exists recipe_imports_update_own on storage.objects;
drop policy if exists recipe_imports_delete_own on storage.objects;

revoke all on function public.reserve_recipe_document_import(uuid, text, text, text, text, text, bigint, text, text) from public, anon, authenticated;
grant execute on function public.reserve_recipe_document_import(uuid, text, text, text, text, text, bigint, text, text) to service_role;

revoke all on function public.mark_recipe_document_import_uploaded(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.mark_recipe_document_import_uploaded(uuid, uuid, jsonb) to service_role;

revoke all on function public.mark_recipe_document_import_failed(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.mark_recipe_document_import_failed(uuid, uuid, text) to service_role;

revoke all on function public.reconcile_recipe_document_imports(integer, boolean) from public, anon, authenticated;
grant execute on function public.reconcile_recipe_document_imports(integer, boolean) to service_role;
