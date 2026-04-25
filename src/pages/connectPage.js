import axios from "axios";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

export const connectPage = async (pageId) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${pageId}?fields=name,access_token&access_token=${PAGE_ACCESS_TOKEN}`;
    const res = await axios.get(url);

    const data = res.data;

    console.log("✅ Connected Page:", data);

    return {
      pageId: data.id,
      name: data.name,
      access_token: data.access_token,
    };
  } catch (error) {
    console.error("❌ Error connectPage:", error.response?.data || error.message);
    throw error;
  }
};