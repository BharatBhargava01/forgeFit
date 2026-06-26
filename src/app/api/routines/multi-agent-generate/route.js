import { NextResponse } from 'next/server';
import { runMultiAgentRoutinePipeline } from '@/lib/multiAgentPipeline';
import { checkRateLimit } from '@/utils/rateLimit';

export async function POST(request) {
  try {
    const rateLimit = await checkRateLimit(request, 'ai-generation', 2, 5);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Daily AI generation limit reached. Please try again in ${Math.ceil(rateLimit.resetInSeconds / 3600)} hours.` },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
      return NextResponse.json({ error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file." }, { status: 500 });
    }

    const body = await request.json();
    const { goal, splitType, daysPerWeek, profile = null } = body;

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
          console.error("❌ Multi-Agent Routine Pipeline Execution Error:", error);
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
    console.error("❌ Multi-Agent Routine API Route Error:", error);
    return NextResponse.json({ error: "Multi-agent API error: " + error.message }, { status: 500 });
  }
}
