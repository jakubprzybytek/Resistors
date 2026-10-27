# Development

This app is developed and delivered per the [continuous-delivery standard](https://github.com/jakubprzybytek/agent-playbook/blob/main/skills/continuous-delivery/STANDARD.md): develop on `dev`, every push to `main` goes through `int` to `prod`. This file holds what is specific to this app.

## Stages

| Stage | URL | Notes |
|---|---|---|
| `dev` | https://dev.resistors.albedoonline.com (or http://localhost:5173 with `npm run dev`) | yours to try things out |
| `int` | https://int.resistors.albedoonline.com | the pipeline's E2E tests |
| `prod` | https://resistors.albedoonline.com | live |

The app is a static site (`sst.aws.StaticSite`): no API, no data, no login.

## Run locally

```sh
npm run dev                       # Vite dev server on http://localhost:5173 (the whole app runs in the browser)
npm run deploy -- --stage dev     # full deployment to dev (CloudFront, the domain)
npm start -- 660                  # the CLI version
```

## Tests

| Kind | Command |
|---|---|
| Type check, unit | `npm run typecheck`, `npm test` |
| E2E, local build | `npm run test:e2e` (builds and serves the app on port 4173) |
| E2E, a deployed stage | `npx sst shell --stage dev -- npm run test:e2e` |

## Delivery

`.github/workflows/continuous-delivery.yaml`, per the standard. Releases: tags `vM.N`, one per release, only going forward, starting at `v0.1`; shown in the footer. Rollback: run Continuous Delivery manually from the release tag ("Use workflow from"; `gh workflow run continuous-delivery.yaml --ref vM.N`).

Ask before pushing changes that touch data, resources holding data, access, or cost (the standard, section 5).

Dependencies: Dependabot per the [dependabot standard](https://github.com/jakubprzybytek/agent-playbook/blob/main/skills/dependabot/STANDARD.md); pull requests run `.github/workflows/pull-request-checks.yaml`.

## Deviations

- **No integration tests and no test user:** the app has no API and no login. The pipeline runs typecheck, unit and E2E tests.
- **`npm run dev` is the Vite dev server, not `sst dev`:** there are no Lambdas to run locally, so `sst dev` adds nothing.
