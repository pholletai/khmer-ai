require("dotenv").config();

const { callOpenAI } = require("./src/ai/openai.js");

(async () => {
  try {
    const result = await callOpenAI("សួស្តី");
    console.log("AI RESULT:");
    console.log(result);
  } catch (err) {
    console.error("OPENAI TEST ERROR:");
    console.error(err.message);
  }
})();