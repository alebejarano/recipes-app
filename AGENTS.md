# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Expo Router entry points; use route groups like `(public)` and `(auth)` and keep files lean by delegating logic to feature modules.
- `src/features/` contains domain code (onboarding, auth, subscription) with screens, hooks, and context per domain; add new flows here.
- `src/components/` hosts shared UI (e.g., `Button`, `Card`); extend here before duplicating.
- `src/styles/` centralizes tokens, themes, and `createThemedStyles` helpers; prefer these over inline values.
- `src/types/` holds ambient types; `assets/` stores fonts/illustrations/images; `scripts/reset-project.js` regenerates a fresh `app/`.
- Path aliases: `@/*` targets `src/` or `app/`; `@assets/*` targets `assets/`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm start` (or `npx expo start`) runs Metro with Expo DevTools.
- `npm run android|ios|web` launches platform-specific clients for manual testing.
- `npm run lint` lints JS/TS with `eslint-config-expo`; fix warnings before committing.
- `npm run reset-project` resets the starter app (destructive; use only when you intend to wipe local routes).

## Coding Style & Naming Conventions
- TypeScript strict mode is on; keep screens/components in `.tsx`.
- Follow Expo ESLint defaults: 4-space indentation seen in existing files, single quotes, trailing commas where helpful.
- Components use `PascalCase`, hooks `useName`, contexts `NameContext`; route files mirror screen intent (`app/(public)/register.tsx`).
- Favor `createThemedStyles` tokens (spacing, colors, typography) instead of hardcoded numbers; keep shared UI in `src/components` before adding new variants.

## Testing Guidelines
- No automated tests are committed yet; when adding, use Jest + React Native Testing Library with files named `*.test.ts(x)`.
- Co-locate tests with implementation or place them in `__tests__` near the feature.
- Prioritize coverage for navigation flows, form validation, subscription gating, and theme-driven styling logic; mock Expo Router and gesture handlers to keep runs deterministic.

## Commit & Pull Request Guidelines
- Recent history uses concise, lower-case summaries (e.g., `onboarding flow + register`); prefer short, imperative titles plus a few body bullets when needed (`Refs #123`, `npm run lint`).
- Keep PRs focused: describe scope, platforms exercised (android/ios/web), and include screenshots/GIFs for UI updates.
- Organize diffs by domain (`src/features/<domain>`), shared UI (`src/components`), and tokens (`src/styles`) so reviewers can follow intent quickly.
