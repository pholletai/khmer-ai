/**
 * src/memory/memory.js — Khmer AI
 * User memory & conversation history (wraps database.js)
 */

const {
  getUserMemory,
  saveUserMemory,
  deleteUserMemory,
  addMessage,
  getMessages,
  clearMessages,
} = require("../../database");

function addHistory(userId, role, content) {
  addMessage(userId, role, content);
}

function getHistory(userId, limit = 10) {
  return getMessages(userId, limit);
}

function clearHistory(userId) {
  clearMessages(userId);
}

module.exports = {
  getUserMemory,
  saveUserMemory,
  deleteUserMemory,
  addHistory,
  getHistory,
  clearHistory,
};
