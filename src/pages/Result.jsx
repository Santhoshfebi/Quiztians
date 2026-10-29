import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    name,
    phone,
    place,
    score,
    total,
    chapter,
    time_taken,
    profile_claim_code,
  } = state || {};

  // =========================================================
  // STATE
  // =========================================================

  const [topPlayers, setTopPlayers] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showConfetti, setShowConfetti] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const [showChampionBadge, setShowChampionBadge] = useState(false);
  const [perfectScore, setPerfectScore] = useState(false);
  const [displayRank, setDisplayRank] = useState(0);

  const animRef = useRef(null);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}m ${s < 10 ? "0" + s : s}s`;
  };

  // =========================================================
  // FETCH LEADERBOARD
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard = async () => {
      if (!chapter) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      try {
        const { data, error } = await supabase
          .from("results")
          .select(
            "id, name, place, phone, score, time_taken, created_at"
          )
          .eq("chapter", chapter)
          .order("score", { ascending: false })
          .order("time_taken", { ascending: true })
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (!mounted) return;

        const index = data.findIndex(
          (p) =>
            (phone && p.phone && p.phone === phone) ||
            (p.name === name &&
              p.place === place &&
              Number(p.score) === Number(score))
        );

        const playerRank = index >= 0 ? index + 1 : null;

        setRank(playerRank);

        setShowTrophy(playerRank && playerRank <= 5);
        setShowChampionBadge(playerRank && playerRank <= 5);

        setPerfectScore(
          Number(score) === Number(total)
        );

        setShowConfetti(true);

        setTimeout(() => {
          setShowConfetti(false);
        }, 8000);

        setTopPlayers(data.slice(0, 5));
      } catch (err) {
        console.error(
          "Error fetching leaderboard:",
          err
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchLeaderboard();

    return () => {
      mounted = false;

      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [
    name,
    phone,
    place,
    score,
    total,
    time_taken,
    chapter,
  ]);

  // =========================================================
  // ANIMATE RANK
  // =========================================================

  useEffect(() => {
    if (!rank || rank <= 0) {
      setDisplayRank(0);
      return;
    }

    let start = null;

    const duration = Math.max(
      500,
      Math.min(1200, rank * 80)
    );

    const step = (timestamp) => {
      if (!start) start = timestamp;

      const progress = Math.min(
        (timestamp - start) / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      const current = Math.floor(
        eased * rank
      );

      setDisplayRank(current);

      if (progress < 1) {
        animRef.current =
          requestAnimationFrame(step);
      } else {
        setDisplayRank(rank);
      }
    };

    animRef.current =
      requestAnimationFrame(step);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(
          animRef.current
        );
      }
    };
  }, [rank]);

  // =========================================================
  // SHARE RESULT
  // =========================================================

  const handleShare = () => {
    let message = `🎉 Quiz Result 🎉

