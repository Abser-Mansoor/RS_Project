import { LogIn, MoonStar, Search, Sun, UserCircle2, Zap } from "lucide-react";

export default function Navbar({
  query,
  onQueryChange,
  isDark,
  onToggleTheme,
  currentUser,
  onAuthClick,
}) {
  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-[var(--border)] bg-[var(--paper)]">
      {/* Top stripe band */}
      <div className="h-2 neu-stripes opacity-90" />

      <div className="mx-auto flex max-w-[1380px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        {/* Logo block */}
        <div className="flex min-w-fit items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border-[3px] border-[var(--border)] bg-neu-yellow shadow-[3px_3px_0_0_var(--border)]">
            <Zap size={20} strokeWidth={3} className="text-ink" fill="#0a0a0a" />
          </div>
          <div className="leading-none">
            <p className="font-display text-base sm:text-lg uppercase tracking-tight text-[var(--text)]">
              PAPER<span className="text-[var(--accent-2)]">//</span>PUNK
            </p>
            <p className="hidden md:block mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
              Explainable research engine
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="min-w-0 flex-1 sm:mx-2">
          <div className="relative">
            <Search
              size={18}
              strokeWidth={3}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink)]"
            />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="SEARCH PAPERS — TITLE / AUTHOR / KEYWORD"
              className="neu-input pl-11 text-sm font-semibold uppercase tracking-wider"
            />
          </div>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="neu-btn neu-btn-icon"
          style={{ backgroundColor: isDark ? "var(--accent-5)" : "var(--accent-3)" }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} strokeWidth={3} /> : <MoonStar size={18} strokeWidth={3} />}
        </button>

        {/* Auth */}
        <button
          type="button"
          onClick={onAuthClick}
          className={`neu-btn ${currentUser ? "neu-btn-pink" : "neu-btn-primary"}`}
          aria-label="User profile"
        >
          {currentUser ? <UserCircle2 size={18} strokeWidth={3} /> : <LogIn size={18} strokeWidth={3} />}
          <span className="hidden sm:inline uppercase tracking-wide">
            {currentUser ? currentUser.username : "Sign In"}
          </span>
        </button>
      </div>
    </header>
  );
}
