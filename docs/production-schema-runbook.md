# Production schema runbook

The production database must be created from the committed Supabase migrations,
not from a data copy. This preserves the recipe, subscription/entitlement,
credit, Laravel queue, and Laravel cache schema without moving development user
data into production.

## 1. Export the current development schema

Run this from the repository root with a direct development Postgres connection
string available only in your shell (do not commit it):

```bash
supabase db pull dev_schema_export \
  --db-url "$DEV_SUPABASE_DB_URL" \
  --schema public
```

This writes a timestamped migration under `supabase/migrations/`. Review and
commit it before provisioning production. The export is essential because the
initial recipe tables were originally created in development before migrations
were introduced; it catches any live definition that is not represented by the
baseline migration.

If the CLI is linked to the development project and direct Postgres DNS works,
the equivalent command is:

```bash
supabase db pull dev_schema_export --linked --schema public
```

Never export `auth`, `storage`, `extensions`, or data rows for this purpose.
Supabase provisions its managed schemas in the new project; the application
schema is `public`.

## 2. Reconcile the export

Confirm that the resulting migration includes all application objects and does
not drop an intentional object. At minimum, verify:

- Recipe data: `recipes`, `recipe_ingredients`, `recipe_folders`, `folders`,
  `notes`, `shopping_lists`, and `recipe_document_imports`.
- AI/credit data: `recipe_extractions` and `credit_ledgers`.
- Subscription data: `user_entitlements`, `premium_upgrade_requests`, and the
  free-library slot tables.
- Laravel operational data: `jobs`, `failed_jobs`, `cache`, and `cache_locks`.
- Their indexes, constraints, RLS policies, functions, triggers, and required
  `storage.objects` policies.

The Laravel cache migration is committed as
`20261110120000_add_laravel_database_cache.sql`. `jobs` and `failed_jobs` are
already versioned by `20261019120000_create_ai_recipe_extractions.sql`.

For an existing production project, first run `supabase migration list` with
the production database URL. If extraction tables already exist, do not replay
or recreate them; apply only migrations missing from the production history.

## 3. Provision and verify production

Link the CLI to the new production project, then apply migrations:

```bash
supabase link --project-ref <production-project-ref>
supabase db push
supabase migration list --linked
```

The last command must show every local migration as applied remotely. Save the
output with the release record. Deploy Edge Functions separately after the
schema is ready; set their production secrets in the production project only.

For an independent schema check, compare the public schema against production
using read-only database credentials:

```bash
supabase db diff --db-url "$PROD_SUPABASE_DB_URL" --schema public
```

An empty diff after the dev export migration and `db push` is the release gate.

## Security notes

- Do not copy development `auth.users`, recipe rows, payment/entitlement rows,
  queue payloads, or cache values into production.
- RLS remains enabled on the Laravel queue/cache tables. Laravel must use a
  server-side direct database role that can perform its background work; never
  expose that credential to the Expo client.
- Keep `EXPO_PUBLIC_SUPABASE_*` production values in the production EAS
  environment only, as described in the repository README.
