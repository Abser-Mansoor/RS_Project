import { Bookmark, BookmarkCheck, ExternalLink, Quote, Hash } from "lucide-react";
import { useState } from "react";
import MetricBar from "./MetricBar";

function formatScore(score) {
  return Number(score).toFixed(4);
}

// Rotating accent colors per card index for sticker variety
const accentPalette = [
  "var(--accent)",
  "var(--accent-2)",
  "var(--accent-3)",
  "var(--accent-4)",
  "var(--accent-5)",
  "var(--accent-6)",
];

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
  const accent = accentPalette[index % accentPalette.length];

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
      className={`neu neu-press reveal-up relative bg-[var(--surface)] p-5 sm:p-6 ${
        isActive ? "" : ""
      }`}
      style={{
        animationDelay: `${Math.min(index * 70, 500)}ms`,
        // Active = bigger shadow + accent ring
        boxShadow: isActive
          ? `8px 8px 0 0 ${accent}, 8px 8px 0 3px var(--border)`
          : undefined,
      }}
    >
      {/* corner index sticker */}
      <div
        className="absolute -top-3 -left-3 flex h-9 min-w-9 items-center justify-center px-2 border-[3px] border-[var(--border)] font-display text-sm uppercase tracking-tight text-ink"
        style={{ backgroundColor: accent, boxShadow: "3px 3px 0 0 var(--border)" }}
      >
        <Hash size={12} strokeWidth={3} className="mr-0.5" />
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pl-6">
        <span
          className="neu-tag"
          style={{ backgroundColor: "var(--accent-3)" }}
        >
          {paper.category}
        </span>
        <span className="neu-tag font-mono">{paper.year}</span>
      </div>

      <h3 className="mt-3 font-display text-xl sm:text-2xl uppercase leading-[1.1] tracking-tight text-[var(--text)]">
        {paper.title}
      </h3>

      <p className="mt-2 text-[13px] font-semibold text-[var(--text-soft)]">
        {paper.authors.join(" · ")}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
        {paper.abstract.length > 230 ? `${paper.abstract.slice(0, 230)}...` : paper.abstract}
      </p>

      {showRecommendationMetrics ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t-[2.5px] border-[var(--border)] pt-4">
          <MetricBar label="Relevance" value={paper.relevanceScore} tone="accent" />
          <MetricBar label="Similarity" value={paper.similarityScore} tone="emerald" />
        </div>
      ) : null}

      {paper.keywords?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {paper.keywords.slice(0, 5).map((keyword) => (
            <span key={keyword} className="neu-tag" style={{ backgroundColor: "var(--paper-2)" }}>
              #{keyword}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
          className={`neu-btn ${isSaved ? "neu-btn-pink" : ""}`}
        >
          {isSaved ? <BookmarkCheck size={14} strokeWidth={3} /> : <Bookmark size={14} strokeWidth={3} />}
          {isSaved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className="neu-btn neu-btn-sky"
        >
          <ExternalLink size={14} strokeWidth={3} />
          Details
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleCite();
          }}
          className={`neu-btn ${copied ? "neu-btn-mint" : "neu-btn-purple"}`}
        >
          <Quote size={14} strokeWidth={3} />
          {copied ? "Copied!" : "Cite"}
        </button>

        {showRecommendationMetrics ? (
          <span className="ml-auto font-mono text-[11px] font-bold px-2 py-1 border-2 border-[var(--border)] bg-[var(--paper-2)]">
            R = {formatScore(paper.relevanceScore)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
