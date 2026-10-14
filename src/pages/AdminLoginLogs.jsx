import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Laptop,
  LogIn,
  Monitor,
  Search,
  ShieldCheck,
  ShieldX,
  Smartphone,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import AdminLayout from "../components/admin/AdminLayout";

/* ==========================================================
   ADMIN LOGIN LOGS
========================================================== */

export default function AdminLoginLogs() {
  /* ========================================================
     DATA
  ======================================================== */

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ========================================================
     FILTERS
  ======================================================== */

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  /* ========================================================
     PAGINATION
  ======================================================== */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ========================================================
     FETCH LOGIN LOGS
  ======================================================== */

  const fetchLogs = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("admin_login_logs")
        .select("*")
        .order("login_time", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setLogs(data || []);
    } catch (error) {
      console.error(
        "Fetch admin login logs error:",
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
     FILTERED LOGS
  ======================================================== */

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !query ||
        [
          log.email,
          log.role,
          log.status,
          log.device,
          log.browser,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      const matchesRole =
        roleFilter === "all" ||
        log.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [logs, search, roleFilter]);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / pageSize)
  );

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;

    return filteredLogs.slice(
      start,
      start + pageSize
    );
  }, [filteredLogs, page, pageSize]);

  const firstVisible =
    filteredLogs.length === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const lastVisible = Math.min(
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
  }, [page, totalPages]);

  /* ========================================================
     RESET PAGE WHEN FILTERS CHANGE
  ======================================================== */

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, pageSize]);

  /* ========================================================
     STATS
  ======================================================== */

  const stats = useMemo(() => {
    const totalLogs = logs.length;

    const adminLogs = logs.filter(
      (log) => log.role === "admin"
    ).length;

    const superAdminLogs = logs.filter(
      (log) => log.role === "superadmin"
    ).length;

    const desktopLogs = logs.filter(
      (log) => log.device === "Desktop"
    ).length;

    return {
      totalLogs,
      adminLogs,
      superAdminLogs,
      desktopLogs,
    };
  }, [logs]);

  /* ========================================================
     CLEAR FILTERS
  ======================================================== */

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
  };

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <AdminLayout
      title="Login Logs"
      eyebrow="Security"
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
            className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#111114] p-5 sm:p-6 lg:p-7"
          >
            <div
              className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full ${theme.glow} blur-[110px]`}
            />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={15}
                    style={{
                      color: theme.accent,
                    }}
                  />

                  <p
                    className="text-[12px] font-black uppercase tracking-[0.14em]"
                    style={{
                      color: theme.accent,
                    }}
                  >
                    Authentication Audit
                  </p>
                </div>

                <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-white sm:text-[32px] lg:text-[36px]">
                  Admin Login Logs
                </h2>

                <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-500 sm:text-[14px]">
                  Track administrator login activity,
                  roles, devices, browsers and
                  authentication status.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <MiniBadge>
                    {filteredLogs.length} visible
                  </MiniBadge>

                  <MiniBadge>
                    {logs.length} total
                  </MiniBadge>
                </div>
              </div>

              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: `${theme.accent}20`,
                  backgroundColor: theme.accentSoft,
                  color: theme.accent,
                }}
              >
                <LogIn size={22} />
              </div>
            </div>
          </motion.section>

          {/* ==================================================
              CONTENT
          ================================================== */}

          {loading ? (
            <LoginLogsLoading theme={theme} />
          ) : (
            <>
              {/* ==============================================
                  STATS
              ============================================== */}

              <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <LoginStatCard
                  title="Total Logins"
                  value={stats.totalLogs}
                  icon={LogIn}
                  index={0}
                  theme={theme}
                />

                <LoginStatCard
                  title="Admin Logins"
                  value={stats.adminLogs}
                  icon={UserCog}
                  index={1}
                  theme={theme}
                />

                <LoginStatCard
                  title="Superadmin Logins"
                  value={stats.superAdminLogs}
                  icon={ShieldCheck}
                  index={2}
                  theme={theme}
                />

                <LoginStatCard
                  title="Desktop Logins"
                  value={stats.desktopLogs}
                  icon={Monitor}
                  index={3}
                  theme={theme}
                />
              </section>

              {/* ==============================================
                  FILTERS
              ============================================== */}

              <section className="mt-4 rounded-[22px] border border-white/[0.06] bg-[#111114] p-4 sm:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  {/* SEARCH */}

                  <div className="relative min-w-0 flex-1">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search email, role, status, device or browser..."
                      className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-10 pr-10 text-[13px] font-medium text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-white/[0.14]"
                    />

                    {search && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* ROLE FILTER */}

                  <div className="relative md:w-[240px]">
                    <UsersRound
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{
                        color: theme.accent,
                      }}
                    />

                    <select
                      value={roleFilter}
                      onChange={(event) =>
                        setRoleFilter(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#141418] pl-10 pr-9 text-[12px] font-bold text-zinc-300 outline-none transition focus:border-white/[0.14]"
                    >
                      <option value="all">
                        All Roles
                      </option>

                      <option value="admin">
                        Admin
                      </option>

                      <option value="superadmin">
                        Superadmin
                      </option>
                    </select>

                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600"
                    />
                  </div>
                </div>

                {/* ACTIVE FILTERS */}

                {(search || roleFilter !== "all") && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-4">
                    <span className="text-[11px] font-bold text-zinc-600">
                      Active filters
                    </span>

                    {search && (
                      <FilterChip
                        label={`Search: ${search}`}
                        onRemove={() => setSearch("")}
                        theme={theme}
                      />
                    )}

                    {roleFilter !== "all" && (
                      <FilterChip
                        label={
                          roleFilter === "superadmin"
                            ? "Superadmin"
                            : "Admin"
                        }
                        onRemove={() =>
                          setRoleFilter("all")
                        }
                        theme={theme}
                      />
                    )}

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="ml-auto text-[11px] font-black text-zinc-500 transition hover:text-white"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </section>

              {/* ==============================================
                  LOGIN RECORDS
              ============================================== */}

              <section className="mt-4 overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#111114]">
                {/* HEADER */}

                <div className="flex flex-col gap-3 border-b border-white/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock3
                        size={15}
                        style={{
                          color: theme.accent,
                        }}
                      />

                      <h3 className="text-[15px] font-black text-zinc-100">
                        Login Records
                      </h3>
                    </div>

                    <p className="mt-1 text-[12px] text-zinc-600">
                      {filteredLogs.length} of {logs.length}{" "}
                      login records shown
                    </p>
                  </div>

                  {/* PAGE SIZE */}

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-600">
                      Rows
                    </span>

                    <div className="relative">
                      <select
                        value={pageSize}
                        onChange={(event) =>
                          setPageSize(
                            Number(event.target.value)
                          )
                        }
                        className="h-9 appearance-none rounded-lg border border-white/[0.07] bg-[#141418] pl-3 pr-8 text-[11px] font-bold text-zinc-300 outline-none transition focus:border-white/[0.14]"
                      >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>

                      <ChevronDown
                        size={12}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600"
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
                      <col className="w-[25%]" />
                      <col className="w-[13%]" />
                      <col className="w-[19%]" />
                      <col className="w-[14%]" />
                      <col className="w-[16%]" />
                      <col className="w-[13%]" />
                    </colgroup>

                    <thead>
                      <tr className="border-b border-white/[0.05] bg-white/[0.015]">
                        <TableHeading>
                          Email
                        </TableHeading>

                        <TableHeading>
                          Role
                        </TableHeading>

                        <TableHeading>
                          Login Time
                        </TableHeading>

                        <TableHeading>
                          Device
                        </TableHeading>

                        <TableHeading>
                          Browser
                        </TableHeading>

                        <TableHeading>
                          Status
                        </TableHeading>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-16"
                          >
                            <EmptyLogs theme={theme} />
                          </td>
                        </tr>
                      ) : (
                        paginatedLogs.map((log) => (
                          <LoginLogRow
                            key={log.id}
                            log={log}
                            theme={theme}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ==========================================
                    MOBILE / TABLET
                ========================================== */}

                <div className="divide-y divide-white/[0.05] lg:hidden">
                  {filteredLogs.length === 0 ? (
                    <div className="p-6">
                      <EmptyLogs theme={theme} />
                    </div>
                  ) : (
                    paginatedLogs.map((log) => (
                      <MobileLoginCard
                        key={log.id}
                        log={log}
                        theme={theme}
                      />
                    ))
                  )}
                </div>

                {/* ==========================================
                    PAGINATION
                ========================================== */}

                <LoginPagination
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  firstVisible={firstVisible}
                  lastVisible={lastVisible}
                  totalItems={filteredLogs.length}
                  theme={theme}
                />
              </section>
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
}

/* ==========================================================
   STAT CARD
========================================================== */

function LoginStatCard({
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
      className="min-w-0 rounded-[18px] border border-white/[0.055] bg-[#111114] p-4"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: theme.accentSoft,
          color: theme.accent,
        }}
      >
        <Icon size={17} />
      </div>

      <p className="mt-4 text-[12px] font-bold leading-4 text-zinc-500">
        {title}
      </p>

      <p className="mt-1.5 text-[30px] font-black tracking-[-0.04em] text-zinc-100 sm:text-[32px]">
        {value}
      </p>
    </motion.div>
  );
}

/* ==========================================================
   LOGIN ROW
========================================================== */

function LoginLogRow({
  log,
  theme,
}) {
  return (
    <tr className="border-b border-white/[0.045] transition last:border-b-0 hover:bg-white/[0.018]">
      {/* EMAIL */}

      <td className="px-3 py-4 pl-4 2xl:px-4">
        <EmailIdentity
          email={log.email}
          theme={theme}
        />
      </td>

      {/* ROLE */}

      <td className="px-3 py-4 2xl:px-4">
        <RoleBadge
          role={log.role}
          theme={theme}
        />
      </td>

      {/* LOGIN TIME */}

      <td className="px-3 py-4 2xl:px-4">
        <DateDisplay
          date={log.login_time}
        />
      </td>

      {/* DEVICE */}

      <td className="px-3 py-4 2xl:px-4">
        <DeviceDisplay
          device={log.device}
        />
      </td>

      {/* BROWSER */}

      <td className="px-3 py-4 2xl:px-4">
        <p
          className="truncate text-[12px] font-bold text-zinc-400"
          title={log.browser || "Unknown"}
        >
          {log.browser || "Unknown"}
        </p>
      </td>

      {/* STATUS */}

      <td className="px-3 py-4 pr-4 2xl:px-4">
        <StatusBadge
          status={log.status}
        />
      </td>
    </tr>
  );
}

/* ==========================================================
   MOBILE LOGIN CARD
========================================================== */

function MobileLoginCard({
  log,
  theme,
}) {
  return (
    <article className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <EmailIdentity
          email={log.email}
          theme={theme}
        />

        <StatusBadge
          status={log.status}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-white/[0.05] bg-white/[0.018] p-3.5">
        <MobileDetail label="Role">
          <RoleBadge
            role={log.role}
            theme={theme}
          />
        </MobileDetail>

        <MobileDetail label="Device">
          <DeviceDisplay
            device={log.device}
          />
        </MobileDetail>

        <MobileDetail label="Browser">
          <p
            className="truncate text-[12px] font-bold text-zinc-400"
            title={log.browser || "Unknown"}
          >
            {log.browser || "Unknown"}
          </p>
        </MobileDetail>

        <MobileDetail label="Login Time">
          <DateDisplay
            date={log.login_time}
          />
        </MobileDetail>
      </div>
    </article>
  );
}

/* ==========================================================
   EMAIL IDENTITY
========================================================== */

function EmailIdentity({
  email,
  theme,
}) {
  const normalizedEmail =
    String(email || "").trim();

  const initial =
    normalizedEmail
      .charAt(0)
      .toUpperCase() || "A";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[12px] font-black"
        style={{
          borderColor: `${theme.accent}18`,
          backgroundColor: theme.accentSoft,
          color: theme.accent,
        }}
      >
        {initial}
      </div>

      <div className="min-w-0">
        <p
          className="truncate text-[13px] font-black text-zinc-200"
          title={normalizedEmail || "Unknown"}
        >
          {normalizedEmail || "Unknown"}
        </p>

        <p className="mt-0.5 text-[11px] text-zinc-600">
          Administrator
        </p>
      </div>
    </div>
  );
}

/* ==========================================================
   ROLE BADGE
========================================================== */

function RoleBadge({
  role,
  theme,
}) {
  const normalized =
    String(role || "unknown").toLowerCase();

  const label =
    normalized === "superadmin"
      ? "Superadmin"
      : normalized === "admin"
        ? "Admin"
        : role || "Unknown";

  return (
    <span
      className="inline-flex max-w-full items-center rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.04em]"
      style={{
        borderColor: `${theme.accent}20`,
        backgroundColor: theme.accentSoft,
        color: theme.accent,
      }}
      title={label}
    >
      <span className="truncate">
        {label}
      </span>
    </span>
  );
}

/* ==========================================================
   STATUS BADGE
========================================================== */

function StatusBadge({
  status,
}) {
  const normalized =
    String(status || "unknown").toLowerCase();

  const success =
    normalized === "success";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] ${success
          ? "border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-400"
          : "border-red-500/15 bg-red-500/[0.07] text-red-400"
        }`}
    >
      {success ? (
        <CheckCircle2 size={11} />
      ) : (
        <ShieldX size={11} />
      )}

      <span className="truncate">
        {status || "unknown"}
      </span>
    </span>
  );
}

