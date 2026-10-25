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

The app is deployed as a static site using [SST](https://sst.dev) (`sst.config.ts`).

Deploy manually from your machine (requires AWS credentials configured locally):

```bash
npx sst deploy --stage <stage-name>
```

For local development against live AWS resources:

```bash
npm run sst:dev
```

### CI/CD

Pushes to `main` trigger [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which:

1. Installs dependencies
2. Runs unit tests (`npm test`) and e2e tests (`npm run test:e2e`)
3. Signs in to AWS through GitHub OIDC as the IAM role `GitHub-Resistors` (no access keys)
4. Deploys to the `int` stage (`npx sst deploy --stage int`)

GitHub needs the repository secret `AWS_ACCOUNT_ID` and the variable `AWS_REGION`.
The role and its permissions are described in [infra/github/README.md](infra/github/README.md).
