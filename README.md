<p align="center">
  <img src="public/favicon.svg" width="88" height="88" alt="A jar filled with folded notes">
</p>

<h1 align="center">Доставай!</h1>

<p align="center">
  <strong>A host-controlled question-jar game for small Zoom groups.</strong><br>
  One person adds the players and shares the screen; everyone takes turns drawing a note.
</p>

<p align="center">
  <a href="https://kiku-jw.github.io/teply-krug/"><img alt="Open the game" src="https://img.shields.io/badge/Open_the_game-F6BD67?style=for-the-badge&logo=github&logoColor=17130D"></a>
  <a href="https://github.com/kiku-jw/teply-krug/actions/workflows/pages.yml"><img alt="GitHub Pages" src="https://github.com/kiku-jw/teply-krug/actions/workflows/pages.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-17243A?style=flat-square"></a>
</p>

<p align="center">
  <a href="https://kiku-jw.github.io/teply-krug/">
    <img src="docs/media/welcome.png" alt="The Dostavay game welcome screen" width="100%">
  </a>
</p>

The game and its 360 hand-written prompts are in Russian. They are designed for
a friendly group with a shared Ukrainian context.

## How a session works

1. Add 2–12 names in turn order.
2. Choose a rough duration: 15 minutes, 30 minutes, or no time plan.
3. Share the game window so everyone sees the same screen.
4. On each turn, press **ВЫТЯНУТЬ** (“Draw”) and respond to the note.
5. After a complete round, the group decides whether to continue or finish.

There are no points, winners, or rankings. The goal is to enjoy the conversation
and learn something new about one another.

## How the question jar works

The first note uses the full jar animation. Later notes arrive faster, with
occasional changes in direction or extra sheets flying out. The prompt remains
ordinary HTML text, so it stays legible on a shared display and a phone.

The first question is always Bible-related. The deck then moves gradually from
light topics into personal stories, ministry, and group activities. Players do
not see categories or difficulty levels; they simply continue round by round.

The deck contains 360 explicitly written cards about people, friendship, the
Bible, ministry, and creative group activities. A prompt does not repeat until
the applicable part of the deck has been exhausted.

## The game screen

<p align="center">
  <img src="docs/media/game.png" alt="A game turn with a visible question and timer" width="100%">
</p>

The active screen keeps only the player name, note, optional timer, and
**ДАЛЬШЕ** (“Next”) button. If a prompt does not fit, a compact menu lets the
group draw another one, answer together, or request a topic. The session can end
after any note.

## The final note

<p align="center">
  <img src="docs/media/finish.png" alt="The closing screen with the final note and player names" width="100%">
</p>

Instead of a score summary, the game closes with one question for the whole
group. There is no final ranking.

## Designed for screen sharing

- Optional 45-, 75-, or 120-second timer that never advances the turn automatically.
- Paper and jar sounds while drawing, plus brief cues for a new turn and elapsed time.
- A full introduction for the first note and three quicker reveal patterns after it.
- 15- and 30-minute modes that suggest finishing only after a complete round.
- Independent controls for animation and sound.
- A browser-based editor for custom cards.
- The ability to hide any built-in card and restore it later.
- Automatic recovery of an active session after a page reload.
- Responsive layouts for a shared Zoom screen, laptop, or phone.

## Privacy and status

This is a fully static application with no accounts, server, or analytics.
Answers are never entered or stored. Names, settings, and custom cards remain
in the browser running the game.

This is an independent project and is not an official product of Jehovah's
Witnesses.

## Run locally

Requirements: Node.js 22.

```bash
npm install
npm run dev
```

Run the complete pre-publication check:

```bash
npm run check
npm exec playwright install chromium
npm run test:e2e
```

The app uses Vite and TypeScript without a UI framework. Its Seedance video
assets are stored in the repository and do not call an external service during
play. A push to `main` verifies the project and publishes `dist/` through
GitHub Actions.

## Work with the deck

Built-in cards live in [`src/content/cards.ts`](src/content/cards.ts). Every
“stage × category” pair contains exactly 24 explicitly written questions. The
Russian-language [`editorial guide`](docs/editorial-guide.md) records the
spoken-language, Ukrainian-context, and Zoom-compatibility rules used for the
localized deck. Custom cards are validated at the `localStorage` boundary and
are never sent to the repository.

## License

The code and original card text are available under the [MIT License](LICENSE).
