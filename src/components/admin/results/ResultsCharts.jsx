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

/* ==========================================================
   ROLE CHART COLORS
========================================================== */

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

/* ==========================================================
   RESULTS CHARTS
========================================================== */

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
                  stroke="rgba(24,24,27,.08)"
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
                    fill: "rgba(24,24,27,.035)",
                  }}
                />

                <Bar
                  dataKey="avgScore"
                  fill={
                    theme.chart ||
                    theme.accent
                  }
                  radius={[6, 6, 2, 2]}
                  maxBarSize={36}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart
            theme={theme}
          />
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
            {/* ============================================
                DONUT
            ============================================ */}

            <div className="relative h-[260px] min-w-0">
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
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    animationDuration={900}
                  >
                    {chapterStats.map(
                      (item, index) => (
                        <Cell
                          key={
                            item.chapter
                          }
                          fill={
                            pieColors[
                              index %
                                pieColors.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    content={
                      <PieChartTooltip />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* ==========================================
                  CENTER DECORATION
              ========================================== */}

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                    Total
                  </p>

                  <p className="mt-1 text-[24px] font-black tracking-[-0.04em] text-zinc-900">
                    {allRows.length}
                  </p>

                  <p className="text-[9px] font-semibold text-zinc-500">
                    attempts
                  </p>
                </div>
              </div>
            </div>

            {/* ============================================
                LEGEND
            ============================================ */}

            <div
              className="admin-hidden-scrollbar max-h-[240px] space-y-2 overflow-y-auto pr-1"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {chapterStats.map(
                (item, index) => (
                  <div
                    key={item.chapter}
                    className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 transition hover:border-zinc-200/80 hover:bg-[#F8FAFC]"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          pieColors[
                            index %
                              pieColors.length
                          ],
                      }}
                    />

                    <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-zinc-600">
                      {item.chapter}
                    </p>

                    <p className="text-[12px] font-black text-zinc-900">
                      {
                        item.participants
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <EmptyChart
            theme={theme}
          />
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
    <div className="relative overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition duration-200 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)]">
      {/* ===================================================
          SUBTLE GLOW
      =================================================== */}

      <div
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full blur-[80px]"
        style={{
          backgroundColor:
            `${theme.accent}08`,
        }}
      />

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="relative flex items-center gap-3 border-b border-zinc-200/80 px-4 py-4 sm:px-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
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
            size={17}
            strokeWidth={1.9}
          />
        </div>

        <div className="min-w-0">
          <h3 className="text-[15px] font-black text-zinc-900">
            {title}
          </h3>

          <p className="mt-1 text-[12px] leading-5 text-zinc-500">
            {description}
          </p>
        </div>
      </div>

      {/* ===================================================
          CHART
      =================================================== */}

      <div className="relative p-4 sm:p-5">
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
    <div className="rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 shadow-[0_12px_30px_rgba(24,24,27,0.12)]">
      <p className="max-w-[190px] truncate text-[12px] font-black text-zinc-900">
        {label}
      </p>

      <p className="mt-1.5 text-[12px] text-zinc-500">
        Average Score:{" "}
        <span className="font-black text-zinc-900">
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

  const item =
    payload[0]?.payload;

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 shadow-[0_12px_30px_rgba(24,24,27,0.12)]">
      <p className="max-w-[190px] truncate text-[12px] font-black text-zinc-900">
        {item?.chapter}
      </p>

      <p className="mt-1.5 text-[12px] text-zinc-500">
        Attempts:{" "}
        <span className="font-black text-zinc-900">
          {item?.participants}
        </span>
      </p>
    </div>
  );
}

/* ==========================================================
   EMPTY CHART
========================================================== */

function EmptyChart({
  theme,
}) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center rounded-2xl bg-[#F8FAFC] text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl border"
        style={{
          borderColor:
            `${theme.accent}15`,
          backgroundColor:
            theme.accentSoft,
          color:
            theme.accent,
        }}
      >
        <BarChart3 size={21} />
      </div>

      <p className="mt-3 text-[13px] font-black text-zinc-700">
        No chart data
      </p>

      <p className="mt-1 max-w-[230px] text-[12px] leading-5 text-zinc-500">
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
      participants:
        stat.participants,

      avgScore: Number(
        (
          stat.total /
          stat.participants
        ).toFixed(2)
      ),
    })
  );
}