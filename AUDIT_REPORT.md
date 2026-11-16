# Dropsauce repository audit

Date: 2026-11-16. Revision inspected: `b117926`. Scope: repository, accessible local Git history, installed dependencies, selected generated artifacts, and local checks. No application code, dependencies, lockfiles, database, accounts, purchases, or external service settings were changed. The working tree was clean at the start.

## 1. Overall assessment

The feature-based structure, shared theme tokens, SecureStore-backed native sessions, consent-gated analytics, SQL ownership policies, import reservations, and existing tests provide a useful foundation. However, the current source contains release-blocking authorization and data-integrity defects. In particular, an authenticated non-subscriber can grant themselves server-side Premium through the upgrade endpoint; an in-flight import can be attributed to a different account; recipe writes are not atomic or retry-safe; and sync acknowledgements and truncated snapshots can discard local data.

Most urgent work belongs at the authentication, entitlement, and persistence boundaries. A broad UI rewrite or blanket memoization would not address these problems. Automated checks currently do not provide a clean release gate: TypeScript passes, but one auth test fails, Jest retains open handles, and repository-wide lint fails. The default app lint scope passes; its coverage excludes backend functions and root integration tests. Passing checks would still not establish deployed RLS correctness or purchase reliability.

### Verified architecture

- Expo Router entry points in `app/`, feature modules in `src/features/`, React Query for remote/local query state, Zustand for shopping-list state, SQLite and document files for native persistence, and AsyncStorage for auxiliary state.
- Installed lockfile versions: Expo **57.0.33**, React Native **0.86.3**, React **19.2.3**, Supabase JS **2.110.1**, RevenueCat Purchases **10.15.0**, PostHog RN **4.54.4**, TypeScript **6.0.3**. Manifest ranges are not the installed versions; see `package.json:21-81` and `package-lock.json:4173,7903,13960,14280,14381`.
- Five Supabase Edge Functions and versioned PostgreSQL/Storage policies. All functions disable gateway JWT verification, but the four user endpoints explicitly call `auth.getUser()`; the webhook validates a configured Authorization header. Disabling gateway verification alone is not reported as an auth bypass.
- A separate **Laravel recipe-extraction API** is called by `src/features/recipes/api/recipeExtractionsRepo.ts:83-151`. This repository contains extraction/credit/queue/cache SQL, but not Laravel controllers, middleware, workers, provider integrations, or its dependency lockfile.
- Free/account-local/Premium-cloud strategies are selected in `src/features/storage/context/StorageStrategyContext.tsx:32-58`. Premium uses cloud-first mutations with local fallback, rather than an exclusively local-first outbox.
- EAS profiles and Android Maestro workflow exist. Web routes are present, but native persistence has no working web equivalent. There is no dedicated type-check or build-validation npm script.

Severity describes practical impact. **Confirmed** means supported by source, local checks, or a synthetic reproduction; it does not mean the deployed backend was tested. **Suspected** denotes an exposure whose necessary external conditions remain unknown. Effort estimates are engineering days including focused regression tests, excluding store review and deployment lead time.

## 2. Prioritized findings

| Priority | ID | Severity | Confidence | Finding |
|---|---|---|---|---|
| P0 | S1 | Critical | confirmed | Upgrade endpoint grants Premium without purchase verification |
| P0 | S2 | High | confirmed | Account switch during import download stores A's document under B |
| P0 | R1 | High | confirmed | Recipe writes partially commit; ambiguous retries create duplicates |
| P0 | R2 | High | confirmed | Sync acknowledgement clears newer edits and deletion markers |
| P0 | R3 | High | confirmed | Truncated cloud snapshots delete cache rows and local attachments |
| P1 | S3 | High | confirmed | Direct Storage uploads bypass aggregate quotas and fair-use guards |
| P1 | S4 | High | confirmed | Webhook ignores transfers; Premium validity relies on eventual events |
| P1 | S5 | High | confirmed dependency; suspected app exploitability | Vulnerable URI decoder is on Expo Router's link path |
| P1 | R4 | High | confirmed | Another account's dirty rows can permanently starve sync |
| P1 | R5 | High | confirmed | Upgrade recovery component is never mounted |
| P1 | R6 | Medium | confirmed | Ingredient sections and explicit meal times are lost across persistence paths |
| P1 | R7 | Medium | confirmed | Offering fetch failure discards valid subscription state |
| P1 | S6 | Medium | confirmed | Recipe photos are publicly retrievable by permanent URL |
| P1 | S7 | Medium | confirmed | Auth links accept unsolicited bearer sessions without route/origin validation |
| P1 | S8 | Medium | confirmed | Upload validation occurs after full buffering and trusts MIME labels |
| P1 | R8 | Medium | confirmed | Service-owned import objects cannot be removed by the client policy |
| P1 | R9 | Medium | confirmed | Account deletion leaves local account data and exported copies |
| P2 | R10 | Medium | confirmed | Web persistence silently accepts operations without storing anything |
| P2 | R11 | Medium | confirmed | Quantity parsing and formatting produce incorrect results |
| P2 | R12 | Medium | confirmed | Search and export silently omit parts of a growing library |
| P2 | P1 | Medium | confirmed work pattern; unmeasured latency | Background sync repeatedly pulls full data and rewrites unchanged lists |
| P2 | P2 | Medium | confirmed | Import cache eagerly downloads the entire library without a device budget |
| P2 | M1 | Medium | confirmed | Release checks fail and high-risk backend behavior is untested |
| P2 | M2 | Medium | confirmed | Duplicated boundary rules and unchecked response casts cause contract drift |
| P3 | M3 | Low | confirmed | Core buttons and form inputs lack explicit accessibility semantics |

## 3. Security and privacy

### S1 — Upgrade endpoint is an authenticated privilege-escalation path

**Severity: Critical. Confidence: confirmed.**

**Evidence:** `supabase/functions/premium-upgrade-sync/index.ts:40-54,63-119` authenticates a user and validates an idempotency key, then invokes `premium_upgrade_merge` using a service-role client. There is no RevenueCat API lookup, receipt validation, or pre-existing Premium requirement. The latest committed definition of that RPC, `supabase/migrations/20260224111500_premium_upgrade_merge_folder_conflict_fix_v2.sql:108-134`, unconditionally inserts/updates `user_entitlements.plan = 'premium'`. Later migrations restrict RPC execution to `service_role` (`supabase/migrations/20260514120000_explicit_data_api_grants.sql:60-61`) but the Edge Function supplies that role. `supabase/migrations/20260928120000_add_server_subscription_access.sql:69-94` derives `is_premium` from this plan.

**Trigger/impact:** A normal signed-in Free user calls the endpoint with a fresh idempotency key and empty entity arrays. The code grants authoritative Premium without a purchase. RLS then allows paid cloud access and storage; a lapsed subscriber can similarly reactivate access. The user ID is taken from the verified token, so this is escalation of the caller's account, not proof of arbitrary cross-user access. No live exploit was attempted.

**Smallest sensible fix:** Remove entitlement activation from the data-merge RPC. Require a server-verified current RevenueCat entitlement before any merge; reconcile a just-purchased account server-side when webhook delivery is delayed. Enforce the requirement inside the privileged operation as well. Bound payload sizes and entity counts before invoking it.

**Effort/risk:** 1–3 days; medium regression risk around delayed webhooks and first purchase. **Verify:** In an isolated backend, Free/lapsed accounts cannot upgrade with empty or populated snapshots; verified purchases succeed; retries do not change subscription validity or duplicate data.

