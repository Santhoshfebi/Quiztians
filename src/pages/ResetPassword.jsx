import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [type, setType] = useState(""); // success or error

  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Recovery session active");
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setType("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setType("error");
      setMessage(error.message);
    } else {
      setType("success");
      setMessage("Password updated successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/admin-login");
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Reset Your Password
        </h1>

        <p className="text-center text-gray-300 text-sm mb-6">
          Enter a new secure password
        </p>

        {/* MESSAGE UI */}

        {message && (
          <div
            className={`mb-4 p-3 text-sm rounded-lg text-center ${
              type === "success"
                ? "bg-green-500/20 text-green-300 border border-green-400/40"
                : "bg-red-500/20 text-red-300 border border-red-400/40"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-6">
          <input
            type="password"
            placeholder="New Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold bg-linear-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 transition"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin-login")}
            className="w-full py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
