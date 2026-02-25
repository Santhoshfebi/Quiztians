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

// Material UI Icons
import LogoutIcon from "@mui/icons-material/Logout";
import DownloadIcon from "@mui/icons-material/Download";
import QuizIcon from "@mui/icons-material/Quiz";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapterStats, setChapterStats] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  // Access control
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

  // Fetch participant stats
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
    (_, i) => `hsl(${(i * 360) / chapterStats.length}, 60%, 55%)`
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
      <p className="text-center mt-20 text-lg font-semibold text-gray-600">
        Loading admin dashboard...
      </p>
    );

  const quickActions = [
    {
      title: "Preview Quiz",
      desc: "View quiz for a selected chapter",
      icon: <QuizIcon fontSize="large" />,
      color: "bg-gradient-to-br from-yellow-400 to-yellow-500",
      route: "/admin/preview-quiz",
    },
    {
      title: "Preview Questions",
      desc: "View all questions",
      icon: <QuestionAnswerIcon fontSize="large" />,
      color: "bg-gradient-to-br from-orange-400 to-orange-500",
      route: "/admin/preview-questions",
    },
    {
      title: "Add Questions",
      desc: "Create new questions",
      icon: <AddCircleIcon fontSize="large" />,
      color: "bg-gradient-to-br from-blue-400 to-blue-500",
      route: "/admin/add-questions",
    },
    {
      title: "Quiz Configuration",
      desc: "Set quiz duration",
      icon: <SettingsIcon fontSize="large" />,
      color: "bg-gradient-to-br from-green-400 to-green-500",
      route: "/admin/quiz-config",
    },
    {
      title: "View Results",
      desc: "Preview and export CSV",
      icon: <BarChartIcon fontSize="large" />,
      color: "bg-gradient-to-br from-purple-400 to-purple-500",
      route: "/admin/view-results",
    },
  ];

  return (
    <div className="min-h-screen p-6 bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <h1 className="text-3xl font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow flex items-center gap-2"
            >
              <LogoutIcon className="transform hover:rotate-12 transition-transform duration-300" /> Logout
            </button>
          </div>
        </div>

        {/* Participants Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-3 sm:mb-0 text-center sm:text-left">
              Participants per Chapter
            </h2>

            <button
              onClick={handleDownloadChart}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow flex items-center gap-2"
            >
              <DownloadIcon className="transform hover:rotate-12 transition-transform duration-300" /> Download PNG
            </button>
          </div>

          {chapterStats.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div
                id="participantsChart"
                className="relative h-75 sm:h-100 w-full sm:w-2/3"
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
                          stroke={index === activeIndex ? "#2563EB" : "#fff"}
                          strokeWidth={index === activeIndex ? 3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} participants`} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-gray-400 text-sm">Total</p>
                  <p className="text-3xl sm:text-4xl font-bold text-gray-800">
                    {totalParticipants}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-1/3 flex flex-col items-start justify-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center sm:text-left">
                  Chapter Stats
                </h3>
                <ul className="w-full space-y-2 text-sm sm:text-base">
                  {chapterStats.map((ch, index) => (
                    <li
                      key={index}
                      onClick={() =>
                        setActiveIndex(activeIndex === index ? null : index)
                      }
                      className={`flex justify-between items-center px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all duration-300 transform ${
                        activeIndex === index
                          ? "bg-blue-50 border border-blue-400 text-blue-700 font-semibold scale-105"
                          : "bg-gray-50 hover:bg-gray-100 hover:scale-105"
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

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(card.route)}
              className={`${card.color} text-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg hover:shadow-2xl transform hover:scale-105 transition-transform duration-300 cursor-pointer`}
            >
              <div className="text-4xl mb-3 transform hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2 text-center">{card.title}</h2>
              <p className="text-center">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
