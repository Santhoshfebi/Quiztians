import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  Mail,
  MailPlus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  UsersRound,
  UserX,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import AdminLayout from "../components/admin/AdminLayout";

/* ==========================================================
   ADMIN USERS
========================================================== */

export default function AdminUsers() {
  /* ========================================================
     DATA
  ======================================================== */

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  /* ========================================================
     INVITE FORM
  ======================================================== */

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [sendingInvite, setSendingInvite] = useState(false);

  /* ========================================================
     FILTERS
  ======================================================== */

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [inviteFilter, setInviteFilter] = useState("all");

  /* ========================================================
     PAGINATION
  ======================================================== */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ========================================================
     ACTION STATES
  ======================================================== */

  const [updatingAdminId, setUpdatingAdminId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);

  /* ========================================================
     FETCH ADMINS
  ======================================================== */

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      toast.error(error.message);
      return;
    }

    setAdmins(data || []);
  };

  /* ========================================================
     INITIAL ACCESS CHECK
  ======================================================== */

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!user) {
          setCurrentUser(null);
          return;
        }

        setCurrentUser(user);

        if (user.user_metadata?.role === "superadmin") {
          await fetchAdmins();
        }
      } catch (error) {
        console.error("Admin users init error:", error);
        toast.error(
          error?.message || "Failed to load admin users"
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  /* ========================================================
     SUPERADMIN ACCESS
  ======================================================== */

  const isSuperAdmin =
    currentUser?.user_metadata?.role === "superadmin";

  /* ========================================================
     INVITE ADMIN
  ======================================================== */

  const handleInviteAdmin = async (event) => {
    event.preventDefault();

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !role) {
      toast.error("Please fill all fields");
      return;
    }

    setSendingInvite(true);

    const inviteToast = toast.loading(
      "Sending invitation..."
    );

    try {
      const { data, error } =
        await supabase.functions.invoke("invite-admin", {
          body: {
            fullName: cleanName,
            email: cleanEmail,
            role,
          },
        });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(
        "Admin invitation sent successfully",
        {
          id: inviteToast,
        }
      );

      setFullName("");
      setEmail("");
      setRole("admin");

      await fetchAdmins();
    } catch (error) {
      toast.error(
        error?.message || "Failed to send invite",
        {
          id: inviteToast,
        }
      );
    } finally {
      setSendingInvite(false);
    }
  };

  /* ========================================================
     ENABLE / DISABLE ADMIN
  ======================================================== */

  const toggleAdminStatus = async (admin) => {
    if (!admin) {
      return;
    }

    if (admin.id === currentUser?.id) {
      toast.error(
        "You cannot disable your own account"
      );
      return;
    }

    const newStatus = !admin.is_active;

    setUpdatingAdminId(admin.id);

    try {
      const { error } = await supabase
        .from("admins")
        .update({
          is_active: newStatus,
        })
        .eq("id", admin.id);

      if (error) {
        throw error;
      }

      toast.success(
        newStatus
          ? "Admin enabled"
          : "Admin disabled"
      );

      await fetchAdmins();
    } catch (error) {
      toast.error(
        error?.message ||
        "Failed to update admin status"
      );
    } finally {
      setUpdatingAdminId(null);
    }
  };

  /* ========================================================
     REQUEST DELETE
  ======================================================== */

  const requestDeleteAdmin = (admin) => {
    if (!admin) {
      return;
    }

    if (admin.id === currentUser?.id) {
      toast.error(
        "You cannot delete your own account"
      );
      return;
    }

    setDeleteTarget(admin);
  };

  /* ========================================================
     DELETE ADMIN
  ======================================================== */

  const deleteAdmin = async () => {
    if (!deleteTarget || deletingAdmin) {
      return;
    }

    if (deleteTarget.id === currentUser?.id) {
      toast.error(
        "You cannot delete your own account"
      );
      setDeleteTarget(null);
      return;
    }

    setDeletingAdmin(true);

    const deleteToast = toast.loading(
      "Deleting admin..."
    );

    try {
      const { data, error } =
        await supabase.functions.invoke("delete-admin", {
          body: {
            adminId: deleteTarget.id,
          },
        });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(
        "Admin deleted permanently",
        {
          id: deleteToast,
        }
      );

      setDeleteTarget(null);

      await fetchAdmins();
    } catch (error) {
      toast.error(
        error?.message || "Failed to delete admin",
        {
          id: deleteToast,
        }
      );
    } finally {
      setDeletingAdmin(false);
    }
  };

  /* ========================================================
     FILTERED ADMINS
  ======================================================== */

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesSearch =
        !query ||
        [
          admin.full_name,
          admin.email,
          admin.role,
          admin.invite_status,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      const matchesRole =
        roleFilter === "all" ||
        admin.role === roleFilter;

      const matchesAccount =
        accountFilter === "all" ||
        (accountFilter === "active" &&
          admin.is_active) ||
        (accountFilter === "disabled" &&
          !admin.is_active);

      const normalizedInviteStatus =
        admin.invite_status || "pending";

      const matchesInvite =
        inviteFilter === "all" ||
        normalizedInviteStatus === inviteFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesAccount &&
        matchesInvite
      );
    });
  }, [
    admins,
    search,
    roleFilter,
    accountFilter,
    inviteFilter,
  ]);

  /* ========================================================
     STATS
  ======================================================== */

  const stats = useMemo(() => {
    const totalAdmins = admins.length;

    const activeAdmins = admins.filter(
      (admin) => admin.is_active
    ).length;

    const disabledAdmins = admins.filter(
      (admin) => !admin.is_active
    ).length;

    const pendingInvites = admins.filter(
      (admin) =>
        (admin.invite_status || "pending") === "pending"
    ).length;

    return {
      totalAdmins,
      activeAdmins,
      disabledAdmins,
      pendingInvites,
    };
  }, [admins]);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAdmins.length / pageSize)
  );

  const paginatedAdmins = useMemo(() => {
    const start = (page - 1) * pageSize;

    return filteredAdmins.slice(
      start,
      start + pageSize
    );
  }, [filteredAdmins, page, pageSize]);

  const firstVisible =
    filteredAdmins.length === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const lastVisible = Math.min(
    page * pageSize,
    filteredAdmins.length
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
  }, [
    search,
    roleFilter,
    accountFilter,
    inviteFilter,
    pageSize,
  ]);

  /* ========================================================
     FILTER HELPERS
  ======================================================== */

  const activeFilterCount =
    (roleFilter !== "all" ? 1 : 0) +
    (accountFilter !== "all" ? 1 : 0) +
    (inviteFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setAccountFilter("all");
    setInviteFilter("all");
  };

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <AdminLayout
      title="Admin Users"
      eyebrow="User Management"
    >
      {({ theme }) => (
        <>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#FFFFFF",
                color: "#18181B",
                border:
                  "1px solid #E4E4E7",
                borderRadius: "14px",
                boxShadow: "0 10px 30px rgba(24,24,27,0.10)",
              },
            }}
          />

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
            className="relative overflow-hidden rounded-[24px] border border-zinc-200/90 bg-white shadow-[0_10px_30px_rgba(24,24,27,0.07)] p-5 sm:p-6 lg:p-7"
          >
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[110px]"
              style={{ backgroundColor: `${theme.accent}0D` }}
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
                    Superadmin Control
                  </p>
                </div>

                <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[32px] lg:text-[36px]">
                  Admin Management
                </h2>

                <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-500 sm:text-[14px]">
                  Invite administrators, manage
                  account access and review invitation
                  status from one secure workspace.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <MiniBadge>
                    {filteredAdmins.length} visible
                  </MiniBadge>

                  <MiniBadge>
                    {admins.length} total
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
                <UsersRound size={22} />
              </div>
            </div>
          </motion.section>

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading ? (
            <AdminUsersLoading theme={theme} />
          ) : !currentUser ? (
            /* ================================================
               NO AUTH SESSION
            ================================================ */

            <AccessState
              theme={theme}
              icon={ShieldOff}
              title="Authentication required"
              description="Sign in with an authorized administrator account to access admin management."
            />
          ) : !isSuperAdmin ? (
            /* ================================================
               SUPERADMIN ONLY
            ================================================ */

            <AccessState
              theme={theme}
              icon={ShieldOff}
              title="Superadmin access required"
              description="Admin Management is restricted to superadmin accounts."
            />
          ) : (
            <>
              {/* ==============================================
                  STATS
              ============================================== */}

              <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <AdminStatCard
                  title="Total Admins"
                  value={stats.totalAdmins}
                  icon={UsersRound}
                  index={0}
                  theme={theme}
                />

                <AdminStatCard
                  title="Active Admins"
                  value={stats.activeAdmins}
                  icon={UserCheck}
                  index={1}
                  theme={theme}
                />

                <AdminStatCard
                  title="Disabled Admins"
                  value={stats.disabledAdmins}
                  icon={UserX}
                  index={2}
                  theme={theme}
                />

                <AdminStatCard
                  title="Pending Invites"
                  value={stats.pendingInvites}
                  icon={Mail}
                  index={3}
                  theme={theme}
                />
              </section>

              {/* ==============================================
                  INVITE ADMIN
              ============================================== */}

              <section className="mt-4 overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_10px_30px_rgba(24,24,27,0.07)]">
                <div className="border-b border-zinc-200/80 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor:
                          theme.accentSoft,
                        color: theme.accent,
                      }}
                    >
                      <MailPlus size={17} />
                    </div>

                    <div>
                      <h3 className="text-[15px] font-black text-zinc-900">
                        Send Admin Invitation
                      </h3>

                      <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                        Invite a new administrator and
                        assign their access role.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleInviteAdmin}
                  className="p-4 sm:p-5"
                >
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_auto] lg:items-end">
                    <FormField
                      label="Full Name"
                      htmlFor="admin-full-name"
                    >
                      <div className="relative">
                        <UserCog
                          size={15}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                        />

                        <input
                          id="admin-full-name"
                          type="text"
                          value={fullName}
                          onChange={(event) =>
                            setFullName(event.target.value)
                          }
                          placeholder="Full name"
                          autoComplete="name"
                          className="h-11 w-full rounded-xl border border-zinc-200/90 bg-[#F8FAFC] pl-10 pr-4 text-[13px] font-medium text-zinc-800 outline-none transition placeholder:text-zinc-500 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Email Address"
                      htmlFor="admin-email"
                    >
                      <div className="relative">
                        <Mail
                          size={15}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                        />

                        <input
                          id="admin-email"
                          type="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(event.target.value)
                          }
                          placeholder="admin@example.com"
                          autoComplete="email"
                          className="h-11 w-full rounded-xl border border-zinc-200/90 bg-[#F8FAFC] pl-10 pr-4 text-[13px] font-medium text-zinc-800 outline-none transition placeholder:text-zinc-500 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Role"
                      htmlFor="admin-role"
                    >
                      <div className="relative">
                        <ShieldCheck
                          size={15}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                          style={{
                            color: theme.accent,
                          }}
                        />

                        <select
                          id="admin-role"
                          value={role}
                          onChange={(event) =>
                            setRole(event.target.value)
                          }
                          className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#F8FAFC] pl-10 pr-9 text-[12px] font-bold text-zinc-700 outline-none transition hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                        >
                          <option value="admin">
                            Admin
                          </option>

                          <option value="superadmin">
                            Superadmin
                          </option>
                        </select>

                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                        />
                      </div>
                    </FormField>

                    <button
                      type="submit"
                      disabled={sendingInvite}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-[12px] font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                      style={{
                        backgroundColor: theme.accent,
                      }}
                    >
                      {sendingInvite ? (
                        <>
                          <LoadingSpinner />
                          Sending...
                        </>
                      ) : (
                        <>
                          <UserPlus size={15} />
                          Send Invite
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* ==============================================
                  FILTERS
              ============================================== */}

              <section className="mt-4 rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_10px_30px_rgba(24,24,27,0.07)] p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_200px_200px_200px]">
                  {/* SEARCH */}

                  <div className="relative min-w-0">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search name, email, role or invitation status..."
                      className="h-11 w-full rounded-xl border border-zinc-200/90 bg-[#F8FAFC] pl-10 pr-10 text-[13px] font-medium text-zinc-800 outline-none transition placeholder:text-zinc-500 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                    />

                    {search && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <FilterSelect
                    value={roleFilter}
                    onChange={setRoleFilter}
                    theme={theme}
                    icon={UserCog}
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
                  </FilterSelect>

                  <FilterSelect
                    value={accountFilter}
                    onChange={setAccountFilter}
                    theme={theme}
                    icon={UserCheck}
                  >
                    <option value="all">
                      All Accounts
                    </option>
                    <option value="active">
                      Active
                    </option>
                    <option value="disabled">
                      Disabled
                    </option>
                  </FilterSelect>

                  <FilterSelect
                    value={inviteFilter}
                    onChange={setInviteFilter}
                    theme={theme}
                    icon={Mail}
                  >
                    <option value="all">
                      All Invites
                    </option>
                    <option value="pending">
                      Pending
                    </option>
                    <option value="accepted">
                      Accepted
                    </option>
                  </FilterSelect>
                </div>

                {/* ACTIVE FILTERS */}

                {(search || activeFilterCount > 0) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200/80 pt-4">
                    <span className="text-[11px] font-bold text-zinc-500">
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

                    {accountFilter !== "all" && (
                      <FilterChip
                        label={
                          accountFilter === "active"
                            ? "Active"
                            : "Disabled"
                        }
                        onRemove={() =>
                          setAccountFilter("all")
                        }
                        theme={theme}
                      />
                    )}

                    {inviteFilter !== "all" && (
                      <FilterChip
                        label={
                          inviteFilter === "accepted"
                            ? "Accepted"
                            : "Pending"
                        }
                        onRemove={() =>
                          setInviteFilter("all")
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
                  ADMIN USERS
              ============================================== */}

              <section className="mt-4 overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_10px_30px_rgba(24,24,27,0.07)]">
                {/* HEADER */}

                <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <UsersRound
                        size={15}
                        style={{
                          color: theme.accent,
                        }}
                      />

                      <h3 className="text-[15px] font-black text-zinc-900">
                        Admin Users
                      </h3>
                    </div>

                    <p className="mt-1 text-[12px] text-zinc-500">
                      {filteredAdmins.length} of{" "}
                      {admins.length} administrator
                      accounts shown
                    </p>
                  </div>

                  {/* PAGE SIZE */}

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-500">
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
                        className="h-9 appearance-none rounded-lg border border-white/[0.07] bg-[#F8FAFC] pl-3 pr-8 text-[11px] font-bold text-zinc-700 outline-none transition hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                      >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>

                      <ChevronDown
                        size={12}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ==========================================
                    DESKTOP TABLE
                ========================================== */}

                <div className="hidden w-full min-w-0 xl:block">
                  <table className="w-full table-fixed border-collapse">
                    <colgroup>
                      <col className="w-[20%]" />
                      <col className="w-[11%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[19%]" />
                    </colgroup>

                    <thead>
                      <tr className="border-b border-zinc-200/80 bg-[#F8FAFC]">
                        <TableHeading>
                          Administrator
                        </TableHeading>

                        <TableHeading>
                          Role
                        </TableHeading>

                        <TableHeading>
                          Account
                        </TableHeading>

                        <TableHeading>
                          Invite
                        </TableHeading>

                        <TableHeading>
                          Invited
                        </TableHeading>

                        <TableHeading>
                          Accepted
                        </TableHeading>

                        <TableHeading>
                          Actions
                        </TableHeading>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAdmins.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-16"
                          >
                            <EmptyAdmins theme={theme} />
                          </td>
                        </tr>
                      ) : (
                        paginatedAdmins.map((admin) => (
                          <AdminRow
                            key={admin.id}
                            admin={admin}
                            theme={theme}
                            currentUserId={
                              currentUser?.id
                            }
                            updating={
                              updatingAdminId ===
                              admin.id
                            }
                            onToggle={
                              toggleAdminStatus
                            }
                            onDelete={
                              requestDeleteAdmin
                            }
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ==========================================
                    MOBILE / TABLET
                ========================================== */}

                <div className="divide-y divide-zinc-200/80 xl:hidden">
                  {filteredAdmins.length === 0 ? (
                    <div className="p-6">
                      <EmptyAdmins theme={theme} />
                    </div>
                  ) : (
                    paginatedAdmins.map((admin) => (
                      <MobileAdminCard
                        key={admin.id}
                        admin={admin}
                        theme={theme}
                        currentUserId={
                          currentUser?.id
                        }
                        updating={
                          updatingAdminId === admin.id
                        }
                        onToggle={toggleAdminStatus}
                        onDelete={requestDeleteAdmin}
                      />
                    ))
                  )}
                </div>

                {/* ==========================================
                    PAGINATION
                ========================================== */}

                <AdminPagination
                  page={page}
                  setPage={setPage}
                  totalPages={totalPages}
                  firstVisible={firstVisible}
                  lastVisible={lastVisible}
                  totalItems={filteredAdmins.length}
                  theme={theme}
                />
              </section>
            </>
          )}

          {/* ==================================================
              DELETE DIALOG
          ================================================== */}

          <DeleteAdminDialog
            admin={deleteTarget}
            deleting={deletingAdmin}
            theme={theme}
            onCancel={() => {
              if (!deletingAdmin) {
                setDeleteTarget(null);
              }
            }}
            onConfirm={deleteAdmin}
          />
        </>
      )}
    </AdminLayout>
  );
}

