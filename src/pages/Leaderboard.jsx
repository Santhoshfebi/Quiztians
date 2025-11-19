import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { name, phone, chapter, score, place } = state || {};

  const [topPlayers, setTopPlayers] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userScore, setUserScore] = useState(null);
  const [loading, setLoading] = useState(true);

  const userRef = useRef(null);

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

        setTopPlayers(data.slice(0, 15));

        const index = data.findIndex(
          (p) =>
            (phone && p.phone === phone) ||
            (name === p.name && place === p.place && Number(score) === Number(p.score))
        );

        if (index >= 0) {
          setUserRank(index + 1);
          setUserScore(data[index].score);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLeaderboard();

    return () => { mounted = false; };
  }, [chapter, name, phone, score, place]);

  useEffect(() => {
    if (userRef.current) {
      userRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [topPlayers, userRank]);

  const listVariant = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const itemVariant = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120, damping: 16 } } };

  const getMedal = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
        <div className="text-indigo-700 font-bold text-xl animate-pulse">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 md:p-10 bg-gradient-to-br from-indigo-100 via-sky-50 to-blue-100 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900">🏆 Leaderboard</h1>
        <h3 className="text-lg sm:text-xl text-slate-600 font-serif">
          Chapter: <span className="font-semibold text-slate-800">{chapter || "—"}</span>
        </h3>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-md"
        >
          Back
        </button>
      </div>

      <div className="w-full max-w-6xl lg:grid lg:grid-cols-3 gap-6">
        {/* Left: Scrollable leaderboard */}
        <div className="lg:col-span-2 flex flex-col bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg overflow-hidden">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-10 flex justify-between items-center font-semibold text-slate-800">
            <span>Rank</span>
            <span className="hidden sm:inline-flex">Player</span>
            <span>Score</span>
          </div>

          <motion.ul variants={listVariant} initial="hidden" animate="show" className="overflow-y-auto max-h-[520px]">
            {topPlayers.length === 0 && <li className="text-sm text-slate-500 text-center p-4">No players yet.</li>}

            {topPlayers.map((p, i) => {
              const rank = i + 1;
              const medal = getMedal(rank);
              const isCurrentUser =
                (phone && p.phone === phone) ||
                (name === p.name && place === p.place && Number(score) === Number(p.score));
              const highlight = isCurrentUser
                ? "bg-indigo-50 border-indigo-300 shadow-lg"
                : "bg-white border-b border-gray-200";

              return (
                <motion.li
                  key={p.id ?? `${p.name}-${i}`}
                  variants={itemVariant}
                  ref={isCurrentUser ? userRef : null}
                  className={`flex justify-between items-center p-4 ${highlight} hover:bg-indigo-50 transition rounded-r-xl`}
                >
                  <span className="text-lg">{medal}</span>
                  <span className="flex-1 ml-4 text-sm sm:text-base text-slate-800">{p.name} <span className="text-xs text-slate-500">({p.place || "—"})</span></span>
                  <span className="text-sm sm:text-base font-semibold text-emerald-600">{p.score}</span>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>

        {/* Right: Current user & tips */}
        <div className="flex flex-col gap-4 mt-4 lg:mt-0">
          {userRank && userRank > 15 && (
            <div
              ref={userRef}
              className="p-4 rounded-xl bg-indigo-50 border border-indigo-300 shadow-lg flex flex-col gap-2"
            >
              <p className="text-sm text-slate-500">Your Rank</p>
              <p className="text-lg font-semibold text-slate-800">#{userRank}</p>
              <p className="text-sm text-slate-700">{name} ({place || "—"})</p>
              <p className="text-lg font-bold text-emerald-600">{userScore}</p>
            </div>
          )}

          {/* Tips */}
          <div className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 shadow">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Tips to Improve</h4>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>Review incorrect answers immediately.</li>
              <li>Revisit chapter notes and retry quizzes periodically.</li>
              <li>Practice with friends to improve speed and accuracy.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
