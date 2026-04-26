require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const processedMessages = new Set();

setInterval(() => {
  if (processedMessages.size > 1000) {
    const oldMessages = Array.from(processedMessages).slice(0, processedMessages.size - 1000);
    oldMessages.forEach(id => processedMessages.delete(id));
    console.log('🧹 Cleaned up old message IDs');
  }
}, 3600000);

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

app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'page') {
      for (const entry of body.entry) {
        const messagingEvents = entry.messaging;

        for (const event of messagingEvents) {
          const mid = event.message?.mid;

          if (mid && processedMessages.has(mid)) {
            console.log('❌ Duplicate ignored:', mid);
            continue;
          }

          if (event.read) {
            console.log('📖 Ignoring message_read event');
            continue;
          }

          if (event.delivery) {
            console.log('📬 Ignoring message_delivery event');
            continue;
          }

          if (event.message && event.message.is_echo) {
            console.log('📢 Ignoring message_echo event');
            continue;
          }

          if (event.message && !event.message.is_echo) {
            const messageId = event.message.mid;
            const senderId = event.sender.id;
            const messageText = event.message.text || "";

            console.log('\n🆕 NEW USER MESSAGE:');
            console.log(`   Message ID: ${messageId}`);
            console.log(`   Sender ID: ${senderId}`);
            console.log(`   Text: "${messageText}"`);

            if (messageId && processedMessages.has(messageId)) {
              console.log('⚠️ Duplicate ignored:', messageId);
              continue;
            }

            if (messageId) {
              processedMessages.add(messageId);
            }

            try {
              const aiReply = await askAI(senderId, messageText);
              await sendTextMessage(senderId, aiReply);
              console.log('✅ Reply sent to customer\n');
            } catch (error) {
              console.error('❌ Error processing message:', error.message);
              await sendTextMessage(
                senderId,
                'ขอโทษครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง'
              );
            }
          }
        }
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.sendStatus(500);
  }
});

async function askAI(userId, userMessage) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'คุณเป็นผู้ช่วยที่เป็นมิตรและช่วยเหลือดี ตอบเป็นภาษาไทย' },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.choices[0].message.content;
    }

    if (ANTHROPIC_API_KEY) {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [{ role: 'user', content: userMessage }]
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

    return `คุณพูดว่า: "${userMessage}"`;
  } catch (error) {
    console.error('❌ AI API Error:', error.message);
    throw new Error('Failed to get AI response');
  }
}

async function sendTextMessage(recipientId, messageText) {
  try {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    if (!PAGE_ACCESS_TOKEN) {
      throw new Error('PAGE_ACCESS_TOKEN not configured');
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text: messageText },
        messaging_type: 'RESPONSE'
      }
    );

    console.log('📤 Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Send Message Error:', error.response?.data || error.message);
    throw error;
  }
}

app.get('/', (req, res) => {
  res.send('🤖 Bot Server is Running!');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    processedMessages: processedMessages.size
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Server is running on port', PORT);
  console.log('📝 Webhook URL:', `http://localhost:${PORT}/webhook`);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
