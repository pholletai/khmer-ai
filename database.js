const { MongoClient } = require("mongodb");

let client;
let db;

async function connectDB() {
  if (db) return db;

  client = new MongoClient(process.env.MONGODB_URL);
  await client.connect();

  db = client.db("khmer_ai");
  console.log("✅ MongoDB connected");
  return db;
}

async function loadDatabase() {
  const database = await connectDB();
  const pages = await database.collection("pages").find({}).toArray();

  const result = {};
  for (const page of pages) {
    result[page.pageId] = page.data;
  }

  return result;
}

async function saveDatabase(data) {
  const database = await connectDB();

  for (const pageId of Object.keys(data)) {
    await database.collection("pages").updateOne(
      { pageId },
      { $set: { pageId, data: data[pageId], updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

async function savePageData(pageId, pageData) {
  const database = await connectDB();

  await database.collection("pages").updateOne(
    { pageId },
    { $set: { pageId, data: pageData, updatedAt: new Date() } },
    { upsert: true }
  );
}

async function getPageData(pageId) {
  const database = await connectDB();

  const page = await database.collection("pages").findOne({ pageId });
  return page ? page.data : null;
}

async function getPageToken(pageId) {
  const pageData = await getPageData(pageId);
  return pageData?.page_access_token || null;
}

module.exports = {
  loadDatabase,
  saveDatabase,
  savePageData,
  getPageData,
  getPageToken,
};