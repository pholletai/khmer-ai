const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Blog SEO page route
app.get("/blog/ai-chatbot", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "publicblog-ai-chatbot.html"));
});

// Health check for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`Khmer AI server running on port ${PORT}`);
});