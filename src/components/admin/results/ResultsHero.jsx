import { motion } from "framer-motion";
import {
  Download,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function ResultsHero({
  filteredCount,
  totalCount,
  refreshing,
  onRefresh,
  onExport,
  onReset,
  theme,
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="relative overflow-hidden rounded-[24px] border border-zinc-200/90 bg-white p-5 shadow-[0_10px_30px_rgba(24,24,27,0.07)] sm:p-6 lg:p-7"
    >
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[110px]"
        style={{
          backgroundColor: `${theme.accent}0D`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        {/* ===================================================
            LEFT
        =================================================== */}

        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Sparkles
              size={15}
              style={{
                color: theme.accent,
              }}
            />

            <p
              className="text-[11px] font-black uppercase tracking-[0.14em]"
              style={{
                color: theme.accent,
              }}
            >
              Result Analytics
            </p>
          </div>

          <h2 className="mt-3 text-[27px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[31px] lg:text-[35px]">
            Results Dashboard
          </h2>

          <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
            Analyze participant performance, identify repeat attempts,
            export filtered data and manage quiz results.
          </p>

          {/* =================================================
              COUNTS
          ================================================= */}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CountBadge
              value={filteredCount}
              label="visible"
              theme={theme}
              accent
            />

            <CountBadge
              value={totalCount}
              label="total"
            />
          </div>
        </div>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <ActionButton
            icon={RefreshCw}
            label="Refresh"
            onClick={onRefresh}
            loading={refreshing}
          />

          <ActionButton
            icon={Download}
            label="Export CSV"
            onClick={onExport}
            theme={theme}
            primary
          />

          <ActionButton
            icon={RotateCcw}
            label="Reset Results"
            onClick={onReset}
            danger
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </div>
    </motion.section>
  );
}

/* ==========================================================
   COUNT BADGE
========================================================== */

function CountBadge({
  value,
  label,
  theme,
  accent = false,
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border px-3 py-1.5"
      style={
        accent
          ? {
              borderColor: `${theme.accent}20`,
              backgroundColor: theme.accentSoft,
            }
          : {
              borderColor: "#E4E4E7",
              backgroundColor: "#F8FAFC",
            }
      }
    >
      <span
        className="text-[11px] font-black"
        style={
          accent
            ? {
                color: theme.accent,
              }
            : {
                color: "#27272A",
              }
        }
      >
        {value}
      </span>

      <span className="text-[10px] font-bold text-zinc-500">
        {label}
      </span>
    </div>
  );
}

/* ==========================================================
   ACTION BUTTON
========================================================== */

function ActionButton({
  icon: Icon,
  label,
  onClick,
  loading = false,
  primary = false,
  danger = false,
  theme,
  className = "",
}) {
  let styles =
    "border-zinc-200/90 bg-white text-zinc-600 shadow-sm hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-md";

  if (danger) {
    styles =
      "border-red-200 bg-red-50 text-red-600 shadow-sm hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow-md";
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[12px] font-black transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      style={
        primary
          ? {
              borderColor: `${theme.accent}25`,
              backgroundColor: theme.accentSoft,
              color: theme.accent,
              boxShadow: `0 6px 18px ${theme.accent}0F`,
            }
          : undefined
      }
    >
      <Icon
        size={15}
        className={loading ? "animate-spin" : ""}
      />

      {loading ? "Refreshing..." : label}
    </button>
  );
}