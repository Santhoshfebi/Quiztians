import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    ChevronDown,
    Filter,
    Search,
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
    const [expanded, setExpanded] = useState(false);
    const [chapterOpen, setChapterOpen] = useState(false);

    const activeFilterCount =
        chapterFilter.length +
        (languageFilter ? 1 : 0) +
        (placeFilter ? 1 : 0) +
        (showDuplicates ? 1 : 0) +
        (showHighestScore ? 1 : 0);

    const toggleChapter = (chapter) => {
        setChapterFilter(
            chapterFilter.includes(chapter)
                ? chapterFilter.filter(
                    (item) => item !== chapter
                )
                : [...chapterFilter, chapter]
        );
    };

    return (
        <section className="mt-4 rounded-[22px] border border-white/[0.06] bg-[#111114]">
            {/* ==================================================
          HEADER
      ================================================== */}

            <div className="flex flex-col gap-4 border-b border-white/[0.05] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                            backgroundColor: theme.accentSoft,
                            color: theme.accent,
                        }}
                    >
                        <Filter size={17} />
                    </div>

                    <div>
                        <h3 className="text-[15px] font-black text-zinc-200">
                            Filter Results
                        </h3>

                        <p className="mt-1 text-[12px] leading-5 text-zinc-600">
                            Narrow down results before reviewing or exporting.
                        </p>
                    </div>
                </div>

                {activeFilterCount > 0 && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 text-[12px] font-bold text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                    >
                        <X size={13} />

                        Clear {activeFilterCount}{" "}
                        {activeFilterCount === 1
                            ? "Filter"
                            : "Filters"}
                    </button>
                )}
            </div>

            <div className="p-4 sm:p-5">
                {/* ==================================================
            SEARCH
        ================================================== */}

                <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={17}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search name, phone, chapter, language or place..."
                            className="h-12 w-full rounded-2xl border border-white/[0.07] bg-[#0D0D10] pl-11 pr-10 text-[13px] font-medium text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-white/[0.14]"
                        />

                        {search && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* MOBILE FILTER TOGGLE */}

                    <button
                        type="button"
                        onClick={() =>
                            setExpanded((previous) => !previous)
                        }
                        className="flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 text-[12px] font-bold text-zinc-400 transition hover:border-white/[0.12] hover:text-white lg:hidden"
                    >
                        <Filter size={15} />

                        <span className="hidden sm:inline">
                            Filters
                        </span>

                        {activeFilterCount > 0 && (
                            <span
                                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-white"
                                style={{
                                    backgroundColor: theme.accent,
                                }}
                            >
                                {activeFilterCount}
                            </span>
                        )}

                        <ChevronDown
                            size={14}
                            className={`transition ${expanded ? "rotate-180" : ""
                                }`}
                        />
                    </button>
                </div>

                {/* ==================================================
            ACTIVE FILTER CHIPS
        ================================================== */}

                <ActiveFilterChips
                    chapterFilter={chapterFilter}
                    setChapterFilter={setChapterFilter}
                    languageFilter={languageFilter}
                    setLanguageFilter={setLanguageFilter}
                    placeFilter={placeFilter}
                    setPlaceFilter={setPlaceFilter}
                    showDuplicates={showDuplicates}
                    setShowDuplicates={setShowDuplicates}
                    showHighestScore={showHighestScore}
                    setShowHighestScore={setShowHighestScore}
                    theme={theme}
                />

                {/* ==================================================
            ADVANCED FILTERS
        ================================================== */}

                <div
                    className={`${expanded ? "block" : "hidden"
                        } mt-4 lg:block`}
                >
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
                                        (previous) => !previous
                                    )
                                }
                                className="mt-2 flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0D0D10] px-3.5 text-left text-[13px] font-semibold text-zinc-400 transition hover:border-white/[0.12]"
                            >
                                <span className="min-w-0 truncate">
                                    {chapterFilter.length
                                        ? `${chapterFilter.length} selected`
                                        : "All chapters"}
                                </span>

                                <ChevronDown
                                    size={14}
                                    className={`shrink-0 text-zinc-600 transition ${chapterOpen
                                            ? "rotate-180"
                                            : ""
                                        }`}
                                />
                            </button>

                            <AnimatePresence>
                                {chapterOpen && (
                                    <>
                                        {/* OUTSIDE CLICK LAYER */}

                                        <button
                                            type="button"
                                            aria-label="Close chapter dropdown"
                                            onClick={() =>
                                                setChapterOpen(false)
                                            }
                                            className="fixed inset-0 z-20 cursor-default"
                                        />

                                        {/* DROPDOWN */}

                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: -5,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -5,
                                            }}
                                            transition={{
                                                duration: 0.15,
                                            }}
                                            className="absolute left-0 right-0 top-[72px] z-30 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151519] shadow-2xl shadow-black/40"
                                        >
                                            <div className="admin-hidden-scrollbar max-h-[260px] overflow-y-auto p-2">
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
                                                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
                                                                >
                                                                    <span
                                                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                                                                        style={
                                                                            selected
                                                                                ? {
                                                                                    borderColor:
                                                                                        theme.accent,
                                                                                    backgroundColor:
                                                                                        theme.accent,
                                                                                    color: "#fff",
                                                                                }
                                                                                : {
                                                                                    borderColor:
                                                                                        "rgba(255,255,255,.10)",
                                                                                }
                                                                        }
                                                                    >
                                                                        {selected && (
                                                                            <Check
                                                                                size={11}
                                                                            />
                                                                        )}
                                                                    </span>

                                                                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-zinc-400">
                                                                        {chapter}
                                                                    </span>
                                                                </button>
                                                            );
                                                        }
                                                    )
                                                ) : (
                                                    <p className="px-3 py-5 text-center text-[12px] text-zinc-700">
                                                        No chapters
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
                            onChange={setLanguageFilter}
                            options={languageOptions}
                        />

                        {/* ==============================================
                PLACE
            ============================================== */}

                        <SelectFilter
                            label="Place"
                            value={placeFilter}
                            onChange={setPlaceFilter}
                            options={placeOptions}
                        />
                    </div>

                    {/* ================================================
              FILTER TOGGLES
          ================================================ */}

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <ToggleCard
                            checked={showDuplicates}
                            onChange={setShowDuplicates}
                            title="Show Duplicates"
                            description="Only show results from phone numbers with multiple attempts."
                            theme={theme}
                        />

                        <ToggleCard
                            checked={showHighestScore}
                            onChange={setShowHighestScore}
                            title="Highest Score Only"
                            description="Keep the highest score for each phone and chapter."
                            theme={theme}
                        />
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
        <div className="mt-3 flex flex-wrap gap-2">
            {/* CHAPTERS */}

            {chapterFilter.map((chapter) => (
                <FilterChip
                    key={chapter}
                    label={chapter}
                    onRemove={() =>
                        setChapterFilter(
                            chapterFilter.filter(
                                (item) => item !== chapter
                            )
                        )
                    }
                    theme={theme}
                />
            ))}

            {/* LANGUAGE */}

            {languageFilter && (
                <FilterChip
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
                    label="Duplicates"
                    onRemove={() =>
                        setShowDuplicates(false)
                    }
                    danger
                />
            )}

            {/* HIGHEST SCORE */}

            {showHighestScore && (
                <FilterChip
                    label="Highest Score"
                    onRemove={() =>
                        setShowHighestScore(false)
                    }
                    theme={theme}
                />
            )}
        </div>
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
                scale: 0.95,
            }}
            animate={{
                opacity: 1,
                scale: 1,
            }}
            exit={{
                opacity: 0,
                scale: 0.95,
            }}
            className="flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5"
            style={{
                borderColor: danger
                    ? "rgba(239,68,68,.15)"
                    : `${theme?.accent}20`,

                backgroundColor: danger
                    ? "rgba(239,68,68,.05)"
                    : theme?.accentSoft,
            }}
        >
            <span
                className={`truncate text-[11px] font-black ${danger
                        ? "text-red-400"
                        : ""
                    }`}
                style={
                    !danger
                        ? {
                            color: theme?.accent,
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
                className="shrink-0 opacity-60 transition hover:opacity-100"
            >
                <X size={12} />
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
                        onChange(event.target.value)
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#0D0D10] px-3.5 pr-9 text-[13px] font-semibold text-zinc-400 outline-none transition focus:border-white/[0.14] [color-scheme:dark]"
                >
                    <option value="">
                        All {label}s
                    </option>

                    {options.map((option) => (
                        <option
                            key={option}
                            value={option}
                        >
                            {option}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
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
        <label className="text-[12px] font-bold text-zinc-500">
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
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() =>
                onChange(!checked)
            }
            className="flex items-center gap-3 rounded-2xl border border-white/[0.055] bg-[#0D0D10] p-3.5 text-left transition hover:border-white/[0.10]"
        >
            {/* TEXT */}

            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black text-zinc-300">
                    {title}
                </p>

                <p className="mt-1 text-[12px] leading-5 text-zinc-600">
                    {description}
                </p>
            </div>

            {/* SWITCH */}

            <div
                className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                style={{
                    backgroundColor: checked
                        ? theme.accent
                        : "#27272A",
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
                    className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow"
                />
            </div>
        </button>
    );
}