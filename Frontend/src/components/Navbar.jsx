import { LogIn, MoonStar, Sun, UserCircle2, Zap } from "lucide-react";

export default function Navbar({ isDark, onToggleTheme, currentUser, onAuthClick }) {
  return (
    <header className="sticky top-0 z-30 border-b-[2.5px] border-[var(--border)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-[1380px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex flex-1 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center border-[2.5px] border-[var(--border)]"
            style={{ background: "var(--accent)", boxShadow: "var(--shadow-xs)" }}
          >
            <Zap size={16} strokeWidth={3} className="text-[var(--ink)]" />
          </div>
          <span className="font-display text-lg sm:text-xl uppercase tracking-tight text-[var(--text)]">
            PAPER<span style={{ color: "var(--accent-4)" }}>//</span>PUNK
          </span>
          <span className="hidden md:block border-l-[2px] border-[var(--border)] pl-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">
            Explainable Research Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="neu-btn neu-btn-icon"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={15} strokeWidth={2.5} /> : <MoonStar size={15} strokeWidth={2.5} />}
          </button>
          <button
            type="button"
            onClick={onAuthClick}
            className={`neu-btn ${currentUser ? "neu-btn-sky" : "neu-btn-primary"}`}
            aria-label="User profile"
          >
            {currentUser ? (
              <UserCircle2 size={15} strokeWidth={2.5} />
            ) : (
              <LogIn size={15} strokeWidth={2.5} />
            )}
            <span className="hidden sm:inline">
              {currentUser ? currentUser.username : "Sign In"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
