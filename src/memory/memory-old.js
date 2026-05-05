/**
 * src/memory/memory-old.js — Khmer AI
 * Legacy in-memory store (no persistence). Kept for reference.
 * Use src/memory/memory.js for the current persistent version.
 */

const store = {}; // { userId: { ...profile } }
const history = {}; // { userId: [{ role, content }] }

const MAX_HISTORY = 20;

function getUserMemory(userId) {
  return store[userId] || {};
}

function saveUserMemory(userId, data = {}) {
  store[userId] = { ...(store[userId] || {}), ...data };
}

function deleteUserMemory(userId) {
  delete store[userId];
  delete history[userId];
}

function addHistory(userId, role, content) {
  if (!history[userId]) history[userId] = [];
  history[userId].push({ role, content, timestamp: new Date().toISOString() });
  if (history[userId].length > MAX_HISTORY) {
    history[userId] = history[userId].slice(-MAX_HISTORY);
  }
}

function getHistory(userId, limit = 10) {
  return (history[userId] || []).slice(-limit);
}

function clearHistory(userId) {
  history[userId] = [];
}

module.exports = {
  getUserMemory,
  saveUserMemory,
  deleteUserMemory,
  addHistory,
  getHistory,
  clearHistory,
};
