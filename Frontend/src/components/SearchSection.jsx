import { Filter, Search } from "lucide-react";

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-200 focus:-translate-y-[1px] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
      >
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
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)]">
          <Filter size={16} />
          <span>Search and filter recommendations</span>
        </div>
        <p className="text-xs text-[var(--color-text-soft)]">
          Narrow by domain, timeline, and authorship
        </p>
      </div>

      <div className="mt-4">
        <div className="relative">
          <Search
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search research papers..."
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-4 pl-12 pr-4 text-base text-[var(--color-text)] outline-none transition-all duration-200 focus:-translate-y-[1px] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Category"
          value={filters.category}
          options={categories}
          onChange={(event) =>
            onFilterChange({
              ...filters,
              category: event.target.value,
            })
          }
        />

        <SelectField
          label="Year"
          value={filters.year}
          options={years}
          onChange={(event) =>
            onFilterChange({
              ...filters,
              year: event.target.value,
            })
          }
        />

        <SelectField
          label="Authors"
          value={filters.author}
          options={authors}
          onChange={(event) =>
            onFilterChange({
              ...filters,
              author: event.target.value,
            })
          }
        />
      </div>
    </section>
  );
}
