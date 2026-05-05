/**
 * src/pages/connectPage.js — Khmer AI
 * Subscribe a Facebook Page to the app webhook
 */

const axios = require("axios");

/**
 * Subscribe a page to the app for messaging webhooks
 * @param {string} pageId
 * @param {string} pageAccessToken
 * @returns {Promise<boolean>}
 */
async function connectPage(pageId, pageAccessToken) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
      {
        subscribed_fields: [
          "messages",
          "messaging_postbacks",
          "messaging_optins",
          "message_deliveries",
          "message_reads",
        ],
      },
      { params: { access_token: pageAccessToken } }
    );

    const success = response.data?.success === true;
    if (success) {
      console.log(`✅ Page ${pageId} subscribed to webhook`);
    }
    return success;
  } catch (err) {
    console.error("❌ connectPage error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { connectPage };
