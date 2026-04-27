import { ChartNoAxesColumnIncreasing, Tags, Brain, FileText, Lightbulb } from "lucide-react";
import MetricBar from "./MetricBar";

export default function ExplainabilityPanel({ paper }) {
  if (!paper) {
    return (
      <aside className="neu reveal-up p-6 bg-[var(--surface)]">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex h-9 w-9 items-center justify-center border-[2.5px] border-[var(--border)]"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
          >
            <Brain size={16} strokeWidth={2.5} className="text-ink" />
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
    <aside className="neu reveal-up bg-[var(--surface)]" style={{ maxHeight: "calc(100vh - 7rem)", overflowY: "auto" }}>
      {/* Panel header */}
      <div
        className="flex items-center gap-3 p-5 border-b-[2.5px] border-[var(--border)]"
        style={{ background: "var(--paper-2)" }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center border-[2.5px] border-[var(--border)]"
          style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
        >
          <Brain size={18} strokeWidth={2.5} className="text-ink" />
        </div>
        <div>
          <h2 className="font-display text-base uppercase tracking-tight text-[var(--text)] leading-none">
            Why this paper?
          </h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
            Recommendation transparency
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Paper info */}
        <div
          className="border-[2.5px] border-[var(--border)] p-4"
          style={{ background: "var(--paper-2)", boxShadow: "var(--shadow-xs)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText size={13} strokeWidth={2.5} className="text-[var(--text-soft)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
              Paper
            </p>
          </div>
          <p className="font-display text-sm leading-tight text-[var(--text)]">
            {paper.title}
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-soft)] font-medium">
            {paper.abstract}
          </p>
        </div>

        {/* Why recommended */}
        <div
          className="border-[2.5px] border-[var(--border)] p-4"
          style={{ background: "var(--accent-3)", boxShadow: "var(--shadow-xs)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={13} strokeWidth={2.5} className="text-ink" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink">
              Why recommended
            </p>
          </div>
          <p className="text-sm leading-relaxed text-ink font-semibold">
            {paper.explanation}
          </p>
        </div>

        {/* Keywords */}
        {paper.keywords?.length ? (
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <Tags size={13} strokeWidth={2.5} className="text-[var(--text-soft)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                Matching keywords
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {paper.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="neu-tag animate-pop"
                  style={{ background: "var(--accent)" }}
                >
                  #{keyword}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Score breakdown */}
        <div className="space-y-3 border-t-[2.5px] border-[var(--border)] pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
            Score breakdown
          </p>
          <MetricBar label="Similarity" value={paper.similarityScore} tone="emerald" delay={0} />
          <MetricBar label="Popularity" value={paper.popularityScore} tone="amber" delay={100} />
          <MetricBar label="Final relevance" value={paper.relevanceScore} tone="accent" delay={200} />
        </div>

        {/* Score contribution */}
        {paper.contribution ? (
          <div
            className="border-[2.5px] border-[var(--border)] p-4 space-y-3"
            style={{ background: "var(--paper-2)", boxShadow: "var(--shadow-xs)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <ChartNoAxesColumnIncreasing size={13} strokeWidth={2.5} className="text-[var(--text-soft)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                Score contribution
              </p>
            </div>
            <MetricBar label="Content" value={paper.contribution.content} tone="accent" delay={0} />
            <MetricBar label="Popularity" value={paper.contribution.popularity} tone="amber" delay={100} />
            <MetricBar label="User profile" value={paper.contribution.userInterest} tone="emerald" delay={200} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
