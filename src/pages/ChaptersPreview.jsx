import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  Languages,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// CHAPTERS PREVIEW
// ===========================================================

export default function ChaptersPreview() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // ===========================================================

  const [chapters, setChapters] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH CHAPTERS
  // ===========================================================

  const fetchChapters = async ({ refresh = false } = {}) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("chapter, question_en, question_ta");

      if (fetchError) {
        throw fetchError;
      }

      const chapterMap = {};

      (data || []).forEach((question) => {
        if (!question.chapter) return;

        const chapterName = question.chapter.trim();

        if (!chapterName) return;

        const key = chapterName.toLowerCase();

        if (!chapterMap[key]) {
          chapterMap[key] = {
            name: chapterName,
            count: 0,
            en: false,
            ta: false,
          };
        }

        chapterMap[key].count += 1;

        if (question.question_en?.trim()) {
          chapterMap[key].en = true;
        }

        if (question.question_ta?.trim()) {
          chapterMap[key].ta = true;
        }
      });

      const list = Object.values(chapterMap).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setChapters(list);
    } catch (fetchError) {
      console.error("Failed to fetch chapters:", fetchError);

      setError(
        fetchError?.message ||
          "Unable to load chapters. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // ===========================================================

  useEffect(() => {
    fetchChapters();
  }, []);

  // =========================================================
  // SEARCH
  // ===========================================================

  const filteredChapters = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return chapters;
    }

    return chapters.filter((chapter) =>
      chapter.name.toLowerCase().includes(query)
    );
  }, [chapters, search]);

  // =========================================================
  // STATS
  // ===========================================================

  const stats = useMemo(() => {
    const totalQuestions = chapters.reduce(
      (total, chapter) => total + chapter.count,
      0
    );

    const englishChapters = chapters.filter(
      (chapter) => chapter.en
    ).length;

    const tamilChapters = chapters.filter(
      (chapter) => chapter.ta
    ).length;

    const bilingualChapters = chapters.filter(
      (chapter) => chapter.en && chapter.ta
    ).length;

    return {
      totalQuestions,
      englishChapters,
      tamilChapters,
      bilingualChapters,
    };
  }, [chapters]);

  // =========================================================
  // PREVIEW
  // ===========================================================

  const handlePreview = (chapter, language) => {
    navigate("/quiz", {
      state: {
        name: "Admin Preview",
        phone: "0000000000",
        place: "Admin",
        language,
        chapter,
        isPreview: true,
      },
    });
  };

  // =========================================================
  // UI
  // ===========================================================

  return (
    <AdminLayout
      title="Chapter Preview"
      eyebrow="Quiz Management"
    >
      {({ theme }) => (
        <>
          {/* =================================================
              HERO
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="relative overflow-hidden rounded-[24px] border border-zinc-200/90 bg-white p-5 shadow-[0_10px_30px_rgba(24,24,27,0.07)] sm:p-6 lg:p-7"
          >
            {/* ACCENT GLOW */}

            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[110px]"
              style={{
                backgroundColor: `${theme.accent}0D`,
              }}
            />

            {/* SUBTLE GRID */}

            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
                backgroundSize: "34px 34px",
              }}
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}

              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={15}
                    style={{
                      color: theme.accent,
                    }}
                  />

                  <p
                    className="text-[11px] font-black uppercase tracking-[0.14em]"
                    style={{
                      color: theme.accent,
                    }}
                  >
                    Quiz Preview
                  </p>
                </div>

                <h2 className="mt-3 text-[27px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[31px] lg:text-[35px]">
                  Preview quiz by chapter
                </h2>

                <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
                  Choose a chapter and launch the quiz exactly as a
                  participant would see it in English or Tamil.
                </p>
              </div>

              {/* RIGHT */}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() =>
                    fetchChapters({
                      refresh: true,
                    })
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 text-[12px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "animate-spin" : ""}
                  />

                  Refresh
                </button>

                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `${theme.accent}20`,
                      backgroundColor: theme.accentSoft,
                    }}
                  >
                    <Languages
                      size={18}
                      style={{
                        color: theme.accent,
                      }}
                    />
                  </div>

                  <div>
                    <p className="text-[12px] font-black text-zinc-900">
                      Bilingual Preview
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-500">
                      English + Tamil
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              STATS
          ================================================= */}

          <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              label="Total Chapters"
              value={chapters.length}
              icon={BookOpen}
              theme={theme}
            />

            <StatCard
              label="Total Questions"
              value={stats.totalQuestions}
              icon={FileQuestion}
              theme={theme}
            />

            <StatCard
              label="English Ready"
              value={stats.englishChapters}
              icon={Languages}
              theme={theme}
            />

            <StatCard
              label="Tamil Ready"
              value={stats.tamilChapters}
              icon={CheckCircle2}
              theme={theme}
            />
          </section>

          {/* =================================================
              SEARCH
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.05,
            }}
            className="mt-4 rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              {/* SEARCH FIELD */}

              <div className="w-full lg:max-w-xl">
                <label className="text-[12px] font-bold text-zinc-700">
                  Search chapters
                </label>

                <div className="relative mt-2">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by chapter name..."
                    className="h-12 w-full rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] pl-11 pr-11 text-[13px] font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* RESULT COUNT */}

              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                    Showing
                  </p>

                  <p className="mt-1 text-[13px] font-black text-zinc-900">
                    {filteredChapters.length} of {chapters.length}{" "}
                    chapters
                  </p>
                </div>

                <div className="hidden rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3 sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                    Bilingual
                  </p>

                  <p className="mt-1 text-[13px] font-black text-zinc-900">
                    {stats.bilingualChapters} ready
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              SECTION HEADER
          ================================================= */}

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="text-[11px] font-black uppercase tracking-[0.14em]"
                style={{
                  color: theme.accent,
                }}
              >
                Available Chapters
              </p>

              <h3 className="mt-1 text-[19px] font-black tracking-[-0.025em] text-zinc-900">
                Select a chapter to preview
              </h3>
            </div>

            {!loading && chapters.length > 0 && (
              <p className="text-[12px] text-zinc-500">
                Preview mode does not count as a participant
                attempt.
              </p>
            )}
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <section className="mt-4">
            {loading ? (
              <ChapterLoading theme={theme} />
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={() => fetchChapters()}
                theme={theme}
              />
            ) : filteredChapters.length === 0 ? (
              <EmptyState
                hasSearch={Boolean(search.trim())}
                onClear={() => setSearch("")}
                theme={theme}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {filteredChapters.map((chapter, index) => (
                  <ChapterCard
                    key={chapter.name.toLowerCase()}
                    chapter={chapter}
                    index={index}
                    theme={theme}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}

// ===========================================================
// CHAPTER CARD
// ===========================================================

function ChapterCard({
  chapter,
  index,
  theme,
  onPreview,
}) {
  const bilingual = chapter.en && chapter.ta;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.28,
        delay: Math.min(index * 0.035, 0.25),
      }}
      whileHover={{
        y: -2,
      }}
      className="group relative overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition duration-200 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)] sm:p-6"
    >
      {/* =====================================================
          ACCENT GLOW
      ===================================================== */}

      <div
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-0 blur-[70px] transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundColor: `${theme.accent}12`,
        }}
      />

      <div className="relative">
        {/* ===================================================
            TOP
        =================================================== */}

        <div className="flex items-start justify-between gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${theme.accent}20`,
              backgroundColor: theme.accentSoft,
            }}
          >
            <BookOpen
              size={19}
              strokeWidth={1.8}
              style={{
                color: theme.accent,
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            {bilingual && (
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700 sm:inline-flex">
                Bilingual
              </span>
            )}

            <span
              className="rounded-full border px-2.5 py-1 text-[10px] font-black"
              style={{
                borderColor: `${theme.accent}20`,
                backgroundColor: theme.accentSoft,
                color: theme.accent,
              }}
            >
              {chapter.count}{" "}
              {chapter.count === 1 ? "Q" : "Qs"}
            </span>
          </div>
        </div>

        {/* ===================================================
            CHAPTER NAME
        =================================================== */}

        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            Chapter
          </p>

          <h3 className="mt-2 break-words text-[18px] font-black leading-6 tracking-[-0.02em] text-zinc-900 sm:text-[19px]">
            {chapter.name}
          </h3>

          <p className="mt-2 text-[12px] leading-5 text-zinc-500">
            {chapter.count}{" "}
            {chapter.count === 1 ? "question" : "questions"}{" "}
            available for preview.
          </p>
        </div>

        {/* ===================================================
            LANGUAGE AVAILABILITY
        =================================================== */}

        <div className="mt-5 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-3">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
            Language availability
          </p>

          <div className="grid grid-cols-2 gap-2">
            <LanguageStatus
              code="EN"
              label="English"
              available={chapter.en}
              theme={theme}
            />

            <LanguageStatus
              code="TA"
              label="Tamil"
              available={chapter.ta}
              theme={theme}
            />
          </div>
        </div>

        {/* ===================================================
            PREVIEW BUTTONS
        =================================================== */}

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <PreviewButton
            label="English"
            code="EN"
            available={chapter.en}
            theme={theme}
            onClick={() => onPreview(chapter.name, "en")}
          />

          <PreviewButton
            label="Tamil"
            code="TA"
            available={chapter.ta}
            theme={theme}
            onClick={() => onPreview(chapter.name, "ta")}
          />
        </div>
      </div>
    </motion.article>
  );
}

