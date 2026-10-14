import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

export default function AlreadyAttempted() {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // ALWAYS START PAGE FROM TOP
  // =========================================================

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);

  // =========================================================
  // DATA FROM WELCOME PAGE
  // =========================================================

  const {
    language = "en",
    name,
    place,
    chapter,
    score,
    total,
    attemptedAt,
    created_at,
  } = location.state || {};

  // Supports both the new and old navigation state
  const attemptDate = attemptedAt || created_at;

  // =========================================================
  // SCORE
  // =========================================================

  const hasScore =
    score !== undefined &&
    score !== null &&
    total !== undefined &&
    total !== null;

  const percentage = useMemo(() => {
    if (!hasScore) return null;

    const numericScore = Number(score);
    const numericTotal = Number(total);

    if (
      Number.isNaN(numericScore) ||
      Number.isNaN(numericTotal) ||
      numericTotal <= 0
    ) {
      return null;
    }

    return Math.round((numericScore / numericTotal) * 100);
  }, [score, total, hasScore]);

  // =========================================================
  // DATE FORMATTER
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return language === "en" ? "N/A" : "தகவல் இல்லை";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return language === "en" ? "N/A" : "தகவல் இல்லை";
    }

    return parsedDate.toLocaleString(
      language === "ta" ? "ta-IN" : "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // =========================================================
  // TRANSLATIONS
  // =========================================================

  const text = {
    previousAttempt:
      language === "en" ? "Previous Attempt" : "முந்தைய முயற்சி",

    title:
      language === "en"
        ? "You've already completed this quiz."
        : "இந்த வினாடி வினாவை நீங்கள் ஏற்கனவே முடித்துவிட்டீர்கள்.",

    description:
      language === "en"
        ? "Your previous result is saved below. Each chapter can only be attempted once."
        : "உங்கள் முந்தைய முடிவு கீழே சேமிக்கப்பட்டுள்ளது. ஒவ்வொரு அதிகாரத்தையும் ஒருமுறை மட்டுமே முயற்சிக்க முடியும்.",

    chapter: language === "en" ? "Chapter" : "அதிகாரம்",

    score: language === "en" ? "Your Score" : "உங்கள் மதிப்பெண்",

    participant:
      language === "en" ? "Participant" : "பங்கேற்பாளர்",

    place: language === "en" ? "Place" : "இடம்",

    attempted:
      language === "en" ? "Attempted" : "முயற்சித்த தேதி",

    completed:
      language === "en" ? "Completed" : "முடிந்தது",

    backHome:
      language === "en" ? "Back to Home" : "முகப்பிற்கு திரும்பு",

    helpTitle:
      language === "en"
        ? "Think something is wrong?"
        : "ஏதேனும் தவறு இருப்பதாக நினைக்கிறீர்களா?",

    helpText:
      language === "en"
        ? "Contact the quiz administrator for assistance."
        : "உதவிக்கு வினாடி வினா நிர்வாகியை தொடர்பு கொள்ளவும்.",
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="relative min-h-screen bg-[#09090B] text-white">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* TOP VIOLET GLOW */}
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-violet-700/10 blur-[120px]" />

        {/* BOTTOM INDIGO GLOW */}
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-indigo-700/10 blur-[140px]" />

        {/* SUBTLE GRID */}
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
            onClick={() => navigate("/")}
            className="group flex items-center gap-2.5"
            aria-label="Go to home"
          >
            {/* LOGO */}
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

          {/* COMPLETED BADGE */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.07] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
              {text.completed}
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="relative z-10 mx-auto max-w-lg px-5 pb-12 pt-9 sm:px-6 sm:pt-12 lg:pb-20 lg:pt-14">
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
          {/* EYEBROW */}
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-6 bg-violet-500" />

            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-violet-400 sm:text-[10px]">
              {text.previousAttempt}
            </span>
          </div>

          {/* TITLE */}
          <h1 className="max-w-md text-[31px] font-black leading-[1.12] tracking-[-0.04em] text-white sm:text-4xl">
            {text.title}
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-4 max-w-md text-[13px] leading-6 text-zinc-500 sm:text-sm">
            {text.description}
          </p>
        </motion.section>

        {/* ===================================================
            RESULT TICKET
        =================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 28,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            delay: 0.08,
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mt-8"
        >
          {/* =================================================
              TICKET TOP
          ================================================= */}

          <div className="relative overflow-hidden rounded-t-[26px] border border-b-0 border-white/[0.08] bg-[#111114]">
            {/* DECORATIVE GLOW */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-600/[0.08] blur-[70px]" />

            <div className="relative px-5 pb-6 pt-5 sm:px-6">
              {/* CHAPTER HEADER */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-zinc-600">
                    {text.chapter}
                  </p>

                  <h2 className="mt-2 break-words text-xl font-black tracking-[-0.025em] text-white sm:text-2xl">
                    {chapter || "N/A"}
                  </h2>
                </div>

                {/* CHECK */}
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
                    delay: 0.35,
                    type: "spring",
                    stiffness: 220,
                    damping: 15,
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-sm font-black text-emerald-400"
                >
                  ✓
                </motion.div>
              </div>

              {/* =================================================
                  SCORE
              ================================================= */}

              {hasScore && (
                <div className="pt-9 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-zinc-600">
                    {text.score}
                  </p>

                  {/* SCORE NUMBER */}
                  <div className="mt-3 flex items-end justify-center">
                    <motion.span
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.3,
                        duration: 0.45,
                      }}
                      className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-[64px] font-black leading-none tracking-[-0.07em] text-transparent sm:text-[72px]"
                    >
                      {score}
                    </motion.span>

                    <span className="mb-1.5 ml-2 text-xl font-bold text-zinc-700 sm:text-2xl">
                      / {total}
                    </span>
                  </div>

                  {/* PERCENTAGE */}
                  {percentage !== null && (
                    <>
                      <p className="mt-3 text-sm font-bold text-zinc-400">
                        {percentage}%
                      </p>

                      {/* PROGRESS BAR */}
                      <div className="mx-auto mt-4 h-1.5 max-w-[240px] overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: `${Math.min(
                              Math.max(percentage, 0),
                              100
                            )}%`,
                          }}
                          transition={{
                            delay: 0.4,
                            duration: 0.9,
                            ease: "easeOut",
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              TICKET PERFORATION
          ================================================= */}

          <div className="relative flex h-7 items-center">
            {/* LEFT CUT */}
            <div className="absolute -left-[13px] z-20 h-[26px] w-[26px] rounded-full border-r border-white/[0.08] bg-[#09090B]" />

            {/* RIGHT CUT */}
            <div className="absolute -right-[13px] z-20 h-[26px] w-[26px] rounded-full border-l border-white/[0.08] bg-[#09090B]" />

            {/* TICKET BACKGROUND */}
            <div className="absolute inset-0 border-x border-white/[0.08] bg-[#111114]" />

            {/* DASHED LINE */}
            <div className="relative z-10 mx-5 w-full border-t border-dashed border-white/[0.1] sm:mx-6" />
          </div>

          {/* =================================================
              TICKET BOTTOM
          ================================================= */}

          <div className="relative overflow-hidden rounded-b-[26px] border border-t-0 border-white/[0.08] bg-[#111114]">
            <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
              {/* PARTICIPANT + PLACE */}
              <div className="grid grid-cols-2 gap-4">
                {/* PARTICIPANT */}
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                    {text.participant}
                  </p>

                  <p className="mt-2 break-words text-sm font-bold leading-5 text-zinc-200">
                    {name || "N/A"}
                  </p>
                </div>

                {/* PLACE */}
                <div className="min-w-0 border-l border-white/[0.06] pl-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                    {text.place}
                  </p>

                  <p className="mt-2 break-words text-sm font-bold leading-5 text-zinc-200">
                    {place || "N/A"}
                  </p>
                </div>
              </div>

              {/* =================================================
                  ATTEMPT DATE
              ================================================= */}

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                    {text.attempted}
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-zinc-300 sm:text-sm">
                    {formatDate(attemptDate)}
                  </p>
                </div>

                {/* CALENDAR ICON */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-zinc-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-[18px] w-[18px]"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 2v3M18 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            BACK HOME
        =================================================== */}

        <motion.button
          type="button"
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.25,
            duration: 0.4,
          }}
          whileTap={{
            scale: 0.98,
          }}
          onClick={() => navigate("/")}
          className="group mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 text-sm font-bold text-zinc-300 transition hover:border-violet-500/30 hover:bg-violet-500/[0.05] hover:text-white"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            ←
          </span>

          {text.backHome}
        </motion.button>

        {/* ===================================================
            HELP
        =================================================== */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.4,
            duration: 0.5,
          }}
          className="mt-7 text-center"
        >
          <p className="text-[11px] font-semibold text-zinc-500">
            {text.helpTitle}
          </p>

          <p className="mt-1 text-[10px] leading-5 text-zinc-700">
            {text.helpText}
          </p>
        </motion.div>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="relative z-10 px-5 pb-8 sm:px-6">
        <div className="mx-auto max-w-lg border-t border-white/[0.05] pt-6">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-[10px] text-zinc-700 sm:flex-row sm:text-left">
            <span>© {new Date().getFullYear()} Quiztians</span>

            <span className="font-medium tracking-wide">
              {language === "en"
                ? "Learn • Play • Compete"
                : "கற்றுக்கொள் • விளையாடு • போட்டியிடு"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}