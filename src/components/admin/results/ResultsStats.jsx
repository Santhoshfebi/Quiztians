import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  CircleGauge,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

export default function ResultsStats({ allRows, theme }) {
  const stats = useMemo(
    () => calculateStats(allRows),
    [allRows]
  );

  const items = [
    {
      title: "Total Attempts",
      value: stats.total,
      icon: Activity,
    },
    {
      title: "Unique Participants",
      value: stats.uniqueParticipants,
      icon: Users,
    },
    {
      title: "Total Chapters",
      value: stats.totalChapters,
      icon: BookOpen,
    },
    {
      title: "Average Score",
      value: stats.avgScore,
      icon: CircleGauge,
    },
    {
      title: "Top Chapter",
      value: stats.topScoringChapter,
      icon: Trophy,
      textValue: true,
      highlight: true,
    },
    {
      title: "New Today",
      value: stats.newToday,
      icon: UserRound,
    },
  ];

  return (
    <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => (
        <StatCard
          key={item.title}
          {...item}
          index={index}
          theme={theme}
        />
      ))}
    </section>
  );
}

/* ==========================================================
   STAT CARD
========================================================== */

function StatCard({
  title,
  value,
  icon: Icon,
  theme,
  textValue = false,
  highlight = false,
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
        delay: index * 0.035,
      }}
      whileHover={{
        y: -2,
      }}
      className="group relative min-w-0 overflow-hidden rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition duration-200 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)]"
    >
      {/* =====================================================
          SUBTLE ROLE GLOW
      ===================================================== */}

      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-[45px] transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundColor: `${theme.accent}12`,
        }}
      />

      <div className="relative">
        {/* ===================================================
            ICON
        =================================================== */}

        <div className="flex items-center justify-between gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${theme.accent}18`,
              backgroundColor: theme.accentSoft,
              color: theme.accent,
            }}
          >
            <Icon
              size={17}
              strokeWidth={1.9}
            />
          </div>

          {highlight && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-amber-700">
              Best
            </span>
          )}
        </div>

        {/* ===================================================
            LABEL
        =================================================== */}

        <p className="mt-4 text-[11px] font-bold leading-4 text-zinc-500 sm:text-[12px]">
          {title}
        </p>

        {/* ===================================================
            VALUE
        =================================================== */}

        <p
          className={`mt-1.5 font-black tracking-[-0.035em] text-zinc-900 ${
            textValue
              ? "truncate text-[15px] sm:text-[16px]"
              : "text-[30px] sm:text-[32px]"
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
            BOTTOM ACCENT
        =================================================== */}

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full w-8 rounded-full transition-all duration-300 group-hover:w-14"
            style={{
              backgroundColor: theme.accent,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ==========================================================
   STAT CALCULATIONS
========================================================== */

function calculateStats(allRows) {
  const total = allRows.length;

  // Unique chapters
  const chapters = [
    ...new Set(
      allRows
        .map((row) => row.chapter)
        .filter(Boolean)
    ),
  ];

  // Average score
  const totalScore = allRows.reduce(
    (sum, row) =>
      sum + Number(row.score || 0),
    0
  );

  const avgScore =
    total > 0
      ? (totalScore / total).toFixed(2)
      : "0.00";

  // Unique participants by phone
  const phones = allRows
    .map((row) => row.phone)
    .filter(Boolean)
    .map((phone) =>
      String(phone).trim()
    );

  const uniqueParticipants =
    new Set(phones).size;

  // Chapter score calculations
  const chapterScores = {};
  const chapterCounts = {};

  allRows.forEach((row) => {
    if (
      !row.chapter ||
      row.score === null ||
      row.score === undefined
    ) {
      return;
    }

    chapterScores[row.chapter] =
      (chapterScores[row.chapter] || 0) +
      Number(row.score);

    chapterCounts[row.chapter] =
      (chapterCounts[row.chapter] || 0) + 1;
  });

  const chapterAverages =
    Object.entries(chapterScores).map(
      ([chapter, score]) => ({
        chapter,
        avgScore:
          score /
          chapterCounts[chapter],
      })
    );

  const topScoringChapter =
    chapterAverages.sort(
      (a, b) =>
        b.avgScore - a.avgScore
    )[0]?.chapter || "N/A";

  // New attempts today
  const today =
    new Date().toDateString();

  const newToday = allRows.filter(
    (row) => {
      if (!row.created_at) {
        return false;
      }

      return (
        new Date(
          row.created_at
        ).toDateString() === today
      );
    }
  ).length;

  return {
    total,
    uniqueParticipants,
    totalChapters:
      chapters.length,
    avgScore,
    topScoringChapter,
    newToday,
  };
}