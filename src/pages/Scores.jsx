import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* -------------------------------- utils -------------------------------- */

const PAGE_SIZE = 10;

const formatTime = (seconds) => {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

/* -------------------------------- component -------------------------------- */

export default function Scores() {
  const [chapters, setChapters] = useState([]);
  const [chapter, setChapter] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  /* -------------------- fetch ALL chapters from results -------------------- */

  useEffect(() => {
    const fetchAllChapters = async () => {
      const { data, error } = await supabase
        .from("results")
        .select("chapter")
        .order("chapter", { ascending: true });

      if (error) {
        console.error("Error fetching chapters:", error.message);
        return;
      }

      const uniqueChapters = [
        ...new Set(data.map((row) => row.chapter).filter(Boolean)),
      ];

      setChapters(uniqueChapters);

      if (uniqueChapters.length > 0) {
        setChapter(uniqueChapters[0]);
      }
    };

    fetchAllChapters();
  }, []);

  /* -------------------- Navigate Back -------------------- */
  const navigate = useNavigate();

  /* -------------------- fetch leaderboard -------------------- */

  const fetchScores = async () => {
    if (!chapter) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("results")
      .select("id, name, score, time_taken, created_at")
      .eq("chapter", chapter);

    if (error) {
      console.error("Error fetching scores:", error.message);
      setLoading(false);
      return;
    }

    const sorted = [...data].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((a.time_taken ?? Infinity) !== (b.time_taken ?? Infinity))
        return (a.time_taken ?? Infinity) - (b.time_taken ?? Infinity);
      return new Date(a.created_at) - new Date(b.created_at);
    });

    setPlayers(sorted);
    setPage(1);
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();
  }, [chapter]);

  /* -------------------- realtime updates -------------------- */

  useEffect(() => {
    if (!chapter) return;

    const channel = supabase
      .channel("scores-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        (payload) => {
          if (payload.new?.chapter === chapter) fetchScores();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chapter]);

  /* -------------------- derived data -------------------- */

  const podium = players.slice(0, 3);
  const totalPages = Math.ceil(players.length / PAGE_SIZE);
  const paginated = players.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const stats = {
    attempts: players.length,
    highest: players[0]?.score ?? "—",
    avg:
      players.length > 0
        ? Math.round(players.reduce((s, p) => s + p.score, 0) / players.length)
        : "—",
    fastest:
      players.length > 0
        ? formatTime(
          Math.min(...players.map((p) => p.time_taken ?? Infinity))
        )
        : "—",
  };

  /* -------------------------------- render -------------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white px-6 py-10 flex justify-center">
      <div className="w-full max-w-7xl space-y-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <button
              onClick={() => navigate("/")}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium
        text-indigo-600 hover:text-indigo-800 transition"
            >
              ← Back to Home
            </button>

            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-700 to-sky-600 bg-clip-text text-transparent">
              Chapter Leaderboard
            </h1>
            <p className="text-slate-500 mt-1">
              Public performance overview
            </p>
          </div>

          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="w-full md:w-72 px-4 py-3 border border-indigo-200 rounded-xl bg-white
      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {chapters.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </header>


        {/* Stats */}
        {players.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat label="Participants" value={stats.attempts} tone="indigo" />
            <Stat label="Highest Score" value={stats.highest} tone="emerald" />
            <Stat label="Average Score" value={stats.avg} tone="sky" />
            <Stat label="Fastest Time" value={stats.fastest} tone="amber" />
          </section>
        )}

        {/* Podium */}
        {podium.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {podium.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.12 }}
                className={`rounded-2xl border bg-white p-6 text-center shadow-md ${i === 0
                    ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white scale-105"
                    : i === 1
                      ? "border-slate-300"
                      : "border-orange-300"
                  }`}
              >
                <div className="text-4xl mb-2">
                  {["🥇", "🥈", "🥉"][i]}
                </div>
                <div className="font-semibold text-slate-900">
                  {p.name}
                </div>
                <div className="text-emerald-600 font-extrabold text-lg mt-1">
                  {p.score}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  ⏱ {formatTime(p.time_taken)}
                </div>
              </motion.div>
            ))}
          </section>
        )}

        {/* Table */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <header className="px-6 py-4 border-b border-slate-200 flex justify-evenly bg-slate-50">
            <h2 className="font-semibold text-slate-900">
              All Participants
            </h2>
            <span className="text-sm text-slate-500">
              {players.length} records
            </span>
          </header>

          {loading && (
            <div className="p-8 text-center text-slate-500">
              Loading leaderboard…
            </div>
          )}

          {!loading && paginated.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No attempts yet for this chapter.
            </div>
          )}

          {paginated.length > 0 && (
            <>
              <table className="w-full text-sm">
                <thead className="bg-indigo-50 text-indigo-700">
                  <tr>
                    <th className="px-6 py-3 text-left">Rank</th>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-center">Score</th>
                    <th className="px-6 py-3 text-center">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p, i) => (
                    <tr key={p.id} className="border-t hover:bg-indigo-50/40">
                      <td className="px-6 py-3 font-medium">
                        #{(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="px-6 py-3">{p.name}</td>
                      <td className="px-6 py-3 text-center font-bold text-emerald-600">
                        {p.score}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {formatTime(p.time_taken)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-lg border border-slate-300
                      disabled:opacity-50 hover:bg-indigo-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-lg border border-slate-300
                      disabled:opacity-50 hover:bg-indigo-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/* -------------------- stat card -------------------- */

function Stat({ label, value, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${tones[tone]}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-2xl font-extrabold mt-1">
        {value}
      </div>
    </div>
  );
}
