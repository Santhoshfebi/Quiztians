import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";

// ===========================================================
// BRAND ASSETS
// ===========================================================

const Q_LOGO = "../../../branding/quiztians-q.png";
const WORDMARK_LOGO = "/branding/quiztians-wordmark.png";

export default function SetPassword() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // ===========================================================

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [sessionValid, setSessionValid] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [success, setSuccess] = useState(false);

  // =========================================================
  // GET SESSION
  // ===========================================================

  useEffect(() => {
    let mounted = true;

    const getSessionFromUrl = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(error);

          setMessage(error.message);
          setMessageType("error");
          setSessionValid(false);
          return;
        }

        if (data?.session?.user) {
          setSessionValid(true);
        } else {
          setSessionValid(false);

          setMessage(
            "Your invitation or authentication session is no longer available."
          );

          setMessageType("error");
        }
      } catch (error) {
        console.error("Session error:", error);

        if (!mounted) return;

        setSessionValid(false);
        setMessage(
          error?.message ||
            "Unable to verify your authentication session."
        );
        setMessageType("error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSessionFromUrl();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // PASSWORD RULES
  // ===========================================================

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 6,
      letter: /[A-Za-z]/.test(password),
      number: /\d/.test(password),
    }),
    [password]
  );

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  // =========================================================
  // PASSWORD STRENGTH
  // ===========================================================

  const passwordStrength = useMemo(() => {
    if (!password) return 0;

    let strength = 0;

    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;

    if (
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password)
    ) {
      strength += 1;
    }

    if (/\d/.test(password)) {
      strength += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
    }

    return Math.min(strength, 4);
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (!password) return "";

    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";

    return "Strong";
  }, [password, passwordStrength]);

  // =========================================================
  // CAN SUBMIT
  // ===========================================================

  const canSubmit =
    sessionValid &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword &&
    !submitting;

  // =========================================================
  // CLEAR MESSAGE
  // ===========================================================

  const clearMessage = () => {
    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  // =========================================================
  // SET PASSWORD
  // ===========================================================

  const handleSetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!sessionValid) {
      setMessageType("error");
      setMessage(
        "Your authentication session is invalid or has expired."
      );
      return;
    }

    if (password.length < 6) {
      setMessageType("error");
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessageType("error");
        setMessage(error.message);
        return;
      }

      setMessageType("success");
      setMessage("Password set successfully!");

      setSuccess(true);

      setTimeout(() => {
        navigate("/admin-login");
      }, 2000);
    } catch (error) {
      console.error("Set password error:", error);

      setMessageType("error");
      setMessage(
        error?.message ||
          "Unable to set your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // ===========================================================

  if (loading) {
    return <SetPasswordLoading />;
  }

  // =========================================================
  // UI
  // ===========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-32 h-[480px] w-[480px] rounded-full bg-[#8B4513]/[0.10] blur-[150px]" />

        <div className="absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-violet-700/[0.06] blur-[150px]" />

        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#A96638]/[0.025] blur-[160px]" />

        {/* GRID */}

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* DOTS */}

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.8) 0.6px, transparent 0.6px)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      {/* =====================================================
          SUCCESS OVERLAY
      ===================================================== */}

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090B]/95 px-6 backdrop-blur-xl"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.88,
                y: 16,
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
              className="w-full max-w-sm text-center"
            >
              {/* LOGO */}

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
                className="mx-auto mb-7 h-16 w-16 object-contain"
              />

              {/* SUCCESS CHECK */}

              <div className="relative mx-auto flex h-[110px] w-[110px] items-center justify-center">
                <div className="absolute inset-3 rounded-full bg-emerald-500/[0.08] blur-2xl" />

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
                  delay: 0.75,
                }}
              >
                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">
                  Password created
                </h2>

                <p className="mx-auto mt-2 max-w-[300px] text-xs leading-5 text-zinc-600">
                  Your administrator password has been set
                  successfully.
                </p>

                <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2">
                  <LoadingSpinner />

                  <span className="text-[9px] font-bold text-emerald-400/70">
                    Redirecting to login...
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <header className="relative z-20 border-b border-white/[0.05] md:hidden">
        <div className="flex h-[70px] items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate("/admin-login")}
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
                Account Setup
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/[0.04] px-2.5 py-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-500/70" />

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
              LEFT DESKTOP PANEL
          ================================================= */}

          <section className="relative hidden overflow-hidden border-r border-white/[0.06] bg-[#101014] p-10 md:flex md:flex-col lg:p-12">
            {/* PANEL BACKGROUND */}

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#8B4513]/[0.12] blur-[100px]" />

              <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-violet-700/[0.06] blur-[110px]" />

              <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
                  backgroundSize: "36px 36px",
                }}
              />
            </div>

            {/* WORDMARK */}

            <button
              type="button"
              onClick={() => navigate("/admin-login")}
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

            {/* COPY */}

            <div className="relative my-auto py-10">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-[#9A5423]" />

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A96638]">
                  Account Setup
                </p>
              </div>

              <h1 className="mt-5 max-w-[370px] text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-white lg:text-[40px]">
                Secure your administrator account.
              </h1>

              <p className="mt-5 max-w-[365px] text-xs leading-6 text-zinc-600">
                Create a secure password for your QUIZTIANS
                administrator account to complete your account
                setup.
              </p>

              {/* STEPS */}

              <div className="mt-9">
                <p className="mb-4 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
                  Account setup
                </p>

                <div className="space-y-3">
                  <SetupStep
                    number="01"
                    text="Invitation verified"
                    completed
                  />

                  <SetupStep
                    number="02"
                    text="Create secure password"
                    active
                  />

                  <SetupStep
                    number="03"
                    text="Sign in to admin console"
                  />
                </div>
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
                  Secure Session
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              SET PASSWORD PANEL
          ================================================= */}

          <section className="relative flex items-center bg-[#0D0D10] px-5 py-7 sm:px-8 md:px-10 md:py-10 lg:px-14">
            <div className="mx-auto w-full max-w-[410px]">
              {/* =============================================
                  INVALID SESSION
              ============================================= */}

              {!sessionValid ? (
                <InvalidSession
                  message={message}
                  onBack={() => navigate("/admin-login")}
                />
              ) : (
                <>
                  {/* MOBILE BADGE */}

                  <div className="mb-6 md:hidden">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#A96638]/15 bg-[#A96638]/[0.05] px-3 py-1.5">
                      <UserCheck className="h-3 w-3 text-[#B86C3A]" />

                      <span className="text-[8px] font-black uppercase tracking-[0.16em] text-[#B86C3A]">
                        Account Setup
                      </span>
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
                    <div className="hidden items-center gap-2 md:flex">
                      <KeyRound className="h-3.5 w-3.5 text-[#A96638]" />

                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A96638]">
                        Set Password
                      </p>
                    </div>

                    <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-white sm:text-[28px] md:mt-3">
                      Create your password
                    </h2>

                    <p className="mt-2 max-w-sm text-[11px] leading-5 text-zinc-600">
                      Create a secure password to finish setting up
                      your administrator account.
                    </p>
                  </motion.div>

                  {/* =========================================
                      VERIFIED SESSION
                  ========================================= */}

                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.035] p-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/[0.06]">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-emerald-400/80">
                        Secure session verified
                      </p>

                      <p className="mt-1 text-[8px] leading-4 text-zinc-700">
                        Your authentication session is active.
                      </p>
                    </div>
                  </div>

                  {/* =========================================
                      ERROR MESSAGE
                  ========================================= */}

                  <AnimatePresence mode="wait">
                    {message && messageType === "error" && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -5,
                          height: 0,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          height: "auto",
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                        }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-3.5">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                            <X className="h-3.5 w-3.5 text-red-400" />
                          </div>

                          <div>
                            <p className="text-[9px] font-black text-red-300">
                              Unable to set password
                            </p>

                            <p className="mt-1 text-[8px] leading-4 text-red-400/60">
                              {message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* =========================================
                      FORM
                  ========================================= */}

                  <form
                    onSubmit={handleSetPassword}
                    className="mt-6 space-y-5"
                  >
                    {/* =======================================
                        PASSWORD
                    ======================================= */}

                    <div>
                      <label
                        htmlFor="new-password"
                        className="mb-2 block text-[8px] font-black uppercase tracking-[0.15em] text-zinc-600"
                      >
                        New password
                      </label>

                      <div className="group relative">
                        <Lock
                          size={16}
                          strokeWidth={1.8}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 transition group-focus-within:text-[#A96638]"
                        />

                        <input
                          id="new-password"
                          type={
                            showPassword ? "text" : "password"
                          }
                          autoComplete="new-password"
                          placeholder="Create a secure password"
                          value={password}
                          required
                          onChange={(e) => {
                            setPassword(e.target.value);
                            clearMessage();
                          }}
                          className="min-h-[52px] w-full rounded-2xl border border-white/[0.07] bg-white/[0.025] py-3 pl-11 pr-12 text-xs font-medium text-zinc-200 outline-none transition placeholder:text-zinc-800 hover:border-white/[0.1] focus:border-[#A96638]/40 focus:bg-[#A96638]/[0.025] focus:ring-4 focus:ring-[#A96638]/[0.04]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => !prev)
                          }
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
                        >
                          {showPassword ? (
                            <EyeOff
                              size={16}
                              strokeWidth={1.8}
                            />
                          ) : (
                            <Eye
                              size={16}
                              strokeWidth={1.8}
                            />
                          )}
                        </button>
                      </div>

                      {/* STRENGTH */}

                      {password && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: -3,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className="mt-3"
                        >
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  passwordStrength >= level
                                    ? passwordStrength <= 1
                                      ? "bg-red-500"
                                      : passwordStrength === 2
                                      ? "bg-amber-500"
                                      : passwordStrength === 3
                                      ? "bg-blue-500"
                                      : "bg-emerald-500"
                                    : "bg-white/[0.06]"
                                }`}
                              />
                            ))}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[8px] font-semibold text-zinc-700">
                              Password strength
                            </span>

                            <span
                              className={`text-[8px] font-black ${
                                passwordStrength <= 1
                                  ? "text-red-400"
                                  : passwordStrength === 2
                                  ? "text-amber-400"
                                  : passwordStrength === 3
                                  ? "text-blue-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {strengthLabel}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* =======================================
                        CONFIRM PASSWORD
                    ======================================= */}

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-2 block text-[8px] font-black uppercase tracking-[0.15em] text-zinc-600"
                      >
                        Confirm password
                      </label>

                      <div className="group relative">
                        <Lock
                          size={16}
                          strokeWidth={1.8}
                          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition ${
                            confirmPassword
                              ? passwordsMatch
                                ? "text-emerald-500"
                                : "text-red-400"
                              : "text-zinc-600 group-focus-within:text-[#A96638]"
                          }`}
                        />

                        <input
                          id="confirm-password"
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          required
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            clearMessage();
                          }}
                          className={`min-h-[52px] w-full rounded-2xl bg-white/[0.025] py-3 pl-11 pr-12 text-xs font-medium text-zinc-200 outline-none transition placeholder:text-zinc-800 focus:ring-4 ${
                            confirmPassword
                              ? passwordsMatch
                                ? "border border-emerald-500/25 focus:border-emerald-500/40 focus:ring-emerald-500/[0.04]"
                                : "border border-red-500/20 focus:border-red-500/30 focus:ring-red-500/[0.04]"
                              : "border border-white/[0.07] hover:border-white/[0.1] focus:border-[#A96638]/40 focus:ring-[#A96638]/[0.04]"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (prev) => !prev
                            )
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirmed password"
                              : "Show confirmed password"
                          }
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
                        >
                          {showConfirmPassword ? (
                            <EyeOff
                              size={16}
                              strokeWidth={1.8}
                            />
                          ) : (
                            <Eye
                              size={16}
                              strokeWidth={1.8}
                            />
                          )}
                        </button>
                      </div>

                      {/* MATCH */}

                      <AnimatePresence>
                        {confirmPassword && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              y: -3,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                            }}
                            className="mt-2 flex items-center gap-1.5"
                          >
                            {passwordsMatch ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />

                                <span className="text-[8px] font-semibold text-emerald-500/70">
                                  Passwords match
                                </span>
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3 text-red-400" />

                                <span className="text-[8px] font-semibold text-red-400/70">
                                  Passwords do not match
                                </span>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* =======================================
                        REQUIREMENTS
                    ======================================= */}

                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-700">
                          Password requirements
                        </p>

                        <ShieldCheck className="h-3.5 w-3.5 text-zinc-800" />
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <PasswordRule
                          valid={passwordRules.length}
                          text="6+ characters"
                        />

                        <PasswordRule
                          valid={passwordRules.letter}
                          text="Contains a letter"
                        />

                        <PasswordRule
                          valid={passwordRules.number}
                          text="Contains a number"
                        />

                        <PasswordRule
                          valid={passwordsMatch}
                          text="Passwords match"
                        />
                      </div>
                    </div>

                    {/* =======================================
                        SUBMIT
                    ======================================= */}

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="group relative flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#74340E] via-[#8F4B1E] to-[#A56234] px-5 text-xs font-black text-white shadow-[0_12px_35px_rgba(139,69,19,.16)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
                    >
                      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

                      <span className="relative flex items-center gap-2">
                        {submitting ? (
                          <>
                            <LoadingSpinner />

                            Setting password...
                          </>
                        ) : (
                          <>
                            <KeyRound
                              size={14}
                              strokeWidth={2}
                            />

                            Set Password

                            <ArrowRight
                              size={14}
                              strokeWidth={2}
                              className="transition-transform group-hover:translate-x-0.5"
                            />
                          </>
                        )}
                      </span>
                    </button>

                    {/* =======================================
                        BACK
                    ======================================= */}

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        navigate("/admin-login")
                      }
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 text-[10px] font-bold text-zinc-500 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeft
                        size={14}
                        strokeWidth={1.8}
                      />

                      Back to Admin Login
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}

