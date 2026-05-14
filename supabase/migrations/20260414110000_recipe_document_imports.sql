create table if not exists public.recipe_document_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  original_file_name text not null,
  storage_bucket text not null default 'recipe-imports',
  storage_path text not null,
  mime_type text not null,
  bytes bigint not null check (bytes > 0),
  checksum_sha256 text not null,
  source text not null default 'upload' check (source in ('upload')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists recipe_document_imports_user_storage_path_uniq
  on public.recipe_document_imports (user_id, storage_path)
  where deleted_at is null;

create unique index if not exists recipe_document_imports_user_checksum_uniq
  on public.recipe_document_imports (user_id, checksum_sha256)
  where deleted_at is null;

create index if not exists recipe_document_imports_user_created_idx
  on public.recipe_document_imports (user_id, created_at desc);

create index if not exists recipe_document_imports_user_deleted_idx
  on public.recipe_document_imports (user_id, deleted_at);

alter table public.recipe_document_imports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'recipe_document_imports'
      and policyname = 'recipe_document_imports_select_own'
  ) then
    create policy recipe_document_imports_select_own
      on public.recipe_document_imports
      for select
      to authenticated
      using (user_id = (select auth.uid()));
  end if;
end
$$;

create or replace function public.recipe_document_imports_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists recipe_document_imports_set_updated_at on public.recipe_document_imports;

create trigger recipe_document_imports_set_updated_at
before update on public.recipe_document_imports
for each row
execute function public.recipe_document_imports_set_updated_at();

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
    and deleted_at is null;
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
        updated_at = now()
  where id = p_document_id
    and user_id = v_user_id
    and deleted_at is null;
end;
$$;
