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
3. Authenticates to AWS via OIDC (`aws-actions/configure-aws-credentials@v6`)
4. Deploys to the `int` stage (`npx sst deploy --stage int`)

The workflow requires the following repository/environment variables to be set in
GitHub for the AWS OIDC step to succeed:

- `AWS_ROLE_ARN` — IAM role ARN to assume
- `AWS_REGION` — target AWS region
