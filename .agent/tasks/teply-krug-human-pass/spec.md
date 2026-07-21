# Teply Krug human pass

## Original task

Replace the AI-like copy and explicit stage mechanics reported from the live mobile game. Make abilities self-explanatory, simplify the turn screen, start with a recognizably Bible-based prompt, hide the internal pacing from players, and add purposeful motion and sound.

## Acceptance criteria

- **AC1:** Gameplay, setup, and round checkpoints do not expose the three internal content stages. The first built-in card of a new game is Bible-based, and later content advances automatically by completed rounds.
- **AC2:** The revealed-card screen has no default coaching slogan or disclaimer footer. Its primary turn button is exactly `ДАЛЬШЕ`.
- **AC3:** Every one-use ability has a plain action name and a visible one-sentence explanation on desktop and mobile.
- **AC4:** The six prompts reported in the screenshots are removed or rewritten. The 360-card deck remains unique, balanced internally, and gets a bounded spoken-Russian editorial pass across the deeper and group portions.
- **AC5:** Card reveal, turn changes, and ability use have purposeful feedback. Sound uses the native Web Audio API, follows the existing sound preference, and motion follows both the existing preference and `prefers-reduced-motion`.
- **AC6:** The host can still resume a stored game, edit local cards, use all five abilities, pause/reset the timer, and finish or continue after a full round.
- **AC7:** `npm run check`, `npm run test:e2e`, mobile visual inspection, and repository diff hygiene pass before publication.

## Constraints

- Static GitHub Pages application; no accounts, backend, analytics, answer storage, or Zoom integration.
- No new runtime dependencies.
- Internal stage/category fields may remain for deck balance and editing but must not appear in shared gameplay.
- Preserve stored-data compatibility and the current repository URL.
- No TypeScript assertions.

## Non-goals

- Recorded music or licensed sound assets.
- Multiplayer synchronization.
- A full visual rebrand.

## Assumptions

- The host shares the gameplay screen, so host-only editor/settings metadata may remain more explicit than the shared turn screen.
- A round means every listed participant has received one turn.

## Verification plan

1. Add failing unit/E2E assertions for automatic pacing, Bible-first start, hidden stage labels, exact button copy, ability descriptions, and removed disclaimer.
2. Run unit tests and the focused mobile E2E suite.
3. Run the complete `npm run check` and `npm run test:e2e` gates.
4. Capture fresh desktop/mobile screenshots and inspect the shared turn screen.
5. Record command evidence and a fresh PASS/FAIL verdict.
