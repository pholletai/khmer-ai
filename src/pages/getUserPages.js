/**
 * src/pages/getUserPages.js — Khmer AI
 * Fetch all Facebook Pages managed by the authenticated user
 */

const axios = require("axios");

/**
 * Get list of Facebook Pages for a user access token
 * @param {string} userAccessToken
 * @returns {Promise<Array>} array of page objects { id, name, access_token }
 */
async function getUserPages(userAccessToken) {
  try {
    const response = await axios.get("https://graph.facebook.com/v19.0/me/accounts", {
      params: {
        access_token: userAccessToken,
        fields: "id,name,access_token,category",
      },
    });

    const pages = response.data.data || [];
    console.log(`✅ Found ${pages.length} page(s)`);
    return pages;
  } catch (err) {
    console.error("❌ getUserPages error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { getUserPages };
