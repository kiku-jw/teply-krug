# Implementation notes

- Product direction: replace the abstract card/orbit metaphor with a physical jar, folded notes, and an unfolded paper question.
- `lazy-senior` decision: use native `<video>`, CSS, media events, and the existing settings rather than adding an animation dependency or reusable state framework.
- Seedance source: Higgsfield job `9e7cd6ee-ef25-4d16-9a96-e12f07796b84`, Seedance 2.0 Mini, one 5-second square generation with audio, cost 12.5 credits.
- The generated source was converted locally into a 3.605-second intro, a 1.600-second quick draw, and a WebP poster. The larger intermediate download was removed after conversion; the job ID remains the recovery reference.
- Actual question text stays in the DOM. Generated paper remains blank to avoid unreadable or invented text.
- The first animated draw in a page visit uses the complete clip. Later draws use the quick clip, alternate direction, and add three brief paper accents every fifth draw.
- Video audio follows the sound preference. Motion-disabled and reduced-motion sessions skip the video and reveal the HTML question immediately.
- Playback errors and stalls fall back to the existing Web Audio cue and reveal the question instead of blocking the turn.
- The existing `teply-krug:v1` localStorage key and repository path remain unchanged so saved games and the published URL continue to work.
- A fresh visual pass replaced the README and social-preview screenshots. No production dependency or runtime provider request was added.
- The scripted `lazy-senior` worker could not authenticate (local Codex token returned HTTP 401), so the same lower-rung review was completed manually: native video, CSS, browser media events, and existing Web Audio were sufficient.
