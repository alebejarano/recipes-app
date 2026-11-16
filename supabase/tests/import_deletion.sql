-- Isolated/local database only, after migrations. No real Storage bytes are
-- created: these synthetic metadata rows and users are rolled back together.
begin;
do $$
declare
  v_a uuid := gen_random_uuid();
  v_b uuid := gen_random_uuid();
  v_document_a uuid := gen_random_uuid();
  v_document_b uuid := gen_random_uuid();
  v_path_a text := v_a::text || '/fixture.pdf';
  v_path_b text := v_b::text || '/fixture.pdf';
  v_count integer;
begin
  insert into auth.users (id) values (v_a), (v_b);
  perform public.apply_revenuecat_entitlement_event(v_a, 'premium', 'month', now());
  perform public.apply_revenuecat_entitlement_event(v_b, 'premium', 'month', now());
  insert into public.recipe_document_imports
    (id, user_id, original_file_name, storage_bucket, storage_path, mime_type, bytes, checksum_sha256, status)
  values
    (v_document_a, v_a, 'fixture.pdf', 'recipe-imports', v_path_a, 'application/pdf', 100, v_a::text, 'uploaded'),
    (v_document_b, v_b, 'fixture.pdf', 'recipe-imports', v_path_b, 'application/pdf', 100, v_b::text, 'uploaded');
  insert into storage.objects (bucket_id, name, owner_id)
  values ('recipe-imports', v_path_a, null), ('recipe-imports', v_path_b, null),
    ('recipe-imports', v_a::text || '/unregistered.pdf', null);

  perform set_config('request.jwt.claim.sub', v_a::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  if (select count(*) from storage.objects where bucket_id = 'recipe-imports' and name = v_path_a) <> 1 then
    raise exception 'Owner cannot read a service-uploaded import with NULL owner_id';
  end if;
  if exists (select 1 from storage.objects where bucket_id = 'recipe-imports' and name = v_path_b) then
    raise exception 'Another account can read the import';
  end if;
  if exists (select 1 from storage.objects where name = v_a::text || '/unregistered.pdf') then
    raise exception 'Unregistered objects unexpectedly pass metadata authorization';
  end if;
  begin
    perform public.delete_recipe_document_import(v_document_b);
    raise exception 'Cross-account metadata deletion succeeded';
  exception when raise_exception then
    if sqlerrm <> 'Document not found' then raise; end if;
  end;

  perform public.delete_recipe_document_import(v_document_a);
  -- Retry must still authorize physical removal against a tombstone.
  perform public.delete_recipe_document_import(v_document_a);
  if not exists (select 1 from public.recipe_document_imports where id = v_document_a and deleted_at is not null and status = 'deleted') then
    raise exception 'Metadata was not marked deleted';
  end if;
  delete from storage.objects where bucket_id = 'recipe-imports' and name = v_path_a;
  get diagnostics v_count = row_count;
  if v_count <> 1 then raise exception 'Owner cannot remove service-uploaded bytes after soft deletion'; end if;
  delete from storage.objects where bucket_id = 'recipe-imports' and name = v_path_b;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'Cross-account object deletion succeeded'; end if;

  execute 'reset role';
  update public.user_entitlements set plan = 'free' where user_id = v_a;
  execute 'set local role authenticated';
  begin
    perform public.delete_recipe_document_import(v_document_a);
    raise exception 'Free account unexpectedly passed cloud authorization';
  exception when raise_exception then
    if sqlerrm <> 'Premium plan required for cloud imports.' then raise; end if;
  end;
  execute 'reset role';
  raise notice 'PASS: service uploads, tombstone retries, cross-account isolation and Free rejection';
end;
$$;
rollback;
