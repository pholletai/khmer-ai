require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
const FormData = require("form-data");

const facebookLogin = require("./src/auth/facebookLogin.js");
const { sendTextMessage } = require("./sendTextMessage.js");
const handleMessage = require("./src/handlers/handleMessage");
const { askAI, askAIWithImage } = require("./src/ai/claude.js");
const { getUserMemory, saveUserMemory, addHistory, getHistory } = require("./src/memory/memory");
const { detectStage, getHigherStage } = require("./src/ai/salesStage");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// =========================
// Helper: Timeout fetch
// =========================
const fetchWithTimeout = (url, options = {}, ms = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

// =========================
// Helper: Transcribe audio via Groq Whisper
// =========================
async function transcribeAudio(audioBuffer) {
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "voice.m4a",
    contentType: "audio/m4a",
    knownLength: audioBuffer.length,
  });
  formData.append("model", "whisper-large-v3");
  formData.append("language", "km");

  const groqRes = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    },
    20000
  );

  const groqData = await groqRes.json();
  if (!groqRes.ok) {
    console.error("❌ Groq error:", groqData);
    throw new Error("Transcription failed: " + JSON.stringify(groqData));
  }

  return groqData.text?.trim() || "";
}

// =========================
// API: POST /chat
// body: { senderId, message }
// =========================
app.post("/chat", async (req, res) => {
  try {
    const { senderId, message } = req.body;

    if (!message) {
      return res.status(400).json({ ok: false, error: "message is required" });
    }

    const userId = senderId || "app-user";
    const reply = await askAI(userId, message);

    return res.json({ ok: true, reply });
  } catch (error) {
    console.error("POST /chat error:", error.message);
    return res.status(500).json({ ok: false, error: "chat failed" });
  }
});

// =========================
// API: POST /voice
// body: { audioUrl?, audioBase64?, senderId? }
// =========================
app.post("/voice", async (req, res) => {
  try {
    const { audioUrl, audioBase64, senderId } = req.body;

    if (!audioUrl && !audioBase64) {
      return res.status(400).json({
        ok: false,
        error: "audioUrl or audioBase64 is required",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "GROQ_API_KEY មិនទាន់កំណត់",
      });
    }

    // Step 1: Get audio buffer
    let audioBuffer;

    if (audioUrl) {
      const audioRes = await fetchWithTimeout(audioUrl, {}, 10000);
      if (!audioRes.ok) throw new Error("Audio download failed: " + audioRes.status);
      audioBuffer = Buffer.from(await audioRes.arrayBuffer()); // ✅ arrayBuffer()
    } else {
      const cleanBase64 = audioBase64.includes(",")
        ? audioBase64.split(",")[1]
        : audioBase64;
      audioBuffer = Buffer.from(cleanBase64, "base64");
    }

    // Step 2: Transcribe
    const text = await transcribeAudio(audioBuffer);

    if (!text) {
      return res.json({
        ok: true,
        text: "",
        reply: "ខ្ញុំមិនអាចស្ដាប់សំឡេងបានច្បាស់ទេ។ សូមព្យាយាមម្ដងទៀត 🙏",
      });
    }

    console.log("📝 Transcribed:", text);

    // Step 3: Send to Claude AI
    const userId = senderId || "voice-user";
    const voicePrompt = `អ្នកប្រើបានផ្ញើ voice message: "${text}"`;
    const reply = await askAI(userId, voicePrompt);

    return res.json({ ok: true, text, reply });

  } catch (error) {
    console.error("POST /voice error:", error.message);
    return res.status(500).json({
      ok: false,
      error: "voice failed",
      reply: "សូមអភ័យទោស! មានបញ្ហាក្នុងការដំណើរការសំឡេង 🙏",
    });
  }
});

