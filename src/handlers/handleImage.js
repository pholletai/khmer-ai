const { readImageFromUrl } = require("../ai/readImage");
const { callOpenAI } = require("../ai/openai");

async function handleImage(imageUrl) {
  const imageText = await readImageFromUrl(imageUrl);
  return await callOpenAI(imageText);
}

module.exports = {
  handleImage
};