/* ==========================================================
   STAT CARD
========================================================== */

function AdminStatCard({
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
      className="group relative min-w-0 overflow-hidden rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition duration-200 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)]"
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

      <p className="mt-1.5 text-[30px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[32px]">
        {value}
      </p>
    </motion.div>
  );
}

/* ==========================================================
   FORM FIELD
========================================================== */

function FormField({
  label,
  htmlFor,
  children,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-zinc-500"
      >
        {label}
      </label>

      {children}
    </div>
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
          onChange(event.target.value)
        }
        className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#F8FAFC] pl-10 pr-9 text-[12px] font-bold text-zinc-700 outline-none transition hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
      >
        {children}
      </select>

      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
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
   ADMIN ROW
========================================================== */

function AdminRow({
  admin,
  theme,
  currentUserId,
  updating,
  onToggle,
  onDelete,
}) {
  const isCurrentUser =
    admin.id === currentUserId;

  return (
    <tr className="border-b border-zinc-200/70 transition last:border-b-0 hover:bg-[#F8FAFC]">
      {/* ADMIN */}

      <td className="px-3 py-4 pl-4 2xl:px-4">
        <AdminIdentity
          admin={admin}
          theme={theme}
          isCurrentUser={isCurrentUser}
        />
      </td>

      {/* ROLE */}

      <td className="px-3 py-4 2xl:px-4">
        <RoleBadge
          role={admin.role}
          theme={theme}
        />
      </td>

      {/* ACCOUNT */}

      <td className="px-3 py-4 2xl:px-4">
        <AccountBadge
          active={admin.is_active}
        />
      </td>

      {/* INVITE */}

      <td className="px-3 py-4 2xl:px-4">
        <InviteBadge
          status={admin.invite_status}
        />
      </td>

      {/* INVITED */}

      <td className="px-3 py-4 2xl:px-4">
        <DateDisplay
          date={admin.invited_at}
        />
      </td>

      {/* ACCEPTED */}

      <td className="px-3 py-4 2xl:px-4">
        <DateDisplay
          date={admin.accepted_at}
        />
      </td>

      {/* ACTIONS */}

      <td className="px-3 py-4 pr-4 2xl:px-4">
        <AdminActions
          admin={admin}
          isCurrentUser={isCurrentUser}
          updating={updating}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

/* ==========================================================
   MOBILE ADMIN CARD
========================================================== */

function MobileAdminCard({
  admin,
  theme,
  currentUserId,
  updating,
  onToggle,
  onDelete,
}) {
  const isCurrentUser =
    admin.id === currentUserId;

  return (
    <article className="p-4 sm:p-5">
      <AdminIdentity
        admin={admin}
        theme={theme}
        isCurrentUser={isCurrentUser}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <RoleBadge
          role={admin.role}
          theme={theme}
        />

        <AccountBadge
          active={admin.is_active}
        />

        <InviteBadge
          status={admin.invite_status}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-white/[0.05] bg-[#F8FAFC] p-3.5">
        <MobileDetail label="Invited">
          <DateDisplay
            date={admin.invited_at}
          />
        </MobileDetail>

        <MobileDetail label="Accepted">
          <DateDisplay
            date={admin.accepted_at}
          />
        </MobileDetail>
      </div>

      <div className="mt-4">
        <AdminActions
          admin={admin}
          isCurrentUser={isCurrentUser}
          updating={updating}
          onToggle={onToggle}
          onDelete={onDelete}
          mobile
        />
      </div>
    </article>
  );
}

/* ==========================================================
   ADMIN IDENTITY
========================================================== */

function AdminIdentity({
  admin,
  theme,
  isCurrentUser,
}) {
  const name =
    admin.full_name || "Unnamed Admin";

  const email =
    admin.email || "No email";

  const initial =
    String(name)
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[12px] font-black"
        style={{
          borderColor: `${theme.accent}18`,
          backgroundColor: theme.accentSoft,
          color: theme.accent,
        }}
      >
        {initial}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p
            className="truncate text-[13px] font-black text-zinc-800"
            title={name}
          >
            {name}
          </p>

          {isCurrentUser && (
            <span
              className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.05em]"
              style={{
                borderColor: `${theme.accent}20`,
                backgroundColor:
                  theme.accentSoft,
                color: theme.accent,
              }}
            >
              You
            </span>
          )}
        </div>

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
   ACCOUNT BADGE
========================================================== */

function AccountBadge({
  active,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] ${active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
        }`}
    >
      {active ? (
        <CheckCircle2 size={11} />
      ) : (
        <ShieldOff size={11} />
      )}

      {active ? "Active" : "Disabled"}
    </span>
  );
}

/* ==========================================================
   INVITE BADGE
========================================================== */

function InviteBadge({
  status,
}) {
  const normalized =
    String(status || "pending").toLowerCase();

  const accepted =
    normalized === "accepted";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] ${accepted
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
    >
      {accepted ? (
        <CheckCircle2 size={11} />
      ) : (
        <Clock3 size={11} />
      )}

      {status || "pending"}
    </span>
  );
}

/* ==========================================================
   ADMIN ACTIONS
========================================================== */

function AdminActions({
  admin,
  isCurrentUser,
  updating,
  onToggle,
  onDelete,
  mobile = false,
}) {
  if (isCurrentUser) {
    return (
      <div
        className={`${mobile ? "w-full" : "inline-flex"
          }`}
      >
        <span className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200/90 bg-[#F8FAFC] px-3 text-[10px] font-black uppercase tracking-[0.04em] text-zinc-500">
          Current User
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 ${mobile
          ? "flex-col sm:flex-row"
          : "flex-wrap"
        }`}
    >
      <button
        type="button"
        disabled={updating}
        onClick={() => onToggle(admin)}
        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.04em] transition disabled:cursor-not-allowed disabled:opacity-50 ${mobile ? "flex-1" : ""
          } ${admin.is_active
            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-500/[0.12]"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-500/[0.12]"
          }`}
      >
        {updating ? (
          <LoadingSpinner />
        ) : admin.is_active ? (
          <ShieldOff size={12} />
        ) : (
          <UserCheck size={12} />
        )}

        {updating
          ? "Updating"
          : admin.is_active
            ? "Disable"
            : "Enable"}
      </button>

      <button
        type="button"
        disabled={updating}
        onClick={() => onDelete(admin)}
        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[10px] font-black uppercase tracking-[0.04em] text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 ${mobile ? "flex-1" : ""
          }`}
      >
        <Trash2 size={12} />
        Delete
      </button>
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
      <span className="text-[11px] text-zinc-500">
        N/A
      </span>
    );
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return (
      <span className="text-[11px] text-zinc-500">
        N/A
      </span>
    );
  }

  const dateText =
    value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const timeText =
    value.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] font-bold text-zinc-500">
        {dateText}
      </p>

      <p className="mt-0.5 truncate text-[10px] text-zinc-500">
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
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </p>

      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
}

