const axios = require("axios");
const FormData = require("form-data");

async function callOpenAI(payload) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  let messages = [];

  try {
    // ១. ករណីជាសំឡេង (Voice) - ប្តូរទៅជាអក្សរសិន
    if (payload && payload.type === "audio") {
      console.log("🎤 កំពុងបកប្រែសំឡេង...");
      const audioResponse = await axios.get(payload.url, { responseType: 'arraybuffer' });
      const form = new FormData();
      form.append('file', Buffer.from(audioResponse.data), { filename: 'audio.m4a', contentType: 'audio/m4a' });
      form.append('model', 'whisper-1');

      const transcription = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: { ...form.getHeaders(), 'Authorization': `Bearer ${OPENAI_API_KEY}` }
      });
      messages.push({ role: "user", content: transcription.data.text });
    } 
    // ២. ករណីជារូបភាព (Image)
    else if (payload && payload.type === "image") {
      console.log("📸 កំពុងពិនិត្យរូបភាព...");
      messages.push({
        role: "user",
        content: [
          { type: "text", text: payload.text || "តើរូបនេះជារូបអ្វី?" },
          { type: "image_url", image_url: { url: payload.url } }
        ]
      });
    } 
    // ៣. ករណីជាអក្សរធម្មតា (Text)
    else {
      messages.push({ role: "user", content: payload });
    }

    // បញ្ជូនទៅកាន់ AI (GPT-4o)
    const aiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o",
      messages: messages,
      max_tokens: 500
    }, {
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}` 
      }
    });

    return aiResponse.data.choices[0].message.content;

  } catch (err) {
    console.error("❌ OpenAI Error Details:", err.response?.data || err.message);
    return "សុំទោសបង ខ្ញុំមិនទាន់អាចស្ដាប់សំឡេង ឬមើលរូបនេះបាននៅឡើយទេ។ សូមបងសាកល្បងម្ដងទៀត!";
  }
}

module.exports = { callOpenAI };