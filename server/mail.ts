// mail.ts
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const DOMAIN = process.env.MAILGUN_DOMAIN!;
const API_KEY = process.env.MAILGUN_API_KEY!;

if (!DOMAIN || !API_KEY) {
  throw new Error("MAILGUN_DOMAIN and MAILGUN_API_KEY must be set in env");
}

const mailgun = new Mailgun(formData);
const client = mailgun.client({
  username: 'api',
  key: API_KEY,
});

export async function sendEmail({
  to,
  subject,
  html,
  from = `JourneyApp <noreply@${DOMAIN}>`,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<void> {
  try {
    const messageData = {
      from,
      to,
      subject,
      html,
    };

    const response = await client.messages.create(DOMAIN, messageData);

    if (response.status !== 200) {
      console.warn("Unexpected Mailgun response:", response);
      throw new Error("Email send failed");
    }

    console.log("✅ Email sent:", response);
  } catch (error) {
    console.error("❌ Failed to send email via Mailgun:", error);
    throw error;
  }
}