import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function StartQuizConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const state = location.state;

  const [activeTip, setActiveTip] = useState(0);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [readyCountdown, setReadyCountdown] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const language = state?.language || "en";

  const tips = [
    language === "en"
      ? "Answer carefully — answers cannot be changed."
      : "கவனமாக பதிலளிக்கவும் — பதில்களை மாற்ற முடியாது.",

    language === "en"
      ? "Try to answer all questions."
      : "அனைத்து கேள்விகளுக்கும் பதில் சொல்ல முயலுங்கள்.",

    language === "en"
      ? "Follow the quiz rules throughout the attempt."
      : "வினாடி வினா முழுவதும் விதிகளை பின்பற்றவும்.",

    language === "en"
      ? "Correct answers increase your score."
      : "சரியான பதில்கள் உங்கள் மதிப்பெண்ணை அதிகரிக்கும்.",

    language === "en"
      ? "Review your responses at the end to see the correct answers."
      : "வினாடி வினா முடிவில் சரியான பதில்களைப் பார்க்க உங்கள் பதில்களைச் சரிபார்க்கவும்.",

    language === "en"
      ? "The leaderboard will be available at the end."
      : "முடிவில் முன்னணி பட்டியல் காண்பிக்கப்படும்.",
  ];

  // =========================================================
  // ALWAYS START FROM TOP
  // =========================================================

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);

  // =========================================================
  // ROTATING TIPS
  // =========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTip((prev) => (prev + 1) % tips.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [tips.length]);

  // =========================================================
  // TAB SWITCH WARNING
  // =========================================================

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !isStarting) {
        alert(
          language === "en"
            ? "⚠ Do not switch tabs during the exam."
            : "⚠ தேர்வின் போது டாப் மாற்ற வேண்டாம்."
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [isStarting, language]);

  // =========================================================
  // CLEAN UP COUNTDOWN TIMER
  // =========================================================

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // =========================================================
  // START QUIZ
  // =========================================================

  const startQuizSequence = () => {
    if (!acceptedRules || isStarting || !state) return;

    setIsStarting(true);
    setReadyCountdown(5);

    timerRef.current = setInterval(() => {
      setReadyCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;

          navigate("/quiz", {
            state,
          });

          return null;
        }

        return prev - 1;
      });
    }, 1000);
  };

  // =========================================================
  // NO QUIZ DATA
  // =========================================================

  if (!state) {
    return (
      <NoQuizData
        language={language}
        onHome={() => navigate("/")}
      />
    );
  }

  const {
    name,
    phone,
    place,
    chapter,
    duration,
  } = state;

  // =========================================================
  // TRANSLATIONS
  // =========================================================

  const text = {
    eyebrow:
      language === "en"
        ? "Ready Room"
        : "தயார் அறை",

    title:
      language === "en"
        ? "Ready to start?"
        : "தொடங்க தயாரா?",

    description:
      language === "en"
        ? "Check your details and read the tips before beginning. Your quiz starts after a 5-second countdown."
        : "தொடங்குவதற்கு முன் உங்கள் விவரங்களை சரிபார்த்து குறிப்புகளை படிக்கவும். 5 வினாடி கவுண்ட்டவுனுக்குப் பிறகு வினாடி வினா தொடங்கும்.",

    participant:
      language === "en"
        ? "Participant"
        : "பங்கேற்பாளர்",

    phone:
      language === "en"
        ? "Phone"
        : "தொலைபேசி",

    place:
      language === "en"
        ? "Place"
        : "இடம்",

    chapter:
      language === "en"
        ? "Chapter"
        : "அதிகாரம்",

    duration:
      language === "en"
        ? "Duration"
        : "நேரம்",

    minutes:
      language === "en"
        ? "minutes"
        : "நிமிடங்கள்",

    language:
      language === "en"
        ? "Language"
        : "மொழி",

    english: "English",

    tamil: "தமிழ்",

    quizTips:
      language === "en"
        ? "Before you begin"
        : "தொடங்குவதற்கு முன்",

    tip:
      language === "en"
        ? "Quiz Tip"
        : "வினா குறிப்பு",

    rules:
      language === "en"
        ? "Quiz Rules"
        : "வினாடி வினா விதிகள்",

    accept:
      language === "en"
        ? "I have read the instructions and I agree to follow the quiz rules."
        : "வழிமுறைகளைப் படித்துள்ளேன் மற்றும் வினாடி வினா விதிகளைப் பின்பற்ற ஒப்புக்கொள்கிறேன்.",

    start:
      language === "en"
        ? "Start Quiz"
        : "வினாடி வினாவை தொடங்கு",

    starting:
      language === "en"
        ? "Quiz starting..."
        : "வினாடி வினா தொடங்குகிறது...",

    back:
      language === "en"
        ? "Go Back"
        : "திரும்பிச் செல்லவும்",

    countdownTitle:
      language === "en"
        ? "Get ready"
        : "தயாராகுங்கள்",

    countdownDescription:
      language === "en"
        ? "Your quiz is about to begin."
        : "உங்கள் வினாடி வினா தொடங்க உள்ளது.",

    locked:
      language === "en"
        ? "Accept the rules above to continue"
        : "தொடர மேலே உள்ள விதிகளை ஏற்றுக்கொள்ளவும்",
  };

  return (
    <div className="relative min-h-screen bg-[#09090B] text-white">
      {/* =====================================================
          FIXED BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-violet-700/10 blur-[120px]" />

        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-indigo-700/10 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
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

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090B]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          {/* BRAND */}

          <button
            type="button"
            onClick={() => {
              if (!isStarting) navigate("/");
            }}
            disabled={isStarting}
            className="group flex items-center gap-2.5 disabled:cursor-default"
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

          {/* READY BADGE */}

          <div className="flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/[0.07] px-3 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
            </span>

            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-400">
              {text.eyebrow}
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 mx-auto max-w-2xl px-5 pb-12 pt-9 sm:px-6 sm:pt-12 lg:pb-20">
        {/* ===================================================
            INTRO
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-6 bg-violet-500" />

            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-violet-400 sm:text-[10px]">
              {text.eyebrow}
            </span>
          </div>

          <h1 className="max-w-lg text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-white sm:text-4xl">
            {text.title}
          </h1>

          <p className="mt-4 max-w-lg text-[13px] leading-6 text-zinc-500 sm:text-sm">
            {text.description}
          </p>
        </motion.section>

        {/* ===================================================
            QUIZ SUMMARY
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.08,
          }}
          className="relative mt-8 overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#111114]"
        >
          {/* DECORATIVE GLOW */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-600/[0.08] blur-[80px]" />

          {/* TOP */}

          <div className="relative border-b border-white/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-600">
                  {text.chapter}
                </p>

                <h2 className="mt-2 break-words text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">
                  {chapter || "N/A"}
                </h2>
              </div>

              {/* DURATION */}

              <div className="shrink-0 rounded-2xl border border-violet-500/15 bg-violet-500/[0.07] px-3.5 py-2.5 text-right">
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-violet-400/70">
                  {text.duration}
                </p>

                <p className="mt-0.5 text-sm font-black text-violet-300">
                  {duration} min
                </p>
              </div>
            </div>
          </div>

          {/* PARTICIPANT */}

          <div className="relative grid grid-cols-2 gap-px bg-white/[0.05] sm:grid-cols-3">
            <SummaryItem
              label={text.participant}
              value={name}
            />

            <SummaryItem
              label={text.place}
              value={place}
            />

            <SummaryItem
              label={text.language}
              value={
                language === "en"
                  ? text.english
                  : text.tamil
              }
            />

            <SummaryItem
              label={text.phone}
              value={phone}
              className="sm:col-span-1"
            />

            <SummaryItem
              label={text.duration}
              value={`${duration} ${text.minutes}`}
            />

            <SummaryItem
              label={text.chapter}
              value={chapter}
            />
          </div>
        </motion.section>

        {/* ===================================================
            TIPS
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.14,
          }}
          className="mt-4 rounded-[26px] border border-white/[0.08] bg-[#111114] p-5 sm:p-6"
        >
          {/* HEADER */}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-400">
                {text.tip}
              </p>

              <h2 className="mt-1.5 text-base font-black text-white sm:text-lg">
                {text.quizTips}
              </h2>
            </div>

            {/* TIP NUMBER */}

            <div className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] px-3">
              <span className="text-[10px] font-bold tabular-nums text-zinc-500">
                {String(activeTip + 1).padStart(2, "0")}
                <span className="mx-1 text-zinc-700">/</span>
                {String(tips.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* TIP CAROUSEL */}

          <div className="mt-5 min-h-[96px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTip}
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
                  duration: 0.22,
                }}
                className="flex min-h-[96px] items-center rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
              >
                <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4 text-violet-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 18h6M10 22h4M8.5 14.5C7 13.4 6 11.6 6 9.5a6 6 0 1 1 12 0c0 2.1-1 3.9-2.5 5-1 .8-1.5 1.7-1.5 2.5h-4c0-.8-.5-1.7-1.5-2.5Z"
                    />
                  </svg>
                </div>

                <p className="text-[13px] font-medium leading-6 text-zinc-300 sm:text-sm">
                  {tips[activeTip]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* DOTS */}

          <div className="mt-4 flex items-center gap-1.5">
            {tips.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveTip(index)}
                disabled={isStarting}
                aria-label={`Tip ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === activeTip
                    ? "w-6 bg-violet-500"
                    : "w-1.5 bg-zinc-800 hover:bg-zinc-700"
                  }`}
              />
            ))}
          </div>
        </motion.section>

        {/* ===================================================
            RULE ACCEPTANCE
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.2,
          }}
          className={`mt-4 rounded-[26px] border p-5 transition sm:p-6 ${acceptedRules
              ? "border-violet-500/20 bg-violet-500/[0.045]"
              : "border-white/[0.08] bg-[#111114]"
            }`}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${acceptedRules
                  ? "bg-violet-500/10 text-violet-400"
                  : "bg-white/[0.03] text-zinc-600"
                }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-[18px] w-[18px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 4h8M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1ZM7 5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M8 12l2.5 2.5L16 9"
                />
              </svg>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                {text.rules}
              </p>

              <p className="mt-0.5 text-xs font-semibold text-zinc-400">
                {language === "en"
                  ? "Confirmation required"
                  : "உறுதிப்படுத்தல் தேவை"}
              </p>
            </div>
          </div>

          {/* CUSTOM CHECKBOX */}

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${acceptedRules
                ? "border-violet-500/20 bg-violet-500/[0.06]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
              }`}
          >
            <input
              type="checkbox"
              checked={acceptedRules}
              disabled={isStarting}
              onChange={(event) =>
                setAcceptedRules(event.target.checked)
              }
              className="peer sr-only"
            />

            {/* CHECKBOX VISUAL */}

            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${acceptedRules
                  ? "border-violet-500 bg-violet-500 text-white"
                  : "border-zinc-700 bg-[#09090B]"
                }`}
            >
              {acceptedRules && (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-3 w-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4 10 4 4 8-8"
                  />
                </svg>
              )}
            </div>

            <span className="text-[12px] font-medium leading-5 text-zinc-400 sm:text-[13px]">
              {text.accept}
            </span>
          </label>
        </motion.section>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            delay: 0.25,
          }}
          className="mt-5"
        >
          {/* START */}

          <motion.button
            type="button"
            whileTap={
              acceptedRules && !isStarting
                ? { scale: 0.985 }
                : undefined
            }
            disabled={!acceptedRules || isStarting}
            onClick={startQuizSequence}
            className={`flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition ${acceptedRules && !isStarting
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-950/25 hover:from-violet-500 hover:to-indigo-500"
                : "cursor-not-allowed border border-white/[0.05] bg-white/[0.035] text-zinc-700"
              }`}
          >
            {isStarting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                {text.starting}
              </>
            ) : (
              <>
                {text.start}

                <span>→</span>
              </>
            )}
          </motion.button>

          {/* RULE MESSAGE */}

          {!acceptedRules && (
            <p className="mt-2.5 text-center text-[10px] font-medium text-zinc-700">
              {text.locked}
            </p>
          )}

          {/* GO BACK */}

          <button
            type="button"
            disabled={isStarting}
            onClick={() => navigate(-1)}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 text-xs font-bold text-zinc-500 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span>←</span>

            {text.back}
          </button>
        </motion.section>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="mt-9 border-t border-white/[0.05] pt-6 text-center">
          <p className="text-[10px] font-medium tracking-wide text-zinc-700">
            QUIZTIANS · Learn • Play • Compete
          </p>
        </div>
      </main>

      {/* =====================================================
          FULL SCREEN COUNTDOWN
      ===================================================== */}

      <AnimatePresence>
        {readyCountdown !== null && isStarting && (
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
              duration: 0.2,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090B]/95 px-5 backdrop-blur-2xl"
          >
            {/* GLOW */}

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/15 blur-[100px]" />

            <div className="relative text-center">
              {/* LABEL */}

              <motion.p
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400"
              >
                {text.countdownTitle}
              </motion.p>

              {/* COUNTDOWN NUMBER */}

              <AnimatePresence mode="wait">
                <motion.div
                  key={readyCountdown}
                  initial={{
                    opacity: 0,
                    scale: 0.5,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 1.35,
                  }}
                  transition={{
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="my-7 bg-gradient-to-br from-white via-violet-200 to-indigo-400 bg-clip-text text-[120px] font-black leading-none tracking-[-0.08em] text-transparent sm:text-[150px]"
                >
                  {readyCountdown}
                </motion.div>
              </AnimatePresence>

              <p className="text-sm font-medium text-zinc-500">
                {text.countdownDescription}
              </p>

              {/* COUNTDOWN DOTS */}

              <div className="mt-8 flex justify-center gap-2">
                {[5, 4, 3, 2, 1].map((number) => (
                  <div
                    key={number}
                    className={`h-1.5 rounded-full transition-all duration-300 ${number >= readyCountdown
                        ? "w-6 bg-violet-500"
                        : "w-1.5 bg-zinc-800"
                      }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===========================================================
// SUMMARY ITEM
// ===========================================================

function SummaryItem({
  label,
  value,
  className = "",
}) {
  return (
    <div
      className={`min-w-0 bg-[#111114] px-4 py-4 sm:px-5 ${className}`}
    >
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </p>

      <p className="mt-1.5 break-words text-xs font-bold leading-5 text-zinc-300 sm:text-[13px]">
        {value || "N/A"}
      </p>
    </div>
  );
}

// ===========================================================
// NO QUIZ DATA SCREEN
// ===========================================================

function NoQuizData({ language, onHome }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-5 text-white">
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[120px]" />
      </div>

      {/* CARD */}

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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/[0.07] text-red-400">
          !
        </div>

        <h1 className="mt-5 text-xl font-black text-white">
          {language === "en"
            ? "No quiz data found"
            : "வினாடி வினா தகவல் இல்லை"}
        </h1>

        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {language === "en"
            ? "Please return to the home page and join the quiz again."
            : "முகப்பு பக்கத்திற்கு திரும்பி மீண்டும் வினாடி வினாவில் இணையவும்."}
        </p>

        <button
          type="button"
          onClick={onHome}
          className="mt-6 min-h-[52px] w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white transition hover:from-violet-500 hover:to-indigo-500"
        >
          {language === "en"
            ? "Back to Home"
            : "முகப்பிற்கு திரும்பு"}
        </button>
      </motion.div>
    </div>
  );
}