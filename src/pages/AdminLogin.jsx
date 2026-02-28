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
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900">
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-gray-50 border border-gray-100 shadow-[8px_8px_15px_#d1d9e6,-8px_-8px_15px_#ffffff] overflow-hidden">
        
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
          Admin Portal
        </h1>

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
              placeholder=" "
              required
              className="peer w-full px-4 pt-6 pb-2 rounded-xl border border-gray-200 bg-gray-50 shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
            <label className="absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-gray-700 peer-focus:text-sm">
              Email
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full px-4 pt-6 pb-2 rounded-xl border border-gray-200 bg-gray-50 shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
            <label className="absolute left-4 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-gray-700 peer-focus:text-sm">
              Password
            </label>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 font-semibold text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="hover:underline text-blue-600"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl text-white font-semibold transition-all bg-linear-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 transform hover:scale-105 shadow-lg bg-size-[200%_200%] animate-[gradientMove_3s_ease_infinite]"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-3 mt-2 text-blue-700 font-semibold rounded-xl border border-blue-600 hover:bg-blue-50 transition-all"
          >
            Back to Home
          </button>
        </form>
      </div>

      {/* Gradient Animation */}
      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </div>
  );
}