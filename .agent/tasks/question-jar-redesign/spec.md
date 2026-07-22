# Question jar redesign

## Original task

Replace the abstract "Тёплый круг" presentation with a tactile question-jar game. Use a short Seedance animation of a transparent jar full of folded notes, including paper and glass sounds, while keeping repeated turns fast and varied enough for a long Zoom evening.

## Acceptance criteria

- **AC1:** The player-facing brand no longer says "Тёплый круг". The welcome, setup, gameplay cover, metadata, and repository copy consistently present `Доставай!` as a jar-of-questions game for friends.
- **AC2:** Drawing a question feels physical: the first animated draw in a page visit uses a complete jar-to-unfolded-note sequence no longer than 3.7 seconds; later draws use a sequence no longer than 1.7 seconds.
- **AC3:** Repeated draws have lightweight visual variation without scoring or random delays. At least one occasional variation changes the presentation while preserving the same timing and question selection.
- **AC4:** The generated note contains no baked-in question text. The actual question remains accessible HTML and appears only after the draw animation completes or fails safely.
- **AC5:** Video audio follows the existing sound preference. The existing motion preference and `prefers-reduced-motion` bypass the reveal delay and video playback.
- **AC6:** All runtime media is local and static, with no provider calls, analytics, accounts, or answer storage. The combined published jar media stays under 1 MB.
- **AC7:** Existing two-to-twelve-player flow, saved sessions, timer, abilities, custom-card editor, hidden internal pacing, and Bible-first opening remain functional.
- **AC8:** Desktop and 390x844 mobile layouts keep the active player, draw control, question, timer, and abilities readable without horizontal overflow.
- **AC9:** `npm run check`, `npm run test:e2e`, media metadata checks, fresh visual inspection, diff hygiene, GitHub Pages deployment, and a live bundle/media readback pass.

## Constraints

- Preserve the current repository and Pages URL.
- Keep Vite, TypeScript, native DOM/CSS, native media elements, and the existing Web Audio fallback. Add no runtime dependency.
- Preserve the current localStorage key and stored-data shape.
- Keep all visible product copy in natural Russian and avoid gendered player assumptions.
- Add no TypeScript assertions.

## Non-goals

- Renaming the GitHub repository or Pages path.
- Calling Seedance or Higgsfield at runtime.
- Generating hundreds of question videos or baking question text into media.
- Multiplayer synchronization, scoring, rewards, streaks, or manipulative retention mechanics.
- A long animation before every question.

## Assumptions

- One complete animation is enough to establish the physical metaphor; subsequent turns should prioritize pace.
- A mirrored or accented quick draw provides sufficient occasional variety without additional paid generations.
- The host deliberately clicks the draw control, so sound playback is allowed by normal browser media policies.

## Verification plan

1. Add E2E coverage for the new brand, first/quick reveal states, event-driven question appearance, motion bypass, and sound muting.
2. Run unit/content tests, strict TypeScript, and the production build.
3. Run complete desktop/mobile Playwright flows and capture fresh screenshots of the jar cover, active animation, and unfolded question.
4. Inspect generated frames and media metadata, sizes, codecs, durations, and local production requests.
5. Run publication preflight, deploy the default branch, and read back the live HTML, bundle, and media URLs.
