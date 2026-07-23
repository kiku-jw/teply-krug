# Issue 5 delivery spec

## Original task

Implement the complete improvement set approved after the whole-game audit:
smooth hidden pacing, fewer host controls, duration modes, varied tactile
reveals and sound, easier participant setup, stronger ending, less repetitive
question wording, gender-neutral copy, verification, and GitHub Pages release.

Canonical issue: https://github.com/kiku-jw/teply-krug/issues/5

## Product goal

Make a host-controlled Zoom evening feel like friends drawing notes from a
physical jar. The interface should disappear once a question is visible. The
game should stay playful, warm, spiritually appropriate, and comfortable for
two to twelve people without scores, accounts, analytics, or answer storage.

## Assumptions

- Preserve the current dark visual identity, jar assets, Russian product
  language, static architecture, and GitHub Pages URL.
- Preserve 360 built-in questions; improve selection and wording instead of
  increasing volume.
- Session duration is guidance, not a hard interruption while somebody speaks.
- A hidden director may use internal tags, but categories and stages must remain
  invisible during normal play.
- Native TypeScript, CSS, HTML, Web Audio, and existing project dependencies are
  sufficient.

## Acceptance criteria

- **AC1: Smooth hidden sequence.** The selector avoids consecutive category,
  deep, and perform cards when alternatives exist. Direct-answer cards remain
  possible in every round. The first card is Bible-based.
- **AC2: Compact fallback actions.** Per-player abilities, token counts, and
  ability inventory are removed. A compact menu exposes only "Другой вопрос",
  "Ответить вместе", and an optional host theme choice.
- **AC3: Honest duration modes.** Setup offers 15-minute, 30-minute, and
  open-ended sessions. Timed modes finish only at a natural checkpoint and the
  checkpoint gives useful continuation guidance.
- **AC4: Low-density game screen.** A 390 x 844 viewport keeps the active
  question, timer, "ДАЛЬШЕ", and compact fallback control usable without a
  vertical stack of administrative cards.
- **AC5: Fast participant setup.** The host can paste comma-separated or
  newline-separated names, still edit order, and play with 2-12 people.
- **AC6: Motivated motion and sound.** At least three short reveal treatments
  vary the jar-to-paper transition without delaying repeated turns. Reduced
  motion and media failure reveal the question immediately. Game cues share a
  paper/glass sonic character.
- **AC7: Editorial rhythm.** The deck stays at 360 unique cards, avoids abrupt
  format shifts, reduces repetitive openings, keeps existing Ukraine,
  childhood, new-world, spiritual-history, two-person, and gender-neutral
  gates, and extends neutral-language checks to visible UI copy.
- **AC8: Ending ritual.** The game can finish cleanly after a question or at a
  checkpoint and ends with one final reflective note tied visually to the jar.
- **AC9: Persistence and accessibility.** Existing local sessions migrate
  safely or reset without a broken screen. Focus, dialogs, announcements,
  keyboard use, and reduced motion remain usable.
- **AC10: Proof and release.** `npm run check` and `npm run test:e2e` pass, a
  desktop and mobile smoke path passes, the skeptical review has no unresolved
  high-severity finding, and the exact verified revision is published to
  GitHub Pages.

## Constraints

- No accounts, backend, networking, analytics, scoring, answer storage, or new
  runtime dependency.
- No TypeScript assertions.
- No visible stage/category taxonomy during ordinary play.
- No forced stop while somebody is answering.
- Preserve unrelated user work and never force-push.

## Non-goals

- More than 360 built-in questions.
- Multiplayer synchronization.
- Competitive progression, streaks, achievements, or virtual currency.
- Replacing the existing brand, repository, or Pages URL.
- A long cinematic video for every draw.

## Verification plan

1. Unit tests for migration, sequence constraints, duration calculations, and
   first-card behavior.
2. Content tests for deck size, uniqueness, spoken-language regressions, format
   balance, and gender-neutral UI strings.
3. E2E tests for two and twelve players, bulk names, duration modes, compact
   fallback actions, finishing after a question, reveal variation, reduced
   motion, persistence, and mobile layout.
4. `npm run check`, `npm run test:e2e`, and current-browser desktop/mobile
   screenshots with console and request-failure capture.
5. Fresh findings-first review of the final diff and acceptance evidence.

## Stop conditions

- A requested behavior would require external storage, private data, a new
  provider, or irreversible migration.
- Existing unrelated work overlaps the same files in a way that cannot be
  preserved safely.
- The verified revision cannot be published as a fast-forward to the existing
  Nick-owned default branch.
