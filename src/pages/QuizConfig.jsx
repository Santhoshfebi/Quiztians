import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

export default function QuizConfig() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(20);
  const [startTime, setStartTime] = useState("");
  const [activeChapters, setActiveChapters] = useState([]);
  const [allChapters, setAllChapters] = useState([]);
  const [configId, setConfigId] = useState(null);
  const [fetching, setFetching] = useState(true);

  // ✅ Check admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser || (currentUser.user_metadata.role !== "admin" && currentUser.user_metadata.role !== "superadmin")) {
        toast.error("Access denied");
        navigate("/admin-login");
        return;
      }

      setUser(currentUser);
      await fetchChapters();
      await fetchConfig();
      setFetching(false);
    };

    checkAdmin();
  }, [navigate]);

  // 📘 Fetch chapters dynamically from Supabase
  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("chapter")
      .order("chapter", { ascending: true });

    if (error) {
      console.error("Error fetching chapters:", error);
      toast.error("Failed to fetch chapters");
      return;
    }

    const uniqueChapters = [...new Set(data.map((q) => q.chapter))];
    setAllChapters(uniqueChapters);
  };

  // 🔄 Fetch current config and remove any leftover "Test" entries
  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from("quiz_config")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching config:", error);
      toast.error("Failed to fetch quiz configuration");
      return;
    }

    if (data) {
      setDuration(data.duration);
      setStartTime(new Date(data.start_time).toISOString().slice(0, 16));

      // 🔹 Clean activeChapters: remove any "Test" or invalid entries
      const cleanedChapters = (data.active_chapters || []).filter(
        (ch) => ch !== "Test" && ch !== null && ch !== undefined
      );
      setActiveChapters(cleanedChapters);

      setConfigId(data.id);
    } else {
      setStartTime(new Date().toISOString().slice(0, 16));
    }
  };

  // 💾 Save or update config
  const handleSaveConfig = async () => {
    if (!duration || !startTime) {
      toast.error("Please fill both duration and start time");
      return;
    }

    if (activeChapters.length === 0) {
      toast.error("Please select at least one active chapter");
      return;
    }

    setLoading(true);
    try {
      if (configId) {
        const { error } = await supabase
          .from("quiz_config")
          .update({
            duration,
            start_time: new Date(startTime).toISOString(),
            active_chapters: activeChapters, // only selected chapters
          })
          .eq("id", configId);
        if (error) throw error;
        toast.success("✅ Quiz configuration updated!");
      } else {
        const { data, error } = await supabase
          .from("quiz_config")
          .insert([{
            duration,
            start_time: new Date(startTime).toISOString(),
            active_chapters: activeChapters,
          }])
          .select()
          .single();
        if (error) throw error;
        setConfigId(data.id);
        toast.success("✅ Quiz configuration saved!");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapter) => {
    setActiveChapters((prev) =>
      prev.includes(chapter)
        ? prev.filter((ch) => ch !== chapter)
        : [...prev, chapter]
    );
  };

  if (fetching)
    return (
      <div className="flex flex-col items-center justify-center mt-20">
        <p className="text-lg font-semibold">Checking admin credentials...</p>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mt-4"></div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 p-4 relative">
      <Toaster position="top-right" />
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          🧩 Quiz Configuration
        </h1>

        {/* Duration */}
        <div>
          <label className="block mb-1 font-medium">Quiz Duration (minutes)</label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block mb-1 font-medium">Quiz Start Time</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Active Chapters */}
        <div>
          <label className="block mb-2 font-medium">Active Chapters</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
            {allChapters.map((chapter) => (
              <label key={chapter} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={activeChapters.includes(chapter)}
                  onChange={() => toggleChapter(chapter)}
                  className="w-4 h-4"
                />
                <span>{chapter}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveConfig}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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
