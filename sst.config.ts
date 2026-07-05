/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "resistor-network",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      home: "aws"
    };
  },
  async run() {
    new sst.aws.StaticSite("ResistorApp", {
      build: {
        command: "npm run build",
        output: "dist"
      },
      domain: "resistors.albedoonline.com"
    });
  }
});
