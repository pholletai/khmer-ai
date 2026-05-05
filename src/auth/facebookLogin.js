/**
 * src/auth/facebookLogin.js — Khmer AI
 * Facebook OAuth login router
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const FB_REDIRECT_URI = process.env.FB_REDIRECT_URI || "http://localhost:3000/auth/callback";

// GET /auth/login — redirect to Facebook OAuth
router.get("/auth/login", (_req, res) => {
  const scope = [
    "pages_messaging",
    "pages_read_engagement",
    "pages_manage_metadata",
    "pages_show_list",
  ].join(",");

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${FB_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}` +
    `&scope=${scope}` +
    `&response_type=code`;

  res.redirect(url);
});

// GET /auth/callback — handle Facebook OAuth callback
router.get("/auth/callback", async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      console.error("❌ Facebook OAuth denied:", error);
      return res.status(400).send("Facebook login was denied.");
    }

    if (!code) {
      return res.status(400).send("Missing authorization code.");
    }

    const tokenRes = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: FB_APP_ID,
          client_secret: FB_APP_SECRET,
          redirect_uri: FB_REDIRECT_URI,
          code,
        },
      }
    );

    const accessToken = tokenRes.data.access_token;
    console.log("✅ Facebook login success");

    res.redirect(`/?token=${accessToken}`);
  } catch (err) {
    console.error("❌ Facebook OAuth error:", err.response?.data || err.message);
    res.status(500).send("Facebook login failed. Check server logs.");
  }
});

// GET /auth/logout
router.get("/auth/logout", (_req, res) => {
  res.redirect("/");
});

module.exports = router;