### S2 — Import download crosses account boundaries after an account switch

**Severity: High. Confidence: confirmed, including synthetic reproduction.**

**Evidence:** `src/features/recipes/storage/recipeDocumentStorage.ts:464-508` uses the active owner for the initial lookup, awaits a download at line 494, and then reads the mutable global owner again at line 502 to insert metadata. `src/features/recipes/sync/recipeSync.ts:242-271` passes no immutable owner to this operation. Clearing React Query on account change does not cancel this work.

**Trigger/impact:** Begin caching A's private document, sign out and sign in as B while the download is delayed, then let it finish. The function writes A's downloaded bytes into B's local library. A local execution of the actual transpiled function with mocked filesystem/network/storage reproduced this exact attribution. No real accounts, files, or network requests were used. Similar use of mutable owner state after awaits deserves review in local recipe/import creation and shopping sync.

**Smallest sensible fix:** Pass an immutable owner and an account-generation token through the operation; use the captured owner for every lookup and insert, and reject/clean up completion if the active account changed. Cancel outstanding account work on sign-out where supported. Never retag completed work to the current global owner.

**Effort/risk:** 1–2 days; medium risk. **Verify:** Pause downloads and storage writes at each await, switch A→guest→B, and confirm no A content appears in B or guest state and temporary files are cleaned up safely.

### S3 — Direct Storage uploads bypass the advertised aggregate limits

**Severity: High. Confidence: confirmed in committed policy design.**

**Evidence:** `supabase/migrations/20260928140000_enforce_premium_cloud_permissions.sql:256-259,276-279` permits direct inserts into both buckets for any Premium user under their ID prefix. The import policy no longer requires reservation metadata. The 5 GiB aggregate reservation check exists only in `supabase/migrations/20260417140000_recipe_document_imports_production_hardening.sql:132-151`; fair-use controls run only in `supabase/functions/validate-and-upload-import/index.ts:152-188`. Bucket limits enforce individual object size (`supabase/migrations/20260911120000_limit_recipe_imports_to_six_mb.sql:5-7`; `supabase/migrations/20260512123000_simplify_recipe_image_upload_policy.sql:7-10`), not aggregate size. Image objects are also outside the document-metadata aggregate sum.

**Trigger/impact:** A Premium caller uses Storage directly instead of the upload function and uploads files without corresponding document rows. Those files bypass application quotas, deduplication, and fair-use tracking and can generate unaccounted storage costs. S1 expands the potential callers. This was not exercised against a service.

**Smallest sensible fix:** Require a matching server-created reservation for import inserts, or make import creation backend-only. Add authoritative byte accounting/reservations for images if they are included in the storage allowance. Keep the per-object bucket limits.

**Effort/risk:** 1–3 days; medium risk to upload compatibility. **Verify:** Synthetic direct uploads without a reservation fail; concurrent uploads at the aggregate boundary cannot exceed the allowance; failed reservations release capacity.

### S4 — Server entitlement lifecycle is incomplete

**Severity: High. Confidence: confirmed for ignored events and missing validity check; deployed environment isolation is suspected/unverified.**

**Evidence:** `supabase/functions/revenuecat-webhook/index.ts:5-23,87-105` handles selected purchase events and `EXPIRATION`, but acknowledges `TRANSFER` without updating either account. It stores no expiration time and does not inspect `environment` or app identity. `supabase/migrations/20260831130000_sync_revenuecat_entitlements.sql:32-59` usefully orders events by timestamp, but `supabase/migrations/20260928120000_add_server_subscription_access.sql:135-149` authorizes access solely from a persistent boolean. There is no committed expiry reconciliation job.

