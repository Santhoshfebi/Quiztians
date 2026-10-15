import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Gamepad2,
  Languages,
  MapPin,
  Medal,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import { supabase } from "../supabaseClient";

/* ==========================================================
   WELCOME
========================================================== */

export default function Welcome() {
  /* ========================================================
     STATE
  ======================================================== */

  // Welcome page UI language
  const [pageLanguage, setPageLanguage] = useState("en");

  // Quiz / registration language
  const [language, setLanguage] = useState("en");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [chapter, setChapter] = useState("");
  const [chapters, setChapters] = useState([]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizAvailable, setIsQuizAvailable] = useState(false);

  const [config, setConfig] = useState(null);
  const [starting, setStarting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const navigate = useNavigate();

  /* ========================================================
     FETCH QUIZ CONFIG + REALTIME
  ======================================================== */

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ========================================================
     COUNTDOWN
  ======================================================== */

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

  /* ========================================================
     CLOSE MODAL IF QUIZ BECOMES UNAVAILABLE
  ======================================================== */

  useEffect(() => {
    if (!isQuizAvailable) {
      setShowJoinModal(false);
    }
  }, [isQuizAvailable]);

  /* ========================================================
     MODAL BEHAVIOUR
  ======================================================== */

  useEffect(() => {
    if (!showJoinModal) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !starting) {
        setShowJoinModal(false);
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showJoinModal, starting]);

  /* ========================================================
     COUNTDOWN VALUES
  ======================================================== */

  const formattedTime = useMemo(() => {
    return {
      days: Math.max(
        0,
        Math.floor(timeLeft / (1000 * 60 * 60 * 24))
      ),

      hours: Math.max(
        0,
        Math.floor((timeLeft / (1000 * 60 * 60)) % 24)
      ),

      minutes: Math.max(
        0,
        Math.floor((timeLeft / (1000 * 60)) % 60)
      ),

      seconds: Math.max(
        0,
        Math.floor((timeLeft / 1000) % 60)
      ),
    };
  }, [timeLeft]);

  const countdown = [
    {
      label: pageLanguage === "en" ? "Days" : "நாள்",
      value: formattedTime.days,
    },
    {
      label: pageLanguage === "en" ? "Hours" : "மணி",
      value: formattedTime.hours,
    },
    {
      label: pageLanguage === "en" ? "Minutes" : "நிமி",
      value: formattedTime.minutes,
    },
    {
      label: pageLanguage === "en" ? "Seconds" : "வினா",
      value: formattedTime.seconds,
    },
  ];

  /* ========================================================
     MODAL
  ======================================================== */

  const openJoinModal = () => {
    if (!isQuizAvailable) return;

    setShowJoinModal(true);
  };

  const closeJoinModal = () => {
    if (starting) return;

    setShowJoinModal(false);
  };

  /* ========================================================
     START QUIZ
  ======================================================== */

  const handleStart = async () => {
    if (starting) return;

    setStarting(true);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanPlace = place.trim();

    const phoneRegex = /^[0-9]{10}$/;

    const missingFields =
      !cleanName ||
      !cleanPhone ||
      !cleanPlace ||
      !language ||
      !chapter;

    if (missingFields) {
      alert(
        language === "en"
          ? "Please fill all fields"
          : "எல்லா புலங்களையும் நிரப்பவும்"
      );

      setStarting(false);
      return;
    }

    if (!phoneRegex.test(cleanPhone)) {
      alert(
        language === "en"
          ? "Enter a valid 10-digit phone number"
          : "செல்லுபடியாகும் 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
      );

      setStarting(false);
      return;
    }

    try {
      const { data: existingAttempt, error } = await supabase
        .from("results")
        .select("*")
        .eq("phone", cleanPhone)
        .eq("chapter", chapter)
        .maybeSingle();

      if (error) throw error;

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

      navigate("/start-confirm", {
        state: {
          name: cleanName,
          phone: cleanPhone,
          place: cleanPlace,
          language,
          chapter,
          duration: config?.duration || 20,
        },
      });
    } catch (err) {
      console.error("Error checking attempt:", err.message);

      alert(
        language === "en"
          ? "Error checking attempt. Please try again later."
          : "முயற்சியை சரிபார்க்க முடியவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும்."
      );
    } finally {
      setStarting(false);
    }
  };

  /* ========================================================
     LOADING
  ======================================================== */

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

  /* ========================================================
     UI
  ======================================================== */

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* ====================================================
          GLOBAL BACKGROUND
      ==================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-violet-600/[0.10] blur-[160px]" />

        <div className="absolute -left-[260px] top-[620px] h-[520px] w-[520px] rounded-full bg-indigo-600/[0.06] blur-[160px]" />

        <div className="absolute -right-[280px] top-[300px] h-[560px] w-[560px] rounded-full bg-violet-700/[0.06] blur-[180px]" />

        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.45) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* ====================================================
          NAVBAR
      ==================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.055] bg-[#09090B]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
          {/* BRAND */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-0 items-center gap-2 sm:gap-2.5"
            aria-label="QUIZTIANS Home"
          >
            <img
              src="/branding/quiztians-q.png"
              alt=""
              className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
            />

            <div className="min-w-0 text-left">
              <img
                src="/branding/quiztians-wordmark.png"
                alt="QUIZTIANS"
                className="h-[28px] w-auto max-w-[120px] object-contain object-left sm:h-[38px] sm:max-w-[240px]"
              />

              <div className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600 sm:block">
                Learn • Play • Compete
              </div>
            </div>
          </button>

          {/* NAV RIGHT */}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* QUIZ STATUS */}

            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] lg:flex ${isQuizAvailable
                ? "border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-400"
                : "border-amber-500/15 bg-amber-500/[0.06] text-amber-400"
                }`}
            >
              <StatusDot active={isQuizAvailable} />

              {isQuizAvailable
                ? pageLanguage === "en"
                  ? "Quiz Live"
                  : "நேரலை"
                : pageLanguage === "en"
                  ? "Waiting"
                  : "காத்திருப்பு"}
            </div>

            {/* ==============================================
                WELCOME PAGE LANGUAGE TOGGLE
            ============================================== */}

            <div
              className="flex items-center rounded-xl border border-white/[0.07] bg-white/[0.025] p-1"
              role="group"
              aria-label="Welcome page language"
            >
              <button
                type="button"
                onClick={() => setPageLanguage("en")}
                aria-pressed={pageLanguage === "en"}
                className={`flex min-h-[30px] items-center justify-center rounded-lg px-2 text-[9px] font-black transition sm:px-2.5 sm:text-[10px] ${pageLanguage === "en"
                  ? "bg-violet-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.25)]"
                  : "text-zinc-600 hover:bg-white/[0.03] hover:text-zinc-300"
                  }`}
              >
                EN
              </button>

              <button
                type="button"
                onClick={() => setPageLanguage("ta")}
                aria-pressed={pageLanguage === "ta"}
                className={`flex min-h-[30px] items-center justify-center rounded-lg px-2 text-[9px] font-black transition sm:px-2.5 sm:text-[10px] ${pageLanguage === "ta"
                  ? "bg-violet-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.25)]"
                  : "text-zinc-600 hover:bg-white/[0.03] hover:text-zinc-300"
                  }`}
              >
                தமிழ்
              </button>
            </div>

            {/* ADMIN */}

            <button
              type="button"
              onClick={() => navigate("/admin-login")}
              aria-label={
                pageLanguage === "en"
                  ? "Admin login"
                  : "நிர்வாக உள்நுழைவு"
              }
              className="group flex min-h-10 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-2.5 text-[10px] font-bold text-zinc-500 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white sm:gap-1.5 sm:px-4 sm:text-xs"
            >
              <span className="hidden sm:inline">
                {pageLanguage === "en" ? "Admin" : "அட்மின்"}
              </span>

              <span className="transition-transform group-hover:translate-x-0.5">
                ↗
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="relative z-10">
        {/* ==================================================
            QUIZ ARENA HERO
        ================================================== */}

        <section className="relative mx-auto flex min-h-[calc(100svh-68px)] max-w-7xl items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          {/* QUIZTIANS WATERMARK */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              top-[38%]
              -translate-x-1/2
              -translate-y-1/2
              select-none
              whitespace-nowrap
              text-[72px]
              font-black
              tracking-[-0.08em]
              text-white/[0.018]
              sm:text-[100px]
              md:text-[125px]
              lg:top-[42%]
              lg:text-[150px]
              lg:text-white/[0.012]
              xl:text-[190px]
            "
          >
            QUIZTIANS
          </div>

          {/* HERO CONTENT */}

          <div className="relative mx-auto w-full max-w-[960px]">
            <motion.div
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.55,
              }}
              className="text-center"
            >
              {/* EYEBROW */}

              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-3 py-2">
                  <Sparkles
                    size={12}
                    className="text-violet-400"
                  />

                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-300 sm:text-[10px]">
                    {pageLanguage === "en"
                      ? "Bible Quiz Challenge"
                      : "வேதாகம வினாடி வினா சவால்"}
                  </span>
                </div>
              </div>

              {/* HERO TITLE */}

              <h1 className="mx-auto mt-6 max-w-[880px] text-[39px] font-black leading-[1.02] tracking-[-0.052em] text-white sm:text-[56px] lg:text-[70px] xl:text-[78px]">
                {pageLanguage === "en" ? (
                  <>
                    Know the Word.
                    <br />

                    <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                      Take the challenge.
                    </span>
                  </>
                ) : (
                  <>
                    வார்த்தையை அறிந்துகொள்.
                    <br />

                    <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                      சவாலை ஏற்றுக்கொள்.
                    </span>
                  </>
                )}
              </h1>

              {/* DESCRIPTION */}

              <p className="mx-auto mt-5 max-w-[590px] text-[13px] leading-6 text-zinc-500 sm:text-[15px] sm:leading-7">
                {pageLanguage === "en"
                  ? "Learn scripture. Test your knowledge. Challenge yourself and discover how much you really know."
                  : "வேதாகமத்தை கற்றுக்கொள்ளுங்கள். உங்கள் அறிவை சோதியுங்கள். உங்களை சவாலுக்கு உட்படுத்தி உங்கள் அறிவை கண்டறியுங்கள்."}
              </p>

              {/* LIVE STATE */}

              {isQuizAvailable ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.97,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    delay: 0.12,
                    duration: 0.4,
                  }}
                  className="mt-8"
                >
                  <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-400">
                      <StatusDot active />

                      {pageLanguage === "en"
                        ? "Quiz is live"
                        : "வினாடி வினா நேரலை"}
                    </div>
                  </div>

                  <p className="mt-4 text-[12px] font-medium text-zinc-600">
                    {pageLanguage === "en"
                      ? "The challenge is open. Join whenever you're ready."
                      : "சவால் தொடங்கியுள்ளது. நீங்கள் தயாரானதும் சேருங்கள்."}
                  </p>

                  <button
                    type="button"
                    onClick={openJoinModal}
                    className="group mx-auto mt-6 flex min-h-[58px] w-full max-w-[310px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-6 text-[13px] font-black text-white shadow-[0_18px_50px_-16px_rgba(124,58,237,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-18px_rgba(124,58,237,0.95)] active:translate-y-0"
                  >
                    <Zap size={16} />

                    {pageLanguage === "en"
                      ? "Join Quiz"
                      : "வினாடி வினாவில் சேர"}

                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </motion.div>
              ) : (
                /* WAITING STATE */

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 14,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.12,
                    duration: 0.45,
                  }}
                  className="mt-8"
                >
                  <div className="flex items-center justify-center gap-2">
                    <StatusDot active={false} />

                    <span className="text-[9px] font-black uppercase tracking-[0.17em] text-amber-400">
                      {pageLanguage === "en"
                        ? "Next challenge starts in"
                        : "அடுத்த சவால் தொடங்க"}
                    </span>
                  </div>

                  {/* COUNTDOWN */}

                  {timeLeft > 0 && (
                    <div className="mx-auto mt-5 grid max-w-[560px] grid-cols-4 overflow-hidden rounded-[20px] border border-white/[0.065] bg-[#111114]/85 shadow-2xl shadow-black/20 backdrop-blur">
                      {countdown.map((item, index) => (
                        <div
                          key={item.label}
                          className={`min-w-0 px-1 py-5 text-center sm:py-6 ${index !== countdown.length - 1
                            ? "border-r border-white/[0.055]"
                            : ""
                            }`}
                        >
                          <p className="text-[27px] font-black tabular-nums tracking-[-0.05em] text-white sm:text-[34px]">
                            {String(item.value).padStart(2, "0")}
                          </p>

                          <p className="mt-1.5 truncate px-1 text-[7px] font-black uppercase tracking-[0.1em] text-zinc-600 sm:text-[9px] sm:tracking-[0.14em]">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[9px] font-bold text-zinc-600">
                    <Clock3 size={11} />

                    {pageLanguage === "en"
                      ? "Registration opens automatically"
                      : "பதிவு தானாக திறக்கும்"}
                  </div>
                </motion.div>
              )}

              {/* TRUST ITEMS */}

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                <TrustItem>
                  {pageLanguage === "en"
                    ? "English & Tamil"
                    : "ஆங்கிலம் & தமிழ்"}
                </TrustItem>

                <TrustItem>
                  {pageLanguage === "en"
                    ? "Quick to join"
                    : "விரைவான பதிவு"}
                </TrustItem>

                <TrustItem>
                  {pageLanguage === "en"
                    ? "Instant results"
                    : "உடனடி முடிவுகள்"}
                </TrustItem>
              </div>
            </motion.div>

            {/* ==============================================
                CURRENT CHALLENGE
            ============================================== */}

            <motion.div
              initial={{
                opacity: 0,
                y: 18,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2,
                duration: 0.5,
              }}
              className="mx-auto mt-10 max-w-[700px]"
            >
              <div className="relative overflow-hidden rounded-[24px] border border-white/[0.065] bg-[#111114]/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div
                  className={`absolute inset-x-0 top-0 h-px ${isQuizAvailable
                    ? "bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
                    : "bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"
                    }`}
                />

                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-zinc-600">
                      {pageLanguage === "en"
                        ? "Current Challenge"
                        : "தற்போதைய சவால்"}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <StatusDot active={isQuizAvailable} />

                      <p className="text-[14px] font-black text-zinc-200">
                        {isQuizAvailable
                          ? pageLanguage === "en"
                            ? "Ready to test your knowledge?"
                            : "உங்கள் அறிவை சோதிக்க தயாரா?"
                          : pageLanguage === "en"
                            ? "Challenge opens soon"
                            : "சவால் விரைவில் தொடங்கும்"}
                      </p>
                    </div>

                    <p className="mt-2 max-w-sm text-[11px] leading-5 text-zinc-600">
                      {pageLanguage === "en"
                        ? "Choose from the available chapters and complete the quiz within the configured time."
                        : "கிடைக்கும் அதிகாரங்களில் ஒன்றைத் தேர்ந்தெடுத்து குறிப்பிட்ட நேரத்தில் வினாடி வினாவை முடிக்கவும்."}
                    </p>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.055] bg-[#0D0D10] sm:w-[220px]">
                    <ChallengeStat
                      icon={BookOpen}
                      label={
                        pageLanguage === "en"
                          ? "Chapters"
                          : "அதிகாரங்கள்"
                      }
                      value={chapters.length || "—"}
                    />

                    <ChallengeStat
                      icon={Clock3}
                      label={
                        pageLanguage === "en"
                          ? "Duration"
                          : "நேரம்"
                      }
                      value={
                        config?.duration
                          ? `${config.duration}m`
                          : "—"
                      }
                      border
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================================================
            HOW IT WORKS
        ================================================== */}

        <section className="border-y border-white/[0.05] bg-white/[0.012]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="mb-7 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-400">
                {pageLanguage === "en"
                  ? "Three simple steps"
                  : "மூன்று எளிய படிகள்"}
              </p>

              <h2 className="mt-2 text-[22px] font-black tracking-[-0.03em] text-white sm:text-[26px]">
                {pageLanguage === "en"
                  ? "Choose. Play. Discover."
                  : "தேர்வு. விளையாடு. அறிந்துகொள்."}
              </h2>
            </div>

            <div className="mx-auto grid max-w-[900px] gap-3 sm:grid-cols-3">
              <StepCard
                number="01"
                icon={BookOpen}
                title={
                  pageLanguage === "en"
                    ? "Choose"
                    : "தேர்வு"
                }
                description={
                  pageLanguage === "en"
                    ? "Pick your quiz language and an available chapter."
                    : "உங்கள் வினாடி வினா மொழியையும் கிடைக்கும் அதிகாரத்தையும் தேர்ந்தெடுக்கவும்."
                }
              />

              <StepCard
                number="02"
                icon={Gamepad2}
                title={
                  pageLanguage === "en"
                    ? "Play"
                    : "விளையாடு"
                }
                description={
                  pageLanguage === "en"
                    ? "Answer the questions and put your knowledge to the test."
                    : "கேள்விகளுக்கு பதிலளித்து உங்கள் அறிவை சோதியுங்கள்."
                }
              />

              <StepCard
                number="03"
                icon={Medal}
                title={
                  pageLanguage === "en"
                    ? "Result"
                    : "முடிவு"
                }
                description={
                  pageLanguage === "en"
                    ? "Complete the challenge and see your result instantly."
                    : "சவாலை முடித்து உங்கள் முடிவை உடனடியாக பாருங்கள்."
                }
              />
            </div>

            {/* LEADERBOARD */}

            <button
              type="button"
              onClick={() => navigate("/scores")}
              className="group mx-auto mt-6 flex min-h-[48px] w-full max-w-[380px] items-center justify-between rounded-2xl border border-white/[0.055] bg-white/[0.018] px-4 transition hover:border-white/[0.1] hover:bg-white/[0.035]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/10 bg-amber-500/[0.05] text-amber-400/70">
                  <Trophy size={14} />
                </span>

                <span className="text-left">
                  <span className="block text-[11px] font-black text-zinc-400">
                    {pageLanguage === "en"
                      ? "Leaderboard"
                      : "தரவரிசை"}
                  </span>

                  <span className="mt-0.5 block text-[9px] font-medium text-zinc-700">
                    {pageLanguage === "en"
                      ? "Rankings & top scores"
                      : "தரவரிசை மற்றும் சிறந்த மதிப்பெண்கள்"}
                  </span>
                </span>
              </span>

              <span className="rounded-full border border-white/[0.055] bg-white/[0.025] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-zinc-600">
                {pageLanguage === "en"
                  ? "Coming Soon"
                  : "விரைவில்"}
              </span>
            </button>
          </div>
        </section>
      </main>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="relative z-10 border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-7 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div className="flex items-center gap-2">
            <img
              src="/branding/quiztians-q.png"
              alt=""
              className="h-6 w-6 object-contain opacity-60"
            />

            <span className="text-[10px] font-bold text-zinc-700">
              © {new Date().getFullYear()} QUIZTIANS
            </span>
          </div>

          <span className="text-[10px] font-bold text-zinc-700">
            NEW GRACE JESUS WITH US - HOSUR
          </span>

          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-700">
            Learn • Play • Compete
          </span>
        </div>
      </footer>

      {/* ====================================================
          REGISTRATION MODAL
      ==================================================== */}

      <AnimatePresence>
        {showJoinModal && isQuizAvailable && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* BACKDROP */}

            <motion.button
              type="button"
              aria-label={
                pageLanguage === "en"
                  ? "Close registration"
                  : "பதிவை மூடு"
              }
              onClick={closeJoinModal}
              className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />

            {/* AMBIENT MODAL GLOW */}

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.12] blur-[130px] sm:h-[560px] sm:w-[560px]" />

            {/* MODAL */}

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="join-quiz-title"
              initial={{
                opacity: 0,
                y: 70,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 50,
                scale: 0.985,
              }}
              transition={{
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="
                relative
                z-10
                flex
                max-h-[94svh]
                w-full
                flex-col
                overflow-hidden
                rounded-t-[28px]
                border
                border-white/[0.08]
                bg-[#101014]
                shadow-[0_-20px_80px_rgba(0,0,0,0.55)]
                sm:max-h-[90vh]
                sm:max-w-[680px]
                sm:rounded-[28px]
                sm:shadow-[0_30px_100px_rgba(0,0,0,0.65)]
              "
            >
              {/* TOP ACCENT */}

              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />

              {/* MOBILE DRAG VISUAL */}

              <div className="flex shrink-0 justify-center pt-3 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-white/10" />
              </div>

              {/* MODAL HEADER */}

              <div className="relative shrink-0 border-b border-white/[0.055] px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-7">
                <button
                  type="button"
                  onClick={closeJoinModal}
                  disabled={starting}
                  aria-label={
                    pageLanguage === "en"
                      ? "Close registration"
                      : "பதிவை மூடு"
                  }
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-zinc-600 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:right-5 sm:top-5"
                >
                  <X size={15} />
                </button>

                <div className="pr-12">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.07] text-violet-400">
                      <Zap size={16} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <StatusDot active />

                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-400">
                          {pageLanguage === "en"
                            ? "Quiz is live"
                            : "வினாடி வினா நேரலை"}
                        </p>
                      </div>

                      <h2
                        id="join-quiz-title"
                        className="mt-1 text-[22px] font-black tracking-[-0.035em] text-white sm:text-[26px]"
                      >
                        {pageLanguage === "en"
                          ? "Join the challenge"
                          : "சவாலில் சேருங்கள்"}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-3 max-w-lg text-[11px] leading-5 text-zinc-600 sm:text-[12px]">
                    {pageLanguage === "en"
                      ? "Choose your quiz language and chapter, then enter your details to continue."
                      : "உங்கள் வினாடி வினா மொழி மற்றும் அதிகாரத்தைத் தேர்ந்தெடுத்து, தொடர உங்கள் விவரங்களை உள்ளிடவும்."}
                  </p>
                </div>
              </div>

              {/* ==================================================
                  SCROLLABLE FORM AREA
              ================================================== */}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="p-5 sm:p-7">
                  {/* QUIZ OPTIONS */}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* QUIZ LANGUAGE */}

                    <FormField
                      label={
                        pageLanguage === "en"
                          ? "Quiz Language"
                          : "வினாடி வினா மொழி"
                      }
                      icon={Languages}
                      htmlFor="modal-language"
                    >
                      <div className="relative">
                        <select
                          id="modal-language"
                          value={language}
                          onChange={(e) =>
                            setLanguage(e.target.value)
                          }
                          className="h-[54px] w-full appearance-none rounded-2xl border border-white/[0.07] bg-[#141418] px-4 pr-11 text-[14px] font-bold text-zinc-200 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08]"
                        >
                          <option value="en">
                            English
                          </option>

                          <option value="ta">
                            தமிழ்
                          </option>
                        </select>

                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
                        />
                      </div>
                    </FormField>

                    {/* CHAPTER */}

                    <FormField
                      label={
                        pageLanguage === "en"
                          ? "Chapter"
                          : "அதிகாரம்"
                      }
                      icon={BookOpen}
                      htmlFor="modal-chapter"
                    >
                      <div className="relative">
                        <select
                          id="modal-chapter"
                          value={chapter}
                          onChange={(e) =>
                            setChapter(e.target.value)
                          }
                          disabled={chapters.length === 0}
                          className="h-[54px] w-full appearance-none rounded-2xl border border-white/[0.07] bg-[#141418] px-4 pr-11 text-[14px] font-bold text-zinc-200 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">
                            {pageLanguage === "en"
                              ? "Select a chapter"
                              : "அதிகாரத்தைத் தேர்ந்தெடுக்கவும்"}
                          </option>

                          {chapters.map((ch) => (
                            <option
                              key={ch}
                              value={ch}
                            >
                              {ch}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
                        />
                      </div>

                      {chapters.length === 0 && (
                        <p className="mt-2 text-[10px] leading-4 text-amber-500/70">
                          {pageLanguage === "en"
                            ? "No chapters are currently available."
                            : "தற்போது அதிகாரங்கள் எதுவும் கிடைக்கவில்லை."}
                        </p>
                      )}
                    </FormField>
                  </div>

                  {/* DIVIDER */}

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/[0.05]" />

                    <span className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-700">
                      {pageLanguage === "en"
                        ? "Your details"
                        : "உங்கள் விவரங்கள்"}
                    </span>

                    <div className="h-px flex-1 bg-white/[0.05]" />
                  </div>

                  {/* PARTICIPANT DETAILS */}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* NAME */}

                    <div className="sm:col-span-2">
                      <FormField
                        label={
                          pageLanguage === "en"
                            ? "Your name"
                            : "உங்கள் பெயர்"
                        }
                        icon={UserRound}
                        htmlFor="modal-name"
                      >
                        <input
                          id="modal-name"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(e) =>
                            setName(e.target.value)
                          }
                          placeholder={
                            pageLanguage === "en"
                              ? "Enter your full name"
                              : "உங்கள் பெயரை உள்ளிடவும்"
                          }
                          className="h-[54px] w-full rounded-2xl border border-white/[0.07] bg-[#141418] px-4 text-[14px] font-bold text-zinc-200 outline-none transition placeholder:font-medium placeholder:text-zinc-700 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08]"
                        />
                      </FormField>
                    </div>

                    {/* PHONE */}

                    <FormField
                      label={
                        pageLanguage === "en"
                          ? "Phone number"
                          : "தொலைபேசி எண்"
                      }
                      icon={Phone}
                      htmlFor="modal-phone"
                    >
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 border-r border-white/[0.07] pr-3 text-[13px] font-bold text-zinc-500">
                          +91
                        </span>

                        <input
                          id="modal-phone"
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
                                ""
                              )
                            )
                          }
                          className="h-[54px] w-full rounded-2xl border border-white/[0.07] bg-[#141418] py-3 pl-[72px] pr-4 text-[14px] font-bold text-zinc-200 outline-none transition placeholder:font-medium placeholder:text-zinc-700 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08]"
                        />
                      </div>
                    </FormField>

                    {/* PLACE */}

                    <FormField
                      label={
                        pageLanguage === "en"
                          ? "Place"
                          : "இடம்"
                      }
                      icon={MapPin}
                      htmlFor="modal-place"
                    >
                      <input
                        id="modal-place"
                        type="text"
                        autoComplete="address-level2"
                        value={place}
                        onChange={(e) =>
                          setPlace(e.target.value)
                        }
                        placeholder={
                          pageLanguage === "en"
                            ? "City or town"
                            : "உங்கள் ஊர்"
                        }
                        className="h-[54px] w-full rounded-2xl border border-white/[0.07] bg-[#141418] px-4 text-[14px] font-bold text-zinc-200 outline-none transition placeholder:font-medium placeholder:text-zinc-700 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08]"
                      />
                    </FormField>
                  </div>

                  {/* SELECTED QUIZ LANGUAGE */}

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-violet-500/[0.08] bg-violet-500/[0.025] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/10 bg-violet-500/[0.05] text-violet-400">
                        <Languages size={13} />
                      </div>

                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.13em] text-zinc-700">
                          {pageLanguage === "en"
                            ? "Selected quiz language"
                            : "தேர்ந்தெடுக்கப்பட்ட வினாடி வினா மொழி"}
                        </p>

                        <p className="mt-1 text-[11px] font-bold text-zinc-300">
                          {language === "en"
                            ? "English"
                            : "தமிழ்"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-lg border border-violet-500/10 bg-violet-500/[0.06] px-2.5 py-1.5 text-[9px] font-black text-violet-400">
                      {language === "en" ? "EN" : "தமிழ்"}
                    </span>
                  </div>

                  {/* PRIVACY */}

                  <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-white/[0.045] bg-white/[0.018] p-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/[0.05] text-emerald-500/60">
                      <ShieldCheck size={13} />
                    </div>

                    <p className="pt-0.5 text-[10px] leading-4 text-zinc-600">
                      {pageLanguage === "en"
                        ? "Your details are used only to identify your quiz attempt and score."
                        : "உங்கள் வினாடி வினா முயற்சி மற்றும் மதிப்பெண்ணை அடையாளம் காண உங்கள் விவரங்கள் பயன்படுத்தப்படும்."}
                    </p>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  STICKY MODAL FOOTER
              ================================================== */}

              <div className="shrink-0 border-t border-white/[0.055] bg-[#101014]/95 p-4 backdrop-blur-xl sm:px-7 sm:py-5">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={
                    starting ||
                    chapters.length === 0
                  }
                  className="group flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-[13px] font-black text-white shadow-[0_14px_40px_-14px_rgba(124,58,237,0.7)] transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-none disabled:bg-[#18181D] disabled:text-zinc-600 disabled:shadow-none"
                >
                  {starting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      {language === "en"
                        ? "Checking attempt..."
                        : "முயற்சியை சரிபார்க்கிறது..."}
                    </>
                  ) : (
                    <>
                      <Zap size={15} />

                      {pageLanguage === "en"
                        ? "Continue to Quiz"
                        : "வினாடி வினாவிற்கு தொடரவும்"}

                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <p className="mt-2.5 text-center text-[9px] font-medium text-zinc-700">
                  {pageLanguage === "en"
                    ? "We'll check whether this chapter was already attempted."
                    : "இந்த அதிகாரம் ஏற்கனவே முயற்சிக்கப்பட்டதா என்பதை சரிபார்ப்போம்."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================================
   STATUS DOT
========================================================== */

function StatusDot({ active }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${active
          ? "bg-emerald-400"
          : "bg-amber-400"
          }`}
      />

      <span
        className={`relative inline-flex h-1.5 w-1.5 rounded-full ${active
          ? "bg-emerald-400"
          : "bg-amber-400"
          }`}
      />
    </span>
  );
}