// ===========================================================
// LANGUAGE STATUS
// ===========================================================

function LanguageStatus({
  code,
  label,
  available,
  theme,
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
        available
          ? ""
          : "border-zinc-200 bg-white"
      }`}
      style={
        available
          ? {
              borderColor: `${theme.accent}20`,
              backgroundColor: theme.accentSoft,
            }
          : undefined
      }
    >
      <div
        className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[9px] font-black ${
          !available
            ? "border border-zinc-200 bg-[#F8FAFC] text-zinc-400"
            : ""
        }`}
        style={
          available
            ? {
                backgroundColor: `${theme.accent}12`,
                color: theme.accent,
              }
            : undefined
        }
      >
        {code}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[11px] font-bold ${
            available
              ? "text-zinc-700"
              : "text-zinc-400"
          }`}
        >
          {label}
        </p>

        <p
          className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.07em] ${
            available
              ? "text-emerald-600"
              : "text-red-400"
          }`}
        >
          {available ? "Ready" : "Unavailable"}
        </p>
      </div>

      {available ? (
        <CheckCircle2
          size={14}
          className="shrink-0 text-emerald-600"
        />
      ) : (
        <X
          size={13}
          className="shrink-0 text-red-400"
        />
      )}
    </div>
  );
}

// ===========================================================
// PREVIEW BUTTON
// ===========================================================

