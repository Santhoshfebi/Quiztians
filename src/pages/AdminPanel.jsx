import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapterStats, setChapterStats] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  // ✅ Access control
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser) {
        toast.error("You must login first");
        navigate("/admin-login");
        return;
      }

      const role = currentUser.user_metadata?.role;
      if (role !== "admin" && role !== "superadmin") {
        toast.error("Access denied: admin only");
        await supabase.auth.signOut();
        navigate("/admin-login");
        return;
      }

      setUser(currentUser);
      setLoading(false);

      if (!sessionStorage.getItem("adminWelcomeToast")) {
        toast.success("Welcome to Admin Dashboard!");
        sessionStorage.setItem("adminWelcomeToast", "true");
      }
    };

    checkSession();
  }, [navigate]);

  // ✅ Fetch participant stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.from("results").select("chapter");
        if (error) throw error;

        const counts = {};
        data.forEach((row) => {
          if (row.chapter) counts[row.chapter] = (counts[row.chapter] || 0) + 1;
        });

        const formatted = Object.entries(counts).map(([chapter, participants]) => ({
          chapter,
          participants,
        }));

        setChapterStats(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load chapter stats.");
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("adminWelcomeToast");
    navigate("/admin-login");
  };

  const totalParticipants = chapterStats.reduce(
    (sum, c) => sum + c.participants,
    0
  );

  const COLORS = chapterStats.map(
    (_, i) => `hsl(${(i * 360) / chapterStats.length}, 70%, 55%)`
  );

  const handleDownloadChart = () => {
    const svg = document.querySelector("#participantsChart svg");
    if (!svg) return toast.error("Chart not found!");

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "participants_per_chapter.png";
      link.href = pngUrl;
      link.click();
    };

    img.src = url;
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-lg font-semibold">
        Loading admin dashboard...
      </p>
    );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-3xl font-bold text-blue-700">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-700">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Participants Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-10 relative">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-700 mb-3 sm:mb-0 text-center sm:text-left">
              Participants per Chapter
            </h2>

            <button
              onClick={handleDownloadChart}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              Download PNG
            </button>
          </div>

          {chapterStats.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Chart */}
              <div
                id="participantsChart"
                className="relative h-[300px] sm:h-[400px] w-full sm:w-2/3"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chapterStats}
                      dataKey="participants"
                      nameKey="chapter"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={3}
                      activeIndex={activeIndex}
                      onClick={(_, i) => setActiveIndex(i === activeIndex ? null : i)}
                      labelLine={false}
                      label={({ chapter }) => chapter}
                    >
                      {chapterStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index]}
                          stroke={index === activeIndex ? "#1E3A8A" : "#fff"}
                          strokeWidth={index === activeIndex ? 3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} participants`} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-gray-500 text-sm">Total</p>
                  <p className="text-3xl sm:text-4xl font-bold text-blue-700">
                    {totalParticipants}
                  </p>
                </div>
              </div>

              {/* Chapter list (mobile & desktop) */}
              <div className="w-full sm:w-1/3 flex flex-col items-start justify-center">
                <h3 className="text-lg font-semibold text-blue-700 mb-3 text-center sm:text-left">
                  Chapter Stats
                </h3>
                <ul className="w-full space-y-2 text-sm sm:text-base">
                  {chapterStats.map((ch, index) => (
                    <li
                      key={index}
                      onClick={() =>
                        setActiveIndex(activeIndex === index ? null : index)
                      }
                      className={`flex justify-between items-center px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all ${
                        activeIndex === index
                          ? "bg-blue-100 border border-blue-400 text-blue-700 font-semibold"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span>{ch.chapter}</span>
                      <span className="font-bold">{ch.participants}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">
              No results yet to display chart.
            </p>
          )}
        </div>

        {/* Admin Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Preview Quiz",
              desc: "View quiz for a selected chapter",
              color: "bg-yellow-500 hover:bg-yellow-600",
              route: "/admin/preview-quiz",
            },
            {
              title: "Preview Questions",
              desc: "View all questions in the database",
              color: "bg-orange-500 hover:bg-orange-600",
              route: "/admin/preview-questions",
            },
            {
              title: "Add Questions",
              desc: "Create new questions and assign chapters",
              color: "bg-blue-500 hover:bg-blue-600",
              route: "/admin/add-questions",
            },
            {
              title: "Quiz Configuration",
              desc: "Set quiz duration, start time, and active chapters",
              color: "bg-green-500 hover:bg-green-600",
              route: "/admin/quiz-config",
            },
            {
              title: "View / Download Results",
              desc: "Preview participants' scores and export CSV",
              color: "bg-purple-500 hover:bg-purple-600",
              route: "/admin/view-results",
            },
          ].map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(card.route)}
              className={`cursor-pointer ${card.color} text-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105`}
            >
              <h2 className="text-2xl font-bold mb-2">{card.title}</h2>
              <p className="text-center">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
