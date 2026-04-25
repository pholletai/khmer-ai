const { readVoiceFromUrl } = require("../ai/readVoice");
const { callOpenAI } = require("../ai/openai");

async function handleAudio(audioUrl) {
  const audioText = await readVoiceFromUrl(audioUrl);
  return await callOpenAI(audioText);
}

module.exports = {
  handleAudio
};