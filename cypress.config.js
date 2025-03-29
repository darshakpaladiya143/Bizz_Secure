const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {

    env: {
      mailosaurApiKey: "PlUEvVn40WLuKTZigaOd8JIdczUbgH5J",
      mailosaurServerId: "lbb3fw8k"
    },
    specPattern	: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: "cypress/support/e2e.js",


    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
