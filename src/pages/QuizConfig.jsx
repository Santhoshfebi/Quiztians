import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import dayjs from "dayjs";
import { ArrowBack, Refresh, AccessTime, Schedule, Layers, MenuBookRounded } from "@mui/icons-material";
import { Menu, Switch, Tooltip } from "@mui/material";

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

  useEffect(() => {
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentUser = data.session?.user;
        if (!currentUser || !["admin", "superadmin"].includes(currentUser.user_metadata?.role)) {
          toast.error("Access denied");
          navigate("/admin-login");
          return;
        }

        setUser(currentUser);
        await fetchChapters();
        await fetchConfig();
      } catch (err) {
        console.error(err);
        toast.error("Authentication failed");
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [navigate]);

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("chapter")
        .order("chapter", { ascending: true });
      if (error) throw error;

      const chapters = [...new Set(data.map((q) => q.chapter))].filter(Boolean);
      setAllChapters(chapters);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch chapters");
    }
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (data) {
        setConfigId(data.id);
        setDuration(data.duration);
        setStartTime(dayjs(data.start_time).format("YYYY-MM-DDTHH:mm"));
        const cleanedChapters = Array.isArray(data.active_chapters)
          ? data.active_chapters.filter(ch => allChapters.includes(ch))
          : [];
        setActiveChapters(cleanedChapters);
      } else {
        setStartTime(dayjs().format("YYYY-MM-DDTHH:mm"));
        setActiveChapters([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quiz configuration");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      duration: Number(duration),
      start_time: dayjs(startTime).toISOString(),
      active_chapters: activeChapters,
    };

    try {
      let response;
      if (configId) {
        response = await supabase.from("quiz_config").update(payload).eq("id", configId);
      } else {
        response = await supabase.from("quiz_config").insert([payload]).select().single();
      }
      if (response.error) throw response.error;

      toast.success(configId ? "✅ Configuration updated!" : "✅ Configuration saved!");
      if (!configId && response.data?.id) setConfigId(response.data.id);
    } catch (err) {
      console.error(err);
      toast.error(`❌ Failed to save config: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapter) => {
    setActiveChapters((prev) => {
      const set = new Set(prev);
      set.has(chapter) ? set.delete(chapter) : set.add(chapter);
      return [...set];
    });
  };

  const toggleSelectAll = () => {
    setActiveChapters(activeChapters.length === allChapters.length ? [] : [...allChapters]);
  };

  const isFormValid =
    duration && Number(duration) > 0 &&
    startTime && startTime.trim() !== "" &&
    Array.isArray(activeChapters) && activeChapters.length > 0;

  const missingFields = [];
  if (!duration || Number(duration) <= 0) missingFields.push("Duration");
  if (!startTime || startTime.trim() === "") missingFields.push("Start Time");
  if (!activeChapters || activeChapters.length === 0) missingFields.push("Active Chapters");

  if (fetching) return (
    <div className="flex flex-col items-center justify-center mt-20">
      <p className="text-lg font-semibold text-blue-700">Checking admin credentials...</p>
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mt-4"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 flex items-center gap-2 text-center sm:text-left">
          Quiz Configuration
        </h1>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 py-1 px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
        >
          <Refresh fontSize="small" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center border-t-4 border-blue-600">
          <Layers className="text-blue-500 mb-2" />
          <span className="font-semibold text-gray-600 text-sm text-center">Total Chapters</span>
          <span className="text-xl font-bold text-blue-700">{allChapters.length}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center border-t-4 border-green-500">
          <MenuBookRounded className="text-blue-500 mb-2" />
          <span className="font-semibold text-gray-600 text-sm text-center">Active Chapters</span>
          <span className="text-xl font-bold text-green-700">{activeChapters.length}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center border-t-4 border-purple-500">
          <Schedule className="text-purple-500 mb-2" />
          <span className="font-semibold text-gray-600 text-sm text-center">Next Quiz Start</span>
          <span className="text-xl font-bold text-purple-700 text-center">
            {startTime ? dayjs(startTime).format("DD MMM YYYY, HH:mm") : "-"}
          </span>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="w-full max-w-3xl bg-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 border-t-8 border-blue-600">
        {/* Duration */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <AccessTime className="text-blue-500" />
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="* Quiz Duration (minutes)"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Start Time */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Schedule className="text-blue-500" />
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Active Chapters */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700">Active Chapters</span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm text-blue-600 hover:underline"
            >
              {activeChapters.length === allChapters.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
            {allChapters.length > 0 ? (
              allChapters.map((chapter) => (
                <Tooltip key={chapter} title={`Chapter: ${chapter}`} arrow>
                  <div className="flex justify-between items-center p-1 bg-blue-50 rounded-lg">
                    <span className="truncate">{chapter}</span>
                    <Switch
                      checked={activeChapters.includes(chapter)}
                      onChange={() => toggleChapter(chapter)}
                      color="primary"
                      size="small"
                    />
                  </div>
                </Tooltip>
              ))
            ) : (
              <p className="text-sm text-gray-500">No chapters found</p>
            )}
          </div>
        </div>

        {/* Missing Fields */}
        {!isFormValid && missingFields.length > 0 && (
          <p className="text-red-600 text-sm mt-1">
            Please fill: {missingFields.join(", ")}
          </p>
        )}

        {/* Save & Back Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={!isFormValid || loading}
            className={`flex-1 py-2 rounded-xl text-white font-semibold transition-all ${!isFormValid || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="flex-1 py-2 bg-gray-400 text-white rounded-xl hover:bg-gray-500 transition-all flex items-center justify-center gap-2"
          >
            <ArrowBack fontSize="small" /> Back to Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}
