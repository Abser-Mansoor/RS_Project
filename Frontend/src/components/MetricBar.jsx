const toneStyles = {
  accent: { bg: "var(--accent)", label: "var(--ink)" },
  emerald: { bg: "var(--accent-3)", label: "var(--ink)" },
  amber: { bg: "var(--accent-6)", label: "var(--ink)" },
  pink: { bg: "var(--accent-2)", label: "var(--ink)" },
  purple: { bg: "var(--accent-5)", label: "var(--ink)" },
};

function clampValue(value) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export default function MetricBar({ label, value, tone = "accent" }) {
  const normalizedValue = clampValue(value);
  const percentage = Math.round(normalizedValue * 100);
  const style = toneStyles[tone] || toneStyles.accent;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
          {label}
        </span>
        <span
          className="font-mono text-[11px] font-bold px-1.5 py-0.5 border-2 border-[var(--border)] rounded"
          style={{ backgroundColor: style.bg, color: style.label }}
        >
          {percentage}%
        </span>
      </div>
      <div className="relative h-3.5 w-full border-[2.5px] border-[var(--border)] bg-[var(--paper-2)] overflow-hidden rounded-[3px]">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: style.bg,
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(10,10,10,0.18) 0 6px, transparent 6px 12px)",
          }}
        />
      </div>
    </div>
  );
}
