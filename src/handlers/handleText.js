const { callOpenAI } = require("../ai/openai");
const { buildSystemPrompt } = require("../ai/SYSTEM_PROMPT");
const { getMemory, saveMemory } = require("../memory/memory");

async function handleText(text, userId) {
  // ✅ Load memory របស់ user
  const userMemory = userId ? await getMemory(userId) : {};

  // ✅ Build system prompt ជាមួយ memory
  const systemPrompt = buildSystemPrompt(userMemory);

  // ✅ Call OpenAI ជាមួយ system prompt
  const reply = await callOpenAI(text, systemPrompt);

  // ✅ Save memory ក្រោយ reply (optional — ប្រសិនបើ callOpenAI return updated memory)
  if (userId && reply) {
    const updatedMemory = {
      ...userMemory,
      lastMessage: text,
      lastReply: reply,
    };
    await saveMemory(userId, updatedMemory);
  }

  return reply;
}

module.exports = {
  handleText
};