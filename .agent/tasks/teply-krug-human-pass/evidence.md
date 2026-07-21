# Evidence

## Verdict inputs

- AC1: Playwright verifies that a new game starts with a `spark-bible-*` card, shared screens have no stage rail, and completing a round advances the stored internal stage automatically.
- AC2: Playwright verifies the exact `ДАЛЬШЕ` label and the absence of the coaching slogan and footer disclaimer.
- AC3: Desktop and mobile flows render action names with explanations and exercise all five one-use abilities.
- AC4: Vitest confirms 360 unique, balanced cards and rejects the reported abstract prompts. The editorial pass changed 168 cards.
- AC5: Playwright stubs Web Audio to prove cues follow the sound setting. CSS motion is guarded by both the in-app preference and `prefers-reduced-motion`.
- AC6: Playwright covers resume-compatible state, local card editing, timer behavior, all abilities, checkpoint continuation, and finishing the evening.
- AC7: `npm run check` passed 13 unit/content tests, strict TypeScript, and the production build. `npm run test:e2e` passed 21 browser tests with one intentional skip. `npm audit --audit-level=high` found zero vulnerabilities and `git diff --check` passed.
- Visual inspection: fresh desktop and 390x844 mobile screenshots show a Bible-first card, no visible stage/category labels, no default coaching line or footer, and readable ability explanations.
- Lighthouse: local production build scored 100 for performance, accessibility, best practices, and SEO; LCP 1058 ms, CLS 0, TBT 0 ms.

## Evidence files

- `raw/check.txt`
- `raw/e2e.txt`
- `raw/lighthouse.txt`
- `raw/preflight.txt`
- Playwright visual artifacts are generated under ignored `test-results/` by `tests/e2e/visual.spec.ts`.
