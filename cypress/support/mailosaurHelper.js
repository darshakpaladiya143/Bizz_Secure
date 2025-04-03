export function getConfirmationLink(testEmail, retries = 30, delay = 5000) {
  const serverId = Cypress.env("mailosaurServerId");
  const apiKey = Cypress.env("mailosaurApiKey");

  function checkEmail(retryCount) {
    if (retryCount === 0) {
      throw new Error(`Confirmation email not found for ${testEmail} after ${retries} retries`);
    }

    // First, search for the email in the inbox
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

        // Find the most recent "Confirm Email" message
        const confirmationEmail = response.body.items
          .filter(email => email.subject.includes("Confirm Email"))
          .sort((a, b) => new Date(b.received) - new Date(a.received))[0];

        if (!confirmationEmail) {
          cy.log(`❌ No confirmation email found (${retryCount - 1} retries left)`);
          cy.wait(delay);
          return checkEmail(retryCount - 1);
        }

        // Now fetch the full email details using the message ID
        return cy.request({
          method: "GET",
          url: `https://mailosaur.com/api/messages/${confirmationEmail.id}`,
          headers: { 
            Authorization: `Basic ${btoa(apiKey + ":")}`,
            'Cache-Control': 'no-cache'
          },
          failOnStatusCode: false,
          timeout: 40000
        });
      })
      .then((emailResponse) => {
        if (emailResponse.status !== 200) {
          throw new Error(`Failed to fetch email details: ${emailResponse.status}`);
        }

        const fullEmail = emailResponse.body;
        cy.log("✅ Full email details:", JSON.stringify(fullEmail, null, 2));

        // Try to get link from HTML links first
        if (fullEmail.html && fullEmail.html.links && fullEmail.html.links.length > 0) {
          const confirmationLink = fullEmail.html.links[0].href;
          cy.log("✅ Found link in email HTML links:", confirmationLink);
          return cy.wrap(decodeURIComponent(confirmationLink));
        }

        // If no links in HTML, try to extract from body
        const linkFromBody = extractLinkFromBody(fullEmail.text?.body || fullEmail.html?.body);
        if (linkFromBody) {
          cy.log("✅ Found link in email body:", linkFromBody);
          return cy.wrap(decodeURIComponent(linkFromBody));
        }

        // If still not found, try to extract from text
        const textLink = extractLinkFromText(fullEmail.text?.body);
        if (textLink) {
          cy.log("✅ Found link in plain text:", textLink);
          return cy.wrap(decodeURIComponent(textLink));
        }

        throw new Error("Confirmation link not found in email content");
      });
  }

  return checkEmail(retries);
}

// Function to extract the link using regex from HTML
function extractLinkFromBody(body) {
  if (!body) return null;
  const match = body.match(/href="(https:\/\/[^"]+)"/);
  return match ? match[1] : null;
}

// Function to extract the link from plain text
function extractLinkFromText(text) {
  if (!text) return null;
  const match = text.match(/(https:\/\/[^\s]+)/);
  return match ? match[0] : null;
}