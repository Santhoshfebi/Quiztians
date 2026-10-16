import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Trophy,
} from "lucide-react";

// Change this path only if your logo lives somewhere else.

export default function Scores() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-violet-600/[0.10] blur-[140px]" />

        <div className="absolute -left-40 top-[45%] h-[320px] w-[320px] rounded-full bg-indigo-600/[0.05] blur-[130px]" />

        <div className="absolute -right-40 bottom-[-80px] h-[340px] w-[340px] rounded-full bg-violet-600/[0.05] blur-[140px]" />

        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* =====================================================
          PAGE
      ===================================================== */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="flex items-center justify-between gap-4">
          {/* BRAND */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="Go to QUIZTIANS home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl">
              <img
                src="/branding/quiztians-q.png"
                alt=""
                className="h-9 w-9 object-contain"
              />
            </div>

            <div className="text-left">
              <img
                src="/branding/quiztians-wordmark.png"
                alt="QUIZTIANS"
                className="h-[38px] w-auto max-w-[240px] object-contain object-left"
              />


              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                Challenge yourself
              </p>
            </div>
          </button>

          {/* BACK */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 text-[11px] font-bold text-zinc-500 transition hover:border-white/[0.10] hover:bg-white/[0.045] hover:text-zinc-200"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />

            <span>Back to Home</span>
          </button>
        </header>

        {/* ===================================================
            COMING SOON
        =================================================== */}

        <section className="flex flex-1 items-center justify-center py-12 sm:py-16">
          <motion.div
            initial={{
              opacity: 0,
              y: 18,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.45,
              ease: "easeOut",
            }}
            className="relative w-full max-w-[620px]"
          >
            {/* glow */}

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[100px]" />

            {/* CARD */}

            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.065] bg-[#111114] px-5 py-10 text-center shadow-2xl shadow-black/20 sm:px-10 sm:py-14">
              {/* top accent */}

              <div className="absolute left-1/2 top-0 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

              {/* ICON */}

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  rotate: -8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  delay: 0.12,
                  duration: 0.4,
                }}
                className="relative mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-[22px] border border-violet-500/15 bg-violet-500/[0.07]"
              >
                <div className="absolute inset-2 rounded-2xl bg-violet-500/[0.05]" />

                <Trophy
                  size={31}
                  strokeWidth={1.8}
                  className="relative text-violet-300"
                />
              </motion.div>

              {/* EYEBROW */}

              <div className="mt-7 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-3 py-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />

                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
                  </span>

                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">
                    In Development
                  </span>
                </div>
              </div>

              {/* TITLE */}

              <h1 className="mt-5 text-[34px] font-black tracking-[-0.05em] text-white sm:text-[44px]">
                Coming Soon
                <span className="text-violet-400">.</span>
              </h1>

              {/* DESCRIPTION */}

              <p className="mx-auto mt-4 max-w-[430px] text-[13px] leading-6 text-zinc-500 sm:text-[14px]">
                The QUIZTIANS leaderboard is being
                prepared. Soon you'll be able to see
                top performers, rankings, scores and
                challenge your way to the top.
              </p>

              {/* MINI PREVIEW */}

              <div className="mx-auto mt-8 grid max-w-[390px] grid-cols-2 gap-2.5">
                <ComingSoonFeature
                  icon={Trophy}
                  title="Leaderboard"
                  description="Top rankings"
                />

                <ComingSoonFeature
                  icon={Clock3}
                  title="Live Scores"
                  description="Real-time results"
                />
              </div>

              {/* DIVIDER */}

              <div className="mx-auto my-8 h-px max-w-[360px] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

              {/* HOME BUTTON */}

              <button
                type="button"
                onClick={() => navigate("/")}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-[12px] font-black text-white shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 hover:shadow-violet-950/40"
              >
                <ArrowLeft
                  size={14}
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                />

                Back to Home
              </button>
            </div>

            {/* BOTTOM TEXT */}

            <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-700">
              QUIZTIANS · Leaderboard
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

/* ==========================================================
   COMING SOON FEATURE
========================================================== */

function ComingSoonFeature({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-3.5 text-left">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.025] text-zinc-500">
        <Icon size={14} />
      </div>

      <p className="mt-3 text-[11px] font-black text-zinc-300">
        {title}
      </p>

      <p className="mt-1 text-[10px] font-medium text-zinc-600">
        {description}
      </p>
    </div>
  );
}