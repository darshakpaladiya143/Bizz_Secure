export function getConfirmationLink(testEmail, retries = 30, delay = 5000) {
  const serverId = Cypress.env("mailosaurServerId");
  const apiKey = Cypress.env("mailosaurApiKey");

  function checkEmail(retryCount) {
    if (retryCount === 0) {
      throw new Error(`Confirmation email not found for ${testEmail} after ${retries} retries`);
    }

    return cy
      .request({
        method: "GET",
        url: `https://mailosaur.com/api/messages?server=${serverId}`,
        headers: { 
          Authorization: `Basic ${btoa(apiKey + ":")}`,
          'Cache-Control': 'no-cache'
        },
        qs: {
          sentTo: testEmail
        },
        failOnStatusCode: false,
        timeout: 40000
      })
      .then((response) => {
        cy.log("📨 Mailosaur API Response:", response);
        

        if (response.status !== 200) {
          cy.log(`❌ API error - Status: ${response.status}`);
          cy.wait(delay);
          return checkEmail(retryCount - 1);
        }

        if (!response.body.items || response.body.items.length === 0) {
          cy.log(`❌ No emails found (${retryCount - 1} retries left)`);
          cy.wait(delay);
          return checkEmail(retryCount - 1);
        }

        cy.log("✅ Email received:", JSON.stringify(response.body.items, null, 2));

        // Extract the email with subject 'Confirm Email'
        const confirmationEmail = response.body.items
          .filter(email => email.subject.includes("Confirm Email"))
          .sort((a, b) => new Date(b.received) - new Date(a.received))[0];

        if (!confirmationEmail) {
          cy.log(`❌ No confirmation email found (${retryCount - 1} retries left)`);
          cy.wait(delay);
          return checkEmail(retryCount - 1);
        }

        // 🔹 Save email content to debug
        cy.task("saveEmail", confirmationEmail);

        // 🔹 Extract link from email body
        const confirmationLink = confirmationEmail.html?.links?.[0]?.href || extractLinkFromBody(confirmationEmail.html?.body);

        if (!confirmationLink) {
          cy.log('❌ No confirmation link found in email body:', JSON.stringify(confirmationEmail, null, 2));
          throw new Error("Confirmation link not found in email body");
        }

        cy.log("✅ Successfully extracted confirmation link:", confirmationLink);
        return cy.wrap(decodeURIComponent(confirmationLink));
      });
  }

  return checkEmail(retries);
}

// Function to extract the link using regex
function extractLinkFromBody(body) {
  if (!body) return null;
  const match = body.match(/href="(https:\/\/[^"]+)"/);
  return match ? match[1] : null;
}
