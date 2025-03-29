import { getVerificationLink } from "../support/mailosaurHelper";
import 'cypress-xpath';

describe("Signup & Email Verification", () => {
  const serverId = Cypress.env("mailosaurServerId");
  const testEmail = `test${Date.now()}@${serverId}.mailosaur.net`;


  it("Sign up with a dynamic email", () => {
    cy.visit("https://eaid.bizzsecure.com/", {timeout: 12000});
    
    // Check if the element is visible and click on it
    cy.xpath("//a[normalize-space()='Sign up']", { timeout: 60000 })
      .should('be.visible') // Assert visibility
      .click() // Click the element

    // Fill in sign-up form
    cy.get("#firstName").type("John");
    cy.get("#lastName").type("Doe");
    cy.get("#companyName").type("BizzSecure Inc.");

    // Handle Country Code Dropdown
    cy.get('#contactCountyCode').click() // Open the dropdown

    cy.get('#mat-option-0') // Select option from dropdown
      .contains('+1')
      .click()

    cy.get('#contact').type('777-777-7777')
    cy.get("#email").type(testEmail);
    cy.log(testEmail);

    cy.get("#password").type("Secure@123");
    cy.get("#confirmPassword").type("Secure@123");
    // Check Compliance Checkbox
    cy.get('[type="checkbox"]').check() // Ensure checkbox is checked
    cy.contains('button', 'Create your free account').click()
  });

  it("Verify email via Mailosaur", () => {

    cy.log("Mailosaur API Key:", Cypress.env("mailosaurApiKey")); // Debug Log
    cy.log("Mailosaur Server ID:", Cypress.env("mailosaurServerId")); // Debug Log
    getVerificationLink(testEmail).then((verificationLink) => {
      cy.visit(verificationLink);
      cy.contains("Email verified").should("be.visible");
    });
  });
});