/* ==========================================================
   DEVICE DISPLAY
========================================================== */

function DeviceDisplay({
  device,
}) {
  const normalized =
    String(device || "").toLowerCase();

  let Icon = Laptop;

  if (
    normalized.includes("mobile") ||
    normalized.includes("phone")
  ) {
    Icon = Smartphone;
  } else if (
    normalized.includes("desktop")
  ) {
    Icon = Monitor;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon
        size={13}
        className="shrink-0 text-zinc-600"
      />

      <span
        className="truncate text-[12px] font-bold text-zinc-400"
        title={device || "Unknown"}
      >
        {device || "Unknown"}
      </span>
    </div>
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
      <span className="text-[11px] text-zinc-600">
        N/A
      </span>
    );
  }

  const value = new Date(date);

  if (
    Number.isNaN(value.getTime())
  ) {
    return (
      <span className="text-[11px] text-zinc-600">
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
      <p className="truncate text-[11px] font-bold text-zinc-400">
        {dateText}
      </p>

      <p className="mt-0.5 truncate text-[10px] text-zinc-600">
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
  children,
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-600">
        {label}
      </p>

      <div className="min-w-0">
        {children}
      </div>
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
        borderColor: `${theme.accent}20`,
        backgroundColor: theme.accentSoft,
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
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition hover:bg-white/[0.08]"
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
    <th className="px-3 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.08em] text-zinc-600 first:pl-4 last:pr-4 2xl:px-4">
      {children}
    </th>
  );
}