// ===========================================================
// INVALID SESSION
// ===========================================================

function InvalidSession({ message, onBack }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-red-500/15 bg-red-500/[0.05]">
        <X
          size={25}
          strokeWidth={1.7}
          className="text-red-400"
        />
      </div>

      <p className="mt-5 text-[8px] font-black uppercase tracking-[0.18em] text-red-400/70">
        Session unavailable
      </p>

      <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-white">
        This link can&apos;t be used
      </h2>

      <p className="mx-auto mt-3 max-w-[330px] text-[10px] leading-5 text-zinc-600">
        {message ||
          "Your authentication session is invalid or has expired."}
      </p>

      <p className="mx-auto mt-2 max-w-[330px] text-[9px] leading-4 text-zinc-700">
        Return to the administrator login page and request a new
        invitation or authentication link.
      </p>

      <button
        type="button"
        onClick={onBack}
        className="group relative mt-7 flex min-h-[50px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#74340E] via-[#8F4B1E] to-[#A56234] px-5 text-[10px] font-black text-white transition hover:brightness-110"
      >
        <span className="relative flex items-center gap-2">
          <ArrowLeft size={14} />

          Back to Admin Login
        </span>
      </button>
    </motion.div>
  );
}

// ===========================================================
// SETUP STEP
// ===========================================================

