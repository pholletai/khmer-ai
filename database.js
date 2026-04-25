const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db;

async function loadDatabase() {
  if (!db) {
    db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
  }
  return db;
}

async function saveDatabase(db) {
  // SQLite saves automatically
}

function savePageData(pageId, pageData) {
  const db = loadDatabase();
  db[pageId] = {
    ...(db[pageId] || {}),
    ...pageData,
  };
  saveDatabase(db);
}

function getPageData(pageId) {
  const db = loadDatabase();
  return db[pageId] || null;
}

function getPageToken(pageId) {
  const db = loadDatabase();
  return db[pageId]?.page_access_token || null;
}

// ===============================================
// Initialize processed_messages table
// For webhook deduplication
// ===============================================
async function initProcessedMessagesTable() {
  const database = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
  
  await database.exec(`
    CREATE TABLE IF NOT EXISTS processed_messages (
      message_id TEXT PRIMARY KEY,
      processed_at TEXT NOT NULL,
      sender_id TEXT,
      message_text TEXT
    )
  `);
  
  console.log('✅ processed_messages table initialized');
  
  await database.close();
}

// Initialize table on module load
initProcessedMessagesTable().catch(err => {
  console.error('❌ Failed to initialize processed_messages table:', err);
});

module.exports = {
  loadDatabase,
  saveDatabase,
  savePageData,
  getPageData,
  getPageToken,
};