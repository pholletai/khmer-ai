const SYSTEM_KHMER = "សូមឆ្លើយជាភាសាខ្មែរតែប៉ុណ្ណោះ ហើយហាមប្រើភាសាផ្សេងទៀត។";
// src/server/buildPrompt.js  (CommonJS)

const fs   = require("fs");
const path = require("path");

/* អាន​ឯកសារ UTF-8 បានយកតែសារ – បើមិនមាន ទៅវិញជា "" */
function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return "";
  }
}

/**
 * buildPrompt()
 *  – extraPrompt  : ប្រើ prompt ពិសេស (យកពី prompts.md ឬ dynamic)
 *  – userInput    : សារ / កូដ / ឯកសារ preview របស់អ្នកប្រើ
 * ត្រឡប់ជា string តែមួយ រៀបអោយរបៀប “---” បំបែក Block
 */
function buildPrompt({ extraPrompt = "", userInput = "" } = {}) {

  const baseDir      = path.join(__dirname, "..");          // → src/
  const masterPath   = path.join(baseDir, "ai", "00-master-prompt.md");
  const personaPath  = path.join(baseDir, "ai", "01-persona-tone.md");

  const master  = readText(masterPath);
  const persona = readText(personaPath);

const parts = [
  SYSTEM_KHMER ? `# System\n${SYSTEM_KHMER}` : "",
  master ? `# Master Prompt\n${master}` : "",
  persona ? `# Persona / Tone\n${persona}` : "",
  extraPrompt ? `# Task Prompt\n${extraPrompt}` : "",
  userInput ? `# User Input\n${userInput}` : ""
].filter(Boolean);
// បោះចោល String ទទេ

  return parts.join("\n\n---\n\n");
}

module.exports = { buildPrompt };