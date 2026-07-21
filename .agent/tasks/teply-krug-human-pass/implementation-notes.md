# Implementation notes

- Kept the stage and category fields only as internal deck-balancing and host-editor metadata. Shared setup, play, and checkpoint screens no longer expose them.
- Mapped completed rounds onto the existing stages instead of changing the stored-session schema: round one uses `spark`, round two uses `closer`, and later rounds use `together`.
- Forced the first built-in draw into the Bible category so the game's context is clear before the conversation broadens naturally.
- Replaced conceptual ability names with action labels and added a visible explanation to every ability button.
- Rewrote 168 prompts in the deeper and group portions of the deck, then added a regression test for the exact prompts reported in the screenshots. The 360-card count and 15-way balance remain unchanged.
- Added short synthesized Web Audio cues and CSS-only motion. No media files, runtime dependencies, network calls, or answer storage were added.
- The existing sound and motion preferences remain authoritative; reduced-motion browser preferences disable the new animation too.
- Refreshed all three repository screenshots after desktop and mobile inspection.
