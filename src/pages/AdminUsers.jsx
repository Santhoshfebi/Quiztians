import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import toast, { Toaster } from "react-hot-toast";

export default function AdminUsers() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [admins, setAdmins] = useState([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [role, setRole] = useState("admin");

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/admin-login");
        return;
      }

      if (user.user_metadata?.role !== "superadmin") {
        navigate("/admin");
        return;
      }

      setCurrentUser(user);
      await fetchAdmins();
      setLoading(false);
    };

    checkAccess();
  }, [navigate]);

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    setAdmins(data || []);
  };

  const toggleAdminStatus = async (admin) => {
    if (admin.id === currentUser.id) {
      toast.error("You cannot disable your own account");
      return;
    }

    const newStatus = !admin.is_active;

    const { error } = await supabase
      .from("admins")
      .update({ is_active: newStatus })
      .eq("id", admin.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(newStatus ? "Admin enabled" : "Admin disabled");
    await fetchAdmins();
  };

  const deleteAdmin = async (admin) => {
    if (admin.id === currentUser.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${admin.full_name || admin.email}?`
    );

    if (!confirmed) return;

    const deleteToast = toast.loading("Deleting admin...");

    const { error } = await supabase
      .from("admins")
      .delete()
      .eq("id", admin.id);

    if (error) {
      toast.error(error.message, { id: deleteToast });
      return;
    }

    toast.success("Admin deleted", { id: deleteToast });
    await fetchAdmins();
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !tempPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (tempPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    const createToast = toast.loading("Creating admin...");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            full_name: fullName,
            role,
            current_login: null,
            previous_login: null,
          },
        },
      });

      if (error) throw error;

      const newUser = data.user;

      if (newUser) {
        const { error: insertError } = await supabase.from("admins").insert({
          id: newUser.id,
          full_name: fullName,
          email,
          role,
          is_active: true,
          created_by: currentUser.id,
        });

        if (insertError) throw insertError;
      }

      toast.success("Admin created successfully", {
        id: createToast,
      });

      setFullName("");
      setEmail("");
      setTempPassword("");
      setRole("admin");

      await fetchAdmins();
    } catch (err) {
      toast.error(err.message || "Failed to create admin", {
        id: createToast,
      });
    } finally {
      setCreating(false);
    }
  };

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.is_active).length;
  const disabledAdmins = admins.filter((a) => !a.is_active).length;
  const superAdmins = admins.filter((a) => a.role === "superadmin").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 p-6 text-white overflow-hidden">
      <Toaster position="top-right" />

      <div className="absolute -top-40 -left-40 w-100 h-100 bg-purple-500/20 blur-[150px] rounded-full" />
      <div className="absolute top-60 -right-40 w-100 h-100 bg-indigo-500/20 blur-[150px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Admin Management
            </h1>

            <p className="text-sm text-gray-400 mt-1">
              Create and manage administrator accounts.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Total Admins" value={totalAdmins} />
          <StatCard title="Active Admins" value={activeAdmins} />
          <StatCard title="Disabled Admins" value={disabledAdmins} />
          <StatCard title="Superadmins" value={superAdmins} />
        </div>

        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-5">Create New Admin</h2>

          <form onSubmit={handleCreateAdmin} className="grid gap-5">
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="password"
              placeholder="Temporary password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option className="bg-slate-900" value="admin">
                Admin
              </option>
              <option className="bg-slate-900" value="superadmin">
                Superadmin
              </option>
            </select>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 rounded-xl font-semibold text-white bg-linear-to-r from-pink-500 to-indigo-500 shadow-lg shadow-indigo-500/40 hover:shadow-pink-500/50 hover:scale-[1.01] transition-all disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Admin"}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-5">Admin Users</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-300 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {admins.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-6 px-4 text-center text-gray-400"
                    >
                      No admins found
                    </td>
                  </tr>
                )}

                {admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="border-b border-white/10 hover:bg-white/5 transition"
                  >
                    <td className="py-3 px-4 text-white">
                      {admin.full_name || "N/A"}
                    </td>

                    <td className="py-3 px-4 text-gray-300">{admin.email}</td>

                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs border border-indigo-400/40 text-indigo-300 bg-indigo-500/10">
                        {admin.role?.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${
                          admin.is_active
                            ? "bg-green-500/10 text-green-300 border-green-400/40"
                            : "bg-red-500/10 text-red-300 border-red-400/40"
                        }`}
                      >
                        {admin.is_active ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-400">
                      {admin.created_at
                        ? new Date(admin.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "N/A"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAdminStatus(admin)}
                          disabled={admin.id === currentUser.id}
                          className={`px-3 py-1 rounded-lg text-xs border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                            admin.is_active
                              ? "bg-red-500/10 text-red-300 border-red-400/40 hover:bg-red-500/20"
                              : "bg-green-500/10 text-green-300 border-green-400/40 hover:bg-green-500/20"
                          }`}
                        >
                          {admin.id === currentUser.id
                            ? "Current User"
                            : admin.is_active
                              ? "Disable"
                              : "Enable"}
                        </button>

                        {admin.id !== currentUser.id && (
                          <button
                            onClick={() => deleteAdmin(admin)}
                            className="px-3 py-1 rounded-lg text-xs border border-red-500/40 text-red-300 bg-red-500/10 hover:bg-red-500/20 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
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

function StatCard({ title, value }) {
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