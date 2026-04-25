require("dotenv").config();

const express = require("express");
const axios = require("axios");
const { savePageData } = require("../../database.js");

const router = express.Router();

router.get("/auth/facebook", (req, res) => {
  const appId = process.env.FB_APP_ID;
  const redirectUri = process.env.FB_REDIRECT;

  if (!appId || !redirectUri) {
    return res.status(500).send("Missing FB_APP_ID or FB_REDIRECT in .env");
  }

  const authUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=pages_show_list,pages_manage_metadata,pages_messaging`;

  res.redirect(authUrl);
});

router.get("/auth/facebook/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No code received from Facebook");
  }

  try {
    const tokenResponse = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: process.env.FB_APP_ID,
          client_secret: process.env.FB_APP_SECRET,
          redirect_uri: process.env.FB_REDIRECT,
          code
        }
      }
    );

    const userAccessToken = tokenResponse.data.access_token;

    const pagesResponse = await axios.get(
      "https://graph.facebook.com/v19.0/me/accounts",
      {
        params: {
          access_token: userAccessToken
        }
      }
    );

    const pages = pagesResponse.data.data || [];

    for (const page of pages) {
      let instagramBusinessId = null;

      try {
        const igResponse = await axios.get(
          `https://graph.facebook.com/v19.0/${page.id}`,
          {
            params: {
              fields: "instagram_business_account",
              access_token: page.access_token
            }
          }
        );

        instagramBusinessId =
          igResponse.data?.instagram_business_account?.id || null;
      } catch (igError) {
        console.error(
          `IG lookup failed for page ${page.id}:`,
          igError.response?.data || igError.message
        );
      }

      savePageData(page.id, {
        page_name: page.name,
        page_access_token: page.access_token,
        instagram_business_id: instagramBusinessId
      });
    }

    return res.json({
      message: "Facebook login success",
      saved_pages: pages.map((page) => ({
        page_id: page.id,
        page_name: page.name
      }))
    });
  } catch (error) {
    console.error(
      "Facebook callback error:",
      error.response?.data || error.message
    );
    return res.status(500).send("Authentication failed");
  }
});

module.exports = router;