**Trigger/impact:** Restoring on another account can transfer an entitlement in RevenueCat while leaving the old Supabase account Premium and the new account inconsistent. A missed expiration event leaves access enabled indefinitely. If production webhooks are not filtered externally, sandbox transactions can also affect production entitlements; that condition was not inspected. RevenueCat documents transfer behavior in [Common Webhook Flows](https://www.revenuecat.com/docs/integrations/webhooks/event-flows) and environment filtering in [Webhooks](https://www.revenuecat.com/docs/integrations/webhooks).

**Smallest sensible fix:** Reconcile authoritative customer entitlement state for all affected IDs on transfer and lifecycle events; persist validity/grace-period information and periodically reconcile missed events. Explicitly enforce the intended app/environment boundary or document and test provider-side filters. Preserve event ordering and add durable event IDs for diagnostics/idempotency.

**Effort/risk:** 2–4 days; medium to high risk around grace periods, multiple products, and restore behavior. **Verify:** Replay transfer, renewal, duplicate, out-of-order, expiration, delayed delivery, and sandbox events with synthetic identities. Confirm correct access on both sides of a transfer.

### S5 — A dependency advisory reaches link parsing at runtime

**Severity: High. Confidence: confirmed affected dependency and call path; suspected exploitability within this app's URL limits.**

**Evidence:** `package-lock.json:6723` pins `decode-uri-component` **0.2.2**, through `query-string` **7.1.3** (`package-lock.json:14166`) and `expo-router` **57.0.31**. Installed Router code imports it through query-string in `node_modules/expo-router/build/react-navigation/core/getStateFromPath.js:41`. `app.config.ts:26` registers the app URL scheme. The registry reports malformed-input denial-of-service advisories [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) and [GHSA-qr28-fpjm-wq7f](https://github.com/advisories/GHSA-qr28-fpjm-wq7f). The latter lists 0.5.1 as patched; 0.5.0 fixes only the earlier advisory.

**Trigger/impact:** A malformed external URL that reaches this decoder can consume excessive JS CPU. This is an availability risk, not evidence of credential theft or code execution. Device URL length limits and the exact bundled path constrain practical exploitability; no malicious load test was run.

**Smallest sensible fix:** Choose an Expo-compatible dependency update or a narrowly reviewed transitive override that resolves both advisories, then test Router parsing compatibility. Bound externally accepted links where feasible. Do not apply `npm audit fix --force` blindly: the registry's proposed fixes include unrelated major upgrades/downgrades.

**Effort/risk:** 0.5–2 days; medium risk to navigation parsing. **Verify:** Confirm the bundled decoder version, ordinary encoded links, invalid encoding, and bounded pathological inputs on both native engines. Keep build-tool advisories separate from runtime exposure; see validation below.

### S6 — Recipe photos have permanent unauthenticated URLs

**Severity: Medium. Confidence: confirmed intentional configuration; privacy acceptability requires a product decision.**

**Evidence:** `supabase/migrations/20260514140000_remove_public_recipe_images_listing_policy.sql:1-9` explicitly leaves the image bucket public while removing listing. `src/features/recipes/api/recipesRepo.ts:228-232,268-271` stores public object URLs using an account UUID and timestamp-based name. `deleteRecipeById` at lines 626-629 removes only the recipe row; replacing an image also has no corresponding remote image cleanup.

**Trigger/impact:** Anyone obtaining a known photo URL can retrieve it without the recipe owner's session, even after sign-out or a recipe deletion that leaves the object. Private recipe-table RLS does not protect public object downloads. No enumeration or live photo retrieval was attempted.

**Smallest sensible fix:** If recipe photos are private user content, use a private bucket with owner-authorized signed downloads and randomized object keys; clean up replaced/deleted images through a retryable backend operation. If public photos are a deliberate product contract, document that contract and still implement lifecycle cleanup.

**Effort/risk:** 1–3 days; medium risk to existing image URLs and offline viewing. **Verify:** A known URL fails unauthenticated after the privacy change; authorized viewing and local caching work; deleted/replaced objects are eventually removed.

### S7 — Incoming auth links can replace the session without an expected flow

**Severity: Medium. Confidence: confirmed acceptance path; end-to-end social-engineering exploit not tested.**

**Evidence:** `src/features/auth/utils/passwordRecovery.ts:57-85` parses auth parameters without validating the URL scheme/host or an allowed path. `src/features/auth/context/AuthContext.tsx:216-224,279-305,308-319` accepts both codes and raw access/refresh-token pairs from incoming URLs and calls `setSession`. No pending recovery/confirmation transaction or account expectation is checked for the bearer-token branch. Supabase verifies token validity, but that does not establish that the user intended to enter that account.

**Trigger/impact:** A crafted app link containing another valid account's session can switch the device into that account, creating login-CSRF/session-substitution risk and confusing subsequent saves. The custom scheme also warrants recovery-link interception testing. This is not a way to forge a Supabase token.

**Smallest sensible fix:** Allowlist callback routes and origins, prefer a PKCE code flow tied to a locally initiated transaction, and retire unsolicited bearer-token callbacks where possible. Require explicit account-switch intent when a callback would replace an unrelated active identity. Mark links handled after processing so transient failures remain retryable; bound the retained URL set and avoid retaining token-bearing URLs unnecessarily.

**Effort/risk:** 1–2 days; medium risk to email templates and existing callback links. **Verify:** Legitimate OTP/recovery/confirmation flows still work; wrong path/origin/type, unsolicited token pairs, replay, failed-first-attempt retry, and callbacks while signed into a different account are handled safely.

### S8 — Import validation is too late and does not validate actual formats

**Severity: Medium. Confidence: confirmed.**

**Evidence:** `supabase/functions/validate-and-upload-import/index.ts:108-143` parses the complete multipart body, reads the complete file, and hashes it before checking the 6 MiB limit. It trusts `file.type`; PDF checks search text for `/Encrypt`, `/Type /Page`, and `/Count` (`:8-15,48-51`) rather than parsing the document. Rate/usage guards run after this work (`:152`). The upgrade endpoint also accepts unbounded entity arrays/body data (`supabase/functions/premium-upgrade-sync/index.ts:56-68,104-119`).

**Trigger/impact:** Authenticated oversized/mislabeled uploads consume memory and CPU before rejection; a non-PDF labeled PDF is accepted if it passes the superficial checks. Valid compressed PDFs or encryption dictionaries outside the scanned prefix may be misclassified. The impact on downstream extraction depends on the absent Laravel worker. No parser exploit was attempted.

**Smallest sensible fix:** Enforce a bounded body before buffering/hashing, including requests without a trustworthy Content-Length; run cheap auth/rate checks first. Verify magic bytes and use a maintained bounded parser or sandboxed worker for actual PDF/image validation. Treat regex-derived page counts as hints, never a billing or safety boundary. Bound upgrade entity counts and field lengths.

**Effort/risk:** 1–3 days; medium risk to unusual valid PDFs. **Verify:** Oversized multipart requests, spoofed MIME types, compressed/encrypted PDFs, malformed images, and extreme dimensions fail predictably within resource limits; ordinary accepted files still import.

### Credential, analytics, and privacy observations

- A redacting pattern scan of tracked files, the two ignored local environment files, **2,545 distinct historical text blobs across 280 accessible commits**, and **21 selected generated text files** found no matching private key, Supabase secret/service-role JWT, provider secret, or password-bearing database URL. The native `android` and `dist` trees were sampled as described under limitations. A local legacy Supabase JWT decoded to role `anon`; that and publishable keys, RevenueCat public SDK keys, PostHog ingestion keys, URLs, app identifiers, and EAS project IDs are public client configuration, not service credentials. No values are reproduced here. Backend service credentials appear as `Deno.env.get(...)` references, not literal client values.
- This pattern scan is not a proof that arbitrary secrets never entered Git. It excludes binary files and large historical blobs, and cannot identify every custom credential format or deleted/unreachable remote object. No all-history rotation recommendation is justified by a confirmed leak in this inspection.
- `app/_layout.tsx:139-170` enables PostHog only after persisted opt-in and disables autocapture, lifecycle capture, GeoIP, and replay. Product events in `src/features/analytics/events.ts:18-60` do not include recipe text or email. `src/lib/productionLogger.ts:79-97` permits `error_message` verbatim, but no current callers passing that field were found; remove or constrain it before introducing raw backend errors. RevenueCat receives email/display name independently of analytics consent (`src/features/subscription/context/SubscriptionContext.tsx:180-189`); verify necessity and disclosure externally. Webhook/deletion server logs include account identifiers and error text; retention/access were not inspected.
- Native auth tokens use SecureStore; auxiliary identity caching serializes the full Supabase `User` in AsyncStorage (`src/features/auth/context/AuthContext.tsx:75-91`) when only a minimal offline identity is needed. SQLite, files, and AsyncStorage are not app-level encrypted. The existing generated Android manifest has `allowBackup=true` and references SecureStore backup rules, but merged release backup rules, device-transfer behavior, iOS protection, and actual backup contents were not inspected. Establish an explicit policy for recipe/identity/file backups rather than assuming SecureStore protects every cache.

## 4. Reliability and data integrity

### R1 — Recipe writes are not atomic, and retries are not idempotent

**Severity: High. Confidence: confirmed.**

**Evidence:** `src/features/recipes/api/recipesRepo.ts:281-358` inserts a recipe, then folder joins, then ingredients in separate requests. `:490-587` updates the parent, deletes folder/ingredient rows, and reinserts them separately. Creates omit the local `client_id`. `src/features/recipes/hooks/useStrategyRecipes.ts:87-102` saves a separate local recipe on connectivity error; `src/features/recipes/sync/recipeSync.ts:326-341` later creates another cloud row when no cloud ID was acknowledged.

**Trigger/impact:** Lose connectivity after the server commits the parent but before the response or child insert. The user sees failure or a local fallback while an incomplete cloud recipe already exists. Retrying creates another recipe. For updates, failure after ingredient deletion leaves saved ingredients missing. The initial-upgrade merge RPC is transactional, but ordinary CRUD and normal sync do not use it.

**Smallest sensible fix:** Put parent/children writes in a single owner-authorized transaction/RPC. Give each logical create a durable client-generated operation ID and enforce uniqueness per user; reuse it after timeout or process restart. Apply cloud IDs and local outbox state only after a complete acknowledgement. Use conditional versions for conflicting updates.

**Effort/risk:** 2–4 days; medium to high risk across creation/editing and folder handling. **Verify:** Inject failure after every request/commit boundary and drop responses after server success; retry and restart. Exactly one complete recipe must remain, and failed updates must preserve the previous complete version.

### R2 — Acknowledging an old snapshot clears newer edits or resurrects a deletion

**Severity: High. Confidence: confirmed.**

**Evidence:** `src/features/recipes/sync/recipeSync.ts:297-341` snapshots dirty rows and awaits network writes. `src/features/recipes/storage/localRecipesStorage.ts:630-642` then unconditionally clears `dirty` and `deleted_at`, changes `updated_at`, and assigns the owner by local ID alone. The sync row type (`:79-100`) does not carry the version even though edits increment it (`:476-542`). `mergeCloudRecipesIntoLocal` overwrites any now-clean row (`:694-745`). Notes have the same acknowledgement pattern (`src/features/notes/storage/localNotesStorage.ts:257-269`). Upgrade reconciliation also invokes these acknowledgements (`src/features/subscription/services/upgradeToPremium.ts:338-385`).

**Trigger/impact:** While version 1 uploads, save version 2 locally or delete the recipe. Version 1's acknowledgement clears version 2's dirty/deleted state. The next pull overwrites the newer edit or brings the deleted recipe back. Whole-list shopping sync likewise compares timestamps and writes snapshots without checking whether local edits occurred in flight (`src/features/shopping-list/sync/shoppingListSync.ts:28-48`). Ordinary cloud updates also lack an expected-version check for edits from two devices.

**Smallest sensible fix:** Capture version/owner with the snapshot and acknowledge only with `WHERE id = ? AND owner_user_id = ? AND version = ?`; retain newer dirty state/tombstones. Do not change the user-edit timestamp merely to acknowledge sync. Add compare-and-set semantics at the server boundary and a visible conflict policy. Give shopping lists an explicit revision/dirty state rather than using wall-clock comparisons alone.

**Effort/risk:** 2–4 days; high regression risk, requiring concurrency tests. **Verify:** Deferred promises around create/update/delete, edits during pull, account switch, two-device concurrent edits, and clock skew must preserve the latest intended state or expose a recoverable conflict.

### R3 — An incomplete pull is treated as an authoritative deletion list

**Severity: High. Confidence: confirmed.**

**Evidence:** `src/features/recipes/sync/recipeSync.ts:372,415-422` pulls at most 1,000 recipes without pagination. `src/features/recipes/storage/localRecipesStorage.ts:812-819` deletes every clean cached recipe absent from any nonempty response and deletes its local PDF attachments. Notes use a 1,000-row pull and the same missing-row deletion (`src/features/notes/sync/noteSync.ts:139-147`; `src/features/notes/storage/localNotesStorage.ts:369-377`). When the response is completely empty, reconciliation instead never removes deleted rows. No tombstone/change cursor distinguishes truncation, entitlement filtering, or actual deletion.

**Trigger/impact:** An account grows beyond 1,000 recipes (or a lower deployed Data API row cap). Older cloud recipes disappear from the offline cache and their local-only PDF attachments are permanently removed. Conversely, deleting the last recipe remotely leaves stale offline content. Cloud recipes themselves are not deleted by this path, but the cache and attachments are.

**Smallest sensible fix:** Disable destructive missing-row reconciliation until a complete, authorized snapshot is established. Page with a stable cursor/snapshot or consume explicit server tombstones. Separate content-deletion acknowledgement from entitlement visibility. Do not delete local-only assets based on a list page.

**Effort/risk:** 1–3 days; medium risk. **Verify:** 1,001+ recipes/notes, a lower server row cap, restricted/empty responses, deleted-last-item, and interrupted pagination preserve data; explicit confirmed deletions reconcile correctly.

### R4 — Cross-account rows can permanently block the dirty queue

**Severity: High. Confidence: confirmed.**

**Evidence:** `src/features/recipes/storage/localRecipesStorage.ts:603-612` selects the oldest 100 dirty rows across all owners. The sync loop filters the owner only afterward (`src/features/recipes/sync/recipeSync.ts:308-310`). Notes repeat the same query/loop design (`src/features/notes/storage/localNotesStorage.ts:245-254`; `src/features/notes/sync/noteSync.ts:77-79`).

**Trigger/impact:** Account A or guest has 100 old dirty rows retained on the device. Sign into Premium account B and create/edit content offline. Every sync pass fetches and skips the same A rows, so B's changes never upload. Persistent errors in the first batch of the same account can similarly starve later work. No user-facing queued-error summary explains this condition.

**Smallest sensible fix:** Filter by immutable owner in SQL before ordering/limiting, drain eligible batches, and track per-row retry state/backoff so poisoned rows do not block unrelated changes. Return a sync result distinguishing complete, partial, and failed work.

**Effort/risk:** 0.5–1.5 days; low to medium risk. **Verify:** Seed 100 older dirty rows for A plus rows for B; B syncs and A remains untouched. A permanently failing row does not block subsequent eligible rows.

### R5 — Purchase recovery logic exists but is unreachable

**Severity: High. Confidence: confirmed.**

**Evidence:** `src/features/subscription/components/PremiumUpgradeMigrationBootstrap.tsx:18-76` implements foreground/startup recovery, but it has no importer or mounted usage anywhere in `app/` or `src/`. `app/_layout.tsx:58-76` mounts only regular recipe sync. The purchase route calls `upgradeToPremium` in its local handler (`app/(auth)/premium.tsx:96-123`) and explicitly claims a bootstrap will resume failed work (`:138-153`). Restore in `src/features/subscription/context/SubscriptionContext.tsx:433-443` refreshes CustomerInfo without running that migration. Regular sync does not write the migration marker, and its helpers swallow failures (`src/features/recipes/sync/recipeSync.ts:430-453`). Pre-try failures in `src/features/subscription/services/upgradeToPremium.ts:427-432` also bypass its failed-status handler.

**Trigger/impact:** Kill the app after the store purchase but before local snapshot reconciliation, or restore an entitlement outside the purchase screen. The intended durable migration does not resume. Normal polling may upload some dirty data later, but it cannot provide the promised atomic upgrade recovery, and can encounter R1/R4. Migration completion/status may remain inconsistent.

**Smallest sensible fix:** After fixing S1 and R2, mount the recovery component under the correct providers or consolidate recovery into one explicit subscription-transition service. Move all fallible initialization inside the status/error guard and return meaningful results from sync. Guard recovery by owner/generation and a durable operation ID.

**Effort/risk:** 1–2 days; medium risk to upgrade sequencing. **Verify:** Kill/relaunch after purchase at each boundary, restore on an existing Free kitchen, delay the webhook, fail local schema readiness, and retry on foreground. Recovery completes exactly once without duplicate data or a permanently running status.

### R6 — New recipe fields do not round-trip through all storage paths

**Severity: Medium. Confidence: confirmed.**

**Evidence:** `src/features/recipes/storage/localRecipesStorage.ts:645-654` serializes cloud ingredients without `kind`; the local reader defaults missing `kind` to `ingredient` (`:196-197`). The upgrade RPC inserts ingredient rows without `kind` (`supabase/migrations/20260224111500_premium_upgrade_merge_folder_conflict_fix_v2.sql:449-479`), although `20261015120000_add_recipe_ingredient_sections.sql` introduces the field. The client upgrade snapshot sends `mealTimesJson` (`src/features/subscription/services/upgradeToPremium.ts:257`), but that RPC never reads it or persists `meal_times`. Normal CRUD supports these fields.

**Trigger/impact:** A sectioned recipe pulled into SQLite becomes ordinary ingredients offline. Upgrading a local sectioned recipe loses its section semantics in cloud. Explicit meal-time assignments can be replaced with inferred/default values after upgrade and pull. A later local edit can write the degraded data back.

**Smallest sensible fix:** Add `kind` to cloud-to-local serialization and the upgrade SQL, and persist explicit meal times in the upgrade RPC. Centralize the persistence schema/mapper where it prevents this concrete drift. Add a forward migration rather than rewriting already-applied SQL history.

**Effort/risk:** 0.5–1.5 days; low to medium risk. **Verify:** A recipe with ingredient sections, quantities, notes, explicit meal times, folders, and image survives local→upgrade→cloud→offline→edit→cloud unchanged in meaning.

### R7 — An unrelated offering failure downgrades the client

**Severity: Medium. Confidence: confirmed.**

**Evidence:** `src/features/subscription/context/SubscriptionContext.tsx:360-374` combines CustomerInfo and offerings in `Promise.all`; either failure clears CustomerInfo and the active identity reference. Plan is derived only from CustomerInfo (`:482-484`), then saved as Free (`:491-494`). The effect depends on the complete `user` object (`:384`), which can change on token/profile updates. Foreground refresh preserves state on failure, but this initialization/identity path does not.

**Trigger/impact:** CustomerInfo is valid or cached but the offering request fails. A paying member is treated as Free: cloud sync stops, the local 100-recipe subset/limits can activate, and Premium UI becomes inconsistent until recovery. This does not revoke the store purchase or server entitlement.

**Smallest sensible fix:** Fetch entitlements and offerings independently; retain verified/cached CustomerInfo for the same account on a transient offering failure. Clear account-specific state immediately when the actual identity changes, and avoid rerunning identity work for unrelated user-object changes. Define offline validity behavior explicitly.

**Effort/risk:** 1–2 days; medium risk around account switching. **Verify:** Cached Premium plus failed offerings, offline cold start, profile update/token refresh, expiration, and A→B switch do not accidentally transfer or discard entitlements.

### R8 — Service-owned imports do not satisfy the client's deletion policy

**Severity: Medium. Confidence: confirmed policy mismatch; exact deployed Storage response untested.**

**Evidence:** Uploads use a service-role client (`supabase/functions/validate-and-upload-import/index.ts:149-151,251-256`). Client deletion uses Storage directly before soft-deleting metadata (`src/features/recipes/api/recipeDocumentsCloudRepo.ts:263-278`). Its Storage policy requires `owner_id = auth.uid()` (`supabase/migrations/20260928140000_enforce_premium_cloud_permissions.sql:260-271`). Service-key-created objects do not receive that user's owner ID, as documented by [Supabase Storage ownership](https://supabase.com/docs/guides/storage/security/ownership). The later delete RPC only marks the row deleted (`supabase/migrations/20260928140000_enforce_premium_cloud_permissions.sql:231-247`), and the nightly reconciliation is non-destructive (`20260417143000_recipe_document_imports_nightly_reconciliation.sql`).

**Trigger/impact:** Delete an ordinary Edge-Function-uploaded document. Storage may return no matching objects or an access error, leaving bytes behind or preventing deletion. If metadata is soft-deleted, accounting can free the quota while the retained object still consumes storage. There is also no normal sync removal pass for documents cached on another device (`src/features/recipes/sync/recipeSync.ts:242-284`).

**Smallest sensible fix:** Perform authorized document deletion through a backend operation using immutable metadata paths and retryable cleanup state. Confirm removal rather than assuming an empty successful response means bytes were deleted. Propagate tombstones to local document caches. Keep direct user-created and service-created objects on one consistent authorization model.

**Effort/risk:** 1–2 days; medium risk to deletion/retry sequencing. **Verify:** Upload through the function, delete from a client, inspect synthetic object/metadata state, retry partial failures, and sync a second device. No retained file should remain accessible as a current document.

### R9 — Account deletion leaves local personal data behind

**Severity: Medium. Confidence: confirmed.**

**Evidence:** `src/features/auth/context/AuthContext.tsx:620-667` deletes the server account, clears cached identity, and signs out but does not purge account-owned SQLite rows, recipe files, shopping keys, drafts, or export files. `src/features/profile/services/exportUserData.ts:81-95` creates a new cache JSON file for every export without cleanup. Ordinary sign-out retention can be useful for offline data; account deletion needs an explicit distinct policy. Backend storage deletion is also shallow: `supabase/functions/delete-account/index.ts:19-39` skips directory entries and stops if a page has no file IDs, while direct upload policies allow nested paths.

**Trigger/impact:** Delete an account on a device containing recipes/imports/exported JSON. Those bytes remain in the sandbox/backups even though the account is gone, consuming space and frustrating the expected erasure behavior. Nested remote files can also block complete server deletion; storage is removed before auth deletion, so a later failure can leave an active account missing its files. No real deletion was run.

**Smallest sensible fix:** Define account-erasure scope and purge only the captured account's local rows/files/keys after confirmed server deletion; retain guest/other-account work. Make server deletion a retryable staged operation, recursively list storage paths, and cover provider-side data/queue retention where required. Clean old export files after sharing or on a short retention schedule.

**Effort/risk:** 1–3 days; medium to high risk because erasure is destructive. **Verify:** Synthetic A/B/guest device data, nested objects, failed storage/auth steps, restart/retry, and exported files: A is erased, B and guest are preserved, and UI reports partial failure honestly.

### R10 — Web local persistence is a silent no-op

**Severity: Medium. Confidence: confirmed; becomes a web-release blocker if editing is advertised.**

**Evidence:** `src/lib/sqlite.web.ts:21-49` resolves writes successfully with zero changes and always returns empty/null reads. `src/lib/fileSystem.web.ts:51-92` also implements copy/create/delete as no-ops. `app.config.ts:55-58` declares static web output and `package.json:10` exposes a web command; Free and guest web routes use these local repositories.

**Trigger/impact:** Create content in a web Free/guest flow. Some writes appear successful, while subsequent reads show no content; others fail later with a misleading not-found error. Blob URLs are not durable storage. There is no reliable offline web library.

**Smallest sensible fix:** Until web persistence is implemented, make unsupported write operations fail explicitly and disable those UI flows with a clear capability message. If web editing is required, implement IndexedDB/working web SQLite and durable blob storage behind the same repository contract.

**Effort/risk:** 0.5 day for an honest capability gate; 3–7 days for durable web storage. Low/medium risk respectively. **Verify:** Browser refresh/restart and offline reads preserve saved content on supported paths; unsupported paths cannot report successful persistence.

### R11 — Quantity parser misreads fractions and formatter can erase small quantities

**Severity: Medium. Confidence: confirmed by executing the actual pure utility.**

**Evidence:** `src/features/recipes/utils/ingredientMeasurements.ts:54-64` has an ambiguous fraction regex: it can split a multi-digit numerator into a whole number plus numerator. Unicode replacement does not handle spaced mixed fractions or all fractions produced by the formatter (`:33,57`). `:72-81` rounds quantities near zero to the zero fraction; `:109` excludes zero/negative values before temperature conversion.

**Local results:** `parseQuantity('10/2') → 1` rather than 5; `'12/4' → 1.5` rather than 3; `'1 ½'`, `'⅖'`, and `'⅗' → null`; `formatCulinaryQuantity(0.04) → '0'`. Existing tests cover `1/2`, `1/3`, and `1 1/2`, so they miss these cases. Temperature conversion tests do not cover 0 °C or negative temperatures.

**Trigger/impact:** Imported/entered fractions yield materially incorrect converted ingredient amounts. Small positive values can display as zero. Zero/negative temperatures remain unconverted rather than following the documented temperature branch.

**Smallest sensible fix:** Separate simple-fraction and whitespace-delimited mixed-fraction parsing; normalize all supported Unicode fractions consistently. Preserve a useful precision for small positive values. Apply sign/range rules by dimension so valid temperatures are allowed. Preserve unsupported ranges/qualifiers as original text.

**Effort/risk:** 0.5–1 day; low risk with focused table-driven tests. **Verify:** Multi-digit fractions, mixed Unicode forms, denominator zero, decimals/comma input, tiny amounts, 0/negative temperatures, unknown units, and round trips through displayed fractions.

### R12 — Search and export silently omit valid content

**Severity: Medium. Confidence: confirmed.**

**Evidence:** `src/features/search/screens/SearchScreen.tsx:49-57,94-115` fetches only 200 recipes with no search term and filters that subset locally. `src/features/recipes/screens/ManageRecipesScreen.tsx:46` also caps its recipe set at 200. `src/features/profile/services/exportUserData.ts:12-13,42-67` exports only local repositories with a 5,000-row cap, no cloud/archive reconciliation, and device-local document URIs rather than document bytes. The UI reports export success (`src/features/profile/screens/ExportDataScreen.tsx:29-37`) without declaring missing records/assets.

**Trigger/impact:** A Premium library has more than 200 recipes, or some cloud recipes are not in the local cache. Search reports no match for an existing older recipe; export succeeds with an incomplete account collection. A JSON export containing a sandbox URI is not a portable backup of an imported PDF/image. R3 can further remove exportable cached data.

**Smallest sensible fix:** Search the authoritative full collection using indexed search plus pagination, or maintain a complete local search index if offline full-content search is required. Make export explicitly local-only with completeness counts, or page all authorized account data and package actual requested assets. Surface truncation/offline omissions; never describe local paths as a complete portable backup.

**Effort/risk:** 1–3 days for search and explicit export completeness; additional work for binary archives. Medium risk. **Verify:** Find recipe 201+, export a synthetic mixed local/cloud/archived library, exceed export limits, and inspect the output on a different device with no original sandbox files.

## 5. Performance and resource use

### P1 — Sync repeatedly transfers full collections and writes unchanged state

**Severity: Medium. Confidence: confirmed algorithm/call pattern; device latency, battery cost, and traffic not measured.**

**Evidence:** `src/features/recipes/sync/RecipeSyncBootstrap.tsx:11-41` schedules four sync domains every 30 seconds, on initialization, and on foreground, without checking foreground state inside the interval. `src/features/recipes/sync/recipeSync.ts:372,415` fetches full nested recipe data twice even if no image repair occurs. The local merge rewrites clean rows individually (`src/features/recipes/storage/localRecipesStorage.ts:694-745`) through a serialized DB queue (`src/lib/sqlite.native.ts:18-24`). Document sync pages all metadata on each pass (`src/features/recipes/sync/recipeSync.ts:242-284`). `src/features/shopping-list/sync/shoppingListSync.ts:35-41` pushes even equal timestamps, so an unchanged list can be re-uploaded on every pass.

**Trigger/impact:** An idle connected Premium account incurs work proportional to its full recipe/document collection each polling cycle. Nominally, a continuously active idle session can make 120 polling passes per hour, including 240 recipe-list requests, before other domains or UI queries. That is a calculation from the interval, not measured production traffic. Shopping timestamp churn can also distort multi-device conflict decisions.

**Smallest sensible fix:** Skip unchanged shopping pushes using a dirty/revision marker; reuse the first recipe response when no repair changed anything; gate polling by active state/connectivity and back off failures. Then add incremental changes/tombstones and batched local writes where collection sizes justify them. Retain occasional complete reconciliation as a separate deliberate operation.

**Effort/risk:** 1–3 days for redundant work; 3–5 days for robust incremental sync. Medium risk. **Verify:** Count requests/bytes/local writes for an idle synthetic 1,000-recipe library and after one edit; measure foreground responsiveness and battery/network behavior on devices. No blanket memoization recommendation is warranted.

### P2 — Import caching has no device storage budget

**Severity: Medium. Confidence: confirmed policy and download loop; actual out-of-space failures unmeasured.**

**Evidence:** `src/features/recipes/sync/recipeSync.ts:242-284` walks every cloud document page and downloads every uncached document. `src/features/recipes/storage/recipeDocumentStorage.ts:491-519` stores downloads in the document directory with no free-disk preflight, eviction budget, or user pinning policy. Premium cloud storage allows 5 GiB, which is not a safe implicit allowance on every phone. Existing cache entries are not checked for file existence in the sync loop, and no remote-deletion cleanup pass exists.

**Trigger/impact:** Signing in on a low-storage phone starts a potentially multi-gigabyte download, may consume available space, and can repeatedly retry files that will not fit. Necessary offline access, bandwidth, and storage retention are coupled to automatic full mirroring.

**Smallest sensible fix:** Introduce a separate per-device cache budget and low-space handling; prioritize recent/explicitly pinned documents and offer an intentional full-offline download with progress. Preserve dirty local files until upload confirmation. Use bounded downloads, cancellation, retry backoff, and tombstone-driven cleanup.

**Effort/risk:** 2–4 days; medium risk to offline availability. **Verify:** A large synthetic library, interrupted transfers, missing cached files, low disk, account switch, and eviction preserve pending local uploads and clearly indicate which documents are available offline.

### Other performance observations

The tracked `assets/` tree is approximately **2.0 MiB** on disk, including roughly 532 KiB of fonts and 1.1 MiB of illustrations. This does not support calling assets a major startup bottleneck. Image optimization constants and resizing code exist (`src/features/subscription/constants/limits.ts`; `src/features/recipes/utils/optimizeImageAsset.ts`). Important management/document lists use `FlatList`. Search renders result rows with `.map()` (`src/features/search/screens/SearchScreen.tsx:198`); this is currently bounded by its correctness-breaking 200-item fetch. Virtualize it when removing that cap, based on measured rendering cost. Startup fonts, actual bundle size, image decoder memory, React render timings, and native binary size were not profiled, so no numerical optimization claim is made.

## 6. Maintainability and DRY

### M1 — Validation cannot serve as a clean release gate

**Severity: Medium. Confidence: confirmed by local checks.**

**Evidence:** `tests/integration/auth/AuthProvider.test.tsx:55-64` returns `{ error: null }` from the login mock, while production correctly expects `data.session` (`src/features/auth/context/AuthContext.tsx:355-365`); the login test fails. `eslint.config.js:5-10` ignores only `dist/*`, causing Node import resolution errors for all Deno Edge Functions and missing dependencies in bundled skill scripts when scanning the entire repository. The installed Expo lint command defaults to existing `src`, `app`, and `components` directories; its normal scope excludes the functions and root integration tests rather than validating them. `tsconfig.json:17-19` excludes those functions from TypeScript, and there is no dedicated Deno check command. `.eas/workflows/e2e-android.yml` builds/runs Maestro, but does not run lint, TypeScript, Jest, or isolated policy tests.

**Trigger/impact:** CI either fails for configuration/mock errors or misses the backend boundaries that enforce security. Existing sync tests mock repositories and merge/ack functions (`tests/integration/recipes/recipeSync.test.ts:24-54`), so they do not exercise SQL acknowledgement races, RLS, transactions, or Storage ownership. No committed tests cover real purchase/webhook transitions or credit enforcement in Laravel. This is a test coverage gap, not evidence that all untested functions are broken.

**Smallest sensible fix:** Correct the auth mock and assert the resulting identity; identify/clean up Jest handles. Separate app/tooling lint from a dedicated Deno type/lint check. Add local isolated database policy/transaction tests and stubbed RevenueCat event/restore tests for the findings above. Run the lightweight checks before a paid EAS build.

**Effort/risk:** 1–2 days to repair checks, 2–4 days for high-risk coverage alongside fixes; low implementation risk. **Verify:** All checks finish naturally with clean exit codes; regression tests fail against the audited defects and pass after fixes. Do not rely on tests that only assert mocked function calls.

### M2 — Business contracts drift across duplicated boundaries

**Severity: Medium. Confidence: confirmed.**

**Evidence:** Error-message connectivity detection is copied across `src/features/recipes/hooks/useStrategyRecipes.ts:20-44`, `src/features/recipes/hooks/useRecipeDocuments.ts:62-83`, `src/features/recipes/api/importsRepo.ts:38-56`, and recipe/note/folder sync, despite `src/lib/productionLogger.ts:30-74` already centralizing similar classification. Subscription state exists as CustomerInfo-derived plan, AsyncStorage plan flags, SQL plan/is_premium, and migration status (`src/features/subscription/context/SubscriptionContext.tsx:482-494`; `src/features/recipes/sync/recipeSync.ts:37-40`; `src/features/storage/context/StorageStrategyContext.tsx:33-55`). R6 demonstrates actual recipe schema drift between CRUD, cache, and upgrade SQL. `src/features/recipes/api/recipeExtractionsRepo.ts:28-42` checks only that a response is an object before casting and spreading its status/recipe/id; `src/features/recipes/api/importsRepo.ts:187` similarly casts successful payloads without validating required fields.

**Trigger/impact:** New fields or backend error formats are handled differently across flows; malformed successful responses escape their boundary and fail later in screens/storage. A cached flag can disagree with entitlement presentation and server access. Copied async workflows also make fixes to R2/R4 easy to apply in only one domain.

**Smallest sensible fix:** Consolidate error classification, minimal owner/revision/ack helpers, and recipe persistence mappers after behavior tests exist. Define explicit boundaries between cached presentation state and server authorization. Validate external responses once with a small runtime schema/type guard, including enum/ID/required nested fields. Keep SQL limits as authoritative server constraints and add contract tests against exported client constants rather than pretending TypeScript constants enforce server rules. Avoid a generic all-purpose repository framework.

**Effort/risk:** 1–3 days incrementally; medium risk if combined with broad rewrites. **Verify:** Shared contract fixtures traverse every persistence path and malformed responses fail with actionable errors at the API boundary. Test equivalent connectivity/permission/validation errors across all strategy hooks.

### M3 — Accessibility semantics are incomplete in primary flows

**Severity: Low. Confidence: confirmed missing declarations; device assistive-technology behavior untested.**

**Evidence:** Shared `src/components/Button.tsx:63-75` supplies a label but no explicit button role or disabled/busy accessibility state. Core email/password fields (`src/features/auth/screens/AuthScreen.tsx:412-453`) and recipe title/ingredient inputs (`src/features/recipes/components/RecipeForm.tsx:710-724,745-756`) rely on adjacent visual text/placeholders rather than explicit accessible names/label associations. Some icon actions and billing options already provide roles/labels, so this is not a claim that accessibility is absent everywhere.

**Trigger/impact:** Screen-reader users can receive weak or inconsistent field/control identification, especially once a placeholder is replaced by entered content. Loading/error changes are not consistently announced.

**Smallest sensible fix:** Add semantic role and busy/disabled state in the shared Button; give important inputs stable localized accessible labels and associate validation text. Announce form errors and move focus deliberately in OTP/modal flows.

**Effort/risk:** 0.5–1 day; low visual regression risk. **Verify:** VoiceOver/TalkBack sign-up, recovery, recipe save, and purchase/restore flows; accessible queries in focused component tests; keyboard navigation for supported web surfaces.

### Lower-priority maintenance observations

`AGENTS.md` says no automated tests are committed, although this checkout has 30 suites. `README.md` is partly starter documentation with machine-specific absolute links, and recommends `reset-project` even though `scripts/reset-project.js` is absent. `tests/README.md` points to future Maestro flows under `maestro/flows/`, while active flows live in `.maestro/`. `src/features/sync/premiumMigration.ts` has no callers and duplicates an older migration path. Update documentation and remove obsolete code only after confirming it is not part of an external integration. These are secondary to the concrete defects above. No circular-dependency or unused-dependency claim is made without a dedicated graph/bundle analysis.

## 7. Validation results and inspection limitations

### Checks actually run

All scripts/configuration were read before execution. Local checks used installed tools; dotenv loading was disabled for lint/Jest. No auto-fix, installation, lockfile rewrite, database migration, remote auth probe, build, purchase, or data query was run.

| Check | Exact command/scope | Result |
|---|---|---|
| Working tree | `git status --short` before inspection | Clean |
| TypeScript | `./node_modules/.bin/tsc --noEmit --incremental false` | Exit 0, no diagnostics; Edge Functions excluded by project config |
| Repository lint | `EXPO_NO_DOTENV=1 CI=1 ./node_modules/.bin/eslint . --no-cache` | Exit 1: 12 errors, 13 warnings. Ten errors are Deno import resolution; two are missing skill-script modules. Warnings include generated router types and test conventions. This ran ESLint directly to avoid Expo-generated state writes. |
| Default app lint scope | `EXPO_NO_DOTENV=1 CI=1 ./node_modules/.bin/eslint app src --no-cache` | Exit 0, no diagnostics; matches the existing directories in the installed Expo lint default scope without generating Expo state |
| App/test lint | `EXPO_NO_DOTENV=1 CI=1 ./node_modules/.bin/eslint app src tests --no-cache` | Exit 0: 0 errors, 11 warnings in tests; warnings remain actionable per repository guidance |
| Jest | `EXPO_NO_DOTENV=1 CI=1 npm run test:ci -- --cacheDirectory=/private/tmp/dropsauce-audit-jest` | 29 suites passed, 1 failed; 143 tests passed, 1 failed; no snapshots; reported run time 31.585 s. Failure: login mock lacks `data.session`. Jest then reported open handles and did not exit naturally; interrupted after results were collected, exit 1. |
| Dependency advisories | `npm audit --json --ignore-scripts --cache /private/tmp/dropsauce-audit-npm` | Initial sandbox DNS failure; approved registry retry succeeded, exit 1 for findings: **27 affected package entries: 6 high, 12 moderate, 9 low, 0 critical**. Repeated once to obtain an untruncated structured summary. Counts include transitive/advisory propagation, not 27 independently exploitable app bugs. |
| Dependency reachability | Lockfile parent analysis and installed Router source inspection; `npm explain decode-uri-component image-size node-forge zod` | URI decoder reaches Router. `image-size` comes from Metro; `node-forge` from Expo CLI/code-signing tooling; `zod` from ESLint hooks tooling. `npm explain` output was excessively large; parent conclusions were cross-checked directly from the lockfile. |
| Pure conversion probes | In-memory TypeScript transpilation/VM execution of `ingredientMeasurements.ts` | Confirmed multi-digit-fraction, Unicode, and small-value outputs reported in R11; no files changed |
| Persistence boundary probes | Actual local recipe storage module transpiled in memory with mocked SQL/filesystem | Confirmed truncated-snapshot cache deletion and attachment cleanup, omitted ingredient kind, and unconditional dirty/deletion acknowledgement; no real database/files touched |
| Account-switch probe | In-memory execution of actual `restoreCloudRecipeDocument` with deferred fake download and mocked filesystem/SQL | Confirmed A's synthetic document inserted with owner B after switching active owner during the await |
| Secret patterns | Redacted local Python scan; accessible Git objects; ignored env files; selected generated text | No secret-format match requiring rotation found. Public anon JWT classified without printing value; see scope below. |
| Asset size | `du -ah assets` | Approximately 2.0 MiB; disk size, not final bundled/download size |

### Advisory applicability

- **Runtime priority:** URI decoder 0.2.2 (S5), with actual navigation dependency reachability. Exploitability under device URL limits remains to be tested safely.
- **Build/developer surfaces:** `image-size` 1.2.1 has malformed-image infinite-loop advisories ([JXL/HEIF](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), [ICNS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)); its inspected parent is Metro, not the app's user-import decoder. `node-forge` 1.4.0 has multiple TLS/ASN.1/signature/crypto advisories, for example [RSA signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv); inspected parents are Expo CLI/code-signing tooling. These deserve compatible tooling updates and build-input review, but do not establish mobile TLS or purchase-verification vulnerabilities. OTA signing configuration was not inspected externally.
- **Other tooling:** Glob/minimatch, deepmerge/Jest, and Zod/ESLint advisory chains were reported. Their package-manager production/dev labels are imperfect proxies for what ships: Expo bundles tooling dependencies into its installation. Determine actual release bundle inclusion before escalating every advisory to a runtime finding. No native Gradle/CocoaPods, Deno-resolved, or Laravel Composer advisory scan was run.

### Coverage and external verification still required

1. **Deployed schema/policies:** No database or production rows were accessed. Confirm every migration, function definition, grant, trigger, Storage policy, bucket visibility, quota, cron job, and Data API row cap matches the reviewed source. `docs/production-schema-runbook.md` explicitly says a schema export is still required to capture historical development definitions. A local/isolated reset and schema diff remain necessary; no fresh migration replay was performed.
2. **Authorization tests:** Use two synthetic users and a guest in an isolated environment for every recipe/ingredient/folder/note/shopping/import/free-slot RPC and Storage operation, including swapped parent IDs, owner changes, nested paths, revoked/expired sessions, and service-role-only RPCs. For example, the later recipe-folder insert policy checks the recipe owner (`supabase/migrations/20260928140000_enforce_premium_cloud_permissions.sql:59-64`) but not the referenced folder owner; confirm a constraint/trigger closes this relationship boundary. Cross-user attachment exploitability was not established here.
3. **Backend extraction/credits:** Laravel code is unavailable. Verify JWT signature/issuer/audience/expiry, ownership of document and extraction IDs, paid access, body/dimension/page limits, request idempotency, atomic credit reservation/consume/release, job retries/timeouts, concurrency, provider URL/SSRF controls, and sensitive payload/error retention there. SQL enables RLS on extraction/ledger/jobs/cache tables; absence of client policies is not by itself an exposure. Do not infer worker security from those tables.
4. **Auth deployment:** Verify email templates/OTP lengths, confirmation requirements, redirect allowlists, password/re-auth policies, abuse limits, recovery PKCE configuration, and native/universal link association. Supabase hosted auth settings are not committed in this minimal `config.toml`.
5. **Purchases:** No purchase or restore was initiated. Verify store products/offerings, entitlement ID, webhook delivery credentials and app/environment filters, alias/transfer settings, retries, refunds, grace periods, expiration, and reconciliation with synthetic sandbox accounts. Avoid interpreting a working SDK paywall as server authorization proof.
6. **Native/web execution:** No EAS, Gradle, Xcode, prebuild, Expo export, or simulator/browser interaction was run. Existing Android/generated `dist` artifacts may be stale; iOS generated code was unavailable. These commands can regenerate workspace files, require platform provisioning/downloads, or incur paid operations. Review production bundle/native manifests, permissions, backup rules, OTA runtime compatibility, and TLS behavior as a separate release validation. Deno is not installed, so no Edge Function type check was possible.
7. **Secret scan boundary:** Tracked working-tree files and the two ignored local env files were scanned using recognizable credential patterns. Git scan covered reachable distinct text blobs up to 2 MB, excluding binary assets and skill/IDE paths. Generated text scan covered selected JS/JSON/XML/Gradle/properties/maps/HTML/text/env files up to 40 MB in `dist` and Android source/output locations, excluding build intermediates and dependency caches. APK/AAB binaries, remote histories, unreachable Git objects, EAS/server secrets, service logs, backups, and production artifacts were not examined. No secret values were printed.
8. **Performance:** No device CPU/frame/network/battery benchmark or production analytics was accessed. Algorithmic/request-count findings are distinguished from measured latency. Offline files, caches, and large-library scenarios need device testing after integrity fixes.
9. **Local limits:** Free count and byte limits have local guards and tests, but count/check and insert are separate operations (`src/features/recipes/storage/localRecipesStorage.ts:392-447`; `src/features/recipes/storage/recipeDocumentStorage.ts:378-428`). Concurrent writes can pass the same check; use a transaction if the exact local cap must hold. This is not a cloud authorization boundary. Server reservations provide an atomic import aggregate check, but S3 bypasses that route. Recipe limits are not assumed to apply to unlimited Premium recipes.

## 8. Practical remediation plan

1. **Close authorization and isolation holes first (S1, S2, S3).** Separate entitlement provisioning from content migration, require authoritative purchases, bind work to an immutable account, and close direct unreserved uploads. Reproduce in an isolated backend with synthetic users; do not exercise the bypass in production.
2. **Protect saved work (R1–R4).** Add transactional/idempotent recipe saves, conditional version acknowledgements, owner-filtered queues, and complete-snapshot/tombstone reconciliation. Immediately stop deleting local-only attachments based on incomplete list responses. Add failure-injection tests before broader sync refactoring.
3. **Make paid lifecycle reliable (S4, R5–R7).** Mount and test recovery, reconcile transfer/expiry on the server, retain same-account entitlement state on unrelated transient failures, and repair field round trips. Test killed-app, restore, delayed-webhook, offline, and account-switch paths together.
4. **Repair privacy, deletion, and dependency exposure (S5–S8, R8–R10).** Resolve the runtime decoder advisory, decide photo privacy explicitly, constrain auth/upload boundaries, implement retryable deletion and local erasure, and gate unsupported web writes. Verify deployment rules rather than relying solely on source migrations.
5. **Make the app easier to operate and maintain (R11–R12, P1–P2, M1–M3).** Correct conversions/completeness, eliminate idle full pulls and unchanged writes, budget offline downloads, repair checks, centralize proven shared contracts, and complete accessibility semantics. Measure device performance after these concrete work reductions before adding speculative caching/memoization.

### Five most important actions and release decision

1. Remove the unpaid server-side Premium grant and verify authorization using synthetic Free/lapsed users.
2. Bind every asynchronous import/sync operation to the initiating account and block cross-account completion.
3. Make recipe writes transactional and retry-safe, with version-conditional acknowledgements that preserve newer edits/deletions.
4. Stop destructive reconciliation from truncated lists; use complete snapshots or explicit tombstones and owner-filtered queues.
5. Complete purchase recovery and server transfer/expiry handling, then validate restore/interrupted-purchase flows before release.

**Evidence-backed release blockers:** S1, S2, R1, R2, and R3 should block a production release containing these paths. R4/R5 should block a release promising reliable Premium backup/recovery until exercised and corrected. S3 must be closed before offering a bounded paid storage allowance. If web editing is advertised, R10 blocks that web release. The incomplete deployed-schema/auth/purchase verification is a release-validation gap, not proof that deployment settings are safe or unsafe. Passing TypeScript or repairing the current test failure does not resolve these blockers.
