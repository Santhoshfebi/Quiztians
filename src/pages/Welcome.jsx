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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [language, setLanguage] = useState("en");
  const [chapter, setChapter] = useState("");
  const [chapters, setChapters] = useState([]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizAvailable, setIsQuizAvailable] =
    useState(false);

  const [config, setConfig] = useState(null);
  const [starting, setStarting] = useState(false);

  const [showJoinForm, setShowJoinForm] =
    useState(false);

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
        console.error(
          "Error fetching quiz config:",
          error.message
        );
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
          setChapters(
            updatedConfig.active_chapters || []
          );
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
      const startTime = new Date(
        config.start_time
      );

      const diff = startTime - now;

      setIsQuizAvailable(diff <= 0);
      setTimeLeft(diff > 0 ? diff : 0);
    };

    updateTimer();

    const interval = setInterval(
      updateTimer,
      1000
    );

    return () => clearInterval(interval);
  }, [config]);

  /* ========================================================
     CLOSE FORM IF QUIZ BECOMES UNAVAILABLE
  ======================================================== */

  useEffect(() => {
    if (!isQuizAvailable) {
      setShowJoinForm(false);
    }
  }, [isQuizAvailable]);

  /* ========================================================
     SCROLL TO FORM
  ======================================================== */

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

  /* ========================================================
     COUNTDOWN DATA
  ======================================================== */

  const formattedTime = useMemo(() => {
    return {
      days: Math.max(
        0,
        Math.floor(
          timeLeft /
            (1000 * 60 * 60 * 24)
        )
      ),

      hours: Math.max(
        0,
        Math.floor(
          (timeLeft /
            (1000 * 60 * 60)) %
            24
        )
      ),

      minutes: Math.max(
        0,
        Math.floor(
          (timeLeft / (1000 * 60)) % 60
        )
      ),

      seconds: Math.max(
        0,
        Math.floor(
          (timeLeft / 1000) % 60
        )
      ),
    };
  }, [timeLeft]);

  const countdown = [
    {
      label:
        language === "en"
          ? "Day"
          : "நாள்",
      value: formattedTime.days,
    },
    {
      label:
        language === "en"
          ? "Hrs"
          : "மணி",
      value: formattedTime.hours,
    },
    {
      label:
        language === "en"
          ? "Min"
          : "நிமி",
      value: formattedTime.minutes,
    },
    {
      label:
        language === "en"
          ? "Sec"
          : "வினா",
      value: formattedTime.seconds,
    },
  ];

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
      const {
        data: existingAttempt,
        error,
      } = await supabase
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
            attemptedAt:
              existingAttempt.created_at,
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
      console.error(
        "Error checking attempt:",
        err.message
      );

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
          BACKGROUND
      ==================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 top-10 h-[420px] w-[420px] rounded-full bg-violet-700/[0.10] blur-[150px]" />

        <div className="absolute -right-52 top-[430px] h-[480px] w-[480px] rounded-full bg-indigo-600/[0.08] blur-[160px]" />

        <div className="absolute bottom-[-240px] left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/[0.045] blur-[160px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* ====================================================
          NAVBAR
      ==================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.055] bg-[#09090B]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* BRAND */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-0 items-center gap-2.5"
            aria-label="QUIZTIANS Home"
          >
            <img
              src="/branding/quiztians-q.png"
              alt=""
              className="h-9 w-9 shrink-0 object-contain"
            />

            <div className="min-w-0 text-left">
              <img
                src="/branding/quiztians-wordmark.png"
                alt="QUIZTIANS"
                className="h-[34px] w-auto max-w-[190px] object-contain object-left sm:h-[38px] sm:max-w-[240px]"
              />

              <div className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600 sm:block">
                Learn • Play • Compete
              </div>
            </div>
          </button>

          {/* RIGHT */}

          <div className="flex items-center gap-2">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] sm:flex ${
                isQuizAvailable
                  ? "border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-400"
                  : "border-amber-500/15 bg-amber-500/[0.06] text-amber-400"
              }`}
            >
              <StatusDot
                active={isQuizAvailable}
              />

              {isQuizAvailable
                ? language === "en"
                  ? "Quiz Live"
                  : "வினாடி வினா நேரலை"
                : language === "en"
                  ? "Waiting"
                  : "காத்திருப்பு"}
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin-login")
              }
              className="group flex min-h-10 items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[11px] font-bold text-zinc-500 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-200 sm:px-4 sm:text-xs"
            >
              {language === "en"
                ? "Admin"
                : "அட்மின்"}

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
            HERO
        ================================================== */}

        <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 xl:gap-24">
            {/* ==============================================
                LEFT HERO
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
                duration: 0.5,
              }}
            >
              {/* EYEBROW */}

              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/15 bg-violet-500/[0.07] text-violet-400">
                  <Sparkles size={13} />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-400 sm:text-[11px]">
                  {language === "en"
                    ? "Bible Quiz Challenge"
                    : "வினாடி வினா சவால்"}
                </span>
              </div>

              {/* TITLE */}

              <h1 className="mt-5 max-w-[720px] text-[40px] font-black leading-[1.03] tracking-[-0.052em] text-white sm:text-[54px] lg:text-[64px] xl:text-[72px]">
                {language === "en" ? (
                  <>
                    Put your knowledge
                    <br />

                    <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                      to the test.
                    </span>
                  </>
                ) : (
                  <>
                    உங்கள் அறிவை
                    <br />

                    <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                      சோதித்துப் பாருங்கள்.
                    </span>
                  </>
                )}
              </h1>

              {/* DESCRIPTION */}

              <p className="mt-5 max-w-xl text-[14px] leading-7 text-zinc-500 sm:text-[15px]">
                {language === "en"
                  ? "Learn scripture, challenge yourself and compete with others. Choose your chapter and discover how far your knowledge can take you."
                  : "வேதாகமத்தை கற்றுக்கொள்ளுங்கள், உங்கள் அறிவை சோதியுங்கள், மற்றவர்களுடன் போட்டியிடுங்கள். உங்கள் அதிகாரத்தைத் தேர்ந்தெடுத்து சவாலை தொடங்குங்கள்."}
              </p>

              {/* HERO ACTIONS */}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {isQuizAvailable ? (
                  <button
                    type="button"
                    onClick={() =>
                      setShowJoinForm(true)
                    }
                    className="group flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-6 text-[13px] font-black text-white shadow-[0_16px_45px_-16px_rgba(124,58,237,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-16px_rgba(124,58,237,0.9)] active:translate-y-0"
                  >
                    <Zap size={16} />

                    {language === "en"
                      ? "Join the Challenge"
                      : "சவாலில் சேருங்கள்"}

                    <ArrowRight
                      size={15}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                ) : (
                  <div className="flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 text-[12px] font-bold text-zinc-500 sm:justify-start">
                    <Clock3 size={15} />

                    {language === "en"
                      ? "The next challenge hasn't started yet"
                      : "அடுத்த சவால் இன்னும் தொடங்கவில்லை"}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    navigate("/scores")
                  }
                  className="group flex min-h-[54px] items-center justify-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 text-[12px] font-bold text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.045] hover:text-zinc-200"
                >
                  <Trophy
                    size={15}
                    className="text-amber-400/70"
                  />

                  {language === "en"
                    ? "Leaderboard"
                    : "தரவரிசை"}

                  <span className="rounded-full border border-white/[0.06] bg-white/[0.035] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-zinc-600">
                    {language === "en"
                      ? "Soon"
                      : "விரைவில்"}
                  </span>
                </button>
              </div>

              {/* MICRO TRUST */}

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                <HeroTrustItem>
                  {language === "en"
                    ? "Quick registration"
                    : "விரைவான பதிவு"}
                </HeroTrustItem>

                <HeroTrustItem>
                  {language === "en"
                    ? "Instant results"
                    : "உடனடி முடிவுகள்"}
                </HeroTrustItem>

                <HeroTrustItem>
                  {language === "en"
                    ? "English & Tamil"
                    : "ஆங்கிலம் & தமிழ்"}
                </HeroTrustItem>
              </div>
            </motion.div>

            {/* ==============================================
                QUIZ STATUS PANEL
            ============================================== */}

            <motion.div
              initial={{
                opacity: 0,
                y: 22,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                delay: 0.08,
                duration: 0.55,
              }}
              className="relative"
            >
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[100px]" />

              <div className="relative overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#111114] shadow-2xl shadow-black/25">
                {/* TOP ACCENT */}

                <div
                  className={`absolute left-0 right-0 top-0 h-px ${
                    isQuizAvailable
                      ? "bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
                      : "bg-gradient-to-r from-transparent via-violet-400/60 to-transparent"
                  }`}
                />

                {/* PANEL HEADER */}

                <div className="flex items-center justify-between gap-4 border-b border-white/[0.055] px-5 py-5 sm:px-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                      {language === "en"
                        ? "Quiz Status"
                        : "வினாடி வினா நிலை"}
                    </p>

                    <p className="mt-1.5 text-[14px] font-black text-zinc-200">
                      {isQuizAvailable
                        ? language === "en"
                          ? "The challenge is open"
                          : "வினாடி வினா தொடங்கியுள்ளது"
                        : language === "en"
                          ? "Next challenge begins in"
                          : "அடுத்த வினாடி வினா தொடங்க"}
                    </p>
                  </div>

                  <div
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${
                      isQuizAvailable
                        ? "border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-400"
                        : "border-amber-500/15 bg-amber-500/[0.07] text-amber-400"
                    }`}
                  >
                    <StatusDot
                      active={
                        isQuizAvailable
                      }
                    />

                    {isQuizAvailable
                      ? language === "en"
                        ? "Live"
                        : "நேரலை"
                      : language === "en"
                        ? "Waiting"
                        : "காத்திருப்பு"}
                  </div>
                </div>

                {/* STATUS BODY */}

                {!isQuizAvailable &&
                timeLeft > 0 ? (
                  <>
                    <div className="px-4 py-6 sm:px-6 sm:py-8">
                      <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-white/[0.055] bg-[#0D0D10]">
                        {countdown.map(
                          (item, index) => (
                            <div
                              key={
                                item.label
                              }
                              className={`min-w-0 py-5 text-center ${
                                index !==
                                countdown.length -
                                  1
                                  ? "border-r border-white/[0.055]"
                                  : ""
                              }`}
                            >
                              <p className="text-[27px] font-black tabular-nums tracking-[-0.045em] text-white sm:text-[32px]">
                                {String(
                                  item.value
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </p>

                              <p className="mt-1.5 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-600 sm:text-[9px]">
                                {item.label}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-violet-500/10 bg-violet-500/[0.04] p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/[0.06] text-violet-400">
                          <Clock3 size={15} />
                        </div>

                        <div>
                          <p className="text-[12px] font-black text-zinc-300">
                            {language === "en"
                              ? "Get ready"
                              : "தயாராகுங்கள்"}
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                            {language === "en"
                              ? "Registration will open automatically when the countdown reaches zero."
                              : "கவுண்ட்டவுன் முடிந்ததும் பதிவு தானாக திறக்கும்."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="px-5 py-7 sm:px-6 sm:py-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.08] text-emerald-400">
                      <Check size={22} />
                    </div>

                    <h2 className="mt-5 text-[22px] font-black tracking-[-0.03em] text-white">
                      {language === "en"
                        ? "You're good to go."
                        : "நீங்கள் தொடங்கலாம்."}
                    </h2>

                    <p className="mt-2 max-w-md text-[12px] leading-6 text-zinc-500">
                      {language === "en"
                        ? "The quiz is live. Enter your details and start the challenge whenever you're ready."
                        : "வினாடி வினா தொடங்கியுள்ளது. உங்கள் விவரங்களை உள்ளிட்டு சவாலை தொடங்குங்கள்."}
                    </p>

                    {!showJoinForm && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowJoinForm(
                            true
                          )
                        }
                        className="group mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-[13px] font-black text-white shadow-[0_12px_36px_-14px_rgba(124,58,237,0.75)] transition hover:from-violet-500 hover:to-indigo-500"
                      >
                        <Zap size={15} />

                        {language === "en"
                          ? "Join Quiz"
                          : "வினாடி வினாவில் சேர"}

                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </button>
                    )}

                    {showJoinForm && (
                      <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3 text-[11px] font-bold text-emerald-400/80">
                        <Check size={13} />

                        {language === "en"
                          ? "Registration form opened below"
                          : "பதிவு படிவம் கீழே திறக்கப்பட்டுள்ளது"}
                      </div>
                    )}
                  </div>
                )}

                {/* PANEL FOOTER */}

                <div className="grid grid-cols-2 border-t border-white/[0.055] bg-white/[0.012]">
                  <StatusMeta
                    icon={BookOpen}
                    label={
                      language === "en"
                        ? "Chapters Available"
                        : "அதிகாரங்கள்"
                    }
                    value={
                      chapters.length > 0
                        ? chapters.length
                        : "—"
                    }
                  />

                  <StatusMeta
                    icon={Clock3}
                    label={
                      language === "en"
                        ? "Duration"
                        : "நேரம்"
                    }
                    value={
                      config?.duration
                        ? `${config.duration} min`
                        : "—"
                    }
                    border
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================================================
            HOW IT WORKS
        ================================================== */}

        <section className="border-y border-white/[0.05] bg-white/[0.012]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-400">
                  {language === "en"
                    ? "Simple & Quick"
                    : "எளிமையானது"}
                </p>

                <h2 className="mt-2 text-[20px] font-black tracking-[-0.025em] text-zinc-100 sm:text-[24px]">
                  {language === "en"
                    ? "How it works"
                    : "எப்படி செயல்படுகிறது"}
                </h2>
              </div>

              <p className="hidden max-w-sm text-right text-[11px] leading-5 text-zinc-600 sm:block">
                {language === "en"
                  ? "Three simple steps between you and the challenge."
                  : "சவாலை தொடங்க மூன்று எளிய படிகள்."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HowItWorksCard
                number="01"
                icon={BookOpen}
                title={
                  language === "en"
                    ? "Choose"
                    : "தேர்வு"
                }
                description={
                  language === "en"
                    ? "Select your language and an available quiz chapter."
                    : "உங்கள் மொழியையும் கிடைக்கும் அதிகாரத்தையும் தேர்ந்தெடுக்கவும்."
                }
              />

              <HowItWorksCard
                number="02"
                icon={Gamepad2}
                title={
                  language === "en"
                    ? "Play"
                    : "விளையாடு"
                }
                description={
                  language === "en"
                    ? "Answer the questions and challenge what you know."
                    : "கேள்விகளுக்கு பதிலளித்து உங்கள் அறிவை சோதியுங்கள்."
                }
              />

              <HowItWorksCard
                number="03"
                icon={Medal}
                title={
                  language === "en"
                    ? "Score"
                    : "மதிப்பெண்"
                }
                description={
                  language === "en"
                    ? "Finish the challenge and see your result instantly."
                    : "சவாலை முடித்து உங்கள் முடிவை உடனடியாக பாருங்கள்."
                }
              />
            </div>
          </div>
        </section>

        {/* ==================================================
            REGISTRATION
        ================================================== */}

        <AnimatePresence>
          {isQuizAvailable &&
            showJoinForm && (
              <motion.section
                id="join-quiz-form"
                initial={{
                  opacity: 0,
                  y: 28,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 16,
                }}
                transition={{
                  duration: 0.4,
                  ease: [
                    0.22, 1, 0.36, 1,
                  ],
                }}
                className="scroll-mt-24"
              >
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
                  <div className="mx-auto max-w-[680px]">
                    {/* FORM HEADER */}

                    <div className="mb-6 text-center sm:mb-8">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.07] text-violet-400">
                        <Zap size={17} />
                      </div>

                      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-violet-400">
                        {language === "en"
                          ? "Join the quiz"
                          : "வினாடி வினாவில் சேருங்கள்"}
                      </p>

                      <h2 className="mt-2 text-[26px] font-black tracking-[-0.035em] text-white sm:text-[32px]">
                        {language === "en"
                          ? "Enter your details"
                          : "உங்கள் விவரங்களை உள்ளிடவும்"}
                      </h2>

                      <p className="mx-auto mt-2 max-w-md text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
                        {language === "en"
                          ? "Choose your chapter and tell us who you are to continue to the challenge."
                          : "உங்கள் அதிகாரத்தைத் தேர்ந்தெடுத்து தொடர உங்கள் விவரங்களை உள்ளிடவும்."}
                      </p>
                    </div>

                    {/* FORM CARD */}

                    <div className="relative overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#111114] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-8">
                      <div className="absolute left-1/2 top-0 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

                      <div className="grid gap-5 sm:grid-cols-2">
                        {/* LANGUAGE */}

                        <FormField
                          label={
                            language === "en"
                              ? "Language"
                              : "மொழி"
                          }
                          icon={Languages}
                        >
                          <div className="relative">
                            <select
                              id="language"
                              value={
                                language
                              }
                              onChange={(e) =>
                                setLanguage(
                                  e.target
                                    .value
                                )
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
                            language === "en"
                              ? "Chapter"
                              : "அதிகாரம்"
                          }
                          icon={BookOpen}
                        >
                          <div className="relative">
                            <select
                              id="chapter"
                              value={chapter}
                              onChange={(e) =>
                                setChapter(
                                  e.target
                                    .value
                                )
                              }
                              disabled={
                                chapters.length ===
                                0
                              }
                              className="h-[54px] w-full appearance-none rounded-2xl border border-white/[0.07] bg-[#141418] px-4 pr-11 text-[14px] font-bold text-zinc-200 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">
                                {language ===
                                "en"
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
                                )
                              )}
                            </select>

                            <ChevronDown
                              size={14}
                              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
                            />
                          </div>

                          {chapters.length ===
                            0 && (
                            <p className="mt-2 text-[10px] leading-4 text-amber-500/70">
                              {language ===
                              "en"
                                ? "No chapters are currently available."
                                : "தற்போது அதிகாரங்கள் எதுவும் கிடைக்கவில்லை."}
                            </p>
                          )}
                        </FormField>

                        {/* NAME */}

                        <FormField
                          label={
                            language === "en"
                              ? "Your name"
                              : "உங்கள் பெயர்"
                          }
                          icon={UserRound}
                        >
                          <input
                            id="name"
                            type="text"
                            autoComplete="name"
                            placeholder={
                              language ===
                              "en"
                                ? "Enter your full name"
                                : "உங்கள் பெயரை உள்ளிடவும்"
                            }
                            value={name}
                            onChange={(e) =>
                              setName(
                                e.target.value
                              )
                            }
                            className="h-[54px] w-full rounded-2xl border border-white/[0.07] bg-[#141418] px-4 text-[14px] font-bold text-zinc-200 outline-none transition placeholder:font-medium placeholder:text-zinc-700 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08]"
                          />
                        </FormField>

                        {/* PHONE */}

                        <FormField
                          label={
                            language === "en"
                              ? "Phone number"
                              : "தொலைபேசி எண்"
                          }
                          icon={Phone}
                        >
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 border-r border-white/[0.07] pr-3 text-[13px] font-bold text-zinc-500">
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
                                    ""
                                  )
                                )
                              }
                              className="h-[54px] w-full rounded-2xl border border-white/[0.07] bg-[#141418] py-3 pl-[72px] pr-4 text-[14px] font-bold text-zinc-200 outline-none transition placeholder:font-medium placeholder:text-zinc-700 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08]"
                            />
                          </div>
                        </FormField>

                        {/* PLACE */}

                        <div className="sm:col-span-2">
                          <FormField
                            label={
                              language === "en"
                                ? "Place"
                                : "இடம்"
                            }
                            icon={MapPin}
                          >
                            <input
                              id="place"
                              type="text"
                              autoComplete="address-level2"
                              placeholder={
                                language ===
                                "en"
                                  ? "Enter your city or town"
                                  : "உங்கள் ஊரை உள்ளிடவும்"
                              }
                              value={place}
                              onChange={(e) =>
                                setPlace(
                                  e.target
                                    .value
                                )
                              }
                              className="h-[54px] w-full rounded-2xl border border-white/[0.07] bg-[#141418] px-4 text-[14px] font-bold text-zinc-200 outline-none transition placeholder:font-medium placeholder:text-zinc-700 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/[0.08]"
                            />
                          </FormField>
                        </div>
                      </div>

                      {/* START */}

                      <button
                        type="button"
                        onClick={handleStart}
                        disabled={
                          starting ||
                          chapters.length === 0
                        }
                        className="group mt-6 flex min-h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-[13px] font-black text-white shadow-[0_14px_40px_-14px_rgba(124,58,237,0.7)] transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-none disabled:bg-[#18181D] disabled:text-zinc-600 disabled:shadow-none"
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
                            <Zap size={15} />

                            {language === "en"
                              ? "Continue to Quiz"
                              : "வினாடி வினாவிற்கு தொடரவும்"}

                            <ArrowRight
                              size={15}
                              className="transition-transform group-hover:translate-x-1"
                            />
                          </>
                        )}
                      </button>

                      {/* PRIVACY */}

                      <div className="mt-4 flex items-start justify-center gap-2 px-2">
                        <ShieldCheck
                          size={12}
                          className="mt-0.5 shrink-0 text-zinc-700"
                        />

                        <p className="max-w-md text-center text-[10px] leading-4 text-zinc-700">
                          {language === "en"
                            ? "Your details are used only to identify your quiz attempt and score."
                            : "உங்கள் வினாடி வினா முயற்சி மற்றும் மதிப்பெண்ணை அடையாளம் காண உங்கள் விவரங்கள் பயன்படுத்தப்படும்."}
                        </p>
                      </div>

                      {/* CLOSE */}

                      <button
                        type="button"
                        onClick={() =>
                          setShowJoinForm(
                            false
                          )
                        }
                        className="mx-auto mt-5 flex items-center gap-1.5 text-[10px] font-bold text-zinc-700 transition hover:text-zinc-400"
                      >
                        <X size={12} />

                        {language === "en"
                          ? "Close registration"
                          : "பதிவை மூடு"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
        </AnimatePresence>
      </main>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <footer className="relative z-10 border-t border-white/[0.05] bg-[#09090B]/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-7 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div className="flex items-center gap-2">
            <img
              src="/branding/quiztians-q.png"
              alt=""
              className="h-6 w-6 object-contain opacity-60"
            />

            <span className="text-[10px] font-bold text-zinc-700">
              © {new Date().getFullYear()}{" "}
              QUIZTIANS
            </span>
          </div>

          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-700">
            {language === "en"
              ? "Learn • Play • Compete"
              : "கற்றுக்கொள் • விளையாடு • போட்டியிடு"}
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ==========================================================
   STATUS DOT
========================================================== */

function StatusDot({ active }) {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${
          active
            ? "bg-emerald-400"
            : "bg-amber-400"
        }`}
      />

      <span
        className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-emerald-400"
            : "bg-amber-400"
        }`}
      />
    </span>
  );
}

