import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function ReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    phone,
    chapter,
    language: initialLanguage = "ta",
  } = state || {};

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [merged, setMerged] = useState([]);

  const [filter, setFilter] = useState("all");
  const [totalTime, setTotalTime] = useState(0);

  const [language, setLanguage] = useState(
    initialLanguage === "en" ? "en" : "ta"
  );

  // =========================================================
  // LANGUAGES
  // =========================================================

  const languages = [
    {
      code: "ta",
      label: "தமிழ்",
      shortLabel: "தமிழ்",
    },
    {
      code: "en",
      label: "English",
      shortLabel: "English",
    },
  ];

  // =========================================================
  // GET FIELD BY LANGUAGE
  // =========================================================

  const getFieldByLanguage = (item, field) => {
    if (!item) return "N/A";

    const key = `${field}_${language}`;

    return item[key] || item[field] || "N/A";
  };

  // =========================================================
  // LOAD REVIEW DATA
  // =========================================================

  useEffect(() => {
    if (!phone || !chapter) {
      navigate("/");
      return;
    }

    let mounted = true;

    const loadReviewData = async () => {
      setLoading(true);

      try {
        // ---------------------------------------------------
        // TOTAL TIME
        // ---------------------------------------------------

        const { data: resultRow } = await supabase
          .from("results")
          .select("time_taken")
          .eq("phone", phone)
          .eq("chapter", chapter)
          .single();

        if (mounted && resultRow) {
          setTotalTime(resultRow.time_taken || 0);
        }

        // ---------------------------------------------------
        // QUESTIONS
        // ---------------------------------------------------

        const {
          data: qData,
          error: qError,
        } = await supabase
          .from("questions")
          .select("*")
          .eq("chapter", chapter)
          .order("id", {
            ascending: true,
          });

        if (qError) {
          throw qError;
        }

        if (!mounted) return;

        setQuestions(qData || []);

        // ---------------------------------------------------
        // USER ANSWERS
        // ---------------------------------------------------

        const {
          data: aData,
          error: aError,
        } = await supabase
          .from("answers_history")
          .select("*")
          .eq("phone", phone)
          .eq("chapter", chapter);

        if (aError) {
          throw aError;
        }

        if (!mounted) return;

        setAnswers(aData || []);

        // ---------------------------------------------------
        // MERGE QUESTIONS + ANSWERS
        // ---------------------------------------------------

        const mergedData = (qData || []).map((q) => {
          const questionText =
            getFieldByLanguage(q, "question");

          const correctAnswer =
            getFieldByLanguage(
              q,
              "correct_answer"
            );

          /*
           * answers_history stores the question text in the
           * language in which the participant attempted it.
           *
           * First try matching the currently displayed
           * language. If that fails, try both Tamil and
           * English question fields.
           */
          const englishQuestion =
            q.question_en ||
            q.question ||
            "";

          const tamilQuestion =
            q.question_ta ||
            q.question ||
            "";

          const userAns = (aData || []).find(
            (a) =>
              a.question === questionText ||
              a.question === englishQuestion ||
              a.question === tamilQuestion
          );

          const userAnswer = userAns
            ? userAns.user_answer
            : "Not Answered";

          const attempted = !!userAns;

          /*
           * Use database is_correct when available.
           * Otherwise compare stored user/correct answers.
           */
          const calculatedCorrect =
            attempted &&
            String(userAnswer ?? "")
              .trim()
              .toLowerCase() ===
            String(
              userAns?.correct_answer ??
              correctAnswer ??
              ""
            )
              .trim()
              .toLowerCase();

          const isCorrect =
            attempted &&
              typeof userAns?.is_correct ===
              "boolean"
              ? userAns.is_correct
              : calculatedCorrect;

          return {
            id: q.id,

            question: questionText,

            correct_answer: correctAnswer,

            explanation:
              getFieldByLanguage(
                q,
                "explanation"
              ) || "",

            user_answer: userAnswer,

            is_correct: isCorrect,

            attempted,
          };
        });

        if (mounted) {
          setMerged(mergedData);
        }
      } catch (err) {
        console.error(
          "Error loading review:",
          err
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReviewData();

    return () => {
      mounted = false;
    };
  }, [
    phone,
    chapter,
    navigate,
    language,
  ]);

  // =========================================================
  // FILTERED QUESTIONS
  // =========================================================

  const filtered = useMemo(() => {
    return merged.filter((item) => {
      if (filter === "all") {
        return true;
      }

      if (filter === "correct") {
        return item.is_correct;
      }

      if (filter === "incorrect") {
        return (
          !item.is_correct &&
          item.user_answer !==
          "Not Answered"
        );
      }

      if (filter === "not_attempted") {
        return (
          item.user_answer ===
          "Not Answered"
        );
      }

      return true;
    });
  }, [merged, filter]);

  // =========================================================
  // COUNTS
  // =========================================================

  const totalQuestions = merged.length;

  const correctCount = merged.filter(
    (item) => item.is_correct
  ).length;

  const incorrectCount = merged.filter(
    (item) =>
      !item.is_correct &&
      item.user_answer !== "Not Answered"
  ).length;

  const notAttemptedCount = merged.filter(
    (item) =>
      item.user_answer === "Not Answered"
  ).length;

  // =========================================================
  // ACCURACY
  // =========================================================

  const accuracy =
    totalQuestions > 0
      ? Math.round(
        (correctCount /
          totalQuestions) *
        100
      )
      : 0;

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";

    const mins = Math.floor(
      seconds / 60
    );

    const secs = seconds % 60;

    return `${mins}m ${secs
      .toString()
      .padStart(2, "0")}s`;
  };

  // =========================================================
  // FILTER CONFIG
  // =========================================================

  const filters = [
    {
      id: "all",
      label: "All",
      count: totalQuestions,
    },
    {
      id: "correct",
      label: "Correct",
      count: correctCount,
    },
    {
      id: "incorrect",
      label: "Incorrect",
      count: incorrectCount,
    },
    {
      id: "not_attempted",
      label: "Skipped",
      count: notAttemptedCount,
    },
  ];

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return <ReviewLoading />;
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-16 h-96 w-96 rounded-full bg-violet-700/[0.08] blur-[140px]" />

        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-indigo-700/[0.07] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090B]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between px-5 sm:px-6">
          {/* BRAND */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl">
              <img
                src="/branding/quiztians-q.png"
                alt=""
                className="h-9 w-9 object-contain"
              />
            </div>

            <div className="text-left">
              <img
                src="/branding/quiztians-wordmark.png"
                alt="QUIZTIANS"
                className="h-[38px] w-auto max-w-[240px] object-contain object-left"
              />

              <div className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600 sm:block">
                Learn • Play • Compete
              </div>
            </div>
          </button>

          {/* BACK */}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex min-h-[38px] items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[10px] font-bold text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15 18-6-6 6-6"
              />
            </svg>

            Back
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-14 pt-7 sm:px-6 sm:pt-10">
        {/* ===================================================
            HEADING
        =================================================== */}

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
            duration: 0.4,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-violet-500" />

            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-violet-400">
              Answer Analysis
            </p>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
            Review your answers
          </h1>

          <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-600 sm:text-sm">
            See what you got right,
            understand your mistakes and
            strengthen your knowledge.
          </p>
        </motion.section>

        {/* ===================================================
            QUIZ META
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.05,
          }}
          className="mt-6 rounded-[22px] border border-white/[0.07] bg-[#111114] p-4 sm:p-5"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {/* CHAPTER */}

            <div className="col-span-2 sm:col-span-1">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
                Chapter
              </p>

              <p className="mt-1 truncate text-sm font-bold text-zinc-300">
                {chapter || "—"}
              </p>
            </div>

            {/* QUESTIONS */}

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
                Questions
              </p>

              <p className="mt-1 text-sm font-black text-zinc-300">
                {totalQuestions}
              </p>
            </div>

            {/* TIME */}

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
                Time Taken
              </p>

              <p className="mt-1 text-sm font-black text-zinc-300">
                {formatTime(totalTime)}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            SUMMARY
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
          className="mt-4"
        >
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <SummaryCard
              value={correctCount}
              label="Correct"
              type="correct"
            />

            <SummaryCard
              value={incorrectCount}
              label="Incorrect"
              type="incorrect"
            />

            <SummaryCard
              value={notAttemptedCount}
              label="Skipped"
              type="skipped"
            />
          </div>

          {/* ACCURACY */}

          <div className="mt-3 rounded-[20px] border border-white/[0.06] bg-[#111114] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
                  Overall Accuracy
                </p>

                <p className="mt-1 text-xs font-semibold text-zinc-600">
                  {correctCount} correct out of{" "}
                  {totalQuestions}
                </p>
              </div>

              <p
                className={`text-xl font-black ${accuracy >= 80
                    ? "text-emerald-400"
                    : accuracy >= 50
                      ? "text-violet-400"
                      : "text-zinc-400"
                  }`}
              >
                {accuracy}%
              </p>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${accuracy}%`,
                }}
                transition={{
                  delay: 0.2,
                  duration: 0.7,
                  ease: "easeOut",
                }}
                className={`h-full rounded-full ${accuracy >= 80
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-violet-500 to-indigo-500"
                  }`}
              />
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            LANGUAGE
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.14,
          }}
          className="mt-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                Question Language
              </p>

              <p className="mt-1 text-[10px] text-zinc-700">
                Switch language to review the
                translated questions.
              </p>
            </div>
          </div>

          {/* SEGMENTED CONTROL */}

          <div className="mt-3 grid grid-cols-2 rounded-2xl border border-white/[0.07] bg-[#111114] p-1.5">
            {languages.map((lang) => {
              const active =
                language === lang.code;

              return (
                <button
                  type="button"
                  key={lang.code}
                  onClick={() =>
                    setLanguage(lang.code)
                  }
                  className={`relative min-h-[44px] rounded-xl px-4 text-xs font-black transition ${active
                      ? "text-white"
                      : "text-zinc-600 hover:text-zinc-400"
                    }`}
                >
                  {active && (
                    <motion.span
                      layoutId="review-language"
                      className="absolute inset-0 rounded-xl border border-violet-500/15 bg-violet-500/[0.1]"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 28,
                      }}
                    />
                  )}

                  <span className="relative z-10">
                    {lang.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.18,
          }}
          className="mt-6"
        >
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                Answers
              </p>

              <p className="mt-1 text-[10px] text-zinc-700">
                Showing {filtered.length} of{" "}
                {totalQuestions}
              </p>
            </div>
          </div>

          {/* SCROLLABLE MOBILE FILTERS */}

          <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-2">
              {filters.map((item) => {
                const active =
                  filter === item.id;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      setFilter(item.id)
                    }
                    className={`flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 text-[10px] font-black transition ${active
                        ? "border-violet-500/20 bg-violet-500/[0.1] text-violet-300"
                        : "border-white/[0.06] bg-white/[0.025] text-zinc-600 hover:bg-white/[0.045] hover:text-zinc-400"
                      }`}
                  >
                    {item.label}

                    <span
                      className={`flex min-w-[20px] items-center justify-center rounded-md px-1.5 py-0.5 text-[8px] ${active
                          ? "bg-violet-500/10 text-violet-400"
                          : "bg-white/[0.04] text-zinc-700"
                        }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            ANSWER CARDS
        =================================================== */}

        <section className="mt-4">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filtered.map((answer, index) => (
                  <AnswerCard
                    key={answer.id}
                    answer={answer}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                key="empty"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="rounded-[24px] border border-white/[0.07] bg-[#111114] px-5 py-12 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.025] text-zinc-700">
                  ✓
                </div>

                <p className="mt-4 text-sm font-bold text-zinc-500">
                  Nothing to show here
                </p>

                <p className="mt-1 text-[10px] text-zinc-700">
                  There are no answers in this
                  category.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ===================================================
            BOTTOM BACK BUTTON
        =================================================== */}

        <div className="mt-7">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 text-xs font-black text-zinc-400 transition hover:border-violet-500/20 hover:bg-violet-500/[0.04] hover:text-white sm:w-auto sm:px-7"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15 18-6-6 6-6"
              />
            </svg>

            Back to Result
          </button>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="mt-10 border-t border-white/[0.05] pt-6 text-center">
          <p className="text-[9px] font-semibold tracking-[0.08em] text-zinc-800">
            QUIZTIANS · Learn • Play • Compete
          </p>
        </footer>
      </main>
    </div>
  );
}

