import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { motion } from "framer-motion";

import {
    Activity,
    ArrowUpRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Eye,
    Monitor,
    Play,
    Radio,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Timer,
    Trophy,
    Users,
    Wifi,
    WifiOff,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import AdminLayout from "../components/admin/AdminLayout";

/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_DURATION = 20;
const HIDDEN_WINNER_COUNT = 3;

/* ============================================================
   HELPERS
============================================================ */

const safeNumber = (value, fallback = 0) => {
    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : fallback;
};

const formatCountdown = (milliseconds) => {
    const totalSeconds = Math.max(
        0,
        Math.floor(milliseconds / 1000)
    );

    const days = Math.floor(
        totalSeconds / 86400
    );

    const hours = Math.floor(
        (totalSeconds % 86400) / 3600
    );

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
};

const formatDateTime = (value) => {
    if (!value) {
        return "Not scheduled";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not scheduled";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const formatTimeTaken = (seconds) => {
    const value = safeNumber(seconds, 0);

    const minutes = Math.floor(
        value / 60
    );

    const remainingSeconds =
        value % 60;

    return `${minutes}m ${String(
        remainingSeconds
    ).padStart(2, "0")}s`;
};

const sortRanking = (a, b) => {
    const scoreDifference =
        safeNumber(b.score) -
        safeNumber(a.score);

    if (scoreDifference !== 0) {
        return scoreDifference;
    }

    const aTime =
        a.time_taken === null ||
            a.time_taken === undefined
            ? Infinity
            : safeNumber(
                a.time_taken,
                Infinity
            );

    const bTime =
        b.time_taken === null ||
            b.time_taken === undefined
            ? Infinity
            : safeNumber(
                b.time_taken,
                Infinity
            );

    if (aTime !== bTime) {
        return aTime - bTime;
    }

    const aCreated = new Date(
        a.created_at || 0
    ).getTime();

    const bCreated = new Date(
        b.created_at || 0
    ).getTime();

    return aCreated - bCreated;
};

/* ============================================================
   PAGE
============================================================ */

export default function AdminLiveControl() {
    const [quizConfig, setQuizConfig] =
        useState(null);

    const [results, setResults] =
        useState([]);

    const [questionCounts, setQuestionCounts] =
        useState({});

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [now, setNow] = useState(
        () => Date.now()
    );

    const [resultsConnected, setResultsConnected] =
        useState(false);

    const [configConnected, setConfigConnected] =
        useState(false);

    const [lastUpdated, setLastUpdated] =
        useState(null);

    /* ==========================================================
       LOAD DATA
    ========================================================== */

    const fetchLiveData =
        useCallback(async ({ silent = false } = {}) => {
            if (!silent) {
                setRefreshing(true);
            }

            try {
                setError("");

                const [
                    configResponse,
                    resultsResponse,
                    questionsResponse,
                ] = await Promise.all([
                    supabase
                        .from("quiz_config")
                        .select(
                            "start_time, duration, active_chapters"
                        )
                        .limit(1)
                        .maybeSingle(),

                    supabase
                        .from("results")
                        .select(
                            "id, name, place, chapter, score, time_taken, created_at"
                        ),

                    supabase
                        .from("questions")
                        .select("chapter"),
                ]);

                if (configResponse.error) {
                    throw configResponse.error;
                }

                if (resultsResponse.error) {
                    throw resultsResponse.error;
                }

                if (questionsResponse.error) {
                    throw questionsResponse.error;
                }

                setQuizConfig(
                    configResponse.data || null
                );

                setResults(
                    resultsResponse.data || []
                );

                const counts = {};

                (
                    questionsResponse.data || []
                ).forEach((question) => {
                    if (!question?.chapter) {
                        return;
                    }

                    counts[question.chapter] =
                        (counts[question.chapter] ||
                            0) + 1;
                });

                setQuestionCounts(counts);
                setLastUpdated(new Date());
            } catch (fetchError) {
                console.error(
                    "Unable to load live control data:",
                    fetchError
                );

                setError(
                    fetchError?.message ||
                    "Unable to load live event data."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        }, []);

    /* ==========================================================
       INITIAL LOAD
    ========================================================== */

    useEffect(() => {
        fetchLiveData({
            silent: true,
        });
    }, [fetchLiveData]);

    /* ==========================================================
       CLOCK
    ========================================================== */

    useEffect(() => {
        const interval =
            window.setInterval(() => {
                setNow(Date.now());
            }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    /* ==========================================================
       RESULTS REALTIME
    ========================================================== */

    useEffect(() => {
        const channel = supabase
            .channel(
                "admin-live-control-results"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "results",
                },
                () => {
                    fetchLiveData({
                        silent: true,
                    });
                }
            )
            .subscribe((status) => {
                setResultsConnected(
                    status === "SUBSCRIBED"
                );
            });

        return () => {
            setResultsConnected(false);

            supabase.removeChannel(
                channel
            );
        };
    }, [fetchLiveData]);

    /* ==========================================================
       QUIZ CONFIG REALTIME
    ========================================================== */

    useEffect(() => {
        const channel = supabase
            .channel(
                "admin-live-control-config"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "quiz_config",
                },
                () => {
                    fetchLiveData({
                        silent: true,
                    });
                }
            )
            .subscribe((status) => {
                setConfigConnected(
                    status === "SUBSCRIBED"
                );
            });

        return () => {
            setConfigConnected(false);

            supabase.removeChannel(
                channel
            );
        };
    }, [fetchLiveData]);

    /* ==========================================================
       ACTIVE CHAPTERS
    ========================================================== */

    const activeChapters =
        useMemo(() => {
            if (
                !Array.isArray(
                    quizConfig?.active_chapters
                )
            ) {
                return [];
            }

            return quizConfig.active_chapters
                .map((chapter) =>
                    String(chapter || "").trim()
                )
                .filter(Boolean);
        }, [quizConfig]);

    /* ==========================================================
       QUIZ STATE
    ========================================================== */

    const quizState =
        useMemo(() => {
            if (!quizConfig) {
                return {
                    status: "waiting",
                    label: "Not Configured",
                    message:
                        "Quiz configuration is unavailable.",
                    countdown: "—",
                    startTime: null,
                    endTime: null,
                };
            }

            const startTime =
                quizConfig.start_time
                    ? new Date(
                        quizConfig.start_time
                    ).getTime()
                    : null;

            if (
                !startTime ||
                !Number.isFinite(startTime)
            ) {
                return {
                    status: "waiting",
                    label: "Not Scheduled",
                    message:
                        "Set a quiz start time before going live.",
                    countdown: "—",
                    startTime: null,
                    endTime: null,
                };
            }

            const durationMinutes =
                safeNumber(
                    quizConfig.duration,
                    DEFAULT_DURATION
                ) || DEFAULT_DURATION;

            const endTime =
                startTime +
                durationMinutes *
                60 *
                1000;

            if (now < startTime) {
                return {
                    status: "upcoming",
                    label: "Upcoming",
                    message:
                        "Quiz is scheduled and waiting to begin.",
                    countdown:
                        formatCountdown(
                            startTime - now
                        ),
                    startTime,
                    endTime,
                };
            }

            if (now < endTime) {
                return {
                    status: "live",
                    label: "Live",
                    message:
                        "Quiz is currently open for participants.",
                    countdown:
                        formatCountdown(
                            endTime - now
                        ),
                    startTime,
                    endTime,
                };
            }

            return {
                status: "ended",
                label: "Ended",
                message:
                    "Quiz has finished. Winner reveal is available for chapters with results.",
                countdown: "Completed",
                startTime,
                endTime,
            };
        }, [quizConfig, now]);

    /* ==========================================================
       ACTIVE RESULTS
    ========================================================== */

    const activeResults =
        useMemo(() => {
            if (
                activeChapters.length === 0
            ) {
                return [];
            }

            const activeSet = new Set(
                activeChapters
            );

            return results.filter(
                (result) =>
                    activeSet.has(
                        result.chapter
                    )
            );
        }, [
            results,
            activeChapters,
        ]);

    /* ==========================================================
       CHAPTER STATS
    ========================================================== */

    const chapterStats =
        useMemo(() => {
            return activeChapters.map(
                (chapter) => {
                    const chapterResults =
                        results
                            .filter(
                                (result) =>
                                    result.chapter ===
                                    chapter
                            )
                            .sort(sortRanking);

                    const questionCount =
                        questionCounts[
                        chapter
                        ] || 0;

                    const winnerReady =
                        chapterResults.length >=
                        HIDDEN_WINNER_COUNT;

                    const topPlayer =
                        chapterResults[0] ||
                        null;

                    return {
                        chapter,
                        completed:
                            chapterResults.length,
                        questionCount,
                        winnerReady,
                        topPlayer,
                    };
                }
            );
        }, [
            activeChapters,
            results,
            questionCounts,
        ]);

    /* ==========================================================
       EVENT METRICS
    ========================================================== */

    const totalQuestions =
        useMemo(() => {
            return activeChapters.reduce(
                (sum, chapter) =>
                    sum +
                    (questionCounts[
                        chapter
                    ] || 0),
                0
            );
        }, [
            activeChapters,
            questionCounts,
        ]);

    const winnerReadyChapters =
        useMemo(() => {
            return chapterStats.filter(
                (chapter) =>
                    chapter.winnerReady
            ).length;
        }, [chapterStats]);

    const eventReady =
        activeChapters.length > 0 &&
        activeChapters.every(
            (chapter) =>
                (questionCounts[
                    chapter
                ] || 0) > 0
        );

    const realtimeConnected =
        resultsConnected &&
        configConnected;

    /* ==========================================================
       OPEN PROJECTOR
    ========================================================== */

    const openProjector = () => {
        window.open(
            "/live",
            "_blank",
            "noopener,noreferrer"
        );
    };

    /* ==========================================================
       UI
    ========================================================== */

    return (
        <AdminLayout>
            {({ theme }) => (
                <div>
                    {/* ================================================
              HERO
          ================================================ */}

                    <motion.section
                        initial={{
                            opacity: 0,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="relative overflow-hidden rounded-[24px] border border-zinc-200/90 bg-white p-5 shadow-[0_10px_30px_rgba(24,24,27,0.07)] sm:p-7 lg:p-8"
                    >
                        <div
                            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[100px]"
                            style={{
                                backgroundColor:
                                    `${theme.accent}10`,
                            }}
                        />

                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.025]"
                            style={{
                                backgroundImage:
                                    "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
                                backgroundSize:
                                    "34px 34px",
                            }}
                        />

                        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2">
                                    <Radio
                                        size={14}
                                        style={{
                                            color:
                                                theme.accent,
                                        }}
                                    />

                                    <p
                                        className="text-[11px] font-black uppercase tracking-[0.15em]"
                                        style={{
                                            color:
                                                theme.accent,
                                        }}
                                    >
                                        Live Event
                                        Operations
                                    </p>
                                </div>

                                <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[32px] lg:text-[36px]">
                                    Projector Control
                                    Center
                                </h2>

                                <p className="mt-3 max-w-xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
                                    Monitor the active
                                    QUIZTIANS event,
                                    chapters, submissions
                                    and winner readiness
                                    from one place.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <QuizStatusBadge
                                        state={quizState}
                                    />

                                    <ConnectionBadge
                                        connected={
                                            realtimeConnected
                                        }
                                    />

                                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-600">
                                        <BookOpen
                                            size={12}
                                        />
                                        {
                                            activeChapters.length
                                        }{" "}
                                        Active{" "}
                                        {activeChapters.length ===
                                            1
                                            ? "Chapter"
                                            : "Chapters"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2.5 sm:flex-row xl:flex-col">
                                <motion.button
                                    type="button"
                                    onClick={
                                        openProjector
                                    }
                                    whileHover={{
                                        y: -2,
                                    }}
                                    whileTap={{
                                        scale: 0.98,
                                    }}
                                    className="flex min-h-[50px] items-center justify-center gap-2.5 rounded-xl px-5 text-[12px] font-black text-white shadow-lg"
                                    style={{
                                        backgroundColor:
                                            theme.accent,
                                    }}
                                >
                                    <Monitor
                                        size={17}
                                    />

                                    Open Projector

                                    <ArrowUpRight
                                        size={15}
                                    />
                                </motion.button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        fetchLiveData()
                                    }
                                    disabled={
                                        refreshing
                                    }
                                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-[12px] font-black text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <RefreshCw
                                        size={15}
                                        className={
                                            refreshing
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />

                                    {refreshing
                                        ? "Refreshing..."
                                        : "Refresh"}
                                </button>
                            </div>
                        </div>
                    </motion.section>

                    {/* ================================================
              ERROR
          ================================================ */}

                    {error && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-600">
                            {error}
                        </div>
                    )}

                    {/* ================================================
              LOADING
          ================================================ */}

                    {loading ? (
                        <LoadingState
                            theme={theme}
                        />
                    ) : (
                        <>
                            {/* ============================================
                  EVENT STATUS
              ============================================ */}

                            <section className="mt-5 grid grid-cols-1 gap-4 lg:mt-6 xl:grid-cols-[1.15fr_0.85fr]">
                                <EventStatusCard
                                    state={
                                        quizState
                                    }
                                    config={
                                        quizConfig
                                    }
                                    chapters={
                                        activeChapters
                                    }
                                    theme={theme}
                                />

                                <EventReadinessCard
                                    eventReady={
                                        eventReady
                                    }
                                    realtimeConnected={
                                        realtimeConnected
                                    }
                                    chapterCount={
                                        activeChapters.length
                                    }
                                    totalQuestions={
                                        totalQuestions
                                    }
                                    theme={theme}
                                />
                            </section>

                            {/* ============================================
                  METRICS
              ============================================ */}

                            <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                                <MetricCard
                                    title="Completed"
                                    value={
                                        activeResults.length
                                    }
                                    icon={Users}
                                    theme={theme}
                                    delay={0.05}
                                />

                                <MetricCard
                                    title="Active Chapters"
                                    value={
                                        activeChapters.length
                                    }
                                    icon={BookOpen}
                                    theme={theme}
                                    delay={0.1}
                                />

                                <MetricCard
                                    title="Questions"
                                    value={
                                        totalQuestions
                                    }
                                    icon={Sparkles}
                                    theme={theme}
                                    delay={0.15}
                                />

                                <MetricCard
                                    title="Winner Ready"
                                    value={
                                        winnerReadyChapters
                                    }
                                    icon={Trophy}
                                    theme={theme}
                                    delay={0.2}
                                />
                            </section>

                            {/* ============================================
                  CHAPTER MONITOR
              ============================================ */}

                            <section className="mt-4">
                                <Panel>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <SectionHeading
                                            icon={Monitor}
                                            title="Chapter Monitor"
                                            description="Live event status for every active chapter"
                                            theme={theme}
                                        />

                                        <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                                            <span
                                                className={`h-2 w-2 rounded-full ${realtimeConnected
                                                        ? "bg-emerald-500"
                                                        : "bg-red-500"
                                                    }`}
                                            />

                                            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-600">
                                                {realtimeConnected
                                                    ? "Realtime"
                                                    : "Reconnecting"}
                                            </span>
                                        </div>
                                    </div>

                                    {chapterStats.length ===
                                        0 ? (
                                        <EmptyState
                                            icon={
                                                BookOpen
                                            }
                                            title="No active chapters"
                                            description="Configure at least one active chapter in Quiz Configuration."
                                        />
                                    ) : (
                                        <div className="mt-5 grid gap-3 xl:grid-cols-2">
                                            {chapterStats.map(
                                                (
                                                    chapter,
                                                    index
                                                ) => (
                                                    <ChapterCard
                                                        key={
                                                            chapter.chapter
                                                        }
                                                        data={
                                                            chapter
                                                        }
                                                        index={
                                                            index
                                                        }
                                                        theme={
                                                            theme
                                                        }
                                                        quizEnded={
                                                            quizState.status ===
                                                            "ended"
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                </Panel>
                            </section>

                            {/* ============================================
                  WINNER READINESS + PROJECTOR
              ============================================ */}

                            <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                                <WinnerReadinessPanel
                                    chapters={
                                        chapterStats
                                    }
                                    quizEnded={
                                        quizState.status ===
                                        "ended"
                                    }
                                    theme={theme}
                                />

                                <ProjectorPanel
                                    realtimeConnected={
                                        realtimeConnected
                                    }
                                    lastUpdated={
                                        lastUpdated
                                    }
                                    onOpen={
                                        openProjector
                                    }
                                    theme={theme}
                                />
                            </section>
                        </>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}

/* ============================================================
   EVENT STATUS CARD
============================================================ */

function EventStatusCard({
    state,
    config,
    chapters,
    theme,
}) {
    return (
        <Panel>
            <div className="flex items-start justify-between gap-4">
                <SectionHeading
                    icon={Clock3}
                    title="Event Status"
                    description="Current quiz timing and availability"
                    theme={theme}
                />

                <QuizStatusBadge
                    state={state}
                />
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-[#F8FAFC] p-4 sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                    {state.status ===
                        "upcoming"
                        ? "Starts In"
                        : state.status ===
                            "live"
                            ? "Ends In"
                            : "Event State"}
                </p>

                <p className="mt-2 text-[24px] font-black tracking-[-0.035em] text-zinc-900 sm:text-[28px]">
                    {state.countdown}
                </p>

                <p className="mt-2 text-[12px] leading-5 text-zinc-500">
                    {state.message}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-3">
                    <MiniDetail
                        label="Start"
                        value={formatDateTime(
                            config?.start_time
                        )}
                    />

                    <MiniDetail
                        label="Duration"
                        value={`${safeNumber(
                            config?.duration,
                            DEFAULT_DURATION
                        ) ||
                            DEFAULT_DURATION
                            } min`}
                    />

                    <MiniDetail
                        label="Chapters"
                        value={String(
                            chapters.length
                        )}
                    />
                </div>
            </div>

            {chapters.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {chapters.map(
                        (chapter) => (
                            <span
                                key={chapter}
                                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-bold text-zinc-600 shadow-sm"
                            >
                                {chapter}
                            </span>
                        )
                    )}
                </div>
            )}
        </Panel>
    );
}

/* ============================================================
   EVENT READINESS
============================================================ */

function EventReadinessCard({
    eventReady,
    realtimeConnected,
    chapterCount,
    totalQuestions,
    theme,
}) {
    const checks = [
        {
            label:
                "Active chapters configured",
            ready:
                chapterCount > 0,
        },
        {
            label:
                "Questions available",
            ready:
                totalQuestions > 0,
        },
        {
            label:
                "Realtime connected",
            ready:
                realtimeConnected,
        },
    ];

    return (
        <Panel>
            <SectionHeading
                icon={ShieldCheck}
                title="Event Readiness"
                description="Quick operational health check"
                theme={theme}
            />

            <div
                className={`mt-5 rounded-2xl border p-4 ${eventReady &&
                        realtimeConnected
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${eventReady &&
                                realtimeConnected
                                ? "border-emerald-200 bg-white text-emerald-600"
                                : "border-amber-200 bg-white text-amber-600"
                            }`}
                    >
                        {eventReady &&
                            realtimeConnected ? (
                            <CheckCircle2
                                size={18}
                            />
                        ) : (
                            <Activity
                                size={18}
                            />
                        )}
                    </div>

                    <div>
                        <p className="text-[13px] font-black text-zinc-900">
                            {eventReady &&
                                realtimeConnected
                                ? "Ready for live display"
                                : "Event needs attention"}
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-500">
                            {eventReady &&
                                realtimeConnected
                                ? "Core event services are available."
                                : "Review the checks below before the event."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {checks.map(
                    (check) => (
                        <div
                            key={check.label}
                            className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200/80 bg-[#F8FAFC] px-3.5 py-3"
                        >
                            <span className="text-[11px] font-semibold text-zinc-600">
                                {check.label}
                            </span>

                            <span
                                className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${check.ready
                                        ? "text-emerald-600"
                                        : "text-amber-600"
                                    }`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${check.ready
                                            ? "bg-emerald-500"
                                            : "bg-amber-500"
                                        }`}
                                />

                                {check.ready
                                    ? "Ready"
                                    : "Check"}
                            </span>
                        </div>
                    )
                )}
            </div>
        </Panel>
    );
}

/* ============================================================
   CHAPTER CARD
============================================================ */

function ChapterCard({
    data,
    index,
    theme,
    quizEnded,
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
            transition={{
                delay:
                    0.05 +
                    index * 0.04,
            }}
            className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-4 transition hover:border-zinc-300 hover:bg-white sm:p-5"
        >
            <div
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-[55px]"
                style={{
                    backgroundColor:
                        theme.accentSoft,
                }}
            />

            <div className="relative">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black"
                                style={{
                                    color:
                                        theme.accent,
                                    backgroundColor:
                                        theme.accentSoft,
                                }}
                            >
                                {index + 1}
                            </span>

                            <p className="truncate text-[13px] font-black text-zinc-900">
                                {data.chapter}
                            </p>
                        </div>
                    </div>

                    <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${data.winnerReady
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-zinc-200 bg-white text-zinc-500"
                            }`}
                    >
                        {data.winnerReady
                            ? "Podium Ready"
                            : "Collecting"}
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <ChapterMetric
                        label="Completed"
                        value={
                            data.completed
                        }
                    />

                    <ChapterMetric
                        label="Questions"
                        value={
                            data.questionCount
                        }
                    />
                </div>

                <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
                                Winner Reveal
                            </p>

                            <p className="mt-1 text-[11px] font-bold text-zinc-700">
                                {quizEnded
                                    ? data.winnerReady
                                        ? "Ready for final reveal"
                                        : "Waiting for enough results"
                                    : "Available after quiz ends"}
                            </p>
                        </div>

                        <Trophy
                            size={17}
                            className={
                                quizEnded &&
                                    data.winnerReady
                                    ? "text-amber-500"
                                    : "text-zinc-300"
                            }
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ============================================================
   WINNER READINESS PANEL
============================================================ */

function WinnerReadinessPanel({
    chapters,
    quizEnded,
    theme,
}) {
    return (
        <Panel>
            <SectionHeading
                icon={Trophy}
                title="Winner Reveal Readiness"
                description="Podium availability by chapter"
                theme={theme}
            />

            {chapters.length ===
                0 ? (
                <EmptyState
                    icon={Trophy}
                    title="No chapters available"
                    description="Winner readiness will appear once active chapters are configured."
                />
            ) : (
                <div className="mt-5 space-y-2.5">
                    {chapters.map(
                        (chapter) => {
                            const ready =
                                quizEnded &&
                                chapter.winnerReady;

                            return (
                                <div
                                    key={
                                        chapter.chapter
                                    }
                                    className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-[#F8FAFC] px-3.5 py-3"
                                >
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${ready
                                                ? "border-amber-200 bg-amber-50 text-amber-600"
                                                : "border-zinc-200 bg-white text-zinc-400"
                                            }`}
                                    >
                                        <Trophy
                                            size={15}
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12px] font-black text-zinc-800">
                                            {
                                                chapter.chapter
                                            }
                                        </p>

                                        <p className="mt-1 text-[10px] text-zinc-500">
                                            {
                                                chapter.completed
                                            }{" "}
                                            completed
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${ready
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : "border-zinc-200 bg-white text-zinc-500"
                                            }`}
                                    >
                                        {ready
                                            ? "Ready"
                                            : quizEnded
                                                ? "Waiting"
                                                : "Locked"}
                                    </span>
                                </div>
                            );
                        }
                    )}
                </div>
            )}

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-[10px] leading-5 text-zinc-500">
                    Winner controls remain
                    on the projector in this
                    first version. Remote
                    winner commands will be
                    added in the synchronized
                    control phase.
                </p>
            </div>
        </Panel>
    );
}

/* ============================================================
   PROJECTOR PANEL
============================================================ */

function ProjectorPanel({
    realtimeConnected,
    lastUpdated,
    onOpen,
    theme,
}) {
    return (
        <Panel>
            <SectionHeading
                icon={Monitor}
                title="Projector Display"
                description="Launch and monitor the public live screen"
                theme={theme}
            />

            <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-[#F8FAFC] p-4 sm:p-5">
                <div className="flex items-center gap-4">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                        style={{
                            color:
                                theme.accent,
                            borderColor:
                                `${theme.accent}25`,
                            backgroundColor:
                                theme.accentSoft,
                        }}
                    >
                        <Monitor
                            size={21}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-black text-zinc-900">
                            QUIZTIANS Live
                            Display
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-500">
                            /live
                        </p>
                    </div>

                    <div
                        className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 ${realtimeConnected
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-600"
                            }`}
                    >
                        {realtimeConnected ? (
                            <Wifi
                                size={12}
                            />
                        ) : (
                            <WifiOff
                                size={12}
                            />
                        )}

                        <span className="hidden text-[8px] font-black uppercase tracking-[0.1em] sm:block">
                            {realtimeConnected
                                ? "Connected"
                                : "Offline"}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpen}
                    className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-[11px] font-black text-white shadow-md transition hover:opacity-95"
                    style={{
                        backgroundColor:
                            theme.accent,
                    }}
                >
                    <ExternalLink
                        size={15}
                    />

                    Open Live Display
                </button>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
                        Last Sync
                    </span>

                    <span className="text-[10px] font-bold text-zinc-600">
                        {lastUpdated
                            ? lastUpdated.toLocaleTimeString(
                                [],
                                {
                                    hour:
                                        "2-digit",
                                    minute:
                                        "2-digit",
                                    second:
                                        "2-digit",
                                }
                            )
                            : "Waiting..."}
                    </span>
                </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-violet-200/70 bg-violet-50/60 px-4 py-3">
                <Eye
                    size={15}
                    className="mt-0.5 shrink-0 text-violet-500"
                />

                <p className="text-[10px] leading-5 text-zinc-600">
                    This page currently
                    monitors the event. It
                    does not yet change
                    projector chapter,
                    rotation or winner state.
                    That synchronization comes
                    in Step 2.
                </p>
            </div>
        </Panel>
    );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function QuizStatusBadge({
    state,
}) {
    const styles = {
        live: {
            badge:
                "border-emerald-200 bg-emerald-50 text-emerald-700",
            dot: "bg-emerald-500",
        },

        upcoming: {
            badge:
                "border-amber-200 bg-amber-50 text-amber-700",
            dot: "bg-amber-500",
        },

        ended: {
            badge:
                "border-violet-200 bg-violet-50 text-violet-700",
            dot: "bg-violet-500",
        },

        waiting: {
            badge:
                "border-zinc-200 bg-zinc-100 text-zinc-600",
            dot: "bg-zinc-400",
        },
    };

    const current =
        styles[state?.status] ||
        styles.waiting;

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] ${current.badge}`}
        >
            <span className="relative flex h-2 w-2">
                {state?.status ===
                    "live" && (
                        <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${current.dot}`}
                        />
                    )}

                <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${current.dot}`}
                />
            </span>

            {state?.label ||
                "Waiting"}
        </span>
    );
}

/* ============================================================
   CONNECTION BADGE
============================================================ */

function ConnectionBadge({
    connected,
}) {
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] ${connected
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
        >
            {connected ? (
                <Wifi size={12} />
            ) : (
                <WifiOff
                    size={12}
                />
            )}

            {connected
                ? "Realtime Connected"
                : "Realtime Connecting"}
        </span>
    );
}

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
    title,
    value,
    icon: Icon,
    theme,
    delay = 0,
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
            transition={{ delay }}
            whileHover={{
                y: -2,
            }}
            className="relative overflow-hidden rounded-[20px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition-shadow hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.10)] sm:p-5"
        >
            <div
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-[55px]"
                style={{
                    backgroundColor:
                        theme.accentSoft,
                }}
            />

            <div className="relative flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500 sm:text-[11px]">
                        {title}
                    </p>

                    <p className="mt-3 text-[30px] font-black tracking-[-0.045em] text-zinc-900 sm:text-[36px]">
                        {value}
                    </p>
                </div>

                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                        borderColor:
                            `${theme.accent}25`,
                        backgroundColor:
                            theme.accentSoft,
                    }}
                >
                    <Icon
                        size={18}
                        strokeWidth={1.8}
                        style={{
                            color:
                                theme.accent,
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

/* ============================================================
   PANEL
============================================================ */

function Panel({
    children,
    className = "",
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
            className={`rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6 ${className}`}
        >
            {children}
        </motion.div>
    );
}

/* ============================================================
   SECTION HEADING
============================================================ */

function SectionHeading({
    icon: Icon,
    title,
    description,
    theme,
}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                style={{
                    borderColor:
                        `${theme.accent}20`,
                    backgroundColor:
                        theme.accentSoft,
                }}
            >
                <Icon
                    size={17}
                    strokeWidth={1.8}
                    style={{
                        color:
                            theme.accent,
                    }}
                />
            </div>

            <div>
                <h3 className="text-[14px] font-black text-zinc-900 sm:text-[15px]">
                    {title}
                </h3>

                <p className="mt-1 text-[11px] text-zinc-500 sm:text-[12px]">
                    {description}
                </p>
            </div>
        </div>
    );
}

/* ============================================================
   MINI DETAIL
============================================================ */

function MiniDetail({
    label,
    value,
}) {
    return (
        <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
                {label}
            </p>

            <p className="mt-1.5 break-words text-[11px] font-black leading-5 text-zinc-700">
                {value}
            </p>
        </div>
    );
}

/* ============================================================
   CHAPTER METRIC
============================================================ */

function ChapterMetric({
    label,
    value,
}) {
    return (
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
                {label}
            </p>

            <p className="mt-1.5 text-[20px] font-black tracking-[-0.03em] text-zinc-900">
                {value}
            </p>
        </div>
    );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
    icon: Icon,
    title,
    description,
}) {
    return (
        <div className="mt-5 flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-5 text-center">
            <Icon
                size={25}
                className="text-zinc-400"
            />

            <p className="mt-3 text-[12px] font-black text-zinc-700">
                {title}
            </p>

            <p className="mt-1 max-w-sm text-[10px] leading-5 text-zinc-500">
                {description}
            </p>
        </div>
    );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState({
    theme,
}) {
    return (
        <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
            <div className="text-center">
                <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border"
                    style={{
                        borderColor:
                            `${theme.accent}25`,
                        backgroundColor:
                            theme.accentSoft,
                    }}
                >
                    <RefreshCw
                        size={18}
                        className="animate-spin"
                        style={{
                            color:
                                theme.accent,
                        }}
                    />
                </div>

                <p className="mt-4 text-[13px] font-black text-zinc-800">
                    Loading live event
                </p>

                <p className="mt-1 text-[11px] text-zinc-500">
                    Connecting to QUIZTIANS
                    realtime services...
                </p>
            </div>
        </div>
    );
}