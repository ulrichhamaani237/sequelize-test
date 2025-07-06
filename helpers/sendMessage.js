const africastalking = require('africastalking');

const at = africastalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: 'sandbox', // ou votre username réel
});
console.log(process.env.AFRICASTALKING_API_KEY)

const sms = at.SMS;

async function sendSms(to, message) {
  try {
    const result = await sms.send({
      to: [to],
      message: message
    });
    return result;
  } catch (error) {
    console.error('SMS API error:', error.response?.data || error.message);

    throw error;
  }
}

module.exports = { sendSms };