Name: ${name}
Place: ${place}
Chapter: ${chapter}
Score: ${score} / ${total}
Rank: ${rank ? `#${rank}` : "Unranked"}
⏱ Time Taken: ${formatTime(time_taken)}
`;

    if (score === 0 && total === 0) {
      message +=
        "Try to follow the rules next time :)";
    } else {
      const isTop5 =
        rank && rank <= 5;

      message += isTop5
        ? "🏆 Congratulations! You are among the top 5! For now"
        : "Keep trying to reach the top!";
    }

    if (navigator.share) {
      navigator
        .share({
          title: "My Quiz Result",
          text: message,
        })
        .catch(() => { });
    } else {
      navigator.clipboard
        .writeText(message)
        .then(() => {
          toast.success(
            "Result copied to clipboard! 🎉",
            {
              position: "top-center",
              autoClose: 2000,
            }
          );
        })
        .catch(() => {
          toast.error(
            "Sharing not supported 😅",
            {
              position: "top-center",
              autoClose: 2000,
            }
          );
        });
    }
  };

  // =========================================================
  // COPY PROFILE CLAIM CODE
  // =========================================================

  const handleCopyClaimCode = async () => {
    if (!profile_claim_code) return;

    try {
      await navigator.clipboard.writeText(profile_claim_code);

      toast.success(
        "Profile Claim Code copied!",
        {
          position: "top-center",
          autoClose: 2000,
        }
      );
    } catch (error) {
      console.error(
        "Unable to copy Profile Claim Code:",
        error
      );

      toast.error(
        "Unable to copy the claim code.",
        {
          position: "top-center",
          autoClose: 2000,
        }
      );
    }
  };

  // =========================================================
  // ORIGINAL TROPHY GLOW LOGIC
  // =========================================================

  const getGlowClass = () => {
    if (rank === 1) {
      return "shadow-[0px_40px_80px_rgba(250,204,21,0.12)]";
    }

    if (rank === 2) {
      return "shadow-[0px_10px_40px_rgba(255,210,76,1)]";
    }

    if (rank === 3) {
      return "shadow-[0px_10px_40px_rgba(111,101,68,1)]";
    }

    if (rank > 3 && rank <= 5) {
      return "shadow-[5px_16px_36px_rgba(59,130,246,6)]";
    }

    return "shadow-sm";
  };

  // =========================================================
  // LEADERBOARD ANIMATIONS
  // =========================================================

  const listVariant = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariant = {
    hidden: {
      opacity: 0,
      x: -24,
      scale: 0.98,
    },

    show: {
      opacity: 1,
      x: 0,
      scale: 1,

      transition: {
        type: "spring",
        stiffness: 120,
        damping: 16,
      },
    },
  };

  // =========================================================
  // DERIVED VALUES
  // =========================================================

  const scorePercentage =
    Number(total) > 0
      ? Math.round(
        (Number(score) /
          Number(total)) *
        100
      )
      : 0;

  const isRuleFailure =
    Number(score) === 0 &&
    Number(total) === 0;

  const isTopFive =
    rank && rank <= 5;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return <ResultLoading />;
  }

  // =========================================================
  // RESULT UI
  // =========================================================

  return (
    <>
      <ToastContainer />

      {/* =====================================================
          CONFETTI
          Original behavior preserved
      ===================================================== */}

      {showConfetti &&
        !(score === 0 && total === 0) && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={220}
            gravity={0.28}
          />
        )}

      <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
        {/* ===================================================
            BACKGROUND
        =================================================== */}

        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-700/[0.08] blur-[140px]" />

          <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-indigo-700/[0.08] blur-[140px]" />

          {isTopFive &&
            !isRuleFailure && (
              <div className="absolute left-1/2 top-32 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/[0.035] blur-[120px]" />
            )}

          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",

              backgroundSize:
                "44px 44px",
            }}
          />
        </div>

        {/* ===================================================
            NAVBAR
        =================================================== */}

        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090B]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-6">
            {/* BRAND */}

            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
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

            {/* STATUS */}

            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${isRuleFailure
                ? "border-red-500/15 bg-red-500/[0.06]"
                : "border-emerald-500/15 bg-emerald-500/[0.06]"
                }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isRuleFailure
                  ? "bg-red-400"
                  : "bg-emerald-400"
                  }`}
              />

              <span
                className={`text-[9px] font-black uppercase tracking-[0.14em] ${isRuleFailure
                  ? "text-red-400"
                  : "text-emerald-400"
                  }`}
              >
                {isRuleFailure
                  ? "Attempt Ended"
                  : "Completed"}
              </span>
            </div>
          </div>
        </header>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="relative z-10 mx-auto max-w-6xl px-5 pb-12 pt-7 sm:px-6 sm:pt-10">
          {/* =================================================
              PAGE HEADING
          ================================================= */}

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
              duration: 0.4,
            }}
            className="mb-6 lg:mb-8"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`h-px w-6 ${isRuleFailure
                  ? "bg-red-500"
                  : "bg-violet-500"
                  }`}
              />

              <p
                className={`text-[9px] font-black uppercase tracking-[0.22em] ${isRuleFailure
                  ? "text-red-400"
                  : "text-violet-400"
                  }`}
              >
                Quiz Result
              </p>
            </div>

            <h1 className="text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
              {isRuleFailure
                ? "Attempt ended."
                : "Quiz completed!"}
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-600 sm:text-sm">
              {isRuleFailure
                ? "Your attempt was automatically submitted due to repeated rule violations."
                : "Thanks for participating — may knowledge bless your journey."}
            </p>
          </motion.div>

          {/* =================================================
              GRID
          ================================================= */}

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)] lg:gap-6">
            {/* ===============================================
                LEFT / MAIN RESULT
            =============================================== */}

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
                duration: 0.45,
              }}
              className={`relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111114] ${getGlowClass()}`}
            >
              {/* CARD GLOW */}

              <div className="pointer-events-none absolute inset-0">
                <div
                  className={`absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full blur-[100px] ${isRuleFailure
                    ? "bg-red-500/[0.04]"
                    : isTopFive
                      ? "bg-amber-400/[0.055]"
                      : "bg-violet-600/[0.06]"
                    }`}
                />
              </div>

              <div className="relative p-5 sm:p-7 lg:p-8">
                {/* ===========================================
                    TROPHY ANIMATION

                    Intentionally preserved from original
                =========================================== */}

                <AnimatePresence>
                  {score === 0 &&
                    total === 0 ? (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -20,
                      }}
                      className="relative mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-3xl border border-white/30 bg-white/40 shadow-2xl backdrop-blur-md sm:h-52 sm:w-52 md:h-56 md:w-56"
                    >
                      <div className="absolute -z-10 h-64 w-64 rounded-3xl bg-gradient-to-tr from-gray-300 via-gray-400 to-gray-500 opacity-20 blur-3xl sm:h-72 sm:w-72" />

                      <DotLottieReact
                        src="/lottie/Lowscore.json"
                        autoplay
                        loop={false}
                        style={{
                          width: "70%",
                          height: "70%",
                          maxWidth: 200,
                          maxHeight: 200,
                        }}
                      />
                    </motion.div>
                  ) : (
                    (perfectScore ||
                      showTrophy) && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -20,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          y: -20,
                        }}
                        className="relative mx-auto mb-6 flex h-40 w-40 items-center justify-center rounded-3xl border border-white/30 bg-white/40 shadow-2xl backdrop-blur-md sm:h-52 sm:w-52 md:h-56 md:w-56"
                      >
                        <div className="absolute -z-10 h-64 w-64 rounded-3xl bg-gradient-to-tr from-indigo-300 via-purple-300 to-pink-300 opacity-30 blur-3xl sm:h-72 sm:w-72" />

                        <DotLottieReact
                          src={
                            perfectScore
                              ? "/lottie/Trophy.json"
                              : "/lottie/TrophyBadge.json"
                          }
                          autoplay
                          loop={false}
                          style={{
                            width: "70%",
                            height: "70%",
                            maxWidth: 200,
                            maxHeight: 200,
                          }}
                        />
                      </motion.div>
                    )
                  )}
                </AnimatePresence>

                {/* ===========================================
                    RESULT MESSAGE
                =========================================== */}

                <div className="text-center">
                  {!isRuleFailure && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.9,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{
                        delay: 0.15,
                      }}
                      className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/[0.08]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5 text-emerald-400"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                    </motion.div>
                  )}

                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    {isRuleFailure
                      ? "Attempt Summary"
                      : perfectScore
                        ? "Perfect Score"
                        : "Your Result"}
                  </p>

                  <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">
                    {isRuleFailure
                      ? "Please contact the admin"
                      : perfectScore
                        ? "Outstanding performance!"
                        : `Great work${name
                          ? `, ${name}`
                          : ""
                        }!`}
                  </h2>

                  <p
                    className={`mx-auto mt-2 max-w-md text-xs leading-5 ${isRuleFailure
                      ? "text-red-400/80"
                      : "text-zinc-600"
                      }`}
                  >
                    {isRuleFailure
                      ? "Try to follow the rules next time. Contact the admin if you need permission to reattempt."
                      : perfectScore
                        ? "Congratulations! You answered every question correctly."
                        : isTopFive
                          ? "You made it into the chapter's Top 5. Keep that position!"
                          : "Keep learning, improve your speed and climb the leaderboard."}
                  </p>
                </div>

                {/* ===========================================
                    SCORE HERO
                =========================================== */}

                {!isRuleFailure && (
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
                      delay: 0.2,
                    }}
                    className="mx-auto mt-7 max-w-md rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6"
                  >
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                          Score
                        </p>

                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl">
                            {score}
                          </span>

                          <span className="text-lg font-black text-zinc-700">
                            / {total}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
                          Accuracy
                        </p>

                        <p
                          className={`mt-1 text-2xl font-black ${scorePercentage ===
                            100
                            ? "text-emerald-400"
                            : "text-violet-400"
                            }`}
                        >
                          {scorePercentage}%
                        </p>
                      </div>
                    </div>

                    {/* SCORE PROGRESS */}

                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${scorePercentage}%`,
                        }}
                        transition={{
                          delay: 0.25,
                          duration: 0.8,
                          ease: "easeOut",
                        }}
                        className={`h-full rounded-full ${scorePercentage ===
                          100
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-violet-500 to-indigo-500"
                          }`}
                      />
                    </div>
                  </motion.div>
                )}

                {/* ===========================================
                    RANK / TIME
                =========================================== */}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {/* RANK */}

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.07]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 text-violet-400"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4ZM7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4"
                        />
                      </svg>
                    </div>

                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
                      Rank
                    </p>

                    <motion.p
                      initial={{
                        scale: 0.96,
                      }}
                      animate={{
                        scale: 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 160,
                        damping: 14,
                      }}
                      className="mt-1 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl"
                    >
                      {rank
                        ? `#${displayRank}`
                        : "—"}
                    </motion.p>
                  </div>

                  {/* TIME */}

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/15 bg-indigo-500/[0.07]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 text-indigo-400"
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
                    </div>

                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
                      Time Taken
                    </p>

                    <p className="mt-1 text-lg font-black tracking-[-0.02em] text-white sm:text-xl">
                      {formatTime(
                        time_taken
                      )}
                    </p>
                  </div>
                </div>

                {/* ===========================================
                    CHAMPION BADGE
                =========================================== */}

                <AnimatePresence>
                  {showChampionBadge &&
                    !isRuleFailure && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 10,
                          scale: 0.97,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        transition={{
                          delay: 0.3,
                        }}
                        className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/[0.055] p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/[0.08] text-lg">
                          🏅
                        </div>

                        <div>
                          <p className="text-xs font-black text-amber-300">
                            Top 5 Champion
                          </p>

                          <p className="mt-0.5 text-[10px] leading-4 text-amber-200/40">
                            You're currently
                            ranked #{rank} in{" "}
                            {chapter}.
                          </p>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>

                {/* ===========================================
                    PARTICIPANT
                =========================================== */}

                <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-sm font-black text-zinc-300">
                    {name
                      ? name
                        .charAt(0)
                        .toUpperCase()
                      : "U"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-zinc-200">
                      {name || "Unknown"}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] font-medium text-zinc-600">
                      {place || "—"}
                    </p>
                  </div>

                  <div className="max-w-[45%] text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-700">
                      Chapter
                    </p>

                    <p className="mt-1 truncate text-[10px] font-bold text-zinc-500">
                      {chapter || "—"}
                    </p>
                  </div>
                </div>

                {/* ===========================================
                    PROFILE CLAIM CODE
                =========================================== */}

                {profile_claim_code &&
                  !isRuleFailure && (
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
                        delay: 0.34,
                      }}
                      className="mt-5 overflow-hidden rounded-[22px] border border-violet-500/20 bg-violet-500/[0.055]"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/[0.08]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4 text-violet-400"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7 10V8a5 5 0 0 1 10 0v2M6 10h12v10H6V10Z"
                              />
                              <path
                                strokeLinecap="round"
                                d="M12 14v2"
                              />
                            </svg>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-violet-200">
                              Save your Profile Claim Code
                            </p>

                            <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                              Keep this code somewhere safe. You can use it later to activate your QUIZTIANS profile if the quick setup link is no longer available.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <div className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-white/[0.07] bg-[#09090B]/60 px-4">
                            <span className="break-all text-center font-mono text-sm font-black tracking-[0.12em] text-white">
                              {profile_claim_code}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyClaimCode}
                            className="min-h-[48px] shrink-0 rounded-xl border border-violet-500/20 bg-violet-500/[0.09] px-5 text-[11px] font-black text-violet-300 transition hover:bg-violet-500/[0.14] hover:text-violet-200 active:scale-[0.985]"
                          >
                            Copy Code
                          </button>
                        </div>

                        <p className="mt-3 text-[9px] leading-4 text-amber-300/70">
                          This code is shown only when it is first issued. Do not share it publicly.
                        </p>
                      </div>
                    </motion.div>
                  )}

                {/* ===========================================
                    PRIMARY ACTIONS
                =========================================== */}

                <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* REVIEW */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/review", {
                        state: {
                          phone,
                          chapter,
                          time_taken,
                        },
                      })
                    }
                    className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-black text-white shadow-lg shadow-violet-950/20 transition hover:from-violet-500 hover:to-indigo-500 active:scale-[0.985]"
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
                        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
                      />

                      <path
                        strokeLinecap="round"
                        d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"
                      />
                    </svg>

                    Review Answers
                  </button>

                  {/* LEADERBOARD */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/leaderboard",
                        {
                          state: {
                            phone,
                            chapter,
                            name,
                            score,
                            total,
                            place,
                          },
                        }
                      )
                    }
                    className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 text-xs font-black text-zinc-300 transition hover:border-violet-500/20 hover:bg-violet-500/[0.05] hover:text-white active:scale-[0.985]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4 text-violet-400"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4ZM7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4"
                      />
                    </svg>

                    View Leaderboard
                  </button>
                </div>

                {/* ===========================================
                    SECONDARY ACTIONS
                =========================================== */}

                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  {/* SHARE */}

                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 text-[11px] font-bold text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200 active:scale-[0.985]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <circle
                        cx="18"
                        cy="5"
                        r="3"
                      />

                      <circle
                        cx="6"
                        cy="12"
                        r="3"
                      />

                      <circle
                        cx="18"
                        cy="19"
                        r="3"
                      />

                      <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
                    </svg>

                    Share Result
                  </button>

                  {/* HOME */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/")
                    }
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 text-[11px] font-bold text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200 active:scale-[0.985]"
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
                        d="m3 11 9-8 9 8"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 10v10h14V10M9 20v-6h6v6"
                      />
                    </svg>

                    Back Home
                  </button>
                </div>

                {/* RECORDED */}

                <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/[0.05] pt-5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />

                  <p className="text-center text-[9px] font-medium text-zinc-700">
                    Your result has been
                    recorded successfully.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* ===============================================
                RIGHT COLUMN
            =============================================== */}

            <aside className="space-y-5">
              {/* =============================================
                  TOP PLAYERS
              ============================================= */}

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
                  duration: 0.45,
                  delay: 0.08,
                }}
                className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#111114]"
              >
                {/* HEADER */}

                <div className="flex items-start justify-between border-b border-white/[0.06] p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/[0.06] text-sm">
                        🏆
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-zinc-200">
                          Top Players
                        </h3>

                        <p className="mt-0.5 max-w-[170px] truncate text-[9px] font-medium text-zinc-700">
                          {chapter || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-600">
                    Top 5
                  </span>
                </div>

                {/* LEADERBOARD */}

                <div className="p-3">
                  {topPlayers.length ===
                    0 && (
                      <div className="px-3 py-8 text-center">
                        <p className="text-xs font-semibold text-zinc-600">
                          No players yet.
                        </p>

                        <p className="mt-1 text-[9px] text-zinc-800">
                          Be the first on the
                          leaderboard.
                        </p>
                      </div>
                    )}

                  <motion.ul
                    variants={listVariant}
                    initial="hidden"
                    animate="show"
                    className="space-y-1.5"
                  >
                    {topPlayers.map(
                      (p, i) => {
                        const medal =
                          i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : "🏅";

                        const isYou =
                          rank === i + 1;

                        return (
                          <motion.li
                            key={
                              p.id ??
                              `${p.name}-${i}`
                            }
                            variants={
                              itemVariant
                            }
                            className={`relative flex items-center justify-between gap-3 rounded-2xl border p-3 transition ${isYou
                              ? "border-violet-500/20 bg-violet-500/[0.065]"
                              : "border-transparent bg-transparent hover:bg-white/[0.025]"
                              }`}
                          >
                            {/* LEFT */}

                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-base">
                                {medal}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className={`truncate text-xs font-bold ${isYou
                                      ? "text-violet-200"
                                      : "text-zinc-300"
                                      }`}
                                  >
                                    {p.name}
                                  </p>

                                  {isYou && (
                                    <span className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-violet-400">
                                      You
                                    </span>
                                  )}
                                </div>

                                <p className="mt-0.5 truncate text-[9px] text-zinc-700">
                                  {p.place ||
                                    "—"}
                                </p>
                              </div>
                            </div>

                            {/* RIGHT */}

                            <div className="shrink-0 text-right">
                              <p
                                className={`text-sm font-black ${i === 0
                                  ? "text-amber-300"
                                  : isYou
                                    ? "text-violet-300"
                                    : "text-zinc-400"
                                  }`}
                              >
                                {p.score}
                              </p>

                              <p className="mt-0.5 text-[8px] font-medium text-zinc-700">
                                {formatTime(
                                  p.time_taken
                                )}
                              </p>
                            </div>
                          </motion.li>
                        );
                      }
                    )}
                  </motion.ul>
                </div>

                {/* VIEW ALL */}

                <div className="border-t border-white/[0.05] p-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/leaderboard",
                        {
                          state: {
                            phone,
                            chapter,
                            name,
                            score,
                            total,
                            place,
                          },
                        }
                      )
                    }
                    className="min-h-[44px] w-full rounded-xl text-[10px] font-bold text-zinc-600 transition hover:bg-white/[0.025] hover:text-violet-400"
                  >
                    View full leaderboard →
                  </button>
                </div>
              </motion.section>

              {/* =============================================
                  TIPS
              ============================================= */}

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
                  duration: 0.45,
                  delay: 0.14,
                }}
                className="rounded-[24px] border border-white/[0.07] bg-[#111114] p-5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.06]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4 text-violet-400"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 18h6M10 22h4"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.5 15.5A7 7 0 1 1 15.5 15.5C14.5 16.3 14 17 14 18h-4c0-1-.5-1.7-1.5-2.5Z"
                      />
                    </svg>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-zinc-300">
                      Tips to improve
                    </h4>

                    <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-700">
                      Keep climbing
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <Tip
                    number="01"
                    text="Review incorrect answers right away."
                  />

                  <Tip
                    number="02"
                    text="Revisit chapter notes and try scoring more in the next chapters."
                  />

                  <Tip
                    number="03"
                    text="Practice with friends to improve speed and accuracy."
                  />
                </div>
              </motion.section>
            </aside>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mt-10 border-t border-white/[0.05] pt-6 text-center">
            <p className="text-[9px] font-semibold tracking-[0.08em] text-zinc-800">
              QUIZTIANS · Learn • Play •
              Compete
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}

// ===========================================================
// TIP COMPONENT
// ===========================================================

function Tip({ number, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[8px] font-black text-violet-500/60">
        {number}
      </span>

      <p className="text-[10px] leading-[1.6] text-zinc-600">
        {text}
      </p>
    </div>
  );
}

function ResultLoading() {
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
        {/* BRAND */}

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

        <div className="mx-auto mt-5 flex h-36 w-36 items-center justify-center overflow-hidden">
          <DotLottieReact
            src="/lottie/Animationloading.json"
            loop
            autoplay
            style={{
              width: 140,
              height: 140,
            }}
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
          Calculating your result
        </motion.h1>

        <p className="mt-2 text-xs font-medium text-zinc-600">
          Updating the leaderboard...
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