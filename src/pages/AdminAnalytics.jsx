import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    AlertCircle,
    Award,
    BarChart3,
    Clock3,
    Filter,
    Gauge,
    Medal,
    RefreshCw,
    Sparkles,
    Target,
    Timer,
    Trophy,
    Users,
    Zap,
} from "lucide-react";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import AdminLayout from "../components/admin/AdminLayout";
import { supabase } from "../supabaseClient";

/* ============================================================
   CONSTANTS
============================================================ */

const ALL_CHAPTERS = "__all__";

const CHAPTERS_PER_PAGE = 5;

const SCORE_BUCKETS = [
    {
        key: "0-20",
        label: "0–20%",
        min: 0,
        max: 20,
    },
    {
        key: "21-40",
        label: "21–40%",
        min: 20,
        max: 40,
    },
    {
        key: "41-60",
        label: "41–60%",
        min: 40,
        max: 60,
    },
    {
        key: "61-80",
        label: "61–80%",
        min: 60,
        max: 80,
    },
    {
        key: "81-100",
        label: "81–100%",
        min: 80,
        max: 100,
    },
];

/* ============================================================
   HELPERS
============================================================ */

function safeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function getValidTime(value) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
        return null;
    }

    return number;
}

function average(values) {
    if (!values.length) return 0;

    return (
        values.reduce(
            (sum, value) => sum + value,
            0
        ) / values.length
    );
}

function formatNumber(value, digits = 1) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString("en-IN", {
        maximumFractionDigits: digits,
    });
}

function formatPercent(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0%";
    }

    return `${number.toFixed(1)}%`;
}

function formatDuration(seconds) {
    const total = Number(seconds);

    if (
        !Number.isFinite(total) ||
        total < 0
    ) {
        return "—";
    }

    const rounded = Math.round(total);

    const minutes = Math.floor(
        rounded / 60
    );

    const remaining =
        rounded % 60;

    if (minutes <= 0) {
        return `${remaining}s`;
    }

    return `${minutes}m ${String(
        remaining
    ).padStart(2, "0")}s`;
}

function formatCompactDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
        }
    );
}

function getInitials(name) {
    const clean = String(
        name || ""
    ).trim();

    if (!clean) return "?";

    return clean
        .split(/\s+/)
        .slice(0, 2)
        .map((part) =>
            part.charAt(0).toUpperCase()
        )
        .join("");
}

function getScorePercentage(
    score,
    questionCount
) {
    const safeScore =
        safeNumber(score);

    const total =
        safeNumber(questionCount);

    if (total <= 0) {
        return null;
    }

    return Math.min(
        100,
        Math.max(
            0,
            (safeScore / total) * 100
        )
    );
}

function getPerformanceLabel(
    percentage
) {
    if (percentage >= 85) {
        return "Excellent";
    }

    if (percentage >= 70) {
        return "Strong";
    }

    if (percentage >= 50) {
        return "Moderate";
    }

    return "Needs attention";
}

