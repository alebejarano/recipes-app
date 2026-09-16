-- A Premium upgrade previously allowed the regular sync worker to run between
-- purchase confirmation and the upgrade migration. That could create one
-- cloud row directly and another through the migration for the same local
-- folder or note. Remove only those narrowly-identifiable copies: they have
-- identical content, are created within ten minutes, and only the canonical
-- row has the migration client ID.

do $$
declare
  canonical_folder record;
  duplicate_folder record;
  canonical_note record;
  duplicate_note record;
begin
  for canonical_folder in
    select distinct on (f.user_id, lower(btrim(f.name)))
      f.id,
      f.user_id,
      lower(btrim(f.name)) as normalized_name,
      f.created_at
    from public.folders f
    where f.client_id is not null
    order by f.user_id, lower(btrim(f.name)), f.created_at asc, f.id asc
  loop
    for duplicate_folder in
      select f.id
      from public.folders f
      where f.user_id = canonical_folder.user_id
        and lower(btrim(f.name)) = canonical_folder.normalized_name
        and f.id <> canonical_folder.id
        and f.client_id is null
        and f.client_version is null
        and abs(extract(epoch from (f.created_at - canonical_folder.created_at))) <= 600
    loop
      insert into public.recipe_folders (recipe_id, folder_id)
      select recipe_id, canonical_folder.id
      from public.recipe_folders
      where folder_id = duplicate_folder.id
      on conflict do nothing;

      delete from public.recipe_folders where folder_id = duplicate_folder.id;
      delete from public.folders where id = duplicate_folder.id;
    end loop;
  end loop;

  for canonical_note in
    select n.id, n.user_id, n.title, n.content, n.pinned_at, n.created_at
    from public.notes n
    where n.client_id is not null
  loop
    for duplicate_note in
      select n.id
      from public.notes n
      where n.user_id = canonical_note.user_id
        and n.id <> canonical_note.id
        and n.client_id is null
        and n.client_version is null
        and n.title is not distinct from canonical_note.title
        and n.content is not distinct from canonical_note.content
        and n.pinned_at is not distinct from canonical_note.pinned_at
        and abs(extract(epoch from (n.created_at - canonical_note.created_at))) <= 600
    loop
      delete from public.notes where id = duplicate_note.id;
    end loop;
  end loop;
end;
$$;
