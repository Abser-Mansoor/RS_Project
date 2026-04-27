import { useEffect, useState } from "react";

const toneStyles = {
  accent:  { bg: "var(--accent)",   label: "var(--ink)" },
  emerald: { bg: "var(--accent-3)", label: "var(--ink)" },
  amber:   { bg: "var(--accent-6)", label: "#fff" },
  pink:    { bg: "var(--accent-2)", label: "var(--ink)" },
  purple:  { bg: "var(--accent-5)", label: "#fff" },
};

function clampValue(value) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export default function MetricBar({ label, value, tone = "accent", delay = 0 }) {
  const pct = Math.round(clampValue(value) * 100);
  const [width, setWidth] = useState(0);
  const style = toneStyles[tone] || toneStyles.accent;

  useEffect(() => {
    setWidth(0);
    const t = setTimeout(() => setWidth(pct), 80 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">
          {label}
        </span>
        <span
          className="font-mono text-[11px] font-bold px-1.5 py-0.5 border-[2px] border-[var(--border)] rounded-[3px]"
          style={{ background: style.bg, color: style.label }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden"
        style={{
          background: "var(--paper-2)",
          border: "2px solid var(--border)",
          borderRadius: "3px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: style.bg,
            transition: `width 700ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
            borderRadius: "1px",
          }}
        />
      </div>
    </div>
  );
}
