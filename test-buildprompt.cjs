const { buildPrompt } = require("./src/server/buildPrompt");

const out = buildPrompt({
  extraPrompt: "សូមធ្វើជា AI ជំនួយការងារ",
  userInput: "Hello from test",
});

console.log(out);