# Fresh local verification

Date: 2026-07-23

## Automated checks

- `npm run check`: PASS
  - 4 Vitest files
  - 26 tests passed
  - TypeScript passed
  - Vite production build passed
- `npm run test:e2e`: PASS
  - 31 Playwright tests passed
  - 1 fixed-viewport duplicate intentionally skipped
  - desktop and 390 x 844 mobile projects
- `git diff --check`: PASS

## Production-preview browser pass

- Loaded the built app at `/teply-krug/`.
- Started a two-person game from a comma-separated name list.
- Resized the active game to 390 x 844.
- Drew and revealed a Bible question.
- Browser console: 0 messages, 0 errors, 0 warnings.
- Requests: HTML, JS, CSS, poster, favicon, and intro video all returned 200 or
  the expected 206 partial-content response.

## Visual artifacts

- `docs/media/welcome.png`: 1440 x 900 presentation view.
- `docs/media/game.png`: 1280 x 720 revealed game view.
- Playwright output includes the 390 x 844 mobile welcome, jar, and question
  views.

## Skeptical review

Two actionable edge cases were found and fixed before this pass:

1. Returning from `Settings -> Deck` could lose the active game return target.
2. Choosing a theme with every matching card hidden could clear the current
   card.

Both now have E2E coverage. No unresolved high-severity finding remains.
Residual risk: perceived sound volume and animation delight still depend on the
host device and Zoom's share-sound setting.
