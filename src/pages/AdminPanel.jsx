import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

import { motion } from "framer-motion";
import CountUp from "react-countup";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import { roleThemes } from "../theme/roleTheme";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import SettingsIcon from "@mui/icons-material/Settings";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleIcon from "@mui/icons-material/People";

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const current = data.session?.user;

      if (!current) {
        navigate("/admin-login");
        return;
      }

      setUser(current);
      setLoading(false);
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    fetchResults();

    const channel = supabase
      .channel("results-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "results" },
        (payload) => {
          setActivity((prev) => [payload.new, ...prev.slice(0, 8)]);
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchResults = async () => {
    const { data } = await supabase.from("results").select("*");
    if (data) setRows(data);
  };

  const role = user?.user_metadata?.role || "admin";
  const theme = roleThemes[role];

  const chapterStats = useMemo(() => {
    const map = {};

    rows.forEach((r) => {
      if (!r.chapter) return;
      map[r.chapter] = (map[r.chapter] || 0) + 1;
    });

    return Object.entries(map).map(([chapter, count]) => ({
      chapter,
      participants: count,
    }));
  }, [rows]);

  const totalParticipants = rows.length;

  const avgScore = Math.round(
    rows.reduce((sum, r) => sum + (r.score || 0), 0) / (rows.length || 1),
  );

  const scoreDistribution = useMemo(() => {
    const buckets = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    rows.forEach((r) => {
      const s = r.score || 0;

      if (s <= 20) buckets["0-20"]++;
      else if (s <= 40) buckets["21-40"]++;
      else if (s <= 60) buckets["41-60"]++;
      else if (s <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    });

    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));
  }, [rows]);

  const COLORS = chapterStats.map(
    (_, i) => `hsl(${(i * 360) / chapterStats.length},60%,55%)`,
  );

  const navItems = [
    { label: "Dashboard", icon: <DashboardIcon />, route: "/admin" },
    { label: "Add", icon: <AddCircleIcon />, route: "/admin/add-questions" },
    {
      label: "Preview",
      icon: <QuestionAnswerIcon />,
      route: "/admin/preview-questions",
    },
    { label: "Quiz", icon: <PlayArrowIcon />, route: "/admin/preview-quiz" },
    { label: "Config", icon: <SettingsIcon />, route: "/admin/quiz-config" },
    { label: "Results", icon: <BarChartIcon />, route: "/admin/view-results" },
  ];

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div
      className={`relative min-h-screen ${theme.appBg} px-4 sm:px-6 lg:px-8 py-6 pb-32 overflow-hidden`}
    >
      {/* Background glow */}

      <div className="absolute -top-40 -left-40 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-purple-500/20 blur-[150px] rounded-full"></div>
      <div className="absolute top-60 -right-40 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-indigo-500/20 blur-[150px] rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1
              className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${theme.headingGradient} bg-clip-text text-transparent`}
            >
              Dashboard
            </h1>

            <p className={`text-xs sm:text-sm ${theme.textSecondary}`}>
              {user.email}
            </p>
          </div>

          <span
            className={`px-3 py-1 text-xs rounded-full border ${theme.badge}`}
          >
            {role.toUpperCase()}
          </span>
        </div>

        {/* Welcome */}

        <div className="p-5 sm:p-6 mb-10 rounded-2xl bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-blue-600/20 border border-white/10 backdrop-blur-xl">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Welcome back 👋
          </h2>

          <p className="text-xs sm:text-sm text-gray-300">
            Your quiz analytics look great today.
          </p>
        </div>

        {/* KPI Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          <MetricCard
            title="Participants"
            value={totalParticipants}
            icon={<PeopleIcon />}
            theme={theme}
            role={role}
          />
          <MetricCard
            title="Chapters"
            value={chapterStats.length}
            icon={<BarChartIcon />}
            theme={theme}
            role={role}
          />
          <MetricCard
            title="Average Score"
            value={avgScore}
            icon={<DashboardIcon />}
            theme={theme}
            role={role}
          />
        </div>

        {/* Charts */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
            <h3 className={`${theme.textPrimary} mb-4 text-sm sm:text-base`}>
              Chapter Distribution
            </h3>

            <div className="h-60 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chapterStats}
                    dataKey="participants"
                    nameKey="chapter"
                    innerRadius={40}
                    outerRadius={80}
                  >
                    {chapterStats.map((e, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl xl:col-span-2">
            <h3 className={`${theme.textPrimary} mb-4 text-sm sm:text-base`}>
              Score Distribution
            </h3>

            <div className="h-60 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />

                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Activity */}

        <div className="mt-10 p-5 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
          <h3 className={`${theme.textPrimary} mb-4 text-sm sm:text-base`}>
            Live Activity
          </h3>

          <div className="space-y-3">
            {activity.length === 0 && (
              <p className={theme.textSecondary}>No activity yet</p>
            )}

            {activity.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>

                <div className="flex-1">
                  <p className="text-sm text-white">{e.name}</p>

                  <p className="text-xs text-gray-400">{e.chapter}</p>
                </div>

                <span className="text-xs text-gray-500">now</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating Dock */}

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md sm:max-w-xl">
        <div
          className={`
      flex items-center justify-between
      px-2 sm:px-4 py-2
      rounded-2xl
      backdrop-blur-xl
      border border-white/10
      shadow-2xl
      ${theme.sidebarBg}
    `}
        >
          {navItems.map((item, i) => {
            const active = location.pathname === item.route;

            return (
              <button
                key={i}
                onClick={() => navigate(item.route)}
                className={`
            flex flex-col items-center justify-center
            flex-1
            py-1.5
            rounded-xl
            transition-all
            group
            ${
              active
                ? `bg-gradient-to-r ${theme.accentGradient} text-white`
                : `${theme.textPrimary} hover:bg-white/10`
            }
          `}
              >
                <div className="text-lg sm:text-xl transition-transform group-hover:scale-110">
                  {item.icon}
                </div>

                <span className="text-[9px] sm:text-[11px] mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/admin-login");
            }}
            className="flex flex-col items-center flex-1 text-red-400 py-1.5"
          >
            <LogoutIcon className="text-lg sm:text-xl" />
            <span className="text-[9px] sm:text-[11px] mt-0.5">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, theme, role }) {
  const iconColor =
  role === "superadmin"
    ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
    : "opacity-70";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={`${theme.surface} relative p-6 rounded-2xl border border-white/10 shadow-xl`}
    >
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 rounded-t-xl"></div>

      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs uppercase ${theme.textSecondary}`}>
          {title}
        </span>

        <div className={iconColor}>{icon}</div>
      </div>

      <h2 className={`text-4xl font-bold ${theme.textPrimary}`}>
        <CountUp end={value} duration={1.5} />
      </h2>
    </motion.div>
  );
}
