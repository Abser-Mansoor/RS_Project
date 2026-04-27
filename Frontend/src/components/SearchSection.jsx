import { Search } from "lucide-react";

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
        {label}
      </span>
      <select value={value} onChange={onChange} className="neu-select">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export default function SearchSection({ query, onQueryChange, filters, onFilterChange, categories, years, authors }) {
  return (
    <div className="neu bg-[var(--surface)] p-5 sm:p-6">
      <div className="relative mb-5">
        <Search
          size={17}
          strokeWidth={2.5}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
        />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by topic, title or author..."
          className="neu-input pl-12 py-3.5 text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Category"
          value={filters.category}
          options={categories}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
        />
        <SelectField
          label="Year"
          value={filters.year}
          options={years}
          onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
        />
        <SelectField
          label="Author"
          value={filters.author}
          options={authors}
          onChange={(e) => onFilterChange({ ...filters, author: e.target.value })}
        />
      </div>
    </div>
  );
}
