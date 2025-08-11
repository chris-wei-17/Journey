// mail.ts
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const DOMAIN = process.env.MAILGUN_DOMAIN;
const API_KEY = process.env.MAILGUN_API_KEY;

let client: any = null;

if (DOMAIN && API_KEY) {
  const mailgun = new Mailgun(formData);
  client = mailgun.client({
    username: 'api',
    key: API_KEY,
  });
} else {
  console.warn('⚠️ MAILGUN_DOMAIN and MAILGUN_API_KEY not set - email functionality will be disabled');
}

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
  if (!client || !DOMAIN) {
    console.log('📧 Email would be sent to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Content:', html);
    console.log('⚠️ Email not sent - Mailgun not configured');
    return; // Return successfully without sending
  }

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