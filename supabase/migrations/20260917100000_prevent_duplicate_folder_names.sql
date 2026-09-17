-- Folder names are unique per user after trimming whitespace and ignoring case.
-- Preserve the oldest folder when cleaning historic duplicates and retain all of
-- its recipe links before adding the database-level guard.
with ranked_folders as (
  select
    id,
    first_value(id) over (
      partition by user_id, lower(btrim(name))
      order by created_at asc, id asc
    ) as canonical_id,
    row_number() over (
      partition by user_id, lower(btrim(name))
      order by created_at asc, id asc
    ) as duplicate_position
  from public.folders
), duplicate_folders as (
  select id, canonical_id
  from ranked_folders
  where duplicate_position > 1
)
insert into public.recipe_folders (recipe_id, folder_id)
select recipe_folders.recipe_id, duplicate_folders.canonical_id
from public.recipe_folders
join duplicate_folders on duplicate_folders.id = recipe_folders.folder_id
on conflict do nothing;

with ranked_folders as (
  select
    id,
    row_number() over (
      partition by user_id, lower(btrim(name))
      order by created_at asc, id asc
    ) as duplicate_position
  from public.folders
)
delete from public.folders
where id in (select id from ranked_folders where duplicate_position > 1);

create unique index if not exists folders_user_normalized_name_unique
  on public.folders (user_id, lower(btrim(name)));
