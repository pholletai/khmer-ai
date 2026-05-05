/**
 * src/messenger/sendVoiceMessage.js — Khmer AI
 * Send audio buffer as a voice message via Facebook Messenger API
 */

const axios = require("axios");
const FormData = require("form-data");

/**
 * Send an audio buffer to a Messenger recipient
 * @param {string} pageId
 * @param {string} recipientId
 * @param {Buffer} audioBuffer  - mp3 audio data
 */
async function sendAudioMessage(pageId, recipientId, audioBuffer) {
  const pageToken = process.env[`PAGE_TOKEN_${pageId}`] || process.env.PAGE_ACCESS_TOKEN;

  if (!pageToken) {
    throw new Error(`No page token found for pageId: ${pageId}`);
  }

  const form = new FormData();
  form.append(
    "recipient",
    JSON.stringify({ id: recipientId })
  );
  form.append(
    "message",
    JSON.stringify({ attachment: { type: "audio", payload: { is_reusable: false } } })
  );
  form.append("filedata", audioBuffer, {
    filename: "voice.mp3",
    contentType: "audio/mpeg",
  });

  const response = await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`,
    form,
    { headers: form.getHeaders() }
  );

  console.log("✅ Audio message sent:", response.data.message_id);
  return response.data;
}

module.exports = { sendAudioMessage };