function PreviewButton({
  label,
  code,
  available,
  theme,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onClick}
      className={`group/button flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-[12px] font-black transition ${
        available
          ? "shadow-sm hover:-translate-y-0.5"
          : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
      }`}
      style={
        available
          ? {
              borderColor: `${theme.accent}25`,
              backgroundColor: theme.accentSoft,
              color: theme.accent,
            }
          : undefined
      }
    >
      <Play
        size={14}
        fill={available ? "currentColor" : "none"}
      />

      <span>{label}</span>

      {available && (
        <ArrowRight
          size={13}
          className="transition-transform group-hover/button:translate-x-0.5"
        />
      )}

      {!available && (
        <span className="sr-only">
          {code} unavailable
        </span>
      )}
    </button>
  );
}

// ===========================================================
// STAT CARD
// ===========================================================

function StatCard({
  label,
  value,
  icon: Icon,
  theme,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)] sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold text-zinc-500 sm:text-[12px]">
          {label}
        </p>

        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
          style={{
            borderColor: `${theme.accent}20`,
            backgroundColor: theme.accentSoft,
            color: theme.accent,
          }}
        >
          <Icon size={14} />
        </div>
      </div>

      <p className="mt-3 text-[30px] font-black tracking-[-0.045em] text-zinc-900 sm:text-[34px]">
        {value}
      </p>
    </motion.div>
  );
}

// ===========================================================
// LOADING
// ===========================================================

function ChapterLoading({ theme }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="rounded-[22px] border border-zinc-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(24,24,27,0.05)] sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div
              className="h-11 w-11 animate-pulse rounded-xl"
              style={{
                backgroundColor: theme.accentSoft,
              }}
            />

            <div className="h-6 w-14 animate-pulse rounded-full bg-zinc-100" />
          </div>

          <div className="mt-5 h-3 w-16 animate-pulse rounded-full bg-zinc-100" />

          <div className="mt-3 h-5 w-2/3 animate-pulse rounded-full bg-zinc-200" />

          <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-zinc-100" />

          <div className="mt-5 h-[86px] animate-pulse rounded-2xl border border-zinc-100 bg-[#F8FAFC]" />

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-12 animate-pulse rounded-xl bg-zinc-100" />

            <div className="h-12 animate-pulse rounded-xl bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================
// EMPTY STATE
// ===========================================================

function EmptyState({
  hasSearch,
  onClear,
  theme,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="rounded-[22px] border border-dashed border-zinc-300 bg-white px-5 py-16 text-center shadow-[0_8px_24px_rgba(24,24,27,0.05)]"
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{
          borderColor: `${theme.accent}20`,
          backgroundColor: theme.accentSoft,
        }}
      >
        {hasSearch ? (
          <Search
            size={22}
            style={{
              color: theme.accent,
            }}
          />
        ) : (
          <BookOpen
            size={22}
            style={{
              color: theme.accent,
            }}
          />
        )}
      </div>

      <h3 className="mt-5 text-[18px] font-black text-zinc-900">
        {hasSearch
          ? "No matching chapters"
          : "No chapters available"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-zinc-500">
        {hasSearch
          ? "No chapter names match your current search. Try another keyword."
          : "Add questions with a chapter name and they will automatically appear here."}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl border border-zinc-200 bg-[#F8FAFC] px-4 py-2.5 text-[12px] font-bold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Clear Search
        </button>
      )}
    </motion.div>
  );
}

// ===========================================================
// ERROR STATE
// ===========================================================

function ErrorState({
  message,
  onRetry,
  theme,
}) {
  return (
    <div className="rounded-[22px] border border-red-200 bg-white px-5 py-16 text-center shadow-[0_8px_24px_rgba(24,24,27,0.05)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50">
        <X
          size={22}
          className="text-red-500"
        />
      </div>

      <h3 className="mt-5 text-[18px] font-black text-zinc-900">
        Unable to load chapters
      </h3>

      <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-zinc-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-black shadow-sm transition hover:-translate-y-0.5"
        style={{
          borderColor: `${theme.accent}25`,
          backgroundColor: theme.accentSoft,
          color: theme.accent,
        }}
      >
        <RefreshCw size={14} />

        Try Again
      </button>
    </div>
  );
}