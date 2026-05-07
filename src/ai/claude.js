/**
 * src/ai/claude.js — Khmer AI
 * Core AI module — calls Anthropic Claude API
 */

const Anthropic = require("@anthropic-ai/sdk");
const { getUserMemory, saveUserMemory } = require("../memory/memory");
const { buildSystemPrompt } = require("./SYSTEM_PROMPT");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ========================= 
// In-memory conversation history (per session)
// =========================
const conversationHistory = {};

const MAX_HISTORY = 20; // max messages per user

/**
 * Add message to in-memory history
 * @param {string} userId
 * @param {string} role - "user" | "assistant"
 * @param {string} content
 */
function addToHistory(userId, role, content) {
  if (!conversationHistory[userId]) {
    conversationHistory[userId] = [];
  }

  conversationHistory[userId].push({ role, content });

  // Keep only last MAX_HISTORY messages
  if (conversationHistory[userId].length > MAX_HISTORY) {
    conversationHistory[userId] = conversationHistory[userId].slice(-MAX_HISTORY);
  }
}

/**
 * Get conversation history for user
 * @param {string} userId
 * @returns {Array}
 */
function getHistory(userId) {
  return conversationHistory[userId] || [];
}

/**
 * Clear conversation history for user
 * @param {string} userId
 */
function clearHistory(userId) {
  conversationHistory[userId] = [];
}

// =========================
// Main askAI function
// =========================

/**
 * Ask Claude AI
 * @param {string} userId - sender ID
 * @param {string} message - user message or pre-built prompt
 * @returns {Promise<string>} - AI reply
 */
async function askAI(userId, message) {
  try {
    // Load user memory
    const userMemory = userId ? getUserMemory(userId) : {};

    // Build system prompt with user memory
    const systemPrompt = buildSystemPrompt(userMemory);

    // Add user message to history
    addToHistory(userId, "user", message);

    // Get full conversation history
    const messages = getHistory(userId);

    console.log(`🤖 Calling Claude API for user: ${userId}`);
    console.log(`📝 Messages in history: ${messages.length}`);

    // Call Anthropic Claude API
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",

      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    // Extract reply text
    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!reply) {
      throw new Error("Empty response from Claude");
    }

    // Add assistant reply to history
    addToHistory(userId, "assistant", reply);

    // Update user memory with last interaction
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

    // Handle specific Anthropic errors
    if (error?.status === 401) {
      throw new Error("Invalid ANTHROPIC_API_KEY — ពិនិត្យ .env ម្ដងទៀត");
    }

    if (error?.status === 429) {
      throw new Error("Rate limit exceeded — សូមរង់ចាំបន្តិច");
    }

    if (error?.status === 529) {
      throw new Error("Claude API overloaded — សូមលងម្ដងទៀត");
    }

    if (error?.name === "AbortError") {
      throw new Error("Request timeout — 30 វិនាទីផុត");
    }

    throw error;
  }
}

// =========================
// Exports
// =========================
module.exports = {
  askAI,
  addToHistory,
  getHistory,
  clearHistory,
};
