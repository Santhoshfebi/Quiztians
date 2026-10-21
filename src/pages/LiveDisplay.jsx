import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  ListChecks,
  LockKeyhole,
  Maximize2,
  Medal,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";

const CHAPTER_ROTATION_MS = 15000;
const HIGHLIGHT_DURATION_MS = 4500;
const HIDDEN_WINNER_COUNT = 3;
const LIVE_VISIBLE_COUNT = 5;

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
  const secs = Math.floor(value % 60);

  if (mins > 0) {
    return `${mins}m ${String(secs).padStart(2, "0")}s`;
  }

  return `${secs}s`;
}

function formatCountdown(milliseconds) {
  const safeMs = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(
      minutes
    ).padStart(2, "0")}m`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

function sortLeaderboard(data = []) {
  return [...data].sort((a, b) => {
    const aScore = Number(a.score || 0);
    const bScore = Number(b.score || 0);

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    const rawATime =
      a.time_taken === null || a.time_taken === undefined
        ? Infinity
        : Number(a.time_taken);

    const rawBTime =
      b.time_taken === null || b.time_taken === undefined
        ? Infinity
        : Number(b.time_taken);

    const aTime = Number.isFinite(rawATime)
      ? rawATime
      : Infinity;

    const bTime = Number.isFinite(rawBTime)
      ? rawBTime
      : Infinity;

    if (aTime !== bTime) {
      return aTime - bTime;
    }

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
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}

function getChapterTitleClass(chapter = "") {
  const length = Array.from(chapter.trim()).length;

  if (length > 70) {
    return "text-[clamp(1.35rem,2vw,2.15rem)]";
  }

  if (length > 48) {
    return "text-[clamp(1.55rem,2.35vw,2.6rem)]";
  }

  if (length > 30) {
    return "text-[clamp(1.8rem,2.7vw,3rem)]";
  }

  return "text-[clamp(2rem,3vw,3.35rem)]";
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

/* ============================================================
   LIVE DISPLAY
============================================================ */

export default function LiveDisplay() {
  const [config, setConfig] = useState(null);
  const [chapterIndex, setChapterIndex] = useState(0);

  const [results, setResults] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [connected, setConnected] = useState(true);

  const [now, setNow] = useState(Date.now());
  const [lastUpdated, setLastUpdated] = useState(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ==========================================================
     HOST CONTROLS
  ========================================================== */

  const [hostControlsOpen, setHostControlsOpen] =
    useState(false);

  const [rotationPaused, setRotationPaused] =
    useState(false);

  /* ==========================================================
     ROTATION
  ========================================================== */

  const [rotationProgress, setRotationProgress] =
    useState(0);

  const [rotationSecondsLeft, setRotationSecondsLeft] =
    useState(
      Math.ceil(CHAPTER_ROTATION_MS / 1000)
    );

  const rotationStartedAtRef = useRef(Date.now());
  const rotationElapsedRef = useRef(0);

  /* ==========================================================
     WINNER MODE
  ========================================================== */

  const [winnerMode, setWinnerMode] = useState(false);

  const [winnerRevealStep, setWinnerRevealStep] =
    useState(0);

  /* ==========================================================
     LEADERBOARD ANIMATION
  ========================================================== */

  const [
    highlightedPlayerId,
    setHighlightedPlayerId,
  ] = useState(null);

  const [newLiveLeaderId, setNewLiveLeaderId] =
    useState(null);

  const previousVisiblePlayersRef = useRef([]);
  const leaderboardInitializedRef = useRef(false);
  const highlightTimerRef = useRef(null);

  /* ==========================================================
     CHAPTERS
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
      startTime +
      durationMinutes * 60 * 1000;

    if (now < startTime) {
      return {
        status: "upcoming",
        label: "STARTING SOON",
        countdown: startTime - now,
      };
    }

    if (
      now >= startTime &&
      now < endTime
    ) {
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
     FETCH CONFIG
  ========================================================== */

  const fetchQuizConfig =
    useCallback(async () => {
      try {
        const { data, error } =
          await supabase
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
     LEADERBOARD CHANGE DETECTION
  ========================================================== */

  const detectLeaderboardChanges =
    useCallback((sortedResults) => {
      const newVisiblePlayers =
        sortedResults.slice(
          HIDDEN_WINNER_COUNT,
          HIDDEN_WINNER_COUNT +
            LIVE_VISIBLE_COUNT
        );

      if (
        !leaderboardInitializedRef.current
      ) {
        previousVisiblePlayersRef.current =
          newVisiblePlayers;

        leaderboardInitializedRef.current =
          true;

        return;
      }

      const previousVisiblePlayers =
        previousVisiblePlayersRef.current;

      const previousIds = new Set(
        previousVisiblePlayers.map(
          (player) => player.id
        )
      );

      const newVisiblePlayer =
        newVisiblePlayers.find(
          (player) =>
            !previousIds.has(player.id)
        );

      const previousVisibleLeader =
        previousVisiblePlayers[0];

      const currentVisibleLeader =
        newVisiblePlayers[0];

      const visibleLeaderChanged =
        currentVisibleLeader &&
        previousVisibleLeader &&
        currentVisibleLeader.id !==
          previousVisibleLeader.id;

      if (highlightTimerRef.current) {
        window.clearTimeout(
          highlightTimerRef.current
        );
      }

      if (visibleLeaderChanged) {
        setHighlightedPlayerId(
          currentVisibleLeader.id
        );

        setNewLiveLeaderId(
          currentVisibleLeader.id
        );

        highlightTimerRef.current =
          window.setTimeout(() => {
            setHighlightedPlayerId(null);
            setNewLiveLeaderId(null);
          }, HIGHLIGHT_DURATION_MS);
      } else if (newVisiblePlayer) {
        setHighlightedPlayerId(
          newVisiblePlayer.id
        );

        setNewLiveLeaderId(null);

        highlightTimerRef.current =
          window.setTimeout(() => {
            setHighlightedPlayerId(null);
          }, HIGHLIGHT_DURATION_MS);
      }

      previousVisiblePlayersRef.current =
        newVisiblePlayers;
    }, []);

  /* ==========================================================
     FETCH CHAPTER DATA
  ========================================================== */

  const fetchChapterData = useCallback(
    async (chapter, options = {}) => {
      const { detectChanges = false } =
        options;

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
          previousVisiblePlayersRef.current =
            sorted.slice(
              HIDDEN_WINNER_COUNT,
              HIDDEN_WINNER_COUNT +
                LIVE_VISIBLE_COUNT
            );

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
     CHAPTER CHANGE
  ========================================================== */

  useEffect(() => {
    leaderboardInitializedRef.current =
      false;

    previousVisiblePlayersRef.current = [];

    setHighlightedPlayerId(null);
    setNewLiveLeaderId(null);

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
      if (
        current >= activeChapters.length
      ) {
        return 0;
      }

      return current;
    });
  }, [activeChapters.length]);

  /* ==========================================================
     RESET ROTATION
  ========================================================== */

  const resetRotationProgress =
    useCallback(() => {
      rotationStartedAtRef.current =
        Date.now();

      rotationElapsedRef.current = 0;

      setRotationProgress(0);

      setRotationSecondsLeft(
        Math.ceil(
          CHAPTER_ROTATION_MS / 1000
        )
      );
    }, []);

  /* ==========================================================
     AUTOMATIC CHAPTER ROTATION
  ========================================================== */

  useEffect(() => {
    if (activeChapters.length <= 1) {
      rotationElapsedRef.current = 0;

      setRotationProgress(0);

      setRotationSecondsLeft(
        Math.ceil(
          CHAPTER_ROTATION_MS / 1000
        )
      );

      return undefined;
    }

    if (
      rotationPaused ||
      winnerMode
    ) {
      return undefined;
    }

    rotationStartedAtRef.current =
      Date.now() -
      rotationElapsedRef.current;

    const updateRotation = () => {
      const elapsed =
        Date.now() -
        rotationStartedAtRef.current;

      rotationElapsedRef.current =
        elapsed;

      const progress = Math.min(
        (elapsed /
          CHAPTER_ROTATION_MS) *
          100,
        100
      );

      const remainingMilliseconds =
        Math.max(
          CHAPTER_ROTATION_MS -
            elapsed,
          0
        );

      const remainingSeconds =
        Math.ceil(
          remainingMilliseconds / 1000
        );

      setRotationProgress(progress);

      setRotationSecondsLeft(
        remainingSeconds
      );

      if (
        elapsed >=
        CHAPTER_ROTATION_MS
      ) {
        setChapterIndex((current) => {
          return (
            (current + 1) %
            activeChapters.length
          );
        });

        rotationStartedAtRef.current =
          Date.now();

        rotationElapsedRef.current = 0;

        setRotationProgress(0);

        setRotationSecondsLeft(
          Math.ceil(
            CHAPTER_ROTATION_MS / 1000
          )
        );
      }
    };

    updateRotation();

    const timer = window.setInterval(
      updateRotation,
      100
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [
    activeChapters.length,
    rotationPaused,
    winnerMode,
  ]);

  /* ==========================================================
     MANUAL CHAPTER CONTROLS
  ========================================================== */

  const showPreviousChapter =
    useCallback(() => {
      if (activeChapters.length <= 1) {
        return;
      }

      setChapterIndex((current) => {
        return (
          (current -
            1 +
            activeChapters.length) %
          activeChapters.length
        );
      });

      resetRotationProgress();
    }, [
      activeChapters.length,
      resetRotationProgress,
    ]);

  const showNextChapter =
    useCallback(() => {
      if (activeChapters.length <= 1) {
        return;
      }

      setChapterIndex((current) => {
        return (
          (current + 1) %
          activeChapters.length
        );
      });

      resetRotationProgress();
    }, [
      activeChapters.length,
      resetRotationProgress,
    ]);

  const toggleRotation =
    useCallback(() => {
      if (activeChapters.length <= 1) {
        return;
      }

      setRotationPaused(
        (current) => !current
      );
    }, [activeChapters.length]);

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
        Boolean(
          document.fullscreenElement
        )
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

  const toggleFullscreen =
    useCallback(async () => {
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
    }, []);

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const winners = useMemo(
    () =>
      results.slice(
        0,
        HIDDEN_WINNER_COUNT
      ),
    [results]
  );

  const liveVisiblePlayers =
    useMemo(
      () =>
        results.slice(
          HIDDEN_WINNER_COUNT,
          HIDDEN_WINNER_COUNT +
            LIVE_VISIBLE_COUNT
        ),
      [results]
    );

  const completedCount =
    results.length;

  const canRevealWinners =
    quizState.status === "ended" &&
    winners.length > 0;

  /* ==========================================================
     WINNER CONTROLS
  ========================================================== */

  const enterWinnerMode =
    useCallback(() => {
      if (!canRevealWinners) {
        return;
      }

      setHostControlsOpen(false);
      setWinnerMode(true);
      setWinnerRevealStep(0);
    }, [canRevealWinners]);

  const revealNextWinner =
    useCallback(() => {
      setWinnerRevealStep((current) =>
        Math.min(current + 1, 4)
      );
    }, []);

  const exitWinnerMode =
    useCallback(() => {
      setWinnerMode(false);
      setWinnerRevealStep(0);
    }, []);

  /* ==========================================================
     KEYBOARD HOST CONTROLS

     F       -> Fullscreen
     LEFT    -> Previous chapter
     RIGHT   -> Next chapter
     P       -> Pause / resume rotation
     W       -> Winner Mode
     SPACE   -> Next winner reveal
     ENTER   -> Next winner reveal
  ========================================================== */

  useEffect(() => {
    const handleKeyboardControls = (
      event
    ) => {
      if (
        isEditableTarget(event.target)
      ) {
        return;
      }

      /*
       * Winner Mode intentionally locks the normal
       * event shortcuts.
       *
       * This prevents an accidental chapter change
       * while the host is revealing the podium.
       */

      if (winnerMode) {
        if (
          event.code === "Space" ||
          event.key === "Enter"
        ) {
          event.preventDefault();

          if (winnerRevealStep < 4) {
            revealNextWinner();
          }
        }

        return;
      }

      /* FULLSCREEN */

      if (
        event.key === "f" ||
        event.key === "F"
      ) {
        event.preventDefault();
        toggleFullscreen();
        return;
      }

      /* PREVIOUS CHAPTER */

      if (event.key === "ArrowLeft") {
        event.preventDefault();

        if (
          activeChapters.length > 1
        ) {
          showPreviousChapter();
        }

        return;
      }

      /* NEXT CHAPTER */

      if (event.key === "ArrowRight") {
        event.preventDefault();

        if (
          activeChapters.length > 1
        ) {
          showNextChapter();
        }

        return;
      }

      /* PAUSE / RESUME */

      if (
        event.key === "p" ||
        event.key === "P"
      ) {
        event.preventDefault();

        if (
          activeChapters.length > 1
        ) {
          toggleRotation();
        }

        return;
      }

      /* WINNER MODE */

      if (
        event.key === "w" ||
        event.key === "W"
      ) {
        event.preventDefault();

        if (canRevealWinners) {
          enterWinnerMode();
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboardControls
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboardControls
      );
    };
  }, [
    winnerMode,
    winnerRevealStep,
    activeChapters.length,
    canRevealWinners,
    revealNextWinner,
    toggleFullscreen,
    showPreviousChapter,
    showNextChapter,
    toggleRotation,
    enterWinnerMode,
  ]);

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
            changedChapter ===
              currentChapter
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
        if (
          status === "SUBSCRIBED"
        ) {
          setConnected(true);
        }

        if (
          status ===
            "CHANNEL_ERROR" ||
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
     REALTIME CONFIG
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
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      if (
        highlightTimerRef.current
      ) {
        window.clearTimeout(
          highlightTimerRef.current
        );
      }
    };
  }, []);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return <LiveDisplayLoading />;
  }

  /* ==========================================================
     MAIN UI
  ========================================================== */

  return (
    <main className="relative h-screen overflow-hidden bg-[#070709] text-white">
      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-360px] h-[780px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[190px]" />

        <div className="absolute -left-[240px] bottom-[-260px] h-[560px] w-[560px] rounded-full bg-indigo-600/[0.05] blur-[170px]" />

        <div className="absolute -right-[240px] top-[20%] h-[520px] w-[520px] rounded-full bg-violet-600/[0.04] blur-[170px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)
            `,
            backgroundSize:
              "58px 58px",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
      </div>

      {/* ======================================================
          SCREEN
      ====================================================== */}

      <div className="relative z-10 flex h-screen flex-col overflow-hidden px-5 py-3 sm:px-7 lg:px-10 lg:py-4 2xl:px-14">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="flex shrink-0 items-center justify-between gap-6 border-b border-white/[0.06] pb-3">
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
                className="h-9 w-auto object-contain object-left lg:h-10"
              />

              <p className="mt-[-3px] text-[7px] font-black uppercase tracking-[0.25em] text-zinc-700 lg:text-[8px]">
                Learn • Play • Compete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {rotationPaused &&
              activeChapters.length >
                1 && (
                <div className="hidden items-center gap-2 rounded-full border border-amber-500/15 bg-amber-500/[0.055] px-3 py-2 lg:flex">
                  <Pause
                    size={10}
                    className="text-amber-400"
                  />

                  <span className="text-[7px] font-black uppercase tracking-[0.14em] text-amber-400">
                    Rotation Paused
                  </span>
                </div>
              )}

            {activeChapters.length >
              1 && (
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-2 md:flex">
                <span className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-600">
                  Chapter
                </span>

                <span className="text-[9px] font-black text-zinc-300">
                  {chapterIndex + 1}/
                  {
                    activeChapters.length
                  }
                </span>
              </div>
            )}

            <ConnectionBadge
              connected={connected}
            />

            <StatusBadge
              state={quizState}
            />

            <button
              type="button"
              onClick={() =>
                setHostControlsOpen(true)
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-zinc-500 transition hover:border-violet-500/25 hover:bg-violet-500/[0.07] hover:text-violet-300"
              aria-label="Open event controls"
              title="Event Controls"
            >
              <Settings2
                size={16}
                strokeWidth={1.8}
              />
            </button>
          </div>
        </header>

        {/* ====================================================
            CHALLENGE BANNER
        ==================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative mt-3 shrink-0 overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#101013] px-5 py-4 lg:px-7 lg:py-4"
        >
          <div className="pointer-events-none absolute -left-20 top-[-100px] h-60 w-60 rounded-full bg-violet-600/[0.08] blur-[100px]" />

          <div className="relative flex items-center justify-between gap-6">
            {/* CHAPTER */}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-violet-500" />

                <p className="text-[8px] font-black uppercase tracking-[0.22em] text-violet-400">
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
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                >
                  <h1
                    className={`mt-2 max-w-[1000px] break-words font-black leading-[1.08] tracking-[-0.045em] text-white ${getChapterTitleClass(
                      currentChapter || ""
                    )}`}
                  >
                    {currentChapter ||
                      "No active chapter"}
                  </h1>

                  <p className="mt-2 text-[9px] font-medium text-zinc-600 lg:text-[10px]">
                    {currentChapter
                      ? quizState.status ===
                        "ended"
                        ? "Challenge completed • Winners ready for the final reveal"
                        : "Live standings update automatically • Top 3 remain hidden"
                      : "Waiting for an active chapter to be configured"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* STATS */}

            <div className="hidden shrink-0 items-stretch gap-2 md:flex">
              <BannerStat
                icon={Users}
                label="Completed"
                value={completedCount}
              />

              <BannerStat
                icon={ListChecks}
                label="Questions"
                value={
                  totalQuestions || "—"
                }
              />

              <BannerStat
                icon={Crown}
                label="Top 3"
                value="Hidden"
                accent="amber"
              />

              <TimerCard
                quizState={quizState}
              />
            </div>
          </div>
        </motion.section>

        {/* ====================================================
            LEADERBOARD
        ==================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.08,
          }}
          className="relative mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/[0.075] bg-[#101013]"
        >
          <div className="pointer-events-none absolute left-1/2 top-[-200px] h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-violet-500/[0.04] blur-[140px]" />

          {/* BOARD HEADER */}

          <div className="relative flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-3 lg:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.06]">
                <Trophy
                  size={16}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-violet-400/70">
                  Live Standings
                </p>

                <h2 className="mt-0.5 text-base font-black tracking-[-0.025em] text-white lg:text-lg">
                  Chasing the Podium
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/[0.055] px-3 py-1.5 sm:flex">
                <LockKeyhole
                  size={10}
                  className="text-amber-400"
                />

                <span className="text-[7px] font-black uppercase tracking-[0.13em] text-amber-400">
                  Top 3 Hidden
                </span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.055] px-3 py-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[7px] font-black uppercase tracking-[0.15em] text-emerald-400">
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN HEADER */}

          <div className="relative hidden shrink-0 grid-cols-[70px_76px_minmax(180px,1.35fr)_minmax(120px,1fr)_150px_130px] items-center gap-3 border-b border-white/[0.045] px-6 py-2.5 text-[7px] font-black uppercase tracking-[0.16em] text-zinc-800 md:grid lg:px-7">
            <span>Rank</span>

            <span />

            <span>Participant</span>

            <span>Place</span>

            <span className="text-right">
              Score
            </span>

            <span className="text-right">
              Time
            </span>
          </div>

          {/* ROW AREA */}

          <div className="relative min-h-0 flex-1 overflow-hidden px-3 py-3 lg:px-4">
            {!currentChapter ? (
              <EmptyLeaderboard
                title="Waiting for a chapter"
                description="Activate a chapter from quiz configuration to begin the live display."
              />
            ) : resultsLoading &&
              results.length === 0 ? (
              <LeaderboardSkeleton />
            ) : results.length === 0 ? (
              <EmptyLeaderboard
                title="Waiting for players"
                description="Live standings will appear as participants complete the challenge."
              />
            ) : liveVisiblePlayers.length ===
              0 ? (
              <SecretLeaderboardState
                completedCount={
                  completedCount
                }
              />
            ) : (
              <div className="flex h-full min-h-0 flex-col justify-center gap-2">
                <AnimatePresence
                  initial={false}
                  mode="popLayout"
                >
                  {liveVisiblePlayers.map(
                    (player, index) => {
                      const realRank =
                        index +
                        HIDDEN_WINNER_COUNT +
                        1;

                      return (
                        <LeaderboardRow
                          key={player.id}
                          player={player}
                          rank={realRank}
                          totalQuestions={
                            totalQuestions
                          }
                          highlighted={
                            highlightedPlayerId ===
                            player.id
                          }
                          newLiveLeader={
                            newLiveLeaderId ===
                            player.id
                          }
                        />
                      );
                    }
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.section>

        {/* ====================================================
            ROTATION PROGRESS
        ==================================================== */}

        <AnimatePresence>
          {activeChapters.length > 1 &&
            !winnerMode && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="shrink-0 pt-2"
              >
                <div className="flex items-center justify-between pb-1.5">
                  <div className="flex items-center gap-2">
                    {rotationPaused ? (
                      <Pause
                        size={9}
                        className="text-amber-400"
                      />
                    ) : (
                      <Play
                        size={9}
                        className="text-violet-400"
                      />
                    )}

                    <p
                      className={`text-[7px] font-black uppercase tracking-[0.15em] ${
                        rotationPaused
                          ? "text-amber-400"
                          : "text-zinc-700"
                      }`}
                    >
                      {rotationPaused
                        ? "Chapter rotation paused"
                        : `Next chapter in ${rotationSecondsLeft}s`}
                    </p>
                  </div>

                  <p className="text-[7px] font-black uppercase tracking-[0.14em] text-zinc-800">
                    {chapterIndex + 1} /{" "}
                    {
                      activeChapters.length
                    }
                  </p>
                </div>

                <div className="relative h-[3px] overflow-hidden rounded-full bg-white/[0.045]">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      rotationPaused
                        ? "bg-amber-400/70"
                        : "bg-gradient-to-r from-violet-600 via-violet-400 to-indigo-400"
                    }`}
                    animate={{
                      width: `${rotationProgress}%`,
                    }}
                    transition={{
                      duration: 0.1,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="flex shrink-0 items-center justify-between gap-5 border-t border-white/[0.05] pt-2">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            />

            <p className="text-[7px] font-black uppercase tracking-[0.16em] text-zinc-700">
              {connected
                ? "Results update live"
                : "Connection interrupted"}
            </p>
          </div>

          {lastUpdated && (
            <p className="hidden text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-800 sm:block">
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

          <p className="text-[7px] font-black uppercase tracking-[0.16em] text-zinc-800">
            QUIZTIANS · Live Event
          </p>
        </footer>
      </div>

      {/* ======================================================
          HOST CONTROLS
      ====================================================== */}

      <AnimatePresence>
        {hostControlsOpen &&
          !winnerMode && (
            <HostControls
              currentChapter={
                currentChapter
              }
              chapterIndex={
                chapterIndex
              }
              chapterCount={
                activeChapters.length
              }
              rotationPaused={
                rotationPaused
              }
              isFullscreen={
                isFullscreen
              }
              canRevealWinners={
                canRevealWinners
              }
              onClose={() =>
                setHostControlsOpen(false)
              }
              onPrevious={
                showPreviousChapter
              }
              onNext={
                showNextChapter
              }
              onToggleRotation={
                toggleRotation
              }
              onToggleFullscreen={
                toggleFullscreen
              }
              onRevealWinners={
                enterWinnerMode
              }
            />
          )}
      </AnimatePresence>

      {/* ======================================================
          WINNER MODE
      ====================================================== */}

      <AnimatePresence>
        {winnerMode && (
          <WinnerMode
            chapter={currentChapter}
            winners={winners}
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
    </main>
  );
}

/* ============================================================
   BANNER STAT
============================================================ */

function BannerStat({
  icon: Icon,
  label,
  value,
  accent = "violet",
}) {
  const amber =
    accent === "amber";

  return (
    <div className="flex min-w-[105px] items-center gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
          amber
            ? "border-amber-400/15 bg-amber-400/[0.055]"
            : "border-violet-500/15 bg-violet-500/[0.055]"
        }`}
      >
        <Icon
          size={14}
          className={
            amber
              ? "text-amber-400"
              : "text-violet-400"
          }
        />
      </div>

      <div>
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-zinc-700">
          {label}
        </p>

        <p
          className={`mt-0.5 text-sm font-black ${
            amber
              ? "text-amber-200"
              : "text-zinc-200"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   TIMER CARD
============================================================ */

function TimerCard({ quizState }) {
  let label = "Status";
  let value = quizState.label;

  if (quizState.status === "upcoming") {
    label = "Starts In";

    value = formatCountdown(
      quizState.countdown
    );
  }

  if (quizState.status === "live") {
    label = "Time Left";

    value = formatCountdown(
      quizState.countdown
    );
  }

  return (
    <div className="flex min-w-[120px] items-center gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]">
        <Clock3
          size={14}
          className="text-zinc-500"
        />
      </div>

      <div>
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-zinc-700">
          {label}
        </p>

        <p className="mt-0.5 whitespace-nowrap font-mono text-xs font-black text-zinc-300">
          {value}
        </p>
      </div>
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
  newLiveLeader,
}) {
  const highlightClass =
    newLiveLeader
      ? "border-violet-400/40 bg-violet-500/[0.09] shadow-[0_0_40px_rgba(139,92,246,0.10)]"
      : highlighted
        ? "border-indigo-400/30 bg-indigo-500/[0.07]"
        : "border-white/[0.055] bg-white/[0.018]";

  return (
    <motion.div
      layout
      layoutId={`live-player-${player.id}`}
      initial={{
        opacity: 0,
        y: 14,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale:
          highlighted ||
          newLiveLeader
            ? [1, 1.01, 1]
            : 1,
      }}
      exit={{
        opacity: 0,
        x: 35,
        scale: 0.98,
      }}
      transition={{
        layout: {
          type: "spring",
          stiffness: 220,
          damping: 24,
        },

        opacity: {
          duration: 0.22,
        },
      }}
      className={`relative grid h-[66px] shrink-0 grid-cols-[52px_minmax(0,1fr)_100px] items-center gap-3 overflow-hidden rounded-[17px] border px-3 sm:h-[70px] md:grid-cols-[70px_76px_minmax(180px,1.35fr)_minmax(120px,1fr)_150px_130px] md:px-5 lg:h-[74px] lg:gap-3 lg:px-6 2xl:h-[78px] ${highlightClass}`}
    >
      {/* SHIMMER */}

      <AnimatePresence>
        {(highlighted ||
          newLiveLeader) && (
          <motion.div
            initial={{
              opacity: 0,
              x: "-100%",
            }}
            animate={{
              opacity: [
                0,
                0.7,
                0,
              ],
              x: "160%",
            }}
            transition={{
              duration: 1.3,
            }}
            className="pointer-events-none absolute inset-y-0 w-1/4 skew-x-[-18deg] bg-gradient-to-r from-transparent via-violet-300/10 to-transparent"
          />
        )}
      </AnimatePresence>

      {/* RANK */}

      <div className="relative">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border text-[10px] font-black lg:h-10 lg:w-10 ${
            rank === 4
              ? "border-violet-500/20 bg-violet-500/[0.07] text-violet-300"
              : "border-white/[0.06] bg-white/[0.025] text-zinc-500"
          }`}
        >
          #{rank}
        </div>
      </div>

      {/* AVATAR */}

      <div className="relative hidden md:block">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/[0.07] bg-white/[0.035] text-[10px] font-black text-zinc-400">
          {initials(player.name)}
        </div>
      </div>

      {/* PARTICIPANT */}

      <div className="relative min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-black tracking-[-0.02em] text-zinc-100 lg:text-base 2xl:text-lg">
            {player.name ||
              "Unknown"}
          </p>

          <AnimatePresence>
            {newLiveLeader && (
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
                className="hidden shrink-0 rounded-full border border-violet-400/20 bg-violet-500/[0.09] px-2 py-1 text-[6px] font-black uppercase tracking-[0.1em] text-violet-300 lg:inline-flex"
              >
                Now #4
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-1 truncate text-[8px] font-medium text-zinc-700 md:hidden">
          {player.place || "—"}
        </p>
      </div>

      {/* PLACE */}

      <div className="relative hidden min-w-0 md:block">
        <p className="truncate text-xs font-bold text-zinc-500 lg:text-sm">
          {player.place || "—"}
        </p>
      </div>

      {/* SCORE */}

      <div className="relative flex items-baseline justify-end whitespace-nowrap text-right">
        <span className="text-lg font-black tracking-[-0.04em] text-zinc-100 lg:text-xl 2xl:text-2xl">
          {player.score ?? 0}
        </span>

        {totalQuestions > 0 && (
          <span className="ml-1.5 text-[9px] font-bold text-zinc-600 lg:text-[10px]">
            / {totalQuestions}
          </span>
        )}
      </div>

      {/* TIME */}

      <div className="relative hidden text-right md:block">
        <p className="whitespace-nowrap font-mono text-xs font-black text-zinc-400 lg:text-sm">
          {formatTime(
            player.time_taken
          )}
        </p>

        <p className="mt-1 text-[6px] font-black uppercase tracking-[0.12em] text-zinc-800">
          Time
        </p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   SECRET LEADERBOARD STATE
============================================================ */

function SecretLeaderboardState({
  completedCount,
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-amber-400/10 bg-amber-400/[0.035]">
          <LockKeyhole
            size={22}
            className="text-amber-400/70"
          />
        </div>

        <h3 className="mt-4 text-base font-black text-zinc-300">
          The podium is taking shape
        </h3>

        <p className="mx-auto mt-2 max-w-xs text-[9px] leading-5 text-zinc-700">
          {completedCount === 1
            ? "The first result is in, but the podium remains secret."
            : `${completedCount} results are in. The Top 3 remain hidden until the final reveal.`}
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="text-xl opacity-25">
            🥇
          </span>

          <span className="text-xl opacity-25">
            🥈
          </span>

          <span className="text-xl opacity-25">
            🥉
          </span>
        </div>
      </div>
    </div>
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
    config[state.status] ||
    config.waiting;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${current.classes}`}
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

      <span className="text-[8px] font-black uppercase tracking-[0.16em] lg:text-[9px]">
        {state.label}
      </span>
    </div>
  );
}

/* ============================================================
   CONNECTION BADGE
============================================================ */

function ConnectionBadge({
  connected,
}) {
  return (
    <div
      className={`hidden items-center gap-2 rounded-full border px-3 py-2 sm:flex ${
        connected
          ? "border-white/[0.06] bg-white/[0.025] text-zinc-600"
          : "border-red-500/15 bg-red-500/[0.05] text-red-400"
      }`}
    >
      {connected ? (
        <Wifi size={12} />
      ) : (
        <WifiOff size={12} />
      )}

      <span className="text-[7px] font-black uppercase tracking-[0.14em]">
        {connected
          ? "Connected"
          : "Offline"}
      </span>
    </div>
  );
}

/* ============================================================
   HOST CONTROLS
============================================================ */

function HostControls({
  currentChapter,
  chapterIndex,
  chapterCount,
  rotationPaused,
  isFullscreen,
  canRevealWinners,
  onClose,
  onPrevious,
  onNext,
  onToggleRotation,
  onToggleFullscreen,
  onRevealWinners,
}) {
  const multipleChapters =
    chapterCount > 1;

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
      className="fixed inset-0 z-[90] flex items-start justify-end bg-black/25 p-4 backdrop-blur-[2px] lg:p-6"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          x: 30,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          x: 30,
          scale: 0.97,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 28,
        }}
        className="relative max-h-[calc(100vh-48px)] w-full max-w-[380px] overflow-y-auto rounded-[28px] border border-white/[0.09] bg-[#101013]/95 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* GLOW */}

        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-600/[0.10] blur-[90px]" />

        {/* HEADER */}

        <div className="relative flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.07]">
              <Settings2
                size={17}
                className="text-violet-400"
              />
            </div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-violet-400">
                QUIZTIANS Live
              </p>

              <h2 className="mt-0.5 text-sm font-black text-white">
                Event Controls
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-zinc-600 transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Close event controls"
          >
            <X size={15} />
          </button>
        </div>

        {/* CURRENT CHAPTER */}

        <div className="relative px-5 pt-5">
          <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-700">
              Current Chapter
            </p>

            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="min-w-0 truncate text-lg font-black tracking-[-0.03em] text-white">
                {currentChapter ||
                  "No active chapter"}
              </p>

              {chapterCount > 0 && (
                <span className="shrink-0 rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[8px] font-black text-zinc-500">
                  {chapterIndex + 1}/
                  {chapterCount}
                </span>
              )}
            </div>

            {multipleChapters && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onPrevious}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 transition hover:border-violet-500/20 hover:bg-violet-500/[0.06] hover:text-violet-300"
                >
                  <ChevronLeft
                    size={15}
                  />

                  Previous
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 transition hover:border-violet-500/20 hover:bg-violet-500/[0.06] hover:text-violet-300"
                >
                  Next

                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* EVENT ACTIONS */}

        <div className="relative space-y-2 px-5 py-5">
          {/* ROTATION */}

          <button
            type="button"
            onClick={onToggleRotation}
            disabled={!multipleChapters}
            className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3.5 text-left transition ${
              !multipleChapters
                ? "cursor-not-allowed border-white/[0.035] bg-white/[0.012] opacity-40"
                : rotationPaused
                  ? "border-emerald-500/15 bg-emerald-500/[0.05]"
                  : "border-white/[0.06] bg-white/[0.025] hover:border-violet-500/15 hover:bg-white/[0.035]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-500">
                {rotationPaused ? (
                  <Play size={15} />
                ) : (
                  <Pause size={15} />
                )}
              </div>

              <div>
                <p className="text-[10px] font-black text-zinc-200">
                  {rotationPaused
                    ? "Resume Rotation"
                    : "Pause Rotation"}
                </p>

                <p className="mt-0.5 text-[8px] text-zinc-700">
                  {multipleChapters
                    ? rotationPaused
                      ? "Automatic switching is paused"
                      : "Chapters rotate every 15 seconds"
                    : "Only one active chapter"}
                </p>
              </div>
            </div>

            {multipleChapters && (
              <ShortcutKey>
                P
              </ShortcutKey>
            )}
          </button>

          {/* FULLSCREEN */}

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 text-left transition hover:border-violet-500/15 hover:bg-white/[0.035]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-zinc-500">
                {isFullscreen ? (
                  <Minimize2
                    size={15}
                  />
                ) : (
                  <Maximize2
                    size={15}
                  />
                )}
              </div>

              <div>
                <p className="text-[10px] font-black text-zinc-200">
                  {isFullscreen
                    ? "Exit Fullscreen"
                    : "Enter Fullscreen"}
                </p>

                <p className="mt-0.5 text-[8px] text-zinc-700">
                  Projector / TV display
                </p>
              </div>
            </div>

            <ShortcutKey>
              F
            </ShortcutKey>
          </button>

          {/* WINNERS */}

          <button
            type="button"
            disabled={
              !canRevealWinners
            }
            onClick={
              onRevealWinners
            }
            className={`flex w-full items-center justify-between rounded-[18px] border px-4 py-3.5 text-left transition ${
              canRevealWinners
                ? "border-amber-400/15 bg-amber-400/[0.055] hover:border-amber-400/25 hover:bg-amber-400/[0.075]"
                : "cursor-not-allowed border-white/[0.035] bg-white/[0.012] opacity-40"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/[0.06] text-amber-300">
                <Crown
                  size={16}
                />
              </div>

              <div>
                <p className="text-[10px] font-black text-amber-200">
                  Reveal Winners
                </p>

                <p className="mt-0.5 text-[8px] text-zinc-700">
                  {canRevealWinners
                    ? "Start the secret Top 3 reveal"
                    : "Available when quiz is completed"}
                </p>
              </div>
            </div>

            {canRevealWinners && (
              <ShortcutKey>
                W
              </ShortcutKey>
            )}
          </button>
        </div>

        {/* KEYBOARD SHORTCUTS */}

        <div className="relative border-t border-white/[0.06] px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-violet-400">
                Keyboard
              </p>

              <p className="mt-1 text-[10px] font-black text-zinc-300">
                Event Shortcuts
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-[7px] font-black uppercase tracking-[0.12em] text-zinc-700">
                Active
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-white/[0.055] bg-black/10">
            <KeyboardShortcut
              shortcut="F"
              label="Fullscreen"
            />

            <KeyboardShortcut
              shortcut="←"
              label="Previous chapter"
              disabled={
                !multipleChapters
              }
            />

            <KeyboardShortcut
              shortcut="→"
              label="Next chapter"
              disabled={
                !multipleChapters
              }
            />

            <KeyboardShortcut
              shortcut="P"
              label={
                rotationPaused
                  ? "Resume rotation"
                  : "Pause rotation"
              }
              disabled={
                !multipleChapters
              }
            />

            <KeyboardShortcut
              shortcut="W"
              label="Reveal winners"
              disabled={
                !canRevealWinners
              }
            />

            <KeyboardShortcut
              shortcut="Space"
              label="Next winner reveal"
              hint="Winner Mode"
              last
            />
          </div>

          <p className="mt-3 text-[7px] leading-4 text-zinc-800">
            Winner Mode locks chapter
            navigation. Space or Enter
            reveals the podium in order:
            3rd → 2nd → Champion.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   SHORTCUT KEY
============================================================ */

function ShortcutKey({
  children,
}) {
  return (
    <kbd className="inline-flex min-w-[28px] items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 px-2 py-1.5 font-mono text-[8px] font-black text-zinc-600 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
      {children}
    </kbd>
  );
}

/* ============================================================
   KEYBOARD SHORTCUT ROW
============================================================ */

function KeyboardShortcut({
  shortcut,
  label,
  hint,
  disabled = false,
  last = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${
        !last
          ? "border-b border-white/[0.045]"
          : ""
      } ${
        disabled
          ? "opacity-30"
          : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ShortcutKey>
          {shortcut}
        </ShortcutKey>

        <span className="truncate text-[9px] font-bold text-zinc-500">
          {label}
        </span>
      </div>

      {hint && (
        <span className="shrink-0 text-[6px] font-black uppercase tracking-[0.12em] text-zinc-800">
          {hint}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   WINNER MODE
   Premium stage reveal:
   🥉 Bronze -> 🥈 Silver -> 🥇 Champion -> Final Podium
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

  const revealComplete = revealStep >= 4;

  const buttonText =
    revealStep === 0
      ? "Reveal 3rd Place"
      : revealStep === 1
        ? "Reveal 2nd Place"
        : revealStep === 2
          ? "Reveal Champion"
          : revealStep === 3
            ? "Show Final Podium"
            : "Podium Complete";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] overflow-hidden bg-[#070709]"
    >
      {/* ======================================================
          SUBTLE BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Very soft top ambience */}

        <div className="absolute left-1/2 top-[-280px] h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-amber-500/[0.018] blur-[180px]" />

        {/* Very soft lower ambience */}

        <div className="absolute -bottom-[300px] -left-[180px] h-[500px] w-[500px] rounded-full bg-violet-600/[0.025] blur-[180px]" />

        <div className="absolute -bottom-[300px] -right-[180px] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.02] blur-[180px]" />

        {/* Grid */}

        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.28) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.28) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Top line */}

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/10 to-transparent" />
      </div>

      {/* ======================================================
          REVEAL ATMOSPHERE
      ====================================================== */}

      <AnimatePresence mode="wait">
        {revealStep > 0 && (
          <RevealAtmosphere
            key={`winner-atmosphere-${revealStep}`}
            revealStep={revealStep}
          />
        )}
      </AnimatePresence>

      {/* ======================================================
          FINAL CELEBRATION
      ====================================================== */}

      <AnimatePresence>
        {revealComplete && (
          <CelebrationSparkles />
        )}
      </AnimatePresence>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex h-screen flex-col px-5 py-4 sm:px-7 lg:px-10 lg:py-5 2xl:px-14">
        {/* HEADER */}

        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.055] pb-3">
          <div className="flex items-center gap-3">
            <img
              src="/branding/quiztians-q.png"
              alt=""
              className="h-10 w-10 object-contain lg:h-11 lg:w-11"
            />

            <div>
              <img
                src="/branding/quiztians-wordmark.png"
                alt="QUIZTIANS"
                className="h-8 w-auto object-contain object-left lg:h-9"
              />

              <p className="mt-[-2px] text-[7px] font-black uppercase tracking-[0.22em] text-zinc-700">
                Learn • Play • Compete
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-zinc-500 transition hover:border-white/[0.1] hover:bg-white/[0.045] hover:text-zinc-300"
          >
            <RotateCcw size={14} />

            <span className="text-[8px] font-black uppercase tracking-[0.12em]">
              Return to Live
            </span>
          </button>
        </header>

        {/* ====================================================
            TITLE
        ==================================================== */}

        <div className="shrink-0 pt-3 text-center lg:pt-4">
          <motion.div
            animate={
              revealComplete
                ? {
                    scale: [1, 1.025, 1],
                  }
                : {}
            }
            transition={{
              duration: 2.8,
              repeat: revealComplete
                ? Infinity
                : 0,
              ease: "easeInOut",
            }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/[0.04] px-3 py-1.5"
          >
            <Trophy
              size={11}
              className="text-amber-400"
            />

            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-amber-400">
              Final Results
            </span>
          </motion.div>

          <h1 className="mx-auto mt-2 max-w-5xl text-[clamp(1.25rem,2vw,2.35rem)] font-black leading-tight tracking-[-0.045em] text-white">
            {chapter}
          </h1>

          <p className="mt-1 text-[7px] font-black uppercase tracking-[0.18em] text-zinc-700">
            QUIZTIANS Champions
          </p>
        </div>

        {/* ====================================================
            PODIUM
        ==================================================== */}

        <div className="flex min-h-0 flex-1 items-end justify-center py-3 lg:py-4">
          <div className="grid w-full max-w-[1180px] grid-cols-[0.92fr_1.18fr_0.92fr] items-end gap-3 lg:gap-5">
            {/* =================================================
                SECOND PLACE
            ================================================= */}

            <AnimatePresence mode="wait">
              {revealStep >= 2 ? (
                <PodiumWinner
                  key="second-place"
                  player={second}
                  rank={2}
                  totalQuestions={totalQuestions}
                  finalMode={revealComplete}
                />
              ) : (
                <HiddenPodium
                  key="second-hidden"
                  rank={2}
                  label="2nd Place"
                  active={revealStep === 1}
                />
              )}
            </AnimatePresence>

            {/* =================================================
                CHAMPION
            ================================================= */}

            <AnimatePresence mode="wait">
              {revealStep >= 3 ? (
                <PodiumWinner
                  key="champion"
                  player={first}
                  rank={1}
                  totalQuestions={totalQuestions}
                  finalMode={revealComplete}
                />
              ) : (
                <HiddenPodium
                  key="champion-hidden"
                  rank={1}
                  label="Champion"
                  active={revealStep === 2}
                />
              )}
            </AnimatePresence>

            {/* =================================================
                THIRD PLACE
            ================================================= */}

            <AnimatePresence mode="wait">
              {revealStep >= 1 ? (
                <PodiumWinner
                  key="third-place"
                  player={third}
                  rank={3}
                  totalQuestions={totalQuestions}
                  finalMode={revealComplete}
                />
              ) : (
                <HiddenPodium
                  key="third-hidden"
                  rank={3}
                  label="3rd Place"
                  active={revealStep === 0}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ====================================================
            REVEAL CONTROL
        ==================================================== */}

        <div className="shrink-0 border-t border-white/[0.055] pt-3 text-center">
          {!revealComplete ? (
            <>
              <motion.button
                type="button"
                onClick={onRevealNext}
                whileHover={{
                  scale: 1.025,
                }}
                whileTap={{
                  scale: 0.975,
                }}
                animate={
                  revealStep === 2
                    ? {
                        borderColor: [
                          "rgba(251,191,36,0.18)",
                          "rgba(251,191,36,0.35)",
                          "rgba(251,191,36,0.18)",
                        ],
                      }
                    : {}
                }
                transition={
                  revealStep === 2
                    ? {
                        duration: 1.8,
                        repeat: Infinity,
                      }
                    : {}
                }
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-7 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-amber-300 transition-colors hover:bg-amber-400/[0.09]"
              >
                {revealStep === 2 ? (
                  <Crown size={15} />
                ) : (
                  <Medal size={15} />
                )}

                {buttonText}
              </motion.button>

              <p className="mt-1.5 text-[6px] font-black uppercase tracking-[0.13em] text-zinc-800">
                Press Space or Enter
              </p>
            </>
          ) : (
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
                scale: 0.92,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 170,
                damping: 15,
              }}
              className="flex items-center justify-center gap-3 text-amber-400"
            >
              <motion.div
                animate={{
                  rotate: [0, 12, -12, 0],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                }}
              >
                <Sparkles size={15} />
              </motion.div>

              <motion.span
                animate={{
                  opacity: [0.72, 1, 0.72],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                }}
                className="text-[9px] font-black uppercase tracking-[0.24em]"
              >
                Congratulations Champions
              </motion.span>

              <motion.div
                animate={{
                  rotate: [0, -12, 12, 0],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                }}
              >
                <Sparkles size={15} />
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   REVEAL ATMOSPHERE

   Intentionally subtle.
   The animation focus stays on the winner cards.
============================================================ */

function RevealAtmosphere({
  revealStep,
}) {
  const isBronze = revealStep === 1;
  const isSilver = revealStep === 2;
  const isChampion = revealStep >= 3;

  const glowClass = isBronze
    ? "bg-orange-400"
    : isSilver
      ? "bg-zinc-200"
      : "bg-amber-400";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
    >
      {/* SMALL LOCALIZED STAGE GLOW */}

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.65,
        }}
        animate={{
          opacity: isChampion
            ? 0.042
            : 0.025,
          scale: 1,
        }}
        transition={{
          duration: isChampion
            ? 1.15
            : 0.8,
          ease: "easeOut",
        }}
        className={`absolute left-1/2 top-[57%] h-[380px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[135px] ${glowClass}`}
      />

      {/* SHORT REVEAL FLASH */}

      <motion.div
        initial={{
          opacity: isChampion
            ? 0.025
            : 0.012,
        }}
        animate={{
          opacity: 0,
        }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
        className={`absolute inset-0 ${glowClass}`}
      />

      {/* CHAMPION SPOTLIGHT LINES */}

      {isChampion && (
        <>
          <motion.div
            initial={{
              opacity: 0,
              rotate: -8,
              scaleY: 0.4,
            }}
            animate={{
              opacity: [0, 0.025, 0.012],
              rotate: 3,
              scaleY: 1,
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
            }}
            className="absolute left-[43%] top-[-12%] h-[95%] w-[7%] origin-top bg-gradient-to-b from-amber-200/40 via-amber-200/[0.05] to-transparent blur-xl"
          />

          <motion.div
            initial={{
              opacity: 0,
              rotate: 8,
              scaleY: 0.4,
            }}
            animate={{
              opacity: [0, 0.025, 0.012],
              rotate: -3,
              scaleY: 1,
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
            }}
            className="absolute right-[43%] top-[-12%] h-[95%] w-[7%] origin-top bg-gradient-to-b from-amber-200/40 via-amber-200/[0.05] to-transparent blur-xl"
          />
        </>
      )}
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
      <motion.div
        initial={{
          opacity: 0,
          y: 40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="flex h-[250px] items-center justify-center rounded-[28px] border border-white/[0.05] bg-white/[0.02]"
      >
        <span className="text-zinc-700">
          No Result
        </span>
      </motion.div>
    );
  }

  const champion = rank === 1;

  const styles = {
    1: {
      medal: "🥇",
      title: "Champion",
      height:
        "min-h-[390px] lg:min-h-[430px] 2xl:min-h-[455px]",
      box:
        "border-amber-400/35 bg-gradient-to-b from-amber-400/[0.075] via-amber-400/[0.035] to-white/[0.018] shadow-[0_20px_70px_rgba(0,0,0,0.32)]",
      text: "text-amber-300",
      glow: "bg-amber-400",
      ring: "border-amber-300/25",
    },

    2: {
      medal: "🥈",
      title: "2nd Place",
      height:
        "min-h-[285px] lg:min-h-[315px] 2xl:min-h-[330px]",
      box:
        "border-zinc-300/15 bg-zinc-300/[0.028] shadow-[0_16px_50px_rgba(0,0,0,0.24)]",
      text: "text-zinc-300",
      glow: "bg-zinc-200",
      ring: "border-zinc-200/15",
    },

    3: {
      medal: "🥉",
      title: "3rd Place",
      height:
        "min-h-[255px] lg:min-h-[280px] 2xl:min-h-[295px]",
      box:
        "border-orange-400/15 bg-orange-400/[0.028] shadow-[0_16px_50px_rgba(0,0,0,0.24)]",
      text: "text-orange-300",
      glow: "bg-orange-400",
      ring: "border-orange-300/15",
    },
  };

  const style = styles[rank];

  const entranceDelay = champion
    ? 0.12
    : 0.05;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: champion ? 145 : 85,
        scale: champion ? 0.7 : 0.84,
        filter: champion
          ? "blur(10px)"
          : "blur(6px)",
      }}
      animate={{
        opacity: 1,
        y: champion ? -10 : 0,
        scale:
          champion && finalMode
            ? [1, 1.012, 1]
            : 1,
        filter: "blur(0px)",
      }}
      exit={{
        opacity: 0,
        y: 30,
        scale: 0.95,
      }}
      transition={{
        opacity: {
          duration: 0.35,
          delay: entranceDelay,
        },

        filter: {
          duration: 0.4,
          delay: entranceDelay,
        },

        y: {
          type: "spring",
          stiffness: champion ? 92 : 140,
          damping: champion ? 13 : 17,
          mass: champion ? 1.1 : 1,
          delay: entranceDelay,
        },

        scale:
          champion && finalMode
            ? {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : {
                type: "spring",
                stiffness: champion ? 105 : 145,
                damping: champion ? 13 : 16,
                delay: entranceDelay,
              },
      }}
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[30px] border text-center ${
        champion
          ? "z-20 px-7 py-7 lg:px-8 lg:py-8"
          : "z-10 px-5 py-6"
      } ${style.height} ${style.box}`}
    >
      {/* ======================================================
          LOCAL CARD GLOW
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.55,
        }}
        animate={{
          opacity: champion
            ? 0.055
            : 0.025,
          scale: 1,
        }}
        transition={{
          duration: champion
            ? 1.1
            : 0.75,
          delay: entranceDelay + 0.08,
        }}
        className={`pointer-events-none absolute left-1/2 top-[-110px] -translate-x-1/2 rounded-full blur-[90px] ${
          champion
            ? "h-64 w-64"
            : "h-48 w-48"
        } ${style.glow}`}
      />

      {/* ======================================================
          CHAMPION TOP ACCENT
      ====================================================== */}

      {champion && (
        <>
          <motion.div
            initial={{
              scaleX: 0,
              opacity: 0,
            }}
            animate={{
              scaleX: 1,
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              delay: 0.35,
              ease: "easeOut",
            }}
            className="absolute inset-x-[18%] top-0 h-px origin-center bg-gradient-to-r from-transparent via-amber-300/80 to-transparent"
          />

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: [0, 0.7, 0.35],
              scale: [0.8, 1.08, 1],
            }}
            transition={{
              duration: 1.1,
              delay: 0.5,
            }}
            className="pointer-events-none absolute left-1/2 top-5 h-20 w-20 -translate-x-1/2 rounded-full border border-amber-300/10"
          />
        </>
      )}

      {/* ======================================================
          SHIMMER
      ====================================================== */}

      <motion.div
        initial={{
          x: "-180%",
          opacity: 0,
        }}
        animate={{
          x: "300%",
          opacity: champion
            ? [0, 0.18, 0]
            : [0, 0.1, 0],
        }}
        transition={{
          duration: champion ? 1.45 : 1,
          delay: entranceDelay + 0.38,
          ease: "easeInOut",
        }}
        className={`pointer-events-none absolute inset-y-0 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/20 to-transparent ${
          champion
            ? "w-[20%]"
            : "w-[24%]"
        }`}
      />

      {/* ======================================================
          MEDAL / CHAMPION CROWN AREA
      ====================================================== */}

      <div className="relative">
        {champion && (
          <motion.div
            initial={{
              opacity: 0,
              y: -45,
              scale: 0,
              rotate: -20,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: [0, 1.28, 1],
              rotate: 0,
            }}
            transition={{
              opacity: {
                duration: 0.2,
                delay: 0.3,
              },

              y: {
                type: "spring",
                stiffness: 210,
                damping: 11,
                delay: 0.3,
              },

              scale: {
                duration: 0.75,
                delay: 0.38,
              },

              rotate: {
                type: "spring",
                stiffness: 170,
                damping: 11,
                delay: 0.3,
              },
            }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-amber-300"
          >
            <Crown
              size={30}
              strokeWidth={1.7}
            />
          </motion.div>
        )}

        <motion.div
          initial={{
            opacity: 0,
            y: champion ? -20 : -25,
            scale: 0.25,
            rotate: champion ? -12 : -7,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: champion
              ? [1, 1.18, 1]
              : [1, 1.1, 1],
            rotate: 0,
          }}
          transition={{
            opacity: {
              duration: 0.2,
              delay: champion ? 0.45 : 0.22,
            },

            y: {
              type: "spring",
              stiffness: 220,
              damping: 12,
              delay: champion ? 0.45 : 0.22,
            },

            scale: {
              duration: champion ? 0.8 : 0.55,
              delay: champion ? 0.5 : 0.3,
            },

            rotate: {
              type: "spring",
              stiffness: 180,
              damping: 12,
              delay: champion ? 0.45 : 0.22,
            },
          }}
          className={
            champion
              ? "text-7xl lg:text-8xl"
              : "text-5xl lg:text-6xl"
          }
        >
          {style.medal}
        </motion.div>
      </div>

      {/* ======================================================
          PLACE LABEL
      ====================================================== */}

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
          duration: 0.35,
          delay: champion ? 0.68 : 0.4,
        }}
        className={
          champion
            ? "mt-4"
            : "mt-3"
        }
      >
        <p
          className={`font-black uppercase ${
            champion
              ? "text-[11px] tracking-[0.26em]"
              : "text-[8px] tracking-[0.2em]"
          } ${style.text}`}
        >
          {style.title}
        </p>

        {champion && (
          <motion.div
            initial={{
              width: 0,
            }}
            animate={{
              width: 54,
            }}
            transition={{
              duration: 0.6,
              delay: 0.78,
            }}
            className="mx-auto mt-2 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
          />
        )}
      </motion.div>

      {/* ======================================================
          AVATAR
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.45,
          rotate: champion ? -8 : 0,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 170,
          damping: 13,
          delay: champion ? 0.76 : 0.48,
        }}
        className={`flex items-center justify-center border bg-white/[0.04] font-black text-white ${
          champion
            ? `mt-5 h-20 w-20 rounded-[24px] text-2xl ${style.ring}`
            : `mt-4 h-14 w-14 rounded-[18px] text-base ${style.ring}`
        }`}
      >
        {initials(player.name)}
      </motion.div>

      {/* ======================================================
          NAME
      ====================================================== */}

      <motion.h2
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.42,
          delay: champion ? 0.9 : 0.58,
        }}
        className={`max-w-full truncate font-black tracking-[-0.035em] text-white ${
          champion
            ? "mt-4 text-2xl lg:text-3xl 2xl:text-[2rem]"
            : "mt-3 text-lg lg:text-xl"
        }`}
      >
        {player.name}
      </motion.h2>

      {/* PLACE */}

      <motion.p
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 0.35,
          delay: champion ? 1 : 0.68,
        }}
        className={`max-w-full truncate text-zinc-600 ${
          champion
            ? "mt-1.5 text-[11px]"
            : "mt-1 text-[9px]"
        }`}
      >
        {player.place || "—"}
      </motion.p>

      {/* ======================================================
          STATS
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.42,
          delay: champion ? 1.08 : 0.74,
        }}
        className={`flex items-center border-t border-white/[0.06] ${
          champion
            ? "mt-6 gap-7 pt-5"
            : "mt-4 gap-5 pt-4"
        }`}
      >
        <div>
          <p
            className={`font-black ${style.text} ${
              champion
                ? "text-2xl lg:text-3xl"
                : "text-lg lg:text-xl"
            }`}
          >
            {player.score ?? 0}

            {totalQuestions > 0 &&
              ` / ${totalQuestions}`}
          </p>

          <p className="mt-1 text-[6px] font-black uppercase tracking-[0.13em] text-zinc-800">
            Score
          </p>
        </div>

        <div
          className={
            champion
              ? "h-10 w-px bg-white/[0.07]"
              : "h-8 w-px bg-white/[0.06]"
          }
        />

        <div>
          <p
            className={`font-mono font-black text-zinc-400 ${
              champion
                ? "text-base lg:text-lg"
                : "text-xs lg:text-sm"
            }`}
          >
            {formatTime(
              player.time_taken
            )}
          </p>

          <p className="mt-1 text-[6px] font-black uppercase tracking-[0.13em] text-zinc-800">
            Time
          </p>
        </div>
      </motion.div>

      {/* ======================================================
          CHAMPION SPARKLES
      ====================================================== */}

      {champion && (
        <ChampionSparkles
          finalMode={finalMode}
        />
      )}

      {/* ======================================================
          FINAL CHAMPION BORDER PULSE
      ====================================================== */}

      {champion && finalMode && (
        <motion.div
          animate={{
            opacity: [0.15, 0.42, 0.15],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute inset-[3px] rounded-[27px] border border-amber-300/20"
        />
      )}
    </motion.div>
  );
}

/* ============================================================
   CHAMPION SPARKLES
============================================================ */

function ChampionSparkles({
  finalMode,
}) {
  const sparkles = [
    {
      left: "10%",
      top: "18%",
      delay: 0.75,
      size: 18,
    },
    {
      left: "84%",
      top: "20%",
      delay: 0.92,
      size: 15,
    },
    {
      left: "16%",
      top: "47%",
      delay: 1.05,
      size: 11,
    },
    {
      left: "88%",
      top: "52%",
      delay: 1.18,
      size: 12,
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {sparkles.map(
        (sparkle, index) => (
          <motion.div
            key={index}
            initial={{
              opacity: 0,
              scale: 0,
              rotate: 0,
            }}
            animate={
              finalMode
                ? {
                    opacity: [
                      0.15,
                      0.85,
                      0.15,
                    ],
                    scale: [
                      0.7,
                      1.15,
                      0.7,
                    ],
                    rotate: [
                      0,
                      35,
                      70,
                    ],
                  }
                : {
                    opacity: [
                      0,
                      0.9,
                      0,
                    ],
                    scale: [
                      0,
                      1.2,
                      0.65,
                    ],
                    rotate: [
                      0,
                      35,
                      65,
                    ],
                  }
            }
            transition={
              finalMode
                ? {
                    duration: 2.4,
                    delay: sparkle.delay,
                    repeat: Infinity,
                    repeatDelay: 0.45,
                    ease: "easeInOut",
                  }
                : {
                    duration: 1.25,
                    delay: sparkle.delay,
                    ease: "easeOut",
                  }
            }
            style={{
              left: sparkle.left,
              top: sparkle.top,
            }}
            className="absolute text-amber-300/80"
          >
            <Sparkles
              size={sparkle.size}
            />
          </motion.div>
        )
      )}
    </div>
  );
}

/* ============================================================
   HIDDEN PODIUM
============================================================ */

function HiddenPodium({
  rank,
  label,
  active = false,
}) {
  const champion = rank === 1;

  const heights = {
    1: "min-h-[390px] lg:min-h-[430px] 2xl:min-h-[455px]",
    2: "min-h-[285px] lg:min-h-[315px] 2xl:min-h-[330px]",
    3: "min-h-[255px] lg:min-h-[280px] 2xl:min-h-[295px]",
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: champion ? -10 : 0,

        scale: active
          ? champion
            ? [1, 1.018, 1]
            : [1, 1.01, 1]
          : 1,

        borderColor: active
          ? [
              "rgba(255,255,255,0.045)",
              champion
                ? "rgba(251,191,36,0.18)"
                : "rgba(251,191,36,0.11)",
              "rgba(255,255,255,0.045)",
            ]
          : "rgba(255,255,255,0.045)",
      }}
      transition={
        active
          ? {
              duration: champion
                ? 1.8
                : 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : {
              duration: 0.3,
            }
      }
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[30px] border bg-white/[0.012] ${heights[rank]}`}
    >
      {/* LOCAL ACTIVE GLOW */}

      {active && (
        <motion.div
          animate={{
            opacity: champion
              ? [0.015, 0.04, 0.015]
              : [0.01, 0.025, 0.01],

            scale: [
              0.85,
              1.08,
              0.85,
            ],
          }}
          transition={{
            duration: champion
              ? 1.8
              : 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 blur-[100px] ${
            champion
              ? "h-56 w-56"
              : "h-44 w-44"
          }`}
        />
      )}

      {/* ICON */}

      <motion.div
        animate={{
          opacity: active
            ? [0.35, 0.8, 0.35]
            : [0.22, 0.38, 0.22],

          scale: active
            ? champion
              ? [1, 1.14, 1]
              : [1, 1.08, 1]
            : 1,

          y:
            active && champion
              ? [0, -5, 0]
              : 0,
        }}
        transition={{
          duration: active
            ? champion
              ? 1.5
              : 1.8
            : 2.3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        {champion ? (
          <Crown
            size={active ? 42 : 36}
            strokeWidth={1.6}
            className={
              active
                ? "text-amber-400/75"
                : "text-zinc-700"
            }
          />
        ) : (
          <Medal
            size={active ? 32 : 29}
            className={
              active
                ? "text-amber-400/55"
                : "text-zinc-700"
            }
          />
        )}
      </motion.div>

      <p
        className={`relative mt-4 font-black uppercase ${
          champion
            ? "text-[10px] tracking-[0.22em]"
            : "text-[8px] tracking-[0.18em]"
        } ${
          active
            ? "text-amber-400/60"
            : "text-zinc-800"
        }`}
      >
        {label}
      </p>

      <motion.p
        animate={
          active
            ? {
                opacity: [
                  0.4,
                  0.8,
                  0.4,
                ],
              }
            : {}
        }
        transition={{
          duration: 1.8,
          repeat: active
            ? Infinity
            : 0,
        }}
        className={`relative mt-2 font-black ${
          champion
            ? "text-base"
            : "text-sm"
        } ${
          active
            ? "text-zinc-500"
            : "text-zinc-700"
        }`}
      >
        {active
          ? champion
            ? "Champion incoming..."
            : "Ready to reveal..."
          : "Waiting"}
      </motion.p>

      {/* CHAMPION WAITING ACCENT */}

      {champion && active && (
        <motion.div
          initial={{
            width: 0,
            opacity: 0,
          }}
          animate={{
            width: [30, 70, 30],
            opacity: [0.2, 0.65, 0.2],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative mt-4 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
        />
      )}
    </motion.div>
  );
}

/* ============================================================
   FINAL CELEBRATION

   Kept around the podium edges instead of creating a giant
   background glow.
============================================================ */

function CelebrationSparkles() {
  const particles = [
    {
      left: "7%",
      top: "20%",
      delay: 0,
      size: 14,
    },
    {
      left: "14%",
      top: "52%",
      delay: 0.3,
      size: 10,
    },
    {
      left: "24%",
      top: "16%",
      delay: 0.55,
      size: 11,
    },
    {
      left: "35%",
      top: "27%",
      delay: 0.8,
      size: 9,
    },
    {
      left: "65%",
      top: "25%",
      delay: 0.25,
      size: 10,
    },
    {
      left: "76%",
      top: "15%",
      delay: 0.65,
      size: 11,
    },
    {
      left: "86%",
      top: "50%",
      delay: 0.15,
      size: 10,
    },
    {
      left: "93%",
      top: "22%",
      delay: 0.5,
      size: 14,
    },
  ];

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
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
    >
      {particles.map(
        (particle, index) => (
          <motion.div
            key={index}
            initial={{
              opacity: 0,
              scale: 0,
              y: 12,
            }}
            animate={{
              opacity: [
                0,
                0.65,
                0.18,
                0,
              ],

              scale: [
                0,
                1,
                0.75,
                0,
              ],

              y: [
                12,
                -5,
                -18,
                -34,
              ],

              rotate: [
                0,
                35,
                70,
                110,
              ],
            }}
            transition={{
              duration: 3,
              delay: particle.delay,
              repeat: Infinity,
              repeatDelay: 1.1,
              ease: "easeInOut",
            }}
            style={{
              left: particle.left,
              top: particle.top,
            }}
            className="absolute text-amber-300/60"
          >
            <Sparkles
              size={particle.size}
            />
          </motion.div>
        )
      )}

      {/* VERY SUBTLE FINAL LIGHT SWEEP */}

      <motion.div
        initial={{
          x: "-160%",
        }}
        animate={{
          x: "220%",
        }}
        transition={{
          duration: 2.3,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut",
        }}
        className="absolute inset-y-[15%] w-[10%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-amber-100/[0.018] to-transparent"
      />
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
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/[0.06] bg-white/[0.025]">
          <Trophy
            size={23}
            className="text-zinc-700"
          />
        </div>

        <h3 className="mt-4 text-base font-black text-zinc-400">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-xs text-[9px] leading-5 text-zinc-700">
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
    <div className="flex h-full flex-col justify-center gap-2">
      {[1, 2, 3, 4, 5].map(
        (item) => (
          <div
            key={item}
            className="h-[74px] shrink-0 animate-pulse rounded-[17px] border border-white/[0.04] bg-white/[0.02]"
          />
        )
      )}
    </div>
  );
}

/* ============================================================
   LOADING SCREEN
============================================================ */

function LiveDisplayLoading() {
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden bg-[#070709] text-white">
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.09] blur-[150px]" />

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
          className="mx-auto h-16 w-16 object-contain"
        />

        <img
          src="/branding/quiztians-wordmark.png"
          alt="QUIZTIANS"
          className="mx-auto mt-3 h-11 w-auto object-contain"
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