/* ==========================================================
   PAGINATION
========================================================== */

function AdminPagination({
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
    <div className="flex flex-col gap-3 border-t border-zinc-200/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] font-bold text-zinc-500">
        Showing{" "}
        <span className="text-zinc-500">
          {firstVisible}
        </span>
        {" – "}
        <span className="text-zinc-500">
          {lastVisible}
        </span>{" "}
        of{" "}
        <span className="text-zinc-500">
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
          onClick={() => setPage(totalPages)}
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
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-[#F8FAFC] text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/* ==========================================================
   DELETE ADMIN DIALOG
========================================================== */

function DeleteAdminDialog({
  admin,
  deleting,
  theme,
  onCancel,
  onConfirm,
}) {
  if (!admin) {
    return null;
  }

  const displayName =
    admin.full_name ||
    admin.email ||
    "this administrator";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !deleting
        ) {
          onCancel();
        }
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.97,
          y: 8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="w-full max-w-md overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#111114] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-admin-title"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.07] text-red-400">
              <Trash2 size={18} />
            </div>

            <div className="min-w-0">
              <p
                className="text-[11px] font-black uppercase tracking-[0.1em]"
                style={{
                  color: theme.accent,
                }}
              >
                Permanent Action
              </p>

              <h3
                id="delete-admin-title"
                className="mt-1 text-[18px] font-black tracking-[-0.02em] text-zinc-100"
              >
                Delete administrator?
              </h3>

              <p className="mt-2 text-[13px] leading-6 text-zinc-500">
                <span className="font-bold text-zinc-300">
                  {displayName}
                </span>{" "}
                will be permanently removed from
                Admins and Authentication.
              </p>

              <p className="mt-2 text-[12px] leading-5 text-red-400/80">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-white/[0.05] p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="h-10 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-[12px] font-black text-zinc-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.10] px-4 text-[12px] font-black text-red-400 transition hover:bg-red-500/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <>
                <LoadingSpinner />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ==========================================================
   ACCESS STATE
========================================================== */

function AccessState({
  theme,
  icon: Icon,
  title,
  description,
}) {
  return (
    <section className="mt-4 flex min-h-[360px] items-center justify-center rounded-[22px] border border-zinc-200/90 bg-white p-6 shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
      <div className="max-w-md text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border"
          style={{
            borderColor: `${theme.accent}18`,
            backgroundColor: theme.accentSoft,
            color: theme.accent,
          }}
        >
          <Icon size={19} />
        </div>

        <h3 className="mt-4 text-[17px] font-black text-zinc-900">
          {title}
        </h3>

        <p className="mt-2 text-[13px] leading-6 text-zinc-500">
          {description}
        </p>
      </div>
    </section>
  );
}

/* ==========================================================
   EMPTY ADMINS
========================================================== */

function EmptyAdmins({
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
        <UsersRound size={17} />
      </div>

      <p className="mt-3 text-[13px] font-black text-zinc-800">
        No administrators found
      </p>

      <p className="mt-1 max-w-xs text-[12px] leading-5 text-zinc-500">
        Try adjusting your search or filter
        selection.
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
   LOADING SPINNER
========================================================== */

function LoadingSpinner() {
  return (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
  );
}

/* ==========================================================
   LOADING STATE
========================================================== */

function AdminUsersLoading({
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
            className="h-[138px] animate-pulse rounded-[18px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)] p-4"
          >
            <div
              className="h-10 w-10 rounded-xl opacity-30"
              style={{
                backgroundColor:
                  theme.accentSoft,
              }}
            />

            <div className="mt-4 h-3 w-24 rounded bg-zinc-200/80" />

            <div className="mt-3 h-7 w-16 rounded bg-zinc-200/70" />
          </div>
        ))}
      </div>

      {/* INVITE FORM */}

      <div className="animate-pulse overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
        <div className="border-b border-zinc-200/80 p-5">
          <div className="h-4 w-40 rounded bg-zinc-200/70" />

          <div className="mt-2 h-3 w-64 max-w-full rounded bg-zinc-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-4">
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
          <div className="h-11 rounded-xl bg-zinc-200/70" />
        </div>
      </div>

      {/* FILTERS */}

      <div className="animate-pulse rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
          <div className="h-11 rounded-xl bg-[#F8FAFC]" />
        </div>
      </div>

      {/* USERS */}

      <div className="overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
        <div className="flex items-center justify-between border-b border-zinc-200/80 p-5">
          <div>
            <div className="h-4 w-28 rounded bg-zinc-200/70" />

            <div className="mt-2 h-3 w-48 rounded bg-zinc-100" />
          </div>

          <div className="h-9 w-16 rounded-lg bg-[#F8FAFC]" />
        </div>

        <div className="space-y-1 p-4">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="flex h-16 animate-pulse items-center gap-4 rounded-xl px-2"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-200/80" />

              <div className="min-w-0 flex-1">
                <div className="h-3 w-32 rounded bg-zinc-200/70" />

                <div className="mt-2 h-2.5 w-44 max-w-full rounded bg-[#F8FAFC]" />
              </div>

              <div className="hidden h-7 w-20 rounded-lg bg-[#F8FAFC] sm:block" />

              <div className="hidden h-7 w-20 rounded-lg bg-[#F8FAFC] lg:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}