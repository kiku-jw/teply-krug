# Visual cards

Canonical issue: https://github.com/kiku-jw/teply-krug/issues/6

## Original task

Add more visual interaction to the question-jar game. Use generated pictures
only where they change what the group does, not as decoration. Explicitly
exclude crosses, Orthodox imagery, and other inappropriate religious
symbolism. Define and enforce the editorial and visual criteria before release.

## Product goal

Make an occasional draw feel like a special illustrated note that prompts a
choice, a guess, a memory, or a short shared action. Visual notes should create
fresh energy during a long Zoom evening without turning the game into a slide
deck or weakening its conversational focus.

## Design read

Host-controlled Zoom conversation game for friends, with a tactile paper-jar
language. Preserve the existing restrained dark interface and use warm,
handmade editorial imagery inside the note. Target dials:
`DESIGN_VARIANCE 7`, `MOTION_INTENSITY 6`, `VISUAL_DENSITY 3`.

## Acceptance criteria

- **AC1: Images are mechanics.** Exactly 12 of the existing 360 built-in cards
  gain an image. Every selected card requires the image for a choice, clue,
  comparison, or visual discovery. Strong personal and spiritual questions
  that work better face-to-face remain text-only.
- **AC2: Safe religious treatment.** No generated asset contains a cross or
  cross-shaped focal object, church or cathedral, onion dome, icon, halo,
  stained glass, altar, rosary, clergy, vestment, devotional candle, shrine, or
  denominational emblem. No depiction of Jehovah, heavenly beings, or
  supernatural light standing in for Jehovah. Bible clues use ordinary
  objects, landscapes, and non-devotional historical details.
- **AC3: No accidental propaganda or conflict imagery.** Assets contain no
  flags, coats of arms, military equipment, uniforms, political slogans,
  territorial maps, war damage, or current-conflict references. Ukrainian
  context is expressed through familiar peaceful places, food, travel, and
  domestic memories.
- **AC4: Coherent visual language.** All 12 images share one tactile,
  hand-crafted paper-collage style with visible paper texture, imperfect edges,
  restrained indigo/cobalt/ochre/coral colors, no baked-in words, no logos, no
  watermarks, and no generic AI glow.
- **AC5: Hidden cadence.** Visual cards remain an invisible internal variation,
  never a visible category. Normal random draws prefer text cards, while
  approximately every sixth completed turn prefers an unseen visual card.
  Consecutive visual cards are avoided and category-specific host choices still
  work when no matching visual card is available.
- **AC6: Zoom-readable card.** The image and question remain readable on desktop
  and a 390 x 844 viewport without horizontal overflow. The image has useful
  alternative text, fixed intrinsic dimensions, and a safe local fallback. The
  primary question remains accessible HTML rather than baked into the bitmap.
- **AC7: Static and lightweight.** Images are local compressed WebP assets.
  Combined visual-card media stays below 1.8 MB. No runtime network request,
  new dependency, account, analytics, or answer storage is added.
- **AC8: Editorial quality.** Visual prompts are natural spoken Russian,
  gender-neutral, workable for two people and larger Zoom groups, and make no
  shared-room assumption. The set includes childhood, peaceful Ukrainian
  memories, Bible clues, and personal imagination about life in the new world.
- **AC9: Motion remains motivated.** The existing jar reveal stays the entry
  transition. An illustrated note receives one short image reveal after the
  paper opens, with reduced-motion and media-failure behavior remaining
  immediate and usable.
- **AC10: Proof and release.** Content/unit tests cover count, safety metadata,
  cadence, non-consecutive selection, and fallback behavior. `npm run check`,
  `npm run test:e2e`, mobile and desktop visual inspection, media-size checks,
  and a fresh skeptical review all pass before the exact revision is pushed and
  read back from GitHub Pages.

## Constraints

- Preserve the repository, Pages URL, dark brand, 360-card total, hidden
  stage/category system, 2-12 player support, and current storage format.
- Use Vite, TypeScript, native DOM/CSS, and native browser image loading.
- Add no runtime dependency and no TypeScript assertion.
- Do not place generated images on the strongest personal spiritual prompts,
  including how someone learned the truth, came to love Jehovah, felt the
  brotherhood's love, or feels gratitude to Jehovah.
- Do not generate or publish an asset that merely looks attractive but produces
  no distinct player action.

## Non-goals

- Illustrating all 360 questions.
- Generating portraits of Bible characters.
- Depicting doctrine, miracles, paradise as authoritative fact, or official JW
  visual identity.
- Adding galleries, an image editor, uploads, user photos, reactions, scoring,
  achievements, or animation before every question.

## Verification plan

1. Validate each source image visually against AC2-AC4 before integration.
2. Unit-test visual-card selection cadence and consecutive-card avoidance.
3. Content-test the exact visual count, local path/alt completeness, 360 total,
   uniqueness, and banned visual metadata terms.
4. E2E-test one visual card at desktop and 390 x 844, reduced motion, failed
   image loading, keyboard flow, and the unchanged text-card path.
5. Run `npm run check`, `npm run test:e2e`, `git diff --check`, media dimension
   and aggregate-size checks, then perform a fresh findings-first review.
6. Fetch before publication, push only a safe fast-forward, wait for Pages, and
   read back the live HTML, bundle, and one visual asset.

## Stop conditions

- An image contains ambiguous religious, political, military, or conflict
  symbolism that cannot be removed with one focused regeneration.
- A useful visual set cannot fit the mobile card or the 1.8 MB aggregate budget.
- Unrelated user changes overlap the same production files.
- The default branch cannot be updated by safe fast-forward.
