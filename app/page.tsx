import { SURVEY } from "@/lib/survey";
import { isDbConfigured } from "@/lib/db";
import SurveyForm from "@/components/SurveyForm";
import DemoModeBanner from "@/components/DemoModeBanner";

export const dynamic = "force-dynamic";

export default function SurveyPage() {
  return (
    <div className="space-y-6">
      {!isDbConfigured() && <DemoModeBanner />}
      <div>
        <h1 className="text-3xl font-semibold text-navy">{SURVEY.title}</h1>
        <p className="mt-2 text-muted">{SURVEY.intro}</p>
      </div>
      <SurveyForm survey={SURVEY} />
    </div>
  );
}
