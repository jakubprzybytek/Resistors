# GitHub Actions deploy role

This repo deploys to AWS following the [aws-github-deploy standard](https://github.com/jakubprzybytek/agent-playbook/blob/main/skills/aws-github-deploy/STANDARD.md).

| | |
|---|---|
| Role | `GitHub-Resistors` |
| Policies | `SST-Deployment` (shared), `Resistors-Deployment` (this repo, [deploy-policy.json](deploy-policy.json)) |
| SST app name / resource prefix | `resistor-network` |
| Region | `eu-west-1` (certificate in `us-east-1` for CloudFront) |
| Workflows that deploy | `.github/workflows/deploy.yml` (stage `int`) |
| GitHub | secret `AWS_ACCOUNT_ID`, variable `AWS_REGION` |

`deploy-policy.json` has `ACCOUNT_ID` in place of the account number. The rendered policy and the trust policy are in `private/` (gitignored).

## What the project policy covers

The app is a single SST `StaticSite` (`resistors.albedoonline.com`): no Lambda functions or IAM roles.

- `Identity`: `sts:GetCallerIdentity`.
- `SstState`: SST parameters under `/sst/*`.
- `Buckets`: S3 on the site bucket (`resistor-network-*`).
- `Edge`: CloudFront (distribution, function, KeyValueStore), ACM certificate and Route 53 records. Account-wide; these services can't be scoped usefully.

## Deviations from the standard

- None.

## Changing the role or policy

From the repo root, with admin credentials (`aws login`):

```sh
~/.claude/skills/aws-github-deploy/scripts/setup-role.sh Resistors
```

The script is safe to re-run: it renders the documents, publishes a new policy version if the file changed, updates the trust policy and tags, and sets the GitHub secret and variable.
