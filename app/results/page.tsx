import { SURVEY } from "@/lib/survey";
import { listResponses, isDbConfigured } from "@/lib/db";
import { aggregate } from "@/lib/aggregate";
import { isAiConfigured } from "@/lib/ai";
import ResultsCharts from "@/components/ResultsCharts";
import SummaryPanel from "@/components/SummaryPanel";
import DemoModeBanner from "@/components/DemoModeBanner";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const rows = await listResponses(SURVEY.id);
  const agg = aggregate(rows);

  return (
    <div className="space-y-6">
      {!isDbConfigured() && <DemoModeBanner />}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-navy">Results</h1>
          <p className="mt-1 text-muted">{SURVEY.title}. Aggregate only.</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-semibold text-teal leading-none">{agg.total}</div>
          <div className="text-xs uppercase tracking-wide text-muted">responses</div>
        </div>
      </div>

      <SummaryPanel total={agg.total} aiConfigured={isAiConfigured()} />

      <ResultsCharts aggregate={agg} />
    </div>
  );
}
