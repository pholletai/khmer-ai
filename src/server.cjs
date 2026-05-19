const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // สำหรับทำระบบ Login

const app = express();
const PORT = 3000;
const SECRET = 'your-secret-key-here'; // คีย์ล็อกรหัส Token

app.use(cors());
app.use(express.json());

// 1. ปุ่ม Login สำหรับรับ Token (อิงตามระบบเก่าที่ส่งมา)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // ตรงนี้บงสามารถเช็คกับ Database ได้ ในที่นี้ทำระบบออก Token ให้ผ่านชั่วคราว
    if (username === 'admin' && password === '1234') {
        const token = jwt.sign({ username }, SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token });
    }
    res.status(401).json({ success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
});

// 2. ปุ่ม AI Analyze ที่ยิงตรงไปหา พอร์ต 5000 ของบง (ไม่มี OpenAI แฝง)
app.post('/api/analyze', async (req, res) => {
    const { pageName, category, followers, selectedProblem, description } = req.body;

    const prompt = `Analyze Facebook Page issue: Name ${pageName}, Category ${category}, Followers ${followers}. Problem: ${selectedProblem}. Description: ${description}. Provide English and Khmer appeal message.`;

    try {
        // ยิงตรงเข้าสมองกล Llama 3 พอร์ต 5000 ของบงทันที
        const aiResponse = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: "khmer_ai_user",
                message: prompt
            })
        });

        const aiData = await aiResponse.json();
        res.json({ 
            success: true, 
            result: aiData.reply || aiData.message || aiData 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: "ติดต่อ AI Server พอร์ต 5000 ไม่ได้ครับ" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server ปรับปรุงระบบแล้ว รันที่พอร์ต ${PORT}`));