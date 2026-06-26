import { NextResponse } from 'next/server';
import { runMultiAgentBlueprintPipeline } from '@/lib/multiAgentPipeline';
import { generateBlueprint } from '@/lib/generator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json({ error: "Profile data is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE" && apiKey.trim() !== "";

    // If no valid API key, fall back to rule-based generation immediately
    if (!hasValidKey) {
      console.warn("⚠️ No valid Gemini API key. Falling back to rule-based profile blueprint generator.");
      const fallbackBlueprint = generateBlueprint({ profile });
      return NextResponse.json({ fallback: true, data: fallbackBlueprint });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const pipeline = runMultiAgentBlueprintPipeline({ profile });

          for await (const step of pipeline) {
            const dataText = JSON.stringify(step) + '\n';
            controller.enqueue(encoder.encode(dataText));
          }
          controller.close();
        } catch (error) {
          console.error("❌ Multi-Agent Blueprint Pipeline Execution Error, falling back:", error);
          try {
            const fallbackBlueprint = generateBlueprint({ profile });
            const fallbackPayload = JSON.stringify({ status: 'completed', data: fallbackBlueprint, fallback: true }) + '\n';
            controller.enqueue(encoder.encode(fallbackPayload));
          } catch (fbErr) {
            console.error("❌ Rule-based blueprint fallback also failed:", fbErr);
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
    console.error("❌ Profile analysis multi-agent error:", error);
    return NextResponse.json({ error: "Gemini API error: " + error.message }, { status: 500 });
  }
}

