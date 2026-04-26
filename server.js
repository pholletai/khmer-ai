const processedMessages = new Set(); 
require("dotenv").config();

const express = require("express");
const path = require("path");
const facebookLogin = require("./src/auth/facebookLogin.js");
const { sendTextMessage } = require("./sendTextMessage.js");

// បើ file AI របស់បង path ខុស សូមកែតែបន្ទាត់នេះ
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
exports.app = app;
app.use(express.json());

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
app.post("/voice", async (req, res) => {
  try {
    const { audioUrl } = req.body;

    if (!audioUrl) {
      return res.status(400).json({
        ok: false,
        error: "audioUrl is required",
      });
    }

    const text = await readVoiceFromUrl(audioUrl);

    return res.json({
      ok: true,
      text,
    });
  } catch (error) {
    console.error("POST /voice error:", error.response?.data || error.message);
    return res.status(500).json({
      ok: false,
      error: "voice failed",
    });
  }
});

// =========================
// API: POST /image
// body: { imageUrl }
// =========================
app.post("/image", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        ok: false,
        error: "imageUrl is required",
      });
    }

    const result = await readImageFromUrl(imageUrl);

    return res.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("POST /image error:", error.response?.data || error.message);
    return res.status(500).json({
      ok: false,
      error: "image failed",
    });
  }
});

app.get("/api", (req, res) => {
  res.send("Khmer AI API is running");
});

// -----------------------------
// Static files
// -----------------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/", facebookLogin);

// -----------------------------
// Landing page
// -----------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -----------------------------
// Helper functions
// -----------------------------
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

// -----------------------------
// Webhook verification (GET)
// -----------------------------
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
app.post("/webhook", async (req, res) => {
  // CRITICAL: Send 200 immediately to stop Facebook from retrying
  res.sendStatus(200);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 Webhook received at:', new Date().toISOString());
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const body = req.body;
    
    // Validate this is a page event
    if (body.object !== "page") {
      console.log('⏭️  Not a page event, object type:', body.object);
      return;
    }
    
    const entries = body.entry || [];
    
    for (const entry of entries) {
      const pageId = entry.id;
      const messagingEvents = entry.messaging || [];
      
      console.log(`📄 Processing ${messagingEvents.length} messaging event(s)`);
      
    for (const event of messagingEvents) {
      const mid = event.message?.mid;

      if (mid && processedMessages.has(mid)) {
        console.log("❌ Duplicate ignored:", mid);
        continue;
        }

       if (mid) processedMessages.add(mid);

        // IGNORE read receipts
        
        // IGNORE read receipts
        if (event.read) {
          console.log('⏭️  Ignoring message_read event');
          continue;
        }
        
        // IGNORE delivery confirmations
        if (event.delivery) {
          console.log('⏭️  Ignoring message_delivery event');
          continue;
        }
        
        // IGNORE echoes (messages sent BY the bot)
        if (event.message && event.message.is_echo) {
          console.log('⏭️  Ignoring message_echo event');
          continue;
        }
        
        // PROCESS only actual user messages
        if (event.message && !event.message.is_echo) {
          const messageId = event.message.mid;
          const senderId = event.sender.id;
          const messageText = event.message.text || '';
          
          console.log('\n✅ NEW USER MESSAGE:');
          console.log(`   Message ID: ${messageId}`);
          console.log(`   Sender ID: ${senderId}`);
          console.log(`   Text: "${messageText}"`);
          
          // DEDUPLICATION CHECK
          const db = await getDb();
          const alreadyProcessed = await db.get(
            'SELECT * FROM processed_messages WHERE message_id = ?',
            [messageId]
          );
          
          if (alreadyProcessed) {
            console.log(`⚠️  DUPLICATE - Already processed at: ${alreadyProcessed.processed_at}`);
            console.log('   SKIPPED to prevent duplicate reply\n');
            continue;
          }
          
         // Mark as processed
          await db.run(
            'INSERT INTO processed_messages (message_id, processed_at) VALUES (?, ?)',
            [messageId, new Date().toISOString()]
          );
          
          console.log('✓ Message marked as processed');
          }
         }
        }
      const aiReply = await askAI(senderId, messageText);

      await sendTextMessage(senderId, aiReply);

      console.log("✅ Reply sent to customer");
           
    } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR PROCESSING WEBHOOK');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
});

console.log('🛡️  Defensive POST /webhook handler initialized');
console.log('📝 Mode: STUB - logs messages but sends NO replies');
console.log('✅ Deduplication: ACTIVE (via database)');
console.log('⏭️  Non-message events: IGNORED');
// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});