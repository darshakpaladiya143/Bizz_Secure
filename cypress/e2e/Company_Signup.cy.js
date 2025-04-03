import { getConfirmationLink , getTwoFactorCode  } from "../support/mailosaurHelper";
import 'cypress-xpath';

describe("Email Confirmation Test", () => {
  const serverId = Cypress.env("mailosaurServerId");
  const testEmail = `test${Date.now()}@${serverId}.mailosaur.net`;

  it("should complete signup and confirm email", () => {
    // Step 1: Sign up
    cy.visit("https://eaid.bizzsecure.com/", { timeout: 300000 });

    cy.xpath("//a[normalize-space()='Sign up']", { timeout: 80000 })
      .should("be.visible")
      .click();

    // Fill out form
    cy.get("#firstName").type("John");
    cy.get("#lastName").type("Doe");
    cy.get("#companyName").type(`TestCompany${Date.now()}`);
    cy.get("#contactCountyCode").click();
    cy.get("#mat-option-0").contains("+1").click();
    cy.get("#contact").type("777-777-7777");
    cy.get("#email").type(testEmail);
    cy.get("#password").type("Secure@123");
    cy.get("#confirmPassword").type("Secure@123");
    cy.get('[type="checkbox"]').check();

    // Submit form
    cy.contains("button", "Create your free account").click();
    
    // Wait for confirmation page
    cy.url({ timeout: 30000 }).should("include", "confirmation-required");

    // Step 2: Get and use confirmation link
    getConfirmationLink(testEmail).then(link => {
      cy.log('Extracted confirmation link:', link);
      
      // Visit the confirmation link
      cy.visit(link, { timeout: 30000 });
      
      // Verify successful confirmation
      cy.contains("Email Confirm Successfully", { timeout: 15000 })
        .should('be.visible');
    });

    // Step 3 : Get and Print the 2FA
    getTwoFactorCode(testEmail).then(code => {
    cy.log('Extracted two-factor code:', code);
   
    });

  });
});
