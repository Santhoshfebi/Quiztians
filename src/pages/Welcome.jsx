import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { supabase } from "../supabaseClient";

export default function Welcome() {
  // =========================================================
  // STATE
  // =========================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [language, setLanguage] = useState("en");
  const [chapter, setChapter] = useState("");
  const [chapters, setChapters] = useState([]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizAvailable, setIsQuizAvailable] = useState(false);

  const [config, setConfig] = useState(null);
  const [starting, setStarting] = useState(false);

  // Controls expandable quiz registration form
  const [showJoinForm, setShowJoinForm] = useState(false);

  const navigate = useNavigate();

  // =========================================================
  // FETCH QUIZ CONFIG + REALTIME UPDATES
  // =========================================================

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("quiz_config")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching quiz config:", error.message);
        return;
      }

      if (data) {
        setConfig(data);
        setChapters(data.active_chapters || []);
      }
    };

    fetchConfig();

    const channel = supabase
      .channel("public:quiz_config")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quiz_config",
        },
        (payload) => {
          const updatedConfig = payload.new;

          setConfig(updatedConfig);
          setChapters(updatedConfig.active_chapters || []);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================================================
  // COUNTDOWN
  // =========================================================

  useEffect(() => {
    if (!config?.start_time) return;

    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(config.start_time);

      const diff = startTime - now;

      setIsQuizAvailable(diff <= 0);
      setTimeLeft(diff > 0 ? diff : 0);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [config]);

  // =========================================================
  // CLOSE FORM IF QUIZ BECOMES UNAVAILABLE AGAIN
  // =========================================================

  useEffect(() => {
    if (!isQuizAvailable) {
      setShowJoinForm(false);
    }
  }, [isQuizAvailable]);

  // =========================================================
  // SMOOTH SCROLL WHEN JOIN FORM OPENS
  // =========================================================

  useEffect(() => {
    if (!showJoinForm) return;

    const timer = setTimeout(() => {
      document
        .getElementById("join-quiz-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [showJoinForm]);

  // =========================================================
  // FORMATTED COUNTDOWN
  // =========================================================

  const formattedTime = useMemo(() => {
    return {
      days: Math.max(
        0,
        Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
      ),

      hours: Math.max(
        0,
        Math.floor((timeLeft / (1000 * 60 * 60)) % 24),
      ),

      minutes: Math.max(
        0,
        Math.floor((timeLeft / (1000 * 60)) % 60),
      ),

      seconds: Math.max(
        0,
        Math.floor((timeLeft / 1000) % 60),
      ),
    };
  }, [timeLeft]);

  // =========================================================
  // START QUIZ
  // =========================================================

  const handleStart = async () => {
    if (starting) return;

    setStarting(true);

    const phoneRegex = /^[0-9]{10}$/;

    const missingFields =
      !name || !phone || !place || !chapter;

    // Missing fields
    if (missingFields) {
      alert(
        language === "en"
          ? "Please fill all fields"
          : "எல்லா புலங்களையும் நிரப்பவும்",
      );

      setStarting(false);
      return;
    }

    // Phone validation
    if (!phoneRegex.test(phone)) {
      alert(
        language === "en"
          ? "Enter a valid 10-digit phone number"
          : "செல்லுபடியாகும் 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்",
      );

      setStarting(false);
      return;
    }

    try {
      // Check if user already attempted this chapter
      const { data: existingAttempt, error } = await supabase
        .from("results")
        .select("*")
        .eq("phone", phone)
        .eq("chapter", chapter)
        .maybeSingle();

      if (error) throw error;

      // -----------------------------------------------------
      // ALREADY ATTEMPTED
      // -----------------------------------------------------

      if (existingAttempt) {
        navigate("/already-attempted", {
          state: {
            language,
            name: existingAttempt.name,
            phone: existingAttempt.phone,
            place: existingAttempt.place,
            chapter: existingAttempt.chapter,
            score: existingAttempt.score,
            total: existingAttempt.total,
            attemptedAt: existingAttempt.created_at,
          },
        });

        return;
      }

      // -----------------------------------------------------
      // CONTINUE TO START CONFIRMATION
      // -----------------------------------------------------

      navigate("/start-confirm", {
        state: {
          name,
          phone,
          place,
          language,
          chapter,
          duration: config?.duration || 20,
        },
      });
    } catch (err) {
      console.error("Error checking attempt:", err.message);

      alert("Error checking attempt. Please try again later.");
    } finally {
      setStarting(false);
    }
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (!config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-6 text-white">
        <div className="w-40">
          <DotLottieReact
            src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
            loop
            autoplay
          />
        </div>

        <p className="mt-3 text-sm font-medium text-zinc-500">
          Loading quiz setup...
        </p>
      </div>
    );
  }

  // =========================================================
  // COUNTDOWN DATA
  // =========================================================

  const countdown = [
    {
      label: language === "en" ? "Day" : "நாள்",
      value: formattedTime.days,
    },
    {
      label: language === "en" ? "Hrs" : "மணி",
      value: formattedTime.hours,
    },
    {
      label: language === "en" ? "Min" : "நிமி",
      value: formattedTime.minutes,
    },
    {
      label: language === "en" ? "Sec" : "வினா",
      value: formattedTime.seconds,
    },
  ];

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0">
        {/* Purple glow */}

        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-violet-700/10 blur-[110px]" />

        {/* Indigo glow */}

        <div className="absolute -right-40 top-[450px] h-96 w-96 rounded-full bg-indigo-700/10 blur-[130px]" />

        {/* Subtle grid */}

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
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090B]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          {/* BRAND */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
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

          {/* ADMIN */}

          <button
            type="button"
            onClick={() => navigate("/admin-login")}
            className="group flex min-h-10 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-xs font-semibold text-zinc-400 transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white sm:px-4 sm:text-sm"
          >
            {language === "en"
              ? "Admin"
              : "அட்மின்"}

            <span className="transition-transform group-hover:translate-x-0.5">
              ↗
            </span>
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:py-20">
        <div
          className={`${showJoinForm
              ? "lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-20"
              : "mx-auto max-w-2xl"
            }`}
        >
          {/* =================================================
              HERO / QUIZ STATUS
          ================================================= */}

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

            <div className="mb-5 flex items-center gap-2">
              <span className="h-px w-6 bg-violet-500" />

              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400 sm:text-xs">
                {language === "en"
                  ? "Quiz Challenge"
                  : "வினாடி வினா சவால்"}
              </span>
            </div>

            {/* TITLE */}

            <h1 className="max-w-xl text-[38px] font-black leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-[62px]">
              {language === "en" ? (
                <>
                  Put your knowledge
                  <br />

                  <span className="bg-linear-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                    to the test.
                  </span>
                </>
              ) : (
                <>
                  உங்கள் அறிவை
                  <br />

                  <span className="bg-linear-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                    சோதித்துப் பாருங்கள்.
                  </span>
                </>
              )}
            </h1>

            {/* DESCRIPTION */}

            <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500 sm:mt-6 sm:text-base sm:leading-7">
              {language === "en"
                ? "Compete. Learn. Improve. Choose your chapter and see how far your knowledge can take you."
                : "போட்டியிடுங்கள். கற்றுக்கொள்ளுங்கள். முன்னேறுங்கள். உங்கள் அதிகாரத்தைத் தேர்ந்தெடுத்து உங்கள் அறிவை சோதியுங்கள்."}
            </p>

            {/* =================================================
                QUIZ STATUS CARD
            ================================================= */}

            <div className="mt-8 overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#111114] shadow-2xl shadow-black/20 sm:mt-10 sm:rounded-3xl">
              {/* STATUS HEADER */}

              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4 sm:px-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 sm:text-[10px]">
                    {language === "en"
                      ? "Quiz status"
                      : "வினாடி வினா நிலை"}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-zinc-300 sm:text-sm">
                    {isQuizAvailable
                      ? language === "en"
                        ? "The challenge is open"
                        : "வினாடி வினா தொடங்கியுள்ளது"
                      : language === "en"
                        ? "Next quiz begins in"
                        : "வினாடி வினா தொடங்க"}
                  </p>
                </div>

                {/* STATUS BADGE */}

                <div
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black tracking-[0.12em] sm:text-[10px] ${isQuizAvailable
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    }`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${isQuizAvailable
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                        }`}
                    />

                    <span
                      className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isQuizAvailable
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                        }`}
                    />
                  </span>

                  {isQuizAvailable
                    ? language === "en"
                      ? "LIVE"
                      : "நேரலை"
                    : language === "en"
                      ? "WAITING"
                      : "காத்திருப்பு"}
                </div>
              </div>

              {/* =================================================
                  COUNTDOWN
              ================================================= */}

              {!isQuizAvailable && timeLeft > 0 ? (
                <div className="grid grid-cols-4 divide-x divide-white/[0.06] py-5 sm:py-7">
                  {countdown.map((item) => (
                    <div
                      key={item.label}
                      className="min-w-0 px-1 text-center"
                    >
                      <div className="text-[25px] font-black tabular-nums tracking-[-0.04em] text-white sm:text-3xl">
                        {String(item.value).padStart(
                          2,
                          "0",
                        )}
                      </div>

                      <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-600 sm:text-[10px]">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* =================================================
                   QUIZ LIVE MESSAGE
                ================================================= */

                <div className="flex items-center gap-4 px-4 py-5 sm:px-5 sm:py-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-400">
                    ✓
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      {language === "en"
                        ? "You're good to go"
                        : "நீங்கள் தொடங்கலாம்"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {language === "en"
                        ? "The quiz is live. Join whenever you're ready."
                        : "வினாடி வினா தொடங்கியுள்ளது. நீங்கள் தயாரானதும் சேரலாம்."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <div className="mt-4 space-y-3 sm:mt-5">
              {/* LEADERBOARD */}

              <button
                type="button"
                onClick={() => navigate("/scores")}
                className="group flex min-h-[52px] w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 transition active:scale-[0.99] hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-sm">
                    🏆
                  </span>

                  <span className="text-xs font-semibold text-zinc-300 sm:text-sm">
                    {language === "en"
                      ? "View Leaderboard"
                      : "தரவரிசையை பார்க்க"}
                  </span>
                </span>

                <span className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-white">
                  →
                </span>
              </button>

              {/* =================================================
                  JOIN QUIZ

                  Only shown when:
                  1. Quiz is live
                  2. Form is not already open
              ================================================= */}

              <AnimatePresence>
                {isQuizAvailable &&
                  !showJoinForm && (
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
                      exit={{
                        opacity: 0,
                        y: -5,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                      onClick={() =>
                        setShowJoinForm(true)
                      }
                      className="group flex min-h-[56px] w-full items-center justify-between rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-white shadow-[0_12px_40px_-12px_rgba(124,58,237,0.6)] transition active:scale-[0.98] hover:from-violet-500 hover:to-indigo-500"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm">
                          ⚡
                        </span>

                        <span className="text-sm font-bold">
                          {language === "en"
                            ? "Join Quiz"
                            : "வினாடி வினாவில் சேர"}
                        </span>
                      </span>

                      <span className="text-lg transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </motion.button>
                  )}
              </AnimatePresence>

              {/* =================================================
                  FORM OPEN INDICATOR / CLOSE BUTTON
              ================================================= */}

              {isQuizAvailable &&
                showJoinForm && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowJoinForm(false)
                    }
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-zinc-600 transition hover:text-zinc-300"
                  >
                    <span>↑</span>

                    {language === "en"
                      ? "Hide registration form"
                      : "பதிவு படிவத்தை மறைக்க"}
                  </button>
                )}
            </div>
          </motion.section>

          {/* =================================================
              REGISTRATION FORM

              Completely removed from UI until:
              isQuizAvailable && showJoinForm
          ================================================= */}

          <AnimatePresence>
            {isQuizAvailable &&
              showJoinForm && (
                <motion.section
                  id="join-quiz-form"
                  initial={{
                    opacity: 0,
                    y: 30,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 15,
                  }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mt-10 scroll-mt-24 lg:mt-0 lg:rounded-[28px] lg:border lg:border-white/[0.07] lg:bg-[#101013] lg:p-8 lg:shadow-2xl lg:shadow-black/20"
                >
                  {/* =============================================
                      MOBILE DIVIDER
                  ============================================= */}

                  <div className="mb-9 flex items-center gap-4 lg:hidden">
                    <div className="h-px flex-1 bg-white/[0.06]" />

                    <div className="h-1 w-1 rounded-full bg-violet-500" />

                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>

                  {/* =============================================
                      FORM HEADER
                  ============================================= */}

                  <div className="mb-7">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-400">
                        {language === "en"
                          ? "Join the quiz"
                          : "வினாடி வினாவில் சேருங்கள்"}
                      </span>

                      <span className="h-px w-5 bg-violet-500/60" />
                    </div>

                    <h2 className="text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
                      {language === "en"
                        ? "Enter your details"
                        : "உங்கள் விவரங்களை உள்ளிடவும்"}
                    </h2>

                    <p className="mt-2 max-w-md text-xs leading-5 text-zinc-500 sm:text-sm sm:leading-6">
                      {language === "en"
                        ? "Choose your chapter and enter your details to continue to the challenge."
                        : "உங்கள் அதிகாரத்தைத் தேர்ந்தெடுத்து தொடர உங்கள் விவரங்களை உள்ளிடவும்."}
                    </p>
                  </div>

                  {/* =============================================
                      FORM
                  ============================================= */}

                  <div className="space-y-5">
                    {/* =========================================
                        LANGUAGE
                    ========================================= */}

                    <div>
                      <label
                        htmlFor="language"
                        className="mb-2 block text-xs font-semibold text-zinc-400 sm:text-sm"
                      >
                        {language === "en"
                          ? "Language"
                          : "மொழி"}
                      </label>

                      <div className="relative">
                        <select
                          id="language"
                          value={language}
                          onChange={(e) =>
                            setLanguage(
                              e.target.value,
                            )
                          }
                          className="h-[54px] w-full appearance-none rounded-2xl border border-white/[0.08] bg-[#141418] px-4 pr-12 text-[15px] font-medium text-white outline-none transition focus:border-violet-500/70 focus:bg-[#17171c] focus:ring-4 focus:ring-violet-500/10"
                        >
                          <option value="en">
                            English
                          </option>

                          <option value="ta">
                            தமிழ்
                          </option>
                        </select>

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">
                          ▼
                        </span>
                      </div>
                    </div>

                    {/* =========================================
                        CHAPTER
                    ========================================= */}

                    <div>
                      <label
                        htmlFor="chapter"
                        className="mb-2 block text-xs font-semibold text-zinc-400 sm:text-sm"
                      >
                        {language === "en"
                          ? "Chapter"
                          : "அதிகாரம்"}
                      </label>

                      <div className="relative">
                        <select
                          id="chapter"
                          value={chapter}
                          onChange={(e) =>
                            setChapter(
                              e.target.value,
                            )
                          }
                          disabled={
                            chapters.length === 0
                          }
                          className="h-[54px] w-full appearance-none rounded-2xl border border-white/[0.08] bg-[#141418] px-4 pr-12 text-[15px] font-medium text-white outline-none transition focus:border-violet-500/70 focus:bg-[#17171c] focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:border-white/[0.04] disabled:bg-[#101013] disabled:text-zinc-700"
                        >
                          <option value="">
                            {language === "en"
                              ? "Select a chapter"
                              : "அதிகாரத்தைத் தேர்ந்தெடுக்கவும்"}
                          </option>

                          {chapters.map(
                            (ch) => (
                              <option
                                key={ch}
                                value={ch}
                              >
                                {ch}
                              </option>
                            ),
                          )}
                        </select>

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600">
                          ▼
                        </span>
                      </div>

                      {chapters.length === 0 && (
                        <p className="mt-2 text-[10px] leading-4 text-amber-500/70">
                          {language === "en"
                            ? "No chapters are currently available."
                            : "தற்போது அதிகாரங்கள் எதுவும் கிடைக்கவில்லை."}
                        </p>
                      )}
                    </div>

                    {/* =========================================
                        NAME
                    ========================================= */}

                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-xs font-semibold text-zinc-400 sm:text-sm"
                      >
                        {language === "en"
                          ? "Your name"
                          : "உங்கள் பெயர்"}
                      </label>

                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder={
                          language === "en"
                            ? "Enter your full name"
                            : "உங்கள் பெயரை உள்ளிடவும்"
                        }
                        value={name}
                        onChange={(e) =>
                          setName(
                            e.target.value,
                          )
                        }
                        className="h-[54px] w-full rounded-2xl border border-white/[0.08] bg-[#141418] px-4 text-[15px] font-medium text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-500/70 focus:bg-[#17171c] focus:ring-4 focus:ring-violet-500/10"
                      />
                    </div>

                    {/* =========================================
                        PHONE
                    ========================================= */}

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-xs font-semibold text-zinc-400 sm:text-sm"
                      >
                        {language === "en"
                          ? "Phone number"
                          : "தொலைபேசி எண்"}
                      </label>

                      <div className="relative">
                        {/* Display only */}

                        <span className="absolute left-4 top-1/2 -translate-y-1/2 border-r border-white/[0.08] pr-3 text-sm font-semibold text-zinc-500">
                          +91
                        </span>

                        <input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="98765 43210"
                          value={phone}
                          maxLength={10}
                          onChange={(e) =>
                            setPhone(
                              e.target.value.replace(
                                /[^0-9]/g,
                                "",
                              ),
                            )
                          }
                          className="h-[54px] w-full rounded-2xl border border-white/[0.08] bg-[#141418] py-3 pl-[72px] pr-4 text-[15px] font-medium text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-500/70 focus:bg-[#17171c] focus:ring-4 focus:ring-violet-500/10"
                        />
                      </div>
                    </div>

                    {/* =========================================
                        PLACE
                    ========================================= */}

                    <div>
                      <label
                        htmlFor="place"
                        className="mb-2 block text-xs font-semibold text-zinc-400 sm:text-sm"
                      >
                        {language === "en"
                          ? "Place"
                          : "இடம்"}
                      </label>

                      <input
                        id="place"
                        type="text"
                        autoComplete="address-level2"
                        placeholder={
                          language === "en"
                            ? "Enter your city or town"
                            : "உங்கள் ஊரை உள்ளிடவும்"
                        }
                        value={place}
                        onChange={(e) =>
                          setPlace(
                            e.target.value,
                          )
                        }
                        className="h-[54px] w-full rounded-2xl border border-white/[0.08] bg-[#141418] px-4 text-[15px] font-medium text-white outline-none transition placeholder:text-zinc-700 focus:border-violet-500/70 focus:bg-[#17171c] focus:ring-4 focus:ring-violet-500/10"
                      />
                    </div>

                    {/* =========================================
                        START QUIZ
                    ========================================= */}

                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={
                        starting ||
                        chapters.length === 0
                      }
                      className="group mt-2 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-[0_12px_40px_-12px_rgba(124,58,237,0.6)] transition active:scale-[0.98] hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#18181d] disabled:text-zinc-600 disabled:shadow-none disabled:active:scale-100"
                    >
                      {starting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                          {language === "en"
                            ? "Checking..."
                            : "சரிபார்க்கிறது..."}
                        </>
                      ) : (
                        <>
                          {language === "en"
                            ? "Start Quiz"
                            : "வினாடி வினாவை தொடங்கு"}

                          <span className="transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </>
                      )}
                    </button>

                    {/* =========================================
                        PRIVACY NOTE
                    ========================================= */}

                    <p className="px-3 text-center text-[10px] leading-4 text-zinc-700">
                      {language === "en"
                        ? "Your details are used only to identify your quiz attempt and score."
                        : "உங்கள் வினாடி வினா முயற்சி மற்றும் மதிப்பெண்ணை அடையாளம் காண உங்கள் விவரங்கள் பயன்படுத்தப்படும்."}
                    </p>
                  </div>
                </motion.section>
              )}
          </AnimatePresence>
        </div>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="relative z-10 px-5 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl border-t border-white/[0.05] pt-6">
          <div className="flex flex-col items-center justify-between gap-2 text-center text-[10px] text-zinc-700 sm:flex-row sm:text-left">
            <span>
              © {new Date().getFullYear()} Quiztians
            </span>

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