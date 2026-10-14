import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../supabaseClient";

// ===========================================================
// BRAND ASSETS
// ===========================================================

const Q_LOGO = "../../../branding/quiztians-q.png";
const WORDMARK_LOGO = "/branding/quiztians-wordmark.png";

export default function AdminLogin() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [loginSuccess, setLoginSuccess] = useState(false);

  // =========================================================
  // CHECK EXISTING SESSION
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const role = session.user?.user_metadata?.role;

          if (role === "admin" || role === "superadmin") {
            navigate("/admin");
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // =========================================================
  // BROWSER
  // =========================================================

  const getBrowser = () => {
    const ua = navigator.userAgent;

    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";

    return "Unknown";
  };

  // =========================================================
  // COMPLETE ADMIN LOGIN
  // =========================================================

  const completeAdminLogin = async (currentUser, loginToast) => {
    const role = currentUser?.user_metadata?.role;

    // -------------------------------------------------------
    // ROLE CHECK
    // -------------------------------------------------------

    if (role !== "admin" && role !== "superadmin") {
      toast.error("Access denied: Not an admin account", {
        id: loginToast,
      });

      await supabase.auth.signOut();
      return;
    }

    // -------------------------------------------------------
    // ADMIN RECORD CHECK
    // -------------------------------------------------------

    const { data: adminRecord, error: adminCheckError } = await supabase
      .from("admins")
      .select("is_active, invite_status")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (adminCheckError) {
      throw adminCheckError;
    }

    // -------------------------------------------------------
    // DISABLED ADMIN
    // -------------------------------------------------------

    if (adminRecord && !adminRecord.is_active) {
      toast.error(
        "Your admin account has been disabled. Contact superadmin.",
        {
          id: loginToast,
        }
      );

      await supabase.auth.signOut();
      return;
    }

    // -------------------------------------------------------
    // PENDING INVITATION
    // -------------------------------------------------------

    if (adminRecord?.invite_status === "pending") {
      toast.error("Please accept your admin invitation first.", {
        id: loginToast,
      });

      await supabase.auth.signOut();
      return;
    }

    // -------------------------------------------------------
    // LOGIN METADATA
    // -------------------------------------------------------

    const oldCurrentLogin =
      currentUser.user_metadata?.current_login || null;

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...currentUser.user_metadata,
        previous_login: oldCurrentLogin,
        current_login: new Date().toISOString(),
      },
    });

    if (updateError) {
      throw updateError;
    }

    // -------------------------------------------------------
    // LOGIN LOG
    // -------------------------------------------------------

    const { error: logError } = await supabase
      .from("admin_login_logs")
      .insert({
        user_id: currentUser.id,
        email: currentUser.email,
        role,
        status: "success",
        user_agent: navigator.userAgent,
        browser: getBrowser(),
        device: /Mobi|Android/i.test(navigator.userAgent)
          ? "Mobile"
          : "Desktop",
      });

    if (logError) {
      throw logError;
    }

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    toast.success("Login successful!", {
      id: loginToast,
    });

    setLoginSuccess(true);

    setTimeout(() => {
      navigate("/admin");
    }, 1500);
  };

  // =========================================================
  // EMAIL + PASSWORD LOGIN
  // =========================================================

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

      if (error) {
        throw error;
      }

      await completeAdminLogin(data.user, loginToast);
    } catch (err) {
      toast.error(err.message || "Login failed", {
        id: loginToast,
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEND MAGIC LINK / OTP
  // =========================================================

  const handleSendMagicLink = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    const magicToast = toast.loading("Sending magic link and OTP...");

    setMagicLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-login`,
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw error;
      }

      setOtpSent(true);

      toast.success("Magic link and OTP sent to your email", {
        id: magicToast,
      });
    } catch (err) {
      toast.error(err.message || "Failed to send magic link", {
        id: magicToast,
      });
    } finally {
      setMagicLoading(false);
    }
  };

  // =========================================================
  // VERIFY OTP
  // =========================================================

  const handleVerifyOtp = async () => {
    if (!email || !otp) {
      toast.error("Please enter email and OTP");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    const otpToast = toast.loading("Verifying OTP...");

    setOtpLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        throw error;
      }

      await completeAdminLogin(data.user, otpToast);
    } catch (err) {
      toast.error(err.message || "Invalid OTP", {
        id: otpToast,
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset link sent to your email");
      }
    } catch (err) {
      toast.error(err.message || "Unable to send reset link");
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* =====================================================
          TOASTER
      ===================================================== */}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#18181B",
            color: "#FAFAFA",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            fontSize: "12px",
            boxShadow: "0 20px 50px rgba(0,0,0,.35)",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#18181B",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#18181B",
            },
          },
        }}
      />

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-32 h-[480px] w-[480px] rounded-full bg-violet-700/[0.09] blur-[150px]" />

        <div className="absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-indigo-700/[0.07] blur-[150px]" />

        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.025] blur-[160px]" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* =====================================================
          SUCCESS OVERLAY
      ===================================================== */}

      <AnimatePresence>
        {loginSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090B]/95 px-6 backdrop-blur-xl"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.85,
                y: 14,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 18,
              }}
              className="text-center"
            >
              {/* BRAND */}

              <motion.img
                src={Q_LOGO}
                alt="Quiztians"
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="mx-auto mb-5 h-16 w-16 object-contain"
              />

              {/* CHECK */}

              <div className="relative mx-auto h-[110px] w-[110px]">
                <div className="absolute inset-3 rounded-full bg-emerald-500/[0.06] blur-2xl" />

                <svg
                  width="110"
                  height="110"
                  viewBox="0 0 120 120"
                  className="relative"
                >
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="#22c55e"
                    strokeWidth="5"
                    fill="rgba(34,197,94,.035)"
                    strokeDasharray="302"
                    strokeDashoffset="302"
                    animate={{
                      strokeDashoffset: 0,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut",
                    }}
                  />

                  <motion.path
                    d="M35 62 L53 78 L86 42"
                    stroke="#22c55e"
                    strokeWidth="7"
                    fill="transparent"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="100"
                    strokeDashoffset="100"
                    animate={{
                      strokeDashoffset: 0,
                    }}
                    transition={{
                      delay: 0.55,
                      duration: 0.4,
                    }}
                  />
                </svg>
              </div>

              <motion.div
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.8,
                }}
              >
                <p className="mt-3 text-xl font-black tracking-[-0.03em] text-white">
                  Login Successful
                </p>

                <p className="mt-2 text-xs font-medium text-zinc-600">
                  Opening administration console...
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="relative z-20 border-b border-white/[0.05] md:hidden">
        <div className="mx-auto flex h-[70px] items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left"
          >
            <img
              src={Q_LOGO}
              alt="Quiztians"
              className="h-10 w-10 shrink-0 object-contain"
            />

            <div>
              <p className="text-[14px] font-black tracking-[0.08em] text-white">
                QUIZTIANS
              </p>

              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-700">
                Admin Portal
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/[0.04] px-2.5 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[7px] font-black uppercase tracking-[0.12em] text-emerald-400/70">
              Secure
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          PAGE
      ===================================================== */}

      <main className="relative z-10 flex min-h-[calc(100vh-70px)] items-center justify-center px-5 py-8 md:min-h-screen md:px-8 md:py-10">
        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          className="grid w-full max-w-[1060px] overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#0D0D10]/90 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-xl md:min-h-[650px] md:grid-cols-[0.92fr_1.08fr]"
        >
          {/* =================================================
              DESKTOP BRAND PANEL
          ================================================= */}

          <section className="relative hidden overflow-hidden border-r border-white/[0.06] bg-[#101014] p-10 md:flex md:flex-col lg:p-12">
            {/* PANEL BACKGROUND */}

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#8B4513]/[0.10] blur-[100px]" />

              <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-violet-700/[0.07] blur-[110px]" />

              <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
                  backgroundSize: "36px 36px",
                }}
              />
            </div>

            {/* ===============================================
                REAL QUIZTIANS WORDMARK
            =============================================== */}

            <button
              type="button"
              onClick={() => navigate("/")}
              className="relative z-10 w-fit text-left"
            >
              <img
                src={WORDMARK_LOGO}
                alt="QUIZTIANS"
                className="h-[58px] w-auto max-w-[240px] object-contain object-left"
              />

              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-zinc-700">
                Administration
              </p>
            </button>

            {/* MAIN COPY */}

            <div className="relative my-auto py-10">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-[#9A5423]" />

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A96638]">
                  Admin Console
                </p>
              </div>

              <h1 className="mt-5 max-w-[360px] text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-white lg:text-[40px]">
                Manage your quiz platform securely.
              </h1>

              <p className="mt-5 max-w-[360px] text-xs leading-6 text-zinc-600">
                Secure access to the QUIZTIANS administration dashboard for
                managing quizzes, users, analytics and platform settings.
              </p>

              {/* FEATURES */}

              <div className="mt-9 space-y-3">
                <SecurityItem text="Role-protected administrator access" />

                <SecurityItem text="Secure authentication with Supabase" />

                <SecurityItem text="Administrator login activity tracking" />
              </div>
            </div>

            {/* FOOTER */}

            <div className="relative flex items-center justify-between border-t border-white/[0.05] pt-5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-zinc-800">
                Protected Administration
              </p>

              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-[8px] font-bold text-zinc-700">
                  Secure Access
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              LOGIN PANEL
          ================================================= */}

          <section className="relative flex items-center bg-[#0D0D10] px-5 py-7 sm:px-8 md:px-10 md:py-10 lg:px-14">
            <div className="mx-auto w-full max-w-[410px]">
              {/* =============================================
                  MOBILE BRAND
              ============================================= */}

              <div className="mb-7 md:hidden">
                <div className="flex items-center gap-3">
                  <img
                    src={Q_LOGO}
                    alt=""
                    className="h-12 w-12 object-contain"
                  />

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A96638]">
                      Administrator Access
                    </p>

                    <p className="mt-1 text-[9px] font-medium text-zinc-700">
                      Protected management console
                    </p>
                  </div>
                </div>
              </div>

              {/* TITLE */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.08,
                }}
              >
                <p className="hidden text-[9px] font-black uppercase tracking-[0.2em] text-[#A96638] md:block">
                  Administrator Access
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-white sm:text-[28px] md:mt-3">
                  Welcome back
                </h2>

                <p className="mt-2 text-[11px] leading-5 text-zinc-600">
                  Sign in with your administrator credentials to continue.
                </p>
              </motion.div>

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                className="mt-7 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdminLogin();
                }}
              >
                {/* =============================================
                    EMAIL
                ============================================= */}

                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-[8px] font-black uppercase tracking-[0.15em] text-zinc-600"
                  >
                    Email address
                  </label>

                  <div className="group relative">
                    <Mail
                      size={16}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 transition group-focus-within:text-[#A96638]"
                    />

                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);

                        if (otpSent) {
                          setOtp("");
                          setOtpSent(false);
                        }
                      }}
                      className="min-h-[50px] w-full rounded-2xl border border-white/[0.07] bg-white/[0.025] py-3 pl-11 pr-4 text-xs font-medium text-zinc-200 outline-none transition placeholder:text-zinc-800 hover:border-white/[0.1] focus:border-[#A96638]/40 focus:bg-[#A96638]/[0.025] focus:ring-4 focus:ring-[#A96638]/[0.04]"
                    />
                  </div>
                </div>

                {/* =============================================
                    PASSWORD
                ============================================= */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="admin-password"
                      className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-600"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[9px] font-bold text-[#A96638] transition hover:text-[#C17A47]"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="group relative">
                    <Lock
                      size={16}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 transition group-focus-within:text-[#A96638]"
                    />

                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-h-[50px] w-full rounded-2xl border border-white/[0.07] bg-white/[0.025] py-3 pl-11 pr-12 text-xs font-medium text-zinc-200 outline-none transition placeholder:text-zinc-800 hover:border-white/[0.1] focus:border-[#A96638]/40 focus:bg-[#A96638]/[0.025] focus:ring-4 focus:ring-[#A96638]/[0.04]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
                    >
                      {showPassword ? (
                        <EyeOff size={16} strokeWidth={1.8} />
                      ) : (
                        <Eye size={16} strokeWidth={1.8} />
                      )}
                    </button>
                  </div>
                </div>

                {/* =============================================
                    REMEMBER
                ============================================= */}

                <div className="flex items-center justify-between">
                  <label className="group flex cursor-pointer select-none items-center gap-2.5">
                    <span className="relative flex h-4 w-4 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />

                      <span className="absolute inset-0 rounded-[5px] border border-white/[0.1] bg-white/[0.025] transition peer-checked:border-[#A96638]/60 peer-checked:bg-[#8B4513]" />

                      <Check className="relative z-10 h-2.5 w-2.5 scale-0 text-white transition peer-checked:scale-100" />
                    </span>

                    <span className="text-[9px] font-semibold text-zinc-600 transition group-hover:text-zinc-500">
                      Remember me
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-500/60" />

                    <span className="text-[8px] font-bold text-zinc-700">
                      Secure login
                    </span>
                  </div>
                </div>

                {/* =============================================
                    SIGN IN
                ============================================= */}

                <button
                  type="submit"
                  disabled={loading || magicLoading || otpLoading}
                  className="group relative flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#74340E] via-[#8F4B1E] to-[#A56234] px-5 text-xs font-black text-white shadow-[0_12px_35px_rgba(139,69,19,.16)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in

                        <ArrowRight
                          size={14}
                          strokeWidth={2}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </>
                    )}
                  </span>
                </button>

                {/* =============================================
                    DIVIDER
                ============================================= */}

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-white/[0.06]" />

                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-800">
                    or continue with
                  </span>

                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>

                {/* =============================================
                    MAGIC LINK
                ============================================= */}

                <button
                  type="button"
                  disabled={magicLoading || loading || otpLoading}
                  onClick={handleSendMagicLink}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 text-[11px] font-bold text-zinc-400 transition hover:border-[#A96638]/30 hover:bg-[#A96638]/[0.04] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {magicLoading ? (
                    <>
                      <LoadingSpinner />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={15} strokeWidth={1.8} />

                      {otpSent
                        ? "Resend Magic Link / OTP"
                        : "Send Magic Link / OTP"}
                    </>
                  )}
                </button>

                {/* =============================================
                    OTP SECTION
                ============================================= */}

                <AnimatePresence>
                  {otpSent && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                        y: -6,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        y: -6,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-[20px] border border-[#A96638]/15 bg-[#A96638]/[0.025] p-4">
                        {/* HEADER */}

                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#A96638]/20 bg-[#A96638]/[0.06]">
                            <KeyRound
                              size={14}
                              strokeWidth={1.8}
                              className="text-[#B86C3A]"
                            />
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-zinc-300">
                              Check your email
                            </p>

                            <p className="mt-1 text-[9px] leading-4 text-zinc-600">
                              Enter the 6-digit OTP sent to your email or use
                              the magic link.
                            </p>
                          </div>
                        </div>

                        {/* OTP */}

                        <div className="mt-4">
                          <label
                            htmlFor="admin-otp"
                            className="mb-2 block text-[8px] font-black uppercase tracking-[0.15em] text-zinc-600"
                          >
                            Verification code
                          </label>

                          <input
                            id="admin-otp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="000000"
                            value={otp}
                            onChange={(e) =>
                              setOtp(
                                e.target.value.replace(/[^0-9]/g, "")
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleVerifyOtp();
                              }
                            }}
                            className="min-h-[52px] w-full rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 text-center text-base font-black tracking-[0.45em] text-white outline-none transition placeholder:text-zinc-800 focus:border-[#A96638]/40 focus:ring-4 focus:ring-[#A96638]/[0.04]"
                          />
                        </div>

                        {/* VERIFY */}

                        <button
                          type="button"
                          disabled={otpLoading || loading}
                          onClick={handleVerifyOtp}
                          className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#A96638]/25 bg-[#A96638]/[0.10] px-4 text-[10px] font-black text-[#D19569] transition hover:bg-[#A96638]/[0.15] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {otpLoading ? (
                            <>
                              <LoadingSpinner />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} strokeWidth={2} />
                              Verify OTP
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* =============================================
                    SECURITY NOTE
                ============================================= */}

                <div className="pt-1 text-center">
                  <p className="text-[8px] leading-4 text-zinc-700">
                    Admin access is managed by superadmin.
                  </p>
                </div>
              </form>
            </div>
          </section>
        </motion.div>

        {/* ===================================================
            BOTTOM COPYRIGHT
        =================================================== */}

        <div className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 md:block">
          <p className="whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.15em] text-zinc-900">
            QUIZTIANS · Protected Administration Portal
          </p>
        </div>
      </main>
    </div>
  );
}

// ===========================================================
// SECURITY ITEM
// ===========================================================

function SecurityItem({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04]">
        <Check
          className="h-3 w-3 text-emerald-500/70"
          strokeWidth={2.2}
        />
      </div>

      <p className="text-[10px] font-semibold text-zinc-600">{text}</p>
    </div>
  );
}

// ===========================================================
// LOADING SPINNER
// ===========================================================

function LoadingSpinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}