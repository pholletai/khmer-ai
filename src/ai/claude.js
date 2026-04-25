require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const {
  getUserMemory,
  saveUserMemory,
  getHistory,
  addMessage
} = require("../memory/memory");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function detectSimpleInfo(text = "", memory = {}) {
  const lower = String(text || "").toLowerCase();
  let interest = memory.interest || "";
  let budget = memory.budget || "";
  let name = memory.name || "";

  if (!interest) {
    if (lower.includes("bot") || lower.includes("ai") ||
        lower.includes("chatbot") || lower.includes("messenger")) {
      interest = "Khmer AI / Bot";
    }
  }
  if (!budget) {
    const budgetMatch = String(text).match(/\$?\d+/);
    if (budgetMatch) budget = budgetMatch[0];
  }
  return { name, interest, budget };
}

// ✅ buildSystemPrompt នៅខាងក្រៅ askAI
function buildSystemPrompt(userMemory = {}) {
  const stage = userMemory.stage || "warm";

  return `អ្នកជា Khmer AI Assistant សម្រាប់ Khmer AI Bot។
អ្នកជា sales assistant ដ៏ពូកែ — រួសរាយ ជំនួយ និងបិទការលក់ដោយឆ្លាត។

📦 PACKAGES & តម្លៃ:

🤖 Starter - $49/ខែ
• AI Chatbot ភាសាខ្មែរ
• Auto reply 24/7
• Facebook 1 Page
• Support 2 សប្តាហ៍
• Setup fee: $50 (មួយដង)

📦 Basic - $99/ខែ ⭐ Popular
• អស់ Starter +
• Telegram + Facebook
• Memory / context
• Support 1 ខែ
• Setup fee: $50 (មួយដង)

🚀 Pro - $199/ខែ
• អស់ Basic +
• Multi-platform
• Custom AI training
• Priority support 24/7
• Setup fee: $50 (មួយដង)

💳 PAYMENT FLOW:
STEP 1 — ភ្ញៀវជ្រើស package
STEP 2 — ប្រាប់ ABA payment info:
  • ABA: 012501440 (Phaly Phollet)
  • ACLEDA: 0975874565 (Phaly Phollet)
  • Amount: setup fee $50 + ខែទី 1
STEP 3 — ភ្ញៀវ screenshot + ឈ្មោះ + លេខទូរស័ព្ទ
STEP 4 — Team confirm + setup ក្នុង 24h
STEP 5 — Bot Live! 🎉

🎯 SALES RULES:
- ឆ្លើយខ្លី ច្បាស់ រួសរាយ
- បើ user សួរតម្លៃ → បង្ហាញ package ភ្លាម
- បើ user ជ្រើស package → ផ្ញើ payment info ភ្លាម
- បើ user ផ្ញើ screenshot → ឆ្លើយ "បានទទួលហើយ! Team នឹងទំនាក់ទំនងក្នុង 24h ✅"
- កុំឆ្លើយវែងពេក — 3-5 lines គ្រប់គ្រាន់

Stage បច្ចុប្បន្ន: ${stage}
ព័ត៌មាន user: ${JSON.stringify(userMemory)}`.trim();
}

// ✅ askAI function ស្អាត
async function askAI(senderId, messageText) {
  try {
    const userMemory = getUserMemory(senderId);
    const history = getHistory(senderId) || [];

    const simpleInfo = detectSimpleInfo(messageText, userMemory);
    saveUserMemory(senderId, simpleInfo);

    const systemPrompt = buildSystemPrompt(getUserMemory(senderId));

    const formattedHistory = history.map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content,
    }));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        ...formattedHistory,
        { role: "user", content: messageText }
      ],
    });

    const rawReply = response.content[0].text || "សូមអភ័យទោស មានបញ្ហាបច្ចេកទេស។";

    // Sales mode detection
    const lowerText = String(messageText || "").toLowerCase();
    let salesMode = "warm";

    if (
      lowerText.includes("price") || lowerText.includes("package") ||
      lowerText.includes("basic") || lowerText.includes("pro") ||
      lowerText.includes("starter") || lowerText.includes("តម្លៃ") ||
      lowerText.includes("កាក់") || lowerText.includes("how much")
    ) {
      salesMode = "close_now";
    } else if (
      lowerText.includes("facebook") || lowerText.includes("page") ||
      lowerText.includes("បញ្ហា") || lowerText.includes("issue")
    ) {
      salesMode = "hot";
    }

    // ✅ closingLine នៅខាងក្រៅ if block
    let closingLine = "";

    if (
      lowerText.includes("screenshot") ||
      lowerText.includes("បានទូទាត់") ||
      lowerText.includes("បង់ហើយ")
    ) {
      closingLine = "\n\n✅ បានទទួល screenshot ហើយ!\n👉 Team នឹងទំនាក់ទំនងក្នុង 24h\n📞 Telegram: @PholletAI";
    } else if (salesMode === "close_now") {
      closingLine = "\n\n💳 Payment Info:\n🏦 ABA: 012501440 (Phaly Phollet)\n🏦 ACLEDA: 0975874565\n\n👉 បញ្ជូន screenshot + ឈ្មោះ + លេខទូរស័ព្ទ!";
    } else if (salesMode === "hot") {
      closingLine = "\n\n📸 ផ្ញើ screenshot + detail មក\n✅ Team setup ក្នុង 24h! 🚀";
    } else {
      closingLine = "\n\n👉 ចង់ដឹង package មួយណា?\n💬 វាយ: Starter / Basic / Pro";
    }

    const reply = rawReply + closingLine;

    addMessage(senderId, "user", messageText);
    addMessage(senderId, "assistant", reply);

    return reply;

  } catch (error) {
    console.error("❌ Claude API Error:", error.message);
    if (error.response) console.error(error.response.data);
    return "សូមអភ័យទោស បច្ចេកទេសមានបញ្ហា សូមព្យាយាមម្តងទៀត។";
  }
}

module.exports = { askAI };