import type { Aggregate } from "@/lib/aggregate";

/** Server component. Plain CSS bars, no chart library, nothing to break. */
export default function ResultsCharts({ aggregate }: { aggregate: Aggregate }) {
  if (aggregate.total === 0) {
    return (
      <div className="bg-white rounded-xl border border-line p-8 text-center text-muted">
        No responses yet. Share the survey link and refresh this page.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {aggregate.questions.map((s) => (
        <section key={s.question.id} className="bg-white rounded-xl border border-line p-5">
          <h2 className="font-medium text-navy">{s.question.label}</h2>
          <p className="text-xs text-muted mt-0.5">
            {s.answered} answered
            {s.kind === "scale" && s.average !== null && <> · average {s.average}</>}
          </p>

          {s.kind !== "text" && (
            <ul className="mt-3 space-y-2">
              {s.counts.map((c) => {
                const pct = s.answered ? Math.round((c.count / s.answered) * 100) : 0;
                return (
                  <li key={c.option}>
                    <div className="flex justify-between text-sm">
                      <span>{c.option}</span>
                      <span className="text-muted tabular-nums">
                        {c.count} <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-mist overflow-hidden">
                      <div className="h-full bg-teal" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {s.kind === "text" && (
            <ul className="mt-3 space-y-2">
              {s.answers.length === 0 && <li className="text-sm text-muted">No written answers yet.</li>}
              {s.answers.map((a, i) => (
                <li key={i} className="rounded-lg bg-mist px-3 py-2 text-sm">
                  “{a}”
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
