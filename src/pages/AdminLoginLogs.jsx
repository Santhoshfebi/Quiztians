import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { roleThemes } from "../theme/roleTheme";

export default function AdminLoginLogs() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

      if (!error && data) {
        setLogs(data);
      }

      setLoading(false);
    };

    init();
  }, [navigate]);

  const role = user?.user_metadata?.role || "admin";
  const theme = roleThemes[role];

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return <div className="p-20 text-center text-white">Loading logs...</div>;
  }

  return (
    <div
      className={`relative min-h-screen ${theme.appBg} px-4 sm:px-6 lg:px-8 py-6 overflow-hidden`}
    >
      <div className="absolute -top-40 -left-40 w-100 h-100 bg-purple-500/20 blur-[150px] rounded-full"></div>
      <div className="absolute top-60 -right-40 w-100 h-100 bg-indigo-500/20 blur-[150px] rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className={`text-2xl sm:text-3xl font-black bg-linear-to-r ${theme.headingGradient} bg-clip-text text-transparent`}
            >
              Admin Login Logs
            </h1>

            <p className={`text-xs sm:text-sm ${theme.textSecondary}`}>
              Track administrator login activity
            </p>
          </div>

          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-2 rounded-xl bg-white/10 text-white border border-white/10 hover:bg-white/20 transition"
          >
            Back
          </button>
        </div>

        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/10 text-gray-300">
                <tr>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Login Time</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      No login logs found
                    </td>
                  </tr>
                )}

                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="px-5 py-4 text-white">{log.email}</td>

                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full border text-xs ${theme.badge}`}>
                        {log.role?.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {formatDate(log.login_time)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                        {log.status}
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