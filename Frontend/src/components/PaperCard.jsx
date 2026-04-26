import { Bookmark, BookmarkCheck, ExternalLink, Quote } from "lucide-react";
import { useState } from "react";
import MetricBar from "./MetricBar";

function formatScore(score) {
  return score.toFixed(4);
}

export default function PaperCard({
  paper,
  index = 0,
  isSaved,
  isActive,
  showRecommendationMetrics = true,
  onSave,
  onSelect,
}) {
  const [copied, setCopied] = useState(false);

  const handleCite = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(paper.citation);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article
      className={`surface card-hover reveal-up cursor-pointer p-5 sm:p-6 ${
        isActive ? "ring-2 ring-[var(--color-accent-soft)]" : ""
      }`}
      onClick={onSelect}
      style={{ animationDelay: `${Math.min(index * 90, 600)}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent)]">
          {paper.category}
        </span>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-soft)]">
          {paper.year}
        </span>
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold leading-tight text-[var(--color-text)]">
        {paper.title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-soft)]">{paper.authors.join(", ")}</p>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-soft)]">
        {paper.abstract.length > 230 ? `${paper.abstract.slice(0, 230)}...` : paper.abstract}
      </p>

      {showRecommendationMetrics ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricBar label="Relevance score" value={paper.relevanceScore} tone="accent" />
          <MetricBar label="Similarity score" value={paper.similarityScore} tone="emerald" />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {paper.keywords.slice(0, 4).map((keyword) => (
          <span
            key={keyword}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-soft)]"
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--color-text-soft)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-text)]"
        >
          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {isSaved ? "Saved" : "Save paper"}
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--color-text-soft)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-text)]"
        >
          <ExternalLink size={14} />
          View details
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleCite();
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--color-text-soft)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-text)]"
        >
          <Quote size={14} />
          {copied ? "Citation copied" : "Cite"}
        </button>
      </div>

      {showRecommendationMetrics ? (
        <p className="mt-4 text-xs text-[var(--color-text-soft)]">
          Relevance (0-1):
          <span className="ml-1 font-semibold text-[var(--color-text)]">
            {formatScore(paper.relevanceScore)}
          </span>
        </p>
      ) : null}
    </article>
  );
}
