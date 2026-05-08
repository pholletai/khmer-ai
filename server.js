require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const facebookLogin = require("./src/auth/facebookLogin.js");
const { sendTextMessage } = require("./sendTextMessage.js");

// Path ของ AI module
const { askAI } = require("./src/ai/claude.js");

const {
  getUserMemory,
  saveUserMemory,
  addHistory,
  getHistory,
} = require("./src/memory/memory");

const {
  detectStage,
  getHigherStage,
} = require("./src/ai/salesStage");

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// API: POST /chat
// body: { senderId, message }
// =========================
app.post("/chat", async (req, res) => {
  try {
    const { senderId, message } = req.body;

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "message is required",
      });
    }

    const userId = senderId || "app-user";
    const reply = await askAI(userId, message);

    return res.json({
      ok: true,
      reply,
    });
  } catch (error) {
    console.error("POST /chat error:", error.response?.data || error.message);
    return res.status(500).json({
      ok: false,
      error: "chat failed",
    });
  }
});

// =========================
// API: POST /voice
// body: { audioUrl }
// =========================
// =========================
// API: POST /voice
// body: { audioUrl, audioBase64, senderId }
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

let text = "";

// ========================= 
// Step 1: Transcribe audio → text
// =========================
if (audioUrl) {
  // Download from URL
  const audioRes = await fetch(audioUrl);
  const audioBuffer = await audioRes.buffer();

  const FormData = require("form-data");
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "voice.m4a",
    contentType: "audio/m4a",
  });
  formData.append("model", "whisper-large-v3");

  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    }
  );
  const groqData = await groqRes.json();
  text = groqData.text?.trim() || "";

} else if (audioBase64) {
  // From base64 (mobile app)
  const cleanBase64 = audioBase64.includes(",")
    ? audioBase64.split(",")[1]
    : audioBase64;

  const audioBuffer = Buffer.from(cleanBase64, "base64");

  const FormData = require("form-data");
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "voice.m4a",
    contentType: "audio/m4a",
  });
  formData.append("model", "whisper-large-v3");

  const groqRes = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    }
  );
  const groqData = await groqRes.json();
  text = groqData.text?.trim() || "";
}

if (!text) {
  return res.json({
    ok: true,
    text: "",
    reply: "ខ្ញុំមិនអាចស្ដាប់សំឡេងបានច្បាស់ទេ។ សូមព្យាយាមម្ដងទៀត 🙏",
  });
}

console.log("📝 Transcribed text:", text);

// =========================
// Step 2: Send transcribed text to Claude AI
// =========================
const userId = senderId || "voice-user";
const voicePrompt = `[Voice message transcribed: "${text}"]\n\nសូមឆ្លើយជាភាសាខ្មែរ`;
const reply = await askAI(userId, voicePrompt);

// =========================
// Step 3: Return both text + reply
// =========================
return res.json({
  ok: true,
  text,    // transcribed text
  reply,   // AI reply ← frontend ប្រើ data.reply
});

} catch (error) {
  console.error("POST /voice error:", error.response?.data || error.message);
  return res.status(500).json({
     ok: false,
     error: "voice failed",
     reply: "ขออภัยครับ មានបញ្ហាក្នុងការដំណើរការសំឡេង 🙏",
   });
  }
});

