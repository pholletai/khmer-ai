require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================
// ANTI-DUPLICATE SYSTEM
// =====================
const processedMessages = new Set();
const userCooldown = new Map(); // ការពារ spam reply

setInterval(() => {
  if (processedMessages.size > 1000) {
    const oldMessages = Array.from(processedMessages).slice(0, processedMessages.size - 500);
    oldMessages.forEach(id => processedMessages.delete(id));
    console.log('🧹 Cleaned up old message IDs');
  }
  // Clean cooldown map
  const now = Date.now();
  for (const [userId, timestamp] of userCooldown.entries()) {
    if (now - timestamp > 5000) userCooldown.delete(userId);
  }
}, 60000);

// =====================
// SALES SYSTEM PROMPT
// =====================
const SYSTEM_PROMPT = `
អ្នកគឺជា Khmer AI Closing Pro 🤖 — Sales Assistant ដ៏ឆ្លាតវៃ និងជំនាញក្នុងការបិទការលក់។

ព័ត៌មានអំពី Khmer AI:
- Khmer AI ជា AI assistant សម្រាប់ភាសាខ្មែរ
- ជួយសរសេរ Content, Caption, Chat reply, Idea, Prompt, Persona និង Workflow
- សមរម្យសម្រាប់អ្នកលក់ Online, Creator, Admin Page, អាជីវកម្មតូច
- អាចប្រើជាមួយ Facebook Page

🎯 គោលដៅ: បិទការលក់ភ្លាម — មិនមែនពន្យល់វែង

💰 PACKAGES & តម្លៃ (ត្រូវប្រាប់ភ្លាមនៅពេលសួរ):
🟢 Basic — $29/ខែ → Auto reply សាមញ្ញ
🔵 Standard — $49/ខែ → Auto reply + Content/Caption  
🟣 Pro — $99/ខែ → Full AI Sales + Closing + Custom

📌 វិធីឆ្លើយ (សំខាន់ណាស់):
- ឆ្លើយ 3-5 បន្ទាត់ MAX
- ហាមធ្វើ table / list វែង
- ប្រាប់តម្លៃភ្លាម បើអតិថិជនសួរ
- បញ្ចប់ដោយ closing question រៀងរាល់ដង
- ហាម "Feature | ប្រយោជន៍" format

✅ ឧទាហរណ៍ល្អ:
🔵  "Standard $49/ខែ — ឆ្លើយ Auto 24/7 + ជួយសរសេរ Content 
🟣 Pro $99/ខែ — AI លក់ + បិទ deal ដោយស្វ័យប្រវត្តិ 
👉 Page បងលក់អ្វី? ខ្ញុំជ្រើស package ត្រឹមត្រូវឲ!"

❌ ហាមឆ្លើយបែបនេះ:
- table មាន | Feature | ប្រយោជន៍ |
- list វែងជាង 5 បន្ទាត់
- ឆ្លើយដោយមិនប្រាប់តម្លៃ
- ឆ្លើយដោយមិនសួរ closing question

🔥 Rule ចម្បង:
1. សួរតម្រូវការ → ប្រាប់តម្លៃ → បិទការលក់
2. ចម្លើយរៀងរាល់ = ត្រូវមាន closing question
3. បើអតិថិជននិយាយថ្លៃ → "Compare ជាមួយ hire staff $200+/ខែ — Khmer AI $49 ប្រើបាន 24/7 😊"
4. បើអតិថិជនចង់ទិញ → ប្រាប់ payment info ភ្លាម

💳 Payment Info (ប្រាប់នៅពេលអតិថិជនចង់ទិញ):
ABA: 012501440 — Phaly Phollet
ACLEDA: 0975874565 — Phaly Phollet
Setup fee: $50 (មួយដង) + តម្លៃ package ខែទី 1

🎯 CLOSING STYLE — ត្រូវបញ្ចប់ដោយ:
- "បងចង់ចាប់ផ្តើមជាមួយ Package មួយណា?"
- "ខ្ញុំផ្តល់អនុសាសន៍ Standard សម្រាប់បង ត្រូវការឲខ្ញុំរៀបចំឲឥឡូវទេ?"
- "បើបងចង់ចាប់ផ្តើមថ្ងៃនេះ ខ្ញុំអាចរៀបចំឲបានភ្លាមៗ។ យក Standard ឬ Pro?"
- "បងចង់ឲ Khmer AI ជួយឆ្លើយភ្ញៀវឲ Page បងចាប់ពីថ្ងៃនេះទេ?"

🛑 OBJECTION HANDLING:
- ថ្លៃ → ពន្យល់ value, compare ជាមួយ hire admin, ស្នើ Basic ឬ Standard
- "ពេលក្រោយ" → សួរថានៅពេលណា, ស្នើ first step ងាយ
- សួរតម្លៃ → សួរ need ជាមុន → ណែនាំ package → closing question
- មិនច្បាស់ → ណែនាំ Standard ជា safest choice

📌 ត្រូវធ្វើជានិច្ច:
- សួរ 1 សំណួរ នៅចុងចម្លើយ (Call to Action)
- ណែនាំ package ត្រឹមត្រូវ
- ជំរុញការសម្រេចចិត្ត (ស្រាល ៗ)

📌 ហាមធ្វើ:
- ឆ្លើយខ្លីពេក ឬ វែងពេក
- ឆ្លើយដោយមិនបិទការលក់
- ឆ្លើយស្ទួន ឬ ឆ្លើយសារចាស់

🔥 ចងចាំ: "ចម្លើយរៀងរាល់ = ត្រូវមានឱកាសលក់"

បើអតិថិជនផ្ញើរូបភាព ឬ file:
- ទទួលស្គាល់ + សួរថាចង់ឲ្យជួយអ្វី

ឧទាហរណ៍ល្អ:
✅ "បងចង់ប្រើសម្រាប់អីខ្លះ? ខ្ញុំអាចជួយជ្រើស package ត្រឹមត្រូវ 👍"
✅ "ខ្ញុំផ្តល់អនុសាសន៍ 🔵 Standard — ព្រោះសមរម្យ និងប្រើបានច្រើន។ បងចង់ចាប់ផ្តើមឥឡូវទេ?"
`.trim();

