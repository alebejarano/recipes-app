# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

### Environment setup

Use separate Supabase environments for development and production, and let Expo load the matching `EXPO_PUBLIC_*` values from dotenv files.

Recommended file layout:

- `.env.example`: shared variable list only
- `.env.development.local`: your real local dev values
- `.env.production.local`: your real local prod values for release/preflight work

Environment identity:

- `EXPO_PUBLIC_APP_ENV=development` for local/dev builds
- `EXPO_PUBLIC_APP_ENV=preview` for internal preview builds
- `EXPO_PUBLIC_APP_ENV=production` for release builds

Expo exposes this value at runtime through `extra.appEnv` from [app.config.ts](/Users/alejandra/projects/recipes-app/app.config.ts), and app code can read it through [src/lib/appEnv.ts](/Users/alejandra/projects/recipes-app/src/lib/appEnv.ts).

Committed templates in this repo:

- [.env.example](/Users/alejandra/projects/recipes-app/.env.example)
- [.env.development.example](/Users/alejandra/projects/recipes-app/.env.development.example)
- [.env.production.example](/Users/alejandra/projects/recipes-app/.env.production.example)

Recommended workflow:

1. Keep your current Supabase project as development.
2. Put its values in `.env.development.local`.
3. Put future production Supabase values in `.env.production.local`.
4. Run `npx expo start` for normal local development. Expo resolves development env files for that workflow.
5. Use production env values only for release builds or explicit production validation.

Current local setup in this repo:

- real dev values live in `.env.development.local`
- tracked `.env` has been removed so local credentials are not kept in a generic root env file

### EAS build strategy

This repo now includes [eas.json](/Users/alejandra/projects/recipes-app/eas.json) with three profiles:

- `development`: dev client builds, intended to point at your dev Supabase project
- `preview`: internal test builds, also intended to point at dev Supabase unless you choose otherwise
- `production`: store/release builds, intended to point at your future prod Supabase project

Recommended EAS env setup:

1. Put dev public values in the `development` and `preview` build environment.
2. Put prod public values in the `production` build environment.
3. Keep service-role keys only in Supabase function secrets or secure backend tooling, never in EAS client env.

Minimal mapping:

- `development` and `preview`
  `EXPO_PUBLIC_APP_ENV=development` or `preview`
  `EXPO_PUBLIC_SUPABASE_URL=https://<dev-project>.supabase.co`
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<dev-publishable-key>`
- `production`
  `EXPO_PUBLIC_APP_ENV=production`
  `EXPO_PUBLIC_SUPABASE_URL=https://<prod-project>.supabase.co`
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<prod-publishable-key>`

Useful commands later:

```bash
eas build --profile development
eas build --profile preview
eas build --profile production
```

Practical rules for this app:

- `EXPO_PUBLIC_SUPABASE_URL` should point to your dev Supabase project in development and your prod Supabase project in production.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the only Supabase client key used by [src/lib/supabase.ts](/Users/alejandra/projects/recipes-app/src/lib/supabase.ts:18).
- `EXPO_PUBLIC_ENABLE_POSTHOG=0` is a sensible default for local dev.

Do not commit:

- `.env`
- `.env.development.local`
- `.env.production.local`
- any service-role key

This repo already ignores local env files via `.gitignore`.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Import Reconciliation

Recipe document imports use a metadata table, private Storage bucket, and scheduled reconciliation job to keep metadata and Storage objects in sync.

- Nightly repair job: `recipe-document-imports-nightly-repair`
- Schedule: `15 3 * * *`
- Current behavior: runs `select public.reconcile_recipe_document_imports(1000, false);`
- Effect: repairs metadata rows whose Storage object is missing, but does not automatically delete orphaned Storage objects

The scheduler setup lives in:

- [20260417143000_recipe_document_imports_nightly_reconciliation.sql](supabase/migrations/20260417143000_recipe_document_imports_nightly_reconciliation.sql)

Related production-hardening schema changes live in:

- [20260417140000_recipe_document_imports_production_hardening.sql](supabase/migrations/20260417140000_recipe_document_imports_production_hardening.sql)

Notes:

- Cron time is interpreted by the database scheduler timezone, not the Expo app timezone.
- The nightly job is intentionally non-destructive for MVP.
- A future weekly cleanup template is included as commented SQL in the scheduler migration. If enabled later, it would call `select public.reconcile_recipe_document_imports(1000, true);` to delete orphaned Storage objects automatically.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
