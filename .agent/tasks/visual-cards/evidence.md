# Evidence

Implementation revision
`a8f63fffb956b331aa014334a145377da317093b` added the visual-card behavior and
passed the full local verification set before publication. Follow-up revision
`06aa4ab25c3f10dde7b995aa120b4fc2f2fa684d` only polished four visual-card
prompt strings and added proof material; it passed `npm run check` and is the
revision currently deployed on GitHub Pages.

| Criterion | Status | Proof |
| --- | --- | --- |
| AC1 | PASS | `tests/content.test.ts` proves exactly 12 of 360 built-in cards carry a visual, and each rewritten prompt depends on image choice, clue, comparison, acting, or discovery. |
| AC2 | PASS | The generation contract banned crosses, cross-shaped focal objects, churches, domes, icons, halos, altars, clergy, devotional objects, denominational emblems, divine figures, and mystical light. The first childhood-object draft was rejected because of a cross-shaped D-pad. `raw/visual-review.md` and `raw/visual-audit.md` both passed the committed set. |
| AC3 | PASS | The same prompt contract banned flags, coats of arms, maps, military objects and uniforms, political slogans, war damage, and current-conflict references. The accepted Ukrainian-context cards stay with food, trains, courtyards, landscapes, and peaceful outings. |
| AC4 | PASS | All 12 accepted assets share one tactile cut-paper collage treatment, 3:2 composition, restrained indigo/cobalt/ochre/coral palette, and contain no baked text, logo, or watermark. |
| AC5 | PASS | `tests/game.test.ts` and `tests/e2e/game.spec.ts` prove that the normal path prefers text cards, every sixth completed turn prefers an unseen visual card, the next turn returns to text, and normal pacing rejects consecutive visuals. |
| AC6 | PASS | `tests/e2e/visual.spec.ts` exercises 1280 x 720 and 390 x 844 layouts, the longest illustrated prompt, intrinsic image dimensions, useful alt text, no horizontal overflow, and an aborted-image fallback that keeps the full question and `ДАЛЬШЕ` usable. |
| AC7 | PASS | Twelve local 900 x 600 WebP files total 984,556 bytes, below the 1.8 MB budget. The implementation adds no dependency, account, analytics, storage field, or runtime network integration. |
| AC8 | PASS | The 12 prompts use natural spoken Russian, remain gender-neutral, work for two people or a larger Zoom group, and cover childhood, peaceful memories of Ukraine, Bible clues, hobbies, and imagined life in the new world. The strongest personal spiritual questions remain text-only. |
| AC9 | PASS | The existing jar reveal remains the transition. Only the image receives a short paper-like entrance; reduced-motion clears both duration and delay, and load failure restores the ordinary text layout. |
| AC10 | PASS | `a8f63ff` passed `npm run check`, `npm run test:e2e`, `git diff --check`, media-size checks, dependency audit, and desktop/mobile visual inspection. `06aa4ab` passed `npm run check`, deployed successfully via GitHub Pages run `30042975189`, and the live HTML, JS, CSS, and WebP asset were read back from `https://kiku-jw.github.io/teply-krug/`. The published JS bundle contains the four prompt-polish strings from `06aa4ab`, confirming the live site is on the final revision. |

## Review notes

- The smallest implementation path won: one optional typed field, native image
  loading, a small pacing preference, and CSS on the existing question card.
- The generated source set was inspected as a contact sheet and individually.
  `raw/visual-review.md` records the committed-asset symbolism audit and
  `raw/visual-audit.md` records a second independent per-file gate.
- The automated terminal lazy-senior worker was unavailable because the managed
  Codex service returned HTTP 503. The main owner performed the lower-rung and
  delete-list review, and the final skeptical pass reported no findings in
  `raw/review.txt`.

## Evidence files

- `raw/check.txt`
- `raw/e2e.txt`
- `raw/media.txt`
- `raw/pages.txt`
- `raw/preflight.txt`
- `raw/review.txt`
- `raw/visual-audit.md`
- `raw/visual-review.md`
- Fresh screenshots are regenerated under ignored `test-results/` by
  `tests/e2e/visual.spec.ts`.
