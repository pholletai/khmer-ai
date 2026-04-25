const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database.json');
const MAX_HISTORY = 10; // keep last 10 turns

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return {};
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw || '{}');
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getMemory(senderId) {
  const db = loadDB();
  if (!db.users) db.users = {};
  if (!db.users[senderId]) {
    db.users[senderId] = {
      chat_history: [],
      user_profile: { name: null, language: 'km', preferences: [] },
      sell_context: { cart: [], last_product: null, intent: null }
    };
    saveDB(db);
  }
  return db.users[senderId];
}

function saveMemory(senderId, memory) {
  const db = loadDB();
  if (!db.users) db.users = {};
  // Trim history to MAX_HISTORY turns
  if (memory.chat_history.length > MAX_HISTORY * 2) {
    memory.chat_history = memory.chat_history.slice(-MAX_HISTORY * 2);
  }
  db.users[senderId] = memory;
  saveDB(db);
}

function addMessage(senderId, role, content) {
  const memory = getMemory(senderId);
  memory.chat_history.push({ role, content });
  saveMemory(senderId, memory);
  return memory;
}

function clearHistory(senderId) {
  const memory = getMemory(senderId);
  memory.chat_history = [];
  saveMemory(senderId, memory);
}

module.exports = { getMemory, saveMemory, addMessage, clearHistory };