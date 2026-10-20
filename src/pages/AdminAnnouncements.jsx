import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import dayjs from "dayjs";

import {
    AlertTriangle,
    CalendarClock,
    Check,
    CheckCircle2,
    Clock3,
    Edit3,
    Info,
    Megaphone,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    X,
    XCircle,
    Zap,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { logAdminActivity } from "../utils/logAdminActivity";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// CONSTANTS
// ===========================================================

const EMPTY_FORM = {
    title: "",
    message: "",
    type: "info",
    is_active: true,
    start_at: "",
    end_at: "",
};

const FILTERS = [
    { value: "all", label: "All" },
    { value: "live", label: "Live" },
    { value: "scheduled", label: "Scheduled" },
    { value: "expired", label: "Expired" },
    { value: "disabled", label: "Disabled" },
];

const TYPE_OPTIONS = [
    {
        value: "info",
        label: "Info",
        description: "General information for participants.",
        icon: Info,
    },
    {
        value: "success",
        label: "Success",
        description: "Positive updates and celebrations.",
        icon: CheckCircle2,
    },
    {
        value: "warning",
        label: "Warning",
        description: "Important notices requiring attention.",
        icon: AlertTriangle,
    },
    {
        value: "important",
        label: "Important",
        description: "High-priority participant updates.",
        icon: Zap,
    },
];

// ===========================================================
// HELPERS
// ===========================================================

function getAnnouncementStatus(announcement) {
    if (!announcement?.is_active) {
        return "disabled";
    }

    const now = dayjs();

    const start = announcement.start_at
        ? dayjs(announcement.start_at)
        : null;

    const end = announcement.end_at
        ? dayjs(announcement.end_at)
        : null;

    if (start && start.isAfter(now)) {
        return "scheduled";
    }

    if (end && end.isBefore(now)) {
        return "expired";
    }

    return "live";
}

function toLocalDateTimeInput(value) {
    if (!value) return "";

    const date = dayjs(value);

    if (!date.isValid()) {
        return "";
    }

    return date.format("YYYY-MM-DDTHH:mm");
}

function toIsoOrNull(value) {
    if (!value) return null;

    const date = dayjs(value);

    if (!date.isValid()) {
        return null;
    }

    return date.toISOString();
}

function formatDateTime(value) {
    if (!value) return "Not set";

    const date = dayjs(value);

    if (!date.isValid()) {
        return "Invalid date";
    }

    return date.format("DD MMM YYYY, hh:mm A");
}

function getStatusMeta(status) {
    switch (status) {
        case "live":
            return {
                label: "Live",
                className:
                    "border-emerald-200 bg-emerald-50 text-emerald-700",
                dotClass: "bg-emerald-500",
            };

        case "scheduled":
            return {
                label: "Scheduled",
                className:
                    "border-blue-200 bg-blue-50 text-blue-700",
                dotClass: "bg-blue-500",
            };

        case "expired":
            return {
                label: "Expired",
                className:
                    "border-zinc-200 bg-zinc-100 text-zinc-600",
                dotClass: "bg-zinc-400",
            };

        case "disabled":
        default:
            return {
                label: "Disabled",
                className:
                    "border-red-200 bg-red-50 text-red-700",
                dotClass: "bg-red-500",
            };
    }
}

function getTypeMeta(type) {
    switch (type) {
        case "success":
            return {
                label: "Success",
                icon: CheckCircle2,
                className:
                    "border-emerald-200 bg-emerald-50 text-emerald-700",
            };

        case "warning":
            return {
                label: "Warning",
                icon: AlertTriangle,
                className:
                    "border-amber-200 bg-amber-50 text-amber-700",
            };

        case "important":
            return {
                label: "Important",
                icon: Zap,
                className:
                    "border-red-200 bg-red-50 text-red-700",
            };

        case "info":
        default:
            return {
                label: "Info",
                icon: Info,
                className:
                    "border-blue-200 bg-blue-50 text-blue-700",
            };
    }
}

// ===========================================================
// ADMIN ANNOUNCEMENTS
// ===========================================================

export default function AdminAnnouncements() {
    // =========================================================
    // STATE
    // =========================================================

    const [announcements, setAnnouncements] = useState([]);

    const [fetching, setFetching] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [form, setForm] = useState(EMPTY_FORM);

    const [editingId, setEditingId] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState("");

    // =========================================================
    // FETCH
    // =========================================================

    const fetchAnnouncements = async () => {
        const { data, error: fetchError } = await supabase
            .from("announcements")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        if (fetchError) {
            throw fetchError;
        }

        setAnnouncements(data || []);
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            setFetching(true);
            setError("");

            try {
                const { data, error: fetchError } =
                    await supabase
                        .from("announcements")
                        .select("*")
                        .order("created_at", {
                            ascending: false,
                        });

                if (fetchError) {
                    throw fetchError;
                }

                if (!mounted) return;

                setAnnouncements(data || []);
            } catch (loadError) {
                console.error(
                    "Announcements load failed:",
                    loadError
                );

                if (!mounted) return;

                setError(
                    loadError?.message ||
                    "Unable to load announcements."
                );
            } finally {
                if (mounted) {
                    setFetching(false);
                }
            }
        };

        initialize();

        return () => {
            mounted = false;
        };
    }, []);

    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh = async () => {
        if (refreshing) return;

        setRefreshing(true);
        setError("");

        try {
            await fetchAnnouncements();

            toast.success("Announcements refreshed");
        } catch (refreshError) {
            console.error(
                "Announcement refresh failed:",
                refreshError
            );

            toast.error(
                refreshError?.message ||
                "Failed to refresh announcements"
            );
        } finally {
            setRefreshing(false);
        }
    };

    // =========================================================
    // FORM
    // =========================================================

    const updateForm = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const handleEdit = (announcement) => {
        setEditingId(announcement.id);

        setForm({
            title: announcement.title || "",
            message: announcement.message || "",
            type: announcement.type || "info",
            is_active:
                announcement.is_active !== false,
            start_at: toLocalDateTimeInput(
                announcement.start_at
            ),
            end_at: toLocalDateTimeInput(
                announcement.end_at
            ),
        });

        requestAnimationFrame(() => {
            document
                .getElementById("announcement-form")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
        });
    };

    // =========================================================
    // VALIDATION
    // =========================================================

    const trimmedTitle = form.title.trim();
    const trimmedMessage = form.message.trim();

    const datesValid = useMemo(() => {
        if (!form.start_at || !form.end_at) {
            return true;
        }

        const start = dayjs(form.start_at);
        const end = dayjs(form.end_at);

        if (!start.isValid() || !end.isValid()) {
            return false;
        }

        return end.isAfter(start);
    }, [form.start_at, form.end_at]);

    const isFormValid =
        trimmedTitle.length > 0 &&
        trimmedMessage.length > 0 &&
        datesValid;

    // =========================================================
    // CREATE / UPDATE
    // =========================================================

    const handleSave = async (user) => {
        if (!isFormValid || saving) {
            if (!trimmedTitle) {
                toast.error(
                    "Enter an announcement title"
                );
            } else if (!trimmedMessage) {
                toast.error(
                    "Enter an announcement message"
                );
            } else if (!datesValid) {
                toast.error(
                    "End time must be after start time"
                );
            }

            return;
        }

        setSaving(true);

        try {
            const payload = {
                title: trimmedTitle,
                message: trimmedMessage,
                type: form.type,
                is_active: form.is_active,
                start_at: toIsoOrNull(form.start_at),
                end_at: toIsoOrNull(form.end_at),
            };

            let response;

            if (editingId) {
                response = await supabase
                    .from("announcements")
                    .update(payload)
                    .eq("id", editingId)
                    .select()
                    .single();
            } else {
                response = await supabase
                    .from("announcements")
                    .insert([
                        {
                            ...payload,
                            created_by: user?.id || null,
                        },
                    ])
                    .select()
                    .single();
            }

            if (response.error) {
                throw response.error;
            }

            const savedAnnouncement =
                response.data;

            toast.success(
                editingId
                    ? "Announcement updated"
                    : "Announcement created"
            );

            // =====================================================
            // ACTIVITY LOG
            // =====================================================

            try {
                await logAdminActivity({
                    action: editingId
                        ? "UPDATE_ANNOUNCEMENT"
                        : "CREATE_ANNOUNCEMENT",

                    module: "Announcements",

                    description: editingId
                        ? `Updated announcement: ${savedAnnouncement.title}`
                        : `Created announcement: ${savedAnnouncement.title}`,

                    targetId: savedAnnouncement.id,

                    targetType: "announcement",
                });
            } catch (logError) {
                console.error(
                    "Activity logging failed:",
                    logError
                );
            }

            await fetchAnnouncements();

            resetForm();
        } catch (saveError) {
            console.error(
                "Announcement save failed:",
                saveError
            );

            toast.error(
                saveError?.message ||
                "Failed to save announcement"
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // ENABLE / DISABLE
    // =========================================================

    const handleToggleStatus = async (
        announcement
    ) => {
        const nextActive =
            !announcement.is_active;

        try {
            const { data, error: updateError } =
                await supabase
                    .from("announcements")
                    .update({
                        is_active: nextActive,
                    })
                    .eq("id", announcement.id)
                    .select()
                    .single();

            if (updateError) {
                throw updateError;
            }

            setAnnouncements((previous) =>
                previous.map((item) =>
                    item.id === data.id ? data : item
                )
            );

            toast.success(
                nextActive
                    ? "Announcement enabled"
                    : "Announcement disabled"
            );

            try {
                await logAdminActivity({
                    action: nextActive
                        ? "ENABLE_ANNOUNCEMENT"
                        : "DISABLE_ANNOUNCEMENT",

                    module: "Announcements",

                    description: nextActive
                        ? `Enabled announcement: ${announcement.title}`
                        : `Disabled announcement: ${announcement.title}`,

                    targetId: announcement.id,

                    targetType: "announcement",
                });
            } catch (logError) {
                console.error(
                    "Activity logging failed:",
                    logError
                );
            }
        } catch (toggleError) {
            console.error(
                "Announcement status update failed:",
                toggleError
            );

            toast.error(
                toggleError?.message ||
                "Failed to update announcement"
            );
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async () => {
        if (!deleteTarget || deleting) {
            return;
        }

        setDeleting(true);

        const target = deleteTarget;

        try {
            const { error: deleteError } =
                await supabase
                    .from("announcements")
                    .delete()
                    .eq("id", target.id);

            if (deleteError) {
                throw deleteError;
            }

            setAnnouncements((previous) =>
                previous.filter(
                    (item) => item.id !== target.id
                )
            );

            if (editingId === target.id) {
                resetForm();
            }

            setDeleteTarget(null);

            toast.success("Announcement deleted");

            try {
                await logAdminActivity({
                    action: "DELETE_ANNOUNCEMENT",

                    module: "Announcements",

                    description: `Deleted announcement: ${target.title}`,

                    targetId: target.id,

                    targetType: "announcement",
                });
            } catch (logError) {
                console.error(
                    "Activity logging failed:",
                    logError
                );
            }
        } catch (deleteError) {
            console.error(
                "Announcement delete failed:",
                deleteError
            );

            toast.error(
                deleteError?.message ||
                "Failed to delete announcement"
            );
        } finally {
            setDeleting(false);
        }
    };

    // =========================================================
    // STATS
    // =========================================================

    const stats = useMemo(() => {
        const result = {
            total: announcements.length,
            live: 0,
            scheduled: 0,
            expired: 0,
            disabled: 0,
        };

        announcements.forEach((announcement) => {
            const status =
                getAnnouncementStatus(announcement);

            result[status] += 1;
        });

        return result;
    }, [announcements]);

    // =========================================================
    // FILTERED ANNOUNCEMENTS
    // =========================================================

    const filteredAnnouncements =
        useMemo(() => {
            const query =
                search.trim().toLowerCase();

            return announcements.filter(
                (announcement) => {
                    const status =
                        getAnnouncementStatus(
                            announcement
                        );

                    const matchesFilter =
                        filter === "all" ||
                        status === filter;

                    const matchesSearch =
                        !query ||
                        announcement.title
                            ?.toLowerCase()
                            .includes(query) ||
                        announcement.message
                            ?.toLowerCase()
                            .includes(query);

                    return (
                        matchesFilter && matchesSearch
                    );
                }
            );
        }, [announcements, search, filter]);

    // =========================================================
    // UI
    // =========================================================

    return (
        <AdminLayout
            title="Announcements"
            eyebrow="Communication"
        >
            {({ user, theme }) => (
                <>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3500,

                            style: {
                                background: "#FFFFFF",
                                color: "#18181B",
                                border:
                                    "1px solid rgba(228,228,231,0.95)",
                                borderRadius: "14px",
                                fontSize: "13px",
                                fontWeight: 600,
                                boxShadow:
                                    "0 16px 40px rgba(24,24,27,.12)",
                            },

                            success: {
                                iconTheme: {
                                    primary: "#16A34A",
                                    secondary: "#FFFFFF",
                                },
                            },

                            error: {
                                iconTheme: {
                                    primary: "#EF4444",
                                    secondary: "#FFFFFF",
                                },
                            },
                        }}
                    />

                    {/* =================================================
              HERO
          ================================================= */}

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
                                backgroundSize: "34px 34px",
                            }}
                        />

                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2">
                                    <Sparkles
                                        size={15}
                                        style={{
                                            color: theme.accent,
                                        }}
                                    />

                                    <p
                                        className="text-[11px] font-black uppercase tracking-[0.14em]"
                                        style={{
                                            color: theme.accent,
                                        }}
                                    >
                                        Participant Communication
                                    </p>
                                </div>

                                <h2 className="mt-3 text-[27px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[31px] lg:text-[35px]">
                                    Keep everyone informed
                                </h2>

                                <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
                                    Create, schedule and manage
                                    announcements shown to
                                    QUIZTIANS participants.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    disabled={refreshing}
                                    onClick={handleRefresh}
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 text-[12px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <RefreshCw
                                        size={15}
                                        className={
                                            refreshing
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />

                                    Refresh
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm();

                                        requestAnimationFrame(
                                            () => {
                                                document
                                                    .getElementById(
                                                        "announcement-form"
                                                    )
                                                    ?.scrollIntoView({
                                                        behavior:
                                                            "smooth",
                                                        block: "start",
                                                    });
                                            }
                                        );
                                    }}
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-black text-white shadow-sm transition hover:-translate-y-0.5"
                                    style={{
                                        background: `linear-gradient(90deg, ${theme.accent
                                            }, ${theme.chartSecondary ||
                                            theme.accent
                                            })`,
                                        boxShadow: `0 12px 30px ${theme.accent}18`,
                                    }}
                                >
                                    <Plus size={16} />

                                    New Announcement
                                </button>
                            </div>
                        </div>
                    </motion.section>

                    {/* =================================================
              STATS
          ================================================= */}

                    {!fetching && !error && (
                        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                            <StatCard
                                label="Total"
                                value={stats.total}
                                icon={Megaphone}
                                theme={theme}
                            />

                            <StatCard
                                label="Live"
                                value={stats.live}
                                icon={Zap}
                                theme={theme}
                                color="#16A34A"
                            />

                            <StatCard
                                label="Scheduled"
                                value={stats.scheduled}
                                icon={CalendarClock}
                                theme={theme}
                                color="#2563EB"
                            />

                            <StatCard
                                label="Expired"
                                value={stats.expired}
                                icon={Clock3}
                                theme={theme}
                            />

                            <StatCard
                                label="Disabled"
                                value={stats.disabled}
                                icon={XCircle}
                                theme={theme}
                                color="#DC2626"
                            />
                        </section>
                    )}

                    {/* =================================================
              LOADING / ERROR / CONTENT
          ================================================= */}

                    {fetching ? (
                        <AnnouncementLoading />
                    ) : error ? (
                        <ErrorState
                            message={error}
                            theme={theme}
                            onRetry={handleRefresh}
                        />
                    ) : (
                        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                            {/* =============================================
                  FORM
              ============================================= */}

                            <motion.div
                                id="announcement-form"
                                initial={{
                                    opacity: 0,
                                    y: 8,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                className="scroll-mt-28 rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6 xl:sticky xl:top-[100px] xl:self-start"
                            >
                                <SectionHeading
                                    icon={
                                        editingId
                                            ? Edit3
                                            : Plus
                                    }
                                    title={
                                        editingId
                                            ? "Edit Announcement"
                                            : "Create Announcement"
                                    }
                                    description={
                                        editingId
                                            ? "Update the selected participant message."
                                            : "Publish a new message for participants."
                                    }
                                    theme={theme}
                                />

                                {editingId && (
                                    <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Edit3
                                                size={14}
                                                className="shrink-0 text-amber-700"
                                            />

                                            <p className="truncate text-[11px] font-bold text-amber-800">
                                                Editing existing
                                                announcement
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="shrink-0 text-[10px] font-black text-amber-700 transition hover:text-amber-900"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* TITLE */}

                                <div className="mt-6">
                                    <FieldLabel
                                        label="Title"
                                        required
                                    />

                                    <input
                                        type="text"
                                        value={form.title}
                                        maxLength={120}
                                        onChange={(event) =>
                                            updateForm(
                                                "title",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Quiz schedule update"
                                        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 text-[13px] font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                                    />

                                    <div className="mt-2 flex items-center justify-between gap-3 px-1">
                                        <p className="text-[10px] text-zinc-500">
                                            Short participant-facing
                                            heading.
                                        </p>

                                        <p className="text-[10px] font-bold text-zinc-400">
                                            {form.title.length}/120
                                        </p>
                                    </div>
                                </div>

                                {/* MESSAGE */}

                                <div className="mt-5">
                                    <FieldLabel
                                        label="Message"
                                        required
                                    />

                                    <textarea
                                        value={form.message}
                                        maxLength={1000}
                                        onChange={(event) =>
                                            updateForm(
                                                "message",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter the announcement message..."
                                        rows={6}
                                        className="mt-2 w-full resize-none rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3.5 text-[13px] font-medium leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                                    />

                                    <div className="mt-2 flex items-center justify-between gap-3 px-1">
                                        <p className="text-[10px] text-zinc-500">
                                            Keep the message clear and
                                            concise.
                                        </p>

                                        <p className="text-[10px] font-bold text-zinc-400">
                                            {form.message.length}/1000
                                        </p>
                                    </div>
                                </div>

                                {/* TYPE */}

                                <div className="mt-5">
                                    <FieldLabel label="Announcement Type" />

                                    <div className="mt-2 grid grid-cols-2 gap-2.5">
                                        {TYPE_OPTIONS.map(
                                            (option) => {
                                                const Icon =
                                                    option.icon;

                                                const active =
                                                    form.type ===
                                                    option.value;

                                                return (
                                                    <button
                                                        key={
                                                            option.value
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            updateForm(
                                                                "type",
                                                                option.value
                                                            )
                                                        }
                                                        className="flex min-h-[74px] items-start gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5"
                                                        style={{
                                                            borderColor:
                                                                active
                                                                    ? `${theme.accent}35`
                                                                    : "#E4E4E7",

                                                            backgroundColor:
                                                                active
                                                                    ? theme.accentSoft
                                                                    : "#F8FAFC",
                                                        }}
                                                    >
                                                        <div
                                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                                                            style={{
                                                                borderColor:
                                                                    active
                                                                        ? `${theme.accent}25`
                                                                        : "#E4E4E7",

                                                                backgroundColor:
                                                                    active
                                                                        ? "#FFFFFF"
                                                                        : "#FFFFFF",

                                                                color: active
                                                                    ? theme.accent
                                                                    : "#71717A",
                                                            }}
                                                        >
                                                            <Icon size={14} />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-black text-zinc-800">
                                                                {option.label}
                                                            </p>

                                                            <p className="mt-1 text-[9px] leading-4 text-zinc-500">
                                                                {
                                                                    option.description
                                                                }
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>

                                {/* SCHEDULE */}

                                <div className="mt-6 border-t border-zinc-200/80 pt-5">
                                    <div className="flex items-center gap-2">
                                        <CalendarClock
                                            size={15}
                                            style={{
                                                color: theme.accent,
                                            }}
                                        />

                                        <p className="text-[13px] font-black text-zinc-800">
                                            Schedule
                                        </p>
                                    </div>

                                    <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                                        Leave both fields empty to
                                        keep the announcement
                                        available until manually
                                        disabled.
                                    </p>

                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <FieldLabel label="Start Time" />

                                            <input
                                                type="datetime-local"
                                                value={form.start_at}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "start_at",
                                                        event.target.value
                                                    )
                                                }
                                                className="mt-2 h-12 w-full rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-3 text-[12px] font-semibold text-zinc-900 outline-none transition [color-scheme:light] hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                                            />
                                        </div>

                                        <div>
                                            <FieldLabel label="End Time" />

                                            <input
                                                type="datetime-local"
                                                value={form.end_at}
                                                onChange={(event) =>
                                                    updateForm(
                                                        "end_at",
                                                        event.target.value
                                                    )
                                                }
                                                className={`mt-2 h-12 w-full rounded-2xl border bg-[#F8FAFC] px-3 text-[12px] font-semibold text-zinc-900 outline-none transition [color-scheme:light] hover:border-zinc-300 focus:bg-white ${datesValid
                                                        ? "border-zinc-200/90 focus:border-zinc-400"
                                                        : "border-red-300 focus:border-red-400"
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {!datesValid && (
                                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                                            <AlertTriangle
                                                size={13}
                                                className="shrink-0 text-red-600"
                                            />

                                            <p className="text-[10px] font-bold text-red-700">
                                                End time must be after
                                                start time.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ACTIVE */}

                                <div className="mt-5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateForm(
                                                "is_active",
                                                !form.is_active
                                            )
                                        }
                                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-4 text-left transition hover:border-zinc-300"
                                    >
                                        <div>
                                            <p className="text-[12px] font-black text-zinc-800">
                                                Active
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                                                Allow this announcement
                                                to appear when its
                                                schedule is valid.
                                            </p>
                                        </div>

                                        <Toggle
                                            active={
                                                form.is_active
                                            }
                                            theme={theme}
                                        />
                                    </button>
                                </div>

                                {/* SAVE */}

                                <div className="mt-6 border-t border-zinc-200/80 pt-5">
                                    <button
                                        type="button"
                                        disabled={
                                            !isFormValid || saving
                                        }
                                        onClick={() =>
                                            handleSave(user)
                                        }
                                        className={`flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-[14px] font-black transition ${isFormValid &&
                                                !saving
                                                ? "text-white hover:-translate-y-0.5"
                                                : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                                            }`}
                                        style={
                                            isFormValid &&
                                                !saving
                                                ? {
                                                    background: `linear-gradient(90deg, ${theme.accent
                                                        }, ${theme.chartSecondary ||
                                                        theme.accent
                                                        })`,

                                                    boxShadow: `0 12px 30px ${theme.accent}18`,
                                                }
                                                : undefined
                                        }
                                    >
                                        {saving ? (
                                            <>
                                                <LoadingSpinner />

                                                {editingId
                                                    ? "Updating..."
                                                    : "Publishing..."}
                                            </>
                                        ) : (
                                            <>
                                                {editingId ? (
                                                    <Edit3
                                                        size={16}
                                                    />
                                                ) : (
                                                    <Megaphone
                                                        size={16}
                                                    />
                                                )}

                                                {editingId
                                                    ? "Update Announcement"
                                                    : "Publish Announcement"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>

                            {/* =============================================
                  ANNOUNCEMENT LIST
              ============================================= */}

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
                                    delay: 0.05,
                                }}
                                className="min-w-0"
                            >
                                <div className="rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6">
                                    <div className="flex flex-col gap-4">
                                        <SectionHeading
                                            icon={Megaphone}
                                            title="Announcement Library"
                                            description={`${announcements.length} total announcements`}
                                            theme={theme}
                                        />

                                        {/* SEARCH */}

                                        <div className="relative">
                                            <Search
                                                size={16}
                                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                                            />

                                            <input
                                                type="text"
                                                value={search}
                                                onChange={(event) =>
                                                    setSearch(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Search announcements..."
                                                className="h-11 w-full rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] pl-11 pr-11 text-[12px] font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
                                            />

                                            {search && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSearch("")
                                                    }
                                                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        {/* FILTERS */}

                                        <div
                                            className="admin-hidden-scrollbar flex gap-2 overflow-x-auto pb-1"
                                            style={{
                                                scrollbarWidth: "none",
                                                msOverflowStyle:
                                                    "none",
                                            }}
                                        >
                                            {FILTERS.map(
                                                (item) => {
                                                    const active =
                                                        filter ===
                                                        item.value;

                                                    const count =
                                                        item.value ===
                                                            "all"
                                                            ? stats.total
                                                            : stats[
                                                            item.value
                                                            ];

                                                    return (
                                                        <button
                                                            key={
                                                                item.value
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                setFilter(
                                                                    item.value
                                                                )
                                                            }
                                                            className="flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-[10px] font-black transition"
                                                            style={
                                                                active
                                                                    ? {
                                                                        borderColor:
                                                                            `${theme.accent}25`,
                                                                        backgroundColor:
                                                                            theme.accentSoft,
                                                                        color:
                                                                            theme.accent,
                                                                    }
                                                                    : {
                                                                        borderColor:
                                                                            "#E4E4E7",
                                                                        backgroundColor:
                                                                            "#FFFFFF",
                                                                        color:
                                                                            "#71717A",
                                                                    }
                                                            }
                                                        >
                                                            {item.label}

                                                            <span
                                                                className="rounded-full px-1.5 py-0.5 text-[9px]"
                                                                style={
                                                                    active
                                                                        ? {
                                                                            backgroundColor:
                                                                                `${theme.accent}12`,
                                                                        }
                                                                        : {
                                                                            backgroundColor:
                                                                                "#F4F4F5",
                                                                        }
                                                                }
                                                            >
                                                                {count}
                                                            </span>
                                                        </button>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>

                                    {/* LIST */}

                                    {filteredAnnouncements.length >
                                        0 ? (
                                        <div className="mt-5 space-y-3">
                                            <AnimatePresence
                                                initial={false}
                                            >
                                                {filteredAnnouncements.map(
                                                    (
                                                        announcement
                                                    ) => (
                                                        <AnnouncementCard
                                                            key={
                                                                announcement.id
                                                            }
                                                            announcement={
                                                                announcement
                                                            }
                                                            theme={theme}
                                                            onEdit={
                                                                handleEdit
                                                            }
                                                            onToggle={
                                                                handleToggleStatus
                                                            }
                                                            onDelete={
                                                                setDeleteTarget
                                                            }
                                                        />
                                                    )
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            search={search}
                                            filter={filter}
                                            theme={theme}
                                            onClear={() => {
                                                setSearch("");
                                                setFilter("all");
                                            }}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        </section>
                    )}

                    {/* =================================================
              DELETE DIALOG
          ================================================= */}

                    <AnimatePresence>
                        {deleteTarget && (
                            <DeleteAnnouncementDialog
                                announcement={
                                    deleteTarget
                                }
                                deleting={deleting}
                                onCancel={() => {
                                    if (!deleting) {
                                        setDeleteTarget(null);
                                    }
                                }}
                                onConfirm={
                                    handleDelete
                                }
                            />
                        )}
                    </AnimatePresence>
                </>
            )}
        </AdminLayout>
    );
}

// ===========================================================
// ANNOUNCEMENT CARD
// ===========================================================

function AnnouncementCard({
    announcement,
    theme,
    onEdit,
    onToggle,
    onDelete,
}) {
    const status =
        getAnnouncementStatus(announcement);

    const statusMeta =
        getStatusMeta(status);

    const typeMeta =
        getTypeMeta(announcement.type);

    const TypeIcon = typeMeta.icon;

    return (
        <motion.article
            layout
            initial={{
                opacity: 0,
                y: 6,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            exit={{
                opacity: 0,
                scale: 0.98,
            }}
            className="rounded-[18px] border border-zinc-200/90 bg-[#F8FAFC] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-[0_10px_24px_rgba(24,24,27,0.07)] sm:p-5"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                            style={{
                                borderColor:
                                    `${theme.accent}18`,
                                backgroundColor:
                                    theme.accentSoft,
                                color: theme.accent,
                            }}
                        >
                            <Megaphone size={16} />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${statusMeta.className}`}
                                >
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`}
                                    />

                                    {statusMeta.label}
                                </span>

                                <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${typeMeta.className}`}
                                >
                                    <TypeIcon size={10} />

                                    {typeMeta.label}
                                </span>
                            </div>

                            <h3 className="mt-2 break-words text-[15px] font-black leading-5 text-zinc-900">
                                {announcement.title}
                            </h3>
                        </div>
                    </div>

                    <Toggle
                        active={
                            announcement.is_active
                        }
                        theme={theme}
                        onClick={() =>
                            onToggle(announcement)
                        }
                    />
                </div>

                <p className="whitespace-pre-wrap break-words text-[12px] leading-5 text-zinc-600 sm:text-[13px]">
                    {announcement.message}
                </p>

                {/* SCHEDULE */}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ScheduleItem
                        label="Starts"
                        value={
                            announcement.start_at
                                ? formatDateTime(
                                    announcement.start_at
                                )
                                : "Immediately"
                        }
                    />

                    <ScheduleItem
                        label="Ends"
                        value={
                            announcement.end_at
                                ? formatDateTime(
                                    announcement.end_at
                                )
                                : "No expiry"
                        }
                    />
                </div>

                {/* FOOTER */}

                <div className="flex flex-col gap-3 border-t border-zinc-200/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[9px] font-medium text-zinc-400">
                        Updated{" "}
                        {formatDateTime(
                            announcement.updated_at ||
                            announcement.created_at
                        )}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                onEdit(announcement)
                            }
                            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 sm:flex-none"
                        >
                            <Edit3 size={12} />

                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onDelete(announcement)
                            }
                            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-[10px] font-black text-red-600 transition hover:border-red-300 hover:bg-red-100 sm:flex-none"
                        >
                            <Trash2 size={12} />

                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

// ===========================================================
// SCHEDULE ITEM
// ===========================================================

function ScheduleItem({
    label,
    value,
}) {
    return (
        <div className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-zinc-400">
                {label}
            </p>

            <p className="mt-1 text-[10px] font-bold leading-4 text-zinc-700">
                {value}
            </p>
        </div>
    );
}

// ===========================================================
// TOGGLE
// ===========================================================

function Toggle({
    active,
    theme,
    onClick,
}) {
    const Component =
        onClick ? "button" : "div";

    return (
        <Component
            {...(onClick
                ? {
                    type: "button",
                    onClick,
                    "aria-label": active
                        ? "Disable announcement"
                        : "Enable announcement",
                }
                : {})}
            className={`relative h-6 w-11 shrink-0 rounded-full border transition ${onClick
                    ? "cursor-pointer"
                    : "cursor-default"
                }`}
            style={{
                borderColor: active
                    ? `${theme.accent}40`
                    : "#D4D4D8",

                backgroundColor: active
                    ? theme.accent
                    : "#E4E4E7",
            }}
        >
            <span
                className={`absolute top-[2px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-sm transition-all ${active
                        ? "left-[20px]"
                        : "left-[2px]"
                    }`}
            >
                {active && (
                    <Check
                        size={10}
                        style={{
                            color: theme.accent,
                        }}
                    />
                )}
            </span>
        </Component>
    );
}

// ===========================================================
// STAT CARD
// ===========================================================

function StatCard({
    label,
    value,
    icon: Icon,
    theme,
    color,
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
            className="rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)] sm:p-5"
        >
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-zinc-500">
                    {label}
                </p>

                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                        borderColor: color
                            ? `${color}20`
                            : `${theme.accent}18`,

                        backgroundColor: color
                            ? `${color}0D`
                            : theme.accentSoft,

                        color:
                            color || theme.accent,
                    }}
                >
                    <Icon size={14} />
                </div>
            </div>

            <p
                className="mt-3 text-[28px] font-black tracking-[-0.04em] sm:text-[31px]"
                style={{
                    color:
                        color || "#18181B",
                }}
            >
                {value}
            </p>
        </motion.div>
    );
}

// ===========================================================
// SECTION HEADING
// ===========================================================

function SectionHeading({
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

            <div className="min-w-0">
                <h3 className="text-[15px] font-black text-zinc-900">
                    {title}
                </h3>

                <p className="mt-1 text-[11px] text-zinc-500 sm:text-[12px]">
                    {description}
                </p>
            </div>
        </div>
    );
}

// ===========================================================
// FIELD LABEL
// ===========================================================

function FieldLabel({
    label,
    required = false,
}) {
    return (
        <label className="flex items-center gap-1 text-[12px] font-bold text-zinc-700">
            {label}

            {required && (
                <span className="text-red-500">
                    *
                </span>
            )}
        </label>
    );
}

// ===========================================================
// EMPTY STATE
// ===========================================================

function EmptyState({
    search,
    filter,
    theme,
    onClear,
}) {
    const filtered =
        Boolean(search) ||
        filter !== "all";

    return (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-5 py-14 text-center">
            <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{
                    borderColor:
                        `${theme.accent}18`,
                    backgroundColor:
                        theme.accentSoft,
                    color: theme.accent,
                }}
            >
                <Megaphone size={19} />
            </div>

            <h3 className="mt-4 text-[14px] font-black text-zinc-800">
                {filtered
                    ? "No matching announcements"
                    : "No announcements yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-zinc-500">
                {filtered
                    ? "Try changing your search or status filter."
                    : "Create your first announcement to communicate with QUIZTIANS participants."}
            </p>

            {filtered && (
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-4 rounded-xl border px-3.5 py-2 text-[10px] font-black transition hover:-translate-y-0.5"
                    style={{
                        borderColor:
                            `${theme.accent}20`,
                        backgroundColor:
                            theme.accentSoft,
                        color: theme.accent,
                    }}
                >
                    Clear Filters
                </button>
            )}
        </div>
    );
}

// ===========================================================
// ERROR STATE
// ===========================================================

function ErrorState({
    message,
    onRetry,
    theme,
}) {
    return (
        <div className="mt-4 rounded-[22px] border border-red-200 bg-white px-5 py-16 text-center shadow-[0_8px_24px_rgba(24,24,27,0.06)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200 bg-red-50">
                <X
                    size={22}
                    className="text-red-500"
                />
            </div>

            <h3 className="mt-5 text-[18px] font-black text-zinc-900">
                Unable to load announcements
            </h3>

            <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-zinc-500">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-black shadow-sm transition hover:-translate-y-0.5"
                style={{
                    borderColor:
                        `${theme.accent}20`,
                    backgroundColor:
                        theme.accentSoft,
                    color: theme.accent,
                }}
            >
                <RefreshCw size={14} />

                Try Again
            </button>
        </div>
    );
}

// ===========================================================
// LOADING
// ===========================================================

function AnnouncementLoading() {
    return (
        <>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map(
                    (item) => (
                        <div
                            key={item}
                            className="rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.05)] sm:p-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-3 w-16 animate-pulse rounded-full bg-zinc-100" />

                                <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-100" />
                            </div>

                            <div className="mt-4 h-8 w-12 animate-pulse rounded-lg bg-zinc-100" />
                        </div>
                    )
                )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <div className="h-[680px] animate-pulse rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.05)]" />

                <div className="h-[680px] animate-pulse rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.05)]" />
            </div>
        </>
    );
}

// ===========================================================
// DELETE DIALOG — PREMIUM DARK
// ===========================================================

function DeleteAnnouncementDialog({
    announcement,
    deleting,
    onCancel,
    onConfirm,
}) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (
                event.key === "Escape" &&
                !deleting
            ) {
                onCancel();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [deleting, onCancel]);

    return (
        <motion.div
            initial={{
                opacity: 0,
            }}
            animate={{
                opacity: 1,
            }}
            exit={{
                opacity: 0,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !deleting
                ) {
                    onCancel();
                }
            }}
        >
            <motion.div
                initial={{
                    opacity: 0,
                    scale: 0.96,
                    y: 10,
                }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                }}
                exit={{
                    opacity: 0,
                    scale: 0.96,
                    y: 10,
                }}
                transition={{
                    duration: 0.18,
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-announcement-title"
                className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-[#111113] shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
            >
                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                            <Trash2 size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-400">
                                Destructive Action
                            </p>

                            <h3
                                id="delete-announcement-title"
                                className="mt-2 text-[19px] font-black tracking-[-0.02em] text-white"
                            >
                                Delete announcement?
                            </h3>

                            <p className="mt-2 text-[12px] leading-5 text-zinc-400">
                                This announcement will be
                                permanently removed. This
                                action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">
                            Announcement
                        </p>

                        <p className="mt-2 break-words text-[13px] font-black text-zinc-100">
                            {announcement.title}
                        </p>

                        <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-zinc-400">
                            {announcement.message}
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={deleting}
                            onClick={onCancel}
                            className="flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[12px] font-black text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={deleting}
                            onClick={onConfirm}
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500 px-4 text-[12px] font-black text-white shadow-[0_10px_30px_rgba(239,68,68,0.2)] transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                </div>
            </motion.div>
        </motion.div>
    );
}

// ===========================================================
// LOADING SPINNER
// ===========================================================

function LoadingSpinner() {
    return (
        <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-20"
            />

            <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}