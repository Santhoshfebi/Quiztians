import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { roleThemes } from "../theme/roleTheme";

import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [chapterStats, setChapterStats] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // SESSION CHECK
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser) {
        navigate("/admin-login");
        return;
      }

      const role = currentUser.user_metadata?.role;
      if (role !== "admin" && role !== "superadmin") {
        await supabase.auth.signOut();
        navigate("/admin-login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkSession();
  }, [navigate]);

  // FETCH STATS
  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from("results").select("chapter");

      const counts = {};
      data?.forEach((row) => {
        if (row.chapter) {
          counts[row.chapter] = (counts[row.chapter] || 0) + 1;
        }
      });

      setChapterStats(
        Object.entries(counts).map(([chapter, participants]) => ({
          chapter,
          participants,
        })),
      );
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 px-4">
        <h2 className="text-center text-lg font-semibold text-gray-600 animate-pulse">
          Loading questions...
        </h2>
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
        />
      </div>
    );
  }

  const role = user.user_metadata.role;
  const theme = roleThemes[role];
  const isDark = role === "superadmin"; // ✅ ADD THIS

  const totalParticipants = chapterStats.reduce(
    (sum, c) => sum + c.participants,
    0,
  );

  const COLORS = chapterStats.map(
    (_, i) => `hsl(${(i * 360) / chapterStats.length}, 60%, 55%)`,
  );

  const navItems = [
    { label: "Dashboard", icon: <DashboardIcon />, route: "/admin" },
    {
      label: "Add Questions",
      icon: <AddCircleIcon />,
      route: "/admin/add-questions",
    },
    {
      label: "Preview Questions",
      icon: <QuestionAnswerIcon />,
      route: "/admin/preview-questions",
    },
    {
      label: "Quiz Config",
      icon: <SettingsIcon />,
      route: "/admin/quiz-config",
    },
    {
      label: "View Results",
      icon: <BarChartIcon />,
      route: "/admin/view-results",
    },
  ];

  return (
    <div
      className={`flex min-h-screen ${theme.appBg} relative overflow-hidden`}
    >
      <Toaster />

      {/* Ambient Glow */}
      <div
        className={`absolute w-175 h-175 rounded-full blur-[180px] -top-60 -right-60 ${theme.glow}`}
      />

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-50 top-0 left-0 h-full
          ${theme.sidebarBg}
          transition-all duration-300 flex flex-col
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* SuperAdmin Accent Strip */}
        {role === "superadmin" && (
          <div className="absolute top-0 right-0 h-full w-0.5g-gradient-to-b from-amber-400 to-orange-600 opacity-40" />
        )}

        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && (
            <h2
              className={`font-black text-lg bg-linear-to-r ${theme.headingGradient} bg-clip-text text-transparent`}
            >
              Admin Panel
            </h2>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden md:block ${theme.textPrimary}`}
          >
            {collapsed ? <MenuIcon /> : <CloseIcon />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className={`md:hidden ${theme.textPrimary}`}
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          {navItems.map((item, idx) => {
            const active = location.pathname === item.route;

            return (
              <button
                key={idx}
                onClick={() => {
                  navigate(item.route);
                  setMobileOpen(false);
                }}
                className={`
                  flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300
                  ${
                    active
                      ? `bg-linear-to-r ${theme.accentGradient} text-white shadow-lg`
                      : `hover:bg-white/10 ${theme.textPrimary}`
                  }
                  hover:-translate-y-0.5
                `}
              >
                {item.icon}
                {!collapsed && (
                  <span className={active ? "text-white" : theme.textPrimary}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/admin-login");
          }}
          className="flex items-center gap-3 p-4 text-red-500 hover:bg-red-500/10 transition"
        >
          <LogoutIcon />
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => setMobileOpen(true)} className="md:hidden">
            <MenuIcon />
          </button>

          <div>
            <h1
              className={`text-3xl font-black bg-linear-to-r ${theme.headingGradient} bg-clip-text text-transparent`}
            >
              Dashboard
            </h1>
            <p className={`text-sm ${theme.textSecondary}`}>{user.email}</p>
          </div>

          <span
            className={`px-3 py-1 text-xs rounded-full border ${theme.badge}`}
          >
            {role.toUpperCase()}
          </span>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div
            className={`p-6 rounded-2xl shadow-xl bg-linear-to-br ${theme.premiumCard} text-white hover:-translate-y-1 transition`}
          >
            <p className="text-sm opacity-80 uppercase tracking-wider">
              Participants
            </p>
            <h2 className="text-4xl font-extrabold mt-2">
              {totalParticipants}
            </h2>
          </div>

          <div
            className={`${theme.surface} p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition`}
          >
            <p
              className={`text-sm uppercase tracking-wider ${theme.textSecondary}`}
            >
              Chapters
            </p>
            <h2 className={`text-4xl font-bold mt-2 ${theme.textPrimary}`}>
              {chapterStats.length}
            </h2>
          </div>

          <div
            className={`${theme.surface} p-6 rounded-2xl shadow-xl hover:-translate-y-1 transition`}
          >
            <p
              className={`text-sm uppercase tracking-wider ${theme.textSecondary}`}
            >
              Role
            </p>
            <h2
              className={`text-4xl font-bold mt-2 capitalize ${theme.textPrimary}`}
            >
              {role}
            </h2>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* LEFT — PIE CHART */}
          <div className="h-105 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chapterStats}
                  dataKey="participants"
                  nameKey="chapter"
                  innerRadius={90}
                  outerRadius={150}
                  paddingAngle={3}
                  label={{
                    fill: isDark ? "#ffffff" : "#1f2937",
                    fontSize: 12,
                  }}
                >
                  {chapterStats.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: "1px solid",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    borderRadius: "8px",
                  }}
                  itemStyle={{
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                  labelStyle={{
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                  formatter={(v) => [`${v}`, "Participants"]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p
                className={
                  isDark ? "text-gray-400 text-sm" : "text-gray-500 text-sm"
                }
              >
                Total
              </p>
              <h2
                className={
                  isDark
                    ? "text-4xl font-bold text-white"
                    : "text-4xl font-bold text-gray-900"
                }
              >
                {chapterStats.reduce((sum, c) => sum + c.participants, 0)}
              </h2>
            </div>
          </div>

          {/* RIGHT — CHAPTER STATS */}
          <div className="max-h-105 overflow-y-auto pr-2">
            <h3
              className={
                isDark
                  ? "text-xl font-semibold mb-6 text-white"
                  : "text-xl font-semibold mb-6 text-gray-900"
              }
            >
              Chapter Stats
            </h3>

            <div className="space-y-3">
              {chapterStats
                .sort((a, b) => b.participants - a.participants)
                .map((item, index) => (
                  <div
                    key={index}
                    className={`
              flex justify-between items-center px-4 py-3 rounded-xl transition
              ${
                isDark
                  ? "bg-white/5 border border-white/10 hover:bg-white/10"
                  : "bg-gray-100 border border-gray-200 hover:bg-gray-200"
              }
            `}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      ></span>
                      <span className={isDark ? "text-white" : "text-gray-900"}>
                        {item.chapter}
                      </span>
                    </div>

                    <span
                      className={
                        isDark
                          ? "font-semibold text-white"
                          : "font-semibold text-gray-900"
                      }
                    >
                      {item.participants}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
