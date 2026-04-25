function detectStage(text = "") {
  const t = String(text).toLowerCase();

  const readyToCloseWords = [
    "ទិញ",
    "ចង់បាន",
    "យក",
    "ចាប់ផ្ដើម",
    "start",
    "buy",
    "price",
    "pricing",
    "package",
    "pro",
    "basic",
    "pro+",
    "តម្លៃ",
    "ប៉ុន្មាន",
  ];

  const pricingWords = [
    "price",
    "pricing",
    "cost",
    "package",
    "plan",
    "តម្លៃ",
    "ប៉ុន្មាន",
    "គម្រោង",
  ];

  const interestedWords = [
    "ai",
    "bot",
    "chatbot",
    "messenger",
    "facebook",
    "ឆ្លើយឆាត",
    "លក់",
    "ជួយ",
    "ប្រើ",
    "បានអ្វីខ្លះ",
  ];

  if (readyToCloseWords.some((w) => t.includes(w))) {
    return "ready_to_close";
  }

  if (pricingWords.some((w) => t.includes(w))) {
    return "pricing";
  }

  if (interestedWords.some((w) => t.includes(w))) {
    return "interested";
  }

  return "warm";
}

function getHigherStage(currentStage, detectedStage) {
  const rank = {
    warm: 1,
    interested: 2,
    pricing: 3,
    ready_to_close: 4,
  };

  return rank[detectedStage] > rank[currentStage]
    ? detectedStage
    : currentStage;
}

module.exports = {
  detectStage,
  getHigherStage,
};