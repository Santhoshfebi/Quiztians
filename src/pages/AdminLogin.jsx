import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../supabaseClient";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleAdminLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    const loginToast = toast.loading("Signing in...");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const role = data.user?.user_metadata?.role;

      if (role !== "admin" && role !== "superadmin") {
        toast.error("Access denied: Not an admin account", { id: loginToast });
        await supabase.auth.signOut();
        return;
      }

      toast.success("Login successful!", { id: loginToast });

      setLoginSuccess(true);

      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (err) {
      toast.error(err.message, { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 p-6 relative overflow-hidden"
    >
      {/* TOAST */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(30,27,75,0.8)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
          },
        }}
      />

      {/* SUCCESS CHECKMARK ANIMATION */}

      {loginSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center"
          >
            <svg width="120" height="120" viewBox="0 0 120 120">
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke="#22c55e"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="314"
                strokeDashoffset="314"
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 0.6 }}
              />

              <motion.path
                d="M35 65 L55 80 L85 40"
                stroke="#22c55e"
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="100"
                strokeDashoffset="100"
                animate={{ strokeDashoffset: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              />
            </svg>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-white text-lg font-semibold mt-4"
            >
              Login Successful
            </motion.p>
          </motion.div>
        </motion.div>
      )}

      {/* FLOATING ORBS */}

      <motion.div
        className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-[120px]"
        animate={{ y: [0, -40, 0], x: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <motion.div
        className="absolute w-72 h-72 bg-indigo-500/30 rounded-full blur-[120px] bottom-0 right-0"
        animate={{ y: [0, 50, 0], x: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      />

      {/* PARTICLES */}

      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-4 bg-purple-400/40 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: ["0%", "100%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1 + Math.random() * 5,
            repeat: Infinity,
          }}
        />
      ))}

      {/* MAIN CARD */}

      <div className="relative w-full max-w-6xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
        {/* LEFT PANEL */}

        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative bg-linear-to-br from-indigo-900 to-purple-900 text-white p-14 flex flex-col justify-center"
        >
          <h1 className="text-2xl sm:text-4xl font-black mb-6 bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-size-[200%_200%] bg-clip-text text-transparent animate-gradient">
            QUIZTIANS
          </h1>

          <h3 className="text-sm font-serif mb-6 opacity-80">ADMIN PORTAL</h3>

          <p className="text-sm opacity-80 max-w-sm">
            Secure access to the administration dashboard. Manage users,
            analytics and Quiz settings.
          </p>

          <div className="absolute w-64 h-64 bg-purple-500 rounded-full -bottom-32 -left-32 opacity-40 blur-2xl" />
          <div className="absolute w-36 h-36 bg-indigo-500 rounded-full bottom-16 left-40 opacity-40 blur-2xl" />
        </motion.div>

        {/* WAVE DIVIDER */}

        <div className="hidden md:block absolute left-1/2 top-0 h-full -translate-x-1/2">
          <motion.svg
            viewBox="0 0 200 800"
            className="h-full"
            initial={{ x: -60 }}
            animate={{ x: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.path
              d="M0 0C120 150 120 650 0 800L200 800L200 0Z"
              fill="#4A148C"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
            />
          </motion.svg>
        </div>

        {/* RIGHT PANEL */}

        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-black-900/10 backdrop-blur-xl border border-purple-900/20 p-14 flex flex-col justify-center"
        >
          <h2 className="text-3xl font-bold text-white mb-2">Sign in</h2>

          <p className="text-gray-300 text-sm mb-8">Administrator access</p>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleAdminLogin();
            }}
          >
            {/* EMAIL */}

            <div className="relative">
              <User size={18} className="absolute left-3 top-3 text-gray-400" />

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* PASSWORD */}

            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* REMEMBER + FORGOT */}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-indigo-400 text-xs hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white bg-linear-to-r from-pink-500 to-indigo-500 shadow-lg shadow-indigo-500/40 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all duration-300"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {/* DIVIDER */}

            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <div className="flex-1 h-px bg-gray-500" />
              or
              <div className="flex-1 h-px bg-gray-500" />
            </div>

            {/* OTHER LOGIN */}

            <button
              type="button"
              className="w-full py-3 border border-white/20 rounded-lg text-gray-300 hover:bg-white/10 transition"
            >
              Sign in with other
            </button>

            <p className="text-xs text-center text-gray-400">
              Don't have an account?
              <span className="text-indigo-400 ml-1 cursor-pointer">
                Sign Up
              </span>
            </p>
          </form>
          {/* <button
            onClick={() => navigate("/")}
            className="rounded-2xl font-bold bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-xl hover:scale-105 transition"
          >
            Back to landing
          </button> */}
        </motion.div>
      </div>
    </motion.div>
  );
}
