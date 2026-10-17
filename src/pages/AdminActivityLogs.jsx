import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  FileText,
  Filter,
  Search,
  Settings2,
  ShieldCheck,
  UserCog,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import AdminLayout from "../components/admin/AdminLayout";

/* ==========================================================
   ADMIN ACTIVITY LOGS
========================================================== */

export default function AdminActivityLogs() {
  /* ========================================================
     DATA
  ======================================================== */

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] =
    useState(true);

  /* ========================================================
     FILTERS
  ======================================================== */

  const [search, setSearch] =
    useState("");

  const [
    moduleFilter,
    setModuleFilter,
  ] = useState("all");

  const [
    actionFilter,
    setActionFilter,
  ] = useState("all");

  /* ========================================================
     PAGINATION
  ======================================================== */

  const [page, setPage] =
    useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);

  /* ========================================================
     FETCH LOGS
  ======================================================== */

  const fetchLogs = async () => {
    setLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          "admin_activity_logs"
        )
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setLogs(data || []);
    } catch (error) {
      console.error(
        "Fetch activity logs error:",
        error
      );

      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  /* ========================================================
     INITIAL FETCH
  ======================================================== */

  useEffect(() => {
    fetchLogs();
  }, []);

  /* ========================================================
     FILTER OPTIONS
  ======================================================== */

  const modules = useMemo(() => {
    return [
      ...new Set(
        logs
          .map(
            (log) =>
              log.module
          )
          .filter(Boolean)
      ),
    ].sort((a, b) =>
      String(a).localeCompare(
        String(b)
      )
    );
  }, [logs]);

  const actions = useMemo(() => {
    return [
      ...new Set(
        logs
          .map(
            (log) =>
              log.action
          )
          .filter(Boolean)
      ),
    ].sort((a, b) =>
      String(a).localeCompare(
        String(b)
      )
    );
  }, [logs]);

  /* ========================================================
     FILTERED LOGS
  ======================================================== */

  const filteredLogs =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return logs.filter(
        (log) => {
          const matchesSearch =
            !query ||
            [
              log.admin_email,
              log.admin_name,
              log.action,
              log.module,
              log.description,
            ].some((value) =>
              String(
                value || ""
              )
                .toLowerCase()
                .includes(query)
            );

          const matchesModule =
            moduleFilter ===
              "all" ||
            log.module ===
              moduleFilter;

          const matchesAction =
            actionFilter ===
              "all" ||
            log.action ===
              actionFilter;

          return (
            matchesSearch &&
            matchesModule &&
            matchesAction
          );
        }
      );
    }, [
      logs,
      search,
      moduleFilter,
      actionFilter,
    ]);

  /* ========================================================
     PAGINATION CALCULATIONS
  ======================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredLogs.length /
          pageSize
      )
    );

  const paginatedLogs =
    useMemo(() => {
      const start =
        (page - 1) *
        pageSize;

      return filteredLogs.slice(
        start,
        start + pageSize
      );
    }, [
      filteredLogs,
      page,
      pageSize,
    ]);

  const firstVisible =
    filteredLogs.length === 0
      ? 0
      : (page - 1) *
          pageSize +
        1;

  const lastVisible =
    Math.min(
      page * pageSize,
      filteredLogs.length
    );

  /* ========================================================
     KEEP PAGE VALID
  ======================================================== */

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [
    page,
    totalPages,
  ]);

  /* ========================================================
     RESET PAGE WHEN FILTERS CHANGE
  ======================================================== */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    moduleFilter,
    actionFilter,
    pageSize,
  ]);

  /* ========================================================
     STATS
  ======================================================== */

  const stats = useMemo(() => {
    const totalLogs =
      logs.length;

    const questionLogs =
      logs.filter(
        (log) =>
          log.module ===
          "Questions"
      ).length;

    const configLogs =
      logs.filter(
        (log) =>
          log.module ===
          "Quiz Configuration"
      ).length;

    const adminLogs =
      logs.filter(
        (log) =>
          log.module ===
          "Admin Users"
      ).length;

    return {
      totalLogs,
      questionLogs,
      configLogs,
      adminLogs,
    };
  }, [logs]);

  /* ========================================================
     ACTIVE FILTER COUNT
  ======================================================== */

  const activeFilterCount =
    (moduleFilter !== "all"
      ? 1
      : 0) +
    (actionFilter !== "all"
      ? 1
      : 0);

  /* ========================================================
     CLEAR FILTERS
  ======================================================== */

  const clearFilters = () => {
    setSearch("");
    setModuleFilter("all");
    setActionFilter("all");
  };

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <AdminLayout
      title="Activity Logs"
      eyebrow="Audit Trail"
    >
      {({ theme }) => (
        <>
          {/* ==================================================
              HERO
          ================================================== */}

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
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[110px]"
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
                  "32px 32px",
              }}
            />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={15}
                    style={{
                      color:
                        theme.accent,
                    }}
                  />

                  <p
                    className="text-[12px] font-black uppercase tracking-[0.14em]"
                    style={{
                      color:
                        theme.accent,
                    }}
                  >
                    Administrative
                    Audit
                  </p>
                </div>

                <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[32px] lg:text-[36px]">
                  Activity Logs
                </h2>

                <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-500 sm:text-[14px]">
                  Review
                  administrative
                  actions across
                  questions, quiz
                  configuration and
                  admin user
                  management.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <AccentBadge
                    theme={theme}
                  >
                    {
                      filteredLogs.length
                    }{" "}
                    visible
                  </AccentBadge>

                  <MiniBadge>
                    {logs.length} total
                  </MiniBadge>
                </div>
              </div>

              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm"
                style={{
                  borderColor:
                    `${theme.accent}20`,
                  backgroundColor:
                    theme.accentSoft,
                  color:
                    theme.accent,
                }}
              >
                <Activity
                  size={22}
                />
              </div>
            </div>
          </motion.section>

          {/* ==================================================
              CONTENT
          ================================================== */}

          {loading ? (
            <ActivityLogsLoading
              theme={theme}
            />
          ) : (
            <>
              {/* ==============================================
                  STATS
              ============================================== */}

              <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <ActivityStatCard
                  title="Total Activities"
                  value={
                    stats.totalLogs
                  }
                  icon={Activity}
                  index={0}
                  theme={theme}
                />

                <ActivityStatCard
                  title="Question Actions"
                  value={
                    stats.questionLogs
                  }
                  icon={BookOpen}
                  index={1}
                  theme={theme}
                />

                <ActivityStatCard
                  title="Config Actions"
                  value={
                    stats.configLogs
                  }
                  icon={Settings2}
                  index={2}
                  theme={theme}
                />

                <ActivityStatCard
                  title="Admin Actions"
                  value={
                    stats.adminLogs
                  }
                  icon={UserCog}
                  index={3}
                  theme={theme}
                />
              </section>

              {/* ==============================================
                  FILTERS
              ============================================== */}

              <section className="mt-4 rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  {/* SEARCH */}

                  <div className="relative min-w-0 flex-1">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(
                        event
                      ) =>
                        setSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search admin, email, action, module or description..."
                      className="h-11 w-full rounded-xl border border-zinc-200/90 bg-[#F8FAFC] pl-10 pr-10 text-[13px] font-medium text-zinc-800 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                    />

                    {search && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() =>
                          setSearch("")
                        }
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        <X
                          size={14}
                        />
                      </button>
                    )}
                  </div>

                  {/* FILTER SELECTS */}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[480px]">
                    <FilterSelect
                      value={
                        moduleFilter
                      }
                      onChange={
                        setModuleFilter
                      }
                      icon={Filter}
                      theme={theme}
                    >
                      <option value="all">
                        All Modules
                      </option>

                      {modules.map(
                        (module) => (
                          <option
                            key={
                              module
                            }
                            value={
                              module
                            }
                          >
                            {module}
                          </option>
                        )
                      )}
                    </FilterSelect>

                    <FilterSelect
                      value={
                        actionFilter
                      }
                      onChange={
                        setActionFilter
                      }
                      icon={Activity}
                      theme={theme}
                    >
                      <option value="all">
                        All Actions
                      </option>

                      {actions.map(
                        (action) => (
                          <option
                            key={
                              action
                            }
                            value={
                              action
                            }
                          >
                            {action}
                          </option>
                        )
                      )}
                    </FilterSelect>
                  </div>
                </div>

                {/* ACTIVE FILTERS */}

                {(search ||
                  activeFilterCount >
                    0) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200/80 pt-4">
                    <span className="text-[11px] font-bold text-zinc-500">
                      Active filters
                    </span>

                    {search && (
                      <FilterChip
                        label={`Search: ${search}`}
                        onRemove={() =>
                          setSearch("")
                        }
                        theme={theme}
                      />
                    )}

                    {moduleFilter !==
                      "all" && (
                      <FilterChip
                        label={
                          moduleFilter
                        }
                        onRemove={() =>
                          setModuleFilter(
                            "all"
                          )
                        }
                        theme={theme}
                      />
                    )}

                    {actionFilter !==
                      "all" && (
                      <FilterChip
                        label={
                          actionFilter
                        }
                        onRemove={() =>
                          setActionFilter(
                            "all"
                          )
                        }
                        theme={theme}
                      />
                    )}

                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="ml-auto text-[11px] font-black text-zinc-500 transition hover:text-zinc-900"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </section>

              {/* ==============================================
                  TABLE + TIMELINE
              ============================================== */}

              <section className="mt-4 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.75fr)]">
                {/* ============================================
                    ACTIVITY RECORDS
                ============================================ */}

                <div className="min-w-0 overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
                  {/* HEADER */}

                  <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText
                          size={15}
                          style={{
                            color:
                              theme.accent,
                          }}
                        />

                        <h3 className="text-[15px] font-black text-zinc-900">
                          Activity
                          Records
                        </h3>
                      </div>

                      <p className="mt-1 text-[12px] text-zinc-500">
                        {
                          filteredLogs.length
                        }{" "}
                        of{" "}
                        {logs.length}{" "}
                        activities shown
                      </p>
                    </div>

                    {/* PAGE SIZE */}

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-zinc-500">
                        Rows
                      </span>

                      <div className="relative">
                        <select
                          value={
                            pageSize
                          }
                          onChange={(
                            event
                          ) =>
                            setPageSize(
                              Number(
                                event
                                  .target
                                  .value
                              )
                            )
                          }
                          className="h-9 appearance-none rounded-xl border border-zinc-200/90 bg-[#F8FAFC] pl-3 pr-8 text-[11px] font-bold text-zinc-700 outline-none transition [color-scheme:light] hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                        >
                          <option
                            value={10}
                          >
                            10
                          </option>

                          <option
                            value={25}
                          >
                            25
                          </option>

                          <option
                            value={50}
                          >
                            50
                          </option>

                          <option
                            value={100}
                          >
                            100
                          </option>
                        </select>

                        <ChevronDown
                          size={12}
                          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ==========================================
                      DESKTOP TABLE
                  ========================================== */}

                  <div className="hidden w-full min-w-0 lg:block">
                    <table className="w-full table-fixed border-collapse">
                      <colgroup>
                        <col className="w-[20%]" />
                        <col className="w-[15%]" />
                        <col className="w-[17%]" />
                        <col className="w-[30%]" />
                        <col className="w-[18%]" />
                      </colgroup>

                      <thead>
                        <tr className="border-b border-zinc-200/80 bg-[#F8FAFC]">
                          <TableHeading>
                            Admin
                          </TableHeading>

                          <TableHeading>
                            Action
                          </TableHeading>

                          <TableHeading>
                            Module
                          </TableHeading>

                          <TableHeading>
                            Description
                          </TableHeading>

                          <TableHeading>
                            Time
                          </TableHeading>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredLogs.length ===
                        0 ? (
                          <tr>
                            <td
                              colSpan={
                                5
                              }
                              className="px-5 py-16"
                            >
                              <EmptyLogs
                                theme={
                                  theme
                                }
                              />
                            </td>
                          </tr>
                        ) : (
                          paginatedLogs.map(
                            (log) => (
                              <ActivityRow
                                key={
                                  log.id
                                }
                                log={
                                  log
                                }
                                theme={
                                  theme
                                }
                              />
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ==========================================
                      MOBILE / TABLET
                  ========================================== */}

                  <div className="divide-y divide-zinc-200/80 lg:hidden">
                    {filteredLogs.length ===
                    0 ? (
                      <div className="p-6">
                        <EmptyLogs
                          theme={
                            theme
                          }
                        />
                      </div>
                    ) : (
                      paginatedLogs.map(
                        (log) => (
                          <MobileActivityCard
                            key={
                              log.id
                            }
                            log={
                              log
                            }
                            theme={
                              theme
                            }
                          />
                        )
                      )
                    )}
                  </div>

                  {/* ==========================================
                      PAGINATION
                  ========================================== */}

                  <ActivityPagination
                    page={page}
                    setPage={
                      setPage
                    }
                    totalPages={
                      totalPages
                    }
                    firstVisible={
                      firstVisible
                    }
                    lastVisible={
                      lastVisible
                    }
                    totalItems={
                      filteredLogs.length
                    }
                    theme={theme}
                  />
                </div>

                {/* ============================================
                    TIMELINE
                ============================================ */}

                <aside className="min-w-0 overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
                  <div className="border-b border-zinc-200/80 p-4 sm:p-5">
                    <div className="flex items-center gap-2">
                      <Clock3
                        size={15}
                        style={{
                          color:
                            theme.accent,
                        }}
                      />

                      <h3 className="text-[15px] font-black text-zinc-900">
                        Timeline
                      </h3>
                    </div>

                    <p className="mt-1 text-[12px] text-zinc-500">
                      Recent
                      administrative
                      activity
                    </p>
                  </div>

                  <div className="max-h-[720px] overflow-y-auto p-4 sm:p-5">
                    {filteredLogs.length ===
                    0 ? (
                      <EmptyTimeline
                        theme={
                          theme
                        }
                      />
                    ) : (
                      <div>
                        {filteredLogs.map(
                          (
                            log,
                            index
                          ) => (
                            <TimelineItem
                              key={
                                log.id
                              }
                              log={
                                log
                              }
                              theme={
                                theme
                              }
                              last={
                                index ===
                                filteredLogs.length -
                                  1
                              }
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                </aside>
              </section>
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}

/* ==========================================================
   ACTIVITY STAT CARD
========================================================== */

function ActivityStatCard({
  title,
  value,
  icon: Icon,
  index,
  theme,
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
      className="relative min-w-0 overflow-hidden rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition duration-200 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)]"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-[45px] transition-opacity duration-200 group-hover:opacity-100"
        style={{
          backgroundColor:
            `${theme.accent}0D`,
        }}
      />

      <div
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
        style={{
          borderColor:
            `${theme.accent}18`,
          backgroundColor:
            theme.accentSoft,
          color: theme.accent,
        }}
      >
        <Icon size={17} />
      </div>

      <p className="relative mt-4 text-[12px] font-bold leading-4 text-zinc-500">
        {title}
      </p>

      <p className="relative mt-1.5 text-[30px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[32px]">
        {value}
      </p>

      <div
        className="absolute bottom-0 left-0 h-[2px] w-full opacity-40"
        style={{
          background: `linear-gradient(90deg, ${theme.accent}, transparent)`,
        }}
      />
    </motion.div>
  );
}

/* ==========================================================
   FILTER SELECT
========================================================== */

function FilterSelect({
  value,
  onChange,
  icon: Icon,
  children,
  theme,
}) {
  return (
    <div className="relative">
      <Icon
        size={15}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
        style={{
          color: theme.accent,
        }}
      />

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full appearance-none rounded-xl border border-zinc-200/90 bg-[#F8FAFC] pl-10 pr-9 text-[12px] font-bold text-zinc-700 outline-none transition [color-scheme:light] hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
      >
        {children}
      </select>

      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
      />
    </div>
  );
}

/* ==========================================================
   FILTER CHIP
========================================================== */

function FilterChip({
  label,
  onRemove,
  theme,
}) {
  return (
    <span
      className="inline-flex max-w-[240px] items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold"
      style={{
        borderColor:
          `${theme.accent}20`,
        backgroundColor:
          theme.accentSoft,
        color: theme.accent,
      }}
    >
      <span className="truncate">
        {label}
      </span>

      <button
        type="button"
        aria-label={`Remove ${label} filter`}
        onClick={onRemove}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition hover:bg-black/[0.05]"
      >
        <X size={10} />
      </button>
    </span>
  );
}

/* ==========================================================
   TABLE HEADING
========================================================== */

function TableHeading({
  children,
}) {
  return (
    <th className="px-3 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.08em] text-zinc-500 first:pl-4 last:pr-4 2xl:px-4">
      {children}
    </th>
  );
}

/* ==========================================================
   ACTIVITY ROW
========================================================== */

function ActivityRow({
  log,
  theme,
}) {
  return (
    <tr className="border-b border-zinc-200/70 bg-white transition last:border-b-0 hover:bg-[#F8FAFC]">
      {/* ADMIN */}

      <td className="px-3 py-4 pl-4 2xl:px-4">
        <AdminIdentity
          log={log}
          theme={theme}
        />
      </td>

      {/* ACTION */}

      <td className="px-3 py-4 2xl:px-4">
        <ActionBadge
          action={log.action}
        />
      </td>

      {/* MODULE */}

      <td className="px-3 py-4 2xl:px-4">
        <span
          className="block truncate text-[12px] font-bold text-zinc-700"
          title={
            log.module ||
            "N/A"
          }
        >
          {log.module ||
            "N/A"}
        </span>
      </td>

      {/* DESCRIPTION */}

      <td className="px-3 py-4 2xl:px-4">
        <p
          className="line-clamp-2 text-[12px] leading-5 text-zinc-600"
          title={
            log.description ||
            "No description"
          }
        >
          {log.description ||
            "No description"}
        </p>
      </td>

      {/* TIME */}

      <td className="px-3 py-4 pr-4 2xl:px-4">
        <DateDisplay
          date={
            log.created_at
          }
        />
      </td>
    </tr>
  );
}

/* ==========================================================
   MOBILE ACTIVITY CARD
========================================================== */

function MobileActivityCard({
  log,
  theme,
}) {
  return (
    <article className="bg-white p-4 transition hover:bg-[#FCFCFD] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <AdminIdentity
          log={log}
          theme={theme}
        />

        <ActionBadge
          action={log.action}
        />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200/80 bg-[#F8FAFC] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-zinc-400">
          Description
        </p>

        <p className="mt-1.5 text-[13px] leading-5 text-zinc-700">
          {log.description ||
            "No description"}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <MobileDetail
          label="Module"
          value={
            log.module ||
            "N/A"
          }
        />

        <div className="min-w-0 rounded-xl border border-zinc-200/80 bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-zinc-400">
            Time
          </p>

          <div className="mt-1.5">
            <DateDisplay
              date={
                log.created_at
              }
            />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ==========================================================
   ADMIN IDENTITY
========================================================== */

function AdminIdentity({
  log,
  theme,
}) {
  const name =
    log.admin_name ||
    "Unknown";

  const email =
    log.admin_email ||
    "No email";

  const initial =
    String(name)
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "A";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[12px] font-black shadow-sm"
        style={{
          borderColor:
            `${theme.accent}18`,
          backgroundColor:
            theme.accentSoft,
          color: theme.accent,
        }}
      >
        {initial}
      </div>

      <div className="min-w-0">
        <p
          className="truncate text-[13px] font-black text-zinc-900"
          title={name}
        >
          {name}
        </p>

        <p
          className="mt-0.5 truncate text-[11px] text-zinc-500"
          title={email}
        >
          {email}
        </p>
      </div>
    </div>
  );
}

/* ==========================================================
   ACTION BADGE
========================================================== */

function ActionBadge({
  action,
}) {
  const styles =
    getActionStyles(action);

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] ${styles}`}
      title={
        action || "N/A"
      }
    >
      <span className="truncate">
        {action || "N/A"}
      </span>
    </span>
  );
}

/* ==========================================================
   DATE DISPLAY
========================================================== */

function DateDisplay({
  date,
}) {
  if (!date) {
    return (
      <span className="text-[11px] text-zinc-400">
        N/A
      </span>
    );
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return (
      <span className="text-[11px] text-zinc-400">
        N/A
      </span>
    );
  }

  const dateText =
    value.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  const timeText =
    value.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] font-bold text-zinc-700">
        {dateText}
      </p>

      <p className="mt-0.5 truncate text-[10px] text-zinc-400">
        {timeText}
      </p>
    </div>
  );
}

/* ==========================================================
   MOBILE DETAIL
========================================================== */

function MobileDetail({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200/80 bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-zinc-400">
        {label}
      </p>

      <p
        className="mt-1.5 truncate text-[12px] font-bold text-zinc-700"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

/* ==========================================================
   TIMELINE ITEM
========================================================== */

function TimelineItem({
  log,
  theme,
  last,
}) {
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {!last && (
        <div className="absolute bottom-0 left-[5px] top-[14px] w-px bg-zinc-200" />
      )}

      <div className="relative z-10 pt-1">
        <span
          className="block h-[11px] w-[11px] rounded-full border-2 border-white"
          style={{
            backgroundColor:
              theme.accent,
            boxShadow: `0 0 0 3px ${theme.accent}12`,
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ActionBadge
            action={
              log.action
            }
          />

          <span className="truncate text-[11px] font-bold text-zinc-500">
            {log.module ||
              "N/A"}
          </span>
        </div>

        <p className="mt-2 text-[12px] leading-5 text-zinc-700">
          {log.description ||
            "No description"}
        </p>

        <div className="mt-2 flex min-w-0 items-center gap-1.5">
          <UserRound
            size={11}
            className="shrink-0 text-zinc-400"
          />

          <span className="truncate text-[11px] font-bold text-zinc-500">
            {log.admin_name ||
              log.admin_email ||
              "Unknown admin"}
          </span>
        </div>

        <div className="mt-2">
          <DateDisplay
            date={
              log.created_at
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   PAGINATION
========================================================== */

function ActivityPagination({
  page,
  setPage,
  totalPages,
  firstVisible,
  lastVisible,
  totalItems,
  theme,
}) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200/80 bg-[#FCFCFD] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* RANGE */}

      <p className="text-[11px] font-bold text-zinc-500">
        Showing{" "}
        <span className="font-black text-zinc-900">
          {firstVisible}
        </span>
        {" – "}
        <span className="font-black text-zinc-900">
          {lastVisible}
        </span>{" "}
        of{" "}
        <span className="font-black text-zinc-900">
          {totalItems}
        </span>
      </p>

      {/* CONTROLS */}

      <div className="flex items-center gap-1.5">
        <PaginationButton
          label="First page"
          disabled={
            page === 1
          }
          onClick={() =>
            setPage(1)
          }
        >
          <ChevronsLeft
            size={14}
          />
        </PaginationButton>

        <PaginationButton
          label="Previous page"
          disabled={
            page === 1
          }
          onClick={() =>
            setPage(
              (current) =>
                Math.max(
                  1,
                  current - 1
                )
            )
          }
        >
          <ChevronLeft
            size={14}
          />
        </PaginationButton>

        <div
          className="flex h-9 min-w-[76px] items-center justify-center rounded-xl border px-3 text-[11px] font-black shadow-sm"
          style={{
            borderColor:
              `${theme.accent}20`,
            backgroundColor:
              theme.accentSoft,
            color:
              theme.accent,
          }}
        >
          {page} /{" "}
          {totalPages}
        </div>

        <PaginationButton
          label="Next page"
          disabled={
            page ===
            totalPages
          }
          onClick={() =>
            setPage(
              (current) =>
                Math.min(
                  totalPages,
                  current + 1
                )
            )
          }
        >
          <ChevronRight
            size={14}
          />
        </PaginationButton>

        <PaginationButton
          label="Last page"
          disabled={
            page ===
            totalPages
          }
          onClick={() =>
            setPage(
              totalPages
            )
          }
        >
          <ChevronsRight
            size={14}
          />
        </PaginationButton>
      </div>
    </div>
  );
}

/* ==========================================================
   PAGINATION BUTTON
========================================================== */

function PaginationButton({
  children,
  label,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-500 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}

/* ==========================================================
   EMPTY LOGS
========================================================== */

function EmptyLogs({
  theme,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl border"
        style={{
          borderColor:
            `${theme.accent}18`,
          backgroundColor:
            theme.accentSoft,
          color:
            theme.accent,
        }}
      >
        <FileText
          size={17}
        />
      </div>

      <p className="mt-3 text-[13px] font-black text-zinc-800">
        No activity logs found
      </p>

      <p className="mt-1 max-w-xs text-[12px] leading-5 text-zinc-500">
        Try adjusting your
        search or filter
        selection.
      </p>
    </div>
  );
}

/* ==========================================================
   EMPTY TIMELINE
========================================================== */

function EmptyTimeline({
  theme,
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl border"
        style={{
          borderColor:
            `${theme.accent}18`,
          backgroundColor:
            theme.accentSoft,
          color:
            theme.accent,
        }}
      >
        <Clock3
          size={16}
        />
      </div>

      <p className="mt-3 text-[12px] font-black text-zinc-800">
        No timeline data
      </p>

      <p className="mt-1 text-[11px] text-zinc-500">
        Activity will appear
        here when available.
      </p>
    </div>
  );
}

/* ==========================================================
   MINI BADGE
========================================================== */

function MiniBadge({
  children,
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-bold text-zinc-600">
      {children}
    </span>
  );
}

/* ==========================================================
   ACCENT BADGE
========================================================== */

function AccentBadge({
  children,
  theme,
}) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-black"
      style={{
        borderColor:
          `${theme.accent}20`,
        backgroundColor:
          theme.accentSoft,
        color: theme.accent,
      }}
    >
      {children}
    </span>
  );
}

/* ==========================================================
   ACTION COLORS
========================================================== */

function getActionStyles(
  action
) {
  const normalized =
    String(action || "")
      .toUpperCase();

  if (
    normalized.includes(
      "DELETE"
    )
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    normalized.includes(
      "CREATE"
    ) ||
    normalized.includes(
      "ADD"
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes(
      "UPDATE"
    ) ||
    normalized.includes(
      "EDIT"
    )
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    normalized.includes(
      "DISABLE"
    )
  ) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-violet-200 bg-violet-50 text-violet-700";
}

/* ==========================================================
   LOADING
========================================================== */

function ActivityLogsLoading({
  theme,
}) {
  return (
    <div className="mt-4 space-y-4">
      {/* STATS */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <div
              key={index}
              className="h-[138px] animate-pulse rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.06)]"
            >
              <div
                className="h-10 w-10 rounded-xl border opacity-60"
                style={{
                  borderColor:
                    `${theme.accent}12`,
                  backgroundColor:
                    theme.accentSoft,
                }}
              />

              <div className="mt-4 h-3 w-24 rounded-full bg-zinc-200/80" />

              <div className="mt-3 h-7 w-16 rounded-lg bg-zinc-200/70" />
            </div>
          )
        )}
      </div>

      {/* FILTERS */}

      <div className="animate-pulse rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.06)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
        </div>
      </div>

      {/* CONTENT */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.75fr)]">
        {/* TABLE */}

        <div className="overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.06)]">
          <div className="border-b border-zinc-200/80 p-5">
            <div className="h-4 w-36 rounded-full bg-zinc-200/80" />

            <div className="mt-2 h-3 w-48 rounded-full bg-zinc-100" />
          </div>

          <div className="divide-y divide-zinc-200/70">
            {Array.from({
              length: 7,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex h-16 animate-pulse items-center gap-3 px-4"
                >
                  <div
                    className="h-9 w-9 shrink-0 rounded-xl border opacity-60"
                    style={{
                      borderColor:
                        `${theme.accent}10`,
                      backgroundColor:
                        theme.accentSoft,
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-32 rounded-full bg-zinc-200/80" />

                    <div className="mt-2 h-2.5 w-20 rounded-full bg-zinc-100" />
                  </div>

                  <div className="hidden h-7 w-20 rounded-lg bg-[#F8FAFC] sm:block" />
                </div>
              )
            )}
          </div>
        </div>

        {/* TIMELINE */}

        <div className="min-h-[430px] animate-pulse rounded-[22px] border border-zinc-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(24,24,27,0.06)]">
          <div className="h-4 w-24 rounded-full bg-zinc-200/80" />

          <div className="mt-2 h-3 w-40 rounded-full bg-zinc-100" />

          <div className="mt-7 space-y-6">
            {Array.from({
              length: 5,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex gap-3"
                >
                  <div
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        `${theme.accent}30`,
                    }}
                  />

                  <div className="flex-1">
                    <div className="h-3 w-24 rounded-full bg-zinc-200/80" />

                    <div className="mt-2 h-2.5 w-full rounded-full bg-zinc-100" />

                    <div className="mt-2 h-2.5 w-2/3 rounded-full bg-zinc-100" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}