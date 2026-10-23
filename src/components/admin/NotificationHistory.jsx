import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    motion,
} from "framer-motion";

import {
    AlertCircle,
    Bell,
    CheckCircle2,
    Clock3,
    Home,
    Inbox,
    Loader2,
    RefreshCw,
    Send,
    Smartphone,
    Trophy,
    User,
    Users,
} from "lucide-react";

import {
    supabase,
} from "../../supabaseClient";

// ===========================================================
// CONSTANTS
// ===========================================================

const PAGE_SIZE = 10;

const DESTINATION_META = {
    home: {
        label: "Home",
        icon: Home,
    },

    join: {
        label: "Join Quiz",
        icon: Users,
    },

    leaderboard: {
        label: "Leaderboard",
        icon: Trophy,
    },
};

// ===========================================================
// HELPERS
// ===========================================================

function formatDateTime(value) {
    if (!value) {
        return "Unknown time";
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown time";
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }
    ).format(date);
}

function getDestinationMeta(
    screen
) {
    return (
        DESTINATION_META[
        screen
        ] ||
        DESTINATION_META.home
    );
}

// ===========================================================
// COMPONENT
// ===========================================================

export default function NotificationHistory({
    theme,
    refreshKey = 0,
}) {
    const [
        notifications,
        setNotifications,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        loadingMore,
        setLoadingMore,
    ] = useState(false);

    const [
        hasMore,
        setHasMore,
    ] = useState(false);

    const [
        historyError,
        setHistoryError,
    ] = useState("");

    // =======================================================
    // FETCH
    // =======================================================

    const fetchHistory =
        useCallback(
            async ({
                reset = true,
                manual = false,
            } = {}) => {
                if (reset) {
                    if (manual) {
                        setRefreshing(
                            true
                        );
                    } else {
                        setLoading(
                            true
                        );
                    }
                } else {
                    setLoadingMore(
                        true
                    );
                }

                setHistoryError("");

                try {
                    const from =
                        reset
                            ? 0
                            : notifications.length;

                    const to =
                        from +
                        PAGE_SIZE -
                        1;

                    const {
                        data,
                        error,
                    } =
                        await supabase
                            .from(
                                "notification_history"
                            )
                            .select(
                                `
                                    id,
                                    title,
                                    body,
                                    screen,
                                    type,
                                    chapter,
                                    sent_by,
                                    sender_email,
                                    sender_role,
                                    recipients,
                                    status,
                                    error_message,
                                    created_at
                                `
                            )
                            .order(
                                "created_at",
                                {
                                    ascending:
                                        false,
                                }
                            )
                            .range(
                                from,
                                to
                            );

                    if (error) {
                        throw error;
                    }

                    const rows =
                        data ?? [];

                    if (reset) {
                        setNotifications(
                            rows
                        );
                    } else {
                        setNotifications(
                            (
                                current
                            ) => [
                                    ...current,
                                    ...rows,
                                ]
                        );
                    }

                    setHasMore(
                        rows.length ===
                        PAGE_SIZE
                    );
                } catch (
                fetchError
                ) {
                    console.error(
                        "Unable to load notification history:",
                        fetchError
                    );

                    setHistoryError(
                        fetchError
                            ?.message ||
                        "Unable to load notification history."
                    );
                } finally {
                    setLoading(
                        false
                    );

                    setRefreshing(
                        false
                    );

                    setLoadingMore(
                        false
                    );
                }
            },
            [
                notifications.length,
            ]
        );

    // =======================================================
    // INITIAL / AUTO REFRESH
    // =======================================================

    useEffect(() => {
        fetchHistory({
            reset: true,
        });
    }, [refreshKey]);

    // =======================================================
    // UI
    // =======================================================

    return (
        <motion.section
            initial={{
                opacity: 0,
                y: 10,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                delay: 0.14,
            }}
            className="mt-4 overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]"
        >
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col gap-4 border-b border-zinc-200 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                        style={{
                            borderColor:
                                `${theme.accent}20`,

                            backgroundColor:
                                theme.accentSoft,
                        }}
                    >
                        <Clock3
                            size={17}
                            strokeWidth={
                                1.8
                            }
                            style={{
                                color:
                                    theme.accent,
                            }}
                        />
                    </div>

                    <div>
                        <h3 className="text-[15px] font-black text-zinc-900">
                            Notification
                            History
                        </h3>

                        <p className="mt-1 text-[11px] text-zinc-500">
                            Recent
                            broadcasts sent
                            from QUIZTIANS
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    disabled={
                        refreshing ||
                        loading
                    }
                    onClick={() =>
                        fetchHistory({
                            reset: true,
                            manual: true,
                        })
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[11px] font-black text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    <RefreshCw
                        size={14}
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="p-4 sm:p-5 lg:p-6">
                {loading ? (
                    <HistorySkeleton />
                ) : historyError ? (
                    <HistoryError
                        message={
                            historyError
                        }
                        onRetry={() =>
                            fetchHistory({
                                reset: true,
                            })
                        }
                    />
                ) : notifications.length ===
                    0 ? (
                    <EmptyHistory
                        theme={
                            theme
                        }
                    />
                ) : (
                    <>
                        <div className="space-y-3">
                            {notifications.map(
                                (
                                    notification,
                                    index
                                ) => (
                                    <HistoryItem
                                        key={
                                            notification.id
                                        }
                                        notification={
                                            notification
                                        }
                                        theme={
                                            theme
                                        }
                                        index={
                                            index
                                        }
                                    />
                                )
                            )}
                        </div>

                        {hasMore && (
                            <div className="mt-5 flex justify-center border-t border-zinc-100 pt-5">
                                <button
                                    type="button"
                                    disabled={
                                        loadingMore
                                    }
                                    onClick={() =>
                                        fetchHistory(
                                            {
                                                reset: false,
                                            }
                                        )
                                    }
                                    className="flex min-w-[150px] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-[11px] font-black text-zinc-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2
                                                size={
                                                    14
                                                }
                                                className="animate-spin"
                                            />

                                            Loading...
                                        </>
                                    ) : (
                                        "Load More"
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.section>
    );
}

// ===========================================================
// HISTORY ITEM
// ===========================================================

function HistoryItem({
    notification,
    theme,
    index,
}) {
    const destination =
        getDestinationMeta(
            notification.screen
        );

    const DestinationIcon =
        destination.icon;

    const isSent =
        notification.status ===
        "sent";

    const recipients =
        Number(
            notification.recipients
        ) || 0;

    return (
        <motion.article
            initial={{
                opacity: 0,
                y: 8,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                delay:
                    Math.min(
                        index,
                        5
                    ) * 0.035,
            }}
            className="group rounded-[18px] border border-zinc-200 bg-[#FCFCFD] p-4 transition hover:border-zinc-300 hover:bg-white hover:shadow-sm sm:p-5"
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* CONTENT */}

                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white"
                            style={{
                                borderColor:
                                    `${theme.accent}20`,
                            }}
                        >
                            <Bell
                                size={
                                    17
                                }
                                style={{
                                    color:
                                        theme.accent,
                                }}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start gap-2">
                                <h4 className="break-words text-[13px] font-black leading-5 text-zinc-900 sm:text-[14px]">
                                    {notification.title ||
                                        "QUIZTIANS"}
                                </h4>

                                <StatusBadge
                                    sent={
                                        isSent
                                    }
                                />
                            </div>

                            <p className="mt-2 max-w-3xl break-words text-[11px] leading-5 text-zinc-500 sm:text-[12px]">
                                {notification.body}
                            </p>

                            {notification.chapter && (
                                <p className="mt-2 text-[10px] font-bold text-zinc-400">
                                    Chapter:{" "}
                                    {
                                        notification.chapter
                                    }
                                </p>
                            )}
                        </div>
                    </div>

                    {/* META */}

                    <div className="mt-4 flex flex-wrap gap-2">
                        <MetaBadge
                            icon={
                                DestinationIcon
                            }
                            label={
                                destination.label
                            }
                        />

                        <MetaBadge
                            icon={
                                Smartphone
                            }
                            label={`${recipients} ${recipients ===
                                    1
                                    ? "device"
                                    : "devices"
                                }`}
                        />

                        <MetaBadge
                            icon={
                                User
                            }
                            label={
                                notification.sender_email ||
                                "Administrator"
                            }
                        />

                        <MetaBadge
                            icon={
                                Clock3
                            }
                            label={formatDateTime(
                                notification.created_at
                            )}
                        />
                    </div>

                    {/* FAILURE */}

                    {!isSent &&
                        notification.error_message && (
                            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                                <AlertCircle
                                    size={
                                        14
                                    }
                                    className="mt-0.5 shrink-0 text-red-500"
                                />

                                <p className="text-[10px] leading-5 text-red-600">
                                    {
                                        notification.error_message
                                    }
                                </p>
                            </div>
                        )}
                </div>

                {/* ROLE */}

                <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-end">
                    <span
                        className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em]"
                        style={{
                            color:
                                theme.accent,

                            backgroundColor:
                                theme.accentSoft,
                        }}
                    >
                        {notification.sender_role ===
                            "superadmin"
                            ? "Super Admin"
                            : "Admin"}
                    </span>

                    {notification.type && (
                        <span className="text-[9px] font-semibold text-zinc-400">
                            {
                                notification.type
                            }
                        </span>
                    )}
                </div>
            </div>
        </motion.article>
    );
}

// ===========================================================
// STATUS BADGE
// ===========================================================

function StatusBadge({
    sent,
}) {
    return sent ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700">
            <CheckCircle2
                size={11}
            />

            Sent
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-red-600">
            <AlertCircle
                size={11}
            />

            Failed
        </span>
    );
}

// ===========================================================
// META BADGE
// ===========================================================

function MetaBadge({
    icon: Icon,
    label,
}) {
    return (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-zinc-500">
            <Icon
                size={11}
                className="shrink-0"
            />

            <span className="truncate">
                {label}
            </span>
        </span>
    );
}

// ===========================================================
// LOADING
// ===========================================================

function HistorySkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({
                length: 3,
            }).map(
                (_, index) => (
                    <div
                        key={
                            index
                        }
                        className="animate-pulse rounded-[18px] border border-zinc-200 bg-zinc-50 p-4 sm:p-5"
                    >
                        <div className="flex gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-200" />

                            <div className="flex-1">
                                <div className="h-3.5 w-2/5 rounded bg-zinc-200" />

                                <div className="mt-3 h-2.5 w-full rounded bg-zinc-200" />

                                <div className="mt-2 h-2.5 w-3/4 rounded bg-zinc-200" />

                                <div className="mt-4 flex gap-2">
                                    <div className="h-6 w-20 rounded-lg bg-zinc-200" />
                                    <div className="h-6 w-24 rounded-lg bg-zinc-200" />
                                    <div className="h-6 w-32 rounded-lg bg-zinc-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

// ===========================================================
// EMPTY
// ===========================================================

function EmptyHistory({
    theme,
}) {
    return (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-10 text-center">
            <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                    backgroundColor:
                        theme.accentSoft,
                }}
            >
                <Inbox
                    size={23}
                    strokeWidth={
                        1.7
                    }
                    style={{
                        color:
                            theme.accent,
                    }}
                />
            </div>

            <h4 className="mt-4 text-[14px] font-black text-zinc-800">
                No notifications
                yet
            </h4>

            <p className="mt-2 max-w-[320px] text-[11px] leading-5 text-zinc-500">
                Notifications sent
                from the QUIZTIANS
                admin panel will
                appear here.
            </p>
        </div>
    );
}

// ===========================================================
// ERROR
// ===========================================================

function HistoryError({
    message,
    onRetry,
}) {
    return (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[18px] border border-red-200 bg-red-50/60 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertCircle
                    size={21}
                />
            </div>

            <h4 className="mt-4 text-[13px] font-black text-red-700">
                Unable to load
                history
            </h4>

            <p className="mt-2 max-w-[360px] text-[10px] leading-5 text-red-600/80">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[10px] font-black text-red-600 transition hover:bg-red-50"
            >
                <RefreshCw
                    size={13}
                />

                Try Again
            </button>
        </div>
    );
}