import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// ===========================================================
// BRAND ASSETS
// ===========================================================

const Q_LOGO = "../../../branding/quiztians-q.png";
const WORDMARK_LOGO = "/branding/quiztians-wordmark.png";

export default function MagicLinkLogin() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // ===========================================================

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // =========================================================
  // SEND MAGIC LINK / OTP
  // ===========================================================

  const handleMagicLink = async (e) => {
    e.preventDefault();

    if (!email.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/verify-otp`,
        },
      });

      if (error) {
        alert(error.message);
        return;
      }

      setSent(true);
    } catch (error) {
      console.error("Magic link error:", error);

      alert(
        error?.message ||
          "Unable to send the sign-in link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SEND AGAIN
  // ===========================================================

  const handleSendAgain = async () => {
    if (!email.trim() || loading) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/verify-otp`,
        },
      });

      if (error) {
        alert(error.message);
        return;
      }
    } catch (error) {
      console.error("Resend magic link error:", error);

      alert(
        error?.message ||
          "Unable to resend the sign-in link. Please try again."
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

        {/* GRID */}

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* DOT TEXTURE */}

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
                Secure Sign In
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

            {/* =================================================
                WORDMARK
            ================================================= */}

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

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="relative my-auto py-10">
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-[#9A5423]" />

                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A96638]">
                  Passwordless Access
                </p>
              </div>

              <h1 className="mt-5 max-w-[370px] text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-white lg:text-[40px]">
                Sign in without your password.
              </h1>

              <p className="mt-5 max-w-[365px] text-xs leading-6 text-zinc-600">
                We&apos;ll send a secure sign-in link and verification code to
                your email address so you can access QUIZTIANS without entering
                your password.
              </p>

              {/* FEATURES */}

              <div className="mt-9 space-y-3">
                <SecurityItem text="Secure email verification" />

                <SecurityItem text="Passwordless administrator access" />

                <SecurityItem text="One-time verification credentials" />
              </div>
            </div>

            {/* FOOTER */}

            <div className="relative flex items-center justify-between border-t border-white/[0.05] pt-5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-zinc-800">
                Protected Authentication
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
              MAGIC LINK PANEL
          ================================================= */}

          <section className="relative flex items-center bg-[#0D0D10] px-5 py-7 sm:px-8 md:px-10 md:py-10 lg:px-14">
            <div className="mx-auto w-full max-w-[410px]">
              <AnimatePresence mode="wait">
                {!sent ? (
                  /* =================================================
                      EMAIL FORM
                  ================================================= */

                  <motion.div
                    key="email-form"
                    initial={{
                      opacity: 0,
                      x: -10,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -10,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                  >
                    {/* MOBILE BADGE */}

                    <div className="mb-6 md:hidden">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#A96638]/15 bg-[#A96638]/[0.05] px-3 py-1.5">
                        <Mail className="h-3 w-3 text-[#B86C3A]" />

                        <span className="text-[8px] font-black uppercase tracking-[0.16em] text-[#B86C3A]">
                          Magic Link
                        </span>
                      </div>
                    </div>

                    {/* TITLE */}

                    <div>
                      <div className="hidden items-center gap-2 md:flex">
                        <Mail className="h-3.5 w-3.5 text-[#A96638]" />

                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A96638]">
                          Magic Link Sign In
                        </p>
                      </div>

                      <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-white sm:text-[28px] md:mt-3">
                        Continue with email
                      </h2>

                      <p className="mt-2 max-w-sm text-[11px] leading-5 text-zinc-600">
                        Enter your administrator email and we&apos;ll send you a
                        secure sign-in link and OTP code.
                      </p>
                    </div>

                    {/* =================================================
                        FORM
                    ================================================= */}

                    <form
                      onSubmit={handleMagicLink}
                      className="mt-7 space-y-5"
                    >
                      {/* EMAIL */}

                      <div>
                        <label
                          htmlFor="magic-email"
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
                            id="magic-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@quiztians.com"
                            className="min-h-[52px] w-full rounded-2xl border border-white/[0.07] bg-white/[0.025] py-3 pl-11 pr-4 text-xs font-medium text-zinc-200 outline-none transition placeholder:text-zinc-800 hover:border-white/[0.1] focus:border-[#A96638]/40 focus:bg-[#A96638]/[0.025] focus:ring-4 focus:ring-[#A96638]/[0.04]"
                          />
                        </div>
                      </div>

                      {/* SECURITY NOTE */}

                      <div className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.018] p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04]">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-zinc-400">
                            Secure passwordless login
                          </p>

                          <p className="mt-1 text-[8px] leading-4 text-zinc-700">
                            We&apos;ll email you a one-time authentication link
                            and verification code.
                          </p>
                        </div>
                      </div>

                      {/* SEND */}

                      <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="group relative flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#74340E] via-[#8F4B1E] to-[#A56234] px-5 text-xs font-black text-white shadow-[0_12px_35px_rgba(139,69,19,.16)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
                      >
                        <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

                        <span className="relative flex items-center gap-2">
                          {loading ? (
                            <>
                              <LoadingSpinner />

                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail size={14} strokeWidth={2} />

                              Send Magic Link

                              <ArrowRight
                                size={14}
                                strokeWidth={2}
                                className="transition-transform group-hover:translate-x-0.5"
                              />
                            </>
                          )}
                        </span>
                      </button>

                      {/* BACK */}

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
                  </motion.div>
                ) : (
                  /* =================================================
                      EMAIL SENT STATE
                  ================================================= */

                  <motion.div
                    key="email-sent"
                    initial={{
                      opacity: 0,
                      scale: 0.97,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                  >
                    {/* =================================================
                        MAIL ICON
                    ================================================= */}

                    <div className="relative mx-auto flex h-[110px] w-[110px] items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-[#A96638]/[0.08] blur-3xl" />

                      <motion.div
                        initial={{
                          scale: 0.7,
                          rotate: -6,
                        }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 180,
                          damping: 15,
                        }}
                        className="relative flex h-[82px] w-[82px] items-center justify-center rounded-[26px] border border-[#A96638]/20 bg-[#A96638]/[0.07]"
                      >
                        <Mail
                          size={34}
                          strokeWidth={1.5}
                          className="text-[#C17A47]"
                        />

                        <motion.div
                          initial={{
                            scale: 0,
                          }}
                          animate={{
                            scale: 1,
                          }}
                          transition={{
                            delay: 0.3,
                            type: "spring",
                          }}
                          className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#0D0D10] bg-emerald-500"
                        >
                          <Check
                            size={12}
                            strokeWidth={3}
                            className="text-white"
                          />
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* =================================================
                        SENT CONTENT
                    ================================================= */}

                    <div className="mt-5 text-center">
                      <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500/70" />

                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-emerald-400/70">
                          Email Sent
                        </span>
                      </div>

                      <h2 className="mt-5 text-2xl font-black tracking-[-0.035em] text-white sm:text-[28px]">
                        Check your email
                      </h2>

                      <p className="mx-auto mt-3 max-w-[340px] text-[11px] leading-5 text-zinc-600">
                        We&apos;ve sent a secure sign-in link and OTP code to
                      </p>

                      <p className="mt-1 break-all text-[11px] font-bold text-[#B86C3A]">
                        {email}
                      </p>
                    </div>

                    {/* =================================================
                        INSTRUCTIONS
                    ================================================= */}

                    <div className="mt-7 rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-700">
                        What to do next
                      </p>

                      <div className="mt-4 space-y-3">
                        <Step
                          number="1"
                          text="Open the email sent by QUIZTIANS"
                        />

                        <Step
                          number="2"
                          text="Use the secure sign-in link or OTP"
                        />

                        <Step
                          number="3"
                          text="Complete verification to continue"
                        />
                      </div>
                    </div>

                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="mt-6 space-y-3">
                      {/* VERIFY OTP */}

                      <button
                        type="button"
                        onClick={() =>
                          navigate("/verify-otp", {
                            state: {
                              email,
                            },
                          })
                        }
                        className="group relative flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#74340E] via-[#8F4B1E] to-[#A56234] px-5 text-xs font-black text-white shadow-[0_12px_35px_rgba(139,69,19,.16)] transition hover:brightness-110"
                      >
                        <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

                        <span className="relative flex items-center gap-2">
                          Enter OTP Code

                          <ArrowRight
                            size={14}
                            strokeWidth={2}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      </button>

                      {/* RESEND */}

                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleSendAgain}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 text-[10px] font-bold text-zinc-500 transition hover:border-[#A96638]/20 hover:bg-[#A96638]/[0.03] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner />

                            Sending again...
                          </>
                        ) : (
                          <>
                            <RefreshCw
                              size={13}
                              strokeWidth={1.8}
                            />

                            Resend Email
                          </>
                        )}
                      </button>

                      {/* CHANGE EMAIL */}

                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setSent(false)}
                        className="flex min-h-[44px] w-full items-center justify-center gap-2 text-[9px] font-bold text-zinc-700 transition hover:text-zinc-400 disabled:opacity-40"
                      >
                        <ArrowLeft size={12} />

                        Use a different email
                      </button>
                    </div>

                    {/* SPAM NOTE */}

                    <div className="mt-6 flex items-start justify-center gap-2">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-zinc-800" />

                      <p className="max-w-[300px] text-center text-[8px] leading-4 text-zinc-700">
                        Didn&apos;t receive it? Check your spam or junk folder
                        before requesting another email.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}

// ===========================================================
// STEP
// ===========================================================

function Step({ number, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#A96638]/15 bg-[#A96638]/[0.05]">
        <span className="text-[8px] font-black text-[#B86C3A]">
          {number}
        </span>
      </div>

      <p className="text-[9px] font-medium text-zinc-600">
        {text}
      </p>
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