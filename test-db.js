require("dotenv").config();
const mongoose = require('mongoose');

// ១. បង្កើតពុម្ពទិន្នន័យ (Schema)
const testSchema = new mongoose.Schema({
  name: String,
  message: String,
  date: { type: Date, default: Date.now }
});

// ២. ប្រើ Model
const Test = mongoose.model('Test', testSchema);

async function runTest() {
  try {
    // ភ្ជាប់ទៅ Database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 ភ្ជាប់ទៅ Database រួចរាល់...");

    // ៣. បង្កើតទិន្នន័យថ្មី
    const newTest = new Test({
      name: "Khmer-AI User",
      message: "សួស្តី MongoDB! ខ្ញុំអាចភ្ជាប់បានហើយ!"
    });

    // ៤. រក្សាទុក (Save)
    await newTest.save();
    console.log("✅ ទិន្នន័យត្រូវបានបញ្ជូនទៅកាន់ Cloud ជោគជ័យ!");

    // បិទការតភ្ជាប់
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ បញ្ហា៖", err);
  }
}

runTest();