/* ==========================================================
   TRUST ITEM
========================================================== */

function TrustItem({ children }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500/10 bg-emerald-500/[0.05] text-emerald-500">
        <Check size={9} />
      </span>

      {children}
    </span>
  );
}

/* ==========================================================
   CHALLENGE STAT
========================================================== */

function ChallengeStat({
  icon: Icon,
  label,
  value,
  border = false,
}) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center px-3 py-4 text-center ${border
        ? "border-l border-white/[0.055]"
        : ""
        }`}
    >
      <Icon
        size={13}
        className="text-violet-400/70"
      />

      <p className="mt-2 text-[16px] font-black tracking-[-0.03em] text-zinc-200">
        {value}
      </p>

      <p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.11em] text-zinc-700">
        {label}
      </p>
    </div>
  );
}

/* ==========================================================
   STEP CARD
========================================================== */

function StepCard({
  number,
  icon: Icon,
  title,
  description,
}) {
  return (
    <motion.article
      whileHover={{
        y: -2,
      }}
      transition={{
        duration: 0.2,
      }}
      className="group relative overflow-hidden rounded-[20px] border border-white/[0.055] bg-[#111114] p-5"
    >
      <span className="absolute right-4 top-3 text-[30px] font-black tracking-[-0.06em] text-white/[0.025]">
        {number}
      </span>

      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/[0.06] text-violet-400">
          <Icon size={16} />
        </div>

        <span className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-700">
          {number}
        </span>
      </div>

      <h3 className="mt-4 text-[14px] font-black text-zinc-200">
        {title}
      </h3>

      <p className="mt-2 text-[11px] leading-5 text-zinc-600">
        {description}
      </p>
    </motion.article>
  );
}

/* ==========================================================
   FORM FIELD
========================================================== */

function FormField({
  label,
  icon: Icon,
  children,
  htmlFor,
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 flex items-center gap-2 text-[11px] font-bold text-zinc-500"
      >
        <Icon
          size={12}
          className="text-zinc-600"
        />

        {label}
      </label>

      {children}
    </div>
  );
}