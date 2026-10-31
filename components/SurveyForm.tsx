"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isShown, type Survey, type Answers } from "@/lib/survey";

export default function SurveyForm({ survey }: { survey: Survey }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(id: string, value: string | string[] | number) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function toggleMulti(id: string, option: string) {
    const current = (answers[id] as string[] | undefined) ?? [];
    set(id, current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/thanks");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {survey.questions.filter((q) => isShown(q, answers)).map((q, idx) => (
        <fieldset key={q.id} className="bg-white rounded-xl border border-line p-5">
          <legend className="sr-only">{q.label}</legend>
          <div className="font-medium text-navy">
            <span className="text-teal mr-2">{idx + 1}.</span>
            {q.label}
            {q.required && <span className="text-gold ml-1" aria-hidden>*</span>}
          </div>

          {q.type === "single" && (
            <div className="mt-3 grid gap-2">
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => set(q.id, opt)}
                    className="h-4 w-4 accent-teal"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "multi" && (
            <div className="mt-3 grid gap-2">
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name={q.id}
                    value={opt}
                    checked={((answers[q.id] as string[] | undefined) ?? []).includes(opt)}
                    onChange={() => toggleMulti(q.id, opt)}
                    className="h-4 w-4 accent-teal"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "scale" && (
            <div className="mt-3">
              <div className="flex gap-2">
                {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set(q.id, n)}
                    aria-pressed={answers[q.id] === n}
                    className={
                      "flex-1 rounded-lg border py-2 font-medium transition " +
                      (answers[q.id] === n
                        ? "bg-teal text-white border-teal"
                        : "bg-white border-line hover:bg-mist")
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
              {(q.minLabel || q.maxLabel) && (
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>{q.minLabel}</span>
                  <span>{q.maxLabel}</span>
                </div>
              )}
            </div>
          )}

          {q.type === "text" && (
            <textarea
              name={q.id}
              rows={3}
              maxLength={q.maxLength ?? 500}
              placeholder={q.placeholder}
              value={(answers[q.id] as string | undefined) ?? ""}
              onChange={(e) => set(q.id, e.target.value)}
              className="mt-3 w-full rounded-lg border border-line p-3 focus:outline-none focus:ring-2 focus:ring-teal"
            />
          )}
        </fieldset>
      ))}

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-navy px-4 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Submit"}
      </button>
    </form>
  );
}
