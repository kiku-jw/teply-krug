# Implementation notes

## Scope decision

- Keep the deck at 360 cards and attach visuals to 12 existing IDs.
- Use one optional `visual` property on `Card`; custom cards remain text-only.
- Use native `<img>` rendering and the existing jar reveal. Add no dependency,
  visual mode, visible label, upload flow, or storage migration.
- Prefer one visual card every sixth completed turn. Text cards are preferred at
  other times, and normal pacing rejects consecutive visual cards.
- Keep the illustrated note short enough for a 1280 x 720 shared screen by
  constraining image height instead of letting the media push the controls
  below the fold.

## Visual manifest

All final assets were generated with the built-in image tool and converted to
900 x 600 WebP at quality 70. The common prompt contract required tactile
hand-cut paper collage, visible fibers, no baked text, no logos, no crosses,
no Orthodox or denominational imagery, no flags, no military or conflict
imagery, and no mystical depiction of Bible subjects.

| Card ID | Asset | Final prompt |
| --- | --- | --- |
| `spark-personal-3` | `childhood-objects.webp` | Choose among six familiar childhood objects and tell the memory they trigger. |
| `spark-stories-14` | `ukraine-memories.webp` | Choose among peaceful train, courtyard, Carpathian, and home-table memories of Ukraine. |
| `spark-bible-3` | `bible-david-clue.webp` | Guess David and Goliath from a sling, five stones, shepherd pouch, and staff. |
| `spark-bible-20` | `new-world-homes.webp` | Choose among three practical nature-side home settings imagined for the new world. |
| `closer-personal-2` | `ukrainian-foods.webp` | Choose the Ukrainian home dish that evokes the strongest memory. |
| `closer-stories-4` | `childhood-evidence.webp` | Choose a harmless piece of evidence from a childhood mishap and tell the story. |
| `closer-bible-10` | `bible-joseph-clue.webp` | Guess Joseph's story from a garment, grain sack, silver cup, and grain. |
| `closer-creative-12` | `new-world-trees.webp` | Choose one of six trees for a future home and explain the choice. |
| `together-personal-2` | `ukraine-weekend.webp` | Let the group choose one of four peaceful Ukrainian day-trip settings. |
| `together-bible-1` | `bible-charades.webp` | Choose one of six object clusters and act out the related Bible character. |
| `together-creative-7` | `everyday-closeups.webp` | Guess four ordinary objects from macro paper-collage details, then share an association. |
| `together-personal-16` | `hobby-table.webp` | Match one of six hobbies to somebody in the group who could teach it. |

## Generation corrections

The first childhood-object draft failed the symbolism gate because its handheld
game had a cross-shaped directional pad. The accepted version replaces it with
four separate round buttons. No other generated image required a correction.

## UI correction during verification

The first desktop visual pass exposed a timing bug: reduced-motion styling
shortened the image reveal duration but left a non-zero delay, which produced a
brief blank image slot in screenshots. The final CSS removes the delay under
reduced motion and caps illustrated-note image height on desktop so the image,
question, timer, primary action, and fallback controls stay visible together.
Image loading uses a native preload during the existing jar reveal. A failed
image removes only the figure and restores the complete text-card layout.

## Media receipt

- 12 WebP files
- 900 x 600 each
- 984,556 bytes combined
- Source PNGs remain under the built-in image-generation output directory; only
  accepted compressed WebP files are part of the repository.

## Late fixes before publish

- The first desktop pass exposed a blank reduced-motion frame because the global
  motion override collapsed animation duration but kept the image reveal delay.
  The final CSS also zeroes animation delay under reduced motion and motion-off.
- The first desktop visual note was too tall for the 1280 x 720 share layout.
  The final visual frame is capped at `50vh`, and Playwright coverage now
  asserts both the shared controls and the fallback copy stay in view.

## Simplicity receipt

- Lower rung used: optional typed card metadata, native `<img>`, CSS, and the
  existing draw function.
- No package, animation library, component framework, storage migration,
  network client, visual category, or new user setting was added.
- GitHub prior-art lookup was skipped because this is a small extension of
  repository-local patterns and introduces no reusable subsystem.
