import { useMemo } from "react";
import {
    BarChart3,
    Users,
} from "lucide-react";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const PIE_COLORS_ADMIN = [
    "#8B5CF6",
    "#6366F1",
    "#A78BFA",
    "#818CF8",
    "#C4B5FD",
    "#4F46E5",
];

const PIE_COLORS_SUPERADMIN = [
    "#B86C3A",
    "#D09A72",
    "#A56234",
    "#C98250",
    "#8F4B1E",
    "#E4B18D",
];

export default function ResultsCharts({
    allRows,
    theme,
}) {
    const chapterStats = useMemo(
        () => getChapterStats(allRows),
        [allRows]
    );

    const isCopper =
        theme.accent === "#B86C3A";

    const pieColors = isCopper
        ? PIE_COLORS_SUPERADMIN
        : PIE_COLORS_ADMIN;

    return (
        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* ==================================================
          AVERAGE SCORE BAR CHART
      ================================================== */}

            <ChartCard
                title="Average Score per Chapter"
                description="Average performance across all attempts."
                icon={BarChart3}
                theme={theme}
            >
                {chapterStats.length ? (
                    <div className="h-[280px] w-full sm:h-[310px]">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <BarChart
                                data={chapterStats}
                                margin={{
                                    top: 15,
                                    right: 10,
                                    left: -18,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid
                                    vertical={false}
                                    stroke="rgba(255,255,255,.05)"
                                    strokeDasharray="4 4"
                                />

                                <XAxis
                                    dataKey="chapter"
                                    tick={{
                                        fill: "#71717A",
                                        fontSize: 11,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    angle={-12}
                                    textAnchor="end"
                                    height={55}
                                />

                                <YAxis
                                    tick={{
                                        fill: "#71717A",
                                        fontSize: 11,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <Tooltip
                                    content={<BarChartTooltip />}
                                    cursor={{
                                        fill: "rgba(255,255,255,.025)",
                                    }}
                                />

                                <Bar
                                    dataKey="avgScore"
                                    fill={theme.chart || theme.accent}
                                    radius={[6, 6, 2, 2]}
                                    maxBarSize={36}
                                    animationDuration={900}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <EmptyChart />
                )}
            </ChartCard>

            {/* ==================================================
          ATTEMPTS BY CHAPTER
      ================================================== */}

            <ChartCard
                title="Attempts by Chapter"
                description="Distribution of result records across chapters."
                icon={Users}
                theme={theme}
            >
                {chapterStats.length ? (
                    <div className="grid min-h-[280px] grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_170px]">
                        {/* DONUT */}
                        <div className="h-[260px] min-w-0">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <PieChart>
                                    <Pie
                                        data={chapterStats}
                                        dataKey="participants"
                                        nameKey="chapter"
                                        innerRadius="53%"
                                        outerRadius="82%"
                                        paddingAngle={2}
                                        stroke="transparent"
                                        animationDuration={900}
                                    >
                                        {chapterStats.map(
                                            (item, index) => (
                                                <Cell
                                                    key={item.chapter}
                                                    fill={
                                                        pieColors[
                                                        index % pieColors.length
                                                        ]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip
                                        content={<PieChartTooltip />}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* LEGEND */}
                        <div className="admin-hidden-scrollbar max-h-[240px] space-y-2 overflow-y-auto">
                            {chapterStats.map(
                                (item, index) => (
                                    <div
                                        key={item.chapter}
                                        className="flex items-center gap-2.5"
                                    >
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    pieColors[
                                                    index % pieColors.length
                                                    ],
                                            }}
                                        />

                                        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-zinc-500">
                                            {item.chapter}
                                        </p>

                                        <p className="text-[12px] font-black text-zinc-300">
                                            {item.participants}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    <EmptyChart />
                )}
            </ChartCard>
        </section>
    );
}

/* ==========================================================
   CHART CARD
========================================================== */

function ChartCard({
    title,
    description,
    icon: Icon,
    theme,
    children,
}) {
    return (
        <div className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#111114]">
            {/* HEADER */}
            <div className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-4 sm:px-5">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                        backgroundColor: theme.accentSoft,
                        color: theme.accent,
                    }}
                >
                    <Icon size={17} />
                </div>

                <div className="min-w-0">
                    <h3 className="text-[15px] font-black text-zinc-200">
                        {title}
                    </h3>

                    <p className="mt-1 text-[12px] leading-5 text-zinc-600">
                        {description}
                    </p>
                </div>
            </div>

            {/* CHART */}
            <div className="p-4 sm:p-5">
                {children}
            </div>
        </div>
    );
}

/* ==========================================================
   BAR CHART TOOLTIP
========================================================== */

function BarChartTooltip({
    active,
    payload,
    label,
}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-white/[0.08] bg-[#18181B] px-3 py-2.5 shadow-xl shadow-black/30">
            <p className="max-w-[190px] truncate text-[12px] font-black text-zinc-300">
                {label}
            </p>

            <p className="mt-1.5 text-[12px] text-zinc-500">
                Average Score:{" "}
                <span className="font-black text-zinc-200">
                    {payload[0]?.value}
                </span>
            </p>
        </div>
    );
}

/* ==========================================================
   PIE CHART TOOLTIP
========================================================== */

function PieChartTooltip({
    active,
    payload,
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const item = payload[0]?.payload;

    return (
        <div className="rounded-xl border border-white/[0.08] bg-[#18181B] px-3 py-2.5 shadow-xl shadow-black/30">
            <p className="max-w-[190px] truncate text-[12px] font-black text-zinc-300">
                {item?.chapter}
            </p>

            <p className="mt-1.5 text-[12px] text-zinc-500">
                Attempts:{" "}
                <span className="font-black text-zinc-200">
                    {item?.participants}
                </span>
            </p>
        </div>
    );
}

/* ==========================================================
   EMPTY CHART
========================================================== */

function EmptyChart() {
    return (
        <div className="flex h-[280px] flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                <BarChart3
                    size={21}
                    className="text-zinc-700"
                />
            </div>

            <p className="mt-3 text-[13px] font-black text-zinc-500">
                No chart data
            </p>

            <p className="mt-1 max-w-[230px] text-[12px] leading-5 text-zinc-700">
                Results will appear here once quiz attempts are submitted.
            </p>
        </div>
    );
}

/* ==========================================================
   DATA HELPER
========================================================== */

function getChapterStats(allRows) {
    const stats = {};

    allRows.forEach((row) => {
        if (!row.chapter) {
            return;
        }

        if (!stats[row.chapter]) {
            stats[row.chapter] = {
                chapter: row.chapter,
                participants: 0,
                total: 0,
            };
        }

        stats[row.chapter].participants += 1;

        stats[row.chapter].total += Number(
            row.score || 0
        );
    });

    return Object.values(stats).map(
        (stat) => ({
            chapter: stat.chapter,
            participants: stat.participants,

            avgScore: Number(
                (
                    stat.total /
                    stat.participants
                ).toFixed(2)
            ),
        })
    );
}