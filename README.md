# Тёплый круг

A host-controlled Russian conversation game for 6-12 young Jehovah's Witnesses meeting on Zoom. The host enters names, shares one screen, and guides the group through three stages of questions and light improvisation.

## Product boundaries

- 360 original Russian cards, balanced across three stages and five categories.
- Round-robin turns, soft timer, and five one-use social abilities.
- No scoring, accounts, backend, analytics, Zoom integration, or stored answers.
- Names, seen-card history, settings, and custom cards stay in the host browser.
- The project is independent and is not an official Jehovah's Witnesses product.

## Development

Requires Node.js 22.

```bash
npm install
npm run dev
npm run check
npm exec playwright install chromium
npm run test:e2e
```

The Vite base path is `/teply-krug/`. A push to `main` builds and publishes `dist/` through the official GitHub Pages actions.

## Content model

Built-in cards live in `src/content/cards.ts`. Each stage/category pair contains 24 explicitly authored prompts. Custom cards are validated at the browser boundary and are never committed or uploaded.

## License

Code and original card text are available under the MIT License.
