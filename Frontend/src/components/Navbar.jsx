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
    <header className="sticky top-0 z-30 border-b-[2.5px] border-[var(--border)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-[1380px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        {/* Logo */}
        <div className="flex min-w-fit items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center border-[2.5px] border-[var(--border)]"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-sm)" }}
          >
            <Zap size={18} strokeWidth={3} className="text-ink" fill="#0a0a0a" />
          </div>
          <div className="leading-none">
            <p className="font-display text-base sm:text-lg uppercase tracking-tight text-[var(--text)]">
              PAPER<span style={{ color: "var(--accent-2)" }}>//</span>PUNK
            </p>
            <p className="hidden md:block mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
              Explainable research engine
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="min-w-0 flex-1 sm:mx-2">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={2.5}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
            />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search papers by title, author or keyword..."
              className="neu-input pl-10 text-sm"
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
          {isDark ? <Sun size={16} strokeWidth={2.5} /> : <MoonStar size={16} strokeWidth={2.5} />}
        </button>

        {/* Auth */}
        <button
          type="button"
          onClick={onAuthClick}
          className={`neu-btn ${currentUser ? "neu-btn-pink" : "neu-btn-primary"}`}
          aria-label="User profile"
        >
          {currentUser ? (
            <UserCircle2 size={16} strokeWidth={2.5} />
          ) : (
            <LogIn size={16} strokeWidth={2.5} />
          )}
          <span className="hidden sm:inline">
            {currentUser ? currentUser.username : "Sign In"}
          </span>
        </button>
      </div>
    </header>
  );
}
