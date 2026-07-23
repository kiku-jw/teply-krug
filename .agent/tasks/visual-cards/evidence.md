# Evidence

## Verdict inputs

- AC1: Content tests prove that exactly 12 of the existing 360 cards carry a
  visual. Each rewritten prompt asks players to choose, identify, compare, act,
  or recall something visible in the image.
- AC2: The image-generation prompt explicitly banned crosses, cross-shaped
  focal objects, churches, domes, icons, halos, altars, clergy, devotional
  objects, denominational emblems, divine figures, and mystical light. The
  first childhood-object draft was rejected because of a cross-shaped
  directional pad and regenerated with separate round buttons. `raw/visual-review.md`
  records a clean per-file audit of the committed set.
- AC3: The same prompt contract banned flags, coats of arms, maps, military
  objects and uniforms, political slogans, war damage, and current-conflict
  references. Ukrainian context is expressed through food, trains, courtyards,
  landscapes, and peaceful outings.
- AC4: All accepted assets use the same tactile cut-paper collage treatment,
  3:2 composition, restrained indigo/cobalt/ochre/coral palette, and contain no
  baked text, logo, or watermark.
- AC5: Unit and browser tests prove that the default path prefers text cards,
  every sixth completed turn prefers an unseen visual card, and the next turn
  returns to text. Consecutive visual cards are rejected by normal pacing.
- AC6: Browser tests exercise 1280 x 720 and 390 x 844 layouts, the longest
  illustrated prompt, intrinsic image dimensions, useful alt text, no
  horizontal overflow, and an aborted-image fallback that keeps the full
  question and `ДАЛЬШЕ` usable.
- AC7: Twelve local 900 x 600 WebP files total 984,556 bytes, below the
  1.8 MB budget. The implementation adds no dependency, account, analytics,
  storage field, or runtime network integration.
- AC8: The 12 prompts use natural spoken Russian, remain gender-neutral, work
  for two people or a larger Zoom group, and cover childhood, peaceful memories
  of Ukraine, Bible clues, hobbies, and imagined life in the new world. The
  strongest personal spiritual questions remain text-only.
- AC9: The existing jar reveal remains the transition. Only the image receives
  a short paper-like entrance; reduced-motion clears both duration and delay,
  and load failure restores the ordinary text layout.
- AC10: `npm run check` passed 29 tests and a strict production build.
  `npm run test:e2e -- --reporter=line` passed 38 tests with two intentional
  project-specific skips. Diff hygiene, dependency audit, media dimensions,
  aggregate size, desktop/mobile captures, and the committed-asset visual audit
  passed. Publication and live Pages readback will be recorded on GitHub
  Issue #6 after the exact default-branch revision is deployed.

## Review notes

- The smallest implementation path won: one optional typed field, native image
  loading, a small pacing preference, and CSS on the existing question card.
- The generated source set was inspected as a contact sheet and individually.
  `raw/visual-review.md` records the committed-asset symbolism audit, and a
  separate findings-first code review reported no blocker beyond the required
  post-push live readback.
- The automated terminal lazy-senior worker was unavailable because the managed
  Codex service returned HTTP 503. The main owner performed the lower-rung and
  delete-list review, and a fresh native reviewer verifies the resulting diff.

## Evidence files

- `raw/check.txt`
- `raw/e2e.txt`
- `raw/media.txt`
- `raw/preflight.txt`
- Fresh screenshots are regenerated under ignored `test-results/` by
  `tests/e2e/visual.spec.ts`.
