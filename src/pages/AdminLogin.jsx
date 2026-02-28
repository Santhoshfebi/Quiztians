import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      // Optional: set persistence
      await supabase.auth.setSession({
        persistSession: rememberMe,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const role = data.user?.user_metadata?.role;

      if (role !== "admin" && role !== "superadmin") {
        alert("Access denied: Not an admin account");
        await supabase.auth.signOut();
        return;
      }

      navigate("/admin");
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password reset link sent to your email");
    }
  };

  return (
  <div className="relative flex items-center justify-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 overflow-hidden">

    {/* Background Glow Effects */}
<div className="absolute w-125 h-125 bg-purple-600/30 rounded-full blur-[120px] -top-40 -left-40" />
<div className="absolute w-100 h-100 bg-blue-600/30 rounded-full blur-[120px] -bottom-40 -right-40" />

    <div className="relative w-full max-w-md p-10 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">

      <h1 className="text-4xl font-extrabold text-center text-white tracking-wide mb-2">
        Admin Portal
      </h1>
      <p className="text-center text-gray-300 mb-8 text-sm">
        Secure access for administrators
      </p>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdminLogin();
        }}
      >
        {/* Email */}
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-300 hover:text-white transition"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between text-sm text-gray-300">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-purple-500"
            />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-purple-400 hover:text-purple-300 transition"
          >
            Forgot password?
          </button>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-linear-to-r from-purple-600 to-blue-600 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-purple-700/40 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition"
        >
          Back to Home
        </button>
      </form>
    </div>
  </div>
);
}