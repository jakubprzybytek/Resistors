# Resistor Network Calculator

Find a combination of resistors (series/parallel) from a set of available values that
gets as close as possible to a target resistance. Available as a CLI script and a
React web app.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm (comes with Node.js)

## Local setup

Clone the repository and install dependencies:

```bash
npm install
```

## Running locally

Start the Vite dev server:

```bash
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`) in your browser.

To run the CLI version instead:

```bash
npm start -- 660
```

(the argument is the target resistance in ohms; defaults to `660` if omitted).

To build and preview the production bundle:

```bash
npm run build
npm run preview
```

## Running tests

Unit tests (Vitest):

```bash
npm test          # run once
npm run test:watch # watch mode
```

End-to-end tests (Playwright). This builds/serves the app automatically via the
configured `webServer`:

```bash
npx playwright install --with-deps   # first time only, installs browsers
npm run test:e2e
```

## Deploying to AWS

The app is a static site deployed with [SST](https://sst.dev) (`sst.config.ts`) to the stages `dev`, `int` and
`prod` (https://resistors.albedoonline.com). Every push to `main` goes through
[Continuous Delivery](.github/workflows/continuous-delivery.yaml): typecheck and unit tests, deploy `int`, E2E
tests against it, tag the next release `vM.N`, deploy `prod` from the tag.

Stages, commands, delivery and rollback: [docs/development.md](docs/development.md).
