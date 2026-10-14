import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Leaderboard() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    name,
    phone,
    chapter,
    score,
    place,
  } = state || {};

  // =========================================================
  // STATE
  // =========================================================

  const [players, setPlayers] = useState([]);
  const [top3, setTop3] = useState([]);
  const [nextPlayers, setNextPlayers] = useState([]);

  const [userRank, setUserRank] = useState(null);
  const [userScore, setUserScore] = useState(null);
  const [userTime, setUserTime] = useState(null);

  const [loading, setLoading] = useState(true);
  const [totalScore, setTotalScore] = useState(0);

  const [bestStats, setBestStats] = useState({
    bestScore: null,
    bestTime: null,
    attempts: 0,
  });

  const userRef = useRef(null);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (seconds) => {
    if (
      seconds === null ||
      seconds === undefined
    ) {
      return "—";
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return mins > 0
      ? `${mins}m ${secs
        .toString()
        .padStart(2, "0")}s`
      : `${secs}s`;
  };

  // =========================================================
  // BADGE
  // =========================================================

  const Badge = ({ type }) => {
    const config = {
      high: {
        label: "High Score",
        icon: "★",
        className:
          "border-amber-500/15 bg-amber-500/[0.07] text-amber-400",
      },

      fast: {
        label: "Fastest",
        icon: "⚡",
        className:
          "border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-400",
      },
    };

    const badge = config[type];

    if (!badge) return null;

    return (
      <span
        className={`inline-flex min-h-[22px] items-center gap-1 rounded-md border px-2 text-[8px] font-black uppercase tracking-[0.08em] ${badge.className}`}
      >
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  // =========================================================
  // SKILL BADGE
  // Original thresholds preserved
  // =========================================================

  const SkillBadge = ({
    score = 0,
    total = 1,
  }) => {
    const safeTotal =
      Number(total) > 0
        ? Number(total)
        : 1;

    const pct =
      (Number(score || 0) / safeTotal) *
      100;

    let label = "Bronze";
    let icon = "🥉";
    let classes =
      "border-orange-500/15 bg-orange-500/[0.07] text-orange-300";

    if (pct >= 90) {
      label = "Legend";
      icon = "🏆";
      classes =
        "border-purple-500/20 bg-purple-500/[0.08] text-purple-300";
    } else if (pct >= 75) {
      label = "Champion";
      icon = "🥇";
      classes =
        "border-amber-500/20 bg-amber-500/[0.08] text-amber-300";
    } else if (pct >= 55) {
      label = "Gold";
      icon = "🥇";
      classes =
        "border-yellow-500/15 bg-yellow-500/[0.07] text-yellow-300";
    } else if (pct >= 35) {
      label = "Silver";
      icon = "🥈";
      classes =
        "border-zinc-400/15 bg-zinc-400/[0.07] text-zinc-300";
    }

    return (
      <span
        className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-lg border px-2.5 text-[9px] font-black uppercase tracking-[0.08em] ${classes}`}
      >
        <span className="text-xs">
          {icon}
        </span>

        {label}
      </span>
    );
  };

  // =========================================================
  // FETCH TOTAL QUESTIONS
  // =========================================================

  useEffect(() => {
    if (!chapter) return;

    let mounted = true;

    const fetchTotalQuestions =
      async () => {
        const { count, error } =
          await supabase
            .from("questions")
            .select("*", {
              head: true,
              count: "exact",
            })
            .eq("chapter", chapter);

        if (error) {
          console.error(
            "Error fetching total questions:",
            error
          );
          return;
        }

        if (mounted) {
          setTotalScore(count || 0);
        }
      };

    fetchTotalQuestions();

    return () => {
      mounted = false;
    };
  }, [chapter]);

  // =========================================================
  // INVALID STATE
  // =========================================================

  useEffect(() => {
    if (!state) {
      navigate(-1);
    }
  }, [state, navigate]);

  // =========================================================
  // FETCH LEADERBOARD
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard =
      async () => {
        if (!chapter) {
          if (mounted) {
            setPlayers([]);
            setTop3([]);
            setNextPlayers([]);
            setUserRank(null);
            setUserScore(null);
            setUserTime(null);
            setLoading(false);
          }

          return;
        }

        try {
          const { data, error } =
            await supabase
              .from("results")
              .select(
                "id, name, place, phone, score, time_taken, created_at"
              )
              .eq("chapter", chapter);

          if (error) throw error;

          if (!mounted) return;

          // -----------------------------------------------
          // SCORE -> TIME -> EARLIEST SUBMISSION
          // -----------------------------------------------

          const sorted = [
            ...(data || []),
          ].sort((a, b) => {
            if (
              (b.score || 0) !==
              (a.score || 0)
            ) {
              return (
                (b.score || 0) -
                (a.score || 0)
              );
            }

            const at =
              a.time_taken ?? Infinity;

            const bt =
              b.time_taken ?? Infinity;

            if (at !== bt) {
              return at - bt;
            }

            return (
              new Date(a.created_at) -
              new Date(b.created_at)
            );
          });

          setPlayers(sorted);

          setTop3(
            sorted.slice(0, 3)
          );

          // Positions 4 through 20
          setNextPlayers(
            sorted.slice(3, 20)
          );

          // -----------------------------------------------
          // FIND CURRENT USER
          // -----------------------------------------------

          const index =
            sorted.findIndex((p) => {
              if (
                phone &&
                p.phone === phone
              ) {
                return true;
              }

              if (
                name &&
                p.name === name &&
                place === p.place &&
                Number(score) ===
                Number(p.score)
              ) {
                return true;
              }

              return false;
            });

          if (index >= 0) {
            setUserRank(index + 1);

            setUserScore(
              sorted[index].score ??
              null
            );

            setUserTime(
              sorted[index]
                .time_taken ?? null
            );
          } else {
            setUserRank(null);
            setUserScore(null);
            setUserTime(null);
          }
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
    };
  }, [
    chapter,
    name,
    phone,
    score,
    place,
  ]);

  // =========================================================
  // USER BEST PERFORMANCE
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchUserBestForChapter =
      async () => {
        if (!chapter) {
          if (mounted) {
            setBestStats({
              bestScore: null,
              bestTime: null,
              attempts: 0,
            });
          }

          return;
        }

        try {
          let query = supabase
            .from("results")
            .select(
              "score, time_taken"
            )
            .eq("chapter", chapter);

          if (phone) {
            query = query.eq(
              "phone",
              phone
            );
          } else if (name) {
            query = query
              .eq("name", name)
              .eq("place", place);
          } else {
            if (mounted) {
              setBestStats({
                bestScore: null,
                bestTime: null,
                attempts: 0,
              });
            }

            return;
          }

          const { data, error } =
            await query;

          if (error) throw error;

          if (!mounted) return;

          const attempts =
            data?.length || 0;

          const bestScore = attempts
            ? Math.max(
              ...data.map(
                (d) => d.score || 0
              )
            )
            : null;

          const bestTime =
            attempts &&
            Math.min(
              ...data.map((d) =>
                d.time_taken === null
                  ? Infinity
                  : d.time_taken
              )
            );

          if (mounted) {
            setBestStats({
              bestScore:
                bestScore !== -Infinity
                  ? bestScore
                  : null,

              bestTime:
                bestTime === Infinity
                  ? null
                  : bestTime,

              attempts,
            });
          }
        } catch (err) {
          console.error(
            "Error fetching user best stats:",
            err
          );

          if (mounted) {
            setBestStats({
              bestScore: null,
              bestTime: null,
              attempts: 0,
            });
          }
        }
      };

    fetchUserBestForChapter();

    return () => {
      mounted = false;
    };
  }, [
    chapter,
    phone,
    name,
    place,
  ]);

  // =========================================================
  // AUTO-SCROLL TO USER
  // =========================================================

  useEffect(() => {
    if (userRef.current) {
      try {
        userRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } catch {
        // Ignore unsupported smooth scrolling
      }
    }
  }, [
    top3,
    nextPlayers,
    userRank,
  ]);

  // =========================================================
  // INITIALS
  // =========================================================

  const initials = (
    fullName = ""
  ) => {
    if (!fullName) return "A";

    const parts = fullName
      .trim()
      .split(/\s+/);

    return parts.length === 1
      ? parts[0]
        .slice(0, 2)
        .toUpperCase()
      : (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase();
  };

  // =========================================================
  // ANIMATIONS
  // =========================================================

  const podiumVariant = {
    hidden: {
      opacity: 0,
      y: 20,
    },

    show: (i = 0) => ({
      opacity: 1,
      y: 0,

      transition: {
        delay: 0.12 * i,
        type: "spring",
        stiffness: 140,
        damping: 16,
      },
    }),
  };

  const listItemVariant = {
    hidden: {
      opacity: 0,
      x: -12,
    },

    show: {
      opacity: 1,
      x: 0,

      transition: {
        type: "spring",
        stiffness: 120,
        damping: 16,
      },
    },
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return <LeaderboardLoading />;
  }

  // =========================================================
  // DERIVED LEADERBOARD STATS
  // =========================================================

  const highestScore =
    players[0]?.score ?? null;

  const fastestTime =
    players.length > 0
      ? Math.min(
        ...players.map(
          (p) =>
            p.time_taken ??
            Infinity
        )
      )
      : null;

  // Fastest player for each score
  const fastestPerScore = {};

  players.forEach((p) => {
    if (
      p.score > 0 &&
      p.time_taken != null
    ) {
      if (
        !fastestPerScore[p.score] ||
        p.time_taken <
        fastestPerScore[p.score]
      ) {
        fastestPerScore[p.score] =
          p.time_taken;
      }
    }
  });

  // =========================================================
  // HELPER: IS CURRENT USER
  // =========================================================

  const isCurrentUser = (
    player
  ) => {
    if (!player) return false;

    return (
      (phone &&
        player.phone === phone) ||
      (name &&
        player.name === name &&
        place === player.place &&
        Number(score) ===
        Number(player.score))
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-violet-700/[0.08] blur-[140px]" />

        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-indigo-700/[0.07] blur-[140px]" />

        <div className="absolute left-1/2 top-28 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/[0.025] blur-[130px]" />

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

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090B]/90 backdrop-blur-xl">
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

          {/* BACK */}

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
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

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-14 pt-7 sm:px-6 sm:pt-10">
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
              Rankings
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">
                Leaderboard
              </h1>

              <p className="mt-2 text-xs leading-5 text-zinc-600 sm:text-sm">
                Compete. Learn. Climb.
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
                Chapter
              </p>

              <p className="mt-1 max-w-[280px] truncate text-xs font-bold text-zinc-400">
                {chapter ?? "—"}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            PAGE GRID
        =================================================== */}

        <div className="mt-7 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.85fr)] lg:gap-6">
          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-5">
            {/* ===============================================
                PODIUM
            =============================================== */}

            <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111114]">
              {/* GLOW */}

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-5 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/[0.04] blur-[100px]" />

                <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-violet-500/[0.035] blur-[90px]" />
              </div>

              <div className="relative p-5 sm:p-7">
                {/* PODIUM HEADING */}

                <div className="mb-7 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                      Hall of Fame
                    </p>

                    <h2 className="mt-1 text-sm font-black text-zinc-300">
                      Chapter Top 3
                    </h2>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/15 bg-amber-500/[0.06] text-base">
                    🏆
                  </div>
                </div>

                {players.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.025] text-xl">
                      🏆
                    </div>

                    <p className="mt-4 text-sm font-bold text-zinc-500">
                      No rankings yet
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-700">
                      Be the first player on
                      this leaderboard.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* =======================================
                        MOBILE/DESKTOP PODIUM
                    ======================================= */}

                    <div className="grid grid-cols-3 items-end gap-2 sm:gap-5">
                      {/* SECOND */}

                      <PodiumPlayer
                        player={top3[1]}
                        rank={2}
                        medal="🥈"
                        initials={initials}
                        formatTime={
                          formatTime
                        }
                        isYou={isCurrentUser(
                          top3[1]
                        )}
                        highestScore={
                          highestScore
                        }
                        fastestPerScore={
                          fastestPerScore
                        }
                        Badge={Badge}
                        podiumVariant={
                          podiumVariant
                        }
                      />

                      {/* FIRST */}

                      <PodiumPlayer
                        player={top3[0]}
                        rank={1}
                        medal="🥇"
                        initials={initials}
                        formatTime={
                          formatTime
                        }
                        isYou={isCurrentUser(
                          top3[0]
                        )}
                        highestScore={
                          highestScore
                        }
                        fastestPerScore={
                          fastestPerScore
                        }
                        Badge={Badge}
                        podiumVariant={
                          podiumVariant
                        }
                        winner
                      />

                      {/* THIRD */}

                      <PodiumPlayer
                        player={top3[2]}
                        rank={3}
                        medal="🥉"
                        initials={initials}
                        formatTime={
                          formatTime
                        }
                        isYou={isCurrentUser(
                          top3[2]
                        )}
                        highestScore={
                          highestScore
                        }
                        fastestPerScore={
                          fastestPerScore
                        }
                        Badge={Badge}
                        podiumVariant={
                          podiumVariant
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* ===============================================
                CURRENT USER - MOBILE
            =============================================== */}

            <div className="lg:hidden">
              <CurrentUserCard
                name={name}
                place={place}
                userRank={userRank}
                userScore={userScore}
                userTime={userTime}
                totalScore={totalScore}
                highestScore={highestScore}
                fastestPerScore={
                  fastestPerScore
                }
                initials={initials}
                formatTime={formatTime}
                SkillBadge={SkillBadge}
                Badge={Badge}
              />
            </div>

            {/* ===============================================
                RANKINGS 4 - 20
            =============================================== */}

            <section className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#111114]">
              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                    Rankings
                  </p>

                  <h2 className="mt-1 text-sm font-black text-zinc-300">
                    Positions 4–20
                  </h2>
                </div>

                <div className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-zinc-600">
                  {players.length}{" "}
                  {players.length === 1
                    ? "Player"
                    : "Players"}
                </div>
              </div>

              {/* LIST */}

              <motion.ul
                initial="hidden"
                animate="show"
                className="max-h-[620px] space-y-1 overflow-y-auto p-2 sm:p-3"
              >
                {nextPlayers.length ===
                  0 && (
                    <li className="px-4 py-10 text-center">
                      <p className="text-xs font-bold text-zinc-600">
                        No other players yet.
                      </p>
                    </li>
                  )}

                {nextPlayers.map(
                  (p, idx) => {
                    const rank =
                      idx + 4;

                    const current =
                      isCurrentUser(p);

                    const isHighScore =
                      p.score ===
                      highestScore;

                    const isFastestForScore =
                      p.score > 0 &&
                      p.time_taken !==
                      null &&
                      fastestPerScore[
                      p.score
                      ] ===
                      p.time_taken;

                    return (
                      <motion.li
                        key={p.id}
                        variants={
                          listItemVariant
                        }
                        ref={
                          current
                            ? userRef
                            : null
                        }
                        className={`relative flex items-center gap-3 rounded-2xl border p-3 transition sm:p-3.5 ${current
                          ? "border-violet-500/20 bg-violet-500/[0.07]"
                          : "border-transparent hover:bg-white/[0.025]"
                          }`}
                      >
                        {/* CURRENT USER ACCENT */}

                        {current && (
                          <span className="absolute bottom-3 left-0 top-3 w-[2px] rounded-full bg-violet-500" />
                        )}

                        {/* RANK */}

                        <div
                          className={`flex w-8 shrink-0 justify-center text-[10px] font-black ${current
                            ? "text-violet-400"
                            : "text-zinc-700"
                            }`}
                        >
                          #{rank}
                        </div>

                        {/* AVATAR */}

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black ${current
                            ? "border-violet-500/20 bg-violet-500/[0.1] text-violet-300"
                            : "border-white/[0.06] bg-white/[0.03] text-zinc-500"
                            }`}
                        >
                          {initials(
                            p.name
                          )}
                        </div>

                        {/* INFO */}

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <p
                              className={`truncate text-xs font-bold ${current
                                ? "text-violet-200"
                                : "text-zinc-300"
                                }`}
                            >
                              {p.name ||
                                "Unknown"}
                            </p>

                            {current && (
                              <span className="shrink-0 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-violet-400">
                                You
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-[9px] text-zinc-700">
                            {p.place ||
                              "—"}
                          </p>

                          {/* BADGES */}

                          {(isHighScore ||
                            isFastestForScore) && (
                              <div className="mt-1.5 hidden flex-wrap gap-1 sm:flex">
                                {isHighScore && (
                                  <Badge type="high" />
                                )}

                                {isFastestForScore && (
                                  <Badge type="fast" />
                                )}
                              </div>
                            )}
                        </div>

                        {/* SCORE */}

                        <div className="shrink-0 text-right">
                          <div
                            className={`text-base font-black ${current
                              ? "text-violet-300"
                              : "text-zinc-300"
                              }`}
                          >
                            {p.score}
                            {totalScore >
                              0 && (
                                <span className="text-[9px] text-zinc-700">
                                  /{totalScore}
                                </span>
                              )}
                          </div>

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
            </section>

            {/* ===============================================
                BEST PERFORMANCE - MOBILE
            =============================================== */}

            <div className="lg:hidden">
              <BestPerformance
                bestStats={bestStats}
                totalScore={totalScore}
                formatTime={formatTime}
              />
            </div>

            {/* ===============================================
                RANKING RULE
            =============================================== */}

            <section className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.06]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4 text-violet-400"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path
                      strokeLinecap="round"
                      d="M12 11v5M12 8h.01"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-600">
                    How ranking works
                  </p>

                  <p className="mt-2 text-[10px] leading-5 text-zinc-600">
                    Ties are resolved by
                    highest score, then
                    fastest completion time,
                    then earliest submission.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] font-black">
                    <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-zinc-500">
                      Score
                    </span>

                    <span className="text-zinc-800">
                      →
                    </span>

                    <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-zinc-500">
                      Time
                    </span>

                    <span className="text-zinc-800">
                      →
                    </span>

                    <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-zinc-500">
                      Submission
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* =================================================
              RIGHT / DESKTOP SIDEBAR
          ================================================= */}

          <aside className="hidden space-y-5 lg:block">
            {/* CURRENT USER */}

            <CurrentUserCard
              name={name}
              place={place}
              userRank={userRank}
              userScore={userScore}
              userTime={userTime}
              totalScore={totalScore}
              highestScore={highestScore}
              fastestPerScore={
                fastestPerScore
              }
              initials={initials}
              formatTime={formatTime}
              SkillBadge={SkillBadge}
              Badge={Badge}
            />

            {/* BEST */}

            <BestPerformance
              bestStats={bestStats}
              totalScore={totalScore}
              formatTime={formatTime}
            />

            {/* TIPS */}

            <section className="rounded-[24px] border border-white/[0.07] bg-[#111114] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/15 bg-violet-500/[0.06]">
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
                  <h3 className="text-xs font-black text-zinc-300">
                    Tips to climb
                  </h3>

                  <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-700">
                    Improve your rank
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <Tip
                  number="01"
                  text="Review incorrect answers immediately."
                />

                <Tip
                  number="02"
                  text="Retry chapter quizzes regularly."
                />

                <Tip
                  number="03"
                  text="Practice against the clock to improve speed."
                />
              </div>
            </section>
          </aside>
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="mt-10 border-t border-white/[0.05] pt-6 text-center">
          <p className="text-[9px] font-semibold tracking-[0.08em] text-zinc-800">
            QUIZTIANS · Learn • Play •
            Compete
          </p>
        </footer>
      </main>
    </div>
  );
}

// ===========================================================
// PODIUM PLAYER
// ===========================================================

function PodiumPlayer({
  player,
  rank,
  medal,
  initials,
  formatTime,
  isYou,
  highestScore,
  fastestPerScore,
  Badge,
  podiumVariant,
  winner = false,
}) {
  const hasPlayer = !!player;

  const highScore =
    hasPlayer &&
    player.score === highestScore;

  const fastest =
    hasPlayer &&
    player.score > 0 &&
    player.time_taken !== null &&
    fastestPerScore[player.score] ===
    player.time_taken;

  return (
    <motion.div
      custom={rank - 1}
      initial="hidden"
      animate="show"
      variants={podiumVariant}
      className={`flex min-w-0 flex-col items-center ${winner
        ? "pb-4"
        : rank === 2
          ? "pb-1"
          : "pb-0"
        }`}
    >
      {/* CROWN */}

      <div
        className={`mb-1 flex h-6 items-center justify-center text-base ${winner
          ? "opacity-100"
          : "opacity-0"
          }`}
      >
        👑
      </div>

      {/* AVATAR */}

      <div className="relative">
        {winner &&
          hasPlayer && (
            <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-2xl" />
          )}

        <div
          className={`relative flex items-center justify-center rounded-full border font-black ${winner
            ? "h-[76px] w-[76px] border-amber-400/30 bg-amber-500/[0.08] text-lg text-amber-200 shadow-[0_0_40px_rgba(245,158,11,0.08)] sm:h-28 sm:w-28 sm:text-2xl"
            : rank === 2
              ? "h-14 w-14 border-zinc-400/15 bg-zinc-400/[0.06] text-sm text-zinc-300 sm:h-20 sm:w-20 sm:text-lg"
              : "h-14 w-14 border-orange-500/15 bg-orange-500/[0.05] text-sm text-orange-300 sm:h-20 sm:w-20 sm:text-lg"
            }`}
        >
          {hasPlayer
            ? initials(player.name)
            : "—"}

          {isYou && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-violet-500/20 bg-[#17111F] px-1.5 py-0.5 text-[6px] font-black uppercase tracking-[0.08em] text-violet-400">
              You
            </span>
          )}
        </div>
      </div>

      {/* RANK */}

      <p
        className={`mt-3 font-black uppercase tracking-[0.12em] ${winner
          ? "text-[9px] text-amber-400"
          : "text-[8px] text-zinc-700"
          }`}
      >
        {rank === 1
          ? "1st"
          : rank === 2
            ? "2nd"
            : "3rd"}
      </p>

      {/* NAME */}

      <p
        className={`mt-1 w-full truncate text-center font-black ${winner
          ? "text-xs text-white sm:text-sm"
          : "text-[10px] text-zinc-400 sm:text-xs"
          }`}
      >
        {player?.name || "—"}
      </p>

      {/* SCORE */}

      <p
        className={`mt-1 font-black ${winner
          ? "text-xl text-amber-300 sm:text-2xl"
          : "text-sm text-zinc-300 sm:text-base"
          }`}
      >
        {player?.score ?? "—"}
      </p>

      {/* TIME */}

      <p className="mt-0.5 whitespace-nowrap text-[7px] font-medium text-zinc-700 sm:text-[9px]">
        {formatTime(
          player?.time_taken
        )}
      </p>

      {/* BADGES */}

      {hasPlayer &&
        (highScore || fastest) && (
          <div className="mt-2 hidden flex-wrap justify-center gap-1 sm:flex">
            {highScore && (
              <Badge type="high" />
            )}

            {fastest && (
              <Badge type="fast" />
            )}
          </div>
        )}

      {/* PODIUM BASE */}

      <div
        className={`mt-3 flex items-center justify-center rounded-t-xl border ${winner
          ? "h-12 w-[72px] border-amber-500/15 bg-amber-500/[0.055] sm:h-16 sm:w-28"
          : rank === 2
            ? "h-9 w-14 border-zinc-400/10 bg-zinc-400/[0.035] sm:h-12 sm:w-20"
            : "h-7 w-12 border-orange-500/10 bg-orange-500/[0.03] sm:h-10 sm:w-16"
          }`}
      >
        <span
          className={
            winner
              ? "text-xl"
              : "text-sm"
          }
        >
          {medal}
        </span>
      </div>
    </motion.div>
  );
}

// ===========================================================
// CURRENT USER CARD
// ===========================================================

function CurrentUserCard({
  name,
  place,
  userRank,
  userScore,
  userTime,
  totalScore,
  highestScore,
  fastestPerScore,
  initials,
  formatTime,
  SkillBadge,
  Badge,
}) {
  const isHighScore =
    userScore !== null &&
    userScore > 0 &&
    userScore === highestScore;

  const isFastest =
    userScore !== null &&
    userScore > 0 &&
    userTime != null &&
    fastestPerScore[userScore] ===
    userTime;

  return (
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
      className="relative overflow-hidden rounded-[24px] border border-violet-500/15 bg-[#111114]"
    >
      {/* GLOW */}

      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-600/[0.07] blur-[70px]" />

      <div className="relative p-5">
        {/* LABEL */}

        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-400">
            Your Position
          </p>

          {userRank && (
            <span className="rounded-full border border-violet-500/15 bg-violet-500/[0.07] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-violet-400">
              Ranked
            </span>
          )}
        </div>

        {/* USER */}

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/[0.08] text-xs font-black text-violet-300">
            {initials(name)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-zinc-200">
              {name || "—"}
            </p>

            <p className="mt-0.5 truncate text-[9px] font-medium text-zinc-700">
              {place || "—"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-700">
              Rank
            </p>

            <p className="mt-0.5 text-2xl font-black tracking-[-0.04em] text-violet-300">
              {userRank
                ? `#${userRank}`
                : "—"}
            </p>
          </div>
        </div>

        {/* SCORE / TIME */}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-700">
              Score
            </p>

            <div className="mt-1 flex items-baseline gap-1">
              <p className="text-xl font-black text-zinc-200">
                {userScore ?? "—"}
              </p>

              {totalScore > 0 &&
                userScore !== null && (
                  <span className="text-[9px] font-bold text-zinc-700">
                    / {totalScore}
                  </span>
                )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-700">
              Time
            </p>

            <p className="mt-1 text-base font-black text-zinc-200">
              {formatTime(userTime)}
            </p>
          </div>
        </div>

        {/* BADGES */}

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <SkillBadge
            score={userScore || 0}
            total={totalScore}
          />

          {isHighScore && (
            <Badge type="high" />
          )}

          {isFastest && (
            <Badge type="fast" />
          )}
        </div>
      </div>
    </motion.section>
  );
}

// ===========================================================
// BEST PERFORMANCE
// ===========================================================

function BestPerformance({
  bestStats,
  totalScore,
  formatTime,
}) {
  return (
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
        delay: 0.05,
      }}
      className="rounded-[24px] border border-white/[0.07] bg-[#111114] p-5"
    >
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
          Your Best
        </p>

        <h3 className="mt-1 text-xs font-black text-zinc-300">
          This chapter
        </h3>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {/* BEST SCORE */}

        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="text-[7px] font-black uppercase tracking-[0.1em] text-zinc-700">
            Score
          </p>

          <p className="mt-1 text-base font-black text-zinc-300">
            {bestStats?.bestScore ??
              "—"}

            {totalScore > 0 &&
              bestStats?.bestScore !==
              null && (
                <span className="text-[8px] text-zinc-700">
                  /{totalScore}
                </span>
              )}
          </p>
        </div>

        {/* BEST TIME */}

        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="text-[7px] font-black uppercase tracking-[0.1em] text-zinc-700">
            Time
          </p>

          <p className="mt-1 whitespace-nowrap text-[11px] font-black text-zinc-300">
            {bestStats?.bestTime !==
              null
              ? formatTime(
                bestStats.bestTime
              )
              : "—"}
          </p>
        </div>

        {/* ATTEMPTS */}

        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
          <p className="text-[7px] font-black uppercase tracking-[0.1em] text-zinc-700">
            Attempts
          </p>

          <p className="mt-1 text-base font-black text-zinc-300">
            {bestStats?.attempts ?? 0}
          </p>
        </div>
      </div>
    </motion.section>
  );
}

// ===========================================================
// TIP
// ===========================================================

function Tip({
  number,
  text,
}) {
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

// ===========================================================
// LOADING
// ===========================================================

function LeaderboardLoading() {
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
            backgroundSize:
              "44px 44px",
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

        {/* ORIGINAL LOADING LOTTIE */}

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
          Loading leaderboard
        </p>

        <p className="mt-1 text-[10px] font-medium text-zinc-700">
          Finding the top players...
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