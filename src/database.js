const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "database.json");

function readDB() {
  if (!fs.existsSync(dbPath)) {
    return { pages: [] };
  }

  const raw = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(raw || '{"pages":[]}');
}

function getPageToken(pageId) {
  const db = readDB();
  const page = db.pages.find((p) => p.pageId === pageId);
  return page ? page.pageToken : null;
}

module.exports = {
  readDB,
  getPageToken
};