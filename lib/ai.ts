import Anthropic from "@anthropic-ai/sdk";

/**
 * The AI step. One call, aggregate data in, a short written summary out.
 *
 * Why this is a "green tier" use of AI:
 *  - The model never sees a person, only counts and anonymous sentences.
 *  - Nothing it writes triggers an action. A human reads it and decides.
 *  - If the key is missing or the call fails, the counts still show.
 */

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `You are helping a rural public health team read the results of a short anonymous community survey.

You will receive aggregate counts and a list of anonymous free-text answers. Write a brief plain-language summary for the team.

Rules:
- Summarize the group. Never describe, guess about, or single out an individual respondent.
- Do not invent numbers. Only use counts that appear in the data.
- If the sample is small (under 20), say so plainly and treat findings as a starting point, not a conclusion.
- Do not give medical advice or make clinical claims.
- Keep it under 250 words.
- Plain text only. No markdown, no asterisks, no pound signs. Each heading on its own line, list items with a leading dash.

Format exactly these sections, as plain text with these headings:
What stands out
What people say would help
Suggested next steps (three, each one sentence, each something a local team could actually do)
Caveats`;

export async function summarizeAggregate(aggregateText: string): Promise<string> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    output_config: { effort: "low" }, // fast; this is a short summary, not a hard problem
    messages: [{ role: "user", content: `Here are the survey results:\n\n${aggregateText}` }],
  });

  if (response.stop_reason === "refusal") {
    return "The model declined to summarize this data. The counts above are still accurate.";
  }

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .replace(/\*\*/g, "") // belt and braces: strip markdown if the model slips
    .replace(/^#+\s*/gm, "")
    .trim();
}
