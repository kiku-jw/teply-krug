# Evidence

Implementation revision is not yet published. AC10 remains `UNKNOWN` until the
exact commit is live on GitHub Pages; all other criteria have fresh local proof.

| Criterion | Status | Proof |
| --- | --- | --- |
| AC1 | PASS | `tests/game.test.ts` checks staged availability, direct answers, and consecutive-category/deep/perform/opening constraints; E2E verifies a Bible first card. |
| AC2 | PASS | E2E verifies two-person play without tokens and the reusable compact fallback menu. |
| AC3 | PASS | Unit tests verify duration planning; E2E completes a 12-person quick round and reaches the natural finish checkpoint. |
| AC4 | PASS | Mobile visual E2E asserts that the question, `ДАЛЬШЕ`, and compact fallback summary remain in the 390 x 844 viewport. |
| AC5 | PASS | E2E starts games from one pasted field with 2 and 12 names; setup validation remains bounded at 2-12. |
| AC6 | PASS | E2E verifies intro, shuffle, pop, unfold, reduced-motion fallback, and sound on/off; both local MP4 files contain AAC audio. |
| AC7 | PASS | Thirteen content gates verify 360 unique cards, balance, Ukraine/childhood/new-world/spiritual themes, two-person use, varied openings, and gender neutrality; visible copy has a separate gate. |
| AC8 | PASS | E2E finishes after any revealed card and verifies the final note; desktop and mobile screenshots show the jar-linked ending. |
| AC9 | PASS | Storage unit tests and E2E verify version 1 migration, reload continuation, settings/editor return, unavailable themes, empty-deck recovery, reduced motion, and dialogs. |
| AC10 | UNKNOWN | `npm run check` and `npm run test:e2e` pass, and a production-preview browser pass is clean; publication is pending. |
