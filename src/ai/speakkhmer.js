const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function speakkhmer(text) {
  const fileName = `tts-${Date.now()}.mp3`;
  const filePath = path.join(require("os").tmpdir(), fileName);

  const response = await axios({
    method: "post",
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
      speed: 0.75   // 🔥 ช้าลง
    },
  });

  fs.writeFileSync(filePath, response.data);

  return fileName;
}

module.exports = { speakkhmer };