# Evidence

## Verdict inputs

- AC1: Runtime, metadata, README, favicon, and visual screenshots use `Доставай!`; a Playwright assertion rejects the old player-facing title.
- AC2: Playwright verifies the 3.605-second intro asset on the first animated draw and the 1.600-second quick asset on later draws. The question does not appear before the media `ended` event.
- AC3: Playwright verifies alternating direction and the three-paper accent on every fifth animated draw.
- AC4: The generated note is blank. The question appears as accessible HTML on a cream unfolded-paper surface, with media-error and timeout fallbacks.
- AC5: Playwright verifies media muting from the sound preference and immediate video-free reveal under reduced motion. Existing Web Audio preference coverage remains green.
- AC6: All three media files are local, static, and total 771531 bytes. Lighthouse observed only five same-origin production requests. Source inspection found no runtime network client.
- AC7: The existing two-to-twelve-person flow, saved state, Bible-first opening, hidden pacing, abilities, timer, editor, checkpoint, and finish flows passed on desktop and mobile.
- AC8: Fresh 1280x720, 1440x900, and 390x844 screenshots show no horizontal overflow and keep the jar, active name, question, controls, and ability explanations readable.
- AC9: `npm run check` passed 21 tests plus strict build; `npm run test:e2e -- --reporter=line` passed 25 tests with one intentional skip; audit, diff hygiene, media inspection, and Lighthouse 100/100/100/100 passed. Publication and live Pages readback are recorded on GitHub Issue #4 after the default-branch push.

## Review notes

- The generated source contact sheet was inspected for hand anatomy, accidental text, jar continuity, and a clean blank unfolded note.
- The smallest implementation path won: native `<video>`, CSS, browser media events, and the existing Web Audio cue. No animation package, state framework, or runtime provider integration was added.
- The automatic lazy-senior worker could not authenticate, so the main implementation owner performed the delete-list and lower-rung review manually.

## Evidence files

- `raw/check.txt`
- `raw/e2e.txt`
- `raw/lighthouse.txt`
- `raw/media.txt`
- `raw/preflight.txt`
- Fresh visual artifacts are generated under ignored `test-results/` by `tests/e2e/visual.spec.ts`; selected screenshots are committed under `docs/media/`.
