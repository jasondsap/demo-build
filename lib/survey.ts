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

export type Question =
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
  | { id: string; type: "text"; label: string; placeholder?: string; maxLength?: number; required?: boolean };

export type Survey = {
  /** Changing the id starts a fresh result set. Old rows stay in the table. */
  id: string;
  title: string;
  intro: string;
  questions: Question[];
};

export const SURVEY: Survey = {
  id: "community-pulse-v1",
  title: "Community Pulse",
  intro:
    "Five quick questions about health in your community. Anonymous. No names, no contact details. Takes about one minute.",
  questions: [
    {
      id: "role",
      type: "single",
      label: "Which best describes you?",
      options: [
        "Community member",
        "Public health staff",
        "Clinician or provider",
        "Peer or recovery support worker",
        "Student or trainee",
        "Other",
      ],
      required: true,
    },
    {
      id: "top_concern",
      type: "single",
      label: "What is the biggest health concern in your community right now?",
      options: [
        "Substance use",
        "Mental health",
        "Chronic disease (diabetes, heart, lung)",
        "Access to care",
        "Housing or food insecurity",
        "Other",
      ],
      required: true,
    },
    {
      id: "barriers",
      type: "multi",
      label: "What makes it hardest for people to get care? (pick all that apply)",
      options: [
        "Distance or transportation",
        "Cost or insurance",
        "Wait times",
        "Stigma",
        "Not knowing where to go",
        "Clinic hours",
        "Internet or phone access",
      ],
    },
    {
      id: "ease_of_help",
      type: "scale",
      label: "How easy is it to get help when someone needs it?",
      min: 1,
      max: 5,
      minLabel: "Very hard",
      maxLabel: "Very easy",
      required: true,
    },
    {
      id: "one_change",
      type: "text",
      label: "If one thing changed tomorrow, what would help most?",
      placeholder: "A sentence or two. Please do not include names.",
      maxLength: 500,
    },
  ],
};

/** Shape of one stored submission: question id -> answer. */
export type Answers = Record<string, string | string[] | number>;

/**
 * Server-side validation. Returns clean answers or a list of problems.
 * Unknown keys are dropped. Text is trimmed and capped.
 */
export function validateAnswers(
  input: unknown,
): { ok: true; answers: Answers } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const answers: Answers = {};
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  for (const q of SURVEY.questions) {
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
