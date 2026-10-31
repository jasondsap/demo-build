/**
 * THE ONE FILE TO EDIT DURING THE LIVE BUILD.
 *
 * Every question lives here. The form, the results page, the validation and
 * the AI summary all read from this object, so changing the survey means
 * changing this file and nothing else.
 *
 * Ground rules (say them out loud in the room):
 *  - No names, emails, phone numbers, dates of birth or addresses. Ever.
 *  - Nothing that could identify a single person when combined.
 *  - Results are shown in aggregate only. The AI summarizes the room,
 *    never a respondent.
 */

/**
 * Branch logic. A question with showIf is only shown, and only accepted by the
 * server, when an EARLIER question has exactly this answer. Keep it to one rule
 * per question; if you need more than that, the survey is too long.
 */
export type ShowIf = { question: string; equals: string };

export type Question = (
  | { id: string; type: "single"; label: string; options: string[]; required?: boolean }
  | { id: string; type: "multi"; label: string; options: string[]; required?: boolean }
  | {
      id: string;
      type: "scale";
      label: string;
      min: number;
      max: number;
      minLabel?: string;
      maxLabel?: string;
      required?: boolean;
    }
  | { id: string; type: "text"; label: string; placeholder?: string; maxLength?: number; required?: boolean }
) & { showIf?: ShowIf };

export type Survey = {
  /** Changing the id starts a fresh result set. Old rows stay in the table. */
  id: string;
  title: string;
  intro: string;
  questions: Question[];
};

export const SURVEY: Survey = {
  id: "community-pulse-v2",
  title: "Community Pulse",
  intro:
    "Four quick questions about technology and AI in your community. Anonymous. No names, no contact details. Takes about one minute.",
  questions: [
    {
      id: "server_room",
      type: "single",
      label: "Do you know what a server room is?",
      options: ["Yes", "Not sure", "No"],
      required: true,
    },
    {
      id: "used_ai",
      type: "single",
      label: "Have you ever used an AI tool like Claude or ChatGPT?",
      options: ["Yes", "No"],
      required: true,
    },
    {
      id: "ai_tools",
      type: "multi",
      label: "Which AI tools have you used? (pick all that apply)",
      options: ["Claude", "ChatGPT", "Gemini", "Copilot", "Other"],
      required: true,
      showIf: { question: "used_ai", equals: "Yes" }, // only people who said Yes above
    },
    {
      id: "cashapp",
      type: "single",
      label: "Do you plan to send money through Cash App in the next month?",
      options: ["Yes", "No", "I don't use Cash App"],
      required: true,
    },
  ],
};

/** Shape of one stored submission: question id -> answer. */
export type Answers = Record<string, string | string[] | number>;

/** Should this question be shown, given the answers so far? Used by the form AND the server. */
export function isShown(q: Question, answers: Answers): boolean {
  return !q.showIf || answers[q.showIf.question] === q.showIf.equals;
}

/** Plain-English note for branched questions, shown on results and given to the AI. */
export function branchNote(q: Question): string | null {
  if (!q.showIf) return null;
  const parent = SURVEY.questions.find((p) => p.id === q.showIf!.question);
  return `Only asked of people who answered "${q.showIf.equals}" to "${parent?.label ?? q.showIf.question}".`;
}

/**
 * Server-side validation. Returns clean answers or a list of problems.
 * Unknown keys are dropped. Text is trimmed and capped. Branched questions
 * whose condition is not met are dropped too, even if the client sent them.
 */
export function validateAnswers(
  input: unknown,
): { ok: true; answers: Answers } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const answers: Answers = {};
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  for (const q of SURVEY.questions) {
    if (!isShown(q, answers)) continue; // answers so far: branches point at earlier questions
    const v = raw[q.id];
    const missing =
      v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

    if (missing) {
      if (q.required) errors.push(`"${q.label}" is required.`);
      continue;
    }

    switch (q.type) {
      case "single":
        if (typeof v === "string" && q.options.includes(v)) answers[q.id] = v;
        else errors.push(`"${q.label}" has an unexpected value.`);
        break;
      case "multi":
        if (Array.isArray(v) && v.every((x) => typeof x === "string" && q.options.includes(x))) {
          answers[q.id] = Array.from(new Set(v as string[]));
        } else errors.push(`"${q.label}" has an unexpected value.`);
        break;
      case "scale": {
        const n = typeof v === "number" ? v : Number(v);
        if (Number.isInteger(n) && n >= q.min && n <= q.max) answers[q.id] = n;
        else errors.push(`"${q.label}" must be between ${q.min} and ${q.max}.`);
        break;
      }
      case "text": {
        const max = q.maxLength ?? 500;
        const s = String(v).trim().slice(0, max);
        if (s) answers[q.id] = s;
        break;
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, answers };
}
