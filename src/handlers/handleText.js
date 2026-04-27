const { askAI } = require("../ai/claude");

async function handleText(text, userId) {
  return await askAI(userId, text);
}

module.exports = { handleText };
