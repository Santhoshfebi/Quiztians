import { useState } from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Check,
  ChevronDown,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

export default function ResultsFilters({
  search,
  setSearch,

  chapterFilter,
  setChapterFilter,

  languageFilter,
  setLanguageFilter,

  placeFilter,
  setPlaceFilter,

  showDuplicates,
  setShowDuplicates,

  showHighestScore,
  setShowHighestScore,

  chapterOptions,
  languageOptions,
  placeOptions,

  clearFilters,
  theme,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const [chapterOpen, setChapterOpen] =
    useState(false);

  /* ========================================================
     ACTIVE STRUCTURED FILTER COUNT

     Search is intentionally kept separate from the filter
     count because it behaves as the primary search query.
  ======================================================== */

  const activeFilterCount =
    chapterFilter.length +
    (languageFilter ? 1 : 0) +
    (placeFilter ? 1 : 0) +
    (showDuplicates ? 1 : 0) +
    (showHighestScore ? 1 : 0);

  const hasStructuredFilters =
    activeFilterCount > 0;

  const hasAnyFiltering =
    Boolean(search.trim()) ||
    hasStructuredFilters;

  /* ========================================================
     CHAPTER TOGGLE
  ======================================================== */

  const toggleChapter = (chapter) => {
    setChapterFilter(
      chapterFilter.includes(chapter)
        ? chapterFilter.filter(
          (item) =>
            item !== chapter
        )
        : [
          ...chapterFilter,
          chapter,
        ]
    );
  };

  /* ========================================================
     CLEAR EVERYTHING

     Existing parent clearFilters also clears search.
  ======================================================== */

  const handleClearAll = () => {
    clearFilters();
    setChapterOpen(false);
  };

  return (
    <section className="mt-4 min-w-0 overflow-visible rounded-[20px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:rounded-[22px]">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-3.5 min-[400px]:p-4 sm:gap-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor:
                `${theme.accent}18`,
              backgroundColor:
                theme.accentSoft,
              color: theme.accent,
            }}
          >
            <SlidersHorizontal
              size={17}
              strokeWidth={1.9}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-black text-zinc-900">
                Filter Results
              </h3>

              <AnimatePresence>
                {hasStructuredFilters && (
                  <motion.span
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                    }}
                    className="inline-flex h-6 items-center rounded-full border px-2.5 text-[9px] font-black uppercase tracking-[0.08em]"
                    style={{
                      borderColor:
                        `${theme.accent}20`,
                      backgroundColor:
                        theme.accentSoft,
                      color: theme.accent,
                    }}
                  >
                    {activeFilterCount}{" "}
                    {activeFilterCount === 1
                      ? "Active"
                      : "Active"}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-1 text-[11px] leading-5 text-zinc-500 sm:text-[12px]">
              Search and narrow down results
              before reviewing or exporting.
            </p>
          </div>
        </div>

        {/* ================================================
            CLEAR ALL
        ================================================ */}

        <AnimatePresence>
          {hasAnyFiltering && (
            <motion.button
              initial={{
                opacity: 0,
                y: -3,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -3,
              }}
              type="button"
              onClick={handleClearAll}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3 text-[11px] font-bold text-zinc-600 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 sm:w-auto sm:text-[12px]"
            >
              <X size={13} />

              Clear All
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="min-w-0 p-3.5 min-[400px]:p-4 sm:p-5">
        {/* ==================================================
            SEARCH
        ================================================== */}

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <FilterLabel>
              Search Results
            </FilterLabel>

            {search && (
              <span className="hidden text-[10px] font-medium text-zinc-400 sm:block">
                Searching all result fields
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 sm:left-4"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search name, phone, chapter, language or place..."
                className="h-11 w-full rounded-xl border border-zinc-200/90 bg-[#F8FAFC] pl-10 pr-9 text-[11px] font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white min-[400px]:text-[12px] sm:h-12 sm:rounded-2xl sm:pl-11 sm:pr-10 sm:text-[13px]"
              />

              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{
                      opacity: 0,
                      scale: 0.85,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.85,
                    }}
                    type="button"
                    aria-label="Clear search"
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <X size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ============================================
                MOBILE FILTER TOGGLE
            ============================================ */}

            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (previous) =>
                    !previous
                )
              }
              aria-expanded={expanded}
              className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-2.5 text-[10px] font-bold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 min-[400px]:px-3 sm:h-12 sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-[12px] lg:hidden"
            >
              <Filter size={15} />

              <span className="hidden sm:inline">
                Filters
              </span>

              {hasStructuredFilters && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white"
                  style={{
                    backgroundColor:
                      theme.accent,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}

              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${expanded
                  ? "rotate-180"
                  : ""
                  }`}
              />
            </button>
          </div>
        </div>

        {/* ==================================================
            ACTIVE FILTERS
        ================================================== */}

        <ActiveFilterChips
          chapterFilter={chapterFilter}
          setChapterFilter={
            setChapterFilter
          }
          languageFilter={
            languageFilter
          }
          setLanguageFilter={
            setLanguageFilter
          }
          placeFilter={placeFilter}
          setPlaceFilter={
            setPlaceFilter
          }
          showDuplicates={
            showDuplicates
          }
          setShowDuplicates={
            setShowDuplicates
          }
          showHighestScore={
            showHighestScore
          }
          setShowHighestScore={
            setShowHighestScore
          }
          theme={theme}
        />

        {/* ==================================================
            ADVANCED FILTERS
        ================================================== */}

        <div
          className={`${expanded
            ? "block"
            : "hidden"
            } mt-4 sm:mt-5 lg:block`}
        >
          {/* ================================================
              STANDARD FILTERS HEADER
          ================================================ */}

          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-500">
                Result Filters
              </p>

              <p className="mt-1 hidden text-[11px] text-zinc-400 sm:block">
                Filter by chapter,
                language and location.
              </p>
            </div>

            {hasStructuredFilters && (
              <span className="text-[10px] font-bold text-zinc-400">
                {activeFilterCount} selected
              </span>
            )}
          </div>

          {/* ================================================
              STANDARD FILTER GRID
          ================================================ */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* ==============================================
                CHAPTER MULTI SELECT
            ============================================== */}

            <div className="relative">
              <FilterLabel>
                Chapter
              </FilterLabel>

              <button
                type="button"
                onClick={() =>
                  setChapterOpen(
                    (previous) =>
                      !previous
                  )
                }
                aria-expanded={chapterOpen}
                className="mt-2 flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3.5 text-left text-[12px] font-semibold text-zinc-700 outline-none transition hover:border-zinc-300 hover:bg-white sm:text-[13px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate">
                    {chapterFilter.length
                      ? chapterFilter.length === 1
                        ? chapterFilter[0]
                        : `${chapterFilter.length} chapters`
                      : "All chapters"}
                  </span>

                  {chapterFilter.length >
                    0 && (
                      <span
                        className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-black text-white"
                        style={{
                          backgroundColor:
                            theme.accent,
                        }}
                      >
                        {
                          chapterFilter.length
                        }
                      </span>
                    )}
                </span>

                <ChevronDown
                  size={14}
                  className={`shrink-0 text-zinc-400 transition-transform duration-200 ${chapterOpen
                    ? "rotate-180"
                    : ""
                    }`}
                />
              </button>

              <AnimatePresence>
                {chapterOpen && (
                  <>
                    {/* ======================================
                        OUTSIDE CLICK LAYER
                    ====================================== */}

                    <button
                      type="button"
                      aria-label="Close chapter dropdown"
                      onClick={() =>
                        setChapterOpen(false)
                      }
                      className="fixed inset-0 z-20 cursor-default"
                    />

                    {/* ======================================
                        DROPDOWN
                    ====================================== */}

                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -5,
                        scale: 0.99,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: -5,
                        scale: 0.99,
                      }}
                      transition={{
                        duration: 0.15,
                      }}
                      className="absolute left-0 right-0 top-[70px] z-30 min-w-0 overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_18px_45px_rgba(24,24,27,0.14)] sm:top-[72px] sm:rounded-2xl"
                    >
                      {/* DROPDOWN HEADER */}

                      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-3 py-2.5">
                        <div>
                          <p className="text-[11px] font-black text-zinc-800">
                            Select Chapters
                          </p>

                          <p className="mt-0.5 text-[9px] text-zinc-400">
                            Multiple chapters
                            allowed
                          </p>
                        </div>

                        {chapterFilter.length >
                          0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setChapterFilter(
                                  []
                                )
                              }
                              className="rounded-lg px-2 py-1 text-[10px] font-bold transition hover:bg-zinc-100"
                              style={{
                                color:
                                  theme.accent,
                              }}
                            >
                              Clear
                            </button>
                          )}
                      </div>

                      {/* OPTIONS */}

                      <div
                        className="admin-hidden-scrollbar max-h-[220px] overflow-y-auto p-1.5 sm:max-h-[260px] sm:p-2"
                        style={{
                          scrollbarWidth:
                            "none",
                          msOverflowStyle:
                            "none",
                        }}
                      >
                        {chapterOptions.length ? (
                          chapterOptions.map(
                            (chapter) => {
                              const selected =
                                chapterFilter.includes(
                                  chapter
                                );

                              return (
                                <button
                                  type="button"
                                  key={chapter}
                                  onClick={() =>
                                    toggleChapter(
                                      chapter
                                    )
                                  }
                                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#F8FAFC]"
                                >
                                  <span
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition"
                                    style={
                                      selected
                                        ? {
                                          borderColor:
                                            theme.accent,
                                          backgroundColor:
                                            theme.accent,
                                          color:
                                            "#FFFFFF",
                                        }
                                        : {
                                          borderColor:
                                            "#D4D4D8",
                                          backgroundColor:
                                            "#FFFFFF",
                                        }
                                    }
                                  >
                                    {selected && (
                                      <Check
                                        size={
                                          11
                                        }
                                        strokeWidth={
                                          2.5
                                        }
                                      />
                                    )}
                                  </span>

                                  <span
                                    className={`min-w-0 flex-1 truncate text-[12px] font-semibold sm:text-[13px] ${selected
                                      ? "text-zinc-900"
                                      : "text-zinc-600"
                                      }`}
                                  >
                                    {chapter}
                                  </span>

                                  {selected && (
                                    <span
                                      className="text-[9px] font-black uppercase tracking-[0.06em]"
                                      style={{
                                        color:
                                          theme.accent,
                                      }}
                                    >
                                      Selected
                                    </span>
                                  )}
                                </button>
                              );
                            }
                          )
                        ) : (
                          <p className="px-3 py-6 text-center text-[12px] text-zinc-500">
                            No chapters
                            available
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* ==============================================
                LANGUAGE
            ============================================== */}

            <SelectFilter
              label="Language"
              value={languageFilter}
              onChange={
                setLanguageFilter
              }
              options={
                languageOptions
              }
            />

            {/* ==============================================
                PLACE
            ============================================== */}

            <SelectFilter
              label="Place"
              value={placeFilter}
              onChange={
                setPlaceFilter
              }
              options={placeOptions}
            />
          </div>

          {/* ================================================
              RESULT MODES
          ================================================ */}

          <div className="mt-5 border-t border-zinc-100 pt-4">
            <div className="mb-3">
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-500">
                Result Modes
              </p>

              <p className="mt-1 text-[11px] text-zinc-400">
                Change which submissions
                appear in the table.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToggleCard
                checked={
                  showDuplicates
                }
                onChange={
                  setShowDuplicates
                }
                title="Duplicates Only"
                description="Show results from phone numbers with multiple attempts."
                theme={theme}
              />

              <ToggleCard
                checked={
                  showHighestScore
                }
                onChange={
                  setShowHighestScore
                }
                title="Highest Score Only"
                description="Keep the highest score for each phone and chapter."
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================
   ACTIVE FILTER CHIPS
========================================================== */

function ActiveFilterChips({
  chapterFilter,
  setChapterFilter,

  languageFilter,
  setLanguageFilter,

  placeFilter,
  setPlaceFilter,

  showDuplicates,
  setShowDuplicates,

  showHighestScore,
  setShowHighestScore,

  theme,
}) {
  const hasFilters =
    chapterFilter.length > 0 ||
    Boolean(languageFilter) ||
    Boolean(placeFilter) ||
    showDuplicates ||
    showHighestScore;

  if (!hasFilters) {
    return null;
  }

  return (
    <motion.div
      layout
      className="mt-3 min-w-0 rounded-xl border border-zinc-100 bg-[#FAFAFA] p-2.5 sm:rounded-2xl sm:p-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
          Active
        </span>

        <span className="h-px flex-1 bg-zinc-200/70" />
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {/* CHAPTERS */}

        <AnimatePresence>
          {chapterFilter.map(
            (chapter) => (
              <FilterChip
                key={chapter}
                label={chapter}
                onRemove={() =>
                  setChapterFilter(
                    chapterFilter.filter(
                      (item) =>
                        item !== chapter
                    )
                  )
                }
                theme={theme}
              />
            )
          )}

          {/* LANGUAGE */}

          {languageFilter && (
            <FilterChip
              key={`language-${languageFilter}`}
              label={languageFilter}
              onRemove={() =>
                setLanguageFilter("")
              }
              theme={theme}
            />
          )}

          {/* PLACE */}

          {placeFilter && (
            <FilterChip
              key={`place-${placeFilter}`}
              label={placeFilter}
              onRemove={() =>
                setPlaceFilter("")
              }
              theme={theme}
            />
          )}

          {/* DUPLICATES */}

          {showDuplicates && (
            <FilterChip
              key="duplicates"
              label="Duplicates"
              onRemove={() =>
                setShowDuplicates(
                  false
                )
              }
              danger
            />
          )}

          {/* HIGHEST SCORE */}

          {showHighestScore && (
            <FilterChip
              key="highest-score"
              label="Highest Score"
              onRemove={() =>
                setShowHighestScore(
                  false
                )
              }
              theme={theme}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ==========================================================
   FILTER CHIP
========================================================== */

function FilterChip({
  label,
  onRemove,
  theme,
  danger = false,
}) {
  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        scale: 0.94,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.94,
      }}
      transition={{
        duration: 0.15,
      }}
      className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full border py-1.5 pl-2.5 pr-1.5 sm:gap-2 sm:pl-3"
      style={{
        borderColor: danger
          ? "rgba(239,68,68,.20)"
          : `${theme?.accent}20`,

        backgroundColor: danger
          ? "rgba(254,242,242,1)"
          : theme?.accentSoft,
      }}
    >
      <span
        className={`max-w-[115px] truncate min-[400px]:max-w-[145px] sm:max-w-[220px] text-[10px] font-black sm:max-w-[220px] sm:text-[11px] ${danger
          ? "text-red-600"
          : ""
          }`}
        style={
          !danger
            ? {
              color:
                theme?.accent,
            }
            : undefined
        }
      >
        {label}
      </span>

      <button
        type="button"
        aria-label={`Remove ${label} filter`}
        onClick={onRemove}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-60 transition hover:bg-black/5 hover:opacity-100"
      >
        <X size={11} />
      </button>
    </motion.div>
  );
}

/* ==========================================================
   SELECT FILTER
========================================================== */

function SelectFilter({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <FilterLabel>
        {label}
      </FilterLabel>

      <div className="relative mt-2">
        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="h-11 w-full appearance-none rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3.5 pr-9 text-[12px] font-semibold text-zinc-700 outline-none transition [color-scheme:light] hover:border-zinc-300 focus:border-zinc-400 focus:bg-white sm:text-[13px]"
        >
          <option value="">
            All {label}s
          </option>

          {options.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            )
          )}
        </select>

        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
      </div>
    </div>
  );
}

/* ==========================================================
   FILTER LABEL
========================================================== */

function FilterLabel({
  children,
}) {
  return (
    <label className="text-[11px] font-bold text-zinc-600 sm:text-[12px]">
      {children}
    </label>
  );
}

/* ==========================================================
   TOGGLE CARD
========================================================== */

function ToggleCard({
  checked,
  onChange,
  title,
  description,
  theme,
}) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() =>
        onChange(!checked)
      }
      whileTap={{
        scale: 0.995,
      }}
      className="group flex min-h-[72px] w-full min-w-0 items-center gap-2.5 rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm sm:min-h-[78px] sm:gap-3 sm:rounded-2xl sm:p-3.5"
      style={{
        borderColor: checked
          ? `${theme.accent}25`
          : "#E4E4E7",

        backgroundColor: checked
          ? theme.accentSoft
          : "#F8FAFC",
      }}
    >
      {/* TEXT */}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className="text-[12px] font-black sm:text-[13px]"
            style={
              checked
                ? {
                  color:
                    theme.accent,
                }
                : {
                  color:
                    "#27272A",
                }
            }
          >
            {title}
          </p>

          {checked && (
            <span
              className="hidden rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] sm:inline-flex"
              style={{
                backgroundColor:
                  `${theme.accent}12`,
                color:
                  theme.accent,
              }}
            >
              On
            </span>
          )}
        </div>

        <p className="mt-1 text-[9px] leading-4 text-zinc-500 min-[400px]:text-[10px] sm:text-[11px] sm:leading-5">
          {description}
        </p>
      </div>

      {/* SWITCH */}

      <div
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
        style={{
          backgroundColor: checked
            ? theme.accent
            : "#D4D4D8",
        }}
      >
        <motion.span
          animate={{
            x: checked ? 20 : 3,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_2px_5px_rgba(24,24,27,0.18)]"
        />
      </div>
    </motion.button>
  );
}