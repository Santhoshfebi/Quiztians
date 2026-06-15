import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function AcceptAdminInvite() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleActivate = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!user) {
      toast.error("Invalid or expired invite link");
      return;
    }

    setSaving(true);
    const activateToast = toast.loading("Activating account...");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      const { error: adminUpdateError } = await supabase
        .from("admins")
        .update({
          invite_status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (adminUpdateError) throw adminUpdateError;

      toast.success("Account activated successfully", {
        id: activateToast,
      });

      setTimeout(() => {
        navigate("/admin-login");
      }, 1500);
    } catch (err) {
      toast.error(err.message || "Failed to activate account", {
        id: activateToast,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
        Checking invite...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 p-6">
      <Toaster position="top-right" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Accept Admin Invite
        </h1>

        <p className="text-center text-gray-300 text-sm mb-6">
          Set your password to activate your admin account.
        </p>

        <form onSubmit={handleActivate} className="space-y-5">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-white font-semibold bg-linear-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 transition disabled:opacity-60"
          >
            {saving ? "Activating..." : "Activate Account"}
          </button>
        </form>
      </div>
    </div>
  );
}