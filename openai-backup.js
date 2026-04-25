const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * មុខងារចម្បងសម្រាប់ផ្ញើសារទៅកាន់ OpenAI
 * @param {Array|String} payload - ទិន្នន័យជាអក្សរ ឬ Array នៃ Messages
 */
async function callOpenAI(payload) {
  try {
    // កំណត់ទម្រង់ Messages ឱ្យត្រូវតាម OpenAI Standard
    let messages = Array.isArray(payload) ? payload : [{ role: "user", content: payload }];

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // ប្រើ gpt-4o ដើម្បីឱ្យមើលរូបភាពច្បាស់ និងឆ្លាតវៃ
      messages: messages,
      max_tokens: 1000,
    });

    return response.choices[0].message.content?.trim() || "សុំទោសបង ខ្ញុំមិនទាន់អាចឆ្លើយបានទេ។";

  } catch (err) {
    console.error("❌ OpenAI Error Details:", err.response?.data || err.message);
    return "សុំទោសបង ប្រព័ន្ធ AI កំពុងមានបញ្ហាបច្ចេកទេសបន្តិចបន្តួច។";
  }
}

module.exports = { callOpenAI };