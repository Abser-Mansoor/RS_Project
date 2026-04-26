import { LogIn, MoonStar, Search, Sun, UserCircle2 } from "lucide-react";

export default function Navbar({
  query,
  onQueryChange,
  isDark,
  onToggleTheme,
  currentUser,
  onAuthClick,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1380px] items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-10">
        <div className="flex min-w-fit items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] pulse-soft" />
          </div>

          <div className="leading-tight">
            <p className="font-display text-[0.96rem] font-semibold text-[var(--color-text)] sm:text-base">
              Research Recommender
            </p>
            <p className="hidden text-xs text-[var(--color-text-soft)] md:block">
              Explainable paper intelligence
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 sm:mx-1">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by title, abstract, author, or keyword"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-2.5 pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition-all duration-200 focus:-translate-y-[1px] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2 text-[var(--color-text-soft)] transition-all duration-200 hover:-translate-y-[1px] hover:text-[var(--color-text)]"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={17} /> : <MoonStar size={17} />}
        </button>

        <button
          type="button"
          onClick={onAuthClick}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-2 text-[var(--color-text-soft)] transition-all duration-200 hover:-translate-y-[1px] hover:text-[var(--color-text)]"
          aria-label="User profile"
        >
          {currentUser ? <UserCircle2 size={18} /> : <LogIn size={18} />}
          <span className="hidden text-sm font-medium sm:inline">
            {currentUser ? currentUser.username : "Sign In"}
          </span>
        </button>
      </div>
    </header>
  );
}
