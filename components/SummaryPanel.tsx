"use client";

import { useState } from "react";

/** Section headings the prompt in lib/ai.ts asks for. Rendered bold. */
const HEADINGS = new Set([
  "what stands out",
  "what people say would help",
  "suggested next steps",
  "caveats",
]);

export default function SummaryPanel({ total, aiConfigured }: { total: number; aiConfigured: boolean }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/summarize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Summary failed.");
        return;
      }
      setSummary(data.summary);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium text-navy">AI summary</h2>
          <p className="text-xs text-muted mt-0.5">
            Claude reads the counts and the anonymous comments, never a single response.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading || total === 0 || !aiConfigured}
          className="shrink-0 rounded-lg bg-teal px-4 py-2 text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Reading..." : summary ? "Run again" : "Summarize the room"}
        </button>
      </div>

      {!aiConfigured && (
        <p className="mt-3 text-sm text-gold">
          ANTHROPIC_API_KEY is not set, so this button is off. The counts below still work.
        </p>
      )}

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {summary && (
        <div className="mt-4 whitespace-pre-wrap rounded-lg bg-mist p-4 text-sm leading-relaxed">
          {summary.split("\n").map((line, i) =>
            HEADINGS.has(line.trim().replace(/:$/, "").toLowerCase()) ? (
              <div key={i} className={"font-semibold text-navy" + (i > 0 ? " mt-3" : "")}>
                {line}
              </div>
            ) : (
              <div key={i}>{line}</div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
