import Mailosaur from "mailosaur";

const apiKey = Cypress.env("mailosaurApiKey"); // Fetch API Key
const serverId = Cypress.env("mailosaurServerId"); // Fetch Server ID

const mailosaur = new Mailosaur(apiKey); // Initialize Mailosaur with API Key

export async function getVerificationLink(email) {
  const email_1 = await mailosaur.messages
    .get(serverId, { sentTo: email });
  expect(email_1.subject).to.include("Verify Your Account"); // Adjust subject if needed
  return email_1.html.links[0].href;
}
