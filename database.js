/**
 * database.js — Khmer AI
 * Simple JSON file-based database for storing user data & memory
 */

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "database.json");

// =========================
// Initialize DB
// =========================
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, messages: {} }, null, 2), "utf-8");
    console.log("✅ database.json created");
  }
}

// =========================
// Read DB
// =========================
function readDB() {
  try {
    initDB();
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ readDB error:", err.message);
    return { users: {}, messages: {} };
  }
}

// =========================
// Write DB
// =========================
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("❌ writeDB error:", err.message);
    return false;
  }
}

// =========================
// User memory functions
// =========================

/**
 * Get user memory by userId
 * @param {string} userId
 * @returns {object}
 */
function getUserMemory(userId) {
  const db = readDB();
  return db.users[userId] || {};
}

/**
 * Save / update user memory
 * @param {string} userId
 * @param {object} data
 */
function saveUserMemory(userId, data = {}) {
  const db = readDB();
  db.users[userId] = {
    ...(db.users[userId] || {}),
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeDB(db);
}

/**
 * Delete user memory
 * @param {string} userId
 */
function deleteUserMemory(userId) {
  const db = readDB();
  delete db.users[userId];
  writeDB(db);
}

// =========================
// Message history functions
// =========================

/**
 * Add message to history
 * @param {string} userId
 * @param {string} role - "user" | "assistant"
 * @param {string} content
 */
function addMessage(userId, role, content) {
  const db = readDB();
  if (!db.messages[userId]) {
    db.messages[userId] = [];
  }

  db.messages[userId].push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 20 messages per user
  if (db.messages[userId].length > 20) {
    db.messages[userId] = db.messages[userId].slice(-20);
  }

  writeDB(db);
}

/**
 * Get message history for user
 * @param {string} userId
 * @param {number} limit
 * @returns {Array}
 */
function getMessages(userId, limit = 10) {
  const db = readDB();
  const history = db.messages[userId] || [];
  return history.slice(-limit);
}

/**
 * Clear message history for user
 * @param {string} userId
 */
function clearMessages(userId) {
  const db = readDB();
  db.messages[userId] = [];
  writeDB(db);
}

// =========================
// Stats / Admin functions
// =========================

/**
 * Get all users
 * @returns {object}
 */
function getAllUsers() {
  const db = readDB();
  return db.users || {};
}

/**
 * Get total user count
 * @returns {number}
 */
function getUserCount() {
  const db = readDB();
  return Object.keys(db.users || {}).length;
}

// =========================
// Init on load
// =========================
initDB();

module.exports = {
  getUserMemory,
  saveUserMemory,
  deleteUserMemory,
  addMessage,
  getMessages,
  clearMessages,
  getAllUsers,
  getUserCount,
  readDB,
  writeDB,
};