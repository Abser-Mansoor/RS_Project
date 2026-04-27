import {
  BookmarkCheck,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ExplainabilityPanel from "./components/ExplainabilityPanel";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Navbar from "./components/Navbar";
import PaperCard from "./components/PaperCard";
import SearchSection from "./components/SearchSection";
import { papersData } from "./data/mockPapers";
import AuthModal from "./components/AuthModal";
import {
  getCurrentUser,
  getSavedPapers,
  getUserProfile,
  removeSavedPaper,
  savePaper,
} from "./utils/userStorage";

const sectionItems = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Saved Papers", icon: BookmarkCheck },
];

const defaultFilters = {
  category: "All",
  year: "All",
  author: "All",
};

function getInitialTheme() {
  if (typeof window === "undefined") {
    return false;
  }

  const storedTheme = window.localStorage.getItem("rr-theme");
  if (storedTheme) {
    return storedTheme === "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function App() {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [papers, setPapers] = useState(papersData);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [savedPaperIds, setSavedPaperIds] = useState([]);
  const [savedPapersData, setSavedPapersData] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState(papersData[0]?.id ?? null);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const profileIds = currentUser?.profile || [];
        const params = new URLSearchParams({
          query,
          top_k: "50",
        });
        if (profileIds.length > 0) {
          params.set("profile_ids", profileIds.join(","));
        }

        const response = await fetch(
          `/api/recommendations?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed (${response.status})`);
        }

        const payload = await response.json();
        const fetchedPapers = Array.isArray(payload?.papers) ? payload.papers : [];
        setPapers(fetchedPapers);
        setIsBackendConnected(true);
        setBackendError("");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setPapers(papersData);
        setIsBackendConnected(false);
        setBackendError(
          "Backend unavailable. Showing local mock recommendations until the API is running."
        );
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [currentUser, query]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem("rr-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (!currentUser) {
      setSavedPaperIds([]);
      setSavedPapersData([]);
      return;
    }

    const savedIdSet = new Set([...getSavedPapers(), ...getUserProfile()]);

    setSavedPaperIds(Array.from(savedIdSet));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || savedPaperIds.length === 0) {
      setSavedPapersData([]);
      return;
    }

    const controller = new AbortController();

    const loadSavedByIds = async () => {
      try {
        const params = new URLSearchParams({ ids: savedPaperIds.join(",") });
        const response = await fetch(`/api/papers/by-ids?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Saved papers request failed (${response.status})`);
        }

        const payload = await response.json();
        const fetched = Array.isArray(payload?.papers) ? payload.papers : [];
        setSavedPapersData(fetched);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        const fallback = papers.filter((paper) => savedPaperIds.includes(paper.id));
        setSavedPapersData(fallback);
      }
    };

    loadSavedByIds();

    return () => {
      controller.abort();
    };
  }, [currentUser, papers, savedPaperIds]);

  const categories = useMemo(() => {
    return ["All", ...new Set(papers.map((paper) => paper.category))];
  }, [papers]);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(papers.map((paper) => String(paper.year)))];
    return ["All", ...uniqueYears.sort((a, b) => Number(b) - Number(a))];
  }, [papers]);

  const authors = useMemo(() => {
    const uniqueAuthors = [...new Set(papers.flatMap((paper) => paper.authors))];
    return ["All", ...uniqueAuthors.sort((a, b) => a.localeCompare(b))];
  }, [papers]);

  const filteredPapers = useMemo(() => {
    return papers
      .filter((paper) => {
        const categoryMatch =
          filters.category === "All" || paper.category === filters.category;
        const yearMatch = filters.year === "All" || String(paper.year) === filters.year;
        const authorMatch =
          filters.author === "All" || paper.authors.includes(filters.author);

        return categoryMatch && yearMatch && authorMatch;
      })
      .sort((firstPaper, secondPaper) => {
        return secondPaper.relevanceScore - firstPaper.relevanceScore;
      });
  }, [filters, papers]);

  const filteredSavedPapers = useMemo(() => {
    return savedPapersData
      .filter((paper) => {
        const categoryMatch =
          filters.category === "All" || paper.category === filters.category;
        const yearMatch = filters.year === "All" || String(paper.year) === filters.year;
        const authorMatch =
          filters.author === "All" || paper.authors.includes(filters.author);

        return categoryMatch && yearMatch && authorMatch;
      })
      .sort((firstPaper, secondPaper) => {
        return secondPaper.relevanceScore - firstPaper.relevanceScore;
      });
  }, [filters, savedPapersData]);

  const visiblePapers = useMemo(() => {
    if (activeSection !== "Saved Papers") {
      return filteredPapers;
    }

    return filteredSavedPapers;
  }, [activeSection, filteredPapers, filteredSavedPapers]);

  useEffect(() => {
    if (visiblePapers.length === 0) {
      setSelectedPaperId(null);
      return;
    }

    if (!visiblePapers.some((paper) => paper.id === selectedPaperId)) {
      setSelectedPaperId(visiblePapers[0].id);
    }
  }, [visiblePapers, selectedPaperId]);

  const selectedPaper =
    visiblePapers.find((paper) => paper.id === selectedPaperId) ?? null;

  const toggleSavePaper = (paperId) => {
    setSavedPaperIds((currentPaperIds) => {
      const isAlreadySaved = currentPaperIds.includes(paperId);

      if (isAlreadySaved) {
        if (currentUser) {
          removeSavedPaper(paperId);
          setCurrentUser(getCurrentUser());
        }
        return currentPaperIds.filter((id) => id !== paperId);
      } else {
        if (currentUser) {
          savePaper(paperId);
          setCurrentUser(getCurrentUser());
        }
        return [...currentPaperIds, paperId];
      }
    });
  };

  const handleAuthChange = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const savedIdSet = new Set([...getSavedPapers(), ...getUserProfile()]);
      setSavedPaperIds(Array.from(savedIdSet));
    } else {
      setSavedPaperIds([]);
      setSavedPapersData([]);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--paper)] text-[var(--text)]">
      <Navbar
        isDark={isDarkMode}
        onToggleTheme={() => setIsDarkMode((value) => !value)}
        currentUser={currentUser}
        onAuthClick={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={handleAuthChange}
      />

      {/* ── Hero ── */}
      <section className="border-b-[2.5px] border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-[1380px] px-4 py-12 sm:px-6 lg:px-10">
          <span
            className="inline-flex items-center gap-1.5 neu-tag"
            style={{ backgroundColor: "var(--accent-3)" }}
          >
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--ink)] animate-blink" />
            EXPLAINABLE · OPEN-SOURCE
          </span>

          <h1 className="mt-4 font-display text-5xl sm:text-6xl uppercase leading-none tracking-tight text-[var(--text)]">
            Discover Papers
            <br />
            <span
              className="inline-block px-2 mt-2"
              style={{
                backgroundColor: "var(--accent)",
                border: "2.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              that explain
            </span>{" "}
            themselves.
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--text-soft)] font-medium">
            A transparent research recommender. Inspect{" "}
            <strong className="text-[var(--text)]">why</strong> each paper is
            recommended through keyword overlap, similarity evidence, and popularity signals.
          </p>

          {/* Inline stats strip */}
          <div
            className="mt-7 inline-flex border-[2.5px] border-[var(--border)]"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {activeSection !== "Saved Papers" && (
              <div
                className="px-5 py-3 border-r-[2.5px] border-[var(--border)]"
                style={{ background: "var(--accent)" }}
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--ink)]">Papers</p>
                <p
                  key={visiblePapers.length}
                  className="font-display text-2xl uppercase text-[var(--ink)] leading-none animate-count-pop"
                >
                  {String(visiblePapers.length).padStart(2, "0")}
                </p>
              </div>
            )}
            <div className="px-5 py-3 border-r-[2.5px] border-[var(--border)] bg-[var(--surface)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-soft)]">Saved</p>
              <p
                key={savedPaperIds.length}
                className="font-display text-2xl uppercase text-[var(--text)] leading-none animate-count-pop"
              >
                {String(savedPaperIds.length).padStart(2, "0")}
              </p>
            </div>
            <div className="px-5 py-3 bg-[var(--surface)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-soft)]">Mode</p>
              <p
                key={activeSection}
                className="font-display text-base uppercase text-[var(--text)] leading-none animate-count-pop"
              >
                {activeSection === "Dashboard" ? "Dashboard" : "Saved"}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-4">
            {backendError ? (
              <div
                className="inline-flex items-center gap-2 border-[2.5px] border-[var(--border)] px-3 py-1.5 text-xs font-bold"
                style={{ background: "var(--accent-3)", boxShadow: "var(--shadow-xs)" }}
              >
                ⚠ {backendError}
              </div>
            ) : (
              <span
                className="neu-tag"
                style={{ backgroundColor: isBackendConnected ? "var(--accent)" : "var(--paper-2)" }}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    isBackendConnected ? "bg-[var(--ink)] animate-blink" : "bg-[var(--text-soft)]"
                  }`}
                />
                {isBackendConnected ? "LIVE BACKEND" : "OFFLINE · MOCK DATA"}
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="relative mx-auto max-w-[1380px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        {/* Tab navigation */}
        <div
          className="mb-6 inline-flex border-[2.5px] border-[var(--border)]"
          style={{ boxShadow: "var(--shadow-xs)" }}
        >
          {sectionItems.map(({ label, icon: Icon }, i) => {
            const isActive = activeSection === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveSection(label)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  i < sectionItems.length - 1 ? "border-r-[2.5px] border-[var(--border)]" : ""
                }`}
                style={{
                  background: isActive ? "var(--accent)" : "var(--surface)",
                  color: "var(--ink)",
                }}
              >
                <Icon size={13} strokeWidth={3} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-6 reveal-up">
          <SearchSection
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
            years={years}
            authors={authors}
          />
        </div>

        <section className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.66fr)_minmax(0,400px)]">
          <div className="reveal-up delay-1">
          {/* Section heading */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {activeSection !== "Saved Papers" ? (
                <>
                  <div
                    className="flex h-8 w-8 items-center justify-center border-[2.5px] border-[var(--border)]"
                    style={{ background: "var(--accent)", boxShadow: "var(--shadow-xs)" }}
                  >
                    <Sparkles size={14} strokeWidth={3} className="text-[var(--ink)]" />
                  </div>
                  <h2 className="font-display text-base uppercase tracking-tight text-[var(--text)]">
                    Recommended Papers
                  </h2>
                </>
              ) : (
                <>
                  <div
                    className="flex h-8 w-8 items-center justify-center border-[2.5px] border-[var(--border)]"
                    style={{ background: "var(--accent-2)", boxShadow: "var(--shadow-xs)" }}
                  >
                    <BookmarkCheck size={14} strokeWidth={3} className="text-[var(--ink)]" />
                  </div>
                  <h2 className="font-display text-base uppercase tracking-tight text-[var(--text)]">
                    Saved Papers
                  </h2>
                </>
              )}
            </div>
            <span className="neu-tag">
              {visiblePapers.length} paper{visiblePapers.length !== 1 ? "s" : ""}
            </span>
          </div>

            {isLoading ? (
              <LoadingSkeleton count={5} />
            ) : visiblePapers.length > 0 ? (
              <div className="space-y-6">
                {visiblePapers.map((paper, index) => {
                  return (
                    <PaperCard
                      key={paper.id}
                      paper={paper}
                      index={index}
                      isSaved={savedPaperIds.includes(paper.id)}
                      isActive={paper.id === selectedPaperId}
                      showRecommendationMetrics={activeSection !== "Saved Papers"}
                      onSave={() => toggleSavePaper(paper.id)}
                      onSelect={() => setSelectedPaperId(paper.id)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="neu p-10 text-center bg-[var(--surface)]">
                <p className="font-display text-2xl uppercase tracking-tight text-[var(--text)]">
                  No matching papers
                </p>
                <p className="mt-3 text-sm text-[var(--text-soft)] font-medium">
                  Adjust your query or filters to broaden the recommendation set.
                </p>
              </div>
            )}
          </div>

          {activeSection !== "Saved Papers" ? (
            <div className="xl:sticky xl:top-[110px] self-start">
              <ExplainabilityPanel paper={selectedPaper} />
            </div>
          ) : null}
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t-[2.5px] border-[var(--border)] pb-2 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[var(--text-soft)]">
              PAPER<span style={{ color: "var(--accent-4)" }}>//</span>PUNK · Explainable AI
            </p>
            <div className="flex gap-2">
              <span className="neu-tag" style={{ backgroundColor: "var(--accent)" }}>TF-IDF</span>
              <span className="neu-tag" style={{ backgroundColor: "var(--accent-3)" }}>Cosine Sim</span>
              <span className="neu-tag" style={{ backgroundColor: "var(--accent-2)" }}>Hybrid</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
