const africastalking = require('africastalking');

const at = africastalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: 'sandbox', // ou votre username réel
});

const sms = at.SMS;

async function sendSms(to, message) {
  try {
    const result = await sms.send({
      to: [to],
      message: message
    });
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = { sendSms };
