import { motion } from "framer-motion";

import {
  Download,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";

/* ==========================================================
   RESULTS HERO
========================================================== */

export default function ResultsHero({
  filteredCount,
  totalCount,
  refreshing,
  onRefresh,
  onExport,
  onReset,
  theme,
}) {
  const hasExportData =
    Number(filteredCount) > 0;

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
      className="relative min-w-0 overflow-hidden rounded-[20px] border border-zinc-200/90 bg-white p-4 shadow-[0_10px_30px_rgba(24,24,27,0.07)] min-[400px]:p-5 sm:rounded-[24px] sm:p-6 lg:p-7"
    >
      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <div
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-[100px] sm:h-72 sm:w-72 sm:blur-[110px]"
        style={{
          backgroundColor:
            `${theme.accent}0D`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
          backgroundSize:
            "34px 34px",
        }}
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative flex min-w-0 flex-col gap-5 sm:gap-6 xl:flex-row xl:items-center xl:justify-between">
        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <div className="min-w-0 max-w-2xl">
          {/* EYEBROW */}

          <div className="flex min-w-0 items-center gap-2">
            <Sparkles
              size={14}
              className="shrink-0 sm:h-[15px] sm:w-[15px]"
              style={{
                color:
                  theme.accent,
              }}
            />

            <p
              className="truncate text-[9px] font-black uppercase tracking-[0.12em] min-[400px]:text-[10px] sm:text-[11px] sm:tracking-[0.14em]"
              style={{
                color:
                  theme.accent,
              }}
            >
              Result Analytics
            </p>
          </div>

          {/* TITLE */}

          <h2 className="mt-2.5 text-[24px] font-black leading-tight tracking-[-0.04em] text-zinc-900 min-[400px]:text-[26px] sm:mt-3 sm:text-[31px] lg:text-[35px]">
            Results Dashboard
          </h2>

          {/* DESCRIPTION */}

          <p className="mt-2 max-w-xl text-[11px] leading-5 text-zinc-600 min-[400px]:text-[12px] sm:text-[14px] sm:leading-6">
            Analyze participant performance,
            identify repeat attempts, export
            filtered data and safely manage quiz
            results.
          </p>

          {/* =================================================
              RESULT COUNTS
          ================================================= */}

          <div className="mt-3.5 flex min-w-0 flex-wrap items-center gap-1.5 min-[400px]:gap-2 sm:mt-4">
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

        <div className="w-full min-w-0 xl:w-auto">
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            {/* REFRESH */}

            <ActionButton
              icon={RefreshCw}
              label="Refresh"
              onClick={onRefresh}
              loading={refreshing}
            />

            {/* EXPORT */}

            <ActionButton
              icon={Download}
              label="Export CSV"
              onClick={onExport}
              disabled={
                !hasExportData
              }
              theme={theme}
              primary
            />

            {/* RESET */}

            <ActionButton
              icon={RotateCcw}
              label="Reset Results"
              onClick={onReset}
              danger
              className="col-span-2 sm:col-span-1"
            />
          </div>
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
      className="flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 min-[400px]:gap-2 min-[400px]:px-3"
      style={
        accent
          ? {
              borderColor:
                `${theme.accent}20`,
              backgroundColor:
                theme.accentSoft,
            }
          : {
              borderColor:
                "#E4E4E7",
              backgroundColor:
                "#F8FAFC",
            }
      }
    >
      <span
        className="max-w-[70px] truncate text-[10px] font-black min-[400px]:max-w-[90px] min-[400px]:text-[11px]"
        style={
          accent
            ? {
                color:
                  theme.accent,
              }
            : {
                color:
                  "#27272A",
              }
        }
        title={String(value)}
      >
        {value}
      </span>

      <span className="shrink-0 text-[9px] font-bold text-zinc-500 min-[400px]:text-[10px]">
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
  disabled = false,
  primary = false,
  danger = false,
  theme,
  className = "",
}) {
  const isDisabled =
    loading || disabled;

  /* ========================================================
     DEFAULT BUTTON
  ======================================================== */

  let styles =
    "border-zinc-200/90 bg-white text-zinc-600 shadow-sm hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-md";

  /* ========================================================
     DESTRUCTIVE BUTTON
  ======================================================== */

  if (danger) {
    styles =
      "border-red-200 bg-red-50 text-red-600 shadow-sm hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow-md";
  }

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={`flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[10px] font-black transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none min-[400px]:h-11 min-[400px]:gap-2 min-[400px]:px-3 min-[400px]:text-[11px] sm:px-4 sm:text-[12px] ${styles} ${className}`}
      style={
        primary &&
        !isDisabled
          ? {
              borderColor:
                `${theme.accent}25`,
              backgroundColor:
                theme.accentSoft,
              color:
                theme.accent,
              boxShadow:
                `0 6px 18px ${theme.accent}0F`,
            }
          : undefined
      }
    >
      <Icon
        size={14}
        className={`shrink-0 min-[400px]:h-[15px] min-[400px]:w-[15px] ${
          loading
            ? "animate-spin"
            : ""
        }`}
      />

      <span className="min-w-0 truncate">
        {loading
          ? "Refreshing..."
          : label}
      </span>
    </button>
  );
}