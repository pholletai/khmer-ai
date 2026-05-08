/**
 * src/handlers/handleAudio.js — Khmer AI
 */
const { askAI } = require("../ai/claude");
const { sendTextMessage } = require("../../sendTextMessage");
const FormData = require("form-data");
const fetch = require("node-fetch");

// ✅ FIX #5 — Timeout helper
const fetchWithTimeout = (url, options, ms = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

async function handleAudio(senderId, audioUrl, pageId) {
  // ✅ FIX #6 — Validate key first
  if (!process.env.GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY is not set");
    await sendTextMessage(pageId, senderId,
      "មានបញ្ហា configuration។ សូមទាក់ទងអ្នកគ្រប់គ្រង 🙏");
    return;
  }

  try {
    console.log("🎤 Processing voice from:", senderId);

    const audioRes = await fetchWithTimeout(audioUrl, {}, 10000);
    if (!audioRes.ok) throw new Error("Download failed: " + audioRes.status);

    // ✅ FIX #1 — arrayBuffer() instead of .buffer()
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    const formData = new FormData();
    formData.append("file", audioBuffer, {
      filename: "voice.m4a",
      contentType: "audio/m4a",           // ✅ FIX #4
      knownLength: audioBuffer.length,    // ✅ FIX #3
    });
    formData.append("model", "whisper-large-v3");
    formData.append("language", "km");

    const groqRes = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          ...formData.getHeaders(), // ✅ FIX #2 — proper ... not …
        },
        body: formData,
      },
      20000
    );

    const groqData = await groqRes.json();
    if (!groqRes.ok) throw new Error("Transcription failed");

    // ✅ FIX #7 — safe null guard
    const transcribedText =
      groqData.text && typeof groqData.text === "string"
        ? groqData.text.trim()
        : "";

    console.log("📝 Transcribed:", transcribedText);

    if (!transcribedText) {
      await sendTextMessage(pageId, senderId,
        "ខ្ញុំមិនអាចស្ដាប់សំឡេងបានច្បាស់ទេ។ សូមព្យាយាមម្ដងទៀត 🙏");
      return;
    }

    const voicePrompt = `[អ្នកប្រើបានផ្ញើ voice message: "${transcribedText}"]`;
    const reply = await askAI(senderId, voicePrompt);
    await sendTextMessage(pageId, senderId, `🎤 "${transcribedText}"\n\n${reply}`);

  } catch (error) {
    console.error("❌ handleAudio error:", error.message);
    try {
      await sendTextMessage(pageId, senderId,
        // ✅ FIX #8 — Khmer only, no Thai
        "សូមអភ័យទោស! មានបញ្ហាក្នុងការដំណើរការសំឡេង។ សូមវាយអក្សរជំនួសវិញ 🙏");
    } catch (e) {
      console.error("❌ sendTextMessage failed:", e.message);
    }
  }
}

module.exports = { handleAudio };