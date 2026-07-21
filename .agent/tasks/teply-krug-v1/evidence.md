# Evidence

## Verdict inputs

- AC1-AC2: Playwright starts 6- and 12-player circles, verifies ordered turns, completes a full circle, reaches the checkpoint, and advances to `Ближе`.
- AC3: Vitest confirms 360 unique texts and IDs, 120 cards per stage, 72 per category, and 24 per stage/category pair.
- AC4: Unit tests verify non-repeating draws and scoped recycling; Playwright verifies active-session and used-ability restoration after reload.
- AC5: Replace plus two distinct abilities is unit-tested. Playwright executes Replace, Partner, Two Choices, Group Help, and Choose Category.
- AC6: Timer options and soft non-advancing behavior are implemented; build/typecheck covers allowed values and UI paths.
- AC7: Playwright adds and edits a custom card, then hides and restores an individual built-in card.
- AC8-AC9: Desktop and mobile screenshots were inspected. Mobile horizontal overflow was fixed and guarded. No runtime network calls, account surfaces, analytics, or answer fields exist.
- AC10: `npm run check` passed 12 tests plus strict TypeScript and production build. `npm run test:e2e` passed 19 browser tests with one intentionally skipped viewport-only duplicate. Lighthouse scored 100 in all four categories.
- AC11: GitHub Actions run `29873694606`, attempt 2, completed successfully after Pages was configured to use GitHub Actions. `https://kiku-jw.github.io/teply-krug/` returned HTTP 200 and a browser smoke test completed the welcome, six-player setup, and first-turn flow.

## Evidence files

- `raw/check.txt`
- `raw/e2e.txt`
- `raw/lighthouse.txt`
- `raw/preflight.txt`
- `raw/pages.txt`
- Playwright visual artifacts are generated under ignored `test-results/` by `tests/e2e/visual.spec.ts`.
