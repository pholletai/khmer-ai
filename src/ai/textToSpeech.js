const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const os = require("os");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function textToSpeech(text) {
  try {
    const filePath = path.join(os.tmpdir(), `voice-${Date.now()}.mp3`);

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch (err) {
    console.error("❌ TTS error:", err.message);
    return null;
  }
}

module.exports = { textToSpeech };