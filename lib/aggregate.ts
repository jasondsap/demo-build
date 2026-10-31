import { SURVEY, type Answers, type Question } from "./survey";

/**
 * Turns raw submissions into counts. This is the ONLY thing the AI sees:
 * counts per option plus the anonymous free-text answers. Never a full row.
 */

export type OptionCount = { option: string; count: number };

export type QuestionSummary =
  | { question: Question; kind: "choice"; counts: OptionCount[]; answered: number }
  | {
      question: Question;
      kind: "scale";
      counts: OptionCount[];
      answered: number;
      average: number | null;
    }
  | { question: Question; kind: "text"; answers: string[]; answered: number };

export type Aggregate = { total: number; questions: QuestionSummary[] };

export function aggregate(rows: { answers: Answers }[]): Aggregate {
  const total = rows.length;
  const questions: QuestionSummary[] = SURVEY.questions.map((q) => {
    const values = rows
      .map((r) => r.answers[q.id])
      .filter((v) => v !== undefined && v !== null && v !== "");

    if (q.type === "single" || q.type === "multi") {
      const tally = new Map<string, number>(q.options.map((o) => [o, 0]));
      for (const v of values) {
        const list = Array.isArray(v) ? v : [v];
        for (const item of list) {
          const key = String(item);
          tally.set(key, (tally.get(key) ?? 0) + 1);
        }
      }
      return {
        question: q,
        kind: "choice" as const,
        counts: Array.from(tally, ([option, count]) => ({ option, count })),
        answered: values.length,
      };
    }

    if (q.type === "scale") {
      const tally = new Map<string, number>();
      for (let i = q.min; i <= q.max; i++) tally.set(String(i), 0);
      let sum = 0;
      for (const v of values) {
        const key = String(v);
        tally.set(key, (tally.get(key) ?? 0) + 1);
        sum += Number(v);
      }
      return {
        question: q,
        kind: "scale" as const,
        counts: Array.from(tally, ([option, count]) => ({ option, count })),
        answered: values.length,
        average: values.length ? Math.round((sum / values.length) * 10) / 10 : null,
      };
    }

    return {
      question: q,
      kind: "text" as const,
      answers: values.map((v) => String(v)),
      answered: values.length,
    };
  });

  return { total, questions };
}

/** Plain-text version of the aggregate, which is what goes into the AI prompt. */
export function aggregateToText(agg: Aggregate): string {
  const lines: string[] = [`Survey: ${SURVEY.title}`, `Total responses: ${agg.total}`, ""];
  for (const s of agg.questions) {
    lines.push(`Q: ${s.question.label}`);
    if (s.question.type === "scale") {
      const lo = s.question.minLabel ? ` (${s.question.minLabel})` : "";
      const hi = s.question.maxLabel ? ` (${s.question.maxLabel})` : "";
      lines.push(`  scale ${s.question.min}${lo} to ${s.question.max}${hi}`);
    }
    if (s.kind === "text") {
      if (!s.answers.length) lines.push("  (no answers)");
      for (const a of s.answers) lines.push(`  - ${a}`);
    } else {
      for (const c of s.counts) lines.push(`  ${c.option}: ${c.count}`);
      if (s.kind === "scale" && s.average !== null) lines.push(`  average: ${s.average}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
