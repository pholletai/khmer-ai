// server.js — KhmerAI backend (Express + Postgres / Neon)
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const { query, queryOne, queryAll, initSchema } = require('./db');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const SECRET = process.env.JWT_SECRET || 'my-super-secret-key-123';


// ===================== AUTH =====================

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, package',
      [username, hashedPassword]
    );

    const user = result.rows[0];
    console.log(`Register success: id=${user.id} username=${user.username}`);

    return res.status(201).json({
      message: 'ចុះឈ្មោះបានជោគជ័យហើយបង!',
      user: { id: user.id, username: user.username, package: user.package },
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    // Postgres unique-violation = SQLSTATE 23505
    if (error.code === '23505') {
      return res.status(400).json({ error: 'ឈ្មោះនេះមានគេប្រើរួចហើយបង!' });
    }
    return res.status(500).json({ error: 'Server មានបញ្ហា' });
  }
});


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await queryOne('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) {
      return res.status(401).json({ error: 'ឈ្មោះអ្នកប្រើប្រាស់ ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'ឈ្មោះអ្នកប្រើប្រាស់ ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ!' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
    res.json({ message: 'ចូលប្រើប្រាស់ជោគជ័យ!', token });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ error: 'Server មានបញ្ហា' });
  }
});


app.get('/api/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'ការចូលប្រើប្រាស់ត្រូវបានបដិសេធ! សូមផ្ញើ Token មកផងបង។' });
  }

  try {
    const verified = jwt.verify(token, SECRET);
    const user = await queryOne(
      'SELECT id, username, package FROM users WHERE id = $1',
      [verified.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Profile loaded successfully', user });
  } catch (error) {
    res.status(403).json({ error: 'Token មិនត្រឹមត្រូវ ឬអស់សុពលភាពហើយបង!' });
  }
});


app.post('/api/upgrade', async (req, res) => {
  const { username, newPackage } = req.body;

  if (!username || !newPackage) {
    return res.status(400).json({ error: 'សូមបំពេញ username និង newPackage (Free/VIP)' });
  }

  try {
    const result = await query(
      'UPDATE users SET package = $1 WHERE username = $2',
      [newPackage, username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'រកមិនឃើញឈ្មោះអ្នកប្រើប្រាស់នេះទេបង!' });
    }

    res.json({ message: `បានដំឡើងគណនីរបស់ ${username} ទៅជា ${newPackage} ដោយជោគជ័យ!` });
  } catch (error) {
    console.error('UPGRADE ERROR:', error);
    res.status(500).json({ error: 'Server មានបញ្ហា' });
  }
});


// ===================== PAYMENTS =====================

app.post('/api/webhook/payment', async (req, res) => {
  const { username, amount, tx_id, status } = req.body;

  if (!username || !amount || !tx_id || !status) {
    return res.status(400).json({ error: 'ទិន្នន័យពីធនាគារមិនគ្រប់គ្រាន់ទេបង!' });
  }

  try {
    const user = await queryOne('SELECT id FROM users WHERE username = $1', [username]);
    if (!user) {
      return res.status(404).json({
        error: 'User នេះមិនទាន់មានទេ សូម register មុនសិន'
      });
    }

    await query(
      'INSERT INTO transactions (username, amount, tx_id, status) VALUES ($1, $2, $3, $4)',
      [username, amount, tx_id, status]
    );

    if (status === 'SUCCESS') {
      const r = await query(
        "UPDATE users SET package = 'VIP' WHERE username = $1",
        [username]
      );
      if (r.rowCount > 0) {
        return res.json({
          message: `💸 ទទួលបានការទូទាត់ $${amount} ជោគជ័យ! ប្រព័ន្ធបានដំឡើងគណនី ${username} ទៅ VIP ស្វ័យប្រវត្តហើយបង!`
        });
      }
    }

    res.json({ message: 'ការបង់ប្រាក់កំពុងដំណើរការ ឬមិនជោគជ័យទេបង!' });

  } catch (error) {
    console.error('PAYMENT WEBHOOK ERROR:', error);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'ប្រតិបត្តិការបង់ប្រាក់នេះត្រូវបានដំណើរការរួចហើយ!' });
    }

    res.status(500).json({ error: 'Server ជួបបញ្ហាពេលដោះស្រាយការបង់ប្រាក់' });
  }
});


// ===================== ADMIN =====================

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalUsers = await queryOne('SELECT COUNT(*)::int AS total FROM users');
    const vipUsers = await queryOne(
      "SELECT COUNT(*)::int AS total FROM users WHERE package = 'VIP'"
    );
    const totalRevenue = await queryOne(
      "SELECT COALESCE(SUM(amount), 0)::float AS total FROM transactions WHERE status = 'SUCCESS'"
    );
    const totalTransactions = await queryOne(
      "SELECT COUNT(*)::int AS total FROM transactions WHERE status = 'SUCCESS'"
    );

    res.json({
      message: 'Dashboard loaded successfully',
      stats: {
        totalUsers: totalUsers.total,
        vipUsers: vipUsers.total,
        totalRevenue: totalRevenue.total,
        totalTransactions: totalTransactions.total,
      },
    });
  } catch (error) {
    console.error('DASHBOARD ERROR:', error);
    res.status(500).json({ error: 'Server មានបញ្ហាពេលទាញ Dashboard' });
  }
});


