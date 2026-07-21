# Project Guidance

- Product language is Russian; code, comments, commits, and technical docs are English.
- Keep the app static and host-controlled. Do not add accounts, networking, analytics, or answer storage.
- Treat the question deck as editorial product content: natural spoken wording matters more than clever generation.
- Use native browser APIs and small typed modules before adding dependencies.
- Never use TypeScript assertions (`as`). Validate data at runtime boundaries.
- Run `npm run check` and `npm run test:e2e` before publication.
