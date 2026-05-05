/**
 * test-db.js — Khmer AI
 * Quick smoke-test for database.js functions
 * Run: node test-db.js
 */

require("dotenv").config();

const {
  getUserMemory,
  saveUserMemory,
  deleteUserMemory,
  addMessage,
  getMessages,
  clearMessages,
  getUserCount,
} = require("./database");

const TEST_USER = "test-user-001";

console.log("=== Khmer AI — Database Test ===\n");

// 1. Save memory
saveUserMemory(TEST_USER, { name: "Test User", stage: "warm", interest: "bot" });
console.log("✅ saveUserMemory");

// 2. Read memory
const mem = getUserMemory(TEST_USER);
console.log("✅ getUserMemory:", JSON.stringify(mem));

// 3. Add messages
addMessage(TEST_USER, "user", "សួស្ដី! ខ្ញុំចង់ដឹងអំពី Khmer AI");
addMessage(TEST_USER, "assistant", "សួស្ដីបង! Khmer AI ជួយអ្នកលក់ + ឆ្លើយចាតដោយស្វ័យប្រវត្តិ 24/7 ។");
console.log("✅ addMessage (2 messages)");

// 4. Get messages
const msgs = getMessages(TEST_USER);
console.log(`✅ getMessages: ${msgs.length} message(s)`);
msgs.forEach((m) => console.log(`   [${m.role}] ${m.content}`));

// 5. User count
const count = getUserCount();
console.log(`✅ getUserCount: ${count} user(s)`);

// 6. Clean up
clearMessages(TEST_USER);
deleteUserMemory(TEST_USER);
console.log("✅ cleanup done");

console.log("\n=== All tests passed! ===");
