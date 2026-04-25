const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true }, // ID របស់អ្នកប្រើ (Facebook ID)
  text: { type: String, required: true },     // ខ្លឹមសារសារ
  reply: { type: String },                    // សារដែល AI ឆ្លើយតប
  timestamp: { type: Date, default: Date.now } // ពេលវេលា
});

module.exports = mongoose.model('Message', messageSchema);