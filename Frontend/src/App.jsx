import {
  BookOpenCheck,
  BookmarkCheck,
  Compass,
  LayoutGrid,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ExplainabilityPanel from "./components/ExplainabilityPanel";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Navbar from "./components/Navbar";
import PaperCard from "./components/PaperCard";
import SearchSection from "./components/SearchSection";
import { papersData } from "./data/mockPapers";

const sectionItems = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Explore Papers", icon: Compass },
  { label: "Saved Papers", icon: BookmarkCheck },
  { label: "Recommendations", icon: Sparkles },
  { label: "Settings", icon: SlidersHorizontal },
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
  const [selectedPaperId, setSelectedPaperId] = useState(papersData[0]?.id ?? null);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/recommendations?query=${encodeURIComponent(query)}&top_k=80`,
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
  }, [query]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem("rr-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

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

  useEffect(() => {
    if (filteredPapers.length === 0) {
      setSelectedPaperId(null);
      return;
    }

    if (!filteredPapers.some((paper) => paper.id === selectedPaperId)) {
      setSelectedPaperId(filteredPapers[0].id);
    }
  }, [filteredPapers, selectedPaperId]);

  const selectedPaper =
    filteredPapers.find((paper) => paper.id === selectedPaperId) ?? null;

  const toggleSavePaper = (paperId) => {
    setSavedPaperIds((currentPaperIds) => {
      if (currentPaperIds.includes(paperId)) {
        return currentPaperIds.filter((id) => id !== paperId);
      }

      return [...currentPaperIds, paperId];
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-6 h-80 w-80 rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-700/25" />
        <div className="absolute right-0 top-24 h-[32rem] w-[32rem] rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-700/15" />
        <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-700/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.12)_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.08)_1px,transparent_1px)]" />
      </div>

      <Navbar
        query={query}
        onQueryChange={setQuery}
        isDark={isDarkMode}
        onToggleTheme={() => setIsDarkMode((value) => !value)}
      />

      <main className="mx-auto max-w-[1380px] px-4 pb-12 pt-7 sm:px-6 lg:px-10">
        <section className="reveal-up mb-7 grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Explainable research engine
            </p>
            <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight text-[var(--color-text)] sm:text-[2.15rem]">
              Discover research papers with transparent AI recommendations
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-soft)] sm:text-[0.95rem]">
              Search a curated recommendation stream and inspect exactly why each paper
              appears through keyword overlap, similarity evidence, and popularity signals.
            </p>

            {backendError ? (
              <p className="mt-3 rounded-xl border border-amber-300/60 bg-amber-100/70 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/35 dark:bg-amber-900/30 dark:text-amber-200">
                {backendError}
              </p>
            ) : (
              <p className="mt-3 text-xs text-[var(--color-text-soft)]">
                Source: {isBackendConnected ? "Project_Exportable.ipynb backend" : "Local data"}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === activeSection;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveSection(item.label)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]"
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className="surface p-3.5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                Recommendations
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
                {filteredPapers.length}
              </p>
            </div>
            <div className="surface p-3.5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                Saved papers
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-[var(--color-text)]">
                {savedPaperIds.length}
              </p>
            </div>
            <div className="surface p-3.5 sm:col-span-3 lg:col-span-1">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                Active section
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{activeSection}</p>
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

        <section className="reveal-up delay-2 mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1.66fr)_minmax(0,390px)]">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)]">
                <Sparkles size={16} className="text-[var(--color-accent)]" />
                Recommended papers
              </p>
              <p className="flex items-center gap-2 text-xs text-[var(--color-text-soft)]">
                <BookOpenCheck size={15} />
                Transparency-first ranking
              </p>
            </div>

            {isLoading ? (
              <LoadingSkeleton count={5} />
            ) : filteredPapers.length > 0 ? (
              <div className="space-y-4">
                {filteredPapers.map((paper, index) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    index={index}
                    isSaved={savedPaperIds.includes(paper.id)}
                    isActive={paper.id === selectedPaperId}
                    onSave={() => toggleSavePaper(paper.id)}
                    onSelect={() => setSelectedPaperId(paper.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="surface p-8 text-center">
                <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">
                  No matching papers
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                  Try adjusting your query or filters to broaden the recommendation set.
                </p>
              </div>
            )}
          </div>

          <ExplainabilityPanel paper={selectedPaper} />
        </section>
      </main>
    </div>
  );
}
