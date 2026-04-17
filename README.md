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
