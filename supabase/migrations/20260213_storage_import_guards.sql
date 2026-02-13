-- Enforce server-side Storage safeguards for premium uploads.
-- Limits: 10 MB per file, MIME allowlist, user-owned folder paths.

insert into storage.buckets (id, name, public)
values ('recipe-imports', 'recipe-imports', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_imports_select_own'
  ) then
    create policy recipe_imports_select_own
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'recipe-imports'
        and owner = auth.uid()
      );
  end if;
end
$$;

-- Intentionally no authenticated INSERT policy for recipe-imports.
-- Uploads must go through Edge Functions using service-role credentials,
-- so encrypted PDF checks cannot be bypassed by direct client uploads.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_imports_update_own'
  ) then
    create policy recipe_imports_update_own
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'recipe-imports'
        and owner = auth.uid()
      )
      with check (
        bucket_id = 'recipe-imports'
        and owner = auth.uid()
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_imports_delete_own'
  ) then
    create policy recipe_imports_delete_own
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'recipe-imports'
        and owner = auth.uid()
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_images_insert_guarded'
  ) then
    create policy recipe_images_insert_guarded
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'recipe-images'
        and owner = auth.uid()
        and (storage.foldername(name))[1] = auth.uid()::text
        and lower(coalesce((metadata->>'mimetype'), '')) in ('image/jpeg', 'image/png')
        and coalesce((metadata->>'size'), '0')::bigint > 0
        and coalesce((metadata->>'size'), '0')::bigint <= 10485760
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_images_update_own'
  ) then
    create policy recipe_images_update_own
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'recipe-images'
        and owner = auth.uid()
      )
      with check (
        bucket_id = 'recipe-images'
        and owner = auth.uid()
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'recipe_images_delete_own'
  ) then
    create policy recipe_images_delete_own
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'recipe-images'
        and owner = auth.uid()
      );
  end if;
end
$$;