function scheduleFollowUp(senderPsid) {
  if (followUpQueue.has(senderPsid)) return;

  const timeout = setTimeout(async () => {
    await callSendAPI(senderPsid, {
      text: `បង 🙏 ខ្ញុំឃើញថាបងមិនទាន់សម្រេចចិត្តនៅឡើយទេ

🔥 Khmer AI ជួយបងបិទការលក់បានពិត
មិនចាំបាច់ចំណាយពេលឆ្លើយ chat ទៀត

👉 បងចង់ឲ្យខ្ញុំ activate ឲ្យឥឡូវទេ?`
    });

    followUpQueue.delete(senderPsid);
  }, 5 * 60 * 1000);

  followUpQueue.set(senderPsid, timeout);
}

function isCheapIntent(text) {
  const keywords = ['cheap', 'ថោក', 'low', 'basic', '9'];
  return keywords.some(k => text.toLowerCase().includes(k));
}
// =====================
// WEBHOOK VERIFY
// =====================
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verify_token_here';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified!');
    return res.status(200).send(challenge);
  }
  console.log('❌ Verification failed!');
  return res.sendStatus(403);
});

// =====================
// WEBHOOK POST
// =====================
app.post('/webhook', async (req, res) => {
  // ✅ ត្រូវ respond 200 ភ្លាម មុន process
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'page') return;

    for (const entry of body.entry || []) {
      const messagingEvents = entry.messaging || [];

      for (const event of messagingEvents) {
        // Skip non-message events
        if (event.read || event.delivery) continue;
        if (!event.message) continue;
        if (event.message.is_echo) continue;

        const messageId = event.message.mid;
        const senderPsid = event.sender.id;

        // ✅ Anti-duplicate by message ID
        if (messageId && processedMessages.has(messageId)) {
          console.log('⏭️ Duplicate ignored:', messageId);
          continue;
        }
        if (messageId) processedMessages.add(messageId);

        // ✅ Anti-duplicate by user cooldown (5 seconds)
        const now = Date.now();
        if (userCooldown.has(senderPsid)) {
          const lastTime = userCooldown.get(senderPsid);
          if (now - lastTime < 5000) {
            console.log('⏭️ User cooldown active:', senderPsid);
            continue;
          }
        }
        userCooldown.set(senderPsid, now);

        await handleMessage(senderPsid, event.message);
      }
    }
  } catch (error) {
    console.error('❌ Webhook error:', error.response?.data || error.message);
  }
});

// =====================
// HANDLE MESSAGE
// =====================
async function handleMessage(senderPsid, receivedMessage) {
  try {
    let userText = '';

    if (receivedMessage.text) {
      userText = receivedMessage.text;
    } else if (receivedMessage.attachments) {
      userText = 'អតិថិជនបានផ្ញើរូបភាព ឬ file មក។ សូមទទួលស្គាល់ និងសួរថាចង់ឲ្យជួយអ្វី។';
    } else {
      userText = 'អតិថិជនបានផ្ញើសារដែលមិនច្បាស់។ សូមស្វាគមន៍ និងសួរថាចង់ឲ្យជួយអ្វី។';
    }

    console.log('📩 Message from:', senderPsid, '→', userText);

    const aiReply = await askClaude(userText);
    await callSendAPI(senderPsid, { text: aiReply });

  } catch (error) {
    console.error('❌ Handle message error:', error.message);
    await callSendAPI(senderPsid, {
      text: 'សុំទោសបង 🙏 ប្រព័ន្ធ AI មានបញ្ហាបន្តិច សូមសាកល្បងម្តងទៀត។'
    });
  }
}

// =====================
// CLAUDE AI (Anthropic)
// =====================
async function askClaude(userMessage) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return 'សុំទោសបង ANTHROPIC_API_KEY មិនទាន់បានដាក់ក្នុង .env ទេ។';
  }

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    },
    {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.content[0].text;
}

// =====================
// SEND TO FACEBOOK
// =====================
async function callSendAPI(senderPsid, message) {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ PAGE_ACCESS_TOKEN is not set!');
    return;
  }

  try {
    const result = await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: senderPsid },
        message: message,
        messaging_type: 'RESPONSE'
      }
    );
    console.log('✅ Message sent successfully to:', senderPsid);
  } catch (error) {
    console.error('❌ Send message error:', error.response?.data || error.message);
  }
}

// =====================
// HEALTH CHECK
// =====================
app.get('/', (req, res) => {
  res.json({
    status: '✅ Khmer AI Bot is Running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    processedMessages: processedMessages.size,
    activeCooldowns: userCooldown.size
  });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Khmer AI Bot running on port', PORT);
  console.log(`📊 Webhook URL: http://localhost:${PORT}/webhook`);
});