require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Track processed messages to avoid duplicates
const processedMessages = new Set();

// Clean up old message IDs every hour
setInterval(() => {
  if (processedMessages.size > 1000) {
    const oldMessages = Array.from(processedMessages).slice(0, processedMessages.size - 500);
    oldMessages.forEach(id => processedMessages.delete(id));
    console.log('🧹 Cleaned up old message IDs');
  }
}, 3600000);

// ================================================
// WEBHOOK VERIFICATION (GET)
// ================================================
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verify_token_here';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified!');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Verification failed!');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// ================================================
// WEBHOOK MESSAGE HANDLING (POST)
// ================================================
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'page') {
      body.entry.forEach(entry => {
        const webhookEvent = entry.messaging[0];
        const senderPsid = webhookEvent.sender.id;

        if (webhookEvent.message) {
          const messageId = webhookEvent.message.mid;

          if (processedMessages.has(messageId)) {
            console.log('⏭️ Skipping duplicate message:', messageId);
            return;
          }

          processedMessages.add(messageId);
          handleMessage(senderPsid, webhookEvent.message);
        }
      });

      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.sendStatus(500);
  }
});

// ================================================
// MESSAGE HANDLER
// ================================================
async function handleMessage(senderPsid, receivedMessage) {
  let response;

  if (receivedMessage.text) {
    const messageText = receivedMessage.text.toLowerCase();

    if (messageText.includes('hello') || messageText.includes('hi') || messageText.includes('ជំរាបសួរ')) {
      response = {
        text: 'សួស្តី! 👋 ខ្ញុំជា AI Chatbot។ តើខ្ញុំអាចជួយអ្វីបានទេ?'
      };
    } else if (messageText.includes('help') || messageText.includes('ជំនួយ')) {
      response = {
        text: 'ខ្ញុំអាចជួយអ្នក:\n✅ ឆ្លើយសំណួរ\n✅ ផ្តល់ព័ត៌មាន\n✅ និងជាច្រើនទៀត!'
      };
    } else {
      response = {
        text: `អ្នកបានផ្ញើ: "${receivedMessage.text}"\nខ្ញុំទទួលបានសារអ្នកហើយ! 👍`
      };
    }

  } else if (receivedMessage.attachments) {
    response = {
      text: 'ខ្ញុំទទួលបាន attachment របស់អ្នកហើយ! 📎'
    };
  }

  await callSendAPI(senderPsid, response);
}

// ================================================
// SEND API
// ================================================
async function callSendAPI(senderPsid, response) {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ PAGE_ACCESS_TOKEN is not set!');
    return;
  }

  const requestBody = {
    recipient: { id: senderPsid },
    message: response
  };

  try {
    const result = await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      requestBody
    );
    console.log('✅ Message sent successfully:', result.data);
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
  }
}

// ================================================
// HEALTH CHECK ENDPOINT
// ================================================
app.get('/', (req, res) => {
  res.json({
    status: 'Bot Server is Running! ✅',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    processedMessages: processedMessages.size
  });
});

// ================================================
// START SERVER
// ================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Server is running on port', PORT);
  console.log('📊 Webhook URL:', `http://localhost:${PORT}/webhook`);
});

process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
