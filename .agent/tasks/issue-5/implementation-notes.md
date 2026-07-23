# Implementation notes

## Decisions

- Preserve the jar as the signature interaction and redesign around it.
- Remove strategy-like token inventory instead of renaming it again.
- Use a constrained local draw function rather than a new engine or dependency.
- Treat duration as a natural checkpoint target, never a hard answer cutoff.
- Keep the existing Seedance jar clips and vary repeat draws with three short
  CSS treatments instead of adding more video weight.
- Generate small paper and glass cues with Web Audio; no runtime asset or
  dependency was added.
- Accept pasted comma-, semicolon-, or newline-separated names in one field and
  keep the supported group size at 2-12.
- Migrate version 1 sessions in place while retaining the existing storage key.
- Keep stage and category labels available to the host in the deck editor, but
  hide them throughout normal play.

## Deviations and tradeoffs

- Fifteen- and thirty-minute modes estimate whole rounds from the selected
  answer timer plus transition time. A session may run a few minutes long
  because the game never interrupts a person or stops mid-round.
- The first draw keeps the longer video introduction. Repeat draws use the
  existing short clip plus CSS variation, so novelty increases without making
  every turn cinematic.

## Unexpected constraints

- The installed proof-loop skill does not include its optional helper script,
  so task artifacts and validation are maintained manually.
- A fresh `npm ci` required downloading the matching Playwright Chromium cache
  before browser verification could run.

## Follow-ups

- No code follow-up is required for release. Real Zoom groups may still prefer
  different timer defaults; that remains a host setting rather than hidden
  product logic.
