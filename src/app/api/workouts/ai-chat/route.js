import { NextResponse } from 'next/server';
import genAI from '@/utils/gemini';

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, userProfile } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing conversation history." }, { status: 400 });
    }

    // Format chat history for Gemini
    const systemPrompt = `You are "ForgeFit AI Coach", a professional, encouraging, and highly knowledgeable personal trainer, nutritionist, and sports scientist.
Your job is to answer the user's fitness, workout, and nutrition questions.
Be concise, practical, and highly motivating. Use bullet points, emoji, and bold text where relevant.
User Profile Info (if available):
${userProfile ? JSON.stringify(userProfile) : 'Guest user (no stats logged yet)'}
Provide actionable recommendations. Keep answers under 3-4 short paragraphs unless they ask for a detailed routine. Do not use markdown heading tags (like # or ##) in the chat response to keep the chat bubbles clean. Use bold text for subheadings instead.`;

    const formattedMessages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: "Understood! I'm your ForgeFit AI Coach. Let's smash your goals! What are we focusing on today?" }]
      }
    ];

    // Map incoming messages to Gemini roles & parts
    messages.forEach(msg => {
      // Gemini expects role: 'user' or 'model'
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      formattedMessages.push({
        role: role,
        parts: [{ text: msg.content }]
      });
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent({
      contents: formattedMessages,
    });

    const reply = result.response.text();

    return NextResponse.json({ content: reply });
  } catch (error) {
    console.error("❌ Gemini Chat API Error:", error);
    return NextResponse.json({ error: "Gemini API error: " + error.message }, { status: 500 });
  }
}
