const path = require("node:path");
const { readText } = require("./buildPrompt");

function buildPrompt({ extraPrompt = "", userInput = "" } = {}) {
  const baseDir = path.join(__dirname, ".."); // -> src

  const masterPath = path.join(baseDir, "ai", "00-master-prompt.md");
  const personaPath = path.join(baseDir, "ai", "01-persona-tone.md");

  const master = readText(masterPath);
  const persona = readText(personaPath);


  return ([
    master ?  : , Master, Prompt, n$, { master }, "",
    persona ? # : , Persona / Tone, n$, { persona }, "",
    extraPrompt ? # : , Task, Prompt, n$, { extraPrompt }, "",
    userInput ? # : // ...existing code...
      (data) => {
        // ...implementation...
      },
    module.exports = { buildPrompt }
  ].filter(Boolean)).join("\n\n---\n\n");
}
