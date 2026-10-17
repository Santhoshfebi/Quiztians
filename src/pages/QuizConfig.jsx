import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import dayjs from "dayjs";

import {
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileQuestion,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
  Timer,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { logAdminActivity } from "../utils/logAdminActivity";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// QUIZ CONFIGURATION
// ===========================================================

export default function QuizConfig() {
  // =========================================================
  // STATE
  // =========================================================

  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");

  const [allChapters, setAllChapters] = useState([]);
  const [activeChapters, setActiveChapters] = useState([]);

  const [chapterSearch, setChapterSearch] = useState("");

  const [configId, setConfigId] = useState(null);

  const [chapterCounts, setChapterCounts] = useState({});

  const [timeLeft, setTimeLeft] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  const [error, setError] = useState("");

  // =========================================================
  // FETCH CHAPTERS
  // =========================================================

  const fetchChapters = async () => {
    const { data, error: chapterError } = await supabase
      .from("questions")
      .select("chapter");

    if (chapterError) {
      throw chapterError;
    }

    const counts = {};

    (data || []).forEach((question) => {
      if (!question.chapter) return;

      /*
        Preserve the chapter values exactly as they exist
        in the questions table, matching the original page.
      */

      const chapter = question.chapter;

      counts[chapter] = (counts[chapter] || 0) + 1;
    });

    const chapters = Object.keys(counts);

    setAllChapters(chapters);
    setChapterCounts(counts);

    return chapters;
  };

  // =========================================================
  // FETCH CONFIG
  // =========================================================

  const fetchConfig = async () => {
    const { data, error: configError } = await supabase
      .from("quiz_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (configError) {
      throw configError;
    }

    if (!data) {
      setConfigId(null);
      setDuration("");
      setStartTime("");
      setActiveChapters([]);
      setLastSaved(null);

      return;
    }

    setConfigId(data.id);

    setDuration(
      data.duration !== null && data.duration !== undefined
        ? String(data.duration)
        : ""
    );

    setStartTime(
      data.start_time
        ? dayjs(data.start_time).format("YYYY-MM-DDTHH:mm")
        : ""
    );

    setActiveChapters(
      Array.isArray(data.active_chapters)
        ? data.active_chapters
        : []
    );

    setLastSaved(
      data.updated_at || data.created_at || null
    );
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setFetching(true);
      setError("");

      try {
        /*
          Authentication/navigation is now owned by
          AdminLayout, so this page only loads its data.
        */

        await fetchChapters();

        if (!mounted) return;

        await fetchConfig();
      } catch (fetchError) {
        console.error(
          "Quiz configuration load failed:",
          fetchError
        );

        if (!mounted) return;

        setError(
          fetchError?.message ||
            "Unable to load quiz configuration."
        );
      } finally {
        if (mounted) {
          setFetching(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // COUNTDOWN
  // =========================================================

  useEffect(() => {
    if (!startTime) {
      setTimeLeft("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(startTime);

      const diff =
        target.getTime() - now.getTime();

      if (Number.isNaN(target.getTime())) {
        setTimeLeft("");
        return;
      }

      if (diff <= 0) {
        setTimeLeft("Quiz Started");
        return;
      }

      const days = Math.floor(
        diff / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (diff / (1000 * 60 * 60)) % 24
      );

      const minutes = Math.floor(
        (diff / (1000 * 60)) % 60
      );

      const seconds = Math.floor(
        (diff / 1000) % 60
      );

      setTimeLeft(
        `${days}d ${hours}h ${minutes}m ${seconds}s`
      );
    };

    /*
      Run immediately so we don't wait one second
      for the first countdown render.
    */

    updateCountdown();

    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [startTime]);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    try {
      await fetchChapters();
      await fetchConfig();

      toast.success(
        "Configuration refreshed"
      );
    } catch (refreshError) {
      console.error(
        "Refresh failed:",
        refreshError
      );

      toast.error(
        "Failed to refresh configuration"
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // CHAPTER ACTIONS
  // =========================================================

  const toggleChapter = (chapter) => {
    setActiveChapters((previous) =>
      previous.includes(chapter)
        ? previous.filter(
            (item) => item !== chapter
          )
        : [...previous, chapter]
    );
  };

  const filteredChapters = useMemo(() => {
    const query =
      chapterSearch.trim().toLowerCase();

    if (!query) {
      return allChapters;
    }

    return allChapters.filter((chapter) =>
      String(chapter)
        .toLowerCase()
        .includes(query)
    );
  }, [allChapters, chapterSearch]);

  const allSelected =
    allChapters.length > 0 &&
    activeChapters.length ===
      allChapters.length;

  const toggleSelectAll = () => {
    setActiveChapters(
      allSelected ? [] : [...allChapters]
    );
  };

  // =========================================================
  // TOTAL ACTIVE QUESTIONS
  // =========================================================

  const activeQuestionCount = useMemo(() => {
    return activeChapters.reduce(
      (total, chapter) =>
        total +
        (chapterCounts[chapter] || 0),
      0
    );
  }, [
    activeChapters,
    chapterCounts,
  ]);

  // =========================================================
  // VALIDATION
  // =========================================================

  const durationNumber =
    Number(duration);

  const isDurationValid =
    duration !== "" &&
    Number.isFinite(durationNumber) &&
    durationNumber > 0;

  const isFormValid =
    isDurationValid &&
    Boolean(startTime) &&
    activeChapters.length > 0;

  // =========================================================
  // SAVE CONFIGURATION
  // =========================================================

  const handleSave = async () => {
    if (!isFormValid || saving) {
      if (!isDurationValid) {
        toast.error(
          "Enter a valid quiz duration"
        );
      } else if (!startTime) {
        toast.error(
          "Select a quiz start time"
        );
      } else if (
        activeChapters.length === 0
      ) {
        toast.error(
          "Select at least one chapter"
        );
      }

      return;
    }

    setSaving(true);

    try {
      const payload = {
        duration: Number(duration),
        start_time:
          dayjs(startTime).toISOString(),
        active_chapters:
          activeChapters,
      };

      let response;

      if (configId) {
        response = await supabase
          .from("quiz_config")
          .update(payload)
          .eq("id", configId)
          .select()
          .single();
      } else {
        response = await supabase
          .from("quiz_config")
          .insert([payload])
          .select()
          .single();
      }

      if (response.error) {
        throw response.error;
      }

      toast.success(
        "Configuration saved!"
      );

      // =====================================================
      // ACTIVITY LOG
      // =====================================================

      try {
        await logAdminActivity({
          action: configId
            ? "UPDATE_CONFIG"
            : "CREATE_CONFIG",

          module:
            "Quiz Configuration",

          description: configId
            ? `Updated quiz configuration. Duration: ${duration} mins, Chapters: ${activeChapters.length}`
            : `Created quiz configuration. Duration: ${duration} mins, Chapters: ${activeChapters.length}`,

          targetId:
            response.data?.id,

          targetType:
            "quiz_config",
        });
      } catch (logError) {
        /*
          The configuration is already saved at this point,
          so activity-log failure should not turn a successful
          save into a failed save in the UI.
        */

        console.error(
          "Activity logging failed:",
          logError
        );
      }

      setLastSaved(
        response.data?.updated_at ||
          response.data?.created_at ||
          new Date().toISOString()
      );

      if (
        !configId &&
        response.data?.id
      ) {
        setConfigId(
          response.data.id
        );
      }
    } catch (saveError) {
      console.error(
        "Configuration save failed:",
        saveError
      );

      toast.error(
        saveError?.message ||
          "Failed to save configuration"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <AdminLayout
      title="Quiz Configuration"
      eyebrow="Quiz Management"
    >
      {({ theme }) => (
        <>
          {/* =================================================
              TOASTER
          ================================================= */}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,

              style: {
                background: "#FFFFFF",
                color: "#18181B",
                border:
                  "1px solid rgba(228,228,231,0.95)",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow:
                  "0 16px 40px rgba(24,24,27,.12)",
              },

              success: {
                iconTheme: {
                  primary: "#16A34A",
                  secondary: "#FFFFFF",
                },
              },

              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#FFFFFF",
                },
              },
            }}
          />

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
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[110px]"
              style={{
                backgroundColor:
                  `${theme.accent}0D`,
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

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* LEFT */}

              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={15}
                    style={{
                      color:
                        theme.accent,
                    }}
                  />

                  <p
                    className="text-[11px] font-black uppercase tracking-[0.14em]"
                    style={{
                      color:
                        theme.accent,
                    }}
                  >
                    Quiz Control
                  </p>
                </div>

                <h2 className="mt-3 text-[27px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[31px] lg:text-[35px]">
                  Configure your live quiz
                </h2>

                <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
                  Set the quiz duration,
                  schedule the start time
                  and control which chapters
                  are available to
                  participants.
                </p>
              </div>

              {/* RIGHT */}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={
                    refreshing || saving
                  }
                  onClick={
                    handleRefresh
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 text-[12px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>

                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      borderColor:
                        `${theme.accent}20`,
                      backgroundColor:
                        theme.accentSoft,
                    }}
                  >
                    <Settings2
                      size={18}
                      style={{
                        color:
                          theme.accent,
                      }}
                    />
                  </div>

                  <div>
                    <p className="text-[12px] font-black text-zinc-900">
                      {configId
                        ? "Configuration Active"
                        : "New Configuration"}
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-500">
                      {activeChapters.length}{" "}
                      active{" "}
                      {activeChapters.length ===
                      1
                        ? "chapter"
                        : "chapters"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              LOADING
          ================================================= */}

          {fetching ? (
            <ConfigLoading
              theme={theme}
            />
          ) : error ? (
            <ErrorState
              message={error}
              theme={theme}
              onRetry={
                handleRefresh
              }
            />
          ) : (
            <>
              {/* =============================================
                  STATS
              ============================================= */}

              <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
                <StatCard
                  label="Total Chapters"
                  value={
                    allChapters.length
                  }
                  icon={BookOpen}
                  theme={theme}
                />

                <StatCard
                  label="Active Chapters"
                  value={
                    activeChapters.length
                  }
                  icon={CheckCircle2}
                  theme={theme}
                  accent={
                    activeChapters.length >
                    0
                  }
                />

                <StatCard
                  label="Quiz Duration"
                  value={
                    duration
                      ? `${duration}m`
                      : "—"
                  }
                  icon={Timer}
                  theme={theme}
                />

                <StatCard
                  label="Active Questions"
                  value={
                    activeQuestionCount
                  }
                  icon={FileQuestion}
                  theme={theme}
                />

                <StatCard
                  label="Start"
                  value={
                    startTime
                      ? dayjs(
                          startTime
                        ).format(
                          "DD MMM"
                        )
                      : "—"
                  }
                  secondary={
                    startTime
                      ? dayjs(
                          startTime
                        ).format(
                          "HH:mm"
                        )
                      : null
                  }
                  icon={CalendarClock}
                  theme={theme}
                />
              </section>

              {/* =============================================
                  STATUS BAR
              ============================================= */}

              <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <StatusCard
                  icon={Clock3}
                  label="Quiz Countdown"
                  value={
                    timeLeft ||
                    "Not scheduled"
                  }
                  description={
                    startTime
                      ? `Scheduled for ${dayjs(
                          startTime
                        ).format(
                          "DD MMM YYYY, hh:mm A"
                        )}`
                      : "Choose a start time to begin the countdown."
                  }
                  theme={theme}
                  live={
                    Boolean(
                      startTime
                    ) &&
                    timeLeft !==
                      "Quiz Started"
                  }
                />

                <StatusCard
                  icon={Save}
                  label="Last Saved"
                  value={
                    lastSaved
                      ? dayjs(
                          lastSaved
                        ).format(
                          "DD MMM YYYY"
                        )
                      : "Not saved yet"
                  }
                  description={
                    lastSaved
                      ? dayjs(
                          lastSaved
                        ).format(
                          "hh:mm:ss A"
                        )
                      : "Save the configuration to publish these settings."
                  }
                  theme={theme}
                  success={
                    Boolean(
                      lastSaved
                    )
                  }
                />
              </section>

              {/* =============================================
                  MAIN CONFIGURATION
              ============================================= */}

              <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                {/* ===========================================
                    FORM
                =========================================== */}

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
                    delay: 0.05,
                  }}
                  className="rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6"
                >
                  <SectionHeading
                    icon={Settings2}
                    title="Quiz Settings"
                    description="Configure timing and participating chapters."
                    theme={theme}
                  />

                  {/* =========================================
                      BASIC SETTINGS
                  ========================================= */}

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* DURATION */}

                    <div>
                      <FieldLabel
                        label="Quiz Duration"
                        required
                      />

                      <div className="relative mt-2">
                        <Timer
                          size={17}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                        />

                        <input
                          type="number"
                          min="1"
                          value={
                            duration
                          }
                          onChange={(
                            event
                          ) =>
                            setDuration(
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="20"
                          className="h-12 w-full rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] pl-11 pr-20 text-[14px] font-bold text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-500">
                          minutes
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                        Time allowed for a
                        participant to
                        complete the quiz.
                      </p>
                    </div>

                    {/* START TIME */}

                    <div>
                      <FieldLabel
                        label="Start Time"
                        required
                      />

                      <div className="relative mt-2">
                        <input
                          type="datetime-local"
                          value={
                            startTime
                          }
                          onChange={(
                            event
                          ) =>
                            setStartTime(
                              event
                                .target
                                .value
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 text-[13px] font-semibold text-zinc-900 outline-none transition [color-scheme:light] hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                        />
                      </div>

                      <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                        Participants will
                        see the countdown
                        until this time.
                      </p>
                    </div>
                  </div>

                  {/* =========================================
                      CHAPTER HEADER
                  ========================================= */}

                  <div className="mt-7 flex flex-col gap-3 border-t border-zinc-200/80 pt-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[14px] font-black text-zinc-900">
                        Select Chapters
                      </p>

                      <p className="mt-1 text-[12px] text-zinc-500">
                        Choose which
                        chapters are
                        available in the
                        live quiz.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        allChapters.length ===
                        0
                      }
                      onClick={
                        toggleSelectAll
                      }
                      className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3 text-[11px] font-bold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {allSelected ? (
                        <>
                          <X
                            size={13}
                          />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Check
                            size={13}
                          />
                          Select All
                        </>
                      )}
                    </button>
                  </div>

                  {/* =========================================
                      CHAPTER SEARCH
                  ========================================= */}

                  <div className="mt-4">
                    <div className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      />

                      <input
                        type="text"
                        value={
                          chapterSearch
                        }
                        onChange={(event) =>
                          setChapterSearch(
                            event.target
                              .value
                          )
                        }
                        placeholder="Search chapters..."
                        aria-label="Search chapters"
                        className="h-11 w-full rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] pl-11 pr-11 text-[13px] font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                      />

                      {chapterSearch && (
                        <button
                          type="button"
                          onClick={() =>
                            setChapterSearch(
                              ""
                            )
                          }
                          aria-label="Clear chapter search"
                          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          <X
                            size={14}
                          />
                        </button>
                      )}
                    </div>

                    {chapterSearch && (
                      <div className="mt-2 flex items-center justify-between gap-3 px-1">
                        <p className="text-[10px] font-medium text-zinc-500">
                          {
                            filteredChapters.length
                          }{" "}
                          {filteredChapters.length ===
                          1
                            ? "chapter"
                            : "chapters"}{" "}
                          found
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setChapterSearch(
                              ""
                            )
                          }
                          className="text-[10px] font-bold transition hover:opacity-80"
                          style={{
                            color:
                              theme.accent,
                          }}
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                  </div>

                  {/* =========================================
                      CHAPTER GRID
                  ========================================= */}

                  {allChapters.length >
                  0 ? (
                    filteredChapters.length >
                    0 ? (
                      <div
                        className="admin-hidden-scrollbar mt-4 max-h-[380px] overflow-y-auto pr-1"
                        style={{
                          scrollbarWidth:
                            "none",
                          msOverflowStyle:
                            "none",
                        }}
                      >
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                          {filteredChapters.map(
                            (
                              chapter
                            ) => (
                              <ChapterButton
                                key={
                                  chapter
                                }
                                chapter={
                                  chapter
                                }
                                count={
                                  chapterCounts[
                                    chapter
                                  ] || 0
                                }
                                active={activeChapters.includes(
                                  chapter
                                )}
                                onClick={() =>
                                  toggleChapter(
                                    chapter
                                  )
                                }
                                theme={
                                  theme
                                }
                              />
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-5 py-10 text-center">
                        <Search
                          size={22}
                          className="mx-auto text-zinc-400"
                        />

                        <p className="mt-3 text-[13px] font-bold text-zinc-700">
                          No matching
                          chapters
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-500">
                          No chapters match "
                          {chapterSearch}".
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setChapterSearch(
                              ""
                            )
                          }
                          className="mt-4 rounded-xl border px-3.5 py-2 text-[11px] font-bold transition hover:-translate-y-0.5"
                          style={{
                            borderColor:
                              `${theme.accent}20`,
                            backgroundColor:
                              theme.accentSoft,
                            color:
                              theme.accent,
                          }}
                        >
                          Clear Search
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-5 py-10 text-center">
                      <BookOpen
                        size={22}
                        className="mx-auto text-zinc-400"
                      />

                      <p className="mt-3 text-[13px] font-bold text-zinc-700">
                        No chapters found
                      </p>

                      <p className="mt-1 text-[11px] text-zinc-500">
                        Add questions before
                        configuring the quiz.
                      </p>
                    </div>
                  )}

                  {/* =========================================
                      SAVE
                  ========================================= */}

                  <div className="mt-6 border-t border-zinc-200/80 pt-5">
                    <button
                      type="button"
                      disabled={
                        !isFormValid ||
                        saving
                      }
                      onClick={
                        handleSave
                      }
                      className={`flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-[14px] font-black transition ${
                        isFormValid &&
                        !saving
                          ? "text-white hover:-translate-y-0.5"
                          : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                      }`}
                      style={
                        isFormValid &&
                        !saving
                          ? {
                              background: `linear-gradient(90deg, ${
                                theme.accent
                              }, ${
                                theme.chartSecondary ||
                                theme.accent
                              })`,
                              boxShadow: `0 12px 30px ${theme.accent}18`,
                            }
                          : undefined
                      }
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner />

                          Saving
                          Configuration...
                        </>
                      ) : (
                        <>
                          <Save
                            size={17}
                          />

                          {configId
                            ? "Save Configuration"
                            : "Create Configuration"}
                        </>
                      )}
                    </button>

                    {!isFormValid && (
                      <p className="mt-3 text-center text-[11px] leading-5 text-zinc-500">
                        Add a valid
                        duration, select a
                        start time and
                        activate at least
                        one chapter.
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* ===========================================
                    SUMMARY
                =========================================== */}

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
                    delay: 0.1,
                  }}
                  className="xl:sticky xl:top-[100px] xl:self-start"
                >
                  <ConfigurationSummary
                    duration={
                      duration
                    }
                    startTime={
                      startTime
                    }
                    activeChapters={
                      activeChapters
                    }
                    allChapters={
                      allChapters
                    }
                    activeQuestionCount={
                      activeQuestionCount
                    }
                    chapterCounts={
                      chapterCounts
                    }
                    timeLeft={
                      timeLeft
                    }
                    lastSaved={
                      lastSaved
                    }
                    isFormValid={
                      isFormValid
                    }
                    theme={theme}
                  />
                </motion.div>
              </section>
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}

// ===========================================================
// CHAPTER BUTTON
// ===========================================================

function ChapterButton({
  chapter,
  count,
  active,
  onClick,
  theme,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[76px] items-center gap-3 rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
      style={{
        borderColor: active
          ? `${theme.accent}35`
          : "#E4E4E7",

        backgroundColor: active
          ? theme.accentSoft
          : "#F8FAFC",
      }}
    >
      {/* ICON */}

      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
        style={{
          borderColor: active
            ? `${theme.accent}25`
            : "#E4E4E7",

          backgroundColor: active
            ? `${theme.accent}10`
            : "#FFFFFF",

          color: active
            ? theme.accent
            : "#71717A",
        }}
      >
        {active ? (
          <Check size={15} />
        ) : (
          <BookOpen size={15} />
        )}
      </div>

      {/* TEXT */}

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[12px] font-black ${
            active
              ? "text-zinc-900"
              : "text-zinc-700"
          }`}
        >
          {chapter}
        </p>

        <p className="mt-1 text-[10px] font-medium text-zinc-500">
          {count}{" "}
          {count === 1
            ? "question"
            : "questions"}
        </p>
      </div>

      {/* STATUS */}

      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          active
            ? ""
            : "border-zinc-300 bg-white"
        }`}
        style={
          active
            ? {
                borderColor:
                  `${theme.accent}35`,
                backgroundColor:
                  theme.accent,
                color: "#fff",
              }
            : undefined
        }
      >
        {active && (
          <Check size={11} />
        )}
      </div>
    </button>
  );
}

// ===========================================================
// CONFIGURATION SUMMARY
// ===========================================================

function ConfigurationSummary({
  duration,
  startTime,
  activeChapters,
  allChapters,
  activeQuestionCount,
  chapterCounts,
  timeLeft,
  lastSaved,
  isFormValid,
  theme,
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
      {/* HEADER */}

      <div className="border-b border-zinc-200/80 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            icon={Settings2}
            title="Configuration Summary"
            description="Current quiz setup."
            theme={theme}
          />

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
              isFormValid
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {isFormValid
              ? "Ready"
              : "Incomplete"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* ===============================================
            PRIMARY SUMMARY
        =============================================== */}

        <div className="grid grid-cols-2 gap-2.5">
          <SummaryMetric
            label="Duration"
            value={
              duration
                ? `${duration} min`
                : "—"
            }
          />

          <SummaryMetric
            label="Chapters"
            value={`${activeChapters.length}/${allChapters.length}`}
          />

          <SummaryMetric
            label="Questions"
            value={
              activeQuestionCount
            }
          />

          <SummaryMetric
            label="Countdown"
            value={
              timeLeft ||
              "Not set"
            }
            small
          />
        </div>

        {/* ===============================================
            SCHEDULE
        =============================================== */}

        <div className="mt-4 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-4">
          <div className="flex items-center gap-2">
            <CalendarClock
              size={15}
              style={{
                color:
                  theme.accent,
              }}
            />

            <p className="text-[12px] font-black text-zinc-800">
              Quiz Schedule
            </p>
          </div>

          {startTime ? (
            <>
              <p className="mt-3 text-[15px] font-black text-zinc-900">
                {dayjs(
                  startTime
                ).format(
                  "DD MMM YYYY"
                )}
              </p>

              <p
                className="mt-1 text-[13px] font-bold"
                style={{
                  color:
                    theme.accent,
                }}
              >
                {dayjs(
                  startTime
                ).format(
                  "hh:mm A"
                )}
              </p>
            </>
          ) : (
            <p className="mt-3 text-[12px] text-zinc-500">
              No start time
              selected.
            </p>
          )}
        </div>

        {/* ===============================================
            ACTIVE CHAPTERS
        =============================================== */}

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-black text-zinc-800">
              Active Chapters
            </p>

            <span className="text-[10px] font-bold text-zinc-500">
              {
                activeChapters.length
              }{" "}
              selected
            </span>
          </div>

          {activeChapters.length >
          0 ? (
            <div
              className="admin-hidden-scrollbar mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1"
              style={{
                scrollbarWidth:
                  "none",
                msOverflowStyle:
                  "none",
              }}
            >
              {activeChapters.map(
                (chapter) => (
                  <div
                    key={chapter}
                    className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-[#F8FAFC] px-3 py-2.5"
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor:
                          theme.accentSoft,
                        color:
                          theme.accent,
                      }}
                    >
                      <Check
                        size={12}
                      />
                    </div>

                    <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-zinc-700">
                      {chapter}
                    </p>

                    <span className="text-[10px] font-bold text-zinc-500">
                      {chapterCounts[
                        chapter
                      ] || 0}{" "}
                      Qs
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-4 py-6 text-center">
              <p className="text-[11px] text-zinc-500">
                No chapters selected
              </p>
            </div>
          )}
        </div>

        {/* ===============================================
            LAST SAVED
        =============================================== */}

        <div className="mt-4 border-t border-zinc-200/80 pt-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-medium text-zinc-500">
              Last saved
            </p>

            <p
              className={`text-right text-[11px] font-bold ${
                lastSaved
                  ? "text-emerald-600"
                  : "text-zinc-500"
              }`}
            >
              {lastSaved
                ? dayjs(
                    lastSaved
                  ).format(
                    "DD MMM YYYY, HH:mm:ss"
                  )
                : "Not saved"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// STATUS CARD
// ===========================================================

function StatusCard({
  icon: Icon,
  label,
  value,
  description,
  theme,
  live = false,
  success = false,
}) {
  return (
    <div className="rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)] sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor:
              `${theme.accent}18`,
            backgroundColor:
              theme.accentSoft,
            color:
              theme.accent,
          }}
        >
          <Icon size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold text-zinc-500">
              {label}
            </p>

            {live && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>

          <p
            className={`mt-1.5 break-words text-[16px] font-black ${
              success
                ? "text-emerald-600"
                : "text-zinc-900"
            }`}
          >
            {value}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// STAT CARD
// ===========================================================

function StatCard({
  label,
  value,
  secondary,
  icon: Icon,
  theme,
  accent = false,
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
        <p className="text-[11px] font-bold text-zinc-500">
          {label}
        </p>

        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
          style={{
            borderColor:
              `${theme.accent}18`,
            backgroundColor:
              theme.accentSoft,
            color: theme.accent,
          }}
        >
          <Icon size={14} />
        </div>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <p
          className={`text-[28px] font-black tracking-[-0.04em] sm:text-[31px] ${
            accent
              ? ""
              : "text-zinc-900"
          }`}
          style={
            accent
              ? {
                  color:
                    theme.accent,
                }
              : undefined
          }
        >
          {value}
        </p>

        {secondary && (
          <p className="mb-1 text-[11px] font-bold text-zinc-500">
            {secondary}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ===========================================================
// SECTION HEADING
// ===========================================================

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
            `${theme.accent}18`,
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

      <div className="min-w-0">
        <h3 className="text-[15px] font-black text-zinc-900">
          {title}
        </h3>

        <p className="mt-1 text-[11px] text-zinc-500 sm:text-[12px]">
          {description}
        </p>
      </div>
    </div>
  );
}

// ===========================================================
// SUMMARY METRIC
// ===========================================================

function SummaryMetric({
  label,
  value,
  small = false,
}) {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200/80 bg-[#F8FAFC] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
        {label}
      </p>

      <p
        className={`mt-1.5 truncate font-black text-zinc-800 ${
          small
            ? "text-[11px]"
            : "text-[16px]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ===========================================================
// FIELD LABEL
// ===========================================================

function FieldLabel({
  label,
  required = false,
}) {
  return (
    <label className="flex items-center gap-1 text-[12px] font-bold text-zinc-700">
      {label}

      {required && (
        <span className="text-red-500">
          *
        </span>
      )}
    </label>
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
    <div className="mt-4 rounded-[22px] border border-red-200 bg-white px-5 py-16 text-center shadow-[0_8px_24px_rgba(24,24,27,0.06)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50">
        <X
          size={22}
          className="text-red-500"
        />
      </div>

      <h3 className="mt-5 text-[18px] font-black text-zinc-900">
        Unable to load configuration
      </h3>

      <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-zinc-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-black shadow-sm transition hover:-translate-y-0.5"
        style={{
          borderColor:
            `${theme.accent}20`,
          backgroundColor:
            theme.accentSoft,
          color: theme.accent,
        }}
      >
        <RefreshCw size={14} />

        Try Again
      </button>
    </div>
  );
}

// ===========================================================
// LOADING
// ===========================================================

function ConfigLoading({ theme }) {
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map(
          (item) => (
            <div
              key={item}
              className="rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.05)] sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 animate-pulse rounded-full bg-zinc-100" />

                <div
                  className="h-8 w-8 animate-pulse rounded-lg"
                  style={{
                    backgroundColor:
                      theme.accentSoft,
                  }}
                />
              </div>

              <div className="mt-4 h-8 w-16 animate-pulse rounded-lg bg-zinc-100" />
            </div>
          )
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="rounded-[22px] border border-zinc-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(24,24,27,0.05)]">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-100" />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-20 animate-pulse rounded-2xl bg-[#F8FAFC]" />

            <div className="h-20 animate-pulse rounded-2xl bg-[#F8FAFC]" />
          </div>

          <div className="mt-7 h-5 w-32 animate-pulse rounded-full bg-zinc-100" />

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-[76px] animate-pulse rounded-2xl border border-zinc-100 bg-[#F8FAFC]"
                />
              )
            )}
          </div>
        </div>

        <div className="h-[430px] animate-pulse rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.05)]" />
      </div>
    </>
  );
}

// ===========================================================
// LOADING SPINNER
// ===========================================================

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}