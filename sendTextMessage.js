const axios = require("axios");
const { getPageToken } = require("./database.js");

async function sendTextMessage(pageId, recipientId, text) {
  try {
    const pageAccessToken = getPageToken(pageId);

    if (!pageAccessToken) {
      throw new Error(`No page access token found for pageId: ${pageId}`);
    }

    if (!recipientId) {
      throw new Error("recipientId is missing");
    }

    const finalText = String(text || "").trim();

    if (!finalText) {
      throw new Error("Message text is empty");
    }

    await axios.post(
      "https://graph.facebook.com/v19.0/me/messages",
      {
        recipient: { id: recipientId },
        message: { text: finalText },
      },
      {
        params: {
          access_token: pageAccessToken,
        },
        timeout: 30000,
      }
    );

    console.log("✅ Message sent");
    console.log("📄 Page ID:", pageId);
    console.log("👤 Recipient ID:", recipientId);
    console.log("💬 Text:", finalText);
  } catch (error) {
    console.error(
      "❌ sendTextMessage error:",
      error.response?.data || error.message
    );
  }
}

module.exports = { sendTextMessage };