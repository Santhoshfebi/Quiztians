import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  ChevronDown,
  Crown,
  MapPin,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* ==========================================================
   CONSTANTS
========================================================== */

const ALL_CHAPTERS = "all";
const LEADERBOARD_PAGE_SIZE = 10;

/* ==========================================================
   HELPERS
========================================================== */

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getPercentage(score, total) {
  const safeScore = safeNumber(score);
  const safeTotal = safeNumber(total);

  if (safeTotal <= 0) return 0;

  return Math.round((safeScore / safeTotal) * 100);
}

function formatChapter(chapter) {
  if (!chapter) return "General";

  return String(chapter)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name) {
  if (!name) return "?";

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function compareLeaderboardEntries(a, b) {
  const percentageA = getPercentage(a.score, a.total);
  const percentageB = getPercentage(b.score, b.total);

  // 1. Higher percentage
  if (percentageB !== percentageA) {
    return percentageB - percentageA;
  }

  // 2. Higher raw score
  const scoreDifference =
    safeNumber(b.score) - safeNumber(a.score);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  // 3. Earlier submission
  const timeA = new Date(a.created_at || 0).getTime();
  const timeB = new Date(b.created_at || 0).getTime();

  const safeTimeA = Number.isFinite(timeA)
    ? timeA
    : Number.MAX_SAFE_INTEGER;

  const safeTimeB = Number.isFinite(timeB)
    ? timeB
    : Number.MAX_SAFE_INTEGER;

  return safeTimeA - safeTimeB;
}

/* ==========================================================
   PAGE
========================================================== */

export default function Scores() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [selectedChapter, setSelectedChapter] =
    useState(ALL_CHAPTERS);

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* ========================================================
     ALWAYS START FROM TOP
  ======================================================== */

  useEffect(() => {
    window.scrollTo(0, 0);

    const timer = window.setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /* ========================================================
     FETCH RESULTS
  ======================================================== */

  const fetchResults = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("results")
          .select(
            "name, place, chapter, score, total, created_at"
          )
          .order("created_at", { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setResults(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        console.error(
          "Failed to load leaderboard:",
          fetchError
        );

        setError(
          "We couldn't load the leaderboard right now. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* ========================================================
     INITIAL LOAD + REALTIME
  ======================================================== */

  useEffect(() => {
    fetchResults();

    const channel = supabase
      .channel("public:leaderboard-results")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "results",
        },
        () => {
          fetchResults({ silent: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchResults]);

  /* ========================================================
     CHAPTERS
  ======================================================== */

  const chapters = useMemo(() => {
    const uniqueChapters = [
      ...new Set(
        results
          .map((result) => result.chapter)
          .filter(Boolean)
      ),
    ];

    return uniqueChapters.sort((a, b) =>
      String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [results]);

  /* ========================================================
     FILTER + RANK
  ======================================================== */

  const leaderboard = useMemo(() => {
    const filtered =
      selectedChapter === ALL_CHAPTERS
        ? results
        : results.filter(
          (result) =>
            String(result.chapter) ===
            String(selectedChapter)
        );

    return [...filtered]
      .sort(compareLeaderboardEntries)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
        percentage: getPercentage(
          result.score,
          result.total
        ),
      }));
  }, [results, selectedChapter]);

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      remaining.length / LEADERBOARD_PAGE_SIZE
    )
  );

  const paginatedRemaining = useMemo(() => {
    const start =
      (currentPage - 1) * LEADERBOARD_PAGE_SIZE;

    return remaining.slice(
      start,
      start + LEADERBOARD_PAGE_SIZE
    );
  }, [remaining, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedChapter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ========================================================
     STATS
  ======================================================== */

  const stats = useMemo(() => {
    if (!leaderboard.length) {
      return {
        participants: 0,
        topScore: 0,
        topTotal: 0,
        average: 0,
      };
    }

    const average =
      leaderboard.reduce(
        (sum, result) => sum + result.percentage,
        0
      ) / leaderboard.length;

    return {
      participants: leaderboard.length,
      topScore: safeNumber(leaderboard[0]?.score),
      topTotal: safeNumber(leaderboard[0]?.total),
      average: Math.round(average),
    };
  }, [leaderboard]);

  /* ========================================================
     UI
  ======================================================== */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-220px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/[0.09] blur-[150px]" />

        <div className="absolute -left-44 top-[35%] h-[340px] w-[340px] rounded-full bg-indigo-600/[0.045] blur-[140px]" />

        <div className="absolute -right-44 bottom-[-100px] h-[360px] w-[360px] rounded-full bg-violet-600/[0.05] blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* ===================================================
          PAGE
      =================================================== */}

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 sm:pb-14 sm:pt-5 lg:px-8">
        {/* =================================================
            HEADER / WELCOME STYLE BRAND
        ================================================= */}

        <header className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
          {/* BRAND */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="Go to QUIZTIANS home"
          >
            <img
              src="/branding/quiztians-q.png"
              alt=""
              className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
            />

            <div className="min-w-0 text-left">
              <img
                src="/branding/quiztians-wordmark.png"
                alt="QUIZTIANS"
                className="h-[34px] w-auto max-w-[185px] object-contain object-left sm:h-[40px] sm:max-w-[240px]"
              />

              <p className="-mt-1 hidden text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600 min-[390px]:block sm:text-[10px]">
                Learn • Play • Compete
              </p>
            </div>
          </button>

          {/* BACK */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 text-[11px] font-bold text-zinc-500 transition hover:border-white/[0.10] hover:bg-white/[0.045] hover:text-zinc-200 sm:px-3.5"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />

            <span className="hidden sm:inline">
              Back to Home
            </span>

            <span className="sm:hidden">Back</span>
          </button>
        </header>

        {/* =================================================
            HERO
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
          className="pb-8 pt-10 text-center sm:pb-10 sm:pt-14"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-3 py-1.5">
            <Sparkles
              size={12}
              className="text-violet-300"
            />

            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">
              Hall of Excellence
            </span>
          </div>

          <h1 className="mx-auto mt-5 max-w-3xl text-[34px] font-black tracking-[-0.055em] text-white sm:text-[44px] lg:text-[50px]">
            QUIZTIANS

            <span className="block bg-gradient-to-r from-violet-300 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-[520px] text-[12px] leading-6 text-zinc-500 sm:text-[13px]">
            Celebrating knowledge, consistency and the
            QUIZTIANS who rise to the challenge.
          </p>
        </motion.section>

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <LeaderboardLoading />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => fetchResults()}
          />
        ) : results.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* =============================================
                STATS
            ============================================= */}

            <section className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatCard
                icon={Users}
                label="Participants"
                value={stats.participants}
              />

              <StatCard
                icon={Trophy}
                label="Top Score"
                value={
                  stats.topTotal > 0
                    ? `${stats.topScore}/${stats.topTotal}`
                    : stats.topScore
                }
              />

              <StatCard
                icon={Award}
                label="Average"
                value={`${stats.average}%`}
              />
            </section>

            {/* =============================================
                FILTER
            ============================================= */}

            <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#111114]/90 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div>
                <p className="text-[12px] font-black text-zinc-200">
                  Rankings
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-zinc-600">
                  {leaderboard.length}{" "}
                  {leaderboard.length === 1
                    ? "participant"
                    : "participants"}{" "}
                  shown
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1 sm:w-[220px] sm:flex-none">
                  <select
                    value={selectedChapter}
                    onChange={(event) =>
                      setSelectedChapter(
                        event.target.value
                      )
                    }
                    className="h-10 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#0D0D10] pl-3 pr-9 text-[11px] font-bold text-zinc-300 outline-none transition focus:border-violet-500/30"
                    aria-label="Filter leaderboard by chapter"
                  >
                    <option value={ALL_CHAPTERS}>
                      All Chapters
                    </option>

                    {chapters.map((chapter) => (
                      <option
                        key={chapter}
                        value={chapter}
                      >
                        {formatChapter(chapter)}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    fetchResults({
                      silent: true,
                    })
                  }
                  disabled={refreshing}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[#0D0D10] text-zinc-500 transition hover:border-violet-500/20 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Refresh leaderboard"
                  title="Refresh leaderboard"
                >
                  <RefreshCw
                    size={14}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </section>

            {/* =============================================
                CHAPTER EMPTY
            ============================================= */}

            {leaderboard.length === 0 ? (
              <ChapterEmptyState
                selectedChapter={selectedChapter}
              />
            ) : (
              <>
                {/* =========================================
                    PODIUM
                ========================================= */}

                <section className="mt-7">
                  <SectionHeading
                    eyebrow="Top Performers"
                    title="The Podium"
                  />

                  <div className="mt-5">
                    <Podium
                      topThree={topThree}
                    />
                  </div>
                </section>

                {/* =========================================
                    FULL RANKINGS
                ========================================= */}

                {remaining.length > 0 && (
                  <section
                    id="full-rankings"
                    className="mt-9 scroll-mt-6"
                  >
                    <SectionHeading
                      eyebrow="Leaderboard"
                      title="Full Rankings"
                    />

                    <div className="mt-4 space-y-2.5">
                      <AnimatePresence mode="popLayout">
                        {paginatedRemaining.map(
                          (participant) => (
                            <LeaderboardRow
                              key={`${participant.name}-${participant.chapter}-${participant.created_at}`}
                              participant={
                                participant
                              }
                            />
                          )
                        )}
                      </AnimatePresence>
                    </div>

                    {totalPages > 1 && (
                      <LeaderboardPagination
                        currentPage={
                          currentPage
                        }
                        totalPages={
                          totalPages
                        }
                        totalResults={
                          remaining.length
                        }
                        pageSize={
                          LEADERBOARD_PAGE_SIZE
                        }
                        onPageChange={
                          setCurrentPage
                        }
                      />
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="mt-12 border-t border-white/[0.05] pt-7 text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 text-[11px] font-black text-zinc-400 transition hover:border-violet-500/20 hover:bg-violet-500/[0.05] hover:text-violet-200"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />

            Back to Home
          </button>

          <div className="mx-auto mt-7 max-w-[520px]">
            <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500 sm:text-[11px]">
              NEW GRACE JESUS WITH US CHURCH - HOSUR
            </p>

            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-700">
              QUIZTIANS • Learn • Play • Compete
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* ==========================================================
   PODIUM
========================================================== */

function Podium({ topThree }) {
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  if (!first) return null;

  return (
    <>
      {/* MOBILE */}

      <div className="grid gap-2.5 sm:hidden">
        <MobilePodiumCard
          participant={first}
          rank={1}
        />

        {second && (
          <MobilePodiumCard
            participant={second}
            rank={2}
          />
        )}

        {third && (
          <MobilePodiumCard
            participant={third}
            rank={3}
          />
        )}
      </div>

      {/* TABLET / DESKTOP */}

      <div className="hidden grid-cols-3 items-end gap-3 sm:grid">
        <PodiumCard
          participant={second}
          rank={2}
        />

        <PodiumCard
          participant={first}
          rank={1}
          featured
        />

        <PodiumCard
          participant={third}
          rank={3}
        />
      </div>
    </>
  );
}

/* ==========================================================
   PODIUM CARD
========================================================== */

function PodiumCard({
  participant,
  rank,
  featured = false,
}) {
  if (!participant) {
    return (
      <div className="min-h-[240px] rounded-[24px] border border-dashed border-white/[0.05] bg-white/[0.01]" />
    );
  }

  const rankConfig = getRankConfig(rank);

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.4,
        delay: rank === 1 ? 0.05 : 0.12,
      }}
      className={`relative overflow-hidden rounded-[26px] border ${featured
          ? "border-violet-500/20 bg-gradient-to-b from-violet-500/[0.09] to-[#111114]"
          : "border-white/[0.06] bg-[#111114]"
        } ${featured
          ? "min-h-[300px] px-5 pb-6 pt-7"
          : "min-h-[265px] px-5 pb-5 pt-6"
        }`}
    >
      {featured && (
        <>
          <div className="pointer-events-none absolute left-1/2 top-[-80px] h-[190px] w-[190px] -translate-x-1/2 rounded-full bg-violet-500/[0.13] blur-[70px]" />

          <div className="absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-300/80 to-transparent" />
        </>
      )}

      <div className="relative flex flex-col items-center text-center">
        <div
          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 ${rankConfig.badge}`}
        >
          {rank === 1 ? (
            <Crown size={13} />
          ) : (
            <Medal size={13} />
          )}

          <span className="text-[10px] font-black uppercase tracking-[0.12em]">
            #{rank}
          </span>
        </div>

        <div
          className={`mt-5 flex ${featured
              ? "h-[78px] w-[78px]"
              : "h-[68px] w-[68px]"
            } items-center justify-center rounded-[22px] border text-[20px] font-black ${rankConfig.avatar}`}
        >
          {getInitials(
            participant.name
          )}
        </div>

        <h3
          className={`mt-4 max-w-full truncate font-black tracking-[-0.025em] text-white ${featured
              ? "text-[17px]"
              : "text-[15px]"
            }`}
          title={
            participant.name ||
            "Participant"
          }
        >
          {participant.name ||
            "Participant"}
        </h3>

        <div className="mt-1.5 flex max-w-full items-center justify-center gap-1.5 text-zinc-600">
          <MapPin
            size={11}
            className="shrink-0"
          />

          <span
            className="truncate text-[10px] font-medium"
            title={
              participant.place ||
              "QUIZTIANS"
            }
          >
            {participant.place ||
              "QUIZTIANS"}
          </span>
        </div>

        <div className="mt-5">
          <p
            className={`font-black tracking-[-0.04em] ${rankConfig.score}`}
          >
            <span
              className={
                featured
                  ? "text-[32px]"
                  : "text-[27px]"
              }
            >
              {safeNumber(
                participant.score
              )}
            </span>

            <span className="ml-1 text-[12px] text-zinc-600">
              /{" "}
              {safeNumber(
                participant.total
              )}
            </span>
          </p>

          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600">
            {participant.percentage}% Score
          </p>
        </div>

        <div className="mt-5 max-w-full rounded-lg border border-white/[0.05] bg-black/10 px-2.5 py-1.5">
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.10em] text-zinc-600">
            {formatChapter(
              participant.chapter
            )}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

/* ==========================================================
   MOBILE PODIUM
========================================================== */

function MobilePodiumCard({
  participant,
  rank,
}) {
  const rankConfig = getRankConfig(rank);

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        delay: rank * 0.04,
      }}
      className={`relative overflow-hidden rounded-[20px] border p-3.5 ${rank === 1
          ? "border-violet-500/20 bg-gradient-to-r from-violet-500/[0.08] to-[#111114]"
          : "border-white/[0.06] bg-[#111114]"
        }`}
    >
      {rank === 1 && (
        <div className="pointer-events-none absolute -right-10 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-violet-500/[0.08] blur-[45px]" />
      )}

      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${rankConfig.badge}`}
        >
          {rank === 1 ? (
            <Crown size={16} />
          ) : (
            <Medal size={16} />
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-[13px] font-black ${rankConfig.avatar}`}
        >
          {getInitials(
            participant.name
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-zinc-600">
              #{rank}
            </span>

            <h3 className="truncate text-[13px] font-black text-zinc-100">
              {participant.name ||
                "Participant"}
            </h3>
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <MapPin
              size={10}
              className="shrink-0 text-zinc-700"
            />

            <span className="truncate text-[10px] font-medium text-zinc-600">
              {participant.place ||
                "QUIZTIANS"}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`text-[17px] font-black ${rankConfig.score}`}
          >
            {safeNumber(
              participant.score
            )}

            <span className="ml-0.5 text-[10px] text-zinc-600">
              /
              {safeNumber(
                participant.total
              )}
            </span>
          </p>

          <p className="mt-0.5 text-[9px] font-bold text-zinc-600">
            {participant.percentage}%
          </p>
        </div>
      </div>

      <div className="relative mt-3 border-t border-white/[0.045] pt-2.5">
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.09em] text-zinc-700">
          {formatChapter(
            participant.chapter
          )}
        </p>
      </div>
    </motion.article>
  );
}

/* ==========================================================
   LEADERBOARD ROW
========================================================== */

function LeaderboardRow({
  participant,
}) {
  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.98,
      }}
      transition={{
        duration: 0.25,
      }}
      className="group rounded-[18px] border border-white/[0.055] bg-[#111114] p-3.5 transition hover:border-white/[0.09] hover:bg-[#141418] sm:p-4"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.055] bg-white/[0.02] text-[11px] font-black text-zinc-500 sm:h-10 sm:w-10">
          #{participant.rank}
        </div>

        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.055] bg-white/[0.025] text-[11px] font-black text-zinc-400 min-[390px]:flex">
          {getInitials(
            participant.name
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-black text-zinc-200 sm:text-[13px]">
            {participant.name ||
              "Participant"}
          </p>

          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <MapPin
              size={10}
              className="shrink-0 text-zinc-700"
            />

            <span className="truncate text-[10px] font-medium text-zinc-600">
              {participant.place ||
                "QUIZTIANS"}
            </span>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 md:block">
          <p className="text-[9px] font-black uppercase tracking-[0.10em] text-zinc-700">
            Chapter
          </p>

          <p className="mt-1 truncate text-[11px] font-bold text-zinc-500">
            {formatChapter(
              participant.chapter
            )}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[16px] font-black tracking-[-0.03em] text-zinc-200 sm:text-[18px]">
            {safeNumber(
              participant.score
            )}

            <span className="ml-0.5 text-[10px] text-zinc-600">
              /
              {safeNumber(
                participant.total
              )}
            </span>
          </p>

          <p className="mt-0.5 text-[9px] font-bold text-violet-400/70">
            {participant.percentage}%
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-white/[0.04] pt-2.5 md:hidden">
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.09em] text-zinc-700">
          {formatChapter(
            participant.chapter
          )}
        </p>
      </div>
    </motion.article>
  );
}

/* ==========================================================
   PAGINATION
========================================================== */

function LeaderboardPagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
}) {
  const start =
    (currentPage - 1) * pageSize + 1;

  const end = Math.min(
    currentPage * pageSize,
    totalResults
  );

  const goToPage = (page) => {
    const nextPage = Math.min(
      Math.max(page, 1),
      totalPages
    );

    onPageChange(nextPage);

    window.requestAnimationFrame(() => {
      document
        .getElementById("full-rankings")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  };

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-[18px] border border-white/[0.055] bg-[#111114] p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="text-center sm:text-left">
        <p className="text-[10px] font-bold text-zinc-600">
          Showing{" "}
          <span className="text-zinc-400">
            {start}–{end}
          </span>{" "}
          of{" "}
          <span className="text-zinc-400">
            {totalResults}
          </span>{" "}
          ranked participants
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() =>
            goToPage(currentPage - 1)
          }
          className="inline-flex h-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 text-[10px] font-black text-zinc-400 transition hover:border-violet-500/20 hover:bg-violet-500/[0.05] hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Previous
        </button>

        <div className="flex h-9 min-w-[92px] items-center justify-center rounded-xl border border-white/[0.055] bg-[#0D0D10] px-3">
          <span className="text-[10px] font-black text-zinc-500">
            Page{" "}
            <span className="text-violet-300">
              {currentPage}
            </span>{" "}
            / {totalPages}
          </span>
        </div>

        <button
          type="button"
          disabled={
            currentPage === totalPages
          }
          onClick={() =>
            goToPage(currentPage + 1)
          }
          className="inline-flex h-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 text-[10px] font-black text-zinc-400 transition hover:border-violet-500/20 hover:bg-violet-500/[0.05] hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ==========================================================
   STAT CARD
========================================================== */

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.055] bg-[#111114] p-3 sm:p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/10 bg-violet-500/[0.05] text-violet-400">
        <Icon size={13} />
      </div>

      <p className="mt-3 text-[18px] font-black tracking-[-0.04em] text-white sm:text-[22px]">
        {value}
      </p>

      <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-zinc-600 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

/* ==========================================================
   SECTION HEADING
========================================================== */

function SectionHeading({
  eyebrow,
  title,
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-400/70">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-[19px] font-black tracking-[-0.035em] text-white sm:text-[21px]">
        {title}
      </h2>
    </div>
  );
}

/* ==========================================================
   RANK CONFIG
========================================================== */

function getRankConfig(rank) {
  if (rank === 1) {
    return {
      badge:
        "border-violet-400/20 bg-violet-400/[0.08] text-violet-300",
      avatar:
        "border-violet-400/20 bg-violet-400/[0.07] text-violet-200",
      score: "text-violet-300",
    };
  }

  if (rank === 2) {
    return {
      badge:
        "border-zinc-400/15 bg-zinc-300/[0.05] text-zinc-300",
      avatar:
        "border-zinc-400/15 bg-zinc-300/[0.04] text-zinc-300",
      score: "text-zinc-300",
    };
  }

  return {
    badge:
      "border-amber-700/15 bg-amber-700/[0.05] text-amber-600",
    avatar:
      "border-amber-700/15 bg-amber-700/[0.04] text-amber-600",
    score: "text-amber-600",
  };
}

/* ==========================================================
   LOADING
========================================================== */

function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-[110px] animate-pulse rounded-[18px] border border-white/[0.05] bg-[#111114]"
          />
        ))}
      </div>

      <div className="h-[70px] animate-pulse rounded-2xl border border-white/[0.05] bg-[#111114]" />

      <div className="grid gap-2.5 sm:grid-cols-3 sm:items-end sm:gap-3">
        <div className="h-[240px] animate-pulse rounded-[24px] border border-white/[0.05] bg-[#111114]" />

        <div className="h-[280px] animate-pulse rounded-[24px] border border-white/[0.05] bg-[#111114]" />

        <div className="h-[240px] animate-pulse rounded-[24px] border border-white/[0.05] bg-[#111114]" />
      </div>
    </div>
  );
}

/* ==========================================================
   ERROR
========================================================== */

function ErrorState({
  message,
  onRetry,
}) {
  return (
    <div className="mx-auto mt-5 max-w-xl rounded-[24px] border border-red-500/10 bg-[#111114] px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/[0.05] text-red-400">
        <RefreshCw size={18} />
      </div>

      <h2 className="mt-5 text-[18px] font-black text-white">
        Leaderboard unavailable
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-zinc-600">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-violet-500/15 bg-violet-500/[0.07] px-4 text-[11px] font-black text-violet-300 transition hover:bg-violet-500/[0.10]"
      >
        <RefreshCw size={13} />
        Try Again
      </button>
    </div>
  );
}

/* ==========================================================
   EMPTY
========================================================== */

function EmptyState() {
  return (
    <div className="mx-auto mt-5 max-w-xl rounded-[24px] border border-white/[0.06] bg-[#111114] px-5 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] text-violet-300">
        <Trophy size={22} />
      </div>

      <h2 className="mt-5 text-[19px] font-black text-white">
        The podium is waiting.
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-[12px] leading-5 text-zinc-600">
        No quiz results are available yet. The first
        completed challenge will begin the leaderboard.
      </p>
    </div>
  );
}

/* ==========================================================
   CHAPTER EMPTY
========================================================== */

function ChapterEmptyState({
  selectedChapter,
}) {
  return (
    <div className="mt-6 rounded-[22px] border border-white/[0.055] bg-[#111114] px-5 py-10 text-center">
      <Trophy
        size={20}
        className="mx-auto text-zinc-700"
      />

      <p className="mt-4 text-[13px] font-black text-zinc-300">
        No rankings yet
      </p>

      <p className="mt-1.5 text-[11px] text-zinc-600">
        No participants have completed{" "}
        {formatChapter(selectedChapter)} yet.
      </p>
    </div>
  );
}