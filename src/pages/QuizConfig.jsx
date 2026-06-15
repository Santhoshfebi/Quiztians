import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import dayjs from "dayjs";
import { ArrowBack, Refresh } from "@mui/icons-material";
import AdminBottomDock from "../components/AdminBottomDock";
import { logAdminActivity } from "../utils/logAdminActivity";

export default function QuizConfig() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [allChapters, setAllChapters] = useState([]);
  const [activeChapters, setActiveChapters] = useState([]);
  const [configId, setConfigId] = useState(null);

  const [chapterCounts, setChapterCounts] = useState({});
  const [timeLeft, setTimeLeft] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  // ✅ AUTH
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (
        !currentUser ||
        !["admin", "superadmin"].includes(currentUser.user_metadata?.role)
      ) {
        toast.error("Access denied");
        navigate("/admin-login");
        return;
      }

      setUser(currentUser);
      await fetchChapters();
      setFetching(false);
    };

    init();
  }, [navigate]);

  // ✅ LOAD CONFIG AFTER CHAPTERS
  useEffect(() => {
    if (allChapters.length > 0) {
      fetchConfig();
    }
  }, [allChapters]);

  // ✅ COUNTDOWN (FULL FORMAT)
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(startTime);
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Quiz Started");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // ✅ FETCH CHAPTERS + COUNTS
  const fetchChapters = async () => {
    const { data } = await supabase.from("questions").select("chapter");

    if (data) {
      const counts = {};
      data.forEach((q) => {
        if (!q.chapter) return;
        counts[q.chapter] = (counts[q.chapter] || 0) + 1;
      });

      setAllChapters(Object.keys(counts));
      setChapterCounts(counts);
    }
  };

  // ✅ FETCH CONFIG
  const fetchConfig = async () => {
    const { data } = await supabase
      .from("quiz_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      setConfigId(data.id);
      setDuration(data.duration);
      setStartTime(dayjs(data.start_time).format("YYYY-MM-DDTHH:mm"));

      setActiveChapters(
        Array.isArray(data.active_chapters) ? data.active_chapters : [],
      );

      setLastSaved(data.updated_at || data.created_at);
    }
  };

  // ✅ SAVE CONFIG (LIVE LAST SAVED)
  const handleSave = async () => {
    setLoading(true);

    const payload = {
      duration: Number(duration),
      start_time: dayjs(startTime).toISOString(),
      active_chapters: activeChapters,
    };

    let response;

    if (configId) {
      response = await supabase
        .from("quiz_config")
        .update(payload)
        .eq("id", configId)
        .select()
        .single();
    } else {
      response = await supabase
        .from("quiz_config")
        .insert([payload])
        .select()
        .single();
    }

    if (response.error) {
  toast.error("Failed to save config");
} else {
  toast.success("Configuration saved!");

  // Activity Log
  await logAdminActivity({
    action: configId ? "UPDATE_CONFIG" : "CREATE_CONFIG",
    module: "Quiz Configuration",
    description: configId
      ? `Updated quiz configuration. Duration: ${duration} mins, Chapters: ${activeChapters.length}`
      : `Created quiz configuration. Duration: ${duration} mins, Chapters: ${activeChapters.length}`,
    targetId: response.data?.id,
    targetType: "quiz_config",
  });

  setLastSaved(response.data?.updated_at || new Date());

  if (!configId && response.data?.id) {
    setConfigId(response.data.id);
  }
}

    setLoading(false);
  };

  const toggleChapter = (chapter) => {
    setActiveChapters((prev) =>
      prev.includes(chapter)
        ? prev.filter((c) => c !== chapter)
        : [...prev, chapter],
    );
  };

  const toggleSelectAll = () => {
    setActiveChapters(
      activeChapters.length === allChapters.length ? [] : allChapters,
    );
  };

  const isFormValid = duration && startTime && activeChapters.length > 0;

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900">
        <p className="text-xl animate-pulse font-black bg-linear-to-r from-pink-600 to-indigo-800 bg-clip-text text-transparent">
          Loading Quiz Configuration...
        </p>
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 text-white pb-28">
        <Toaster position="top-right" />

        {/* HEADER */}
        <div className="max-w-6xl mx-auto px-4 py-8 flex justify-between items-center">
          <h1 className="text-3xl font-black bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Quiz Configuration
          </h1>

          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center gap-2"
          >
            <Refresh fontSize="small" />
            Refresh
          </button>
        </div>

        {/* STATS */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-5 gap-4 px-4 mb-6">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-300">Total Chapters</p>
            <p className="text-xl font-bold">{allChapters.length}</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-300">Active Chapters</p>
            <p className="text-xl font-bold">{activeChapters.length}</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-300">Start Time</p>
            <p className="text-xl font-bold">
              {startTime ? dayjs(startTime).format("DD MMM HH:mm") : "-"}
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-300">Countdown</p>
            <p className="text-lg font-bold text-pink-400">{timeLeft || "-"}</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-300">Last Saved</p>
            <p className="text-xs font-bold text-green-400">
              {lastSaved
                ? dayjs(lastSaved).format("DD MMM YYYY, HH:mm:ss")
                : "-"}
            </p>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Quiz Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl p-3 w-full text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl p-3 w-full text-white"
                />
              </div>
            </div>

            {/* CHAPTERS */}
            <div>
              <div className="flex justify-between mb-3">
                <h3 className="font-semibold">Select Chapters</h3>

                <button
                  onClick={toggleSelectAll}
                  className="text-sm px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  {activeChapters.length === allChapters.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
                {allChapters.map((ch) => {
                  const active = activeChapters.includes(ch);

                  return (
                    <button
                      key={ch}
                      onClick={() => toggleChapter(ch)}
                      className={`relative p-3 rounded-xl text-sm font-semibold transition-all
                      ${
                        active
                          ? "bg-linear-to-r from-pink-500 to-indigo-500 text-white shadow-lg"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {ch}

                      <span className="absolute top-1 right-2 text-xs bg-black/40 px-2 py-0.5 rounded-full">
                        {chapterCounts[ch] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={!isFormValid || loading}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 hover:scale-105 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Configuration"}
              </button>

              <button
                onClick={() => navigate("/admin")}
                className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                <ArrowBack fontSize="small" />
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <AdminBottomDock role={user?.user_metadata?.role} />
    </>
  );
}