function SetupStep({
  number,
  text,
  completed = false,
  active = false,
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
        active
          ? "border-[#A96638]/15 bg-[#A96638]/[0.04]"
          : "border-transparent"
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
          completed
            ? "border-emerald-500/15 bg-emerald-500/[0.05]"
            : active
            ? "border-[#A96638]/20 bg-[#A96638]/[0.07]"
            : "border-white/[0.05] bg-white/[0.02]"
        }`}
      >
        {completed ? (
          <Check
            size={12}
            strokeWidth={2.5}
            className="text-emerald-500"
          />
        ) : (
          <span
            className={`text-[7px] font-black ${
              active
                ? "text-[#B86C3A]"
                : "text-zinc-700"
            }`}
          >
            {number}
          </span>
        )}
      </div>

      <div className="flex-1">
        <p
          className={`text-[9px] font-bold ${
            completed
              ? "text-emerald-500/60"
              : active
              ? "text-zinc-400"
              : "text-zinc-700"
          }`}
        >
          {text}
        </p>
      </div>

      {active && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#A96638]" />
      )}
    </div>
  );
}

// ===========================================================
// PASSWORD RULE
// ===========================================================

function PasswordRule({ valid, text }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
          valid
            ? "border-emerald-500/20 bg-emerald-500/[0.07]"
            : "border-white/[0.06] bg-white/[0.02]"
        }`}
      >
        {valid ? (
          <Check
            className="h-2.5 w-2.5 text-emerald-500"
            strokeWidth={2.5}
          />
        ) : (
          <span className="h-1 w-1 rounded-full bg-zinc-700" />
        )}
      </div>

      <span
        className={`text-[8px] font-semibold transition ${
          valid
            ? "text-emerald-500/70"
            : "text-zinc-700"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

// ===========================================================
// LOADING SCREEN
// ===========================================================

function SetPasswordLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-6 text-white">
      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8B4513]/[0.08] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
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
        className="relative text-center"
      >
        <img
          src={Q_LOGO}
          alt="Quiztians"
          className="mx-auto h-16 w-16 object-contain"
        />

        <div className="mx-auto mt-7 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]">
          <LoadingSpinner />
        </div>

        <h2 className="mt-5 text-sm font-black text-zinc-300">
          Verifying your session
        </h2>

        <p className="mt-2 text-[9px] text-zinc-700">
          Preparing secure account setup...
        </p>
      </motion.div>
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