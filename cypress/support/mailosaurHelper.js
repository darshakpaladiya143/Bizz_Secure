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

// Request for the Two factor code

export function getTwoFactorCode(testEmail, retries = 30, delay = 5000) {
  const serverId = Cypress.env("mailosaurServerId");
  const apiKey = Cypress.env("mailosaurApiKey");

  function checkEmail(retryCount) {
    if (retryCount === 0) {
      throw new Error(`Two-factor code email not found for ${testEmail} after ${retries} retries`);
    }

    return cy
      .request({
        method: "GET",
        url: `https://mailosaur.com/api/messages?server=${serverId}`,
        headers: { 
          Authorization: `Basic ${btoa(apiKey + ":")}`,
          'Cache-Control': 'no-cache'
        },
        qs: { sentTo: testEmail },
        failOnStatusCode: false,
        timeout: 40000
      })
      .then((response) => {
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

        // Find the most recent "Two Factor code" message
        const twoFactorEmail = response.body.items
          .filter(email => email.subject.includes("Two Factor code"))
          .sort((a, b) => new Date(b.received) - new Date(a.received))[0];

        if (!twoFactorEmail) {
          cy.log(`❌ No two-factor email found (${retryCount - 1} retries left)`);
          cy.wait(delay);
          return checkEmail(retryCount - 1);
        }

        // Fetch full email details
        return cy.request({
          method: "GET",
          url: `https://mailosaur.com/api/messages/${twoFactorEmail.id}`,
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
        cy.log("✅ Full two-factor email details:", JSON.stringify(fullEmail, null, 2));

        // First try to get code from html.codes array
        if (fullEmail.html?.codes?.length > 0) {
          const verificationCode = fullEmail.html.codes[0].value;
          if (verificationCode && verificationCode.length === 6) {
            cy.log("✅ Found verification code in html.codes:", verificationCode);
            return cy.wrap(verificationCode);
          }
        }

        // Fallback to extracting from email body
        const codeFromBody = extractCodeFromBody(fullEmail.html?.body || fullEmail.text?.body);
        if (codeFromBody) {
          cy.log("✅ Found verification code in email body:", codeFromBody);
          return cy.wrap(codeFromBody);
        }

        throw new Error("Could not extract verification code from email");
      });
  }

  return checkEmail(retries);
}

// Function to extract code from email body
  function extractCodeFromBody(body) {
  if (!body) return null;
  
  // Pattern 1: "Your code is:644511" (from your example)
  const pattern1 = /Your code is:?\s*(\d{6})/i;
  // Pattern 2: "Verification code: 123456"
  const pattern2 = /Verification code:?\s*(\d{6})/i;
  // Pattern 3: "123456 is your verification code"
  const pattern3 = /(\d{6})\s*is your verification code/i;
  
  const match1 = body.match(pattern1);
  if (match1 && match1[1]) return match1[1];
  
  const match2 = body.match(pattern2);
  if (match2 && match2[1]) return match2[1];
  
  const match3 = body.match(pattern3);
  if (match3 && match3[1]) return match3[1];
  
  // Fallback to any 6-digit number
  const fallbackMatch = body.match(/\b\d{6}\b/);
  return fallbackMatch ? fallbackMatch[0] : null;
}