import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Quiz() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const results = state || {};

  // =========================================================
  // QUIZ CONFIG
  // =========================================================

  const language = results.language || "en";

  const selectedChapter =
    results.chapter || localStorage.getItem("selectedChapter");

  const isPreview = results.isPreview || false;

  const quizDuration = results.duration || (isPreview ? 5 : 20);

  // =========================================================
  // STATE
  // =========================================================

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);

  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(quizDuration * 60);

  // =========================================================
  // ATTEMPT / WARNING STATE
  // =========================================================

  const attemptKey = `${results.phone || "guest"
    }_${selectedChapter}_attempted`;

  const quizSubmittedRef = useRef(false);

  const maxWarnings = 5;

  const [warningCount, setWarningCount] = useState(
    parseInt(
      sessionStorage.getItem(`${attemptKey}_warnings`)
    ) || 0
  );

  // =========================================================
  // ANSWER HISTORY
  // =========================================================

  const answersTracker = useRef([]);

  // =========================================================
  // STORE START TIME
  // =========================================================

  useEffect(() => {
    const now = new Date().toISOString();

    localStorage.setItem("quiz_start_time", now);
  }, []);

  // =========================================================
  // RESTORE PENDING RESULT
  // =========================================================

  useEffect(() => {
    const pending = sessionStorage.getItem(
      "pendingQuizResult"
    );

    if (pending) {
      const data = JSON.parse(pending);

      (async () => {
        try {
          await supabase.from("results").insert([data]);

          sessionStorage.removeItem(
            "pendingQuizResult"
          );

          toast.success(
            "Your last quiz result was safely restored!",
            {
              duration: 4000,
            }
          );
        } catch (err) {
          console.error(
            "Error restoring pending result:",
            err
          );
        }
      })();
    }
  }, []);

  // =========================================================
  // REFRESH / LEAVE PROTECTION
  // =========================================================

  useEffect(() => {
    if (isPreview) return;

    const warningKey = `${attemptKey}_warnings`;

    let warnings =
      parseInt(
        sessionStorage.getItem(warningKey)
      ) || 0;

    const handleBeforeUnload = (e) => {
      if (quizSubmittedRef.current) return;

      warnings += 1;

      sessionStorage.setItem(
        warningKey,
        warnings
      );

      setWarningCount(warnings);

      if (warnings < maxWarnings) {
        const urgency =
          warnings < maxWarnings - 1
            ? "Warning"
            : "FINAL WARNING";

        toast.error(
          `${urgency} ${warnings}/${maxWarnings - 1
          }: Refreshing or leaving will auto-submit on the ${maxWarnings}th attempt.`,
          {
            duration: 5000,
          }
        );

        e?.preventDefault?.();

        if (e) {
          e.returnValue = "";
        }
      } else {
        toast.success(
          "Quiz auto-submitted due to multiple attempts.",
          {
            duration: 4000,
          }
        );

        handleSubmit(true);
      }
    };

    const blockKeys = (e) => {
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) &&
          e.key.toLowerCase() === "r")
      ) {
        e.preventDefault();

        handleBeforeUnload(e);
      }
    };

    const blockBackForward = () => {
      window.history.pushState(
        null,
        "",
        window.location.href
      );

      handleBeforeUnload({});
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    window.addEventListener(
      "keydown",
      blockKeys
    );

    window.history.pushState(
      null,
      "",
      window.location.href
    );

    window.addEventListener(
      "popstate",
      blockBackForward
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );

      window.removeEventListener(
        "keydown",
        blockKeys
      );

      window.removeEventListener(
        "popstate",
        blockBackForward
      );
    };
  }, []);

  // =========================================================
  // FETCH QUESTIONS
  // =========================================================

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedChapter) {
        toast.error(
          "No chapter selected. Redirecting..."
        );

        navigate("/");

        return;
      }

      // -----------------------------------------------------
      // CHECK EXISTING ATTEMPT
      // -----------------------------------------------------

      if (!isPreview && results.phone) {
        const {
          data: existing,
          error: existingError,
        } = await supabase
          .from("results")
          .select("*")
          .eq("phone", results.phone)
          .eq("chapter", selectedChapter);

        if (existingError) {
          console.error(
            "Error checking existing attempt:",
            existingError
          );

          toast.error(
            "Error checking attempt. Please try again."
          );

          navigate("/");

          return;
        }

        if (existing && existing.length > 0) {
          const existingResult = existing[0];

          localStorage.setItem(
            attemptKey,
            "true"
          );

          navigate("/already-attempted", {
            state: {
              language,
              name: existingResult.name,
              phone: existingResult.phone,
              place: existingResult.place,
              chapter: existingResult.chapter,
              score: existingResult.score,
              total: existingResult.total,
              attemptedAt:
                existingResult.created_at,
            },
          });

          return;
        }

        localStorage.removeItem(attemptKey);

        sessionStorage.removeItem(
          `${attemptKey}_warnings`
        );

        setWarningCount(0);
      }

      // -----------------------------------------------------
      // FETCH QUESTIONS
      // -----------------------------------------------------

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("chapter", selectedChapter);

      if (error || !data?.length) {
        toast.error(
          "No questions found for this chapter."
        );

        setLoading(false);

        return;
      }

      setQuestions(
        data.sort(() => Math.random() - 0.5)
      );

      setLoading(false);
    };

    fetchQuestions();
  }, [selectedChapter]);

  // =========================================================
  // QUIZ TIMER
  // =========================================================

  useEffect(() => {
    if (isPreview) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);

          handleSubmit(true);

          return 0;
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // =========================================================
  // CURRENT QUESTION
  // =========================================================

  const q = questions[current];

  // =========================================================
  // OPTIONS
  // =========================================================

  const options = useMemo(() => {
    if (!q) return [];

    return language === "en"
      ? [
        q.option_a_en,
        q.option_b_en,
        q.option_c_en,
        q.option_d_en,
      ]
      : [
        q.option_a_ta,
        q.option_b_ta,
        q.option_c_ta,
        q.option_d_ta,
      ];
  }, [q, language]);

  // =========================================================
  // CORRECT ANSWER
  // =========================================================

  const correctAnswer = useMemo(() => {
    if (!q) return null;

    return language === "en"
      ? q.correct_answer
      : q.correct_answer_ta;
  }, [q, language]);

  // =========================================================
  // SELECT ANSWER
  // =========================================================

  const handleSelect = (option) => {
    if (
      isPreview ||
      showAnswer ||
      hasSubmitted
    ) {
      return;
    }

    answersTracker.current.push({
      question:
        language === "en"
          ? q.question_en
          : q.question_ta,

      correct_answer: correctAnswer,

      user_answer: option,

      chapter: selectedChapter,

      lang: language,
    });

    setSelected(option);

    setShowAnswer(true);

    if (option === correctAnswer) {
      setScore((prev) => prev + 1);
    }

    if (current < questions.length - 1) {
      setTimeout(() => {
        setSelected(null);

        setShowAnswer(false);

        setCurrent((prev) => prev + 1);
      }, 800);
    }
  };

  // =========================================================
  // SUBMIT QUIZ
  // =========================================================

  const handleSubmit = async (
    isAuto = false
  ) => {
    if (
      hasSubmitted ||
      quizSubmittedRef.current
    ) {
      return;
    }

    quizSubmittedRef.current = true;

    setHasSubmitted(true);

    localStorage.setItem(
      attemptKey,
      "true"
    );

    const start_time =
      localStorage.getItem("quiz_start_time");

    const end_time =
      new Date().toISOString();

    let time_taken = null;

    if (start_time) {
      const start = new Date(start_time);

      const end = new Date(end_time);

      time_taken = Math.floor(
        (end - start) / 1000
      );
    }

    const resultData = {
      name: results.name,

      phone: results.phone,

      place: results.place,

      chapter: selectedChapter,

      score,

      total: questions.length,

      language:
        language === "en"
          ? "English"
          : "Tamil",

      start_time,

      end_time,

      time_taken,
    };

    let resultInsert;

    // -------------------------------------------------------
    // SAVE RESULT
    // -------------------------------------------------------

    if (!isPreview) {
      if (isAuto) {
        sessionStorage.setItem(
          "pendingQuizResult",
          JSON.stringify(resultData)
        );
      }

      try {
        resultInsert = await supabase
          .from("results")
          .insert([resultData])
          .select("id");

        sessionStorage.removeItem(
          "pendingQuizResult"
        );
      } catch (error) {
        console.error(
          "Error submitting quiz:",
          error
        );
      }
    }

    // -------------------------------------------------------
    // SAVE ANSWER HISTORY
    // -------------------------------------------------------

    if (resultInsert?.data?.[0]?.id) {
      const result_id =
        resultInsert.data[0].id;

      const formattedAnswers =
        answersTracker.current.map((a) => ({
          result_id,

          phone: results.phone,

          chapter: selectedChapter,

          question: a.question,

          correct_answer:
            a.correct_answer,

          user_answer: a.user_answer,

          lang: a.lang,
        }));

      try {
        await supabase
          .from("answers_history")
          .insert(formattedAnswers);
      } catch (err) {
        console.error(
          "Error saving answers_history:",
          err
        );
      }
    }

    if (isAuto) {
      toast.success(
        "Quiz auto-submitted.",
        {
          duration: 3000,
        }
      );
    }

    navigate(
      isPreview ? "/admin" : "/result",
      {
        state: {
          ...results,

          score,

          total: questions.length,

          isPreview,

          time_taken,
        },
      }
    );
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (seconds) => {
    const mins = Math.floor(
      seconds / 60
    );

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  };

  // =========================================================
  // PROGRESS
  // =========================================================

  const timePercent =
    (timeLeft / (quizDuration * 60)) * 100;

  const isWarningTime =
    timeLeft <= 300;

  const questionProgress =
    questions.length > 0
      ? ((current + 1) /
        questions.length) *
      100
      : 0;

  const optionLabels = [
    "A",
    "B",
    "C",
    "D",
  ];

  // =========================================================
  // TEXT
  // =========================================================

  const text = {
    question:
      language === "en"
        ? "Question"
        : "கேள்வி",

    chapter:
      language === "en"
        ? "Chapter"
        : "அதிகாரம்",

    timeLeft:
      language === "en"
        ? "Time Left"
        : "மீதமுள்ள நேரம்",

    chooseAnswer:
      language === "en"
        ? "Choose one answer"
        : "ஒரு பதிலைத் தேர்ந்தெடுக்கவும்",

    submit:
      language === "en"
        ? "Submit Quiz"
        : "வினாவை சமர்ப்பிக்கவும்",

    submitting:
      language === "en"
        ? "Submitting..."
        : "சமர்ப்பிக்கப்படுகிறது...",

    preview:
      language === "en"
        ? "Preview"
        : "முன்னோட்டம்",

    previous:
      language === "en"
        ? "Previous"
        : "முந்தையது",

    next:
      language === "en"
        ? "Next"
        : "அடுத்தது",

    backPreview:
      language === "en"
        ? "Back to Chapter Preview"
        : "அதிகார முன்னோட்டத்திற்கு திரும்பு",

    loading:
      language === "en"
        ? "Preparing your quiz"
        : "உங்கள் வினாடி வினா தயாராகிறது",

    loadingDescription:
      language === "en"
        ? "Loading questions..."
        : "கேள்விகள் ஏற்றப்படுகின்றன...",

    noQuestions:
      language === "en"
        ? "No questions found"
        : "கேள்விகள் கிடைக்கவில்லை",

    noQuestionsDescription:
      language === "en"
        ? "There are no questions available for this chapter."
        : "இந்த அதிகாரத்திற்கு கேள்விகள் எதுவும் இல்லை.",

    backHome:
      language === "en"
        ? "Back to Home"
        : "முகப்பிற்கு திரும்பு",
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <QuizLoading
        title={text.loading}
        description={
          text.loadingDescription
        }
      />
    );
  }

  // =========================================================
  // NO QUESTIONS
  // =========================================================

  if (!questions?.length) {
    return (
      <NoQuestions
        title={text.noQuestions}
        description={
          text.noQuestionsDescription
        }
        buttonText={text.backHome}
        onBack={() => navigate("/")}
      />
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="relative min-h-screen bg-[#09090B] text-white">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#18181B",
            color: "#FAFAFA",
            border:
              "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            fontSize: "12px",
          },
        }}
      />

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-violet-700/10 blur-[120px]" />

        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-indigo-700/10 blur-[140px]" />

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
          STICKY NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-[#09090B]/95 backdrop-blur-xl">
        {/* NAVBAR */}

        <div className="border-b border-white/[0.06]">
          <div className="mx-auto flex h-[68px] max-w-4xl items-center justify-between px-5 sm:px-6">
            {/* BRAND */}

            <div className="flex min-w-0 items-center gap-2.5">
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
            </div>

            {/* RIGHT SIDE */}

            <div className="flex items-center gap-2">
              {/* PREVIEW BADGE */}

              {isPreview && (
                <div className="hidden rounded-full border border-amber-500/15 bg-amber-500/[0.07] px-3 py-1.5 sm:block">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-400">
                    {text.preview}
                  </span>
                </div>
              )}

              {/* TIMER */}

              {!isPreview && (
                <div
                  className={`flex min-w-[88px] items-center justify-center gap-2 rounded-xl border px-3 py-2 transition ${isWarningTime
                    ? "border-red-500/20 bg-red-500/[0.08]"
                    : "border-white/[0.07] bg-white/[0.03]"
                    }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className={`h-4 w-4 ${isWarningTime
                      ? "text-red-400"
                      : "text-zinc-500"
                      }`}
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="13"
                      r="8"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4l2.5 1.5M9 2h6"
                    />
                  </svg>

                  <span
                    className={`text-sm font-black tabular-nums ${isWarningTime
                      ? "animate-pulse text-red-400"
                      : "text-zinc-200"
                      }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TIMER PROGRESS */}

        {!isPreview && (
          <div className="h-[3px] w-full bg-white/[0.035]">
            <motion.div
              className={`h-full ${warningCount ===
                maxWarnings - 1
                ? "bg-red-600"
                : isWarningTime
                  ? "bg-red-500"
                  : "bg-gradient-to-r from-violet-500 to-indigo-500"
                }`}
              initial={{
                width: "100%",
              }}
              animate={{
                width: `${Math.max(
                  0,
                  Math.min(
                    timePercent,
                    100
                  )
                )}%`,
              }}
              transition={{
                duration: 1,
                ease: "linear",
              }}
            />
          </div>
        )}
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 mx-auto max-w-2xl px-5 pb-10 pt-6 sm:px-6 sm:pt-8">
        {/* ===================================================
            WARNING BANNER
        =================================================== */}

        <AnimatePresence>
          {!isPreview &&
            warningCount > 0 &&
            warningCount <
            maxWarnings && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                className={`mb-5 overflow-hidden rounded-2xl border ${warningCount ===
                  maxWarnings - 1
                  ? "border-red-500/30 bg-red-500/[0.09]"
                  : "border-orange-500/20 bg-orange-500/[0.06]"
                  }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${warningCount ===
                      maxWarnings - 1
                      ? "bg-red-500/10 text-red-400"
                      : "bg-orange-500/10 text-orange-400"
                      }`}
                  >
                    !
                  </div>

                  <div>
                    <p
                      className={`text-xs font-black ${warningCount ===
                        maxWarnings - 1
                        ? "text-red-400"
                        : "text-orange-400"
                        }`}
                    >
                      {warningCount ===
                        maxWarnings - 1
                        ? "Final warning"
                        : `Warning ${warningCount}/${maxWarnings - 1
                        }`}
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-zinc-500 sm:text-[11px]">
                      Refreshing or leaving
                      the quiz repeatedly will
                      automatically submit your
                      attempt on the{" "}
                      {maxWarnings}th attempt.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

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
            duration: 0.4,
          }}
        >
          {/* CHAPTER */}

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px w-5 bg-violet-500" />

                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-violet-400">
                  {text.chapter}
                </p>
              </div>

              <h1 className="truncate text-lg font-black tracking-[-0.025em] text-white sm:text-xl">
                {selectedChapter}
              </h1>
            </div>

            {/* QUESTION COUNT */}

            <div className="shrink-0 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-700">
                {text.question}
              </p>

              <p className="mt-1 text-xs font-black tabular-nums text-zinc-400">
                <span className="text-white">
                  {String(
                    current + 1
                  ).padStart(2, "0")}
                </span>

                <span className="mx-1 text-zinc-700">
                  /
                </span>

                {String(
                  questions.length
                ).padStart(2, "0")}
              </p>
            </div>
          </div>

          {/* QUESTION PROGRESS */}

          <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div
              className="h-full rounded-full bg-violet-500"
              animate={{
                width: `${questionProgress}%`,
              }}
              transition={{
                duration: 0.35,
                ease: "easeOut",
              }}
            />
          </div>
        </motion.section>

        {/* ===================================================
            QUESTION
        =================================================== */}

        <AnimatePresence mode="wait">
          <motion.section
            key={current}
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
              y: -10,
            }}
            transition={{
              duration: 0.3,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="mt-6"
          >
            {/* QUESTION CARD */}

            <div className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#111114]">
              {/* GLOW */}

              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-600/[0.06] blur-[70px]" />

              <div className="relative p-5 sm:p-7">
                {/* QUESTION LABEL */}

                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.08] px-2 text-xs font-black text-violet-400">
                    {String(
                      current + 1
                    ).padStart(2, "0")}
                  </span>

                  {isPreview && (
                    <span className="rounded-full border border-amber-500/15 bg-amber-500/[0.07] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.15em] text-amber-400 sm:hidden">
                      {text.preview}
                    </span>
                  )}
                </div>

                {/* QUESTION TEXT */}

                <h2 className="break-words text-[18px] font-bold leading-[1.55] tracking-[-0.015em] text-zinc-100 sm:text-xl sm:leading-[1.5]">
                  {language === "en"
                    ? q.question_en
                    : q.question_ta}
                </h2>

                <div className="mt-5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-zinc-700" />

                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
                    {text.chooseAnswer}
                  </p>
                </div>
              </div>
            </div>

            {/* ===============================================
                ANSWERS
            =============================================== */}

            <div className="mt-4 space-y-2.5 sm:space-y-3">
              {options.map(
                (option, idx) => {
                  const isCorrect =
                    option ===
                    correctAnswer;

                  const isSelected =
                    selected === option;

                  let answerStyle =
                    "border-white/[0.07] bg-[#111114] text-zinc-300 hover:border-violet-500/25 hover:bg-violet-500/[0.035]";

                  let letterStyle =
                    "border-white/[0.07] bg-white/[0.03] text-zinc-500";

                  let icon = null;

                  // -------------------------
                  // PREVIEW
                  // -------------------------

                  if (isPreview) {
                    if (isCorrect) {
                      answerStyle =
                        "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-100";

                      letterStyle =
                        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

                      icon = "✓";
                    } else {
                      answerStyle =
                        "border-white/[0.06] bg-[#111114] text-zinc-500";
                    }
                  }

                  // -------------------------
                  // ANSWER REVEALED
                  // -------------------------

                  else if (
                    showAnswer
                  ) {
                    if (
                      isSelected &&
                      isCorrect
                    ) {
                      answerStyle =
                        "border-emerald-500/30 bg-emerald-500/[0.09] text-emerald-100";

                      letterStyle =
                        "border-emerald-500/30 bg-emerald-500 text-white";

                      icon = "✓";
                    } else if (
                      isSelected &&
                      !isCorrect
                    ) {
                      answerStyle =
                        "border-red-500/30 bg-red-500/[0.09] text-red-100";

                      letterStyle =
                        "border-red-500/30 bg-red-500 text-white";

                      icon = "×";
                    } else if (
                      isCorrect
                    ) {
                      answerStyle =
                        "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-200";

                      letterStyle =
                        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

                      icon = "✓";
                    } else {
                      answerStyle =
                        "border-white/[0.04] bg-[#111114] text-zinc-600 opacity-55";

                      letterStyle =
                        "border-white/[0.05] bg-white/[0.02] text-zinc-700";
                    }
                  }

                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      whileTap={
                        !showAnswer &&
                          !isPreview
                          ? {
                            scale: 0.985,
                          }
                          : undefined
                      }
                      onClick={() =>
                        handleSelect(
                          option
                        )
                      }
                      disabled={
                        showAnswer ||
                        isPreview ||
                        hasSubmitted
                      }
                      className={`group flex min-h-[64px] w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 sm:min-h-[70px] sm:gap-4 sm:p-4 ${answerStyle}`}
                    >
                      {/* A B C D */}

                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black transition sm:h-10 sm:w-10 ${letterStyle}`}
                      >
                        {icon ||
                          optionLabels[
                          idx
                          ]}
                      </span>

                      {/* ANSWER */}

                      <span className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-5 sm:text-sm sm:leading-6">
                        {option}
                      </span>

                      {/* SELECT INDICATOR */}

                      {!showAnswer &&
                        !isPreview && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.08] transition group-hover:border-violet-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-transparent transition group-hover:bg-violet-500" />
                          </span>
                        )}
                    </motion.button>
                  );
                }
              )}
            </div>

            {/* ===============================================
                PREVIEW CONTROLS
            =============================================== */}

            {isPreview && (
              <div className="mt-6 rounded-[22px] border border-amber-500/10 bg-amber-500/[0.025] p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-500/70">
                    Preview Controls
                  </p>

                  <span className="text-[9px] font-bold text-zinc-700">
                    {current + 1} /{" "}
                    {questions.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrent(
                        (prev) =>
                          Math.max(
                            prev - 1,
                            0
                          )
                      )
                    }
                    disabled={
                      current === 0
                    }
                    className={`min-h-[48px] rounded-xl border px-3 text-xs font-bold transition ${current === 0
                      ? "cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-800"
                      : "border-white/[0.07] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
                      }`}
                  >
                    ← {text.previous}
                  </button>

                  {/* NEXT */}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrent(
                        (prev) =>
                          Math.min(
                            prev + 1,
                            questions.length -
                            1
                          )
                      )
                    }
                    disabled={
                      current ===
                      questions.length - 1
                    }
                    className={`min-h-[48px] rounded-xl border px-3 text-xs font-bold transition ${current ===
                      questions.length - 1
                      ? "cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-800"
                      : "border-violet-500/15 bg-violet-500/[0.06] text-violet-300 hover:bg-violet-500/[0.1]"
                      }`}
                  >
                    {text.next} →
                  </button>
                </div>

                {/* BACK */}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/admin/preview-quiz"
                    )
                  }
                  className="mt-2 min-h-[48px] w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 text-xs font-bold text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
                >
                  {text.backPreview}
                </button>
              </div>
            )}

            {/* ===============================================
                FINAL SUBMIT
            =============================================== */}

            {!isPreview &&
              current ===
              questions.length - 1 && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="mt-6"
                >
                  <motion.button
                    type="button"
                    whileTap={{
                      scale: 0.985,
                    }}
                    disabled={
                      hasSubmitted
                    }
                    onClick={() =>
                      handleSubmit(false)
                    }
                    className="flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-black text-white shadow-xl shadow-violet-950/20 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {hasSubmitted ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        {text.submitting}
                      </>
                    ) : (
                      <>
                        {text.submit}

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m5 12 4 4L19 6"
                          />
                        </svg>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
          </motion.section>
        </AnimatePresence>

        {/* ===================================================
            BOTTOM PROGRESS
        =================================================== */}

        {!isPreview && (
          <div className="mt-8 flex items-center justify-between border-t border-white/[0.05] pt-5">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-700">
                Progress
              </p>

              <p className="mt-1 text-[10px] font-semibold text-zinc-600">
                {current + 1} of{" "}
                {questions.length}
              </p>
            </div>

            {/* PROGRESS DOTS / BAR */}

            <div className="flex max-w-[55%] flex-1 items-center justify-end gap-1">
              {questions.length <=
                12 ? (
                questions.map(
                  (_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${index ===
                        current
                        ? "w-5 bg-violet-500"
                        : index <
                          current
                          ? "w-1.5 bg-violet-500/40"
                          : "w-1.5 bg-zinc-800"
                        }`}
                    />
                  )
                )
              ) : (
                <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-zinc-900">
                  <motion.div
                    animate={{
                      width: `${questionProgress}%`,
                    }}
                    className="h-full rounded-full bg-violet-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="mt-8 text-center">
          <p className="text-[9px] font-medium tracking-wide text-zinc-800">
            QUIZTIANS · Learn • Play •
            Compete
          </p>
        </div>
      </main>
    </div>
  );
}

