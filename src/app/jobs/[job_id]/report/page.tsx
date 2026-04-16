import { getJobReport } from "@/lib/supabase/queries";
import MarkdownRenderer from "@/components/jobs/MarkdownRenderer";
import Link from "next/link";

interface ReportPageProps {
  params: Promise<{ job_id: string }>;
}

// Legitimacy tier badge colors
function getLegitimacyBadge(tier: string | null) {
  if (!tier) return null;
  const colors: Record<string, string> = {
    "High Confidence": "bg-green-100 text-green-800 border-green-200",
    "Proceed with Caution": "bg-yellow-100 text-yellow-800 border-yellow-200",
    Suspicious: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[tier] || "bg-gray-100 text-gray-800 border-gray-200"}`}
    >
      {tier}
    </span>
  );
}

// Score dimension bar
function ScoreBar({
  label,
  value,
  max = 5,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 80
      ? "bg-green-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 40
          ? "bg-yellow-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-gray-600 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-10 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { job_id } = await params;
  const report = await getJobReport(job_id);

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-gray-500">Job not found.</p>
        <Link href="/" className="text-indigo-600 hover:underline mt-2 block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!report.evaluation_report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold text-gray-900">
          {report.company} &mdash; {report.job_title}
        </h1>
        <p className="text-gray-500 mt-4">
          No evaluation report available for this job.
        </p>
        <Link
          href={`/jobs/${job_id}`}
          className="text-indigo-600 hover:underline mt-2 block"
        >
          Back to job details
        </Link>
      </div>
    );
  }

  const dimensions = report.score_dimensions as Record<string, number> | null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/jobs/${job_id}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          &larr; Back to job details
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-3">
          {report.company} &mdash; {report.job_title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          {report.resume_score != null && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 border border-indigo-200 px-3 py-0.5 text-sm font-semibold text-indigo-800">
              Score: {report.resume_score}
            </span>
          )}
          {getLegitimacyBadge(report.legitimacy_tier)}
          {report.archetype && (
            <span className="inline-flex items-center rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-xs font-medium text-purple-800">
              {report.archetype}
            </span>
          )}
          {report.report_date && (
            <span className="text-xs text-gray-500">
              Evaluated {new Date(report.report_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Score dimensions */}
      {dimensions && Object.keys(dimensions).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Score Dimensions
          </h2>
          <div className="space-y-2.5">
            {dimensions.cv_match != null && (
              <ScoreBar label="CV Match" value={dimensions.cv_match} />
            )}
            {dimensions.north_star != null && (
              <ScoreBar label="North Star" value={dimensions.north_star} />
            )}
            {dimensions.comp != null && (
              <ScoreBar label="Comp" value={dimensions.comp} />
            )}
            {dimensions.culture != null && (
              <ScoreBar label="Culture" value={dimensions.culture} />
            )}
            {dimensions.red_flags != null && (
              <ScoreBar label="Red Flags" value={dimensions.red_flags} />
            )}
            {dimensions.global != null && (
              <ScoreBar label="Global" value={dimensions.global} />
            )}
          </div>
        </div>
      )}

      {/* Full report markdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <MarkdownRenderer content={report.evaluation_report} />
      </div>
    </div>
  );
}
