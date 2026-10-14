import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  Activity,
  BarChart3,
  BookOpen,
  CircleGauge,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// DASHBOARD
// ===========================================================

export default function AdminPanel() {
  const [rows, setRows] = useState([]);
  const [activity, setActivity] = useState([]);

  // =========================================================
  // RESULTS + REALTIME
  // ===========================================================

  useEffect(() => {
    let mounted = true;

    const fetchResults = async () => {
      try {
        const { data, error } = await supabase
          .from("results")
          .select("*");

        if (error) {
          console.error(
            "Unable to load results:",
            error
          );

          return;
        }

        if (mounted && data) {
          setRows(data);
        }
      } catch (error) {
        console.error(
          "Results fetch failed:",
          error
        );
      }
    };

    fetchResults();

    const channel = supabase
      .channel("results-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "results",
        },
        (payload) => {
          setRows((prev) => [
            ...prev,
            payload.new,
          ]);

          setActivity((prev) => [
            payload.new,
            ...prev.slice(0, 8),
          ]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;

      supabase.removeChannel(channel);
    };
  }, []);

  // =========================================================
  // CHAPTER STATS
  // ===========================================================

  const chapterStats = useMemo(() => {
    const map = {};

    rows.forEach((row) => {
      if (!row.chapter) return;

      map[row.chapter] =
        (map[row.chapter] || 0) + 1;
    });

    return Object.entries(map).map(
      ([chapter, count]) => ({
        chapter,
        participants: count,
      })
    );
  }, [rows]);

  // =========================================================
  // METRICS
  // ===========================================================

  const totalParticipants = rows.length;

  const avgScore = Math.round(
    rows.reduce(
      (sum, row) =>
        sum + (row.score || 0),
      0
    ) / (rows.length || 1)
  );

  // =========================================================
  // SCORE DISTRIBUTION
  // ===========================================================

  const scoreDistribution = useMemo(() => {
    const buckets = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    rows.forEach((row) => {
      const score = row.score || 0;

      if (score <= 20) {
        buckets["0-20"]++;
      } else if (score <= 40) {
        buckets["21-40"]++;
      } else if (score <= 60) {
        buckets["41-60"]++;
      } else if (score <= 80) {
        buckets["61-80"]++;
      } else {
        buckets["81-100"]++;
      }
    });

    return Object.entries(buckets).map(
      ([range, count]) => ({
        range,
        count,
      })
    );
  }, [rows]);

  // =========================================================
  // LAYOUT
  // ===========================================================

  return (
    <AdminLayout>
      {({
        user,
        theme,
        isSuperAdmin,
      }) => (
        <DashboardContent
          user={user}
          theme={theme}
          isSuperAdmin={isSuperAdmin}
          rows={rows}
          activity={activity}
          chapterStats={chapterStats}
          scoreDistribution={
            scoreDistribution
          }
          totalParticipants={
            totalParticipants
          }
          avgScore={avgScore}
        />
      )}
    </AdminLayout>
  );
}

// ===========================================================
// DASHBOARD CONTENT
// ===========================================================

function DashboardContent({
  user,
  theme,
  isSuperAdmin,
  activity,
  chapterStats,
  scoreDistribution,
  totalParticipants,
  avgScore,
}) {
  // =========================================================
  // CHART COLORS
  // ===========================================================

  const chartColors = useMemo(() => {
    const palette = isSuperAdmin
      ? [
          "#B86C3A",
          "#D09A72",
          "#9A5423",
          "#E1B18D",
          "#74401F",
          "#C47C4B",
        ]
      : [
          "#8B5CF6",
          "#6366F1",
          "#A78BFA",
          "#7C3AED",
          "#818CF8",
          "#C4B5FD",
        ];

    return chapterStats.map(
      (_, index) =>
        palette[index % palette.length]
    );
  }, [chapterStats, isSuperAdmin]);

  return (
    <>
      {/* =====================================================
          HERO
      ===================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="relative overflow-hidden rounded-[24px] border border-white/[0.065] bg-[#111114] p-5 sm:p-7 lg:p-8"
      >
        <div
          className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full ${theme.glow} blur-[100px]`}
        />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles
                size={14}
                style={{
                  color: theme.accent,
                }}
              />

              <p
                className="text-[11px] font-black uppercase tracking-[0.15em]"
                style={{
                  color: theme.accent,
                }}
              >
                Dashboard Overview
              </p>
            </div>

            <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-white sm:text-[32px] lg:text-[36px]">
              Welcome back
              {user?.user_metadata?.full_name
                ? `, ${user.user_metadata.full_name}`
                : ""}
              .
            </h2>

            <p className="mt-3 max-w-xl text-[13px] leading-6 text-zinc-500 sm:text-[14px]">
              Monitor participation,
              performance and live quiz
              activity across QUIZTIANS.
            </p>
          </div>

          {/* SYSTEM STATUS */}

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.05] bg-black/10 px-4 py-3.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04]">
              <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-[#111114] bg-emerald-500" />

              <CircleGauge
                size={18}
                className="text-emerald-500/70"
              />
            </div>

            <div>
              <p className="text-[12px] font-black text-zinc-200">
                System online
              </p>

              <p className="mt-1 text-[11px] text-zinc-600">
                Live results connected
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* =====================================================
          METRICS
      ===================================================== */}

      <section className="mt-5 grid grid-cols-2 gap-3 lg:mt-6 lg:grid-cols-3 lg:gap-4">
        <MetricCard
          title="Participants"
          value={totalParticipants}
          icon={Users}
          theme={theme}
          delay={0.05}
        />

        <MetricCard
          title="Chapters"
          value={chapterStats.length}
          icon={BookOpen}
          theme={theme}
          delay={0.1}
        />

        <MetricCard
          title="Average Score"
          value={avgScore}
          icon={Trophy}
          theme={theme}
          delay={0.15}
          className="col-span-2 lg:col-span-1"
        />
      </section>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        {/* ===================================================
            CHAPTER DISTRIBUTION
        =================================================== */}

        <DashboardCard>
          <CardHeading
            icon={BookOpen}
            title="Chapter Distribution"
            description="Participation by chapter"
            theme={theme}
          />

          {chapterStats.length === 0 ? (
            <EmptyChart text="No chapter data available" />
          ) : (
            <>
              <div className="mt-4 h-[250px] sm:h-[280px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={chapterStats}
                      dataKey="participants"
                      nameKey="chapter"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="transparent"
                    >
                      {chapterStats.map(
                        (_, index) => (
                          <Cell
                            key={index}
                            fill={
                              chartColors[
                                index
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      content={
                        <ChartTooltip />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* LEGEND */}

              <div className="mt-2 grid gap-2">
                {chapterStats
                  .slice(0, 5)
                  .map(
                    (
                      chapter,
                      index
                    ) => (
                      <div
                        key={
                          chapter.chapter
                        }
                        className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.015] px-3.5 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                chartColors[
                                  index
                                ],
                            }}
                          />

                          <span className="truncate text-[12px] font-medium text-zinc-500">
                            {
                              chapter.chapter
                            }
                          </span>
                        </div>

                        <span className="ml-3 text-[12px] font-black text-zinc-300">
                          {
                            chapter.participants
                          }
                        </span>
                      </div>
                    )
                  )}
              </div>
            </>
          )}
        </DashboardCard>

        {/* ===================================================
            SCORE DISTRIBUTION
        =================================================== */}

        <DashboardCard>
          <CardHeading
            icon={BarChart3}
            title="Score Distribution"
            description="Participant performance ranges"
            theme={theme}
          />

          <div className="mt-5 h-[300px] sm:h-[330px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={scoreDistribution}
                margin={{
                  top: 10,
                  right: 5,
                  left: -15,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.04)"
                />

                <XAxis
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#71717A",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#71717A",
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  cursor={{
                    fill:
                      "rgba(255,255,255,.025)",
                  }}
                  content={
                    <ChartTooltip />
                  }
                />

                <Bar
                  dataKey="count"
                  fill={theme.chart}
                  radius={[
                    7,
                    7,
                    2,
                    2,
                  ]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </section>

      {/* =====================================================
          LIVE ACTIVITY
      ===================================================== */}

      <section className="mt-4">
        <DashboardCard>
          <div className="flex items-center justify-between gap-4">
            <CardHeading
              icon={Activity}
              title="Live Activity"
              description="New quiz submissions"
              theme={theme}
            />

            <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/[0.035] px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-500/70">
                Live
              </span>
            </div>
          </div>

          <div className="mt-5">
            {activity.length === 0 ? (
              <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.05] bg-white/[0.01] px-5 text-center">
                <Activity
                  size={24}
                  className="text-zinc-700"
                />

                <p className="mt-3 text-[13px] font-bold text-zinc-500">
                  Waiting for activity
                </p>

                <p className="mt-1 text-[11px] text-zinc-700">
                  New quiz submissions
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activity.map(
                  (entry, index) => (
                    <motion.div
                      key={
                        entry.id ||
                        `${entry.name}-${index}`
                      }
                      initial={{
                        opacity: 0,
                        x: -8,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      className="group flex items-center gap-3 py-4"
                    >
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02]">
                        <Users
                          size={16}
                          className="text-zinc-500"
                        />

                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111114] bg-emerald-500" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-zinc-200">
                          {entry.name ||
                            "Participant"}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-zinc-600">
                          {entry.chapter ||
                            "Quiz submission"}
                        </p>
                      </div>

                      {entry.score !==
                        undefined && (
                        <div className="text-right">
                          <p className="text-[13px] font-black text-zinc-300">
                            {
                              entry.score
                            }
                          </p>

                          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-700">
                            Score
                          </p>
                        </div>
                      )}

                      <span className="hidden text-[11px] text-zinc-700 sm:block">
                        now
                      </span>
                    </motion.div>
                  )
                )}
              </div>
            )}
          </div>
        </DashboardCard>
      </section>
    </>
  );
}

// ===========================================================
// METRIC CARD
// ===========================================================

function MetricCard({
  title,
  value,
  icon: Icon,
  theme,
  delay = 0,
  className = "",
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#111114] p-4 sm:p-5 ${className}`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-[55px]"
        style={{
          backgroundColor:
            theme.accentSoft,
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-600">
            {title}
          </p>

          <h3 className="mt-3 text-[32px] font-black tracking-[-0.045em] text-white sm:text-[38px]">
            <CountUp
              end={value}
              duration={1.3}
            />
          </h3>
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor:
              `${theme.accent}20`,
            backgroundColor:
              theme.accentSoft,
          }}
        >
          <Icon
            size={18}
            strokeWidth={1.8}
            style={{
              color: theme.accent,
            }}
          />
        </div>
      </div>

      <div className="relative mt-4 h-px overflow-hidden bg-white/[0.04]">
        <div
          className="h-full w-1/3"
          style={{
            backgroundColor:
              theme.accent,
            opacity: 0.6,
          }}
        />
      </div>
    </motion.div>
  );
}

// ===========================================================
// DASHBOARD CARD
// ===========================================================

function DashboardCard({
  children,
  className = "",
}) {
  return (
    <div
      className={`rounded-[22px] border border-white/[0.06] bg-[#111114] p-4 sm:p-5 lg:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

// ===========================================================
// CARD HEADING
// ===========================================================

function CardHeading({
  icon: Icon,
  title,
  description,
  theme,
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
        style={{
          borderColor:
            `${theme.accent}18`,
          backgroundColor:
            theme.accentSoft,
        }}
      >
        <Icon
          size={17}
          strokeWidth={1.8}
          style={{
            color: theme.accent,
          }}
        />
      </div>

      <div>
        <h3 className="text-[15px] font-black text-zinc-200">
          {title}
        </h3>

        <p className="mt-1 text-[12px] text-zinc-600">
          {description}
        </p>
      </div>
    </div>
  );
}

// ===========================================================
// TOOLTIP
// ===========================================================

function ChartTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  const entry = payload[0];

  const displayLabel =
    label ||
    entry?.payload?.chapter ||
    entry?.name ||
    "";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#18181B]/95 px-3.5 py-3 shadow-2xl backdrop-blur-xl">
      {displayLabel && (
        <p className="text-[11px] font-semibold text-zinc-500">
          {displayLabel}
        </p>
      )}

      <p className="mt-1 text-[14px] font-black text-white">
        {entry?.value ?? 0}
      </p>
    </div>
  );
}

// ===========================================================
// EMPTY CHART
// ===========================================================

function EmptyChart({ text }) {
  return (
    <div className="mt-5 flex h-[270px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.05] bg-white/[0.01] px-5 text-center">
      <BarChart3
        size={26}
        className="text-zinc-700"
      />

      <p className="mt-3 text-[12px] font-semibold text-zinc-600">
        {text}
      </p>
    </div>
  );
}