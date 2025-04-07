import { getConfirmationLink , getTwoFactorCode  } from "../support/mailosaurHelper";
import 'cypress-xpath';
import 'cypress-wait-until';

describe("Email Confirmation Test & New client account Approved Via System Power Admin", () => {
  const serverId = Cypress.env("mailosaurServerId");
  const testEmail = `test${Date.now()}@${serverId}.mailosaur.net`;

  it("Company/Client Should complete Signup , Confirm email and Get 2FA", () => {
    // Step 1: Sign up
    cy.visit("https://eaid.bizzsecure.com/", { timeout: 300000 });

    cy.xpath("//a[normalize-space()='Sign up']", { timeout: 80000 })
      .should("be.visible")
      .click();

    // Generate and store company name
    const companyName = `TestCompany${Date.now()}`;
    Cypress.env('companyName', companyName); // Save to env variable

    // Fill out form
    cy.get("#firstName").type("John");
    cy.get("#lastName").type("Doe");
    cy.get("#companyName").type(companyName); // Use stored Value
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
    cy.contains("Email Confirm Successfully", { timeout: 20000 })
        .should('be.visible');
    });

    // Step 3 : Get and Print the 2FA
    getTwoFactorCode(testEmail).then(code => {
    cy.log('Extracted two-factor code is:', code); 
    });

  });

  it("Approved new register company/client via system power admin", () => {
    const companyName = Cypress.env('companyName'); // Retrieve stored value
    cy.log(`Using stored company name: ${companyName}`);

    cy.visit("https://eaid.bizzsecure.com/sign-in", { timeout: 300000 });
    cy.xpath("//input[@id='email']").type("eaiddev.team@bizzsecure.com");
    cy.xpath("//input[@id='password']").type("uMNN2f?556C!");
    cy.contains('button', 'Sign in').click();
    cy.wait(4000);
    cy.contains('button', 'Verify Code').click();
    cy.wait(10000);

   // First, scroll the sidebar into view (adjust the scrollable container selector if needed)
    cy.get('.fuse-vertical-navigation-content')
      .scrollTo('bottom', { ensureScrollable: false, duration: 1000 });

   // Then, find and click the "System Configuration" menu item
    cy.xpath("//div[contains(@class, 'fuse-vertical-navigation-item-title')]/span[normalize-space()='System Configuration']")
      .should('exist')
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true }); // use force if needed

    // Then, find and click the "Manage Client" menu item
    cy.get('body').then(($body) => {
      if ($body.find("span:contains('Manage Client')").length > 0) {
        cy.contains('.fuse-vertical-navigation-item-title span', 'Manage Client')
          .scrollIntoView({ block: 'center', offset: { top: 100, left: 0 } }) // smooth scroll
          .should('exist') // only check if it exists
          .click({ force: true }); // force click in case of overlay
      } else {
        cy.log('Manage Client menu not found');
      }
     
    // Check user into the unapproved list 

    cy.contains('.mdc-tab__text-label', 'Unapproved')
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.wait(4000);

  // Interact with the search input field and type the company name
    cy.get('input[placeholder="Client Name"]')
      .should('be.visible')
      .clear()
      .type(companyName);
    cy.wait(4000);

  // Interact with first toggle only
    cy.xpath("//button[@role='switch']")
      .should('be.visible')
      .first()
      .scrollIntoView()
      .click({ force: true })
      .then(() => {

    cy.wait(5000);

  // Most robust solution combining multiple checks
    cy.get('mat-slide-toggle').first().should(($toggle) => {
    expect($toggle).to.have.attr('ng-reflect-model', 'true');
    expect($toggle.find('button')).to.have.attr('aria-checked', 'true');
      });


    // After approved new company account via power admin try to do login with new account.
   


      });
     });
    }); 
  });