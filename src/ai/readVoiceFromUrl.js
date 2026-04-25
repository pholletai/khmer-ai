const axios = require("axios");
const FormData = require("form-data");

function getExtensionFromContentType(contentType = "") {
  const type = contentType.toLowerCase();

  if (type.includes("mpeg")) return "mp3";
  if (type.includes("mp3")) return "mp3";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("m4a")) return "m4a";
  if (type.includes("aac")) return "aac";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("wav")) return "wav";
  if (type.includes("webm")) return "webm";

  return "mp4";
}

async function readVoiceFromUrl(audioUrl) {
  try {
    console.log("🎤 Downloading audio from URL...");

    const audioResponse = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 25 * 1024 * 1024,
      maxBodyLength: 25 * 1024 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const contentType = audioResponse.headers["content-type"] || "audio/mp4";
    const extension = getExtensionFromContentType(contentType);

    console.log("🎵 Audio content-type:", contentType);
    console.log("📦 Audio extension:", extension);

    const form = new FormData();
    form.append("file", Buffer.from(audioResponse.data), {
      filename: `voice.${extension}`,
      contentType: contentType,
    });

    form.append("model", "gpt-4o-mini-transcribe");
    form.append(
      "prompt",
      "នេះជាសម្លេងភាសាខ្មែរ។ សូមបម្លែងជាអត្ថបទភាសាខ្មែរឲ្យបានត្រឹមត្រូវ និងធម្មជាតិ។"
    );

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        timeout: 60000,
        maxContentLength: 25 * 1024 * 1024,
        maxBodyLength: 25 * 1024 * 1024,
      }
    );

    const text = response.data?.text?.trim() || "";

    console.log("✅ Voice transcription:", text || "(empty)");
    return text;
  } catch (error) {
    console.error(
      "❌ readVoiceFromUrl error:",
      error.response?.data || error.message
    );
    return "";
  }
}

module.exports = { readVoiceFromUrl };