import { defineConfig } from "cypress";
import { writeFileSync } from "fs";

export default defineConfig({
  e2e: {
    env: {
      mailosaurApiKey: "PlUEvVn40WLuKTZigaOd8JIdczUbgH5J",
      mailosaurServerId: "lbb3fw8k",
    },
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.js",

    setupNodeEvents(on, config) {
      // Implement node event listeners here
      on("task", {
        saveEmail(email) {
          console.log("Email Body:", email);
          writeFileSync("email_debug.json", JSON.stringify(email, null, 2));
          return null;
        },
      });
    },
  },
});