// ===========================================================
// SUMMARY CARD
// ===========================================================

function SummaryCard({
  value,
  label,
  type,
}) {
  const config = {
    correct: {
      icon: "✓",
      iconClass:
        "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400",
      valueClass: "text-emerald-400",
    },

    incorrect: {
      icon: "×",
      iconClass:
        "border-red-500/20 bg-red-500/[0.08] text-red-400",
      valueClass: "text-red-400",
    },

    skipped: {
      icon: "—",
      iconClass:
        "border-white/[0.07] bg-white/[0.03] text-zinc-500",
      valueClass: "text-zinc-400",
    },
  };

  const current =
    config[type] || config.skipped;

  return (
    <div className="rounded-[18px] border border-white/[0.07] bg-[#111114] p-3 sm:p-4">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-black sm:h-8 sm:w-8 ${current.iconClass}`}
      >
        {current.icon}
      </div>

      <p
        className={`mt-3 text-xl font-black tracking-[-0.03em] sm:text-2xl ${current.valueClass}`}
      >
        {value}
      </p>

      <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-700 sm:text-[9px]">
        {label}
      </p>
    </div>
  );
}

// ===========================================================
// ANSWER CARD
// ===========================================================

function AnswerCard({
  answer,
  index,
}) {
  const isNotAnswered =
    answer.user_answer === "Not Answered";

  const status = isNotAnswered
    ? "skipped"
    : answer.is_correct
      ? "correct"
      : "incorrect";

  const statusConfig = {
    correct: {
      label: "Correct",
      icon: "✓",

      border:
        "border-emerald-500/15",

      glow:
        "bg-emerald-500/[0.035]",

      badge:
        "border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-400",

      number:
        "border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-400",
    },

    incorrect: {
      label: "Incorrect",
      icon: "×",

      border: "border-red-500/15",

      glow: "bg-red-500/[0.03]",

      badge:
        "border-red-500/15 bg-red-500/[0.07] text-red-400",

      number:
        "border-red-500/15 bg-red-500/[0.06] text-red-400",
    },

    skipped: {
      label: "Not Answered",
      icon: "—",

      border: "border-white/[0.07]",

      glow: "bg-white/[0.015]",

      badge:
        "border-white/[0.07] bg-white/[0.03] text-zinc-500",

      number:
        "border-white/[0.07] bg-white/[0.03] text-zinc-500",
    },
  };

  const current =
    statusConfig[status];

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.985,
      }}
      transition={{
        duration: 0.28,
        delay: Math.min(
          index * 0.035,
          0.25
        ),
      }}
      className={`relative overflow-hidden rounded-[24px] border bg-[#111114] ${current.border}`}
    >
      {/* SUBTLE STATUS GLOW */}

      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[80px] ${current.glow}`}
      />

      <div className="relative p-4 sm:p-6">
        {/* ===============================================
            CARD HEADER
        =============================================== */}

        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl border px-2 text-[10px] font-black ${current.number}`}
          >
            {String(index + 1).padStart(
              2,
              "0"
            )}
          </div>

          <div
            className={`flex min-h-[28px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[8px] font-black uppercase tracking-[0.12em] ${current.badge}`}
          >
            <span>{current.icon}</span>

            {current.label}
          </div>
        </div>

        {/* ===============================================
            QUESTION
        =============================================== */}

        <div className="mt-4">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
            Question
          </p>

          <h2 className="mt-2 break-words text-[15px] font-bold leading-[1.6] tracking-[-0.01em] text-zinc-200 sm:text-base">
            {answer.question}
          </h2>
        </div>

        {/* ===============================================
            ANSWERS
        =============================================== */}

        <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {/* USER ANSWER */}

          <div>
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.15em] text-zinc-700">
              Your Answer
            </p>

            <div
              className={`flex min-h-[58px] items-start gap-3 rounded-2xl border p-3.5 ${isNotAnswered
                  ? "border-white/[0.06] bg-white/[0.02]"
                  : answer.is_correct
                    ? "border-emerald-500/15 bg-emerald-500/[0.045]"
                    : "border-red-500/15 bg-red-500/[0.045]"
                }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-black ${isNotAnswered
                    ? "border-white/[0.06] bg-white/[0.03] text-zinc-600"
                    : answer.is_correct
                      ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
                      : "border-red-500/20 bg-red-500/[0.08] text-red-400"
                  }`}
              >
                {isNotAnswered
                  ? "—"
                  : answer.is_correct
                    ? "✓"
                    : "×"}
              </div>

              <p
                className={`min-w-0 break-words text-xs font-semibold leading-5 ${isNotAnswered
                    ? "text-zinc-600"
                    : answer.is_correct
                      ? "text-emerald-200/80"
                      : "text-red-200/80"
                  }`}
              >
                {answer.user_answer}
              </p>
            </div>
          </div>

          {/* CORRECT ANSWER */}

          <div>
            <p className="mb-2 text-[8px] font-black uppercase tracking-[0.15em] text-zinc-700">
              Correct Answer
            </p>

            <div className="flex min-h-[58px] items-start gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.045] p-3.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] text-[10px] font-black text-emerald-400">
                ✓
              </div>

              <p className="min-w-0 break-words text-xs font-semibold leading-5 text-emerald-200/80">
                {answer.correct_answer}
              </p>
            </div>
          </div>
        </div>

        {/* ===============================================
            EXPLANATION
        =============================================== */}

        {answer.explanation &&
          answer.explanation !==
          "N/A" && (
            <div className="mt-3 rounded-2xl border border-violet-500/10 bg-violet-500/[0.035] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-500/15 bg-violet-500/[0.07]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-3.5 w-3.5 text-violet-400"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 17v-6M12 7h.01"
                    />

                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-400/70">
                    Explanation
                  </p>

                  <p className="mt-1.5 break-words text-[11px] leading-[1.65] text-zinc-500">
                    {answer.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </motion.article>
  );
}

// ===========================================================
// LOADING SCREEN
// ===========================================================

function ReviewLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-5 text-white">
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative text-center">
        {/* LOGO */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.85,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="flex items-center justify-center rounded-xl">
          <img
            src="/branding/quiztians-q.png"
            alt=""
            className="h-10 w-10 object-contain"
          />
        </motion.div>

        {/* ORIGINAL LOTTIE */}

        <div className="mx-auto mt-4 h-[140px] w-[140px]">
          <DotLottieReact
            src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
            loop
            autoplay
            style={{
              width: 140,
              height: 140,
            }}
          />
        </div>

        <p className="mt-2 text-sm font-black text-zinc-300">
          Loading your answers
        </p>

        <p className="mt-1 text-[10px] font-medium text-zinc-700">
          Preparing your review...
        </p>

        <div className="mx-auto mt-5 h-1 w-28 overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div
            initial={{
              x: "-100%",
            }}
            animate={{
              x: "200%",
            }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-full w-1/2 rounded-full bg-violet-500"
          />
        </div>
      </div>
    </div>
  );
}