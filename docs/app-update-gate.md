# Mandatory store updates

The app checks `public.app_release_requirements` at launch and whenever it returns to the foreground. The check runs only in production native builds. Preview, development, and web builds are never blocked.

Apply the migration before publishing the first build that contains this feature:

```bash
npm run db:push
```

After an iOS or Android store release is live, use the Supabase SQL editor to set the minimum version for only the platforms that must update. Use the same public version declared in `app.config.ts` (for example, `1.1.0`). For Android, also set the integer version code from the Play Console release; it safely distinguishes builds that share the same public version.

```sql
update public.app_release_requirements
set
  min_ios_version = '1.1.0',
  min_android_version = '1.1.0',
  min_android_build_number = 42,
  ios_store_url = 'https://apps.apple.com/app/idYOUR_APPLE_ID',
  android_store_url = 'https://play.google.com/store/apps/details?id=studio.alpinova.dropsauce',
  updated_at = now()
where id = true;
```

`ios_store_url` is required before enforcing an iOS update. Android falls back to the configured Android package’s Play Store URL, but setting `android_store_url` explicitly is preferred.

To remove a mandatory update, set the relevant minimum version to `NULL`:

```sql
update public.app_release_requirements
set min_ios_version = null, min_android_version = null, min_android_build_number = null, updated_at = now()
where id = true;
```

The last valid requirement is saved on device. Therefore, a user who has already received a mandatory-update rule stays protected while offline; a user launching offline before ever receiving a rule is allowed through.

For each store build, increment `version` in `app.config.ts`. EAS already auto-increments the platform build number for the production profile.