// ===================== AGENT (in-memory chat history) =====================

const chatMemory = new Map();
const MAX_HISTORY = 30;

function getHistory(username) {
  if (!chatMemory.has(username)) {
    chatMemory.set(username, []);
  }
  return chatMemory.get(username);
}

function addToHistory(username, role, content) {
  const history = getHistory(username);
  history.push({ role, content });
  while (history.length > MAX_HISTORY) {
    history.shift();
  }
}

function clearHistory(username) {
  chatMemory.delete(username);
}


function buildSystemPrompt(username, userInfo) {
  const systemPrompt = `Phollet AI Agent អ្នកជាជំនួយការអភិវឌ្ឍន៍វេបសាយ (AI Web Developer Agent) ដែលមានសមត្ថភាពបង្កើត កែប្រែ និងគ្រប់គ្រងវេបសាយដោយស្វ័យប្រវត្ត។
(คุณคือ AI Web Developer Agent ที่มีความสามารถในการสร้าง แก้ไข และจัดการเว็บไซต์โดยอัตโนมัติ)

### AGENT CORE INSTRUCTION
1. คุณมีหน้าที่รับคำสั่งจากผู้ใช้เพื่อนำไปสร้างหน้าเว็บ හෝจัดการโปรเจกต์
2. หากคำสั่งนั้นจำเป็นต้องใช้เครื่องมือ (Tools) ให้คุณตอบกลับเป็นรูปแบบ JSON ตามที่กำหนดไว้ด้านล่างนี้ "ทันที" ห้ามอธิบายข้อความอื่นปนเด็ดขาด!
3. เมื่อคุณได้รับผลลัพธ์จากการใช้เครื่องมือแล้ว คุณค่อยนำข้อมูลนั้นมาสรุปและอธิบายให้ผู้ใช้ฟังตามภาษาที่ผู้ใช้เลือกพิมพ์มา

### AVAILABLE TOOLS (เครื่องมือที่คุณสามารถเลือกใช้ได้)
หากต้องการใช้เครื่องมือ ให้ตอบในรูปแบบ JSON นี้เท่านั้น:
- สำหรับสร้างไฟล์เว็บใหม่ (HTML/CSS/JS):
{"tool": "createNewWebPage", "args": {"projectName": "ชื่อโปรเจกต์", "fileName": "index.html", "codeContent": "โค้ดเว็บทั้งหมด"}}

- สำหรับตรวจสอบโปรเจกต์ในระบบ:
{"tool": "checkProjectStatus", "args": {"projectName": "ชื่อโปรเจกต์"}}

### CRITICAL RULE: LANGUAGE MATCHING
1. ALWAYS detect the language used by the user in their latest message.
2. RESPOND EXACTLY in the same language that the user used to speak to you:
   - If the user writes in THAI -> Reply in THAI.
   - If the user writes in KHMER -> Reply in KHMER.
   - If the user writes in ENGLISH -> Reply in ENGLISH.
3. NEVER mix languages in a single response unless explicitly asked by the user.

### PERSONALITY & TONE
- Professional, helpful, concise, and smart.
- Avoid robotic repetitions or filler words.

## User Context
- Username: ${username || 'Guest'}
${userInfo ? `- Info: ${userInfo}` : ''}`;

  return systemPrompt;
}


async function createNewWebPage(projectName, fileName, codeContent) {
  try {
    const projectDir = path.join(__dirname, 'projects', projectName);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    const filePath = path.join(projectDir, fileName);
    fs.writeFileSync(filePath, codeContent, 'utf8');
    return `[SUCCESS]: บันทึกไฟล์ ${fileName} ในโปรเจกต์ "${projectName}" เรียบร้อยแล้ว!`;
  } catch (error) {
    return `[ERROR]: ไม่สามารถสร้างไฟล์ได้เนื่องจาก: ${error.message}`;
  }
}


async function checkProjectStatus(projectName) {
  try {
    const projectDir = path.join(__dirname, 'projects', projectName);
    if (fs.existsSync(projectDir)) {
      const files = fs.readdirSync(projectDir);
      return `[INFO]: โปรเจกต์ "${projectName}" มีอยู่จริงในระบบ ปัจจุบันมีไฟล์ทั้งหมด: ${files.join(', ')}`;
    } else {
      return `[INFO]: ไม่พบโปรเจกต์ชื่อ "${projectName}" ในระบบในขณะนี้`;
    }
  } catch (error) {
    return `[ERROR]: ไม่สามารถเช็กสถานะได้เนื่องจาก: ${error.message}`;
  }
}


