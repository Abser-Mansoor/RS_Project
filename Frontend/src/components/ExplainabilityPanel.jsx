import { ChartNoAxesColumnIncreasing, Tags, Brain, FileText, Lightbulb } from "lucide-react";
import MetricBar from "./MetricBar";

export default function ExplainabilityPanel({ paper }) {
  if (!paper) {
    return (
      <aside className="neu reveal-up p-6 bg-[var(--surface)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-9 w-9 items-center justify-center border-[2.5px] border-[var(--border)] bg-neu-purple shadow-[2px_2px_0_0_var(--border)]">
            <Brain size={16} strokeWidth={3} className="text-ink" />
          </div>
          <p className="font-display text-sm uppercase tracking-tight text-[var(--text)]">
            Explain Panel
          </p>
        </div>
        <p className="text-sm text-[var(--text-soft)] font-medium">
          Select a paper to inspect how — and why — it was recommended.
        </p>
      </aside>
    );
  }

  return (
    <aside className="neu reveal-up h-fit max-h-[calc(100vh-7rem)] overflow-y-auto p-5 sm:p-6 bg-[var(--surface)]">
      <div className="flex items-center gap-3 border-b-[3px] border-[var(--border)] pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-[var(--border)] bg-neu-yellow shadow-[3px_3px_0_0_var(--border)]">
          <Brain size={18} strokeWidth={3} className="text-ink" />
        </div>
        <div>
          <h2 className="font-display text-lg uppercase tracking-tight text-[var(--text)] leading-none">
            Explain // Why
          </h2>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
            Recommendation transparency
          </p>
        </div>
      </div>

      <div
        className="mt-5 border-[3px] border-[var(--border)] bg-[var(--paper-2)] p-4"
        style={{ boxShadow: "4px 4px 0 0 var(--accent-2)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} strokeWidth={3} />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
            Paper
          </p>
        </div>
        <p className="font-display text-sm uppercase leading-tight text-[var(--text)]">
          {paper.title}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text)] font-medium">
          {paper.abstract}
        </p>
      </div>

      <div
        className="mt-4 border-[3px] border-[var(--border)] bg-neu-mint p-4"
        style={{ boxShadow: "4px 4px 0 0 var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={14} strokeWidth={3} className="text-ink" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink">
            Why recommended
          </p>
        </div>
        <p className="text-sm leading-relaxed text-ink font-semibold">
          {paper.explanation}
        </p>
      </div>

      {paper.keywords?.length ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2">
            <Tags size={14} strokeWidth={3} />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
              Matching keywords
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {paper.keywords.map((keyword) => (
              <span
                key={keyword}
                className="neu-tag"
                style={{ backgroundColor: "var(--accent)" }}
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3 border-t-[3px] border-[var(--border)] pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
          Score breakdown
        </p>
        <MetricBar label="Similarity" value={paper.similarityScore} tone="emerald" />
        <MetricBar label="Popularity" value={paper.popularityScore} tone="amber" />
        <MetricBar label="Final Relevance" value={paper.relevanceScore} tone="accent" />
      </div>

      {paper.contribution ? (
        <div
          className="mt-5 border-[3px] border-[var(--border)] bg-[var(--paper-2)] p-4"
          style={{ boxShadow: "4px 4px 0 0 var(--accent-5)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <ChartNoAxesColumnIncreasing size={14} strokeWidth={3} />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
              Score contribution
            </p>
          </div>
          <div className="space-y-3">
            <MetricBar label="Content" value={paper.contribution.content} tone="accent" />
            <MetricBar label="Popularity" value={paper.contribution.popularity} tone="amber" />
            <MetricBar label="User profile" value={paper.contribution.userInterest} tone="emerald" />
          </div>
        </div>
      ) : null}
    </aside>
  );
}
