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
            className="min-w-0 rounded-[18px] border border-white/[0.055] bg-[#111114] p-4"
        >
            {/* ICON */}
            <div className="flex items-center justify-between gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                        backgroundColor: theme.accentSoft,
                        color: theme.accent,
                    }}
                >
                    <Icon size={17} />
                </div>
            </div>

            {/* LABEL */}
            <p className="mt-4 text-[12px] font-bold leading-4 text-zinc-500">
                {title}
            </p>

            {/* VALUE */}
            <p
                className={`mt-1.5 font-black tracking-[-0.035em] text-zinc-100 ${textValue
                        ? "truncate text-[16px] sm:text-[17px]"
                        : "text-[30px] sm:text-[32px]"
                    }`}
                title={textValue ? String(value) : undefined}
            >
                {value}
            </p>
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
        (sum, row) => sum + Number(row.score || 0),
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
        .map((phone) => String(phone).trim());

    const uniqueParticipants = new Set(phones).size;

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

    const chapterAverages = Object.entries(
        chapterScores
    ).map(([chapter, score]) => ({
        chapter,
        avgScore: score / chapterCounts[chapter],
    }));

    const topScoringChapter =
        chapterAverages.sort(
            (a, b) => b.avgScore - a.avgScore
        )[0]?.chapter || "N/A";

    // New attempts today
    const today = new Date().toDateString();

    const newToday = allRows.filter((row) => {
        if (!row.created_at) {
            return false;
        }

        return (
            new Date(row.created_at).toDateString() === today
        );
    }).length;

    return {
        total,
        uniqueParticipants,
        totalChapters: chapters.length,
        avgScore,
        topScoringChapter,
        newToday,
    };
}