/* ==========================================================
   HERO TRUST ITEM
========================================================== */

function HeroTrustItem({ children }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 sm:text-[11px]">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500/10 bg-emerald-500/[0.05] text-emerald-500">
        <Check size={9} />
      </span>

      {children}
    </span>
  );
}

/* ==========================================================
   STATUS META
========================================================== */

function StatusMeta({
  icon: Icon,
  label,
  value,
  border = false,
}) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${
        border
          ? "border-l border-white/[0.055]"
          : ""
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.025] text-zinc-500">
        <Icon size={13} />
      </div>

      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-700">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[11px] font-black text-zinc-400">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ==========================================================
   HOW IT WORKS CARD
========================================================== */

function HowItWorksCard({
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
      <div className="absolute right-4 top-3 text-[32px] font-black tracking-[-0.06em] text-white/[0.025]">
        {number}
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/[0.06] text-violet-400 transition group-hover:border-violet-500/20 group-hover:bg-violet-500/[0.09]">
        <Icon size={16} />
      </div>

      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-violet-400/70">
        Step {number}
      </p>

      <h3 className="mt-1.5 text-[14px] font-black text-zinc-200">
        {title}
      </h3>

      <p className="mt-2 max-w-xs text-[11px] leading-5 text-zinc-600">
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
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-[11px] font-bold text-zinc-500">
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