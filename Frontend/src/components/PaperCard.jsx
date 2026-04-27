import { Bookmark, BookmarkCheck, ExternalLink, Quote } from "lucide-react";
import { useState } from "react";
import MetricBar from "./MetricBar";

function formatScore(score) {
  return Number(score).toFixed(4);
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
      className="neu neu-press reveal-up bg-[var(--surface)] p-5 sm:p-6"
      style={{
        animationDelay: `${Math.min(index * 65, 450)}ms`,
        boxShadow: isActive
          ? "6px 6px 0 0 var(--accent)"
          : undefined,
      }}
    >
      {/* Header row: category + year + rank */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="neu-tag"
          style={{ backgroundColor: "var(--accent-3)" }}
        >
          {paper.category}
        </span>
        <span className="neu-tag font-mono">{paper.year}</span>
        <span className="ml-auto font-mono text-[11px] font-bold text-[var(--text-soft)]">
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg sm:text-xl leading-tight tracking-tight text-[var(--text)]">
        {paper.title}
      </h3>

      <p className="mt-1.5 text-[13px] font-medium text-[var(--text-soft)]">
        {paper.authors.join(" · ")}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
        {paper.abstract.length > 230
          ? `${paper.abstract.slice(0, 230)}...`
          : paper.abstract}
      </p>

      {showRecommendationMetrics ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 border-t-[2.5px] border-[var(--border)] pt-4">
          <MetricBar
            label="Relevance"
            value={paper.relevanceScore}
            tone="accent"
            delay={index * 40}
          />
          <MetricBar
            label="Similarity"
            value={paper.similarityScore}
            tone="emerald"
            delay={index * 40 + 120}
          />
        </div>
      ) : null}

      {paper.keywords?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {paper.keywords.slice(0, 5).map((keyword) => (
            <span key={keyword} className="neu-tag">
              #{keyword}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className={`neu-btn ${isSaved ? "neu-btn-pink" : ""}`}
        >
          {isSaved ? (
            <BookmarkCheck size={14} strokeWidth={2.5} />
          ) : (
            <Bookmark size={14} strokeWidth={2.5} />
          )}
          {isSaved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="neu-btn neu-btn-sky"
        >
          <ExternalLink size={14} strokeWidth={2.5} />
          Details
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCite();
          }}
          className={`neu-btn ${copied ? "neu-btn-mint" : "neu-btn-purple"}`}
        >
          <Quote size={14} strokeWidth={2.5} />
          {copied ? "Copied!" : "Cite"}
        </button>

        {showRecommendationMetrics ? (
          <span
            className="ml-auto font-mono text-[11px] font-bold px-2 py-1 border-[2px] border-[var(--border)]"
            style={{ background: "var(--paper-2)" }}
          >
            R = {formatScore(paper.relevanceScore)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
