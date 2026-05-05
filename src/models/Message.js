/**
 * src/models/Message.js — Khmer AI
 * Message schema/factory for storing conversation messages
 */

/**
 * Create a new Message object
 * @param {string} userId
 * @param {string} role  - "user" | "assistant"
 * @param {string} content
 * @param {string} [type] - "text" | "image" | "audio"
 * @returns {object}
 */
function createMessage(userId, role, content, type = "text") {
  return {
    userId,
    role,
    content: String(content || "").trim(),
    type,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate a message object has required fields
 * @param {object} msg
 * @returns {boolean}
 */
function isValidMessage(msg) {
  return (
    msg &&
    typeof msg.userId === "string" &&
    typeof msg.role === "string" &&
    ["user", "assistant"].includes(msg.role) &&
    typeof msg.content === "string" &&
    msg.content.length > 0
  );
}

module.exports = { createMessage, isValidMessage };
