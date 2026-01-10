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
  const { name, phone, place, score, total, chapter, time_taken } = state || {};

  const [topPlayers, setTopPlayers] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showConfetti, setShowConfetti] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const [showChampionBadge, setShowChampionBadge] = useState(false);
  const [perfectScore, setPerfectScore] = useState(false);
  const [displayRank, setDisplayRank] = useState(0);

  const animRef = useRef(null);

  // Format time
  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? "0" + s : s}s`;
  };

  // Fetch leaderboard
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
          .select("id, name, place, phone, score, time_taken, created_at")
          .eq("chapter", chapter)
          .order("score", { ascending: false })
          .order("time_taken", { ascending: true })
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (!mounted) return;

        const index = data.findIndex(
          (p) =>
            (phone && p.phone && p.phone === phone) ||
            (p.name === name && p.place === place && Number(p.score) === Number(score))
        );

        const playerRank = index >= 0 ? index + 1 : null;
        setRank(playerRank);

        setShowTrophy(playerRank && playerRank <= 5);
        setShowChampionBadge(playerRank && playerRank <= 5);
        setPerfectScore(Number(score) === Number(total));

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);

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
  }, [name, phone, place, score, total, time_taken, chapter]);

  // Animate rank
  useEffect(() => {
    if (!rank || rank <= 0) {
      setDisplayRank(0);
      return;
    }
    let start = null;
    const duration = Math.max(500, Math.min(1200, rank * 80));
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * rank);
      setDisplayRank(current);
      if (progress < 1) animRef.current = requestAnimationFrame(step);
      else setDisplayRank(rank);
    };
    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [rank]);

  // Share
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
      message += "Try to follow the rules next time :)";
    } else {
      const isTop5 = rank && rank <= 5;
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
          toast.success("Result copied to clipboard! 🎉", {
            position: "top-center",
            autoClose: 2000,
          });
        })
        .catch(() => {
          toast.error("Sharing not supported 😅", {
            position: "top-center",
            autoClose: 2000,
          });
        });
    }
  };

  const getGlowClass = () => {
    if (rank === 1) return "shadow-[0px_40px_80px_rgba(250,204,21,0.12)]";
    if (rank === 2) return "shadow-[0px_10px_40px_rgba(255,210,76,1)]";
    if (rank === 3) return "shadow-[0px_10px_40px_rgba(111,101,68,1)]";
    if (rank > 3 && rank <= 5) return "shadow-[5px_16px_36px_rgba(59,130,246,6)]";
    return "border-transparent shadow-sm";
  };

  const listVariant = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
  const itemVariant = {
    hidden: { opacity: 0, x: -24, scale: 0.98 },
    show: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 120, damping: 16 },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
        <DotLottieReact
          src="/lottie/Animationloading.json"
          loop
          autoplay
          style={{ width: 140, height: 140 }}
        />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />

      {showConfetti && !(score === 0 && total === 0) && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={220}
          gravity={0.28}
        />
      )}

      <div className="min-h-screen w-full p-6 md:p-12 bg-gradient-to-br from-indigo-100 via-sky-50 to-blue-100 flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* MAIN CARD */}
          <div className="lg:col-span-2 relative">
            <div
              className={`relative rounded-3xl pt-10 pb-8 px-8 backdrop-blur-md bg-white/60 border ${getGlowClass()} border-white/30 transition-all flex flex-col items-center`}
            >
              <AnimatePresence>
                {score === 0 && total === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-40 sm:w-52 md:w-56 h-40 sm:h-52 md:h-56 rounded-3xl bg-white/40 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center mb-6 relative"
                  >
                    <div className="absolute w-64 sm:w-72 h-64 sm:h-72 rounded-3xl bg-gradient-to-tr from-gray-300 via-gray-400 to-gray-500 opacity-20 blur-3xl -z-10" />
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
                ) : (perfectScore || showTrophy) && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-40 sm:w-52 md:w-56 h-40 sm:h-52 md:h-56 rounded-3xl bg-white/40 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center mb-6 relative"
                  >
                    <div className="absolute w-64 sm:w-72 h-64 sm:h-72 rounded-3xl bg-gradient-to-tr from-indigo-300 via-purple-300 to-pink-300 opacity-30 blur-3xl -z-10" />
                    <DotLottieReact
                      src={perfectScore ? "/lottie/Trophy.json" : "/lottie/TrophyBadge.json"}
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
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="text-center mt-2 mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">🎉 Quiz Completed</h1>
                <div className="text-center mt-2 mb-6">
                  {/* Dynamic message */}
                  <p className="text-sm text-slate-600 mt-2">
                    Thanks for participating — May knowledge bless your journey.
                  </p>
                  {/* Dynamic message */}
                  <p
                    className={`text-sm mt-2 ${score === 0 && total === 0
                      ? "text-red-600 font-semibold"
                      : "text-slate-600"
                      }`}
                  >
                    {score === 0 && total === 0
                      ? "Try to follow the rules next time :) Contact admin to Reattempt"
                      : perfectScore
                        ? "🏆 Congratulations! Perfect Score!"
                        : ""}
                  </p>
                </div>
              </div>

              {/* User Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">
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
                      <p className="text-sm text-slate-500 mt-1">
                        Chapter: <span className="font-medium text-slate-700">{chapter || "—"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Score / Rank / Time */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">

                    {/* Score */}
                    <div className="rounded-xl bg-white/80 border border-white/30 p-4 shadow-sm">
                      <p className="text-sm text-slate-500">Score</p>
                      <div className="text-3xl md:text-4xl font-extrabold text-emerald-600">
                        {score} <span className="text-lg text-slate-500">/ {total}</span>
                      </div>
                    </div>

                    {/* Rank */}
                    <div className="rounded-xl bg-white/80 border border-white/30 p-4 shadow-sm flex flex-col justify-center items-start">
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

                    {/* Time Taken */}
                    <div className="rounded-xl bg-white/80 border border-white/30 p-4 shadow-sm flex flex-col justify-center items-start">
                      <p className="text-sm text-slate-500">Time Taken</p>
                      <div className="text-xl md:text-2xl font-extrabold text-blue-600">
                        {formatTime(time_taken)}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => navigate("/")}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:scale-[1.01] transition-transform shadow-lg"
                  >
                    Back To Home
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"
                  >
                    Share Result
                  </button>

                  <button
                    onClick={() =>
                      navigate("/leaderboard", {
                        state: { phone, chapter, name, score, total, place },
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white font-medium hover:scale-[1.01] transition-transform shadow-lg"
                  >
                    View Full Leaderboard
                  </button>

                  <button
                    onClick={() =>
                      navigate("/review", {
                        state: { phone, chapter, time_taken },
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:scale-[1.01] transition-transform shadow-lg"
                  >
                    Review Answers
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/40 my-6 rounded w-full" />
              <div className="text-sm text-slate-600 text-center">
                Your result is recorded. Keep learning and try to climb the leaderboard!
              </div>
            </div>
          </div>

          {/* Sidebar Leaderboard */}
          <aside className="space-y-4">
            <div className="rounded-2xl p-5 bg-gradient-to-b from-white/70 to-white/50 backdrop-blur-md border border-white/30 shadow">
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36 }}
              >
                <h3 className="text-lg font-semibold text-slate-800">Top Scorers</h3>
                <p className="text-sm text-slate-500 mt-1">Leaderboard — {chapter || "—"}</p>
              </motion.div>

              <motion.ul variants={listVariant} initial="hidden" animate="show" className="mt-4 space-y-3">
                {topPlayers.length === 0 && (
                  <li className="text-sm text-slate-500">No players for this chapter yet.</li>
                )}

                {topPlayers.map((p, i) => {
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
                  const highlight = rank === i + 1 ? "bg-indigo-50 border-indigo-200" : "bg-white";

                  return (
                    <motion.li
                      key={p.id ?? `${p.name}-${i}`}
                      variants={itemVariant}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${highlight}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{medal}</div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.place}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-700">{p.score}</div>
                        <div className="text-xs text-slate-500">{formatTime(p.time_taken)}</div>
                      </div>

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
                <li>• Revisit chapter notes and try scoring more in next Chapters.</li>
                <li>• Practice with friends to improve speed and accuracy.</li>
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
