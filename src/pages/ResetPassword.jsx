import { useEffect, useMemo, useState } from "react";
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
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";

// ===========================================================
// BRAND ASSETS
// ===========================================================

const Q_LOGO = "../../../branding/quiztians-q.png";
const WORDMARK_LOGO = "/branding/quiztians-wordmark.png";

export default function ResetPassword() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // ===========================================================

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(null);
  const [type, setType] = useState("");

  const [recoveryActive, setRecoveryActive] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // =========================================================
  // PASSWORD RECOVERY LISTENER
  // ===========================================================

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          console.log("Recovery session active");
          setRecoveryActive(true);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // =========================================================
  // PASSWORD RULES
  // ===========================================================

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 6,
      number: /\d/.test(password),
      letter: /[A-Za-z]/.test(password),
    }),
    [password]
  );

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit =
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword &&
    !loading;

  // =========================================================
  // PASSWORD STRENGTH
  // ===========================================================

  const passwordStrength = useMemo(() => {
    if (!password) return 0;

    let strength = 0;

    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

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
  // RESET PASSWORD
  // ===========================================================

  const handleReset = async (e) => {
    e.preventDefault();

    setMessage(null);
    setType("");

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

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setType("error");
        setMessage(error.message);
        return;
      }

      setType("success");
      setMessage(
        "Password updated successfully! Redirecting to login..."
      );

      setResetSuccess(true);

      setTimeout(() => {
        navigate("/admin-login");
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);

      setType("error");
      setMessage(
        error?.message || "Unable to update password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

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
        {resetSuccess && (
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

              {/* SUCCESS ICON */}

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
                  Password updated
                </h2>

                <p className="mt-2 text-xs leading-5 text-zinc-600">
                  Your administrator password has been changed successfully.
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
                Account Recovery
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
              DESKTOP BRAND PANEL
          ================================================= */}

          <section className="relative hidden overflow-hidden border-r border-white/[0.06] bg-[#101014] p-10 md:flex md:flex-col lg:p-12">
            {/* BACKGROUND */}

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
                  Account Recovery
                </p>
              </div>

              <h1 className="mt-5 max-w-[370px] text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-white lg:text-[40px]">
                Create a new secure password.
              </h1>

              <p className="mt-5 max-w-[365px] text-xs leading-6 text-zinc-600">
                Choose a new password for your QUIZTIANS administrator
                account. Once updated, you&apos;ll be returned to the secure
                admin login.
              </p>

              {/* SECURITY INFORMATION */}

              <div className="mt-9 space-y-3">
                <SecurityItem text="Use at least 6 characters" />

                <SecurityItem text="Avoid passwords used on other accounts" />

                <SecurityItem text="Keep administrator credentials private" />
              </div>
            </div>

            {/* FOOTER */}

            <div className="relative flex items-center justify-between border-t border-white/[0.05] pt-5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-zinc-800">
                Password Recovery
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
              RESET PANEL
          ================================================= */}

          <section className="relative flex items-center bg-[#0D0D10] px-5 py-7 sm:px-8 md:px-10 md:py-10 lg:px-14">
            <div className="mx-auto w-full max-w-[410px]">
              {/* MOBILE BRAND */}

              <div className="mb-6 md:hidden">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#A96638]/15 bg-[#A96638]/[0.05] px-3 py-1.5">
                  <KeyRound className="h-3 w-3 text-[#B86C3A]" />

                  <span className="text-[8px] font-black uppercase tracking-[0.16em] text-[#B86C3A]">
                    Password Recovery
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
                    Reset Password
                  </p>
                </div>

                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-white sm:text-[28px] md:mt-3">
                  Choose a new password
                </h2>

                <p className="mt-2 max-w-sm text-[11px] leading-5 text-zinc-600">
                  Enter and confirm your new administrator password below.
                </p>
              </motion.div>

              {/* =================================================
                  MESSAGE
              ================================================= */}

              <AnimatePresence mode="wait">
                {message && !resetSuccess && (
                  <motion.div
                    key={`${type}-${message}`}
                    initial={{
                      opacity: 0,
                      y: -6,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      height: "auto",
                    }}
                    exit={{
                      opacity: 0,
                      y: -6,
                      height: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`mt-5 flex items-start gap-3 rounded-2xl border p-3.5 ${
                        type === "success"
                          ? "border-emerald-500/15 bg-emerald-500/[0.05]"
                          : "border-red-500/15 bg-red-500/[0.05]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          type === "success"
                            ? "bg-emerald-500/10"
                            : "bg-red-500/10"
                        }`}
                      >
                        {type === "success" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-red-400" />
                        )}
                      </div>

                      <div>
                        <p
                          className={`text-[10px] font-black ${
                            type === "success"
                              ? "text-emerald-300"
                              : "text-red-300"
                          }`}
                        >
                          {type === "success"
                            ? "Password updated"
                            : "Unable to continue"}
                        </p>

                        <p
                          className={`mt-1 text-[9px] leading-4 ${
                            type === "success"
                              ? "text-emerald-400/60"
                              : "text-red-400/60"
                          }`}
                        >
                          {message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={handleReset}
                className="mt-7 space-y-5"
              >
                {/* =============================================
                    NEW PASSWORD
                ============================================= */}

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
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);

                        if (message) {
                          setMessage(null);
                          setType("");
                        }
                      }}
                      className="min-h-[52px] w-full rounded-2xl border border-white/[0.07] bg-white/[0.025] py-3 pl-11 pr-12 text-xs font-medium text-zinc-200 outline-none transition placeholder:text-zinc-800 hover:border-white/[0.1] focus:border-[#A96638]/40 focus:bg-[#A96638]/[0.025] focus:ring-4 focus:ring-[#A96638]/[0.04]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? "Hide new password"
                          : "Show new password"
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

                  {/* =========================================
                      PASSWORD STRENGTH
                  ========================================= */}

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

                {/* =============================================
                    CONFIRM PASSWORD
                ============================================= */}

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
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);

                        if (message) {
                          setMessage(null);
                          setType("");
                        }
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
                        setShowConfirmPassword((prev) => !prev)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirmed password"
                          : "Show confirmed password"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} strokeWidth={1.8} />
                      ) : (
                        <Eye size={16} strokeWidth={1.8} />
                      )}
                    </button>
                  </div>

                  {/* MATCH STATUS */}

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

                {/* =============================================
                    REQUIREMENTS
                ============================================= */}

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

                {/* =============================================
                    UPDATE BUTTON
                ============================================= */}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="group relative flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#74340E] via-[#8F4B1E] to-[#A56234] px-5 text-xs font-black text-white shadow-[0_12px_35px_rgba(139,69,19,.16)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
                >
                  <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <LoadingSpinner />

                        Updating password...
                      </>
                    ) : (
                      <>
                        <KeyRound size={14} strokeWidth={2} />

                        Update Password

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
                    BACK TO LOGIN
                ============================================= */}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => navigate("/admin-login")}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 text-[10px] font-bold text-zinc-500 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={14} strokeWidth={1.8} />

                  Back to Admin Login
                </button>
              </form>

              {/* =================================================
                  SECURE SESSION
              ================================================= */}

              <div className="mt-6 flex items-center justify-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04]">
                  <ShieldCheck className="h-3 w-3 text-emerald-500/60" />
                </div>

                <div>
                  <p className="text-[8px] font-bold text-zinc-700">
                    Secure password recovery
                  </p>

                  {recoveryActive && (
                    <p className="mt-0.5 text-[7px] font-semibold text-emerald-500/50">
                      Recovery session verified
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </main>
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
          valid ? "text-emerald-500/70" : "text-zinc-700"
        }`}
      >
        {text}
      </span>
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

      <p className="text-[10px] font-semibold text-zinc-600">
        {text}
      </p>
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