it("Debug Mailosaur API", () => {
    const apiKey = Cypress.env("mailosaurApiKey");
    const serverId = Cypress.env("mailosaurServerId");
  
    cy.request({
      method: "GET",
      url: `https://mailosaur.com/api/servers/${serverId}`,
      headers: { Authorization: `Basic ${btoa(apiKey + ":")}` }
    }).then((response) => {
      cy.log(JSON.stringify(response.body));
      expect(response.status).to.eq(200);
    });
  });
  