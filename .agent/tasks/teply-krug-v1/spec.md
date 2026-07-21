# Teply Krug v1

## Original task

Build the approved "Тёплый круг" host-controlled Zoom game as a beautiful Russian GitHub Pages site.

## Acceptance criteria

- AC1: A host can enter 6-12 names, preserve their order, and reach the first question in under one minute.
- AC2: Play advances fairly around the circle, stops at a checkpoint after every full circle, supports another circle or the next of three stages, and reaches a finish screen.
- AC3: The app includes exactly 360 unique Russian cards, balanced as 120 per stage and 72 per category, with no duplicate wording.
- AC4: Cards do not repeat until the eligible stage deck is exhausted; seen-card history and the active session survive reloads in localStorage.
- AC5: Every player receives Replace plus two distinct one-use abilities; all five ability behaviors work without scoring or coercion.
- AC6: A soft 45/75/120-second or disabled timer never auto-advances and provides optional visual/audio feedback at zero.
- AC7: The host can add, edit, remove, filter, enable, and disable local custom cards, and can disable or restore built-in cards without editing source code.
- AC8: The UI is usable at 1280x720, 1440x900, and 390x844, supports keyboard focus and reduced motion, and keeps all visible copy in natural Russian.
- AC9: No accounts, backend, analytics, Zoom API, official JW branding, stored participant answers, or remote runtime assets are introduced.
- AC10: Typecheck, unit tests, content validation, production build, Playwright flows, and a fresh visual review pass all succeed.
- AC11: A GitHub Pages workflow builds and deploys the static artifact; the live URL is read back if publication credentials are available.

## Constraints

- Greenfield repository in the current directory.
- Vite, TypeScript, native DOM/CSS; no React, Tailwind, router, or state library.
- Russian UI and content; English technical artifacts.
- No TypeScript assertions.
- Preserve privacy: names and settings remain in the host browser, answers are never collected.

## Non-goals

- Player devices, multiplayer rooms, authentication, scoring, rankings, camera/microphone access, answer export, custom domains, and multilingual UI.

## Assumptions

- Repository target is `kiku-jw/teply-krug` and the Pages path is `/teply-krug/`.
- The public repository is acceptable because it contains no private participant data.
- Built-in spiritual content uses original wording and avoids claims of official affiliation.

## Verification plan

- Unit tests for deck selection, round progression, abilities, persistence validation, and stage transitions.
- Automated content balance and duplicate checks.
- Playwright host journeys for 6 and 12 players, abilities, editor, reload, and finish.
- Screenshots at desktop and mobile sizes followed by visual inspection.
- `npm run check`, `npm run test:e2e`, and deployed-page smoke test.
