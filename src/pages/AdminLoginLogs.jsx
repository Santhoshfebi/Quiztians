import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { roleThemes } from "../theme/roleTheme";

export default function AdminLoginLogs() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/admin-login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("admin_login_logs")
        .select("*")
        .order("login_time", { ascending: false });

      if (!error && data) setLogs(data);

      setLoading(false);
    };

    init();
  }, [navigate]);

  const role = user?.user_metadata?.role || "admin";
  const theme = roleThemes[role];

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();

      const matchesSearch =
        log.email?.toLowerCase().includes(q) ||
        log.role?.toLowerCase().includes(q) ||
        log.status?.toLowerCase().includes(q) ||
        log.device?.toLowerCase().includes(q) ||
        log.browser?.toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" || log.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [logs, search, roleFilter]);

  const totalLogs = logs.length;
  const adminLogs = logs.filter((log) => log.role === "admin").length;
  const superAdminLogs = logs.filter((log) => log.role === "superadmin").length;
  const desktopLogs = logs.filter((log) => log.device === "Desktop").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
        Loading logs...
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen ${theme.appBg} px-4 sm:px-6 lg:px-8 py-6 overflow-hidden`}
    >
      <div className="absolute -top-40 -left-40 w-100 h-100 bg-purple-500/20 blur-[150px] rounded-full" />
      <div className="absolute top-60 -right-40 w-100 h-100 bg-indigo-500/20 blur-[150px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className={`text-2xl sm:text-3xl font-black bg-linear-to-r ${theme.headingGradient} bg-clip-text text-transparent`}
            >
              Admin Login Logs
            </h1>

            <p className={`text-xs sm:text-sm ${theme.textSecondary}`}>
              Track administrator login activity, device and browser.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/20 transition"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <LogStatCard title="Total Logins" value={totalLogs} />
          <LogStatCard title="Admin Logins" value={adminLogs} />
          <LogStatCard title="Superadmin Logins" value={superAdminLogs} />
          <LogStatCard title="Desktop Logins" value={desktopLogs} />
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search email, role, device, browser..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option className="bg-slate-900" value="all">
              All Roles
            </option>
            <option className="bg-slate-900" value="admin">
              Admin
            </option>
            <option className="bg-slate-900" value="superadmin">
              Superadmin
            </option>
          </select>
        </div>

        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/10 text-gray-300">
                <tr>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Login Time</th>
                  <th className="px-5 py-4">Device</th>
                  <th className="px-5 py-4">Browser</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      No login logs found
                    </td>
                  </tr>
                )}

                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="px-5 py-4 text-white">{log.email}</td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs ${theme.badge}`}
                      >
                        {log.role?.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {formatDate(log.login_time)}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {log.device || "Unknown"}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {log.browser || "Unknown"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${
                          log.status === "success"
                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        }`}
                      >
                        {log.status || "unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LogStatCard({ title, value }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl"
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-t-xl" />

      <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>

      <h2 className="text-3xl font-black text-white mt-2">
        <CountUp end={value} duration={1.2} />
      </h2>
    </motion.div>
  );
}