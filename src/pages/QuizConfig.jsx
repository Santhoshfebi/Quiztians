import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import dayjs from "dayjs";

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

  // ✅ Check if current user is admin/superadmin
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
        console.error("Auth check failed:", err);
        toast.error("Authentication failed");
      } finally {
        setFetching(false);
      }
    };

    init();
  }, [navigate]);

  // 📘 Fetch chapters dynamically
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
      console.error("Error fetching chapters:", err);
      toast.error("Failed to fetch chapters");
    }
  };

  // ⚙️ Fetch existing quiz config
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

        // Only keep chapters that exist in allChapters
        const cleanedChapters = Array.isArray(data.active_chapters)
          ? data.active_chapters.filter(ch => allChapters.includes(ch))
          : [];
        setActiveChapters(cleanedChapters);
      } else {
        setStartTime(dayjs().format("YYYY-MM-DDTHH:mm"));
        setActiveChapters([]); // no active chapters
      }
    } catch (err) {
      console.error("Error fetching config:", err);
      toast.error("Failed to load quiz configuration");
    }
  };

  // 💾 Save or update configuration
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
      console.error("Supabase save error:", err);
      toast.error(`❌ Failed to save config: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔘 Toggle chapter selection
  const toggleChapter = (chapter) => {
    setActiveChapters((prev) => {
      const set = new Set(prev);
      set.has(chapter) ? set.delete(chapter) : set.add(chapter);
      return [...set];
    });
  };

  // 🔘 Select All / Deselect All chapters
  const toggleSelectAll = () => {
    if (activeChapters.length === allChapters.length) {
      setActiveChapters([]);
    } else {
      setActiveChapters([...allChapters]);
    }
  };

  // ✅ Form validation
  const isFormValid =
    duration && Number(duration) > 0 &&
    startTime && startTime.trim() !== "" &&
    Array.isArray(activeChapters) && activeChapters.length > 0;

  // 🔹 Determine missing fields
  const missingFields = [];
  if (!duration || Number(duration) <= 0) missingFields.push("Duration");
  if (!startTime || startTime.trim() === "") missingFields.push("Start Time");
  if (!activeChapters || activeChapters.length === 0) missingFields.push("Active Chapters");

  // 🕒 Loading state
  if (fetching)
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <p className="text-lg font-semibold">Checking admin credentials...</p>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mt-4"></div>
      </div>
    );

  // 🧩 UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 p-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <div className="flex justify-evenly">
          <h1 className="text-2xl font-bold text-center text-blue-700">🧩 Quiz Configuration</h1>
          <button
            onClick={() => window.location.reload()}
            className="py-1 px-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        {/* Duration */}
        <div>
          <label className="block mb-1 font-medium text-red-600">* Quiz Duration (minutes)</label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Enter duration in minutes"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block mb-1 font-medium text-red-600">* Quiz Start Time</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Active Chapters */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block font-medium text-red-600">* Active Chapters</label>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm text-blue-600 hover:underline"
            >
              {activeChapters.length === allChapters.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
            {allChapters.length > 0 ? (
              allChapters.map((chapter) => (
                <label key={chapter} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeChapters.includes(chapter)}
                    onChange={() => toggleChapter(chapter)}
                    className="w-4 h-4"
                  />
                  <span>{chapter}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500">No chapters found</p>
            )}
          </div>
        </div>

        {/* Missing Fields Warning */}
        {!isFormValid && missingFields.length > 0 && (
          <p className="text-red-600 text-sm mt-1">
            Please fill: {missingFields.join(", ")}
          </p>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!isFormValid || loading}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${!isFormValid || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {loading ? "Saving..." : "Save Configuration"}
        </button>

        {/* Back Button */}
        <button
          onClick={() => navigate("/admin")}
          className="w-full py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all"
        >
          Back to Admin Panel
        </button>
      </div>
    </div>
  );
}
