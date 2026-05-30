import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/src/lib/pipeline/runner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await runPipeline(body.prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API GENERATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error)
      },
      { status: 500 }
    );
  }
}
