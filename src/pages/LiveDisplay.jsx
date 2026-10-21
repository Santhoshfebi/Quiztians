import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock3,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Sparkles,
  Crown,
  Medal,
  RotateCcw,
} from "lucide-react";

import { supabase } from "../supabaseClient";

const CHAPTER_ROTATION_MS = 15000;
const HIGHLIGHT_DURATION_MS = 4500;

/* ============================================================
   HELPERS
============================================================ */

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) {
    return "—";
  }

  const value = Number(seconds);

  if (!Number.isFinite(value)) {
    return "—";
  }

  const mins = Math.floor(value / 60);
  const secs = value % 60;

  if (mins > 0) {
    return `${mins}m ${String(secs).padStart(2, "0")}s`;
  }

  return `${secs}s`;
}

function formatCountdown(milliseconds) {
  const safeMs = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMs / 1000);

  const days = Math.floor(totalSeconds / 86400);

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(
      2,
      "0"
    )}h ${String(minutes).padStart(
      2,
      "0"
    )}m`;
  }

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function sortLeaderboard(data = []) {
  return [...data].sort((a, b) => {
    const aScore = Number(a.score || 0);
    const bScore = Number(b.score || 0);

    // Highest score first
    if (bScore !== aScore) {
      return bScore - aScore;
    }

    // Fastest time next
    const aTime =
      a.time_taken === null ||
      a.time_taken === undefined
        ? Infinity
        : Number(a.time_taken);

    const bTime =
      b.time_taken === null ||
      b.time_taken === undefined
        ? Infinity
        : Number(b.time_taken);

    if (aTime !== bTime) {
      return aTime - bTime;
    }

    // Earliest submission last
    const aCreated = a.created_at
      ? new Date(a.created_at).getTime()
      : Infinity;

    const bCreated = b.created_at
      ? new Date(b.created_at).getTime()
      : Infinity;

    return aCreated - bCreated;
  });
}

function initials(name = "") {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

/* ============================================================
   LIVE DISPLAY
============================================================ */

export default function LiveDisplay() {
  const [config, setConfig] = useState(null);

  const [chapterIndex, setChapterIndex] =
    useState(0);

  const [results, setResults] = useState([]);

  const [totalQuestions, setTotalQuestions] =
    useState(0);

  const [loading, setLoading] = useState(true);

  const [resultsLoading, setResultsLoading] =
    useState(false);

  const [connected, setConnected] =
    useState(true);

  const [now, setNow] = useState(Date.now());

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  /* ==========================================================
     WINNER MODE STATE
  ========================================================== */

  const [winnerMode, setWinnerMode] =
    useState(false);

  const [winnerRevealStep, setWinnerRevealStep] =
    useState(0);

  /* ==========================================================
     LIVE ANIMATION STATE
  ========================================================== */

  const [
    highlightedPlayerId,
    setHighlightedPlayerId,
  ] = useState(null);

  const [newLeaderId, setNewLeaderId] =
    useState(null);

  const previousTopFiveRef = useRef([]);

  const leaderboardInitializedRef =
    useRef(false);

  const highlightTimerRef = useRef(null);

  /* ==========================================================
     ACTIVE CHAPTERS
  ========================================================== */

  const activeChapters = useMemo(() => {
    const chapters = config?.active_chapters;

    if (!Array.isArray(chapters)) {
      return [];
    }

    return chapters.filter(Boolean);
  }, [config]);

  const currentChapter =
    activeChapters.length > 0
      ? activeChapters[
          chapterIndex % activeChapters.length
        ]
      : null;

  /* ==========================================================
     QUIZ STATE
  ========================================================== */

  const quizState = useMemo(() => {
    if (!config?.start_time) {
      return {
        status: "waiting",
        label: "WAITING",
        countdown: null,
      };
    }

    const startTime = new Date(
      config.start_time
    ).getTime();

    if (!Number.isFinite(startTime)) {
      return {
        status: "waiting",
        label: "WAITING",
        countdown: null,
      };
    }

    const durationMinutes =
      Number(config.duration) || 20;

    const endTime =
      startTime + durationMinutes * 60 * 1000;

    if (now < startTime) {
      return {
        status: "upcoming",
        label: "STARTING SOON",
        countdown: startTime - now,
      };
    }

    if (now >= startTime && now < endTime) {
      return {
        status: "live",
        label: "LIVE",
        countdown: endTime - now,
      };
    }

    return {
      status: "ended",
      label: "COMPLETED",
      countdown: 0,
    };
  }, [config, now]);

  /* ==========================================================
     FETCH QUIZ CONFIG
  ========================================================== */

  const fetchQuizConfig =
    useCallback(async () => {
      try {
        const { data, error } = await supabase
          .from("quiz_config")
          .select(
            "start_time, duration, active_chapters"
          )
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        setConfig(data || null);
        setConnected(true);
      } catch (error) {
        console.error(
          "Live display config error:",
          error
        );

        setConnected(false);
      }
    }, []);

  /* ==========================================================
     DETECT LEADERBOARD CHANGES
  ========================================================== */

  const detectLeaderboardChanges =
    useCallback((sortedResults) => {
      const newTopFive = sortedResults.slice(
        0,
        5
      );

      /*
       * Initial fetch should not trigger
       * any celebration.
       */
      if (!leaderboardInitializedRef.current) {
        previousTopFiveRef.current =
          newTopFive;

        leaderboardInitializedRef.current =
          true;

        return;
      }

      const previousTopFive =
        previousTopFiveRef.current;

      const previousIds = new Set(
        previousTopFive.map(
          (player) => player.id
        )
      );

      const newTopFivePlayer =
        newTopFive.find(
          (player) =>
            !previousIds.has(player.id)
        );

      const previousLeader =
        previousTopFive[0];

      const currentLeader =
        newTopFive[0];

      const leaderChanged =
        currentLeader &&
        previousLeader &&
        currentLeader.id !==
          previousLeader.id;

      if (highlightTimerRef.current) {
        window.clearTimeout(
          highlightTimerRef.current
        );
      }

      /*
       * Stronger celebration when someone
       * takes the #1 position.
       */
      if (leaderChanged) {
        setHighlightedPlayerId(
          currentLeader.id
        );

        setNewLeaderId(
          currentLeader.id
        );

        highlightTimerRef.current =
          window.setTimeout(() => {
            setHighlightedPlayerId(null);
            setNewLeaderId(null);
          }, HIGHLIGHT_DURATION_MS);
      } else if (newTopFivePlayer) {
        /*
         * Normal Top 5 entry celebration.
         */
        setHighlightedPlayerId(
          newTopFivePlayer.id
        );

        setNewLeaderId(null);

        highlightTimerRef.current =
          window.setTimeout(() => {
            setHighlightedPlayerId(null);
          }, HIGHLIGHT_DURATION_MS);
      }

      previousTopFiveRef.current =
        newTopFive;
    }, []);

  /* ==========================================================
     FETCH CHAPTER DATA
  ========================================================== */

  const fetchChapterData =
    useCallback(
      async (chapter, options = {}) => {
        const {
          detectChanges = false,
        } = options;

        if (!chapter) {
          setResults([]);
          setTotalQuestions(0);
          setResultsLoading(false);

          return;
        }

        setResultsLoading(true);

        try {
          const [
            resultsResponse,
            questionsResponse,
          ] = await Promise.all([
            supabase
              .from("results")
              .select(
                "id, name, place, score, time_taken, created_at"
              )
              .eq("chapter", chapter),

            supabase
              .from("questions")
              .select("*", {
                head: true,
                count: "exact",
              })
              .eq("chapter", chapter),
          ]);

          if (resultsResponse.error) {
            throw resultsResponse.error;
          }

          if (questionsResponse.error) {
            throw questionsResponse.error;
          }

          const sorted = sortLeaderboard(
            resultsResponse.data || []
          );

          if (detectChanges) {
            detectLeaderboardChanges(
              sorted
            );
          } else {
            previousTopFiveRef.current =
              sorted.slice(0, 5);

            leaderboardInitializedRef.current =
              true;
          }

          setResults(sorted);

          setTotalQuestions(
            questionsResponse.count || 0
          );

          setLastUpdated(new Date());

          setConnected(true);
        } catch (error) {
          console.error(
            "Live display chapter error:",
            error
          );

          setConnected(false);
        } finally {
          setResultsLoading(false);
        }
      },
      [detectLeaderboardChanges]
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);

      await fetchQuizConfig();

      if (mounted) {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [fetchQuizConfig]);

  /* ==========================================================
     CURRENT CHAPTER CHANGED
  ========================================================== */

  useEffect(() => {
    leaderboardInitializedRef.current =
      false;

    previousTopFiveRef.current = [];

    setHighlightedPlayerId(null);
    setNewLeaderId(null);

    /*
     * Winner Mode belongs to the current
     * chapter, so close it when chapter changes.
     */
    setWinnerMode(false);
    setWinnerRevealStep(0);

    if (highlightTimerRef.current) {
      window.clearTimeout(
        highlightTimerRef.current
      );

      highlightTimerRef.current = null;
    }

    if (!currentChapter) {
      setResults([]);
      setTotalQuestions(0);

      return;
    }

    fetchChapterData(currentChapter, {
      detectChanges: false,
    });
  }, [
    currentChapter,
    fetchChapterData,
  ]);

  /* ==========================================================
     KEEP CHAPTER INDEX VALID
  ========================================================== */

  useEffect(() => {
    if (activeChapters.length === 0) {
      setChapterIndex(0);

      return;
    }

    setChapterIndex((current) => {
      if (current >= activeChapters.length) {
        return 0;
      }

      return current;
    });
  }, [activeChapters.length]);

  /* ==========================================================
     CHAPTER ROTATION
  ========================================================== */

  useEffect(() => {
    /*
     * Pause automatic rotation while
     * Winner Mode is open.
     */
    if (
      activeChapters.length <= 1 ||
      winnerMode
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setChapterIndex((current) => {
        return (
          (current + 1) %
          activeChapters.length
        );
      });
    }, CHAPTER_ROTATION_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    activeChapters.length,
    winnerMode,
  ]);

  /* ==========================================================
     CLOCK
  ========================================================== */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /* ==========================================================
     FULLSCREEN
  ========================================================== */

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(
        "Unable to toggle fullscreen:",
        error
      );
    }
  };

  /* ==========================================================
     REALTIME RESULTS
  ========================================================== */

  useEffect(() => {
    const channel = supabase
      .channel(
        "quiztians-live-display-results"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "results",
        },
        (payload) => {
          const changedChapter =
            payload.new?.chapter ||
            payload.old?.chapter;

          if (
            currentChapter &&
            changedChapter === currentChapter
          ) {
            fetchChapterData(
              currentChapter,
              {
                detectChanges: true,
              }
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          setConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    currentChapter,
    fetchChapterData,
  ]);

  /* ==========================================================
     REALTIME QUIZ CONFIG
  ========================================================== */

  useEffect(() => {
    const channel = supabase
      .channel(
        "quiztians-live-display-config"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_config",
        },
        () => {
          fetchQuizConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQuizConfig]);

  /* ==========================================================
     CLEANUP HIGHLIGHT TIMER
  ========================================================== */

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(
          highlightTimerRef.current
        );
      }
    };
  }, []);

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const topFive = useMemo(
    () => results.slice(0, 5),
    [results]
  );

  const completedCount = results.length;

  const highestScore =
    topFive.length > 0
      ? Number(topFive[0]?.score || 0)
      : null;

  /* ==========================================================
     WINNER MODE
  ========================================================== */

  const canRevealWinners =
    quizState.status === "ended" &&
    topFive.length > 0;

  const enterWinnerMode = () => {
    if (!canRevealWinners) {
      return;
    }

    setWinnerMode(true);
    setWinnerRevealStep(0);
  };

  const revealNextWinner = () => {
    setWinnerRevealStep((current) =>
      Math.min(current + 1, 4)
    );
  };

  const exitWinnerMode = () => {
    setWinnerMode(false);
    setWinnerRevealStep(0);
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return <LiveDisplayLoading />;
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070709] text-white">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-28%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.09] blur-[180px]" />

        <div className="absolute -left-[220px] bottom-[-220px] h-[520px] w-[520px] rounded-full bg-indigo-600/[0.055] blur-[160px]" />

        <div className="absolute -right-[220px] top-[25%] h-[520px] w-[520px] rounded-full bg-violet-600/[0.045] blur-[160px]" />

        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)
            `,
            backgroundSize: "54px 54px",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
      </div>

      {/* =====================================================
          SCREEN
      ===================================================== */}

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-4 sm:px-7 lg:px-10 lg:py-6 2xl:px-14">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="flex shrink-0 items-center justify-between gap-6 border-b border-white/[0.06] pb-4 lg:pb-5">
          {/* BRAND */}

          <div className="flex items-center gap-3 lg:gap-4">
            <img
              src="/branding/quiztians-q.png"
              alt=""
              className="h-10 w-10 object-contain lg:h-12 lg:w-12 2xl:h-14 2xl:w-14"
            />

            <div>
              <img
                src="/branding/quiztians-wordmark.png"
                alt="QUIZTIANS"
                className="h-9 w-auto object-contain object-left lg:h-11 2xl:h-12"
              />

              <p className="mt-[-4px] text-[8px] font-black uppercase tracking-[0.24em] text-zinc-700 lg:text-[9px]">
                Learn • Play • Compete
              </p>
            </div>
          </div>

          {/* RIGHT STATUS */}

          <div className="flex items-center gap-2 lg:gap-3">
            {/* WINNER MODE BUTTON */}

            <AnimatePresence>
              {canRevealWinners &&
                !winnerMode && (
                  <motion.button
                    type="button"
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
                    onClick={
                      enterWinnerMode
                    }
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 text-amber-300 transition hover:border-amber-400/35 hover:bg-amber-400/[0.12] lg:h-11 lg:px-4"
                  >
                    <Crown
                      size={15}
                      strokeWidth={1.8}
                    />

                    <span className="hidden text-[9px] font-black uppercase tracking-[0.12em] md:inline">
                      Reveal Winners
                    </span>
                  </motion.button>
                )}
            </AnimatePresence>

            {/* FULLSCREEN */}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="group inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-zinc-500 transition hover:border-violet-500/20 hover:bg-violet-500/[0.06] hover:text-violet-300 lg:h-11 lg:px-4"
              aria-label={
                isFullscreen
                  ? "Exit fullscreen"
                  : "Enter fullscreen"
              }
              title={
                isFullscreen
                  ? "Exit fullscreen"
                  : "Enter fullscreen"
              }
            >
              {isFullscreen ? (
                <Minimize2
                  size={15}
                  strokeWidth={1.8}
                />
              ) : (
                <Maximize2
                  size={15}
                  strokeWidth={1.8}
                />
              )}

              <span className="hidden text-[9px] font-black uppercase tracking-[0.12em] md:inline">
                {isFullscreen
                  ? "Exit Fullscreen"
                  : "Fullscreen"}
              </span>
            </button>

            {/* CHAPTER INDICATOR */}

            {activeChapters.length > 1 && (
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-2 md:flex">
                <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">
                  Chapter
                </span>

                <span className="text-[10px] font-black text-zinc-300">
                  {chapterIndex + 1}/
                  {activeChapters.length}
                </span>
              </div>
            )}

            <ConnectionBadge
              connected={connected}
            />

            <StatusBadge state={quizState} />
          </div>
        </header>

        {/* ===================================================
            MAIN AREA
        =================================================== */}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 py-4 lg:grid-cols-[0.72fr_1.28fr] lg:gap-5 lg:py-5 2xl:gap-7">
          {/* =================================================
              LEFT
          ================================================= */}

          <section className="flex min-h-0 flex-col gap-4 lg:gap-5">
            {/* CURRENT CHALLENGE */}

            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#101013] p-6 lg:rounded-[30px] lg:p-8 2xl:p-10"
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/[0.08] blur-[100px]" />

              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="h-px w-7 bg-violet-500" />

                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-violet-400 2xl:text-[11px]">
                    Current Challenge
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={
                      currentChapter ||
                      "no-chapter"
                    }
                    initial={{
                      opacity: 0,
                      y: 16,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -16,
                    }}
                    transition={{
                      duration: 0.35,
                    }}
                  >
                    <h1 className="mt-5 break-words text-[clamp(2rem,4vw,4.8rem)] font-black leading-[0.98] tracking-[-0.055em] text-white">
                      {currentChapter ||
                        "No active chapter"}
                    </h1>

                    <p className="mt-4 max-w-lg text-[11px] font-medium leading-5 text-zinc-600 lg:text-xs 2xl:text-sm">
                      {currentChapter
                        ? "Live rankings update automatically as participants complete the challenge."
                        : "Waiting for an active chapter to be configured."}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* TIMER */}

                <div className="mt-7 border-t border-white/[0.06] pt-5 lg:mt-9">
                  <div className="flex items-center gap-2">
                    <Clock3
                      size={15}
                      className="text-zinc-600"
                    />

                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-700">
                      {quizState.status ===
                      "upcoming"
                        ? "Starts In"
                        : quizState.status ===
                            "live"
                          ? "Time Remaining"
                          : quizState.status ===
                              "ended"
                            ? "Quiz Status"
                            : "Event Status"}
                    </span>
                  </div>

                  <div className="mt-2">
                    {quizState.status ===
                      "upcoming" ||
                    quizState.status ===
                      "live" ? (
                      <p className="font-mono text-2xl font-black tracking-[-0.04em] text-zinc-200 lg:text-3xl 2xl:text-4xl">
                        {formatCountdown(
                          quizState.countdown
                        )}
                      </p>
                    ) : (
                      <p className="text-xl font-black tracking-[-0.03em] text-zinc-300 lg:text-2xl">
                        {quizState.label}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* STATS */}

            <div className="grid grid-cols-2 gap-4 lg:gap-5">
              <StatCard
                icon={Users}
                label="Completed"
                value={completedCount}
                description="Submissions"
              />

              <StatCard
                icon={Trophy}
                label="Top Score"
                value={
                  highestScore !== null
                    ? totalQuestions > 0
                      ? `${highestScore}/${totalQuestions}`
                      : highestScore
                    : "—"
                }
                description="Current best"
              />
            </div>
          </section>

          {/* =================================================
              LIVE LEADERBOARD
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              x: 16,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.45,
            }}
            className="relative flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/[0.075] bg-[#101013] lg:rounded-[30px]"
          >
            <div className="pointer-events-none absolute left-1/2 top-[-150px] h-[340px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/[0.035] blur-[120px]" />

            {/* HEADER */}

            <div className="relative flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4 lg:px-7 lg:py-5 2xl:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/[0.06] lg:h-11 lg:w-11">
                  <Trophy
                    size={19}
                    className="text-amber-400"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400/70">
                    Live Rankings
                  </p>

                  <h2 className="mt-0.5 text-base font-black tracking-[-0.025em] text-white lg:text-lg 2xl:text-xl">
                    Top 5 Players
                  </h2>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.055] px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-emerald-400">
                  Auto Updating
                </span>
              </div>
            </div>

            {/* COLUMN HEADERS */}

            <div className="hidden shrink-0 grid-cols-[60px_minmax(0,1fr)_110px_120px] items-center gap-4 border-b border-white/[0.04] px-6 py-3 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-800 sm:grid lg:px-7 2xl:grid-cols-[72px_minmax(0,1fr)_130px_140px] 2xl:px-8">
              <span>Rank</span>

              <span>Participant</span>

              <span className="text-right">
                Score
              </span>

              <span className="text-right">
                Time
              </span>
            </div>

            {/* LIST */}

            <div className="relative min-h-0 flex-1 p-3 lg:p-4 2xl:p-5">
              {!currentChapter ? (
                <EmptyLeaderboard
                  title="Waiting for a chapter"
                  description="Activate a chapter from quiz configuration to begin the live display."
                />
              ) : resultsLoading &&
                results.length === 0 ? (
                <LeaderboardSkeleton />
              ) : topFive.length === 0 ? (
                <EmptyLeaderboard
                  title="Waiting for players"
                  description="The leaderboard will appear as soon as the first participant completes the quiz."
                />
              ) : (
                <motion.div
                  layout
                  className="flex h-full flex-col gap-2 lg:gap-2.5 2xl:gap-3"
                >
                  <AnimatePresence
                    initial={false}
                    mode="popLayout"
                  >
                    {topFive.map(
                      (player, index) => (
                        <LeaderboardRow
                          key={player.id}
                          player={player}
                          rank={index + 1}
                          totalQuestions={
                            totalQuestions
                          }
                          highlighted={
                            highlightedPlayerId ===
                            player.id
                          }
                          newLeader={
                            newLeaderId ===
                            player.id
                          }
                        />
                      )
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.section>
        </div>

        {/* ===================================================
            WINNER MODE
        =================================================== */}

        <AnimatePresence>
          {winnerMode && (
            <WinnerMode
              chapter={currentChapter}
              winners={topFive.slice(0, 3)}
              totalQuestions={
                totalQuestions
              }
              revealStep={
                winnerRevealStep
              }
              onRevealNext={
                revealNextWinner
              }
              onExit={exitWinnerMode}
            />
          )}
        </AnimatePresence>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="flex shrink-0 items-center justify-between gap-5 border-t border-white/[0.05] pt-3 lg:pt-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            />

            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700 lg:text-[9px]">
              {connected
                ? "Results update live"
                : "Connection interrupted"}
            </p>
          </div>

          {lastUpdated && (
            <p className="hidden text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-800 sm:block">
              Updated{" "}
              {lastUpdated.toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              )}
            </p>
          )}

          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-800 lg:text-[9px]">
            QUIZTIANS · Live Event
          </p>
        </footer>
      </div>
    </main>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ state }) {
  const config = {
    live: {
      classes:
        "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400",
      dot: "bg-emerald-400",
    },

    upcoming: {
      classes:
        "border-amber-500/20 bg-amber-500/[0.07] text-amber-400",
      dot: "bg-amber-400",
    },

    ended: {
      classes:
        "border-violet-500/20 bg-violet-500/[0.07] text-violet-400",
      dot: "bg-violet-400",
    },

    waiting: {
      classes:
        "border-white/[0.07] bg-white/[0.025] text-zinc-500",
      dot: "bg-zinc-600",
    },
  };

  const current =
    config[state.status] || config.waiting;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 lg:px-4 ${current.classes}`}
    >
      <span className="relative flex h-2 w-2">
        {state.status === "live" && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${current.dot}`}
          />
        )}

        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${current.dot}`}
        />
      </span>

      <span className="text-[9px] font-black uppercase tracking-[0.16em] lg:text-[10px]">
        {state.label}
      </span>
    </div>
  );
}

/* ============================================================
   CONNECTION BADGE
============================================================ */

function ConnectionBadge({ connected }) {
  return (
    <div
      className={`hidden items-center gap-2 rounded-full border px-3 py-2 sm:flex ${
        connected
          ? "border-white/[0.06] bg-white/[0.025] text-zinc-600"
          : "border-red-500/15 bg-red-500/[0.05] text-red-400"
      }`}
    >
      {connected ? (
        <Wifi size={13} />
      ) : (
        <WifiOff size={13} />
      )}

      <span className="text-[8px] font-black uppercase tracking-[0.14em]">
        {connected
          ? "Connected"
          : "Offline"}
      </span>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-[22px] border border-white/[0.07] bg-[#101013] p-4 lg:rounded-[24px] lg:p-5 2xl:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.06] lg:h-10 lg:w-10">
          <Icon
            size={17}
            className="text-violet-400"
          />
        </div>

        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
          {label}
        </p>
      </div>

      <p className="mt-4 text-2xl font-black tracking-[-0.045em] text-white lg:text-3xl 2xl:text-4xl">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-medium text-zinc-700 lg:text-[10px]">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   LEADERBOARD ROW
============================================================ */

function LeaderboardRow({
  player,
  rank,
  totalQuestions,
  highlighted,
  newLeader,
}) {
  const rankConfig = {
    1: {
      medal: "🥇",
      label: "1",
      row:
        "border-amber-500/20 bg-amber-500/[0.055]",
      avatar:
        "border-amber-500/25 bg-amber-500/[0.09] text-amber-200",
      score: "text-amber-300",
    },

    2: {
      medal: "🥈",
      label: "2",
      row:
        "border-zinc-400/10 bg-zinc-400/[0.025]",
      avatar:
        "border-zinc-400/15 bg-zinc-400/[0.06] text-zinc-300",
      score: "text-zinc-200",
    },

    3: {
      medal: "🥉",
      label: "3",
      row:
        "border-orange-500/10 bg-orange-500/[0.025]",
      avatar:
        "border-orange-500/15 bg-orange-500/[0.055] text-orange-300",
      score: "text-zinc-300",
    },

    4: {
      medal: null,
      label: "4",
      row:
        "border-white/[0.045] bg-white/[0.015]",
      avatar:
        "border-white/[0.06] bg-white/[0.03] text-zinc-400",
      score: "text-zinc-300",
    },

    5: {
      medal: null,
      label: "5",
      row:
        "border-white/[0.045] bg-white/[0.015]",
      avatar:
        "border-white/[0.06] bg-white/[0.03] text-zinc-400",
      score: "text-zinc-300",
    },
  };

  const style = rankConfig[rank];

  const highlightClass = newLeader
    ? "border-amber-400/50 bg-amber-400/[0.10] shadow-[0_0_45px_rgba(245,158,11,0.12)]"
    : highlighted
      ? "border-violet-400/35 bg-violet-500/[0.09] shadow-[0_0_40px_rgba(139,92,246,0.10)]"
      : style.row;

  return (
    <motion.div
      layout
      layoutId={`live-player-${player.id}`}
      initial={{
        opacity: 0,
        y: 18,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale:
          highlighted || newLeader
            ? [1, 1.018, 1]
            : 1,
      }}
      exit={{
        opacity: 0,
        x: 40,
        scale: 0.97,
      }}
      transition={{
        layout: {
          type: "spring",
          stiffness: 220,
          damping: 24,
        },

        opacity: {
          duration: 0.25,
        },

        scale: {
          duration: 0.6,
        },
      }}
      className={`relative grid min-h-0 flex-1 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[18px] border px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-500 sm:grid-cols-[60px_minmax(0,1fr)_110px_120px] sm:gap-4 sm:px-4 lg:rounded-[20px] lg:px-5 2xl:grid-cols-[72px_minmax(0,1fr)_130px_140px] 2xl:px-6 ${highlightClass}`}
    >
      {/* HIGHLIGHT SWEEP */}

      <AnimatePresence>
        {(highlighted || newLeader) && (
          <motion.div
            initial={{
              opacity: 0,
              x: "-100%",
            }}
            animate={{
              opacity: [0, 0.8, 0],
              x: "140%",
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 1.4,
              ease: "easeInOut",
            }}
            className={`pointer-events-none absolute inset-y-0 w-1/3 skew-x-[-18deg] ${
              newLeader
                ? "bg-gradient-to-r from-transparent via-amber-300/10 to-transparent"
                : "bg-gradient-to-r from-transparent via-violet-300/10 to-transparent"
            }`}
          />
        )}
      </AnimatePresence>

      {/* RANK */}

      <div className="relative flex items-center gap-2">
        <span className="text-xl lg:text-2xl">
          {style.medal || (
            <span className="text-sm font-black text-zinc-700 lg:text-base">
              #{style.label}
            </span>
          )}
        </span>
      </div>

      {/* PLAYER */}

      <div className="relative flex min-w-0 items-center gap-3 lg:gap-4">
        <motion.div
          animate={
            newLeader
              ? {
                  scale: [1, 1.12, 1],
                }
              : {}
          }
          transition={{
            duration: 0.6,
          }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black lg:h-12 lg:w-12 lg:rounded-2xl lg:text-xs 2xl:h-14 2xl:w-14 2xl:text-sm ${style.avatar}`}
        >
          {initials(player.name)}
        </motion.div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-black tracking-[-0.02em] text-zinc-100 lg:text-base 2xl:text-lg">
              {player.name || "Unknown"}
            </p>

            <AnimatePresence>
              {newLeader && (
                <motion.span
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                    x: -5,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  className="hidden shrink-0 items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/[0.10] px-2 py-1 text-[7px] font-black uppercase tracking-[0.1em] text-amber-300 md:inline-flex"
                >
                  <Sparkles size={9} />
                  New Leader
                </motion.span>
              )}

              {highlighted &&
                !newLeader && (
                  <motion.span
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className="hidden shrink-0 rounded-full border border-violet-400/20 bg-violet-500/[0.09] px-2 py-1 text-[7px] font-black uppercase tracking-[0.1em] text-violet-300 md:inline-flex"
                  >
                    New
                  </motion.span>
                )}
            </AnimatePresence>
          </div>

          <p className="mt-0.5 truncate text-[9px] font-medium text-zinc-700 lg:text-[10px] 2xl:text-xs">
            {player.place || "—"}
          </p>
        </div>
      </div>

      {/* SCORE */}

      <div className="relative text-right">
        <motion.p
          key={`${player.id}-${player.score}`}
          initial={{
            opacity: 0.5,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className={`text-lg font-black tracking-[-0.035em] lg:text-xl 2xl:text-2xl ${style.score}`}
        >
          {player.score ?? 0}

          {totalQuestions > 0 && (
            <span className="ml-1 text-[9px] font-bold text-zinc-700 lg:text-[10px]">
              / {totalQuestions}
            </span>
          )}
        </motion.p>

        <p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-800 sm:hidden">
          Score
        </p>
      </div>

      {/* TIME */}

      <div className="relative hidden text-right sm:block">
        <p className="font-mono text-[11px] font-black text-zinc-500 lg:text-xs 2xl:text-sm">
          {formatTime(player.time_taken)}
        </p>

        <p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-zinc-800">
          Time
        </p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   WINNER MODE
============================================================ */

function WinnerMode({
  chapter,
  winners,
  totalQuestions,
  revealStep,
  onRevealNext,
  onExit,
}) {
  const first = winners[0];
  const second = winners[1];
  const third = winners[2];

  const revealComplete =
    revealStep >= 4;

  const getButtonText = () => {
    if (revealStep === 0) {
      return "Reveal 3rd Place";
    }

    if (revealStep === 1) {
      return "Reveal 2nd Place";
    }

    if (revealStep === 2) {
      return "Reveal Champion";
    }

    if (revealStep === 3) {
      return "Show Final Podium";
    }

    return "Podium Complete";
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.4,
      }}
      className="fixed inset-0 z-[100] overflow-hidden bg-[#070709]"
    >
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.7,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 1.2,
          }}
          className="absolute left-1/2 top-[-300px] h-[850px] w-[850px] -translate-x-1/2 rounded-full bg-amber-500/[0.08] blur-[190px]"
        />

        <div className="absolute -bottom-[280px] -left-[200px] h-[600px] w-[600px] rounded-full bg-violet-600/[0.07] blur-[180px]" />

        <div className="absolute -bottom-[280px] -right-[200px] h-[600px] w-[600px] rounded-full bg-indigo-600/[0.06] blur-[180px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)
            `,
            backgroundSize: "58px 58px",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      </div>

      {/* SCREEN */}

      <div className="relative z-10 flex h-screen flex-col px-6 py-5 lg:px-10 lg:py-6 2xl:px-14">
        {/* HEADER */}

        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <img
              src="/branding/quiztians-q.png"
              alt=""
              className="h-10 w-10 object-contain lg:h-12 lg:w-12"
            />

            <div>
              <img
                src="/branding/quiztians-wordmark.png"
                alt="QUIZTIANS"
                className="h-9 w-auto object-contain object-left lg:h-11"
              />

              <p className="mt-[-3px] text-[8px] font-black uppercase tracking-[0.22em] text-zinc-700">
                Learn • Play • Compete
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-zinc-500 transition hover:border-violet-500/20 hover:bg-violet-500/[0.06] hover:text-zinc-200"
          >
            <RotateCcw
              size={14}
              strokeWidth={1.8}
            />

            <span className="text-[9px] font-black uppercase tracking-[0.12em]">
              Return to Live
            </span>
          </button>
        </header>

        {/* TITLE */}

        <div className="shrink-0 pt-5 text-center lg:pt-6">
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/[0.05] px-3 py-1.5">
              <Trophy
                size={12}
                className="text-amber-400"
              />

              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400">
                Final Results
              </span>
            </div>

            <h1 className="mt-3 text-[clamp(1.8rem,3vw,3.4rem)] font-black tracking-[-0.055em] text-white">
              {chapter}
            </h1>

            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-700">
              QUIZTIANS Champions
            </p>
          </motion.div>
        </div>

        {/* PODIUM */}

        <div className="flex min-h-0 flex-1 items-end justify-center py-5 lg:py-7">
          <div className="grid w-full max-w-6xl grid-cols-3 items-end gap-4 lg:gap-6">
            {/* SECOND */}

            <div className="flex justify-center">
              <AnimatePresence mode="wait">
                {revealStep >= 2 ? (
                  <PodiumWinner
                    key="second-place"
                    player={second}
                    rank={2}
                    totalQuestions={
                      totalQuestions
                    }
                    finalMode={
                      revealComplete
                    }
                  />
                ) : (
                  <HiddenPodium
                    rank={2}
                    label="2nd Place"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* FIRST */}

            <div className="flex justify-center">
              <AnimatePresence mode="wait">
                {revealStep >= 3 ? (
                  <PodiumWinner
                    key="first-place"
                    player={first}
                    rank={1}
                    totalQuestions={
                      totalQuestions
                    }
                    finalMode={
                      revealComplete
                    }
                  />
                ) : (
                  <HiddenPodium
                    rank={1}
                    label="Champion"
                  />
                )}
              </AnimatePresence>
            </div>

            {/* THIRD */}

            <div className="flex justify-center">
              <AnimatePresence mode="wait">
                {revealStep >= 1 ? (
                  <PodiumWinner
                    key="third-place"
                    player={third}
                    rank={3}
                    totalQuestions={
                      totalQuestions
                    }
                    finalMode={
                      revealComplete
                    }
                  />
                ) : (
                  <HiddenPodium
                    rank={3}
                    label="3rd Place"
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* REVEAL CONTROLS */}

        <div className="shrink-0 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-center">
            {!revealComplete ? (
              <motion.button
                key={revealStep}
                type="button"
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                whileHover={{
                  scale: 1.025,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                onClick={onRevealNext}
                className={`inline-flex min-w-[210px] items-center justify-center gap-2 rounded-2xl border px-7 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] transition ${
                  revealStep === 2
                    ? "border-amber-400/30 bg-amber-400/[0.10] text-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.08)]"
                    : "border-violet-500/20 bg-violet-500/[0.07] text-violet-300"
                }`}
              >
                {revealStep === 2 ? (
                  <Crown size={16} />
                ) : (
                  <Medal size={16} />
                )}

                {getButtonText()}
              </motion.button>
            ) : (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="flex items-center gap-2"
              >
                <Sparkles
                  size={14}
                  className="text-amber-400"
                />

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">
                  Congratulations Champions
                </p>

                <Sparkles
                  size={14}
                  className="text-amber-400"
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   PODIUM WINNER
============================================================ */

function PodiumWinner({
  player,
  rank,
  totalQuestions,
  finalMode,
}) {
  if (!player) {
    return (
      <div className="flex h-[270px] w-full max-w-[290px] items-center justify-center rounded-[28px] border border-white/[0.05] bg-white/[0.02]">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-700">
          No Result
        </p>
      </div>
    );
  }

  const styles = {
    1: {
      medal: "🥇",
      title: "Champion",
      container:
        "border-amber-400/30 bg-gradient-to-b from-amber-400/[0.10] to-[#111114]",
      avatar:
        "border-amber-400/30 bg-amber-400/[0.10] text-amber-200",
      titleColor: "text-amber-300",
      scoreColor: "text-amber-300",
      height:
        "min-h-[330px] lg:min-h-[380px]",
    },

    2: {
      medal: "🥈",
      title: "2nd Place",
      container:
        "border-zinc-300/15 bg-gradient-to-b from-zinc-300/[0.055] to-[#111114]",
      avatar:
        "border-zinc-300/20 bg-zinc-300/[0.07] text-zinc-200",
      titleColor: "text-zinc-300",
      scoreColor: "text-zinc-300",
      height:
        "min-h-[285px] lg:min-h-[325px]",
    },

    3: {
      medal: "🥉",
      title: "3rd Place",
      container:
        "border-orange-400/15 bg-gradient-to-b from-orange-400/[0.045] to-[#111114]",
      avatar:
        "border-orange-400/20 bg-orange-400/[0.07] text-orange-300",
      titleColor: "text-orange-300",
      scoreColor: "text-orange-300",
      height:
        "min-h-[255px] lg:min-h-[290px]",
    },
  };

  const style = styles[rank];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 80,
        scale: 0.82,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness:
          rank === 1 ? 130 : 160,
        damping: 17,
      }}
      className={`relative flex w-full max-w-[320px] flex-col items-center justify-center overflow-hidden rounded-[28px] border p-5 text-center lg:rounded-[32px] lg:p-7 ${style.container} ${style.height}`}
    >
      {/* CHAMPION GLOW */}

      {rank === 1 && (
        <>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: finalMode
                ? [0.3, 0.8, 0.3]
                : 0.45,
            }}
            transition={{
              duration: 2.5,
              repeat: finalMode
                ? Infinity
                : 0,
            }}
            className="pointer-events-none absolute left-1/2 top-[-130px] h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-amber-400/[0.14] blur-[100px]"
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
        </>
      )}

      <div className="relative">
        <motion.div
          initial={{
            scale: 0,
            rotate: -20,
          }}
          animate={{
            scale: 1,
            rotate: 0,
          }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 170,
          }}
          className="text-4xl lg:text-5xl 2xl:text-6xl"
        >
          {style.medal}
        </motion.div>

        <p
          className={`mt-3 text-[8px] font-black uppercase tracking-[0.22em] lg:text-[9px] ${style.titleColor}`}
        >
          {style.title}
        </p>

        <div
          className={`mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-[20px] border text-base font-black lg:h-20 lg:w-20 lg:rounded-[24px] lg:text-xl ${style.avatar}`}
        >
          {initials(player.name)}
        </div>

        <h2 className="mt-4 truncate text-xl font-black tracking-[-0.04em] text-white lg:text-2xl 2xl:text-3xl">
          {player.name || "Unknown"}
        </h2>

        <p className="mt-1 truncate text-[9px] font-medium text-zinc-600 lg:text-[10px]">
          {player.place || "—"}
        </p>

        <div className="mt-5 flex items-center justify-center gap-5 border-t border-white/[0.06] pt-4">
          <div>
            <p
              className={`text-xl font-black tracking-[-0.04em] lg:text-2xl ${style.scoreColor}`}
            >
              {player.score ?? 0}

              {totalQuestions > 0 && (
                <span className="ml-1 text-[9px] font-bold text-zinc-700">
                  / {totalQuestions}
                </span>
              )}
            </p>

            <p className="mt-1 text-[7px] font-black uppercase tracking-[0.14em] text-zinc-800">
              Score
            </p>
          </div>

          <div className="h-8 w-px bg-white/[0.06]" />

          <div>
            <p className="font-mono text-sm font-black text-zinc-400 lg:text-base">
              {formatTime(
                player.time_taken
              )}
            </p>

            <p className="mt-1 text-[7px] font-black uppercase tracking-[0.14em] text-zinc-800">
              Time
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   HIDDEN PODIUM
============================================================ */

function HiddenPodium({
  rank,
  label,
}) {
  const heights = {
    1: "min-h-[330px] lg:min-h-[380px]",
    2: "min-h-[285px] lg:min-h-[325px]",
    3: "min-h-[255px] lg:min-h-[290px]",
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
      }}
      className={`flex w-full max-w-[320px] flex-col items-center justify-center rounded-[28px] border border-white/[0.045] bg-white/[0.015] p-5 text-center lg:rounded-[32px] ${heights[rank]}`}
    >
      <motion.div
        animate={{
          opacity: [0.25, 0.5, 0.25],
          scale: [1, 1.04, 1],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/[0.05] bg-white/[0.02] lg:h-20 lg:w-20"
      >
        {rank === 1 ? (
          <Crown
            size={26}
            strokeWidth={1.3}
            className="text-zinc-800"
          />
        ) : (
          <Medal
            size={26}
            strokeWidth={1.3}
            className="text-zinc-800"
          />
        )}
      </motion.div>

      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-800">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-zinc-700">
        Ready to reveal
      </p>
    </motion.div>
  );
}

/* ============================================================
   EMPTY LEADERBOARD
============================================================ */

function EmptyLeaderboard({
  title,
  description,
}) {
  return (
    <div className="flex h-full min-h-[300px] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/[0.06] bg-white/[0.025]">
          <Trophy
            size={26}
            strokeWidth={1.6}
            className="text-zinc-700"
          />
        </div>

        <h3 className="mt-5 text-base font-black tracking-[-0.025em] text-zinc-400 lg:text-lg">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-xs text-[10px] leading-5 text-zinc-700 lg:text-xs">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   LEADERBOARD SKELETON
============================================================ */

function LeaderboardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2.5">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="min-h-[64px] flex-1 animate-pulse rounded-[20px] border border-white/[0.04] bg-white/[0.02]"
        />
      ))}
    </div>
  );
}

/* ============================================================
   INITIAL LOADING
============================================================ */

function LiveDisplayLoading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070709] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.09] blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)
            `,
            backgroundSize: "54px 54px",
          }}
        />
      </div>

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="relative text-center"
      >
        <img
          src="/branding/quiztians-q.png"
          alt=""
          className="mx-auto h-16 w-16 object-contain lg:h-20 lg:w-20"
        />

        <img
          src="/branding/quiztians-wordmark.png"
          alt="QUIZTIANS"
          className="mx-auto mt-3 h-11 w-auto object-contain lg:h-14"
        />

        <div className="mx-auto mt-7 h-1 w-36 overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div
            initial={{
              x: "-100%",
            }}
            animate={{
              x: "200%",
            }}
            transition={{
              duration: 1.25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 rounded-full bg-violet-500"
          />
        </div>

        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700">
          Preparing Live Event Display
        </p>
      </motion.div>
    </main>
  );
}