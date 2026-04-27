import { LogOut, X, UserPlus, KeyRound, AlertOctagon, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../utils/userStorage";

export default function AuthModal({ isOpen, onClose, onAuthChange }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        loginUser(username, password);
      } else {
        registerUser(username, password);
      }
      setUsername("");
      setPassword("");
      onAuthChange();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUsername("");
    setPassword("");
    setError("");
    onAuthChange();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,10,10,0.55)" }}
      onClick={onClose}
    >
      <div
        className="neu w-full max-w-md bg-[var(--surface)] p-6 sm:p-8 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 border-b-[2.5px] border-[var(--border)] px-6 sm:px-8 py-4 flex items-center justify-between" style={{ background: "var(--accent)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border-[2.5px] border-[var(--border)] bg-[var(--surface)]" style={{ boxShadow: "var(--shadow-xs)" }}>
              {currentUser ? (
                <BookmarkCheck size={16} strokeWidth={3} className="text-ink" />
              ) : mode === "login" ? (
                <KeyRound size={16} strokeWidth={3} className="text-ink" />
              ) : (
                <UserPlus size={16} strokeWidth={3} className="text-ink" />
              )}
            </div>
            <h2 className="font-display text-xl uppercase tracking-tight text-ink">
              {currentUser ? "Account" : mode === "login" ? "Sign In" : "Sign Up"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="neu-btn neu-btn-icon"
            aria-label="Close"
            type="button"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div
              className="border-[2.5px] border-[var(--border)] bg-[var(--paper-2)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                Logged in as
              </p>
              <p className="mt-1 font-display text-xl uppercase text-[var(--text)]">
                {currentUser.username}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="neu-tag" style={{ backgroundColor: "var(--accent-2)" }}>
                  Saved · {currentUser.savedPapers?.length || 0}
                </span>
                <span className="neu-tag" style={{ backgroundColor: "var(--accent-4)" }}>
                  Profile · {currentUser.profile?.length || 0}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="neu-btn neu-btn-danger w-full"
              type="button"
            >
              <LogOut size={16} strokeWidth={3} />
              Log Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)] mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="neu-input"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="neu-input"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-2 border-[2.5px] border-[var(--border)] p-3 text-sm font-bold"
                style={{ background: "var(--accent-5)", color: "#fff", boxShadow: "var(--shadow-xs)" }}
              >
                <AlertOctagon size={16} strokeWidth={3} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="neu-btn neu-btn-primary w-full text-base py-3 uppercase tracking-wider"
            >
              {isLoading
                ? "Loading..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              className="w-full text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-soft)] hover:text-[var(--accent-2)] transition-colors py-2"
            >
              {mode === "login" ? "→ Need an account? Sign up" : "← Have an account? Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
