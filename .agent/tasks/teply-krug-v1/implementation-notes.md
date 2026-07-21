# Implementation notes

- Frozen architecture: Vite + TypeScript + native DOM/CSS. Existing party-game projects were broader than the single-host requirement, so no game framework was adopted.
- The visual design skill is applied only as a visual/pre-flight filter because this is a multi-step product UI, not a landing page.
- The deck is explicit editorial content: 15 stage/category groups with 24 prompts each. Runtime code assigns stable IDs but does not generate wording.
- Replace is guaranteed for every player; the other two abilities are randomly dealt from four non-competitive options.
- Built-in cards remain immutable. Hiding is stored by ID, while editing creates or updates a local custom card.
- Mobile Playwright initially inherited WebKit from an iPhone preset. The project now uses Chromium with a 390x844 touch viewport so one installed engine covers both layout targets.
- Visual review found root-level horizontal overflow from decorative orbits on mobile. Root clipping and an automated scroll-width assertion fixed it.
- A favicon removed the only Lighthouse best-practices failure, which was a console 404.
