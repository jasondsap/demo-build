import { NextResponse } from "next/server";
import { SURVEY, validateAnswers } from "@/lib/survey";
import { saveResponse, isDbConfigured } from "@/lib/db";

export const runtime = "nodejs";

/** POST /api/responses  { answers: { questionId: value } } */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const result = validateAnswers((body as { answers?: unknown })?.answers);
  if (!result.ok) {
    return NextResponse.json({ error: result.errors.join(" ") }, { status: 400 });
  }

  try {
    const saved = await saveResponse(SURVEY.id, result.answers);
    return NextResponse.json({ ok: true, id: saved.id, persisted: isDbConfigured() });
  } catch (err) {
    console.error("saveResponse failed", err);
    return NextResponse.json({ error: "Could not save your response. Please try again." }, { status: 500 });
  }
}
