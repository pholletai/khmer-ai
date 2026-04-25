// src/server/readText.js (CommonJS)
const fs = require("fs");

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch (err) {
    return "";
  }
}

module.exports = { readText };
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    console.error("❌ JSON parse failed:", err.message);
    return res.status(400).send("Invalid JSON");
  }
  next(err);
});