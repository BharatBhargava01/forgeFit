import { NextResponse } from 'next/server';
import { runMultiAgentBlueprintPipeline } from '@/lib/multiAgentPipeline';

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
      return NextResponse.json({ error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file." }, { status: 500 });
    }

    const body = await request.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json({ error: "Profile data is required." }, { status: 400 });
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
          console.error("❌ Multi-Agent Blueprint Pipeline Execution Error:", error);
          const errorPayload = JSON.stringify({ status: 'error', message: error.message }) + '\n';
          controller.enqueue(encoder.encode(errorPayload));
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

