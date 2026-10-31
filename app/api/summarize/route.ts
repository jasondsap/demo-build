import { NextResponse } from "next/server";
import { SURVEY } from "@/lib/survey";
import { listResponses } from "@/lib/db";
import { aggregate, aggregateToText } from "@/lib/aggregate";
import { isAiConfigured, summarizeAggregate } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/summarize  -> { summary, total } */
export async function POST() {
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local (or Vercel env) and restart." },
      { status: 503 },
    );
  }

  const rows = await listResponses(SURVEY.id);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No responses yet. Fill out the survey first." }, { status: 400 });
  }

  const agg = aggregate(rows);

  try {
    const summary = await summarizeAggregate(aggregateToText(agg));
    return NextResponse.json({ summary, total: agg.total });
  } catch (err) {
    console.error("summarize failed", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `AI summary failed: ${message}` }, { status: 502 });
  }
}
