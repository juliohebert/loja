const axios = require('axios');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendResendEmail({ to, subject, html, from }) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY não configurada');
  const payload = {
    from: from || 'no-reply@loja.com',
    to,
    subject,
    html
  };
  return axios.post(RESEND_API_URL, payload, {
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
}

module.exports = sendResendEmail;