const webAgentTools = {
  createNewWebPage,
  checkProjectStatus,
};


app.post('/api/chat', async (req, res) => {
  const { username, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'សូមប៉ុចូលសារសន្ទនា' });
  }

  try {
    const userInfo = '';
    const systemPrompt = buildSystemPrompt(username, userInfo);

    let loopCount = 0;
    const maxLoops = 3;
    let finalResponse = '';

    addToHistory(username, 'user', message);

    while (loopCount < maxLoops) {
      const history = getHistory(username) || [];
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...history,
      ];

      const chatCompletion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
      });

      const aiResponse = chatCompletion.choices[0].message.content;

      if (aiResponse.includes('"tool":')) {
        try {
          const startJson = aiResponse.indexOf('{');
          const endJson = aiResponse.lastIndexOf('}') + 1;
          const jsonString = aiResponse.substring(startJson, endJson);
          const toolRequest = JSON.parse(jsonString);
          const toolName = toolRequest.tool;
          const toolArgs = toolRequest.args;

          if (webAgentTools[toolName]) {
            let toolResult = '';
            if (toolName === 'createNewWebPage') {
              toolResult = await webAgentTools[toolName](toolArgs.projectName, toolArgs.fileName, toolArgs.codeContent);
            } else if (toolName === 'checkProjectStatus') {
              toolResult = await webAgentTools[toolName](toolArgs.projectName);
            }

            addToHistory(username, 'assistant', aiResponse);
            addToHistory(username, 'user', `[SYSTEM OBSERVATION]: ผลลัพธ์จากการใช้งานเครื่องมือ ${toolName}: ${toolResult} -> กรุณาสรุปและรายงานให้ผู้ใช้ทราบด้วยภาษาของผู้ใช้`);

            loopCount++;
            continue;
          }
        } catch (jsonError) {
          console.error('Agent JSON parsing failed, falling back to standard response:', jsonError);
        }
      }

      finalResponse = aiResponse;
      break;
    }

    addToHistory(username, 'assistant', finalResponse);
    return res.json({ response: finalResponse });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ Agent' });
  }
});


app.get('/api/chat/memory/:username', (req, res) => {
  const history = getHistory(req.params.username);
  res.json({
    username: req.params.username,
    messageCount: history.length,
    maxMessages: MAX_HISTORY,
  });
});


app.post('/api/chat/clear', async (req, res) => {
  const { userId, username } = req.body;
  const key = userId || username;
  if (!key) {
    return res.status(400).json({ error: 'userId is required' });
  }
  try {
    // Vision chat persistence (Postgres)
    await query('DELETE FROM chat_history WHERE user_id = $1', [key]);
    // In-memory agent chat
    clearHistory(key);
    res.json({ status: 'success', message: 'Chat cleared' });
  } catch (error) {
    console.error('CLEAR ERROR:', error);
    res.status(500).json({ error: 'Server មានបញ្ហា' });
  }
});


// ===================== VISION (image upload) =====================

app.post('/api/image', async (req, res) => {
  try {
    const { image, prompt, userId } = req.body;
    const currentUserId = userId || 'default_user';

    if (!image) {
      return res.status(400).json({ error: 'សូមផ្ដល់រូបភាព (กรุณาส่งรูปภาพเข้ามาในระบบ)' });
    }

    // 1. Load previous vision chat history from Postgres
    let previousMessages = [];
    try {
      previousMessages = await queryAll(
        'SELECT role, content FROM chat_history WHERE user_id = $1 ORDER BY id ASC',
        [currentUserId]
      );
    } catch (dbError) {
      console.error('ดึงข้อมูลล้มเหลว:', dbError);
    }

    // 2. Format old messages for Groq
    const apiMessages = previousMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 3. Append the new image + prompt
    apiMessages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt || 'วิเคราะห์รูปภาพนี้ให้ทีครับ' },
        { type: 'image_url', image_url: { url: image } },
      ],
    });

    // 4. Send to Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: apiMessages,
    });
    const aiResponse = response.choices[0].message.content;

    // 5. Persist user prompt + assistant response
    await query(
      'INSERT INTO chat_history (user_id, role, content) VALUES ($1, $2, $3)',
      [currentUserId, 'user', prompt || '[ส่งรูปภาพ]']
    );
    await query(
      'INSERT INTO chat_history (user_id, role, content) VALUES ($1, $2, $3)',
      [currentUserId, 'assistant', aiResponse]
    );

    return res.json({ result: aiResponse });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// ===================== STARTUP =====================

(async () => {
  try {
    await initSchema();
    app.listen(5000, () => {
      console.log('🚀 Server ដំណើរការប្រព័ន្ធរៀបចំ Database រួចរាល់លើ http://localhost:5000');
    });
  } catch (e) {
    console.error('Startup failed:', e);
    process.exit(1);
  }
})();
