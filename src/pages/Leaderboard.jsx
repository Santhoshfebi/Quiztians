import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Leaderboard() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { name, phone, chapter, score, place } = state || {};

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

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins} min ${secs} sec` : `${secs} sec`;
  };

  const Badge = ({ type }) => {
    const styles = {
      high: "bg-amber-100 text-amber-700",
      fast: "bg-emerald-100 text-emerald-700",
    };
    const labels = {
      high: "High Score",
      fast: "Fastest",
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] rounded-md font-semibold ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  // -------------------------------
  // UPDATED SkillBadge (unchanged logic)
  // -------------------------------

  const SkillBadge = ({ score = 0, total = 1 }) => {
    const pct = (score / total) * 100;

    let label = "Bronze";
    let color = "from-orange-300 to-orange-100";
    let icon = "🥉";

    if (pct >= 90) {
      label = "Legend";
      color = "from-purple-400 to-purple-200";
      icon = "🏆";
    } else if (pct >= 75) {
      label = "Champion";
      color = "from-amber-400 to-amber-200";
      icon = "🥇";
    } else if (pct >= 55) {
      label = "Gold";
      color = "from-yellow-300 to-yellow-100";
      icon = "🥇";
    } else if (pct >= 35) {
      label = "Silver";
      color = "from-slate-200 to-slate-50";
      icon = "🥈";
    }

    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm bg-gradient-to-r ${color} shadow`}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>
    );
  };

  // -------------------------------
  // Fetch total questions in chapter (AUTO-DETECT totalScore)
  // -------------------------------

  useEffect(() => {
    if (!chapter) return;

    const fetchTotalQuestions = async () => {
      const { count, error } = await supabase
        .from("questions")
        .select("*", { head: true, count: "exact" })
        .eq("chapter", chapter);

      if (error) {
        console.error("Error fetching total questions:", error);
        return;
      }

      setTotalScore(count || 0);
    };

    fetchTotalQuestions();
  }, [chapter]);

  // -------------------------------
  // Leaderboard fetch logic (unchanged)
  // -------------------------------

  useEffect(() => {
    if (!state) navigate(-1);
  }, [state, navigate]);

  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard = async () => {
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
        const { data, error } = await supabase
          .from("results")
          .select("id, name, place, phone, score, time_taken, created_at")
          .eq("chapter", chapter);

        if (error) throw error;
        if (!mounted) return;

        const sorted = [...(data || [])].sort((a, b) => {
          if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
          const at = a.time_taken ?? Infinity;
          const bt = b.time_taken ?? Infinity;
          if (at !== bt) return at - bt;
          return new Date(a.created_at) - new Date(b.created_at);
        });

        setPlayers(sorted);
        setTop3(sorted.slice(0, 3));
        setNextPlayers(sorted.slice(3, 20));

        const index = sorted.findIndex((p) => {
          if (phone && p.phone === phone) return true;
          if (name && p.name === name && place === p.place && Number(score) === Number(p.score))
            return true;
          return false;
        });

        if (index >= 0) {
          setUserRank(index + 1);
          setUserScore(sorted[index].score ?? null);
          setUserTime(sorted[index].time_taken ?? null);
        } else {
          setUserRank(null);
          setUserScore(null);
          setUserTime(null);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLeaderboard();
    return () => (mounted = false);
  }, [chapter, name, phone, score, place]);

  // -------------------------------
  // Best stats logic (unchanged)
  // -------------------------------

  useEffect(() => {
    let mounted = true;
    const fetchUserBestForChapter = async () => {
      if (!chapter) {
        if (mounted) setBestStats({ bestScore: null, bestTime: null, attempts: 0 });
        return;
      }

      try {
        let query = supabase.from("results").select("score, time_taken").eq("chapter", chapter);
        if (phone) query = query.eq("phone", phone);
        else if (name) query = query.eq("name", name).eq("place", place);
        else {
          if (mounted) setBestStats({ bestScore: null, bestTime: null, attempts: 0 });
          return;
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!mounted) return;

        const attempts = data?.length || 0;
        const bestScore = attempts ? Math.max(...data.map((d) => d.score || 0)) : null;
        const bestTime =
          attempts && Math.min(...data.map((d) => (d.time_taken === null ? Infinity : d.time_taken)));

        if (mounted) {
          setBestStats({
            bestScore: bestScore !== -Infinity ? bestScore : null,
            bestTime: bestTime === Infinity ? null : bestTime,
            attempts,
          });
        }
      } catch (err) {
        console.error("Error fetching user best stats:", err);
        if (mounted) setBestStats({ bestScore: null, bestTime: null, attempts: 0 });
      }
    };

    fetchUserBestForChapter();
    return () => (mounted = false);
  }, [chapter, phone, name, place]);

  useEffect(() => {
    if (userRef.current) {
      try {
        userRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch { }
    }
  }, [top3, nextPlayers, userRank]);

  const initials = (fullName = "") => {
    if (!fullName) return "A";
    const parts = fullName.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const podiumVariant = {
    hidden: { opacity: 0, y: 20 },
    show: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.12 * i, type: "spring", stiffness: 140, damping: 16 },
    }),
  };

  const listItemVariant = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120, damping: 16 } },
  };

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

  const highestScore = players[0]?.score ?? null;
  const fastestTime = players.length
    ? Math.min(...players.map((p) => p.time_taken ?? Infinity))
    : null;

    const fastestPerScore = {};
