/**
 * src/handlers/handleImage.js — Khmer AI
 * Handle image/video attachments from Messenger
 */

const { askAI } = require("../ai/claude");
const { addHistory } = require("../memory/memory");
const { sendTextMessage } = require("../../sendTextMessage");
const { readImageFromUrl } = require("../ai/readImage");

/**
 * @param {string} senderId
 * @param {string} imageUrl
 * @param {string} type  - "image" | "video"
 * @param {string} pageId
 */
async function handleImage(senderId, imageUrl, type = "image", pageId) {
  let description = "";

  try {
    description = await readImageFromUrl(imageUrl);
  } catch (err) {
    console.error("❌ handleImage readImageFromUrl error:", err.message);
  }

  const userMessage = description
    ? `អ្នកប្រើបានផ្ញើ${type === "video" ? "វីដេអូ" : "រូបភាព"}។ ខ្លឹមសារ: ${description}`
    : `អ្នកប្រើបានផ្ញើ${type === "video" ? "វីដេអូ" : "រូបភាព"}មក។ សូមឆ្លើយជាភាសាខ្មែរ ហើយសួរបន្តថាចង់ឲ្យជួយអ្វី។`;

  addHistory(senderId, "user", userMessage);

  let reply;
  try {
    reply = await askAI(senderId, userMessage);
  } catch (err) {
    console.error("❌ handleImage askAI error:", err.message);
    reply = "បានទទួលរូបភាពហើយ! តើខ្ញុំអាចជួយអ្វីបន្ថែមទៀតទេ?";
  }

  addHistory(senderId, "assistant", reply);
  await sendTextMessage(pageId, senderId, reply);
}

module.exports = handleImage;
