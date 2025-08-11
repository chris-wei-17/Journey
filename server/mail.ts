// mail.ts
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const DOMAIN = process.env.MAILGUN_DOMAIN;
const API_KEY = process.env.MAILGUN_API_KEY;
const EU_REGION = process.env.MAILGUN_EU_REGION === 'true';

let client: any = null;

if (DOMAIN && API_KEY) {
  console.log('🔧 Setting up Mailgun with domain:', DOMAIN);
  console.log('🔧 API Key prefix:', API_KEY.substring(0, 8) + '...');
  console.log('🔧 EU Region:', EU_REGION);
  
  const mailgun = new Mailgun(formData);
  client = mailgun.client({
    username: 'api',
    key: API_KEY,
    url: EU_REGION ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
  });
} else {
  console.warn('⚠️ MAILGUN_DOMAIN and MAILGUN_API_KEY not set - email functionality will be disabled');
  if (!DOMAIN) console.warn('❌ Missing MAILGUN_DOMAIN');
  if (!API_KEY) console.warn('❌ Missing MAILGUN_API_KEY (should be Private API key starting with "key-")');
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

    console.log('📤 Sending email via Mailgun...');
    console.log('📧 From:', from);
    console.log('📧 To:', to);
    console.log('📧 Domain:', DOMAIN);

    const response = await client.messages.create(DOMAIN, messageData);

    console.log("✅ Email sent successfully:", {
      status: response.status,
      id: response.id,
      message: response.message
    });
  } catch (error: any) {
    console.error("❌ Mailgun API Error Details:");
    console.error("Status:", error.status || 'unknown');
    console.error("Message:", error.message || 'unknown');
    console.error("Details:", error.details || 'none');
    
    if (error.status === 401) {
      console.error("🚨 401 Unauthorized - Check:");
      console.error("   1. API Key is PRIVATE key (starts with 'key-')");
      console.error("   2. Domain is verified in Mailgun dashboard");
      console.error("   3. If EU account, set MAILGUN_EU_REGION=true");
      console.error("   4. No extra spaces in environment variables");
    }
    
    throw error;
  }
}