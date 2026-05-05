// src/server/buildPrompt.js (CommonJS)

/**
 * สร้าง prompt สำหรับตอบแชทลูกค้า (Khmer / Thai / English)
 * - ตอบภาษาเดียวกับลูกค้า
 * - สุภาพ สั้น ชัด
 * - ถ้าไม่ชัดเจน ถาม 1 คำถามสั้น ๆ
 */

function buildPrompt({
  customerText,
  channelHint = "facebook",
  brandHint = "Khmer-AI",
}) {
  const text = String(customerText || "").trim();

  const system =
    "You are " + brandHint + ", an assistant for replying to customers on social media.\n" +
    "Rules:\n" +
    "- Reply in the SAME language as the customer message (Khmer/Thai/English).\n" +
    "- Be polite, short, clear, and helpful.\n" +
    "- If the customer message is unclear, ask ONE short question.\n" +
    "- If it is a support issue: confirm you're checking and give the next step.\n" +
    "- Do NOT mention internal tools, APIs, webhooks, tokens, or that you are an AI.\n" +
    "\n" +
    "Channel: " + channelHint;

  return [
    { role: "system", content: system },
    { role: "user", content: text || "(empty message)" },
  ];
}

module.exports = { buildPrompt };