function sortRanking(a, b) {
    const scoreDifference =
        safeNumber(b.score) -
        safeNumber(a.score);

    if (scoreDifference !== 0) {
        return scoreDifference;
    }

    const aTime =
        getValidTime(
            a.time_taken
        ) ?? Infinity;

    const bTime =
        getValidTime(
            b.time_taken
        ) ?? Infinity;

    if (aTime !== bTime) {
        return aTime - bTime;
    }

    const aCreated =
        new Date(
            a.created_at || 0
        ).getTime();

    const bCreated =
        new Date(
            b.created_at || 0
        ).getTime();

    return aCreated - bCreated;
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function AdminAnalytics() {
    return (
        <AdminLayout
            eyebrow="Analytics"
            title="Quiz Analytics"
        >
            {({
                theme,
                isSuperAdmin,
            }) => (
                <AnalyticsContent
                    theme={theme}
                    isSuperAdmin={
                        isSuperAdmin
                    }
                />
            )}
        </AdminLayout>
    );
}

/* ============================================================
   ANALYTICS CONTENT
============================================================ */

function AnalyticsContent({
    theme,
    isSuperAdmin,
}) {
    const [results, setResults] =
        useState([]);

    const [
        questionCounts,
        setQuestionCounts,
    ] = useState({});

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [
        selectedChapter,
        setSelectedChapter,
    ] = useState(ALL_CHAPTERS);

    const [
        lastUpdated,
        setLastUpdated,
    ] = useState(null);

    const [
        chapterPage,
        setChapterPage,
    ] = useState(1);

    /* ========================================================
       FETCH DATA
    ======================================================== */

    const fetchAnalytics = async ({
        silent = false,
    } = {}) => {
        try {
            setError("");

            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [
                resultsResponse,
                questionsResponse,
            ] = await Promise.all([
                supabase
                    .from("results")
                    .select(
                        "id, name, place, phone, chapter, score, time_taken, created_at"
                    ),

                supabase
                    .from("questions")
                    .select("chapter"),
            ]);

            if (resultsResponse.error) {
                throw resultsResponse.error;
            }

            if (questionsResponse.error) {
                throw questionsResponse.error;
            }

            const fetchedResults =
                resultsResponse.data || [];

            const fetchedQuestions =
                questionsResponse.data || [];

            const counts = {};

            fetchedQuestions.forEach(
                (question) => {
                    const chapter =
                        question.chapter;

                    if (!chapter) return;

                    counts[chapter] =
                        (counts[chapter] ||
                            0) + 1;
                }
            );

            setResults(
                fetchedResults
            );

            setQuestionCounts(counts);

            setLastUpdated(
                new Date()
            );
        } catch (fetchError) {
            console.error(
                "Analytics fetch failed:",
                fetchError
            );

            setError(
                fetchError?.message ||
                    "Unable to load analytics."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    /* ========================================================
       CHAPTERS
    ======================================================== */

    const chapters = useMemo(() => {
        const chapterSet =
            new Set([
                ...Object.keys(
                    questionCounts
                ),

                ...results
                    .map(
                        (result) =>
                            result.chapter
                    )
                    .filter(Boolean),
            ]);

        return Array.from(
            chapterSet
        ).sort((a, b) =>
            String(a).localeCompare(
                String(b),
                undefined,
                {
                    numeric: true,
                    sensitivity:
                        "base",
                }
            )
        );
    }, [
        questionCounts,
        results,
    ]);

    /* ========================================================
       ENRICHED RESULTS
    ======================================================== */

    const enrichedResults =
        useMemo(() => {
            return results.map(
                (result) => {
                    const totalQuestions =
                        questionCounts[
                            result.chapter
                        ] || 0;

                    return {
                        ...result,

                        score:
                            safeNumber(
                                result.score
                            ),

                        validTime:
                            getValidTime(
                                result.time_taken
                            ),

                        totalQuestions,

                        percentage:
                            getScorePercentage(
                                result.score,
                                totalQuestions
                            ),
                    };
                }
            );
        }, [
            results,
            questionCounts,
        ]);

    /* ========================================================
       FILTERED RESULTS
    ======================================================== */

    const filteredResults =
        useMemo(() => {
            if (
                selectedChapter ===
                ALL_CHAPTERS
            ) {
                return enrichedResults;
            }

            return enrichedResults.filter(
                (result) =>
                    result.chapter ===
                    selectedChapter
            );
        }, [
            enrichedResults,
            selectedChapter,
        ]);

    /* ========================================================
       OVERVIEW METRICS
    ======================================================== */

    const metrics = useMemo(() => {
        const totalCompletions =
            filteredResults.length;

        const percentages =
            filteredResults
                .map(
                    (result) =>
                        result.percentage
                )
                .filter(
                    (value) =>
                        value !== null
                );

        const validTimes =
            filteredResults
                .map(
                    (result) =>
                        result.validTime
                )
                .filter(
                    (value) =>
                        value !== null
                );

        const perfectScores =
            filteredResults.filter(
                (result) =>
                    result.percentage !==
                        null &&
                    result.percentage >=
                        99.999
            ).length;

        const highestPercentage =
            percentages.length
                ? Math.max(
                      ...percentages
                  )
                : 0;

        const averageScore =
            average(percentages);

        const averageTime =
            average(validTimes);

        return {
            totalCompletions,
            averageScore,
            averageTime,
            perfectScores,
            highestPercentage,
        };
    }, [filteredResults]);

    /* ========================================================
       CHAPTER PERFORMANCE
    ======================================================== */

    const chapterPerformance =
        useMemo(() => {
            return chapters
                .map((chapter) => {
                    const chapterResults =
                        enrichedResults.filter(
                            (result) =>
                                result.chapter ===
                                chapter
                        );

                    const percentages =
                        chapterResults
                            .map(
                                (result) =>
                                    result.percentage
                            )
                            .filter(
                                (value) =>
                                    value !== null
                            );

                    const times =
                        chapterResults
                            .map(
                                (result) =>
                                    result.validTime
                            )
                            .filter(
                                (value) =>
                                    value !== null
                            );

                    const perfect =
                        chapterResults.filter(
                            (result) =>
                                result.percentage !==
                                    null &&
                                result.percentage >=
                                    99.999
                        ).length;

                    return {
                        chapter,

                        completions:
                            chapterResults.length,

                        questions:
                            questionCounts[
                                chapter
                            ] || 0,

                        averageScore:
                            average(
                                percentages
                            ),

                        averageTime:
                            average(times),

                        perfectScores:
                            perfect,
                    };
                })
                .filter(
                    (item) =>
                        item.completions >
                            0 ||
                        item.questions > 0
                );
        }, [
            chapters,
            enrichedResults,
            questionCounts,
        ]);

    const visibleChapterPerformance =
        useMemo(() => {
            if (
                selectedChapter ===
                ALL_CHAPTERS
            ) {
                return chapterPerformance;
            }

            return chapterPerformance.filter(
                (item) =>
                    item.chapter ===
                    selectedChapter
            );
        }, [
            chapterPerformance,
            selectedChapter,
        ]);

    /* ========================================================
       CHAPTER TABLE PAGINATION
    ======================================================== */

    const totalChapterPages =
        Math.max(
            1,
            Math.ceil(
                visibleChapterPerformance.length /
                    CHAPTERS_PER_PAGE
            )
        );

    const paginatedChapterPerformance =
        useMemo(() => {
            const startIndex =
                (chapterPage - 1) *
                CHAPTERS_PER_PAGE;

            return visibleChapterPerformance.slice(
                startIndex,
                startIndex +
                    CHAPTERS_PER_PAGE
            );
        }, [
            visibleChapterPerformance,
            chapterPage,
        ]);

    useEffect(() => {
        setChapterPage(1);
    }, [selectedChapter]);

    useEffect(() => {
        if (
            chapterPage >
            totalChapterPages
        ) {
            setChapterPage(
                totalChapterPages
            );
        }
    }, [
        chapterPage,
        totalChapterPages,
    ]);

    /* ========================================================
       SCORE DISTRIBUTION
    ======================================================== */

    const scoreDistribution =
        useMemo(() => {
            return SCORE_BUCKETS.map(
                (bucket, index) => {
                    const count =
                        filteredResults.filter(
                            (result) => {
                                const value =
                                    result.percentage;

                                if (
                                    value ===
                                    null
                                ) {
                                    return false;
                                }

                                if (
                                    index === 0
                                ) {
                                    return (
                                        value >=
                                            bucket.min &&
                                        value <=
                                            bucket.max
                                    );
                                }

                                return (
                                    value >
                                        bucket.min &&
                                    value <=
                                        bucket.max
                                );
                            }
                        ).length;

                    return {
                        range:
                            bucket.label,
                        count,
                    };
                }
            );
        }, [filteredResults]);

    /* ========================================================
       PARTICIPATION TIMELINE
    ======================================================== */

    const participationTimeline =
        useMemo(() => {
            const grouped =
                new Map();

            filteredResults.forEach(
                (result) => {
                    if (
                        !result.created_at
                    ) {
                        return;
                    }

                    const date =
                        new Date(
                            result.created_at
                        );

                    if (
                        Number.isNaN(
                            date.getTime()
                        )
                    ) {
                        return;
                    }

                    const key = [
                        date.getFullYear(),
                        String(
                            date.getMonth() +
                                1
                        ).padStart(
                            2,
                            "0"
                        ),
                        String(
                            date.getDate()
                        ).padStart(
                            2,
                            "0"
                        ),
                    ].join("-");

                    if (
                        !grouped.has(key)
                    ) {
                        grouped.set(
                            key,
                            {
                                key,

                                timestamp:
                                    new Date(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        date.getDate()
                                    ).getTime(),

                                completions:
                                    0,

                                percentages:
                                    [],
                            }
                        );
                    }

                    const group =
                        grouped.get(key);

                    group.completions +=
                        1;

                    if (
                        result.percentage !==
                        null
                    ) {
                        group.percentages.push(
                            result.percentage
                        );
                    }
                }
            );

            return Array.from(
                grouped.values()
            )
                .sort(
                    (a, b) =>
                        a.timestamp -
                        b.timestamp
                )
                .map((group) => ({
                    date:
                        formatCompactDate(
                            group.timestamp
                        ),

                    completions:
                        group.completions,

                    averageScore:
                        Number(
                            average(
                                group.percentages
                            ).toFixed(1)
                        ),
                }));
        }, [filteredResults]);

    /* ========================================================
       COMPLETION TIME ANALYSIS
    ======================================================== */

    const completionTimeData =
        useMemo(() => {
            return visibleChapterPerformance.map(
                (item) => ({
                    chapter:
                        item.chapter,

                    averageSeconds:
                        Math.round(
                            item.averageTime
                        ),

                    averageMinutes:
                        Number(
                            (
                                item.averageTime /
                                60
                            ).toFixed(2)
                        ),
                })
            );
        }, [
            visibleChapterPerformance,
        ]);

    /* ========================================================
       TOP PERFORMERS
    ======================================================== */

    const topPerformers =
        useMemo(() => {
            return [
                ...filteredResults,
            ]
                .sort((a, b) => {
                    if (
                        a.percentage !==
                            null &&
                        b.percentage !==
                            null &&
                        b.percentage !==
                            a.percentage
                    ) {
                        return (
                            b.percentage -
                            a.percentage
                        );
                    }

                    return sortRanking(
                        a,
                        b
                    );
                })
                .slice(0, 8);
        }, [filteredResults]);

    /* ========================================================
       FASTEST FINISHERS
       IMPORTANT:
       0-second submissions are intentionally excluded.
    ======================================================== */

    const fastestFinishers =
        useMemo(() => {
            return filteredResults
                .filter(
                    (result) =>
                        result.validTime !==
                            null &&
                        result.validTime > 0
                )
                .sort((a, b) => {
                    if (
                        a.validTime !==
                        b.validTime
                    ) {
                        return (
                            a.validTime -
                            b.validTime
                        );
                    }

                    return sortRanking(
                        a,
                        b
                    );
                })
                .slice(0, 8);
        }, [filteredResults]);

    /* ========================================================
       BEST CHAPTER
    ======================================================== */

    const bestChapter =
        useMemo(() => {
            const available =
                chapterPerformance.filter(
                    (item) =>
                        item.completions >
                        0
                );

            if (!available.length) {
                return null;
            }

            return [...available].sort(
                (a, b) => {
                    if (
                        b.averageScore !==
                        a.averageScore
                    ) {
                        return (
                            b.averageScore -
                            a.averageScore
                        );
                    }

                    return (
                        b.completions -
                        a.completions
                    );
                }
            )[0];
        }, [chapterPerformance]);

    /* ========================================================
       LOADING
    ======================================================== */

    if (loading) {
        return (
            <AnalyticsLoading
                theme={theme}
            />
        );
    }

    /* ========================================================
       ERROR
    ======================================================== */

    if (
        error &&
        !results.length
    ) {
        return (
            <AnalyticsError
                error={error}
                theme={theme}
                onRetry={() =>
                    fetchAnalytics()
                }
            />
        );
    }

    /* ========================================================
       UI
    ======================================================== */

    return (
        <div className="space-y-6">
            {/* =================================================
                HERO
            ================================================= */}

            <motion.section
                initial={{
                    opacity: 0,
                    y: 12,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_18px_55px_rgba(24,24,27,0.045)]"
            >
                <div
                    className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-[100px]"
                    style={{
                        backgroundColor:
                            `${theme.accent}12`,
                    }}
                />

                <div className="relative p-5 sm:p-6 lg:p-7">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border"
                                    style={{
                                        color:
                                            theme.accent,

                                        borderColor:
                                            `${theme.accent}20`,

                                        backgroundColor:
                                            theme.accentSoft,
                                    }}
                                >
                                    <Activity
                                        size={
                                            17
                                        }
                                    />
                                </div>

                                <span
                                    className="text-[10px] font-black uppercase tracking-[0.16em]"
                                    style={{
                                        color:
                                            theme.accent,
                                    }}
                                >
                                    Performance
                                    Intelligence
                                </span>
                            </div>

                            <h2 className="mt-4 text-[24px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[28px] lg:text-[32px]">
                                Understand
                                how every
                                quiz
                                performs.
                            </h2>

                            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-500">
                                Compare
                                chapters,
                                normalized
                                scores,
                                completion
                                speed and
                                participation
                                using your
                                existing
                                QUIZTIANS
                                results.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            {/* CHAPTER FILTER */}

                            <div>
                                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.13em] text-zinc-400">
                                    Chapter
                                </label>

                                <div className="relative">
                                    <Filter
                                        size={
                                            14
                                        }
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                                    />

                                    <select
                                        value={
                                            selectedChapter
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSelectedChapter(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="h-11 min-w-[220px] appearance-none rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-9 text-[12px] font-bold text-zinc-700 outline-none transition focus:border-zinc-300 focus:bg-white"
                                    >
                                        <option
                                            value={
                                                ALL_CHAPTERS
                                            }
                                        >
                                            All
                                            Chapters
                                        </option>

                                        {chapters.map(
                                            (
                                                chapter
                                            ) => (
                                                <option
                                                    key={
                                                        chapter
                                                    }
                                                    value={
                                                        chapter
                                                    }
                                                >
                                                    {
                                                        chapter
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* REFRESH */}

                            <button
                                type="button"
                                onClick={() =>
                                    fetchAnalytics(
                                        {
                                            silent: true,
                                        }
                                    )
                                }
                                disabled={
                                    refreshing
                                }
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[11px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={
                                        14
                                    }
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                {refreshing
                                    ? "Refreshing"
                                    : "Refresh"}
                            </button>
                        </div>
                    </div>

                    {/* FOOTER */}

                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-100 pt-4">
                        <div className="flex items-center gap-2">
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                    backgroundColor:
                                        theme.accent,
                                }}
                            />

                            <span className="text-[10px] font-semibold text-zinc-500">
                                {selectedChapter ===
                                ALL_CHAPTERS
                                    ? `${chapters.length} chapters`
                                    : selectedChapter}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                            <Clock3
                                size={
                                    12
                                }
                            />

                            Updated{" "}
                            {lastUpdated
                                ? lastUpdated.toLocaleTimeString(
                                      "en-IN",
                                      {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      }
                                  )
                                : "—"}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                            <ShieldBadge
                                accent={
                                    theme.accent
                                }
                            />

                            {isSuperAdmin
                                ? "Superadmin analytics"
                                : "Admin analytics"}
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ERROR BANNER */}

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
                    <AlertCircle
                        size={17}
                        className="mt-0.5 shrink-0"
                    />

                    <div>
                        <p className="text-[12px] font-bold">
                            Analytics
                            refresh
                            encountered
                            an issue
                        </p>

                        <p className="mt-1 text-[11px] text-amber-600">
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* =================================================
                KPI CARDS
            ================================================= */}

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
                <MetricCard
                    label="Completions"
                    value={formatNumber(
                        metrics.totalCompletions,
                        0
                    )}
                    helper={
                        selectedChapter ===
                        ALL_CHAPTERS
                            ? "Across selected data"
                            : "For this chapter"
                    }
                    icon={Users}
                    theme={theme}
                    delay={0}
                />

                <MetricCard
                    label="Average Score"
                    value={formatPercent(
                        metrics.averageScore
                    )}
                    helper="Normalized by question count"
                    icon={Target}
                    theme={theme}
                    delay={0.04}
                />

                <MetricCard
                    label="Average Time"
                    value={formatDuration(
                        metrics.averageTime
                    )}
                    helper="Completion speed"
                    icon={Timer}
                    theme={theme}
                    delay={0.08}
                />

                <MetricCard
                    label="Perfect Scores"
                    value={formatNumber(
                        metrics.perfectScores,
                        0
                    )}
                    helper="100% results"
                    icon={Award}
                    theme={theme}
                    delay={0.12}
                />

                <MetricCard
                    label="Highest Score"
                    value={formatPercent(
                        metrics.highestPercentage
                    )}
                    helper="Best normalized result"
                    icon={Trophy}
                    theme={theme}
                    delay={0.16}
                    className="col-span-2 lg:col-span-1"
                />
            </section>

            {/* =================================================
                INSIGHT STRIP
            ================================================= */}

            <section className="grid gap-4 lg:grid-cols-3">
                <InsightCard
                    icon={Sparkles}
                    eyebrow="Overall Performance"
                    title={
                        metrics.totalCompletions
                            ? `${formatPercent(
                                  metrics.averageScore
                              )} average score`
                            : "No completion data yet"
                    }
                    description={
                        metrics.totalCompletions
                            ? `${getPerformanceLabel(
                                  metrics.averageScore
                              )} performance across the current analytics filter.`
                            : "Completed quiz attempts will appear here."
                    }
                    theme={theme}
                />

                <InsightCard
                    icon={Zap}
                    eyebrow="Best Chapter"
                    title={
                        bestChapter
                            ? bestChapter.chapter
                            : "No chapter data"
                    }
                    description={
                        bestChapter
                            ? `${formatPercent(
                                  bestChapter.averageScore
                              )} average from ${bestChapter.completions} completion${
                                  bestChapter.completions ===
                                  1
                                      ? ""
                                      : "s"
                              }.`
                            : "Chapter performance will appear once results are available."
                    }
                    theme={theme}
                />

                <InsightCard
                    icon={Gauge}
                    eyebrow="Completion Speed"
                    title={formatDuration(
                        metrics.averageTime
                    )}
                    description={
                        metrics.averageTime >
                        0
                            ? "Average completion time for the current filter."
                            : "No valid completion-time data available."
                    }
                    theme={theme}
                />
            </section>

            {/* =================================================
                CHAPTER PERFORMANCE + SCORE DISTRIBUTION
            ================================================= */}

            <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
                <ChartCard
                    title="Chapter Performance"
                    description="Average normalized score by chapter."
                    icon={BarChart3}
                    theme={theme}
                >
                    {visibleChapterPerformance.length ? (
                        <div className="h-[320px]">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        visibleChapterPerformance
                                    }
                                    margin={{
                                        top: 15,
                                        right: 10,
                                        left: -18,
                                        bottom: 10,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        vertical={
                                            false
                                        }
                                        stroke="#E4E4E7"
                                    />

                                    <XAxis
                                        dataKey="chapter"
                                        tick={{
                                            fontSize: 10,
                                            fill: "#71717A",
                                        }}
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                        interval={
                                            0
                                        }
                                    />

                                    <YAxis
                                        domain={[
                                            0,
                                            100,
                                        ]}
                                        tick={{
                                            fontSize: 10,
                                            fill: "#A1A1AA",
                                        }}
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                        tickFormatter={(
                                            value
                                        ) =>
                                            `${value}%`
                                        }
                                    />

                                    <Tooltip
                                        content={
                                            <AnalyticsTooltip
                                                valueFormatter={(
                                                    value
                                                ) =>
                                                    formatPercent(
                                                        value
                                                    )
                                                }
                                            />
                                        }
                                        cursor={{
                                            fill: `${theme.accent}08`,
                                        }}
                                    />

                                    <Bar
                                        dataKey="averageScore"
                                        name="Average Score"
                                        radius={[
                                            7,
                                            7,
                                            0,
                                            0,
                                        ]}
                                        maxBarSize={
                                            48
                                        }
                                    >
                                        {visibleChapterPerformance.map(
                                            (
                                                _,
                                                index
                                            ) => (
                                                <Cell
                                                    key={
                                                        index
                                                    }
                                                    fill={
                                                        theme.accent
                                                    }
                                                    fillOpacity={
                                                        Math.max(
                                                            0.45,
                                                            0.9 -
                                                                index *
                                                                    0.035
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <ChartEmptyState />
                    )}
                </ChartCard>

                <ChartCard
                    title="Score Distribution"
                    description="Results grouped by normalized percentage."
                    icon={Target}
                    theme={theme}
                >
                    {filteredResults.length ? (
                        <div className="h-[320px]">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={
                                        scoreDistribution
                                    }
                                    margin={{
                                        top: 15,
                                        right: 5,
                                        left: -22,
                                        bottom: 10,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        vertical={
                                            false
                                        }
                                        stroke="#E4E4E7"
                                    />

                                    <XAxis
                                        dataKey="range"
                                        tick={{
                                            fontSize: 9,
                                            fill: "#71717A",
                                        }}
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                    />

                                    <YAxis
                                        allowDecimals={
                                            false
                                        }
                                        tick={{
                                            fontSize: 10,
                                            fill: "#A1A1AA",
                                        }}
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                    />

                                    <Tooltip
                                        content={
                                            <AnalyticsTooltip
                                                valueFormatter={(
                                                    value
                                                ) =>
                                                    `${value} result${
                                                        value ===
                                                        1
                                                            ? ""
                                                            : "s"
                                                    }`
                                                }
                                            />
                                        }
                                        cursor={{
                                            fill: `${theme.accent}08`,
                                        }}
                                    />

                                    <Bar
                                        dataKey="count"
                                        name="Results"
                                        fill={
                                            theme.accent
                                        }
                                        radius={[
                                            7,
                                            7,
                                            0,
                                            0,
                                        ]}
                                        maxBarSize={
                                            44
                                        }
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <ChartEmptyState />
                    )}
                </ChartCard>
            </section>

            {/* =================================================
                PARTICIPATION + TIME
            ================================================= */}

            <section className="grid gap-5 xl:grid-cols-2">
                <ChartCard
                    title="Participation Timeline"
                    description="Quiz completions and average performance over time."
                    icon={Activity}
                    theme={theme}
                >
                    {participationTimeline.length ? (
                        <div className="h-[320px]">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <AreaChart
                                    data={
                                        participationTimeline
                                    }
                                    margin={{
                                        top: 15,
                                        right: 15,
                                        left: -18,
                                        bottom: 10,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="participationFill"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor={
                                                    theme.accent
                                                }
                                                stopOpacity={
                                                    0.22
                                                }
                                            />

                                            <stop
                                                offset="100%"
                                                stopColor={
                                                    theme.accent
                                                }
                                                stopOpacity={
                                                    0
                                                }
                                            />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        vertical={
                                            false
                                        }
                                        stroke="#E4E4E7"
                                    />

                                    <XAxis
                                        dataKey="date"
                                        tick={{
                                            fontSize: 10,
                                            fill: "#71717A",
                                        }}
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                    />

                                    <YAxis
                                        allowDecimals={
                                            false
                                        }
                                        tick={{
                                            fontSize: 10,
                                            fill: "#A1A1AA",
                                        }}
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                    />

                                    <Tooltip
                                        content={
                                            <AnalyticsTooltip />
                                        }
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="completions"
                                        name="Completions"
                                        stroke={
                                            theme.accent
                                        }
                                        strokeWidth={
                                            2
                                        }
                                        fill="url(#participationFill)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <ChartEmptyState />
                    )}
                </ChartCard>

                <ChartCard
                    title="Completion Time"
                    description="Average time required to finish each chapter."
                    icon={Clock3}
                    theme={theme}
                >
                    {completionTimeData.length ? (
                        <div className="h-[320px]">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <LineChart
                                    data={
                                        completionTimeData
                                    }
                                    margin={{
                                        top: 15,
                                        right: 15,
                                        left: -8,
                                        bottom: 10,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="4 4"
                                        vertical={
                                            false
                                        }
                                        stroke="#E4E4E7"
                                    />

                                    <XAxis
                                        dataKey="chapter"
                                        tick={{
                                            fontSize: 10,
                                            fill: "#71717A",
                                        }}
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                    />

                                    <YAxis
                                        tick={{
                                            fontSize: 10,
                                            fill: "#A1A1AA",
                                        }}
                                        axisLine={
                                            false
                                        }
                                        tickLine={
                                            false
                                        }
                                        tickFormatter={(
                                            value
                                        ) =>
                                            `${value}m`
                                        }
                                    />

                                    <Tooltip
                                        content={
                                            <AnalyticsTooltip
                                                valueFormatter={(
                                                    value
                                                ) =>
                                                    `${formatNumber(
                                                        value,
                                                        2
                                                    )} min`
                                                }
                                            />
                                        }
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="averageMinutes"
                                        name="Average Time"
                                        stroke={
                                            theme.accent
                                        }
                                        strokeWidth={
                                            2.5
                                        }
                                        dot={{
                                            r: 4,
                                            fill:
                                                theme.accent,
                                            stroke:
                                                "#FFFFFF",
                                            strokeWidth:
                                                2,
                                        }}
                                        activeDot={{
                                            r: 6,
                                        }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <ChartEmptyState />
                    )}
                </ChartCard>
            </section>

            {/* =================================================
                RANKINGS
            ================================================= */}

            <section className="grid gap-5 xl:grid-cols-2">
                <RankingCard
                    title="Top Performers"
                    description="Highest normalized scores in the current filter."
                    icon={Trophy}
                    players={
                        topPerformers
                    }
                    type="score"
                    theme={theme}
                />

                <RankingCard
                    title="Fastest Finishers"
                    description="Quickest valid completion times. 0-second submissions are excluded."
                    icon={Zap}
                    players={
                        fastestFinishers
                    }
                    type="time"
                    theme={theme}
                />
            </section>

            {/* =================================================
                CHAPTER TABLE
            ================================================= */}

            <ChapterTable
                data={
                    paginatedChapterPerformance
                }
                totalItems={
                    visibleChapterPerformance.length
                }
                currentPage={
                    chapterPage
                }
                totalPages={
                    totalChapterPages
                }
                pageSize={
                    CHAPTERS_PER_PAGE
                }
                onPageChange={
                    setChapterPage
                }
                theme={theme}
            />
        </div>
    );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
    label,
    value,
    helper,
    icon: Icon,
    theme,
    delay = 0,
    className = "",
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 10,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                delay,
            }}
            className={`rounded-[22px] border border-zinc-200/80 bg-white p-4 shadow-[0_10px_35px_rgba(24,24,27,0.035)] sm:p-5 ${className}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                        color:
                            theme.accent,

                        borderColor:
                            `${theme.accent}20`,

                        backgroundColor:
                            theme.accentSoft,
                    }}
                >
                    <Icon size={17} />
                </div>

                <span
                    className="mt-1 h-2 w-2 rounded-full"
                    style={{
                        backgroundColor:
                            theme.accent,
                    }}
                />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                {label}
            </p>

            <p className="mt-1.5 truncate text-[22px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[25px]">
                {value}
            </p>

            <p className="mt-1 text-[10px] leading-4 text-zinc-400">
                {helper}
            </p>
        </motion.div>
    );
}

/* ============================================================
   INSIGHT CARD
============================================================ */

function InsightCard({
    icon: Icon,
    eyebrow,
    title,
    description,
    theme,
}) {
    return (
        <div className="rounded-[22px] border border-zinc-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(24,24,27,0.03)]">
            <div className="flex items-start gap-4">
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                        color:
                            theme.accent,

                        borderColor:
                            `${theme.accent}20`,

                        backgroundColor:
                            theme.accentSoft,
                    }}
                >
                    <Icon size={18} />
                </div>

                <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-zinc-400">
                        {eyebrow}
                    </p>

                    <p className="mt-1.5 truncate text-[15px] font-black text-zinc-900">
                        {title}
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   CHART CARD
============================================================ */

function ChartCard({
    title,
    description,
    icon: Icon,
    theme,
    children,
}) {
    return (
        <div className="overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white shadow-[0_12px_40px_rgba(24,24,27,0.035)]">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                        color:
                            theme.accent,

                        borderColor:
                            `${theme.accent}20`,

                        backgroundColor:
                            theme.accentSoft,
                    }}
                >
                    <Icon size={17} />
                </div>

                <div className="min-w-0">
                    <h3 className="text-[14px] font-black text-zinc-900">
                        {title}
                    </h3>

                    <p className="mt-0.5 text-[10px] text-zinc-400">
                        {description}
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-5">
                {children}
            </div>
        </div>
    );
}

/* ============================================================
   RANKING CARD
============================================================ */

function RankingCard({
    title,
    description,
    icon: Icon,
    players,
    type,
    theme,
}) {
    return (
        <div className="overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white shadow-[0_12px_40px_rgba(24,24,27,0.035)]">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                        color:
                            theme.accent,

                        borderColor:
                            `${theme.accent}20`,

                        backgroundColor:
                            theme.accentSoft,
                    }}
                >
                    <Icon size={17} />
                </div>

                <div>
                    <h3 className="text-[14px] font-black text-zinc-900">
                        {title}
                    </h3>

                    <p className="mt-0.5 text-[10px] text-zinc-400">
                        {description}
                    </p>
                </div>
            </div>

            {players.length ? (
                <div className="divide-y divide-zinc-100">
                    {players.map(
                        (
                            player,
                            index
                        ) => (
                            <div
                                key={`${player.id}-${type}-${index}`}
                                className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                            >
                                {/* RANK */}

                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black"
                                    style={
                                        index <
                                        3
                                            ? {
                                                  color:
                                                      theme.accent,

                                                  borderColor:
                                                      `${theme.accent}20`,

                                                  backgroundColor:
                                                      theme.accentSoft,
                                              }
                                            : {
                                                  color:
                                                      "#71717A",

                                                  borderColor:
                                                      "#E4E4E7",

                                                  backgroundColor:
                                                      "#FAFAFA",
                                              }
                                    }
                                >
                                    {index <
                                    3 ? (
                                        <Medal
                                            size={
                                                14
                                            }
                                        />
                                    ) : (
                                        index +
                                        1
                                    )}
                                </div>

                                {/* AVATAR */}

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-[10px] font-black text-zinc-700">
                                    {getInitials(
                                        player.name
                                    )}
                                </div>

                                {/* PLAYER */}

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12px] font-bold text-zinc-800">
                                        {player.name ||
                                            "Unknown participant"}
                                    </p>

                                    <p className="mt-0.5 truncate text-[9px] text-zinc-400">
                                        {player.place ||
                                            "—"}{" "}
                                        •{" "}
                                        {player.chapter ||
                                            "—"}
                                    </p>
                                </div>

                                {/* VALUE */}

                                <div className="shrink-0 text-right">
                                    <p
                                        className="text-[13px] font-black"
                                        style={{
                                            color:
                                                index <
                                                3
                                                    ? theme.accent
                                                    : "#3F3F46",
                                        }}
                                    >
                                        {type ===
                                        "score"
                                            ? player.percentage !==
                                              null
                                                ? formatPercent(
                                                      player.percentage
                                                  )
                                                : `${player.score}`
                                            : formatDuration(
                                                  player.validTime
                                              )}
                                    </p>

                                    <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                                        {type ===
                                        "score"
                                            ? player.totalQuestions >
                                              0
                                                ? `${player.score}/${player.totalQuestions}`
                                                : "Score"
                                            : "Time"}
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            ) : (
                <div className="px-5 py-12 text-center">
                    <Trophy
                        size={24}
                        className="mx-auto text-zinc-300"
                    />

                    <p className="mt-3 text-[12px] font-bold text-zinc-500">
                        No results
                        available
                    </p>
                </div>
            )}
        </div>
    );
}

/* ============================================================
   CHAPTER TABLE WITH PAGINATION
============================================================ */

function ChapterTable({
    data,
    totalItems,
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    theme,
}) {
    const startItem =
        totalItems === 0
            ? 0
            : (currentPage - 1) *
                  pageSize +
              1;

    const endItem = Math.min(
        currentPage * pageSize,
        totalItems
    );

    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from(
                {
                    length:
                        totalPages,
                },
                (_, index) =>
                    index + 1
            );
        }

        if (currentPage <= 3) {
            return [
                1,
                2,
                3,
                4,
                5,
            ];
        }

        if (
            currentPage >=
            totalPages - 2
        ) {
            return [
                totalPages - 4,
                totalPages - 3,
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        }

        return [
            currentPage - 2,
            currentPage - 1,
            currentPage,
            currentPage + 1,
            currentPage + 2,
        ];
    };

    const pageNumbers =
        getPageNumbers();

    return (
        <section className="overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white shadow-[0_12px_40px_rgba(24,24,27,0.035)]">
            {/* HEADER */}

            <div className="flex flex-col gap-4 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                        style={{
                            color:
                                theme.accent,

                            borderColor:
                                `${theme.accent}20`,

                            backgroundColor:
                                theme.accentSoft,
                        }}
                    >
                        <BarChart3
                            size={17}
                        />
                    </div>

                    <div>
                        <h3 className="text-[14px] font-black text-zinc-900">
                            Chapter
                            Performance
                            Summary
                        </h3>

                        <p className="mt-0.5 text-[10px] text-zinc-400">
                            Detailed
                            chapter-level
                            analytics.
                        </p>
                    </div>
                </div>

                {totalItems > 0 && (
                    <div className="shrink-0 self-start rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 sm:self-auto">
                        <span className="text-[9px] font-black uppercase tracking-[0.08em] text-zinc-500">
                            {totalItems}{" "}
                            {totalItems ===
                            1
                                ? "Chapter"
                                : "Chapters"}
                        </span>
                    </div>
                )}
            </div>

            {/* TABLE */}

            {data.length ? (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/70">
                                    <TableHeading>
                                        Chapter
                                    </TableHeading>

                                    <TableHeading align="right">
                                        Questions
                                    </TableHeading>

                                    <TableHeading align="right">
                                        Completions
                                    </TableHeading>

                                    <TableHeading align="right">
                                        Avg.
                                        Score
                                    </TableHeading>

                                    <TableHeading align="right">
                                        Avg.
                                        Time
                                    </TableHeading>

                                    <TableHeading align="right">
                                        Perfect
                                    </TableHeading>

                                    <TableHeading align="right">
                                        Performance
                                    </TableHeading>
                                </tr>
                            </thead>

                            <tbody>
                                {data.map(
                                    (
                                        item
                                    ) => (
                                        <tr
                                            key={
                                                item.chapter
                                            }
                                            className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                                                        style={{
                                                            color:
                                                                theme.accent,

                                                            borderColor:
                                                                `${theme.accent}20`,

                                                            backgroundColor:
                                                                theme.accentSoft,
                                                        }}
                                                    >
                                                        <BarChart3
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="max-w-[260px] truncate text-[12px] font-bold text-zinc-800">
                                                            {
                                                                item.chapter
                                                            }
                                                        </p>

                                                        <p className="mt-0.5 text-[9px] text-zinc-400">
                                                            Chapter
                                                            analytics
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <TableValue>
                                                {
                                                    item.questions
                                                }
                                            </TableValue>

                                            <TableValue>
                                                {
                                                    item.completions
                                                }
                                            </TableValue>

                                            <TableValue>
                                                {formatPercent(
                                                    item.averageScore
                                                )}
                                            </TableValue>

                                            <TableValue>
                                                {formatDuration(
                                                    item.averageTime
                                                )}
                                            </TableValue>

                                            <TableValue>
                                                {
                                                    item.perfectScores
                                                }
                                            </TableValue>

                                            <td className="px-5 py-4 text-right">
                                                <span
                                                    className="inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em]"
                                                    style={{
                                                        color:
                                                            theme.accent,

                                                        borderColor:
                                                            `${theme.accent}20`,

                                                        backgroundColor:
                                                            theme.accentSoft,
                                                    }}
                                                >
                                                    {getPerformanceLabel(
                                                        item.averageScore
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* =============================================
                        PAGINATION
                    ============================================= */}

                    <div className="flex flex-col gap-4 border-t border-zinc-100 bg-zinc-50/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        {/* RESULT COUNT */}

                        <p className="text-center text-[10px] font-medium text-zinc-400 sm:text-left">
                            Showing{" "}
                            <span className="font-black text-zinc-700">
                                {
                                    startItem
                                }
                            </span>
                            {" – "}
                            <span className="font-black text-zinc-700">
                                {
                                    endItem
                                }
                            </span>
                            {" of "}
                            <span className="font-black text-zinc-700">
                                {
                                    totalItems
                                }
                            </span>{" "}
                            chapters
                        </p>

                        {/* PAGINATION CONTROLS */}

                        {totalPages >
                            1 && (
                            <div className="flex items-center justify-center gap-1.5">
                                {/* PREVIOUS */}

                                <button
                                    type="button"
                                    disabled={
                                        currentPage ===
                                        1
                                    }
                                    onClick={() =>
                                        onPageChange(
                                            Math.max(
                                                1,
                                                currentPage -
                                                    1
                                            )
                                        )
                                    }
                                    className="flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-[9px] font-black text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                {/* DESKTOP PAGE NUMBERS */}

                                <div className="hidden items-center gap-1 sm:flex">
                                    {pageNumbers.map(
                                        (
                                            page
                                        ) => {
                                            const active =
                                                page ===
                                                currentPage;

                                            return (
                                                <button
                                                    key={
                                                        page
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        onPageChange(
                                                            page
                                                        )
                                                    }
                                                    className="flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-[10px] font-black transition"
                                                    style={
                                                        active
                                                            ? {
                                                                  color:
                                                                      theme.accent,

                                                                  borderColor:
                                                                      `${theme.accent}30`,

                                                                  backgroundColor:
                                                                      theme.accentSoft,
                                                              }
                                                            : {
                                                                  color:
                                                                      "#71717A",

                                                                  borderColor:
                                                                      "#E4E4E7",

                                                                  backgroundColor:
                                                                      "#FFFFFF",
                                                              }
                                                    }
                                                >
                                                    {
                                                        page
                                                    }
                                                </button>
                                            );
                                        }
                                    )}
                                </div>

                                {/* MOBILE PAGE INDICATOR */}

                                <div
                                    className="flex h-8 items-center rounded-lg border px-3 text-[9px] font-black sm:hidden"
                                    style={{
                                        color:
                                            theme.accent,

                                        borderColor:
                                            `${theme.accent}25`,

                                        backgroundColor:
                                            theme.accentSoft,
                                    }}
                                >
                                    {
                                        currentPage
                                    }{" "}
                                    /{" "}
                                    {
                                        totalPages
                                    }
                                </div>

                                {/* NEXT */}

                                <button
                                    type="button"
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    onClick={() =>
                                        onPageChange(
                                            Math.min(
                                                totalPages,
                                                currentPage +
                                                    1
                                            )
                                        )
                                    }
                                    className="flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-[9px] font-black text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="px-6 py-14 text-center">
                    <BarChart3
                        size={26}
                        className="mx-auto text-zinc-300"
                    />

                    <p className="mt-3 text-[12px] font-bold text-zinc-500">
                        No chapter
                        analytics
                        available
                    </p>
                </div>
            )}
        </section>
    );
}

/* ============================================================
   TABLE HELPERS
============================================================ */

function TableHeading({
    children,
    align = "left",
}) {
    return (
        <th
            className={`px-5 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400 ${
                align === "right"
                    ? "text-right"
                    : "text-left"
            }`}
        >
            {children}
        </th>
    );
}

function TableValue({
    children,
}) {
    return (
        <td className="px-5 py-4 text-right text-[11px] font-bold text-zinc-600">
            {children}
        </td>
    );
}

/* ============================================================
   TOOLTIP
============================================================ */

function AnalyticsTooltip({
    active,
    payload,
    label,
    valueFormatter,
}) {
    if (
        !active ||
        !payload?.length
    ) {
        return null;
    }

    return (
        <div className="min-w-[150px] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl">
            {label && (
                <p className="mb-2 text-[10px] font-black text-zinc-700">
                    {label}
                </p>
            )}

            <div className="space-y-1.5">
                {payload.map(
                    (entry) => (
                        <div
                            key={`${entry.name}-${entry.dataKey}`}
                            className="flex items-center justify-between gap-5"
                        >
                            <span className="text-[9px] text-zinc-400">
                                {
                                    entry.name
                                }
                            </span>

                            <span className="text-[10px] font-black text-zinc-700">
                                {valueFormatter
                                    ? valueFormatter(
                                          entry.value,
                                          entry
                                      )
                                    : entry.value}
                            </span>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

/* ============================================================
   EMPTY CHART
============================================================ */

function ChartEmptyState() {
    return (
        <div className="flex h-[320px] flex-col items-center justify-center text-center">
            <BarChart3
                size={26}
                className="text-zinc-300"
            />

            <p className="mt-3 text-[12px] font-bold text-zinc-500">
                No analytics
                available
            </p>

            <p className="mt-1 text-[10px] text-zinc-400">
                Completed results
                will appear here.
            </p>
        </div>
    );
}

/* ============================================================
   LOADING
============================================================ */

function AnalyticsLoading({
    theme,
}) {
    return (
        <div className="space-y-5">
            <div className="relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-7">
                <div
                    className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-[100px]"
                    style={{
                        backgroundColor:
                            `${theme.accent}10`,
                    }}
                />

                <div className="relative animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-zinc-100" />

                    <div className="mt-5 h-7 w-64 rounded-lg bg-zinc-100" />

                    <div className="mt-3 h-4 w-[min(100%,520px)] rounded bg-zinc-100" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {Array.from({
                    length: 5,
                }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[150px] animate-pulse rounded-[22px] border border-zinc-200 bg-white p-5"
                    >
                        <div className="h-10 w-10 rounded-xl bg-zinc-100" />

                        <div className="mt-5 h-3 w-20 rounded bg-zinc-100" />

                        <div className="mt-3 h-6 w-24 rounded bg-zinc-100" />
                    </div>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
                {Array.from({
                    length: 2,
                }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[390px] animate-pulse rounded-[24px] border border-zinc-200 bg-white p-6"
                    >
                        <div className="h-4 w-40 rounded bg-zinc-100" />

                        <div className="mt-6 h-[290px] rounded-2xl bg-zinc-50" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ============================================================
   ERROR
============================================================ */

function AnalyticsError({
    error,
    theme,
    onRetry,
}) {
    return (
        <div className="flex min-h-[420px] items-center justify-center">
            <div className="w-full max-w-md rounded-[26px] border border-zinc-200 bg-white p-7 text-center shadow-[0_18px_50px_rgba(24,24,27,0.05)]">
                <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border"
                    style={{
                        color:
                            theme.accent,

                        borderColor:
                            `${theme.accent}20`,

                        backgroundColor:
                            theme.accentSoft,
                    }}
                >
                    <AlertCircle
                        size={21}
                    />
                </div>

                <h2 className="mt-5 text-[17px] font-black text-zinc-900">
                    Analytics
                    unavailable
                </h2>

                <p className="mt-2 text-[12px] leading-5 text-zinc-500">
                    {error}
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-[11px] font-bold text-white"
                    style={{
                        backgroundColor:
                            theme.accent,
                    }}
                >
                    <RefreshCw
                        size={14}
                    />

                    Try Again
                </button>
            </div>
        </div>
    );
}

/* ============================================================
   SMALL ROLE INDICATOR
============================================================ */

function ShieldBadge({
    accent,
}) {
    return (
        <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
                backgroundColor:
                    accent,
            }}
        />
    );
}