// =========================
// API: POST /image
// body: { imageUrl?, imageBase64?, message?, senderId? }
// =========================
app.post("/image", async (req, res) => {
  try {
    const { imageUrl, imageBase64, message, senderId } = req.body;

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({
        ok: false,
        error: "imageUrl or imageBase64 is required",
      });
    }

    const userId = senderId || "app-image-user";
    const userCaption = message || null;

    let base64Image;
    let mediaType = "image/jpeg";

    if (imageUrl) {
      // Download image from URL
      const imgRes = await fetchWithTimeout(imageUrl, {}, 10000);
      if (!imgRes.ok) throw new Error("Image download failed: " + imgRes.status);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      base64Image = imgBuffer.toString("base64");

      // Detect media type
      if (imageUrl.includes(".png")) mediaType = "image/png";
      else if (imageUrl.includes(".gif")) mediaType = "image/gif";
      else if (imageUrl.includes(".webp")) mediaType = "image/webp";

    } else {
      // From base64
      const cleanBase64 = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      base64Image = cleanBase64;

      // Detect from data URI prefix
      if (imageBase64.startsWith("data:image/png")) mediaType = "image/png";
      else if (imageBase64.startsWith("data:image/gif")) mediaType = "image/gif";
      else if (imageBase64.startsWith("data:image/webp")) mediaType = "image/webp";
    }

    // ✅ Call Claude Vision
    const result = await askAIWithImage(userId, base64Image, mediaType, userCaption);

    return res.json({ ok: true, result, reply: result });

  } catch (error) {
    console.error("POST /image error:", error.message);
    return res.status(500).json({
      ok: false,
      error: "image failed",
      reply: "សូមអភ័យទោស! មានបញ្ហាក្នុងការវិភាគរូបភាព 🙏",
    });
  }
});

// =========================
// Static files
// =========================
app.use(express.static(path.join(__dirname, "public")));
app.use("/", facebookLogin);

// =========================
// Landing page
// =========================
app.get("/", (req, res) => {
  res.send("✅ Khmer AI Server is running");
});

// =========================
// Health check
// =========================
app.get("/api", (req, res) => {
  res.json({
    ok: true,
    message: "Khmer AI API is running",
    version: "2.0.0",
    features: ["chat", "voice", "image", "webhook"],
  });
});

// =========================
// Helpers
// =========================
function normalizeText(text = "") {
  return String(text || "").trim();
}

function extractSimpleLeadInfo(text = "", userMemory = {}) {
  const result = {
    interest: userMemory.interest || "",
    budget: userMemory.budget || "",
    name: userMemory.name || "",
  };

  const t = String(text || "").toLowerCase();

  if (!result.interest) {
    if (t.includes("bot") || t.includes("chat") || t.includes("messenger") || t.includes("ឆ្លើយឆាត")) {
      result.interest = "bot / chat automation";
    } else if (t.includes("content")) {
      result.interest = "content";
    } else if (t.includes("លក់")) {
      result.interest = "sales";
    } else if (t.includes("ai")) {
      result.interest = "AI assistant";
    }
  }

  const budgetMatch = text.match(/\$?\d+/);
  if (budgetMatch && !result.budget) {
    result.budget = budgetMatch[0];
  }

  return result;
}

function buildSalesPrompt(userText, extraContext = "") {
  return `
អ្នកគឺជា Khmer AI — ជំនួយការឆ្លាតវៃ ដូច ChatGPT អាចជួយគ្រប់យ៉ាង!

តួនាទីរបស់អ្នក:
1. ឆ្លើយអតិថិជនដោយសុភាព ខ្លី ច្បាស់
2. ជួយបិទការលក់
3. សួរតាម pain point របស់អតិថិជន
4. បើអតិថិជនចាប់អារម្មណ៍ ត្រូវដឹកទៅ package / price / next step

របៀបឆ្លើយ:
- ឆ្លើយជាភាសាខ្មែរ ជាចម្បង
- មិនឆ្លើយវែងពេក
- មួយសារ ត្រូវមាន:
  - ចម្លើយខ្លីច្បាស់
  - សំណួរបន្ត 1
  - បើសមរម្យ បន្ថែម closing line ខ្លី
- បើអតិថិជនសួរតម្លៃ ឬចង់ចាប់ផ្ដើម ត្រូវដឹកទៅការបិទការលក់ភ្លាម

Context អតិថិជន:
${extraContext || "អត់មាន"}

សារអតិថិជន:
${userText}
`.trim();
}

// =========================
// Webhook: GET (verification)
// =========================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// =========================
// Webhook: POST (receive messages)
// =========================
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== "page") {
      return res.sendStatus(404);
    }

    for (const entry of body.entry || []) {
      const pageId = entry.id;

      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const message = event.message;

        if (!senderId || !message) continue;
        if (message.is_echo) continue;

        // ✅ Route ទៅ handleMessage (handles text/image/audio/video)
        await handleMessage(senderId, message, pageId);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook error:", error?.response?.data || error.message || error);
    return res.sendStatus(500);
  }
});

// =========================
// Start server
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Khmer AI Server running on port ${PORT}`);
});