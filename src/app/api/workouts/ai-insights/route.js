import { NextResponse } from 'next/server';
import genAI from '@/utils/gemini';
import { SchemaType } from '@google/generative-ai';

const insightsResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "A motivating and concise summary of the user's training history and progress.",
    },
    strengths: {
      type: SchemaType.ARRAY,
      description: "Specific strengths observed in their training (e.g. consistency, progressive overload). Provide at least 2.",
      items: { type: SchemaType.STRING }
    },
    weaknesses: {
      type: SchemaType.ARRAY,
      description: "Areas for improvement, potential imbalances, or recovery optimization. Provide at least 2.",
      items: { type: SchemaType.STRING }
    },
    optimizationRecommendations: {
      type: SchemaType.ARRAY,
      description: "Actionable, specific training advice for optimizing their results.",
      items: { type: SchemaType.STRING }
    },
    suggestedNextWorkout: {
      type: SchemaType.STRING,
      description: "A concrete recommendation for what they should train next, including suggested muscle groups.",
    }
  },
  required: ["summary", "strengths", "weaknesses", "optimizationRecommendations", "suggestedNextWorkout"]
};

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
      return NextResponse.json({ error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file." }, { status: 500 });
    }

    const body = await request.json();
    const { logs } = body;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ error: "No training logs provided for analysis." }, { status: 400 });
    }

    // Condense logs to fit prompt window and keep tokens low
    const logsSummary = logs.slice(0, 10).map(log => ({
      name: log.name,
      durationMinutes: Math.round((log.durationSeconds || 0) / 60),
      date: log.date || log.loggedAt,
      exercises: (log.exercises || []).map(ex => ({
        name: ex.name,
        muscles: ex.muscles,
        equipment: ex.equipment,
        setsCount: (ex.sets || []).length,
        sets: (ex.sets || []).map(s => ({
          weight: s.weight,
          reps: s.reps,
          completed: s.completed
        }))
      }))
    }));

    const prompt = `
      You are an expert fitness coach, personal trainer, and sports scientist. Analyze the user's recent training history (workout logs) and provide highly personalized insights and recommendations for optimizing their workouts.
      
      Here is the user's recent training history (past 10 logs):
      ${JSON.stringify(logsSummary)}
      
      Please analyze:
      1. Muscle balance and frequency distribution (are any muscle groups neglected?).
      2. Volume (sets/reps) and progression (is there progressive overload?).
      3. Consistency and session durations.
      
      Provide your analysis in the required JSON format containing:
      - summary: A summary of their training over this period.
      - strengths: At least 2 points of strength.
      - weaknesses: At least 2 points of weakness or areas to optimize.
      - optimizationRecommendations: Actionable, specific training advice for optimizing their results.
      - suggestedNextWorkout: A recommendation for what they should train next, and why. Mention the specific muscle groups recommended (e.g. Chest, Quads, Back, Shoulders, Hamstrings, Glutes, Calves, Triceps, Biceps) clearly so the app can detect and pre-fill them for the user.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: insightsResponseSchema,
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const insightsData = JSON.parse(responseText);

    return NextResponse.json(insightsData);
  } catch (error) {
    console.error("❌ Gemini Insights API Error:", error);
    return NextResponse.json({ error: "Gemini API error: " + error.message }, { status: 500 });
  }
}
