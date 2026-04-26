import { LogOut, X } from "lucide-react";
import { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="surface w-full max-w-md rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
            {currentUser ? "Account" : mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-text)]"
          >
            <X size={24} />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
              <p className="text-sm text-[var(--color-text-soft)]">Logged in as</p>
              <p className="mt-1 font-semibold text-[var(--color-text)]">
                {currentUser.username}
              </p>
              <p className="mt-2 text-xs text-[var(--color-text-soft)]">
                Saved papers: {currentUser.savedPapers?.length || 0}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                Profile paper IDs: {currentUser.profile?.join(", ") || "None yet"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-red-100/20 px-4 py-2.5 font-semibold text-red-600 transition-all hover:bg-red-100/40 dark:bg-red-900/20 dark:text-red-400"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2.5 font-semibold text-white outline-none transition-all hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              className="w-full text-sm text-[var(--color-accent)]"
            >
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
