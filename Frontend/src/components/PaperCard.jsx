import { Bookmark, BookmarkCheck, ExternalLink, Quote } from "lucide-react";
import { useState } from "react";
import MetricBar from "./MetricBar";

function formatScore(score) {
  return Number(score).toFixed(3);
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
      onClick={onSelect}
      className="neu neu-press bg-[var(--surface)] p-6 reveal-up"
      style={{
        animationDelay: `${Math.min(index * 65, 450)}ms`,
        borderColor: isActive ? "var(--accent-4)" : undefined,
        boxShadow: isActive ? "5px 5px 0 0 var(--accent-4)" : undefined,
      }}
    >
      {/* Top row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="neu-tag" style={{ backgroundColor: "var(--accent)" }}>
          {paper.category}
        </span>
        <span className="neu-tag font-mono">{paper.year}</span>
        <span className="ml-auto font-mono text-[10px] font-bold text-[var(--text-soft)]">
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-xl leading-tight tracking-tight text-[var(--text)]">
        {paper.title}
      </h3>

      {/* Authors */}
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-soft)]">
        {paper.authors.join(" · ")}
      </p>

      {/* Abstract */}
      <p className="mt-3 text-sm leading-relaxed text-[var(--text)] opacity-80">
        {paper.abstract.length > 200
          ? `${paper.abstract.slice(0, 200)}...`
          : paper.abstract}
      </p>

      {/* Keywords */}
      {paper.keywords?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {paper.keywords.slice(0, 5).map((keyword) => (
            <span key={keyword} className="neu-tag">#{keyword}</span>
          ))}
        </div>
      ) : null}

      {/* Metrics */}
      {showRecommendationMetrics ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t-[2.5px] border-[var(--border)] pt-4">
          <MetricBar label="Relevance" value={paper.relevanceScore} tone="accent" delay={index * 40} />
          <MetricBar label="Similarity" value={paper.similarityScore} tone="purple" delay={index * 40 + 120} />
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className={`neu-btn ${isSaved ? "neu-btn-sky" : ""}`}
        >
          {isSaved ? (
            <BookmarkCheck size={13} strokeWidth={2.5} />
          ) : (
            <Bookmark size={13} strokeWidth={2.5} />
          )}
          {isSaved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="neu-btn neu-btn-primary"
        >
          <ExternalLink size={13} strokeWidth={2.5} />
          Explain
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleCite(); }}
          className={`neu-btn ${copied ? "neu-btn-sky" : ""}`}
        >
          <Quote size={13} strokeWidth={2.5} />
          {copied ? "Copied!" : "Cite"}
        </button>

        {showRecommendationMetrics ? (
          <span
            className="ml-auto font-mono text-[10px] font-bold px-2 py-1 border-[2px] border-[var(--border)]"
            style={{ background: "var(--paper-2)" }}
          >
            R = {formatScore(paper.relevanceScore)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
