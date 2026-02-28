import twilio from 'twilio';

async function getTwilioCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) throw new Error('Twilio connector environment not available');

  const data = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    { headers: { 'Accept': 'application/json', 'X-Replit-Token': xReplitToken } }
  ).then(r => r.json());

  const settings = data.items?.[0]?.settings;
  if (!settings?.account_sid) throw new Error('Twilio not connected');

  return {
    accountSid: settings.account_sid,
    apiKey: settings.api_key,
    apiKeySecret: settings.api_key_secret,
    phoneNumber: settings.phone_number,
  };
}

export async function sendOTPSMS({ to, otp, type }) {
  const { accountSid, apiKey, apiKeySecret, phoneNumber } = await getTwilioCredentials();
  const client = twilio(apiKey, apiKeySecret, { accountSid });
  const message = type === 'signup'
    ? `Your Stones & Spices account verification OTP is: ${otp}. Valid for 10 minutes.`
    : `Your Stones & Spices password reset OTP is: ${otp}. Valid for 10 minutes.`;
  await client.messages.create({ body: message, from: phoneNumber, to });
}