// ===========================================================
// LOADING SCREEN
// ===========================================================

function QuizLoading({
  title,
  description,
}) {
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

      <div className="relative w-full max-w-sm text-center">
        {/* LOGO */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.8,
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

        {/* LOTTIE */}

        <div className="mx-auto mt-5 h-36 w-36 overflow-hidden sm:h-40 sm:w-40">
          <DotLottieReact
            src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
            loop
            autoplay
          />
        </div>

        <motion.h1
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
          }}
          className="mt-2 text-xl font-black tracking-[-0.03em] text-white"
        >
          {title}
        </motion.h1>

        <p className="mt-2 text-xs font-medium text-zinc-600">
          {description}
        </p>

        {/* LOADING BAR */}

        <div className="mx-auto mt-6 h-1 w-32 overflow-hidden rounded-full bg-white/[0.05]">
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

// ===========================================================
// NO QUESTIONS
// ===========================================================

function NoQuestions({
  title,
  description,
  buttonText,
  onBack,
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-5 text-white">
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700/[0.06] blur-[120px]" />
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="relative w-full max-w-sm rounded-[26px] border border-white/[0.08] bg-[#111114] p-6 text-center"
      >
        {/* ICON */}

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/[0.07] text-lg font-black text-red-400">
          !
        </div>

        <h1 className="mt-5 text-xl font-black tracking-[-0.02em] text-white">
          {title}
        </h1>

        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {description}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 min-h-[52px] w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white transition hover:from-violet-500 hover:to-indigo-500"
        >
          {buttonText}
        </button>
      </motion.div>
    </div>
  );
}