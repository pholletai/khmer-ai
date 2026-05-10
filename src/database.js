const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "database.json");

// ========================
// DB Read/Write
// ========================
function readDB() {
  if (!fs.existsSync(dbPath)) return { pages: [], users: {}, messages: {} };
  const raw = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(raw || '{"pages":[],"users":{},"messages":{}}');
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
}

// ========================
// Page Token
// ========================
function getPageToken(pageId) {
  const db = readDB();
  const page = db.pages.find((p) => p.pageId === pageId);
  return page ? page.pageToken : null;
}

// ========================
// User Memory
// ========================
function getUserMemory(userId) {
  const db = readDB();
  return db.users?.[userId] || {};
}

function saveUserMemory(userId, data) {
  const db = readDB();
  if (!db.users) db.users = {};
  db.users[userId] = { ...(db.users[userId] || {}), ...data };
  writeDB(db);
}

function deleteUserMemory(userId) {
  const db = readDB();
  if (db.users) delete db.users[userId];
  writeDB(db);
}

// ========================
// Messages / History
// ========================
function addMessage(userId, role, content) {
  const db = readDB();
  if (!db.messages) db.messages = {};
  if (!db.messages[userId]) db.messages[userId] = [];
  db.messages[userId].push({ role, content, time: Date.now() });
  // Keep last 20 only
  if (db.messages[userId].length > 20) {
    db.messages[userId] = db.messages[userId].slice(-20);
  }
  writeDB(db);
}

function getMessages(userId, limit = 10) {
  const db = readDB();
  const msgs = db.messages?.[userId] || [];
  return msgs.slice(-limit).map(({ role, content }) => ({ role, content }));
}

function clearMessages(userId) {
  const db = readDB();
  if (db.messages) delete db.messages[userId];
  writeDB(db);
}

module.exports = {
  readDB,
  getPageToken,
  getUserMemory,
  saveUserMemory,
  deleteUserMemory,
  addMessage,
  getMessages,
  clearMessages,
};