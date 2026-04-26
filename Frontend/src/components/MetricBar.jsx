const toneClasses = {
  accent: "bg-[var(--color-accent)]",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

function clampValue(value) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

export default function MetricBar({ label, value, tone = "accent" }) {
  const normalizedValue = clampValue(value);
  const percentage = Math.round(normalizedValue * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-soft)]">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/90">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            toneClasses[tone] || toneClasses.accent
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
