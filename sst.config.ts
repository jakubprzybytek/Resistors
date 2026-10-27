/// <reference path="./.sst/platform/config.d.ts" />

// Stages per agent-playbook/continuous-delivery: dev (yours), int (the pipeline's tests), prod (live).
const ROOT_DOMAIN = "resistors.albedoonline.com";

export default $config({
  app(input) {
    return {
      name: "resistor-network",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: input?.stage === "prod",
      home: "aws"
    };
  },
  async run() {
    const domain = $app.stage === "prod" ? ROOT_DOMAIN : `${$app.stage}.${ROOT_DOMAIN}`;
    const site = new sst.aws.StaticSite("ResistorApp", {
      build: {
        command: "npm run build",
        output: "dist"
      },
      domain,
      environment: {
        // The release shown in the footer: the tag (v0.1, …) from the pipeline, "local" otherwise.
        VITE_APP_VERSION: process.env.APP_VERSION ?? "local"
      }
    });
    return { site: site.url };
  }
});
