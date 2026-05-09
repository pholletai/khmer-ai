/**
 * src/ai/claude.js — Khmer AI
 * Core AI module — calls Anthropic Claude API
 */

const Anthropic = require("@anthropic-ai/sdk");
const { getUserMemory, saveUserMemory } = require("../memory/memory");
const { buildSystemPrompt } = require("./SYSTEM_PROMPT");

// ✅ FIX: ប្រើ "client" ជាប់លាប់
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// =========================
// In-memory conversation history (per session)
// =========================
const conversationHistory = {};
const MAX_HISTORY = 20;

/**
 * Add message to in-memory history
 */
function addToHistory(userId, role, content) {
  if (!conversationHistory[userId]) {
    conversationHistory[userId] = [];
  }
  conversationHistory[userId].push({ role, content });

  if (conversationHistory[userId].length > MAX_HISTORY) {
    conversationHistory[userId] = conversationHistory[userId].slice(-MAX_HISTORY);
  }
}

/**
 * Get conversation history for user
 */
function getHistory(userId) {
  return conversationHistory[userId] || [];
}

/**
 * Clear conversation history for user
 */
function clearHistory(userId) {
  conversationHistory[userId] = [];
}

// =========================
// ✅ askAIWithImage — Vision/Image analysis with history support
// =========================
async function askAIWithImage(senderId, base64Image, mediaType = "image/jpeg", userCaption = null) {
  try {
    const userMemory = senderId ? getUserMemory(senderId) : {};
    const systemPrompt = buildSystemPrompt(userMemory);

    // Build image message content
    const contentBlocks = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Image,
        },
      },
      {
        type: "text",
        // ✅ ប្រើ caption របស់ user ប្រសិនបើមាន ឬ default Khmer prompt
        text: userCaption || "សូមពណ៌នា និងវិភាគរូបភាពនេះជាភាសាខ្មែរ។",
      },
    ];

    // ✅ Add image message to history (store as text description for history)
    addToHistory(senderId, "user", userCaption || "[ផ្ញើរូបភាព]");

    // Build messages: history before + current image message
    const previousMessages = getHistory(senderId).slice(0, -1); // exclude last (just added above)

    const messages = [
      ...previousMessages,
      {
        role: "user",
        content: contentBlocks,
      },
    ];

    console.log(`🖼️ Calling Claude Vision for user: ${senderId}`);

    // ✅ FIX: ប្រើ "client" មិនមែន "anthropic"
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const reply = response.content[0]?.text?.trim() || "";

    if (!reply) throw new Error("Empty response from Claude Vision");

    // Save reply to history
    addToHistory(senderId, "assistant", reply);

    if (senderId) {
      saveUserMemory(senderId, {
        lastMessage: "[image]",
        lastReply: reply,
        lastSeen: new Date().toISOString(),
      });
    }

    console.log(`✅ Claude Vision replied (${reply.length} chars)`);
    return reply;

  } catch (error) {
    console.error("❌ askAIWithImage error:", error.message);
    return "សូមអភ័យទោស! មានបញ្ហាក្នុងការវិភាគរូបភាព 🙏";
  }
} // ✅ FIX: closing brace បានបន្ថែម

// =========================
// Main askAI function
// =========================
async function askAI(userId, message) {
  try {
    const userMemory = userId ? getUserMemory(userId) : {};
    const systemPrompt = buildSystemPrompt(userMemory);

    addToHistory(userId, "user", message);
    const messages = getHistory(userId);

    console.log(`🅿️ Calling Claude API for user: ${userId}`);
    console.log(`📋 Messages in history: ${messages.length}`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: messages,
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!reply) throw new Error("Empty response from Claude");

    addToHistory(userId, "assistant", reply);

    if (userId) {
      saveUserMemory(userId, {
        lastMessage: message,
        lastReply: reply,
        lastSeen: new Date().toISOString(),
      });
    }

    console.log(`✅ Claude replied (${reply.length} chars)`);
    return reply;

  } catch (error) {
    console.error("❌ askAI error:", error?.message || error);

    if (error?.status === 401) throw new Error("Invalid ANTHROPIC_API_KEY — ពិនិត្យ .env ម្ដងទៀត");
    if (error?.status === 429) throw new Error("Rate limit exceeded — សូមរង់ចាំបន្តិច");
    if (error?.status === 529) throw new Error("Claude API overloaded — សូមលងម្ដងទៀត");
    if (error?.name === "AbortError") throw new Error("Request timeout — 30 វិនាទីផុត");

    throw error;
  }
}

// =========================
// ✅ FIX: Export ១ដង ជាមួយ functions ទាំងអស់
// =========================
module.exports = {
  askAI,
  askAIWithImage,
  addToHistory,
  getHistory,
  clearHistory,
};