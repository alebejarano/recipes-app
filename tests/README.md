# Testing guide

Use the smallest test boundary that proves the behavior:

- **Unit tests** live beside the module they exercise in `src/**/__tests__/`. Test pure utilities, hooks, components, repositories, and services in their owning feature. This keeps test ownership aligned with the production feature tree.
- **Shared unit tests** that do not have a natural production-module home can live in `tests/unit/`.
- **Integration tests** live in `tests/integration/`. Use this only for behavior spanning multiple modules, such as a screen plus its provider, navigation, storage, or API boundary. Mock external systems at the edge.
- **Maestro E2E flows** will live in `maestro/flows/`. They run against a built app and are deliberately outside Jest discovery.

Jest test filenames use `*.test.ts` or `*.test.tsx`. Keep fixtures local to the owning test where possible; place reusable factories, render wrappers, and manual mocks under `tests/helpers/` or `tests/mocks/` when they are genuinely shared.

Commands:

- `npm test` — watch all Jest projects while developing.
- `npm run test:unit` — watch unit tests only.
- `npm run test:integration` — watch integration tests only.
- `npm run test:ci` — run all Jest tests once, suitable for CI.

Write UI tests using accessible roles, labels, and visible text rather than implementation details or snapshots. Use `testID` only where an accessible query cannot describe the user-facing element; the same stable identifiers can later support Maestro flows.
