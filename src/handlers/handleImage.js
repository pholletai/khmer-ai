/**
 * src/handlers/handleImage.js — Khmer AI
 * Image analysis using Claude Vision API (Anthropic)
 * No OpenAI needed!
 */

const Anthropic = require("@anthropic-ai/sdk");
const { sendTextMessage } = require("../../sendTextMessage");
const { addToHistory } = require("../ai/claude");
const fetch = require("node-fetch");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Handle image message from user
 * @param {string} senderId
 * @param {string} imageUrl - URL of the image
 * @param {string} type - "image" | "video"
 * @param {string} pageId
 */
async function handleImage(senderId, imageUrl, type = "image", pageId) {
  try {
    console.log("🖼️ Processing image from:", senderId);
    console.log("🔗 Image URL:", imageUrl);

    // Step 1: Download image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to download image: ${imgRes.status}`);
    }

    const imageBuffer = await imgRes.buffer();
    const base64Image = imageBuffer.toString("base64");

    // Detect content type
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";

    // Step 2: Send to Claude Vision
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: `អ្នកគឺជា Khmer AI Assistant។ 
វិភាគរូបភាពដែលអ្នកប្រើផ្ញើ ហើយឆ្លើយជាភាសាខ្មែរ ដោយ:
- ពិពណ៌នាអ្វីដែលឃើញ
- ឆ្លើយសំណួររបស់អ្នកប្រើ (ប្រសិនបើមាន)
- ផ្ដល់ព័ត៌មានដែលមានប្រយោជន៍
ឆ្លើយខ្លី ច្បាស់ ជាភាសាខ្មែរ។`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: contentType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "សូមវិភាគរូបភាពនេះ ហើយប្រាប់ខ្ញុំថាឃើញអ្វី?",
            },
          ],
        },
      ],
    });

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    console.log("✅ Claude Vision reply:", reply.substring(0, 100) + "...");

    // Save to history
    addToHistory(senderId, "user", "[ផ្ញើរូបភាព]");
    addToHistory(senderId, "assistant", reply);

    // Step 3: Send reply
    await sendTextMessage(pageId, senderId, `🖼️ ${reply}`);

  } catch (error) {
    console.error("❌ handleImage error:", error.message);

    try {
      await sendTextMessage(
        pageId,
        senderId,
        "ขออภัยครับ មានបញ្ហាក្នុងការវិភាគរូបភាព។ សូមព្យាយាមម្ដងទៀត 🙏"
      );
    } catch (sendErr) {
      console.error("❌ sendTextMessage failed:", sendErr.message);
    }
  }
}

module.exports = { handleImage };