// API: POST /image
// =========================
app.post("/image", async (req, res) => {
  try {
    const { imageUrl, imageBase64, message } = req.body;

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({
        ok: false,
        error: "imageUrl or imageBase64 is required",
      });
    }

    let result;

    if (imageUrl) {
      result = await readImageFromUrl(imageUrl);
    } else {
      const prompt = message || "សូមពិនិត្យរូបនេះ ហើយពន្យល់ជាភាសាខ្មែរ។";

      result = await askAI(
        "app-image-user",
        `${prompt}\n\n[Image received as base64. Please respond in Khmer based on the user's image request.]`
      );
    }

    return res.json({
      ok: true,
      result,
      reply: result,
    });
  } catch (error) {
    console.error("POST /image error:", error.response?.data || error.message);

    return res.status(500).json({
      ok: false,
      error: "image failed",
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
// Health check API
// =========================
app.get("/api", (req, res) => {
  res.send("Khmer AI API is running");
});

// =========================
// Helper functions
// =========================

/**
 * អានពាក្យពីឯកសារសំឡេង
 * TODO: ติดตั้ง Deepgram / Google Speech-to-Text API
 */
async function readVoiceFromUrl(audioUrl) {
  try {
    console.warn("⚠️ Voice transcription not implemented yet");
    return "ขออภัยครับ ยังไม่สามารถประมวลผลเสียงได้";
  } catch (error) {
    console.error("❌ readVoiceFromUrl error:", error.message);
    throw error;
  }
}

/**
 * អាននិងវិភាគរូបភាព
 * TODO: ติดตั้ง Claude Vision API
 */
async function readImageFromUrl(imageUrl) {
  try {
    console.warn("⚠️ Image analysis not implemented yet");
    return "ขออภัยครับ ยังไม่สามารถวิเคราะห์รูปภาพได้";
  } catch (error) {
    console.error("❌ readImageFromUrl error:", error.message);
    throw error;
  }
}

function normalizeText(text = "") {
  return String(text || "").trim();
}

function extractSimpleLeadInfo(text = "", userMemory = {}) {
  const result = {
    interest: userMemory.interest || "",
    budget: userMemory.budget || "",
    name: userMemory.name || "",
  };

  const t = String(text || "");

  if (!result.interest) {
    if (
      t.toLowerCase().includes("bot") ||
      t.toLowerCase().includes("chat") ||
      t.toLowerCase().includes("messenger") ||
      t.includes("ឆ្លើយឆាត")
    ) {
      result.interest = "bot / chat automation";
    } else if (t.toLowerCase().includes("content")) {
      result.interest = "content";
    } else if (t.includes("លក់")) {
      result.interest = "sales";
    } else if (t.includes("AI")) {
      result.interest = "AI assistant";
    }
  }

  const budgetMatch = t.match(/\$?\d+/);
  if (budgetMatch && !result.budget) {
    result.budget = budgetMatch[0];
  }

  return result;
}

function buildSalesPrompt(userText, extraContext = "") {
  return `
អ្នកគឺជា Khmer AI Sales Assistant ។

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
- បើអតិថិជននៅ warm stage ត្រូវសួរចំណុចដែលគេចង់បានមុន

Context អតិថិជន:
${extraContext || "អត់មាន"}

សារអតិថិជន:
${userText}
`.trim();
}

// =========================
// Webhook verification (GET)
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
// Webhook receive messages (POST)
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

        // Ignore echoes / delivery / read
        if (message.is_echo) continue;

        const text = normalizeText(message.text || "");
        const attachments = message.attachments || [];

        console.log("--------------------------------------------------");
        console.log("📩 New message received");
        console.log("Page ID:", pageId);
        console.log("Sender ID:", senderId);
        console.log("Text:", text || "(no text)");
        console.log("Attachments:", attachments.length);

        const userMemory = getUserMemory(senderId);
        const detectedStage = detectStage(text);
        const stage = getHigherStage(userMemory.stage, detectedStage);

        const leadInfo = extractSimpleLeadInfo(text, userMemory);

        saveUserMemory(senderId, {
          ...leadInfo,
          stage,
        });

      addHistory(senderId, "user", text || "[non-text message]");

        const memoryContext = getUserMemory(senderId);
        const history = getHistory(senderId)
          .map((item) => `${item.role}: ${item.content}`)
          .join("\n");

        const extraContext = `
         stage: ${memoryContext.stage}
         name: ${memoryContext.name || "មិនទាន់ស្គាល់"}
         interest: ${memoryContext.interest || "មិនទាន់ដឹង"}
         budget: ${memoryContext.budget || "មិនទាន់ដឹង"}
         notes: ${memoryContext.notes || "មិនទាន់មាន"}

         recent history:
        ${history}
         `.trim();

        let finalUserMessage = text;

        if (!finalUserMessage && attachments.length > 0) {
          finalUserMessage =
            "អតិថិជនបានផ្ញើ attachment មក។ សូមឆ្លើយជាភាសាខ្មែរ ដោយសួរបន្តថាចង់ឲ្យជួយអ្វីជាមួយរូបភាព ឬ attachment នេះ។";
        }

        console.log("🧠 Final message for AI:\n", finalUserMessage);

        const aiPrompt = buildSalesPrompt(finalUserMessage, extraContext);

        let reply = "";
        try {
          reply = await askAI(senderId, aiPrompt);
        } catch (err) {
          console.error("❌ askAI failed:", err.message);
          reply = "ขออภัยครับ មានข้อผิดพลาดក្នុងការស្វាគមន៍។ សូមលองម្តងទៀត";
        }

        let closingLine = "";

        if (stage === "interested") {
          closingLine =
            "\n\n👉 បងចង់ឲខ្ញុំពន្យល់ថា Khmer AI អាចជួយការងារបងផ្នែកណាមុន?";
        }

        if (stage === "pricing") {
          closingLine =
            "\n\n💰 យើងមាន package Basic / Pro / Pro+\n👉 បងចង់ឲខ្ញុំពន្យល់ package មួយណាមុន?";
        }

        if (stage === "ready_to_close") {
          closingLine =
            "\n\n🔥 បើបងចង់ ខ្ញុំអាចសរុបតម្លៃ + ជំហានដំឡើងឲភ្លាម។\n👉 បងចង់ចាប់ផ្ដើម Basic, Pro ឬ Pro+ ?";
        }

        const finalReply = `${normalizeText(reply)}${closingLine}`.trim();

        console.log("🤖 AI Reply:\n", finalReply);

        addHistory(senderId, "assistant", finalReply);

        try {
          await sendTextMessage(pageId, senderId, finalReply);
        } catch (err) {
          console.error("❌ sendTextMessage failed:", err.message);
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "❌ Webhook error:",
      error?.response?.data || error.message || error
    );
    return res.sendStatus(500);
  }
});

// =========================
// Start server
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});