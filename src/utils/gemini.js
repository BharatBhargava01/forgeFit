const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("\n⚠️  [ForgeFit AI] GEMINI_API_KEY is missing in your .env file.\n   AI Workout Generator will fall back to rule-based procedural generation.\n");
}

// Instantiate GoogleGenerativeAI SDK
const genAI = new GoogleGenerativeAI(apiKey || "MOCK_KEY");

module.exports = genAI;
