import {
  BookOpenCheck,
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
      {/* Brutalist textured background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 neu-grid-bg opacity-80" />
        <div
          className="absolute -top-32 -left-20 h-96 w-96 border-[3px] border-[var(--border)] opacity-60"
          style={{ backgroundColor: "var(--accent)", transform: "rotate(-8deg)" }}
        />
        <div
          className="absolute top-40 -right-24 h-80 w-80 border-[3px] border-[var(--border)] opacity-50"
          style={{ backgroundColor: "var(--accent-2)", transform: "rotate(12deg)" }}
        />
        <div
          className="absolute -bottom-40 left-1/3 h-96 w-96 border-[3px] border-[var(--border)] opacity-50"
          style={{ backgroundColor: "var(--accent-3)", transform: "rotate(-15deg)" }}
        />
        <div
          className="absolute bottom-20 right-1/4 h-60 w-60 border-[3px] border-[var(--border)] opacity-40"
          style={{ backgroundColor: "var(--accent-5)", transform: "rotate(20deg)" }}
        />
      </div>

      <Navbar
        query={query}
        onQueryChange={setQuery}
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

      <main className="relative mx-auto max-w-[1380px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        {/* HERO BLOCK */}
        <section className="reveal-up mb-8 grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-stretch">
          <div className="neu bg-[var(--surface)] p-6 sm:p-8 relative overflow-hidden">
            <div
              className="absolute -top-1 -right-1 h-20 w-20 border-l-[3px] border-b-[3px] border-[var(--border)]"
              style={{ backgroundColor: "var(--accent)" }}
            />
            <span className="inline-flex items-center gap-1.5 neu-tag" style={{ backgroundColor: "var(--accent-3)" }}>
              <span className="inline-block h-2 w-2 rounded-full bg-ink animate-blink" />
              EXPLAINABLE · OPEN-SOURCE
            </span>

            <h1 className="mt-4 font-display text-4xl sm:text-5xl uppercase leading-[0.95] tracking-tight text-[var(--text)]">
              Discover papers
              <br />
              <span
                className="inline-block px-2 mt-2"
                style={{
                  backgroundColor: "var(--accent-2)",
                  boxShadow: "4px 4px 0 0 var(--border)",
                  border: "3px solid var(--border)",
                }}
              >
                that explain
              </span>{" "}
              themselves.
            </h1>

            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--text)] font-medium">
              A transparent research recommender. Inspect <b>why</b> each paper is
              recommended through keyword overlap, similarity evidence, and popularity
              signals — no black boxes.
            </p>

            {backendError ? (
              <div
                className="mt-5 inline-flex items-start gap-2 border-[3px] border-[var(--border)] bg-neu-orange px-3 py-2 text-xs font-bold text-ink"
                style={{ boxShadow: "3px 3px 0 0 var(--border)" }}
              >
                ⚠ {backendError}
              </div>
            ) : (
              <p className="mt-5 inline-flex items-center gap-2 neu-tag" style={{ backgroundColor: isBackendConnected ? "var(--accent-3)" : "var(--paper-2)" }}>
                <span className={`inline-block h-2 w-2 rounded-full ${isBackendConnected ? "bg-ink" : "bg-[var(--text-soft)]"}`} />
                {isBackendConnected ? "LIVE BACKEND CONNECTED" : "OFFLINE · USING MOCK DATA"}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === activeSection;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveSection(item.label)}
                    className={`neu-btn ${isActive ? "neu-btn-primary" : ""}`}
                  >
                    <Icon size={15} strokeWidth={3} />
                    <span className="uppercase tracking-wide">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:auto-rows-fr">
            {activeSection !== "Saved Papers" ? (
              <div
                className="neu p-4"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
                  Recommendations
                </p>
                <p className="mt-1 font-display text-4xl uppercase text-ink leading-none">
                  {String(visiblePapers.length).padStart(2, "0")}
                </p>
              </div>
            ) : null}
            <div
              className="neu p-4"
              style={{ backgroundColor: "var(--accent-2)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
                Saved papers
              </p>
              <p className="mt-1 font-display text-4xl uppercase text-ink leading-none">
                {String(savedPaperIds.length).padStart(2, "0")}
              </p>
            </div>
            <div
              className="neu p-4 sm:col-span-3 lg:col-span-1"
              style={{ backgroundColor: "var(--accent-4)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
                Active mode
              </p>
              <p className="mt-1 font-display text-lg sm:text-xl uppercase tracking-tight text-ink leading-tight">
                {activeSection}
              </p>
            </div>
          </div>
        </section>

        <div className="reveal-up delay-1">
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

        <section className="mt-8 grid items-start gap-7 xl:grid-cols-[minmax(0,1.66fr)_minmax(0,400px)]">
          <div className="reveal-up delay-2">
            {activeSection !== "Saved Papers" ? (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center border-[2.5px] border-[var(--border)] bg-neu-yellow shadow-[3px_3px_0_0_var(--border)]">
                    <Sparkles size={16} strokeWidth={3} className="text-ink" />
                  </div>
                  <h2 className="font-display text-lg uppercase tracking-tight text-[var(--text)]">
                    Recommended Papers
                  </h2>
                </div>
                <span className="neu-tag" style={{ backgroundColor: "var(--accent-3)" }}>
                  <BookOpenCheck size={11} strokeWidth={3} /> Transparency-first
                </span>
              </div>
            ) : (
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center border-[2.5px] border-[var(--border)] bg-neu-pink shadow-[3px_3px_0_0_var(--border)]">
                  <BookmarkCheck size={16} strokeWidth={3} className="text-ink" />
                </div>
                <h2 className="font-display text-lg uppercase tracking-tight text-[var(--text)]">
                  Your Saved Papers
                </h2>
              </div>
            )}

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
              <div
                className="neu p-10 text-center bg-[var(--surface)]"
                style={{ boxShadow: "6px 6px 0 0 var(--accent-2)" }}
              >
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

        {/* Footer band */}
        <footer className="mt-16 border-t-[3px] border-[var(--border)] pt-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-xs uppercase tracking-[0.18em] text-[var(--text-soft)]">
              PAPER<span className="text-[var(--accent-2)]">//</span>PUNK · Explainable AI · Built with brutal honesty
            </p>
            <div className="flex gap-2">
              <span className="neu-tag" style={{ backgroundColor: "var(--accent)" }}>TF-IDF</span>
              <span className="neu-tag" style={{ backgroundColor: "var(--accent-3)" }}>Cosine Sim</span>
              <span className="neu-tag" style={{ backgroundColor: "var(--accent-4)" }}>Hybrid</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
