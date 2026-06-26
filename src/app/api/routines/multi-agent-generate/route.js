import { NextResponse } from 'next/server';
import { runMultiAgentRoutinePipeline } from '@/lib/multiAgentPipeline';
import { generateRoutine } from '@/lib/routine';

export async function POST(request) {
  try {
    const body = await request.json();
    const { goal, splitType, daysPerWeek, profile = null } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE" && apiKey.trim() !== "";

    // If no valid API key, fall back to rule-based generation immediately
    if (!hasValidKey) {
      console.warn("⚠️ No valid Gemini API key. Falling back to rule-based routine generator.");
      const fallbackRoutine = generateRoutine({ goal, daysPerWeek, splitType, profile });
      return NextResponse.json({ fallback: true, data: fallbackRoutine });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const pipeline = runMultiAgentRoutinePipeline({
            goal,
            splitType,
            daysPerWeek,
            profile
          });

          for await (const step of pipeline) {
            const dataText = JSON.stringify(step) + '\n';
            controller.enqueue(encoder.encode(dataText));
          }
          controller.close();
        } catch (error) {
          console.error("❌ Multi-Agent Routine Pipeline failed, falling back to rule-based generator:", error);
          try {
            const fallbackRoutine = generateRoutine({ goal, daysPerWeek, splitType, profile });
            const fallbackPayload = JSON.stringify({ status: 'completed', data: fallbackRoutine, fallback: true }) + '\n';
            controller.enqueue(encoder.encode(fallbackPayload));
          } catch (fbErr) {
            console.error("❌ Rule-based routine fallback also failed:", fbErr);
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
    console.error("❌ Multi-Agent Routine API Route Error:", error);
    return NextResponse.json({ error: "Multi-agent API error: " + error.message }, { status: 500 });
  }
}
