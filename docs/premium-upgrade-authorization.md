# Premium upgrade authorization

The upgrade endpoint checks the authenticated Supabase user's `Dropsauce Pro`
subscription directly through RevenueCat before accessing upgrade records or
merging content. It does not trust client entitlement data, billing cycle, a
caller-supplied customer ID, or an existing Supabase Premium flag. A verified
purchase can proceed before the webhook arrives.

The endpoint uses RevenueCat's [Customer Info API](https://www.revenuecat.com/docs/api-v1/customers)
and its [documented entitlement/subscription fields](https://www.revenuecat.com/docs/api-v1/customer-info-model).
It supports this app's monthly/yearly subscriptions, paid-through cancellations,
and billing grace periods. Promotional/lifetime grants without a matching active
subscription are deliberately not accepted by this purchase-migration endpoint.

## Server configuration and deployment

1. Configure `REVENUECAT_SECRET_API_KEY` in **Supabase Edge Function secrets** for
   the matching RevenueCat project. Use a server secret key compatible with the
   v1 Customer Info endpoint. Never use an `EXPO_PUBLIC_*` variable or put this
   key in the app, tracked dotenv files, EAS client variables, logs, or tickets.
   See [RevenueCat API key guidance](https://www.revenuecat.com/docs/projects/authentication).
2. Production must leave `REVENUECAT_ALLOW_SANDBOX` unset or set it to `false`.
   Set it to exactly `true` only in an isolated development/test backend that
   intentionally accepts sandbox subscriptions. Keep the webhook's environment
   filter consistent; this change does not replace webhook configuration.
3. Apply `20261116120000_require_verified_premium_upgrade.sql` using the usual
   reviewed migration process. It replaces the merge function without changing
   historical migrations or user content. The merge no longer creates/updates
   entitlements and requires a Premium record with a server event timestamp.
4. Deploy `premium-upgrade-sync`, including its `handler.ts`, `revenuecat.ts`, and
   per-function `deno.json`. Both the migration and function deployment are
   required. Deploy the migration first: the older endpoint then cannot grant a
   Free/missing/unverified account Premium while rollout completes.
5. In the test backend, verify Free and expired users receive 403, a valid
   purchased account succeeds with delayed webhook delivery, and a provider
   outage/missing secret returns 503 without changing entitlement/content data.

RevenueCat verification failures are never replaced with client or database
fallback access. Requests time out after ten seconds, and provider/database
details are not returned to the client. The provider snapshot timestamp is
applied through the existing ordered entitlement-event RPC, so a newer webhook
can prevent a stale upgrade from proceeding.

This patch prevents new self-upgrades. It does not automatically revoke
pre-existing Premium grants: reconcile potentially affected accounts against
RevenueCat through a separately reviewed backend operation. Do not blindly
revoke all legacy rows; some represent legitimate subscribers awaiting a
webhook. General webhook transfer/expiry reconciliation remains a separate
audit finding.

## Regression checks

`npm run test:edge` runs the actual request handler with mocked authentication,
RevenueCat responses, and persistence in a Node-environment Jest project. It is
also included in `npm run test:ci`. It makes no network requests or purchases.

Run `supabase/tests/premium_upgrade_authorization.sql` with `psql -X -v
ON_ERROR_STOP=1` against a migrated **isolated/local** database. The test uses
new synthetic IDs and rolls back all users, entitlement changes, and content.
It checks role grants, missing/Free/unverified rejection, successful verified
merge without entitlement mutation, idempotent recipe retry, and newer
revocation ordering. It must not be pointed at production.

The function helpers can also be type-checked with the installed TypeScript:

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --strict --skipLibCheck \
  --allowImportingTsExtensions --module nodenext --target es2022 --types node,jest \
  supabase/functions/premium-upgrade-sync/handler.ts \
  supabase/functions/premium-upgrade-sync/revenuecat.ts \
  supabase/functions/premium-upgrade-sync/handler.test.ts
```

When Deno is available, validate the deployment entry point with its import map:

```sh
deno check --config supabase/functions/premium-upgrade-sync/deno.json \
  supabase/functions/premium-upgrade-sync/index.ts
```
