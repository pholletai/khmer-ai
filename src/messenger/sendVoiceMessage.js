const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");

async function sendVoiceMessage(senderId, text, pageToken) {
  try {
    // 🔥 1. เรียก OpenAI TTS (หรือ ElevenLabs ก็ได้)
    const response = await axios({
      method: "POST",
      url: "https://api.openai.com/v1/audio/speech",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
      data: {
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: text,
      },
    });

    // 🔥 2. ตั้งชื่อไฟล์
    const filename = `tts-${Date.now()}.mp3`;
    const filePath = path.join(os.tmpdir(), filename);

    // 🔥 3. save file
    fs.writeFileSync(filePath, response.data);

    console.log("📁 Saved:", filePath);

    // 🔥 4. สร้าง URL
    const audioUrl = `${process.env.BASE_URL}/audio/${filename}`;

    console.log("🌍 URL:", audioUrl);

    // 🔥 5. ส่งไป Facebook
    await axios.post(
      `https://graph.facebook.com/v20.0/me/messages?access_token=${pageToken}`,
      {
        recipient: { id: senderId },
        message: {
          attachment: {
            type: "audio",
            payload: {
              url: audioUrl,
              is_reusable: true,
            },
          },
        },
      }
    );

    console.log("✅ Sent voice message");
  } catch (err) {
    console.error("❌ sendVoiceMessage error:", err.response?.data || err.message);
  }
}

module.exports = sendVoiceMessage;