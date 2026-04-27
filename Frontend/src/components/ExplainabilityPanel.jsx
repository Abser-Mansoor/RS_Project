import { Brain, ChartNoAxesColumnIncreasing, FileText, Lightbulb, Tags } from "lucide-react";
import MetricBar from "./MetricBar";

export default function ExplainabilityPanel({ paper }) {
  if (!paper) {
    return (
      <aside className="neu bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center border-[2.5px] border-[var(--border)]"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-xs)" }}
          >
            <Brain size={16} strokeWidth={2.5} className="text-[var(--ink)]" />
          </div>
          <p className="font-display text-sm uppercase tracking-tight text-[var(--text)]">
            Explain Panel
          </p>
        </div>
        <p className="text-sm text-[var(--text-soft)] font-medium leading-relaxed">
          Select a paper to inspect how — and why — it was recommended.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="neu bg-[var(--surface)]"
      style={{ maxHeight: "calc(100vh - 7rem)", overflowY: "auto" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 border-b-[2.5px] border-[var(--border)] p-5"
        style={{ background: "var(--accent)" }}
      >
        <Brain size={17} strokeWidth={2.5} className="shrink-0 text-[var(--ink)]" />
        <div>
          <h2 className="font-display text-sm uppercase leading-none tracking-tight text-[var(--ink)]">
            Why this paper?
          </h2>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink)] opacity-70">
            Recommendation transparency
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Paper info */}
        <div
          className="border-[2.5px] border-[var(--border)] p-4"
          style={{ background: "var(--paper-2)", boxShadow: "var(--shadow-xs)" }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <FileText size={12} strokeWidth={2.5} className="text-[var(--text-soft)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">Paper</p>
          </div>
          <p className="font-display text-sm leading-tight text-[var(--text)]">{paper.title}</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-soft)]">{paper.abstract}</p>
        </div>

        {/* Why recommended */}
        <div
          className="border-[2.5px] border-[var(--border)] p-4"
          style={{ background: "var(--accent-3)", boxShadow: "var(--shadow-xs)" }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <Lightbulb size={12} strokeWidth={2.5} className="text-[var(--ink)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">Why recommended</p>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-[var(--ink)]">{paper.explanation}</p>
        </div>

        {/* Keywords */}
        {paper.keywords?.length ? (
          <div>
            <div className="mb-2.5 flex items-center gap-1.5">
              <Tags size={12} strokeWidth={2.5} className="text-[var(--text-soft)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">Keywords</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {paper.keywords.map((keyword) => (
                <span key={keyword} className="neu-tag" style={{ background: "var(--accent-2)" }}>
                  #{keyword}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Score breakdown */}
        <div className="space-y-3 border-t-[2.5px] border-[var(--border)] pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">Score breakdown</p>
          <MetricBar label="Similarity" value={paper.similarityScore} tone="emerald" delay={0} />
          <MetricBar label="Popularity" value={paper.popularityScore} tone="amber" delay={100} />
          <MetricBar label="Final relevance" value={paper.relevanceScore} tone="accent" delay={200} />
        </div>

        {/* Score contribution */}
        {paper.contribution ? (
          <div
            className="space-y-3 border-[2.5px] border-[var(--border)] p-4"
            style={{ background: "var(--paper-2)", boxShadow: "var(--shadow-xs)" }}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <ChartNoAxesColumnIncreasing size={12} strokeWidth={2.5} className="text-[var(--text-soft)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">Score contribution</p>
            </div>
            <MetricBar label="Content" value={paper.contribution.content} tone="accent" delay={0} />
            <MetricBar label="Popularity" value={paper.contribution.popularity} tone="amber" delay={100} />
            <MetricBar label="User profile" value={paper.contribution.userInterest} tone="purple" delay={200} />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
