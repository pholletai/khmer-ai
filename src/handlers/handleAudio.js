/**
 * src/handlers/handleAudio.js — Khmer AI
 * Handle audio/voice messages from Messenger
 */

const { askAI } = require("../ai/claude");
const { addHistory } = require("../memory/memory");
const { sendTextMessage } = require("../../sendTextMessage");
const { readVoiceFromUrl } = require("../ai/readVoiceFromUrl");

/**
 * @param {string} senderId
 * @param {string} audioUrl
 * @param {string} pageId
 */
async function handleAudio(senderId, audioUrl, pageId) {
  let transcribed = "";

  try {
    transcribed = await readVoiceFromUrl(audioUrl);
  } catch (err) {
    console.error("❌ handleAudio readVoiceFromUrl error:", err.message);
  }

  const userMessage = transcribed
    ? transcribed
    : "អ្នកប្រើបានផ្ញើសំឡេងមក។ សូមឆ្លើយជាភាសាខ្មែរ ហើយសួរបន្តថាចង់ឲ្យជួយអ្វី។";

  addHistory(senderId, "user", userMessage);

  let reply;
  try {
    reply = await askAI(senderId, userMessage);
  } catch (err) {
    console.error("❌ handleAudio askAI error:", err.message);
    reply = "បានទទួលសំឡេងហើយ! សូមទោស ខ្ញុំពិបាកស្ដាប់សំឡេងនៅឡើយ។ សូមវាយអក្សរជំនួសវិញ។";
  }

  addHistory(senderId, "assistant", reply);
  await sendTextMessage(pageId, senderId, reply);
}

module.exports = handleAudio;
