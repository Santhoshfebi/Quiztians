import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Languages,
  AlertTriangle,
  CalendarClock,
  CircleGauge,
  Eye,
  Clock3,
  Megaphone,
  Plus,
  Settings,
  Radio,
  Bell,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import AdminLayout from "../components/admin/AdminLayout";
import { sendPushNotification } from "../services/notificationService";

// ===========================================================
// DASHBOARD
// ===========================================================

export default function AdminPanel() {
  const [rows, setRows] = useState([]);
  const [activity, setActivity] = useState([]);
  const [quizConfig, setQuizConfig] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [dashboardNow, setDashboardNow] = useState(() => Date.now());

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

          const latestActivity = [...data]
            .sort((a, b) => {
              const aTime = a?.created_at
                ? new Date(a.created_at).getTime()
                : 0;
              const bTime = b?.created_at
                ? new Date(b.created_at).getTime()
                : 0;

              return bTime - aTime;
            })
            .slice(0, 4);

          setActivity(latestActivity);
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
            ...prev.filter(
              (entry) => entry.id !== payload.new.id
            ),
          ].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      mounted = false;

      supabase.removeChannel(channel);
    };
  }, []);

  // =========================================================
  // QUIZ CONFIG + REALTIME
  // ===========================================================

  useEffect(() => {
    let mounted = true;

    const fetchQuizConfig = async () => {
      const { data, error } = await supabase
        .from("quiz_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Unable to load quiz config:", error);
        return;
      }

      if (mounted) {
        setQuizConfig(data || null);
      }
    };

    fetchQuizConfig();

    const channel = supabase
      .channel("dashboard-quiz-config")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_config",
        },
        () => {
          fetchQuizConfig();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================================================
  // ANNOUNCEMENTS + REALTIME
  // ===========================================================

  useEffect(() => {
    let mounted = true;

    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select(
          "id,title,message,type,is_active,start_at,end_at,created_at,updated_at"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Unable to load announcements:", error);
        return;
      }

      if (mounted) {
        setAnnouncements(data || []);
      }
    };

    fetchAnnouncements();

    const channel = supabase
      .channel("dashboard-announcements")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================================================
  // QUESTIONS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from("questions")
        .select(
          "id,chapter,question_en,question_ta,option_a_en,option_b_en,option_c_en,option_d_en,option_a_ta,option_b_ta,option_c_ta,option_d_ta,correct_answer,correct_answer_ta"
        );

      if (error) {
        console.error("Unable to load questions:", error);
        return;
      }

      if (mounted) {
        setQuestions(data || []);
      }
    };

    fetchQuestions();

    const channel = supabase
      .channel("dashboard-questions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
        },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================================================
  // DASHBOARD CLOCK
  // ===========================================================

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDashboardNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
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

  const activeChapterCount = Array.isArray(quizConfig?.active_chapters)
    ? quizConfig.active_chapters.length
    : 0;

  const questionHealth = useMemo(() => {
    const hasValue = (value) =>
      typeof value === "string" && value.trim().length > 0;

    const isBilingualReady = (question) =>
      [
        question.question_en,
        question.question_ta,
        question.option_a_en,
        question.option_b_en,
        question.option_c_en,
        question.option_d_en,
        question.option_a_ta,
        question.option_b_ta,
        question.option_c_ta,
        question.option_d_ta,
        question.correct_answer,
        question.correct_answer_ta,
      ].every(hasValue);

    const bilingual = questions.filter(isBilingualReady).length;

    return {
      bilingual,
      needsReview: questions.length - bilingual,
    };
  }, [questions]);

  const quizStartTime = useMemo(() => {
    if (!quizConfig?.start_time) return "Not set";

    const date = new Date(quizConfig.start_time);
    if (Number.isNaN(date.getTime())) return "Not set";

    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }, [quizConfig]);

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
  // QUIZ + ANNOUNCEMENT SNAPSHOT
  // ===========================================================

  const quizSnapshot = useMemo(() => {
    if (!quizConfig) {
      return {
        status: "unavailable",
        label: "Unavailable",
        countdown: "Quiz configuration not found",
      };
    }

    const startTime = quizConfig.start_time
      ? new Date(quizConfig.start_time).getTime()
      : null;

    if (!startTime || !Number.isFinite(startTime)) {
      return {
        status: "unavailable",
        label: "Not scheduled",
        countdown: "Set the next quiz start time",
      };
    }

    const difference = startTime - dashboardNow;

    if (difference > 0) {
      return {
        status: "upcoming",
        label: "Upcoming",
        countdown: formatDashboardCountdown(difference),
      };
    }

    return {
      status: "live",
      label: "Live",
      countdown: "Quiz is open for participants",
    };
  }, [quizConfig, dashboardNow]);

  const latestAnnouncement = useMemo(() => {
    return (
      announcements.find((announcement) => {
        if (!announcement?.is_active) return false;

        const startTime = announcement.start_at
          ? new Date(announcement.start_at).getTime()
          : null;

        const endTime = announcement.end_at
          ? new Date(announcement.end_at).getTime()
          : null;

        if (
          startTime !== null &&
          Number.isFinite(startTime) &&
          startTime > dashboardNow
        ) {
          return false;
        }

        if (
          endTime !== null &&
          Number.isFinite(endTime) &&
          endTime < dashboardNow
        ) {
          return false;
        }

        return true;
      }) || null
    );
  }, [announcements, dashboardNow]);

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
          activeChapterCount={activeChapterCount}
          totalQuestionCount={questions.length}
          bilingualCount={questionHealth.bilingual}
          needsReviewCount={questionHealth.needsReview}
          quizStartTime={quizStartTime}
          quizConfig={quizConfig}
          quizSnapshot={quizSnapshot}
          latestAnnouncement={latestAnnouncement}
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
  activeChapterCount,
  totalQuestionCount,
  bilingualCount,
  needsReviewCount,
  quizStartTime,
  quizConfig,
  quizSnapshot,
  latestAnnouncement,
}) {
  const navigate = useNavigate();

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
        className="relative overflow-hidden rounded-[20px] border border-zinc-200/90 bg-white p-4 shadow-[0_10px_30px_rgba(24,24,27,0.07)] sm:rounded-[24px] sm:p-7 lg:p-8"
      >
        {/* ROLE ACCENT GLOW */}

        <div
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[100px]"
          style={{
            backgroundColor: `${theme.accent}10`,
          }}
        />

        {/* SUBTLE GRID */}

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
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

            <h2 className="mt-3 text-[25px] font-black leading-[1.08] tracking-[-0.04em] text-zinc-900 sm:text-[32px] lg:text-[36px]">
              Welcome back
              {user?.user_metadata?.full_name
                ? `, ${user.user_metadata.full_name}`
                : ""}
              .
            </h2>

            <p className="mt-3 max-w-xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
              Monitor participation,
              performance and live quiz
              activity across QUIZTIANS.
            </p>
          </div>

          {/* SYSTEM STATUS */}

          <div className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-3.5 py-3 sm:w-auto sm:shrink-0 sm:px-4 sm:py-3.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50">
              <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />

              <CircleGauge
                size={18}
                className="text-emerald-600"
              />
            </div>

            <div>
              <p className="text-[12px] font-black text-zinc-900">
                System online
              </p>

              <p className="mt-1 text-[11px] text-zinc-500">
                Live results connected
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* =====================================================
          DASHBOARD INTELLIGENCE
      ===================================================== */}

      <section className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3 lg:mt-6 lg:grid-cols-3 lg:gap-4">
        <MetricCard
          title="Participants"
          value={totalParticipants}
          icon={Users}
          theme={theme}
          delay={0.05}
        />

        <MetricCard
          title="Avg. Score"
          value={avgScore}
          icon={Trophy}
          theme={theme}
          delay={0.08}
        />

        <MetricCard
          title="Active Chapters"
          value={activeChapterCount}
          icon={BookOpen}
          theme={theme}
          delay={0.11}
        />

        <MetricCard
          title="Bilingual"
          value={bilingualCount}
          icon={Languages}
          theme={theme}
          delay={0.14}
        />

        <MetricCard
          title="Quiz Start Time"
          value={quizStartTime}
          icon={CalendarClock}
          theme={theme}
          delay={0.17}
          textValue
        />

        <MetricCard
          title="Needs Review"
          value={needsReviewCount}
          icon={AlertTriangle}
          theme={theme}
          delay={0.2}
          warning={needsReviewCount > 0}
        />
      </section>

      {/* =====================================================
          COMMAND CENTER
      ===================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="mt-5 lg:mt-6"
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={13} style={{ color: theme.accent }} />
              <p
                className="text-[10px] font-black uppercase tracking-[0.15em]"
                style={{ color: theme.accent }}
              >
                Command Center
              </p>
            </div>

            <h3 className="mt-2 text-[18px] font-black tracking-[-0.025em] text-zinc-900 sm:text-[20px]">
              Manage QUIZTIANS
            </h3>

            <p className="mt-1 text-[11px] leading-5 text-zinc-500 sm:text-[12px]">
              Quick access to the tools you use to run quizzes and monitor activity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          <CommandCenterCard
            icon={Plus}
            title="Add Questions"
            description="Create new MCQs"
            onClick={() => navigate("/admin/add-questions")}
            theme={theme}
            featured
          />

          <CommandCenterCard
            icon={BookOpen}
            title="Question Bank"
            description="Manage questions"
            onClick={() => navigate("/admin/preview-questions")}
            theme={theme}
          />

          <CommandCenterCard
            icon={Settings}
            title="Quiz Config"
            description="Schedule and configure"
            onClick={() => navigate("/admin/quiz-config")}
            theme={theme}
          />

          <CommandCenterCard
            icon={Radio}
            title="Live Control"
            description="Monitor live event"
            onClick={() => navigate("/admin/live-control")}
            theme={theme}
          />

          <CommandCenterCard
            icon={Trophy}
            title="Results"
            description="Quiz submissions"
            onClick={() => navigate("/admin/view-results")}
            theme={theme}
          />

          <CommandCenterCard
            icon={BarChart3}
            title="Analytics"
            description="Performance insights"
            onClick={() => navigate("/admin/analytics")}
            theme={theme}
          />

          <CommandCenterCard
            icon={Megaphone}
            title="Announcements"
            description="Participant updates"
            onClick={() => navigate("/admin/announcements")}
            theme={theme}
          />

          <CommandCenterCard
            icon={Bell}
            title="Notifications"
            description="Send push messages"
            onClick={() => navigate("/admin/notifications")}
            theme={theme}
          />
        </div>
      </motion.section>

      {/* =====================================================
          CONTROL WIDGETS
      ===================================================== */}

      <section className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:gap-4 lg:mt-6 lg:grid-cols-2">
        <QuizStatusWidget
          config={quizConfig}
          snapshot={quizSnapshot}
          theme={theme}
        />

        <LatestAnnouncementWidget
          announcement={latestAnnouncement}
          theme={theme}
          onManage={() => navigate("/admin/announcements")}
        />
      </section>

      {/* =====================================================
          DASHBOARD HEALTH
      ===================================================== */}

      <DashboardHealthSection
        totalQuestionCount={totalQuestionCount}
        bilingualCount={bilingualCount}
        needsReviewCount={needsReviewCount}
        activeChapterCount={activeChapterCount}
        quizConfig={quizConfig}
        latestAnnouncement={latestAnnouncement}
        theme={theme}
      />

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <section className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:mt-5 sm:gap-4 xl:grid-cols-[0.8fr_1.2fr]">
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
              <div className="mt-4 h-[220px] min-w-0 sm:h-[280px]">
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
                        className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-[#F8FAFC] px-3.5 py-2.5 transition duration-200 hover:border-zinc-300 hover:bg-zinc-100/70"
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

                          <span className="truncate text-[12px] font-semibold text-zinc-600">
                            {
                              chapter.chapter
                            }
                          </span>
                        </div>

                        <span className="ml-3 text-[12px] font-black text-zinc-900">
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

          <div className="mt-5 h-[260px] min-w-0 sm:h-[330px]">
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
                  stroke="rgba(24,24,27,0.08)"
                />

                <XAxis
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#52525B",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#52525B",
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  cursor={{
                    fill:
                      "rgba(24,24,27,.035)",
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
          RECENT ACTIVITY
      ===================================================== */}

      <section className="mt-4">
        <DashboardCard>
          <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
            <CardHeading
              icon={Activity}
              title="Recent Activity"
              description="Latest quiz submissions"
              theme={theme}
            />

            <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 sm:px-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700 sm:text-[10px]">
                Live
              </span>
            </div>
          </div>

          <div className="mt-5">
            {activity.length === 0 ? (
              <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-5 text-center">
                <Activity size={24} className="text-zinc-400" />

                <p className="mt-3 text-[13px] font-bold text-zinc-700">
                  No recent submissions
                </p>

                <p className="mt-1 text-[11px] text-zinc-500">
                  Quiz submissions will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-[#F8FAFC]">
                <div className="divide-y divide-zinc-200/80">
                  {activity.map((entry, index) => (
                    <motion.div
                      key={entry.id || `${entry.name}-${index}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22 }}
                      className="group px-3.5 py-4 transition-colors hover:bg-white sm:px-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
                          <Users size={16} className="text-zinc-600" />
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-black text-zinc-900 sm:text-[14px]">
                                {entry.name || "Participant"}
                              </p>

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-zinc-500 sm:text-[11px]">
                                <span className="max-w-[170px] truncate">
                                  {entry.chapter || "Quiz submission"}
                                </span>
                                {entry.language && (
                                  <>
                                    <span className="text-zinc-300">•</span>
                                    <span>{formatActivityLanguage(entry.language)}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-[14px] font-black text-zinc-900 sm:text-[15px]">
                                {entry.score ?? "—"}
                              </p>
                              <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.11em] text-zinc-400 sm:text-[9px]">
                                Score
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-zinc-200/70 pt-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 sm:text-[11px]">
                              <Clock3 size={12} className="text-zinc-400" />
                              <span>{formatActivityDuration(entry.time_taken)}</span>
                            </div>

                            <span className="text-[10px] font-medium text-zinc-400 sm:text-[11px]">
                              {formatActivityDateTime(entry.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DashboardCard>
      </section>
    </>
  );
}

// ===========================================================
// RECENT ACTIVITY FORMATTERS
// ===========================================================

function formatActivityLanguage(language) {
  const value = String(language || "").trim().toLowerCase();

  if (value === "en" || value === "english") return "English";
  if (value === "ta" || value === "tamil") return "Tamil";

  return language || "—";
}

function formatActivityDuration(value) {
  if (value === null || value === undefined || value === "") {
    return "Time unavailable";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return String(value);
  }

  const totalSeconds = Math.floor(numericValue);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatActivityDateTime(value) {
  if (!value) return "Time unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  if (isToday) return `Today, ${time}`;

  const day = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);

  return `${day}, ${time}`;
}

// ===========================================================
// COMMAND CENTER CARD
// ===========================================================

function CommandCenterCard({
  icon: Icon,
  title,
  description,
  onClick,
  theme,
  featured = false,
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="group relative min-h-[132px] overflow-hidden rounded-[20px] border bg-white p-4 text-left shadow-[0_8px_24px_rgba(24,24,27,0.06)] transition-[border-color,box-shadow] duration-200 hover:shadow-[0_14px_32px_rgba(24,24,27,0.10)] sm:min-h-[145px] sm:p-5"
      style={{
        borderColor: featured ? `${theme.accent}38` : "rgba(212,212,216,0.9)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-[45px] transition-transform duration-300 group-hover:scale-125"
        style={{ backgroundColor: theme.accentSoft }}
      />

      {featured && (
        <span
          className="absolute right-3 top-3 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em]"
          style={{
            borderColor: `${theme.accent}28`,
            backgroundColor: theme.accentSoft,
            color: theme.accent,
          }}
        >
          Create
        </span>
      )}

      <div
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm sm:h-11 sm:w-11"
        style={{
          borderColor: `${theme.accent}24`,
          backgroundColor: theme.accentSoft,
        }}
      >
        <Icon
          size={18}
          strokeWidth={1.9}
          style={{ color: theme.accent }}
        />
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[12px] font-black leading-5 text-zinc-900 sm:text-[13px]">
            {title}
          </h4>
          <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-zinc-500 sm:text-[10px]">
            {description}
          </p>
        </div>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-[#F8FAFC] text-zinc-400 transition-all duration-200 group-hover:border-zinc-300 group-hover:bg-white group-hover:text-zinc-700">
          <ArrowUpRight
            size={13}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 h-[3px] w-0 rounded-r-full transition-all duration-300 group-hover:w-16"
        style={{ backgroundColor: theme.accent }}
      />
    </motion.button>
  );
}

// ===========================================================
// QUIZ STATUS WIDGET
// ===========================================================

function QuizStatusWidget({
  config,
  snapshot,
  theme,
}) {
  const chapters = Array.isArray(config?.active_chapters)
    ? config.active_chapters
    : [];

  const statusStyles = {
    live: {
      dot: "bg-emerald-500",
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    upcoming: {
      dot: "bg-amber-500",
      badge:
        "border-amber-200 bg-amber-50 text-amber-700",
    },
    unavailable: {
      dot: "bg-zinc-400",
      badge:
        "border-zinc-200 bg-zinc-100 text-zinc-600",
    },
  };

  const currentStyle =
    statusStyles[snapshot?.status] ||
    statusStyles.unavailable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="relative overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6"
    >
      <div
        className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full blur-[65px]"
        style={{
          backgroundColor: theme.accentSoft,
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <CardHeading
          icon={Clock3}
          title="Quiz Status"
          description="Current quiz availability"
          theme={theme}
        />

        <div
          className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 ${currentStyle.badge}`}
        >
          <span className="relative flex h-2 w-2">
            {snapshot?.status === "live" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            )}

            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${currentStyle.dot}`}
            />
          </span>

          <span className="text-[9px] font-black uppercase tracking-[0.12em]">
            {snapshot?.label || "Unavailable"}
          </span>
        </div>
      </div>

      <div className="relative mt-5 rounded-2xl border border-zinc-200/80 bg-[#F8FAFC] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
          {snapshot?.status === "upcoming"
            ? "Starts in"
            : snapshot?.status === "live"
              ? "Current state"
              : "Schedule"}
        </p>

        <p className="mt-2 text-[18px] font-black tracking-[-0.025em] text-zinc-900">
          {snapshot?.countdown}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {chapters.length > 0 ? (
            chapters.slice(0, 4).map((chapter) => (
              <span
                key={chapter}
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[9px] font-bold text-zinc-600"
              >
                {chapter}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-zinc-500">
              No active chapters
            </span>
          )}

          {chapters.length > 4 && (
            <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[9px] font-bold text-zinc-500">
              +{chapters.length - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
            Duration
          </p>

          <p className="mt-1 text-[12px] font-black text-zinc-800">
            {config?.duration || 20} min
          </p>
        </div>

        <div
          className="h-1.5 w-16 overflow-hidden rounded-full"
          style={{
            backgroundColor: theme.accentSoft,
          }}
        >
          <div
            className="h-full w-1/2 rounded-full"
            style={{
              backgroundColor: theme.accent,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================================
// LATEST ANNOUNCEMENT WIDGET
// ===========================================================

function LatestAnnouncementWidget({
  announcement,
  theme,
  onManage,
}) {
  const typeStyles = {
    info: {
      label: "Info",
      badge:
        "border-sky-200 bg-sky-50 text-sky-700",
      icon:
        "border-sky-200 bg-sky-50 text-sky-600",
    },
    success: {
      label: "Success",
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon:
        "border-emerald-200 bg-emerald-50 text-emerald-600",
    },
    warning: {
      label: "Warning",
      badge:
        "border-amber-200 bg-amber-50 text-amber-700",
      icon:
        "border-amber-200 bg-amber-50 text-amber-600",
    },
    important: {
      label: "Important",
      badge:
        "border-rose-200 bg-rose-50 text-rose-700",
      icon:
        "border-rose-200 bg-rose-50 text-rose-600",
    },
  };

  const currentType =
    typeStyles[announcement?.type] ||
    typeStyles.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="relative overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6"
    >
      <div
        className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full blur-[65px]"
        style={{
          backgroundColor: theme.accentSoft,
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <CardHeading
          icon={Megaphone}
          title="Latest Announcement"
          description="Currently visible to participants"
          theme={theme}
        />

        {announcement && (
          <span
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${currentType.badge}`}
          >
            {currentType.label}
          </span>
        )}
      </div>

      {announcement ? (
        <div className="relative mt-5 rounded-2xl border border-zinc-200/80 bg-[#F8FAFC] p-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${currentType.icon}`}
            >
              <Megaphone
                size={15}
                strokeWidth={1.9}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-black leading-5 text-zinc-900">
                {announcement.title}
              </h4>

              <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[11px] leading-5 text-zinc-500">
                {announcement.message}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mt-5 flex min-h-[142px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-5 text-center">
          <Megaphone
            size={22}
            className="text-zinc-400"
          />

          <p className="mt-3 text-[12px] font-black text-zinc-700">
            No active announcement
          </p>

          <p className="mt-1 text-[10px] leading-4 text-zinc-500">
            Publish an announcement to display it here.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ===========================================================
// DASHBOARD HEALTH
// ===========================================================

function DashboardHealthSection({
  totalQuestionCount,
  bilingualCount,
  needsReviewCount,
  activeChapterCount,
  quizConfig,
  latestAnnouncement,
  theme,
}) {
  const bilingualPercentage =
    totalQuestionCount > 0
      ? Math.round((bilingualCount / totalQuestionCount) * 100)
      : 0;

  const hasValidStartTime = Boolean(
    quizConfig?.start_time &&
      Number.isFinite(new Date(quizConfig.start_time).getTime())
  );

  const questionBankReady =
    totalQuestionCount > 0 && bilingualCount > 0;

  const quizConfigReady =
    hasValidStartTime && activeChapterCount > 0;

  const bilingualReady =
    totalQuestionCount > 0 && needsReviewCount === 0;

  const healthItems = [
    {
      icon: BookOpen,
      title: "Question Bank",
      status: questionBankReady ? "Ready" : "Needs attention",
      detail:
        totalQuestionCount > 0
          ? `${totalQuestionCount} ${
              totalQuestionCount === 1 ? "question" : "questions"
            } available`
          : "No questions available",
      tone: questionBankReady ? "success" : "warning",
    },
    {
      icon: Settings,
      title: "Quiz Configuration",
      status: quizConfigReady ? "Ready" : "Needs attention",
      detail: quizConfigReady
        ? `${activeChapterCount} active ${
            activeChapterCount === 1 ? "chapter" : "chapters"
          }`
        : !hasValidStartTime
          ? "Quiz start time is not set"
          : "No active chapters selected",
      tone: quizConfigReady ? "success" : "warning",
    },
    {
      icon: Languages,
      title: "Bilingual Coverage",
      status:
        totalQuestionCount === 0
          ? "Unavailable"
          : `${bilingualPercentage}% Ready`,
      detail:
        totalQuestionCount === 0
          ? "Add questions to measure coverage"
          : needsReviewCount > 0
            ? `${needsReviewCount} ${
                needsReviewCount === 1 ? "question needs" : "questions need"
              } review`
            : "All questions are bilingual ready",
      tone:
        totalQuestionCount === 0
          ? "neutral"
          : bilingualReady
            ? "success"
            : "warning",
    },
    {
      icon: Megaphone,
      title: "Announcement",
      status: latestAnnouncement ? "Active" : "No active announcement",
      detail: latestAnnouncement
        ? latestAnnouncement.title || "Announcement is visible"
        : "Nothing is currently published",
      tone: latestAnnouncement ? "success" : "neutral",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className="mt-5 lg:mt-6"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <CircleGauge
            size={13}
            style={{ color: theme.accent }}
          />

          <p
            className="text-[10px] font-black uppercase tracking-[0.15em]"
            style={{ color: theme.accent }}
          >
            System Health
          </p>
        </div>

        <h3 className="mt-2 text-[18px] font-black tracking-[-0.025em] text-zinc-900 sm:text-[20px]">
          QUIZTIANS readiness
        </h3>

        <p className="mt-1 text-[11px] leading-5 text-zinc-500 sm:text-[12px]">
          A quick check of the areas that matter before your next quiz.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
        {healthItems.map((item) => (
          <HealthCard
            key={item.title}
            {...item}
            theme={theme}
          />
        ))}
      </div>
    </motion.section>
  );
}

function HealthCard({
  icon: Icon,
  title,
  status,
  detail,
  tone,
  theme,
}) {
  const toneStyles = {
    success: {
      wrapper: "border-emerald-200/90 bg-emerald-50/55",
      icon: "border-emerald-200 bg-white text-emerald-600",
      badge: "border-emerald-200 bg-white text-emerald-700",
      dot: "bg-emerald-500",
    },
    warning: {
      wrapper: "border-amber-200/90 bg-amber-50/55",
      icon: "border-amber-200 bg-white text-amber-600",
      badge: "border-amber-200 bg-white text-amber-700",
      dot: "bg-amber-500",
    },
    neutral: {
      wrapper: "border-zinc-200/90 bg-white",
      icon: "border-zinc-200 bg-[#F8FAFC] text-zinc-500",
      badge: "border-zinc-200 bg-[#F8FAFC] text-zinc-600",
      dot: "bg-zinc-400",
    },
  };

  const current = toneStyles[tone] || toneStyles.neutral;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-[20px] border p-4 shadow-[0_8px_24px_rgba(24,24,27,0.055)] transition-shadow duration-200 hover:shadow-[0_12px_30px_rgba(24,24,27,0.085)] sm:p-5 ${current.wrapper}`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-[55px]"
        style={{ backgroundColor: theme.accentSoft }}
      />

      <div className="relative flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${current.icon}`}
        >
          <Icon size={17} strokeWidth={1.9} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between">
            <p className="text-[12px] font-black text-zinc-900 sm:text-[13px]">
              {title}
            </p>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${current.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
              {status}
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-5 text-zinc-500 sm:text-[12px]">
            {detail}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================================
// COUNTDOWN FORMATTER
// ===========================================================

function formatDashboardCountdown(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
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
  textValue = false,
  warning = false,
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
      whileHover={{
        y: -2,
      }}
      className={`relative min-w-0 overflow-hidden rounded-[17px] border border-zinc-200/90 bg-white p-3 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition-shadow duration-200 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.10)] sm:rounded-[20px] sm:p-5 ${className}`}
    >
      {/* ACCENT GLOW */}

      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-[55px]"
        style={{
          backgroundColor:
            theme.accentSoft,
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">
            {title}
          </p>

          <h3 className="mt-3 text-[32px] font-black tracking-[-0.045em] text-zinc-900 sm:text-[38px]">
            {textValue ? (
              <span className="text-[22px] sm:text-[26px]">{value}</span>
            ) : (
              <CountUp end={Number(value) || 0} duration={1.3} />
            )}
          </h3>
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            borderColor:
              warning ? "rgba(245,158,11,.28)" : `${theme.accent}25`,
            backgroundColor:
              warning ? "rgba(245,158,11,.10)" : theme.accentSoft,
          }}
        >
          <Icon
            size={18}
            strokeWidth={1.8}
            style={{
              color: warning ? "#D97706" : theme.accent,
            }}
          />
        </div>
      </div>

      <div className="relative mt-4 h-px overflow-hidden bg-zinc-200">
        <div
          className="h-full w-1/3"
          style={{
            backgroundColor:
              theme.accent,
            opacity: 0.7,
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
      className={`min-w-0 rounded-[18px] border border-zinc-200/90 bg-white p-3.5 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:rounded-[22px] sm:p-5 lg:p-6 ${className}`}
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
    <div className="flex min-w-0 items-center gap-3">
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
          size={17}
          strokeWidth={1.8}
          style={{
            color: theme.accent,
          }}
        />
      </div>

      <div>
        <h3 className="text-[15px] font-black text-zinc-900">
          {title}
        </h3>

        <p className="mt-1 text-[12px] text-zinc-500">
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
    <div className="rounded-xl border border-zinc-200 bg-white/95 px-3.5 py-3 shadow-[0_10px_30px_rgba(24,24,27,0.12)] backdrop-blur-xl">
      {displayLabel && (
        <p className="text-[11px] font-semibold text-zinc-500">
          {displayLabel}
        </p>
      )}

      <p className="mt-1 text-[14px] font-black text-zinc-900">
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
    <div className="mt-5 flex h-[270px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-5 text-center">
      <BarChart3
        size={26}
        className="text-zinc-400"
      />

      <p className="mt-3 text-[12px] font-semibold text-zinc-600">
        {text}
      </p>
    </div>
  );
}