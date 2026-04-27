import { Filter, Search, SlidersHorizontal } from "lucide-react";

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
        {label}
      </span>
      <select value={value} onChange={onChange} className="neu-select">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SearchSection({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  categories,
  years,
  authors,
}) {
  return (
    <section className="neu p-5 sm:p-6 bg-[var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-[var(--border)] pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center border-[2.5px] border-[var(--border)] bg-neu-pink shadow-[2px_2px_0_0_var(--border)]">
            <SlidersHorizontal size={16} strokeWidth={3} className="text-ink" />
          </div>
          <div>
            <p className="font-display text-sm uppercase tracking-tight text-[var(--text)]">
              Search & Filter
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">
              Narrow by domain · timeline · authorship
            </p>
          </div>
        </div>
        <span className="neu-tag" style={{ backgroundColor: "var(--accent-3)" }}>
          <Filter size={11} strokeWidth={3} /> LIVE
        </span>
      </div>

      <div className="relative">
        <Search
          size={20}
          strokeWidth={3}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink)]"
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="TYPE TO SEARCH RESEARCH PAPERS..."
          className="neu-input pl-12 py-4 text-base font-bold uppercase tracking-wider"
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Category"
          value={filters.category}
          options={categories}
          onChange={(event) => onFilterChange({ ...filters, category: event.target.value })}
        />
        <SelectField
          label="Year"
          value={filters.year}
          options={years}
          onChange={(event) => onFilterChange({ ...filters, year: event.target.value })}
        />
        <SelectField
          label="Authors"
          value={filters.author}
          options={authors}
          onChange={(event) => onFilterChange({ ...filters, author: event.target.value })}
        />
      </div>
    </section>
  );
}