players.forEach((p) => {
  if (p.score > 0 && p.time_taken != null) {
    if (!fastestPerScore[p.score] || p.time_taken < fastestPerScore[p.score]) {
      fastestPerScore[p.score] = p.time_taken;
    }
  }
});


  return (
    <div className="min-h-screen w-full p-6 md:p-10 bg-gradient-to-br from-indigo-100 via-sky-50 to-blue-100 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center gap-3">
            <span className="text-2xl">🏆</span>Leaderboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Chapter: <span className="font-semibold text-slate-800">{chapter ?? "—"}</span>
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-shadow shadow"
        >
          ← Back
        </button>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Podium + list */}
        <div className="lg:col-span-2 space-y-6">

          <div className="w-full bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-4 sm:p-6 lg:p-8">

            <div
              className="
          grid 
          grid-cols-3 
          gap-3 sm:gap-6  
          max-w-5xl mx-auto
        "
            >

              {/* ---------------- 2nd Place ---------------- */}
              <motion.div
                custom={1}
                initial="hidden"
                animate="show"
                variants={podiumVariant}
                className="flex flex-col items-center space-y-2 sm:space-y-3"
              >
                {/* Avatar Glow */}
                <div className="relative">
                  <div className="absolute inset-0 bg-slate-300/20 blur-xl sm:blur-2xl rounded-full" />
                  <div
                    className="
                rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl
                flex items-center justify-center font-bold text-slate-900
                w-16 h-16 text-lg
                sm:w-24 sm:h-24 sm:text-xl
                lg:w-32 lg:h-32 lg:text-2xl
              "
                  >
                    {initials(top3[1]?.name)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs sm:text-sm text-slate-700 opacity-80">2nd</div>
                  <div className="font-semibold text-slate-900 text-sm sm:text-base">
                    {top3[1]?.name || "—"}
                  </div>
                  <div className="text-emerald-600 font-bold text-sm sm:text-base">
                    {top3[1]?.score || "—"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">
                    ⏱ {formatTime(top3[1]?.time_taken)}
                  </div>

                  <div className="flex justify-center mt-1 gap-1">
                    {top3[1]?.score === highestScore && <Badge type="high" />}
                    {top3[1]?.time_taken === fastestTime && <Badge type="fast" />}
                  </div>
                </div>

                <div
                  className="
              w-12 h-6 sm:w-20 sm:h-10 lg:w-24 lg:h-12 
              rounded-t-lg bg-white/20 backdrop-blur-lg border border-white/40 
              flex items-center justify-center shadow
            "
                >
                  <span className="text-sm sm:text-lg">🥈</span>
                </div>
              </motion.div>

              {/* ---------------- 1st Place ---------------- */}
              <motion.div
                custom={0}
                initial="hidden"
                animate="show"
                variants={podiumVariant}
                className="flex flex-col items-center space-y-2 sm:space-y-3"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-300/30 blur-xl sm:blur-3xl rounded-full animate-pulse" />
                  <div
                    className="
                rounded-full bg-white/40 backdrop-blur-xl border border-amber-300 shadow-2xl
                flex items-center justify-center font-extrabold text-amber-900
                w-20 h-20 text-xl
                sm:w-28 sm:h-28 sm:text-2xl
                lg:w-44 lg:h-44 lg:text-3xl
              "
                  >
                    {initials(top3[0]?.name)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs sm:text-sm text-slate-700 opacity-80">1st</div>
                  <div className="text-base sm:text-xl text-slate-900 font-extrabold">
                    {top3[0]?.name || "—"}
                  </div>
                  <div className="text-emerald-600 font-bold text-sm sm:text-lg">
                    {top3[0]?.score || "—"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">
                    ⏱ {formatTime(top3[0]?.time_taken)}
                  </div>

                  <div className="flex justify-center mt-1 gap-1">
                    {top3[0]?.score === highestScore && <Badge type="high" />}
                    {top3[0]?.score > 0 && top3[0]?.time_taken !== null && fastestPerScore[top3[0].score] === top3[0].time_taken && <Badge type="fast" />}
                  </div>
                </div>

                <div
                  className="
              w-16 h-8 
              sm:w-28 sm:h-14 
              lg:w-32 lg:h-16
              rounded-t-lg bg-amber-100/20 backdrop-blur-lg border border-amber-200/40 
              flex items-center justify-center shadow
            "
                >
                  <span className="text-base sm:text-2xl">🥇</span>
                </div>
              </motion.div>

              {/* ---------------- 3rd Place ---------------- */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="show"
                variants={podiumVariant}
                className="flex flex-col items-center space-y-2 sm:space-y-3"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-300/20 blur-xl sm:blur-2xl rounded-full" />
                  <div
                    className="
                rounded-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl
                flex items-center justify-center font-bold text-slate-900
                w-14 h-14 text-sm
                sm:w-20 sm:h-20 sm:text-lg
                lg:w-28 lg:h-28 lg:text-xl
              "
                  >
                    {initials(top3[2]?.name)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs sm:text-sm text-slate-700 opacity-80">3rd</div>
                  <div className="font-semibold text-slate-900 text-sm sm:text-base">
                    {top3[2]?.name || "—"}
                  </div>
                  <div className="text-emerald-600 font-bold text-sm sm:text-base">
                    {top3[2]?.score || "—"}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">
                    ⏱ {formatTime(top3[2]?.time_taken)}
                  </div>

                  <div className="flex justify-center mt-1 gap-1">
                    {top3[2]?.score === highestScore && <Badge type="high" />}
                    {top3[2]?.time_taken === fastestTime && <Badge type="fast" />}
                  </div>
                </div>

                <div
                  className="
              w-10 h-5 sm:w-16 sm:h-8 lg:w-20 lg:h-10 
              rounded-t-lg bg-white/20 backdrop-blur-lg border border-white/40 
              flex items-center justify-center shadow
            "
                >
                  <span className="text-sm sm:text-lg">🥉</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Rest of leaderboard (4..15) */}
          <motion.ul initial="hidden" animate="show" className="bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl shadow p-4 space-y-2 max-h-[520px] overflow-auto">
            {nextPlayers.length === 0 && <li className="text-sm text-slate-500 p-4 text-center">No other players yet.</li>}

            {nextPlayers.map((p, idx) => {
              const rank = idx + 4; 
              const isCurrentUser =
                (phone && p.phone === phone) ||
                (name && p.name === name && place === p.place && Number(score) === Number(p.score));

              const liClass = isCurrentUser
                ? "bg-indigo-50 border border-indigo-200 shadow-inner rounded-lg"
                : "bg-white border border-gray-100 rounded-lg";

              const isHighScore = p.score === highestScore;
              const isFastest = p.time_taken === fastestTime;

              return (
                <motion.li key={p.id} variants={listItemVariant} className={`${liClass} flex items-center gap-4 p-3`} ref={isCurrentUser ? userRef : null}>
                   <div className="text-xs text-slate-500 ml-2">#{rank}</div>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-800">
                    {initials(p.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-800 truncate flex items-center gap-1">
                        {p.name}
                        {isHighScore && <Badge type="high" />}
                        {p.score > 0 && p.time_taken !== null && fastestPerScore[p.score] === p.time_taken && <Badge type="fast" />}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{p.place || "—"}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-600">{p.score}</div>
                    <div className="text-xs text-slate-500">⏱ {formatTime(p.time_taken)}</div>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>

        {/* Right: Current user card */}
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/30 p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-extrabold text-indigo-800">
                {initials(name)}
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-500">You</div>
                <div className="text-lg font-bold text-slate-900 truncate">{name || "—"}</div>
                <div className="text-sm text-slate-600">{place || "—"}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Rank</div>
                <div className="text-2xl font-extrabold text-indigo-800">{userRank ?? "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Score</div>
                <div className="text-2xl font-extrabold text-emerald-600">{userScore ?? "—"}</div>
                <div className="text-xs text-slate-500 mt-1">⏱ {formatTime(userTime)}</div>
              </div>
            </div>

            <div className="flex gap-2 mt-2 items-center">
             
              <SkillBadge score={userScore} total={totalScore} />

              {userScore > 0 && userScore === highestScore && <Badge type="high" />}
              {userScore > 0 && userTime != null && fastestPerScore[userScore] === userTime && <Badge type="fast" />}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/30 p-4 shadow">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Tips to Climb</h3>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-2">
              <li>Review incorrect answers immediately.</li>
              <li>Retry the chapter quizzes weekly.</li>
              <li>Time your practice sessions to increase speed.</li>
            </ul>
          </div>

          {/* Best performance summary of the user for this Particular chapter*/}
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/30 p-4 shadow">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Your best performance (this chapter)</h3>
            <div className="text-sm text-slate-700 space-y-1">
              <div>
                <span className="font-semibold">Best Score:</span>{" "}
                <span className="text-slate-900">{bestStats?.bestScore ?? "—"}</span>
              </div>
              <div>
                <span className="font-semibold">Best Time:</span>{" "}
                <span className="text-slate-900">{bestStats?.bestTime !== null ? formatTime(bestStats.bestTime) : "—"}</span>
              </div>
              <div>
                <span className="font-semibold">Attempts:</span>{" "}
                <span className="text-slate-900">{bestStats?.attempts ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl border border-white/30 p-3 text-sm text-slate-600 shadow-inner">
            <strong>Note:</strong> Ties are resolved by score → time → earliest submission.
          </div>
        </div>
      </div>
    </div>
  );
}
