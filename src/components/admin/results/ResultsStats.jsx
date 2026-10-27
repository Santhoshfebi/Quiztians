import { useMemo } from "react";
import { motion } from "framer-motion";

import {
  Activity,
  BookOpen,
  CircleGauge,
  Clock3,
  Users,
} from "lucide-react";

/* ==========================================================
   RESULTS STATS
========================================================== */

export default function ResultsStats({
  allRows,
  theme,
}) {
  const stats = useMemo(
    () => calculateStats(allRows),
    [allRows]
  );

  const items = [
    {
      title: "Total Submissions",
      value: stats.total,
      icon: Activity,
      description: "All quiz submissions",
    },
    {
      title: "Unique Participants",
      value: stats.uniqueParticipants,
      icon: Users,
      description: "Unique phone numbers",
    },
    {
      title: "Average Score",
      value: stats.avgScore,
      icon: CircleGauge,
      description: "Across all submissions",
    },
    {
      title: "Fastest Completion",
      value: stats.fastestCompletion,
      icon: Clock3,
      description: "Best valid completion time",
      textValue: true,
    },
    {
      title: "Active Chapters",
      value: stats.totalChapters,
      icon: BookOpen,
      description: "Chapters with results",
      spanLast: true,
    },
  ];

  return (
    <section className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map(
        (item, index) => (
          <StatCard
            key={item.title}
            {...item}
            index={index}
            theme={theme}
          />
        )
      )}
    </section>
  );
}

/* ==========================================================
   STAT CARD
========================================================== */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  theme,
  textValue = false,
  spanLast = false,
  index,
}) {
  return (
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
        delay: index * 0.04,
      }}
      whileHover={{
        y: -2,
      }}
      className={`group relative min-w-0 overflow-hidden rounded-[16px] border border-zinc-200/90 bg-white p-3 shadow-[0_6px_20px_rgba(24,24,27,0.055)] transition duration-200 hover:border-zinc-300 hover:shadow-[0_10px_26px_rgba(24,24,27,0.08)] min-[400px]:p-3.5 sm:rounded-[18px] sm:p-4 ${spanLast
          ? "col-span-2 md:col-span-1"
          : ""
        }`}
    >
      {/* =====================================================
          SUBTLE ROLE GLOW
      ===================================================== */}

      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-[45px] transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundColor:
            `${theme.accent}12`,
        }}
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative flex h-full min-h-[150px] flex-col min-[400px]:min-h-[158px] sm:min-h-[170px] xl:min-h-[178px]">
        {/* ===================================================
            TOP ROW
        =================================================== */}

        <div className="flex items-start justify-between gap-2">
          {/* ICON */}

          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border sm:h-10 sm:w-10 sm:rounded-xl"
            style={{
              borderColor:
                `${theme.accent}18`,
              backgroundColor:
                theme.accentSoft,
              color:
                theme.accent,
            }}
          >
            <Icon
              size={16}
              strokeWidth={1.9}
              className="sm:h-[17px] sm:w-[17px]"
            />
          </div>

          {/* LIVE INDICATOR */}

          <div className="flex shrink-0 items-center gap-1.5 pt-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  theme.accent,
              }}
            />

            <span className="hidden text-[8px] font-black uppercase tracking-[0.1em] text-zinc-400 sm:block">
              Live
            </span>
          </div>
        </div>

        {/* ===================================================
            LABEL
        =================================================== */}

        <p className="mt-3 line-clamp-2 min-h-[32px] text-[9px] font-bold leading-4 text-zinc-500 min-[400px]:text-[10px] sm:mt-4 sm:min-h-0 sm:text-[11px] lg:text-[12px]">
          {title}
        </p>

        {/* ===================================================
            VALUE
        =================================================== */}

        <p
          className={`mt-1 min-w-0 font-black tracking-[-0.035em] text-zinc-900 ${textValue
              ? "truncate text-[18px] min-[400px]:text-[20px] sm:text-[22px] xl:text-[24px]"
              : "text-[25px] min-[400px]:text-[27px] sm:text-[30px] xl:text-[32px]"
            }`}
          title={
            textValue
              ? String(value)
              : undefined
          }
        >
          {value}
        </p>

        {/* ===================================================
            DESCRIPTION
        =================================================== */}

        <p className="mt-1 line-clamp-2 text-[8px] leading-3.5 text-zinc-400 min-[400px]:text-[9px] min-[400px]:leading-4 sm:mt-1.5 sm:text-[10px]">
          {description}
        </p>

        {/* ===================================================
            BOTTOM ACCENT
        =================================================== */}

        <div className="mt-auto pt-3 sm:pt-4">
          <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full w-7 rounded-full transition-all duration-300 group-hover:w-12 sm:w-8 sm:group-hover:w-14"
              style={{
                backgroundColor:
                  theme.accent,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ==========================================================
   STAT CALCULATIONS
========================================================== */

function calculateStats(allRows = []) {
  /* ========================================================
     TOTAL SUBMISSIONS
  ======================================================== */

  const total = allRows.length;

  /* ========================================================
     ACTIVE CHAPTERS

     Counts unique chapters represented in the results table.
  ======================================================== */

  const chapters = [
    ...new Set(
      allRows
        .map((row) => row.chapter)
        .filter(Boolean)
        .map((chapter) =>
          String(chapter).trim()
        )
        .filter(Boolean)
    ),
  ];

  /* ========================================================
     AVERAGE SCORE
  ======================================================== */

  const validScores = allRows
    .map((row) => Number(row.score))
    .filter((score) =>
      Number.isFinite(score)
    );

  const totalScore =
    validScores.reduce(
      (sum, score) =>
        sum + score,
      0
    );

  const avgScore =
    validScores.length > 0
      ? (
        totalScore /
        validScores.length
      ).toFixed(2)
      : "0.00";

  /* ========================================================
     UNIQUE PARTICIPANTS

     Phone number is the primary participant identifier.

     Empty phone values are ignored so they do not become one
     artificial participant.
  ======================================================== */

  const phones = allRows
    .map((row) => row.phone)
    .filter(
      (phone) =>
        phone !== null &&
        phone !== undefined
    )
    .map((phone) =>
      String(phone).trim()
    )
    .filter(Boolean);

  const uniqueParticipants =
    new Set(phones).size;

  /* ========================================================
     FASTEST COMPLETION

     time_taken is expected to contain elapsed seconds.

     Ignore:
       - null
       - undefined
       - non-numeric values
       - zero
       - negative values
  ======================================================== */

  const validTimes = allRows
    .map((row) =>
      Number(row.time_taken)
    )
    .filter(
      (time) =>
        Number.isFinite(time) &&
        time > 0
    );

  const fastestSeconds =
    validTimes.length > 0
      ? Math.min(...validTimes)
      : null;

  const fastestCompletion =
    formatCompletionTime(
      fastestSeconds
    );

  return {
    total,
    uniqueParticipants,
    totalChapters:
      chapters.length,
    avgScore,
    fastestCompletion,
  };
}

/* ==========================================================
   COMPLETION TIME FORMATTER
========================================================== */

function formatCompletionTime(
  seconds
) {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return "—";
  }

  const roundedSeconds =
    Math.round(seconds);

  if (roundedSeconds < 60) {
    return `${roundedSeconds}s`;
  }

  const minutes =
    Math.floor(
      roundedSeconds / 60
    );

  const remainingSeconds =
    roundedSeconds % 60;

  if (
    remainingSeconds === 0
  ) {
    return `${minutes}m`;
  }

  return `${minutes}m ${String(
    remainingSeconds
  ).padStart(2, "0")}s`;
}