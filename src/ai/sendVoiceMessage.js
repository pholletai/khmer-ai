const axios = require("axios");

async function sendTextMessage(pageId, recipientId, text) {
  try {
    const pageAccessToken = process.env.PAGE_ACCESS_TOKEN;

    if (!pageAccessToken) {
      throw new Error("PAGE_ACCESS_TOKEN missing");
    }

    await axios.post(
      "https://graph.facebook.com/v19.0/me/messages",
      {
        recipient: { id: recipientId },
        message: { text },
      },
      {
        params: {
          access_token: pageAccessToken,
        },
      }
    );

    console.log("✅ Message sent:", text);
  } catch (error) {
    console.error(
      "❌ sendTextMessage error:",
      error.response?.data || error.message
    );
  }
}

module.exports = { sendTextMessage };