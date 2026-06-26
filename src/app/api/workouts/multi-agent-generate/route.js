import { NextResponse } from 'next/server';
import { runMultiAgentPipeline } from '@/lib/multiAgentPipeline';
import { generateWorkout } from '@/lib/generator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { muscles, difficulty, duration, equipment, goal = 'hypertrophy', profile = null } = body;

    if (!muscles || !Array.isArray(muscles) || muscles.length === 0) {
      return NextResponse.json({ error: "At least one target muscle group must be specified." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE" && apiKey.trim() !== "";

    // If no valid API key, fall back to rule-based generation immediately
    if (!hasValidKey) {
      console.warn("⚠️ No valid Gemini API key. Falling back to rule-based workout generator.");
      const fallbackWorkout = generateWorkout({ muscles, difficulty, duration, equipment, goal, profile });
      return NextResponse.json({ fallback: true, data: fallbackWorkout });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const pipeline = runMultiAgentPipeline({
            muscles,
            difficulty,
            duration,
            equipment,
            goal,
            profile
          });

          for await (const step of pipeline) {
            const dataText = JSON.stringify(step) + '\n';
            controller.enqueue(encoder.encode(dataText));
          }
          controller.close();
        } catch (error) {
          console.error("❌ Multi-Agent Pipeline failed, falling back to rule-based generator:", error);
          try {
            const fallbackWorkout = generateWorkout({ muscles, difficulty, duration, equipment, goal, profile });
            const fallbackPayload = JSON.stringify({ status: 'completed', data: fallbackWorkout, fallback: true }) + '\n';
            controller.enqueue(encoder.encode(fallbackPayload));
          } catch (fbErr) {
            console.error("❌ Rule-based fallback also failed:", fbErr);
            const errorPayload = JSON.stringify({ status: 'error', message: error.message }) + '\n';
            controller.enqueue(encoder.encode(errorPayload));
          }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error("❌ Multi-Agent API Route Error:", error);
    return NextResponse.json({ error: "Multi-agent API error: " + error.message }, { status: 500 });
  }
}
