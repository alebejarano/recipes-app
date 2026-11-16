# Import deletion

Both Collections and Manage Imports use the same deletion service. It resolves
registry/local/cloud identities, deletes synced Premium imports remotely, then
removes all account-scoped local mirrors and their files. Free/device-only
deletion and unsynced imports remain local. A failed cloud operation does not
discard the offline copy or report success.

The shared query mutation cancels older reads, removes deleted identities from
all cached import/document pages and details, then refreshes usage and lists.
Uploads, offline downloads and deletions are serialized for each account, so
an in-flight upload is acknowledged before deletion resolves its cloud ID and
a stale list page cannot redownload a just-deleted object. Background sync
also removes old mirrors only for explicit server deletion markers, never
because an item is absent from a partial list.

## Rollout

Apply `20261116130000_fix_recipe_import_deletion.sql` to the intended Supabase
project before releasing the client changes. The migration fixes Storage
SELECT/DELETE authorization for objects created by the upload Edge Function:
such objects may have no user `owner_id`. Access requires the authenticated
Premium user's folder prefix and a matching metadata row owned by that same
user. Other accounts and unregistered paths remain excluded.

Deletion marks metadata first, then calls the Storage API to remove the object.
The metadata RPC is idempotent and keeps tombstones accessible for retry if
Storage removal fails. An already-deleted object can therefore finish cleanup.
No Edge Function deployment is needed for this fix. The client changes require
the normal app update/release process.

## Checks

- Jest covers local/cloud/registry identities, pending and in-flight uploads,
  offline mirror removal, failures, cache eviction, stale requests, explicit
  server tombstones and account switching.
- Run `supabase/tests/import_deletion.sql` only against an isolated/local
  migrated database with `psql -X -v ON_ERROR_STOP=1`. It creates synthetic
  users/Storage metadata, exercises actual RLS as `authenticated`, and rolls
  everything back. It does not create or remove actual stored files.
- On the dev app, import a file, open it once to cache it, delete it from each
  deletion surface, then revisit Collections, Home and its former detail
  route. It must be absent and unavailable offline after a successful delete.
  Repeat immediately after uploading and after restarting the app. Verify
  Supabase metadata is tombstoned and the object is removed through Storage.
- Force a network/Storage failure in dev: the app must show failure and keep
  the offline copy. Restore access and retry; the deletion must complete.