/* ==========================================================
   PAGINATION
========================================================== */

function LoginPagination({
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
    <div className="flex flex-col gap-3 border-t border-white/[0.05] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] font-bold text-zinc-600">
        Showing{" "}
        <span className="text-zinc-400">
          {firstVisible}
        </span>
        {" – "}
        <span className="text-zinc-400">
          {lastVisible}
        </span>{" "}
        of{" "}
        <span className="text-zinc-400">
          {totalItems}
        </span>
      </p>

      <div className="flex items-center gap-1.5">
        <PaginationButton
          label="First page"
          disabled={page === 1}
          onClick={() => setPage(1)}
        >
          <ChevronsLeft size={14} />
        </PaginationButton>

        <PaginationButton
          label="Previous page"
          disabled={page === 1}
          onClick={() =>
            setPage((current) =>
              Math.max(1, current - 1)
            )
          }
        >
          <ChevronLeft size={14} />
        </PaginationButton>

        <div
          className="flex h-9 min-w-[76px] items-center justify-center rounded-lg border px-3 text-[11px] font-black"
          style={{
            borderColor: `${theme.accent}20`,
            backgroundColor: theme.accentSoft,
            color: theme.accent,
          }}
        >
          {page} / {totalPages}
        </div>

        <PaginationButton
          label="Next page"
          disabled={page === totalPages}
          onClick={() =>
            setPage((current) =>
              Math.min(
                totalPages,
                current + 1
              )
            )
          }
        >
          <ChevronRight size={14} />
        </PaginationButton>

        <PaginationButton
          label="Last page"
          disabled={page === totalPages}
          onClick={() =>
            setPage(totalPages)
          }
        >
          <ChevronsRight size={14} />
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
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.025] text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/* ==========================================================
   EMPTY STATE
========================================================== */

function EmptyLogs({
  theme,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl border"
        style={{
          borderColor: `${theme.accent}18`,
          backgroundColor: theme.accentSoft,
          color: theme.accent,
        }}
      >
        <LogIn size={17} />
      </div>

      <p className="mt-3 text-[13px] font-black text-zinc-300">
        No login logs found
      </p>

      <p className="mt-1 max-w-xs text-[12px] leading-5 text-zinc-600">
        Try adjusting your search or
        role filter.
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
    <span className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-[11px] font-bold text-zinc-500">
      {children}
    </span>
  );
}

/* ==========================================================
   LOADING STATE
========================================================== */

function LoginLogsLoading({
  theme,
}) {
  return (
    <div className="mt-4 space-y-4">
      {/* STATS */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-[138px] animate-pulse rounded-[18px] border border-white/[0.05] bg-[#111114] p-4"
          >
            <div
              className="h-10 w-10 rounded-xl opacity-30"
              style={{
                backgroundColor:
                  theme.accentSoft,
              }}
            />

            <div className="mt-4 h-3 w-24 rounded bg-white/[0.04]" />

            <div className="mt-3 h-7 w-16 rounded bg-white/[0.05]" />
          </div>
        ))}
      </div>

      {/* FILTERS */}

      <div className="animate-pulse rounded-[22px] border border-white/[0.05] bg-[#111114] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
          <div className="h-11 rounded-xl bg-white/[0.035]" />
          <div className="h-11 rounded-xl bg-white/[0.035]" />
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-[22px] border border-white/[0.05] bg-[#111114]">
        <div className="flex items-center justify-between border-b border-white/[0.04] p-5">
          <div>
            <div className="h-4 w-32 rounded bg-white/[0.05]" />

            <div className="mt-2 h-3 w-48 rounded bg-white/[0.03]" />
          </div>

          <div className="h-9 w-16 rounded-lg bg-white/[0.035]" />
        </div>

        <div className="space-y-1 p-4">
          {Array.from({
            length: 7,
          }).map((_, index) => (
            <div
              key={index}
              className="flex h-16 animate-pulse items-center gap-4 rounded-xl px-2"
            >
              <div className="h-9 w-9 shrink-0 rounded-xl bg-white/[0.04]" />

              <div className="min-w-0 flex-1">
                <div className="h-3 w-40 rounded bg-white/[0.05]" />

                <div className="mt-2 h-2.5 w-24 rounded bg-white/[0.025]" />
              </div>

              <div className="hidden h-7 w-20 rounded-lg bg-white/[0.035] sm:block" />

              <div className="hidden h-7 w-20 rounded-lg bg-white/[0.025] md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}