import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function QuizConfig() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [duration, setDuration] = useState(20); // default 20 minutes
  const [startTime, setStartTime] = useState(""); // ISO string
  const [configId, setConfigId] = useState(null);

  // ✅ Check admin or superadmin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser || (currentUser.user_metadata.role !== "admin" && currentUser.user_metadata.role !== "superadmin")) {
        alert("Access denied");
        navigate("/admin-login");
        return;
      }

      setUser(currentUser);
      fetchConfig();
    };

    checkAdmin();
  }, [navigate]);

  // Fetch existing config (assuming only one row)
  const fetchConfig = async () => {
    const { data, error } = await supabase.from("quiz_config").select("*").limit(1).single();
    if (error && error.code !== "PGRST116") { // ignore no rows found
      console.error("Error fetching config:", error);
      return;
    }
    if (data) {
      setDuration(data.duration);
      setStartTime(new Date(data.start_time).toISOString().slice(0, 16));
      setConfigId(data.id);
    }
  };

  const handleSaveConfig = async () => {
    if (!duration || !startTime) {
      alert("Please fill both duration and start time");
      return;
    }

    setLoading(true);
    try {
      if (configId) {
        // Update existing config
        const { error } = await supabase.from("quiz_config").update({
          duration,
          start_time: new Date(startTime).toISOString(),
        }).eq("id", configId);
        if (error) throw error;
        alert("Quiz configuration updated!");
      } else {
        // Insert new config
        const { error } = await supabase.from("quiz_config").insert([{
          duration,
          start_time: new Date(startTime).toISOString(),
        }]);
        if (error) throw error;
        alert("Quiz configuration saved!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p className="text-center mt-20">Checking admin...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Quiz Configuration
        </h1>

        <div className="space-y-4">
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

          <div>
            <label className="block mb-1 font-medium">Quiz Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Save Configuration"}
        </button>

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
