const axios = require("axios");

async function notifyBoss(message) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error("Telegram config missing");
    }

    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });

    console.log("✅ Boss notified");
  } catch (error) {
    console.error("❌ notifyBoss error:", error.response?.data || error.message);
  }
}

module.exports = { notifyBoss };