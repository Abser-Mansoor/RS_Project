import { ChartNoAxesColumnIncreasing, Tags } from "lucide-react";
import MetricBar from "./MetricBar";

export default function ExplainabilityPanel({ paper }) {
  if (!paper) {
    return (
      <aside className="surface reveal-up p-6">
        <p className="text-sm text-[var(--color-text-soft)]">
          Select a paper to inspect recommendation transparency.
        </p>
      </aside>
    );
  }

  return (
    <aside className="surface reveal-up h-fit p-5 sm:p-6 xl:sticky xl:top-[102px]">
      <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">
        Explainability panel
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-soft)]">
        Why this paper was recommended
      </p>

      <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <p className="text-sm font-semibold leading-relaxed text-[var(--color-text)]">{paper.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-soft)]">
          {paper.explanation}
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)]">
          <Tags size={16} />
          Matching keywords
        </div>
        <div className="flex flex-wrap gap-2">
          {paper.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-lg bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <MetricBar label="Similarity score" value={paper.similarityScore} tone="emerald" />
        <MetricBar label="Popularity score" value={paper.popularityScore} tone="amber" />
        <MetricBar label="Final relevance score" value={paper.relevanceScore} tone="accent" />
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)]">
          <ChartNoAxesColumnIncreasing size={16} />
          Score contribution
        </div>

        <div className="space-y-2">
          <MetricBar label="Content" value={paper.contribution.content} tone="accent" />
          <MetricBar label="Popularity" value={paper.contribution.popularity} tone="amber" />
          <MetricBar label="User profile" value={paper.contribution.userInterest} tone="emerald" />
        </div>
      </div>
    </aside>
  );
}
