-- Public buckets can serve known object URLs without a broad SELECT policy.
-- Drop the legacy public read policy so clients cannot list all recipe images.

update storage.buckets
set public = true
where id = 'recipe-images';

drop policy if exists "Public read recipe images"
  on storage.objects;
