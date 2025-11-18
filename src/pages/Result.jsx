import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Result.jsx
 * Full professional rewrite — Gradient Modern Pro theme
 *
 * Notes:
 * - Requires Tailwind CSS
 * - Requires Framer Motion (install: npm i framer-motion)
 * - Lottie files used:
 *   Trophy (Top 5): https://lottie.host/3162ac9a-aa2f-4af4-a0d9-d2acf49074b6/HcTlc8K1iB.lottie
 *   Perfect score: https://lottie.host/190c889f-c3d3-4f5c-8bcd-cd8e6f5e3ef0/SgZBAxJMAe.lottie
 */

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { name, phone, place, score, total, chapter } = state || {};

  // data states
  const [topPlayers, setTopPlayers] = useState([]);
  const [rank, setRank] = useState(null); // 1-based number or null
  const [loading, setLoading] = useState(true);

  // UI states
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const [showChampionBadge, setShowChampionBadge] = useState(false);
  const [perfectScore, setPerfectScore] = useState(false);

  // animated rank display (for count-up)
  const [displayRank, setDisplayRank] = useState(0);
  const animRef = useRef(null);

  // fetch leaderboard for chapter and compute rank
  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard = async () => {
      if (!chapter) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("results")
          .select("id, name, place, phone, score, created_at")
          .eq("chapter", chapter)
          .order("score", { ascending: false })
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (!mounted) return;

        // find index; prefer phone if available (more reliable)
        const index = data.findIndex(
          (p) =>
            (phone && p.phone && p.phone === phone) ||
            (p.name === name && p.place === place && Number(p.score) === Number(score))
        );

        const playerRank = index >= 0 ? index + 1 : null;
        setRank(playerRank);

        // top 5 trophy & badge
        if (playerRank && playerRank <= 5) {
          setShowTrophy(true);
          setShowChampionBadge(true);
        } else {
          setShowTrophy(false);
          setShowChampionBadge(false);
        }

        // perfect score detection
        setPerfectScore(Number(score) === Number(total));

        // show confetti temporary
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);

        // show top 5 in local state
        setTopPlayers(data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLeaderboard();

    return () => {
      mounted = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, place, score, total, chapter]);

  // animate rank count-up using requestAnimationFrame for smoothness
  useEffect(() => {
    if (!rank || rank <= 0) {
      setDisplayRank(0);
      return;
    }

    let start = null;
    const duration = Math.max(500, Math.min(1200, rank * 80)); // scale duration by rank but clamp
    const from = 0;
    const to = rank;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(from + (to - from) * eased);
      setDisplayRank(current);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayRank(to);
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [rank]);

  // native share (keeps a single share button)
  const handleShare = async () => {
    const text = `🎉 Quiz Result 🎉
Name: ${name}
Place: ${place}
Chapter: ${chapter}
Score: ${score} / ${total}
Rank: ${rank ? `#${rank}` : "Unranked"}
`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Quiz Result", text });
      } catch (e) {
        // user cancelled or not supported
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert("Result copied to clipboard — you can paste it to share.");
      } catch {
        alert("Sharing not supported. Please copy manually.");
      }
    }
  };

  // glow styles by rank
  const getGlowClass = () => {
    if (rank === 1) return "border-yellow-400 shadow-[0_20px_50px_rgba(250,204,21,0.12)]";
    if (rank === 2) return "border-slate-300 shadow-[0_20px_40px_rgba(148,163,184,0.08)]";
    if (rank === 3) return "border-amber-600 shadow-[0_18px_40px_rgba(245,166,35,0.08)]";
    if (rank > 3 && rank <= 5) return "border-blue-300 shadow-[0_16px_36px_rgba(59,130,246,0.06)]";
    return "border-transparent shadow-sm";
  };

  // Framer Motion variants for leaderboard list + items (stagger)
  const listVariant = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, x: -24, scale: 0.98 },
    show: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 16 } },
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
          style={{ width: 140, height: 140 }}
        />
      </div>
    );
  }

  return (
    <>
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={220} gravity={0.28} />
      )}

      <div className="min-h-screen w-full p-6 md:p-12 bg-gradient-to-br from-indigo-100 via-sky-50 to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* MAIN CARD (left — spans two columns) */}
          <div className="lg:col-span-2">
            <div className={`relative rounded-3xl p-8 backdrop-blur-md bg-white/60 border ${getGlowClass()} border-white/30 transition-all`}>
              {/* Perfect score animation (dominant, placed over card top) */}
              <AnimatePresence>
                {perfectScore && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-1/2 -top-16 transform -translate-x-1/2"
                  >
                    <DotLottieReact
                      src="https://lottie.host/190c889f-c3d3-4f5c-8bcd-cd8e6f5e3ef0/SgZBAxJMAe.lottie"
                      autoplay
                      loop={false}
                      style={{ width: 180, height: 180 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trophy animation for Top 5 (if applicable) */}
              <AnimatePresence>
                {showTrophy && !perfectScore && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-center mb-4">
                    <DotLottieReact
                      src="https://lottie.host/3162ac9a-aa2f-4af4-a0d9-d2acf49074b6/HcTlc8K1iB.lottie"
                      autoplay
                      loop={false}
                      style={{ width: 120, height: 120 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="text-center mt-2 mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">🎉 Quiz Completed</h1>
                <p className="text-sm text-slate-600 mt-2">Thanks for participating — may knowledge bless your journey.</p>
              </div>

              {/* USER SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Info & badges */}
                <div className="md:col-span-2">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-300 to-purple-300 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-900">{name || "Unknown"}</h2>
                        <span className="text-sm text-slate-500">({place || "—"})</span>
                        {showChampionBadge && (
                          <span className="ml-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                            🏅 Top 5 Champion
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">Chapter: <span className="font-medium text-slate-700">{chapter || "—"}</span></p>
                    </div>
                  </div>

                  {/* Score & Rank boxes */}
                  <div className="mt-5 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 rounded-xl bg-white/80 border border-white/30 p-4 shadow-sm">
                      <p className="text-sm text-slate-500">Score</p>
                      <div className="text-3xl md:text-4xl font-extrabold text-emerald-600">{score} <span className="text-lg text-slate-500">/ {total}</span></div>
                    </div>

                    <div className="w-44 rounded-xl bg-white/80 border border-white/30 p-4 shadow-sm flex flex-col justify-center items-start">
                      <p className="text-sm text-slate-500">Rank</p>
                      <motion.div
                        initial={{ scale: 0.96 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 160, damping: 14 }}
                        className="text-2xl md:text-3xl font-extrabold text-indigo-700"
                      >
                        {rank ? `#${displayRank}` : "Unranked"}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Action buttons column */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => navigate("/")}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:scale-[1.01] transition-transform shadow-lg"
                    aria-label="Play again"
                  >
                    🔄 Play Again
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-medium hover:scale-[1.01] transition-transform shadow-lg"
                    aria-label="Share result"
                  >
                    📤 Share Result
                  </button>

                  <button
                    onClick={() => navigate("/leaderboard")}
                    className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/70 text-slate-800 font-medium hover:bg-white transition shadow-sm"
                  >
                    View Full Leaderboard
                  </button>
                </div>
              </div>

              {/* small divider */}
              <div className="h-px bg-white/40 my-6 rounded" />

              {/* short CTA */}
              <div className="text-sm text-slate-600">Your result is recorded. Keep learning and try to climb the leaderboard!</div>
            </div>
          </div>

          {/* RIGHT: Leaderboard column */}
          <aside className="space-y-4">
            <div className="rounded-2xl p-5 bg-gradient-to-b from-white/70 to-white/50 backdrop-blur-md border border-white/30 shadow">
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
                <h3 className="text-lg font-semibold text-slate-800">Top Scorers</h3>
                <p className="text-sm text-slate-500 mt-1">Leaderboard — {chapter || "—"}</p>
              </motion.div>

              <motion.ul variants={listVariant} initial="hidden" animate="show" className="mt-4 space-y-3">
                {topPlayers.length === 0 && <li className="text-sm text-slate-500">No players for this chapter yet.</li>}

                {topPlayers.map((p, i) => {
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
                  const highlight = rank === i + 1 ? "bg-indigo-50 border-indigo-200" : "bg-white";

                  return (
                    <motion.li key={p.id ?? `${p.name}-${i}`} variants={itemVariant} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${highlight}`}>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{medal}</div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.place}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{p.score}</div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </div>

            {/* Tips */}
            <div className="rounded-2xl p-5 bg-white/60 backdrop-blur-md border border-white/30 shadow">
              <h4 className="text-sm font-semibold text-slate-800">Tips to improve</h4>
              <ul className="mt-3 text-sm text-slate-600 space-y-2">
                <li>• Review incorrect answers right away.</li>
                <li>• Revisit chapter notes and try again periodically.</li>
                <li>• Practice with friends to improve speed and accuracy.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
