const axios = require("axios");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function readImageFromUrl(imageUrl) {
  try {
    console.log("🖼 Reading image from URL...");

    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 20000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      maxContentLength: 20 * 1024 * 1024,
      maxBodyLength: 20 * 1024 * 1024,
    });

    const contentType = imageResponse.headers["content-type"] || "image/jpeg";
    const base64Image = Buffer.from(imageResponse.data).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
              សូមវិភាគរូបភាពនេះជាភាសាខ្មែរ ដោយខ្លី ច្បាស់ និងមានប្រយោជន៍។

              សូមអនុវត្តតាមនេះ:
              1. បើរូបនេះជារូប screenshot ឬមានអក្សរ សូមអានអត្ថបទសំខាន់ៗក្នុងរូប
              2. បើមាន error message ឬបញ្ហាបច្ចេកទេស សូមសង្ខេបថាបញ្ហាអ្វី
              3. បើរូបមិនច្បាស់ សូមប្រាប់ថារូបមិនច្បាស់
              4. បើជារូបធម្មតា សូមពណ៌នាអ្វីដែលសំខាន់ប៉ុណ្ណោះ
              5. កុំឆ្លើយវែងពេក
              6. សូមឆ្លើយក្នុងទម្រង់ដែលងាយឲ្យ AI បន្តយកទៅជួយអតិថិជន

              ចម្លើយគួរតែមានលក្ខណៈ:
             - ខ្លី
             - ច្បាស់
             - ជាភាសាខ្មែរ
             - ផ្តោតលើព័ត៌មានសំខាន់
              `.trim(),
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.2,
    });

    const content = response.choices?.[0]?.message?.content?.trim() || "";

    console.log("✅ Image analysis:", content || "(empty)");
    return content || "សុំទោស ខ្ញុំមិនអាចអានរូបភាពនេះបានច្បាស់ទេ។";
  } catch (error) {
    console.error(
      "❌ readImageFromUrl error:",
      error.response?.data || error.message
    );
    return "សុំទោស ខ្ញុំមិនអាចអានរូបភាពនេះបានច្បាស់ទេ។";
  }
}

module.exports = { readImageFromUrl };