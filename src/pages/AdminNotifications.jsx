import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    Bell,
    Check,
    CheckCircle2,
    Clock3,
    Home,
    Loader2,
    Megaphone,
    PenLine,
    Rocket,
    Send,
    Smartphone,
    Sparkles,
    Trophy,
    Users,
    X,
} from "lucide-react";

import AdminLayout from "../components/admin/AdminLayout";

import {
    sendPushNotification,
} from "../services/notificationService";

import NotificationHistory from "../components/admin/NotificationHistory";

// ===========================================================
// CONSTANTS
// ===========================================================

const DESTINATIONS = [
    {
        id: "home",
        label: "Home",
        description:
            "Open the QUIZTIANS home screen.",
        icon: Home,
    },
    {
        id: "join",
        label: "Join Quiz",
        description:
            "Take participants directly to Join Quiz.",
        icon: Users,
    },
    {
        id: "leaderboard",
        label: "Leaderboard",
        description:
            "Open the latest leaderboard.",
        icon: Trophy,
    },
];

const NOTIFICATION_TEMPLATES = [
    {
        id: "quiz-live",
        label: "Quiz is Live",
        shortLabel: "Live",
        description:
            "Tell participants the challenge is now open.",
        icon: Rocket,
        title:
            "🚀 QUIZTIANS Quiz is LIVE!",
        message:
            "The challenge is now open! Tap to join the quiz and test your knowledge. All the best! 🔥",
        destination: "join",
    },
    {
        id: "starting-soon",
        label: "Starting Soon",
        shortLabel: "Soon",
        description:
            "Remind participants to get ready for the quiz.",
        icon: Clock3,
        title:
            "⏰ Quiz Starting Soon!",
        message:
            "Get ready! The next QUIZTIANS challenge is starting soon. Tap to prepare for the quiz.",
        destination: "join",
    },
    {
        id: "leaderboard-updated",
        label: "Leaderboard Updated",
        shortLabel: "Results",
        description:
            "Let everyone know the latest rankings are ready.",
        icon: Trophy,
        title:
            "🏆 Leaderboard Updated!",
        message:
            "The latest QUIZTIANS leaderboard is ready. Tap to see who is leading the challenge!",
        destination:
            "leaderboard",
    },
    {
        id: "general-update",
        label: "General Update",
        shortLabel: "Update",
        description:
            "Create a general QUIZTIANS announcement.",
        icon: Megaphone,
        title:
            "📢 QUIZTIANS Update",
        message: "",
        destination: "home",
    },
    {
        id: "custom",
        label: "Custom",
        shortLabel: "Custom",
        description:
            "Start with an empty notification.",
        icon: PenLine,
        title: "",
        message: "",
        destination: "home",
    },
];

const TITLE_LIMIT = 120;
const MESSAGE_LIMIT = 500;

// ===========================================================
// PAGE
// ===========================================================

export default function AdminNotifications() {
    return (
        <AdminLayout>
            {({
                user,
                theme,
                isSuperAdmin,
            }) => (
                <NotificationContent
                    user={user}
                    theme={theme}
                    isSuperAdmin={
                        isSuperAdmin
                    }
                />
            )}
        </AdminLayout>
    );
}

// ===========================================================
// CONTENT
// ===========================================================

function NotificationContent({
    user,
    theme,
    isSuperAdmin,
}) {
    const [title, setTitle] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [
        destination,
        setDestination,
    ] = useState("home");

    const [
        selectedTemplate,
        setSelectedTemplate,
    ] = useState("custom");

    const [sending, setSending] =
        useState(false);

    const [result, setResult] =
        useState(null);

    const [error, setError] =
        useState("");

    const [
        confirmModalOpen,
        setConfirmModalOpen,
    ] = useState(false);

    const [
        successModalOpen,
        setSuccessModalOpen,
    ] = useState(false);

    const [
        historyRefreshKey,
        setHistoryRefreshKey,
    ] = useState(0);

    // =======================================================
    // SELECTED DESTINATION
    // =======================================================

    const selectedDestination =
        useMemo(() => {
            return (
                DESTINATIONS.find(
                    (item) =>
                        item.id ===
                        destination
                ) ||
                DESTINATIONS[0]
            );
        }, [destination]);

    const SelectedDestinationIcon =
        selectedDestination.icon;

    // =======================================================
    // SEND STATE
    // =======================================================

    const canSend =
        message.trim().length > 0 &&
        !sending;

    // =======================================================
    // TEMPLATE SELECT
    // =======================================================

    const handleTemplateSelect = (
        template
    ) => {
        setSelectedTemplate(
            template.id
        );

        setTitle(
            template.title
        );

        setMessage(
            template.message
        );

        setDestination(
            template.destination
        );

        setError("");
        setResult(null);
    };

    // =======================================================
    // MANUAL EDIT
    // =======================================================

    const markAsCustom = () => {
        setSelectedTemplate(
            "custom"
        );

        setResult(null);
        setError("");
    };

    // =======================================================
    // OPEN CONFIRMATION MODAL
    // =======================================================

    const handleSendClick = () => {
        const cleanMessage =
            message.trim();

        if (!cleanMessage) {
            setError(
                "Enter a notification message."
            );

            return;
        }

        setError("");
        setResult(null);

        setConfirmModalOpen(
            true
        );
    };

    // =======================================================
    // CONFIRM + SEND
    // =======================================================

    const handleConfirmSend =
        async () => {
            if (sending) {
                return;
            }

            const cleanTitle =
                title.trim() ||
                "QUIZTIANS";

            const cleanMessage =
                message.trim();

            if (!cleanMessage) {
                setConfirmModalOpen(
                    false
                );

                setError(
                    "Enter a notification message."
                );

                return;
            }

            setSending(true);
            setError("");
            setResult(null);

            try {
                const response =
                    await sendPushNotification({
                        title:
                            cleanTitle,

                        body:
                            cleanMessage,

                        screen:
                            destination,

                        type:
                            "admin_broadcast",
                    });

                setResult(response);

                setHistoryRefreshKey(
                    (current) =>
                        current + 1
                );

                setConfirmModalOpen(
                    false
                );

                setSuccessModalOpen(
                    true
                );

                // Reset composer
                setTitle("");
                setMessage("");
                setDestination(
                    "home"
                );
                setSelectedTemplate(
                    "custom"
                );
            } catch (sendError) {
                console.error(
                    "Push notification failed:",
                    sendError
                );

                setConfirmModalOpen(
                    false
                );

                setError(
                    sendError?.message ||
                    "Unable to send notification."
                );
            } finally {
                setSending(false);
            }
        };

    // =======================================================
    // CLOSE CONFIRMATION
    // =======================================================

    const handleCloseConfirm =
        () => {
            if (sending) {
                return;
            }

            setConfirmModalOpen(
                false
            );
        };

    // =======================================================
    // UI
    // =======================================================

    return (
        <>
            {/* =================================================
                HERO
            ================================================= */}

            <motion.section
                initial={{
                    opacity: 0,
                    y: 12,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                className="relative overflow-hidden rounded-[24px] border border-zinc-200/90 bg-white p-5 shadow-[0_10px_30px_rgba(24,24,27,0.07)] sm:p-7 lg:p-8"
            >
                <div
                    className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[100px]"
                    style={{
                        backgroundColor:
                            `${theme.accent}10`,
                    }}
                />

                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
                        backgroundSize:
                            "34px 34px",
                    }}
                />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Bell
                                size={14}
                                style={{
                                    color:
                                        theme.accent,
                                }}
                            />

                            <p
                                className="text-[11px] font-black uppercase tracking-[0.15em]"
                                style={{
                                    color:
                                        theme.accent,
                                }}
                            >
                                Mobile
                                Communication
                            </p>
                        </div>

                        <h2 className="mt-3 text-[27px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[32px] lg:text-[36px]">
                            Push
                            Notifications
                        </h2>

                        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
                            Send important
                            updates directly
                            to active
                            QUIZTIANS mobile
                            devices.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white">
                            <Smartphone
                                size={18}
                                className="text-emerald-600"
                            />

                            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                        </div>

                        <div>
                            <p className="text-[12px] font-black text-emerald-800">
                                Push service
                                ready
                            </p>

                            <p className="mt-1 text-[10px] text-emerald-600">
                                Secure admin
                                delivery
                            </p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* =================================================
                QUICK TEMPLATES
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
                transition={{
                    delay: 0.04,
                }}
                className="mt-5 rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.06)] sm:p-5 lg:mt-6 lg:p-6"
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <SectionHeading
                        icon={
                            Sparkles
                        }
                        title="Quick Templates"
                        description="Start with a ready-made notification"
                        theme={theme}
                    />

                    <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
                            Select • Edit
                            • Send
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {NOTIFICATION_TEMPLATES.map(
                        (template) => {
                            const Icon =
                                template.icon;

                            const active =
                                selectedTemplate ===
                                template.id;

                            return (
                                <button
                                    key={
                                        template.id
                                    }
                                    type="button"
                                    onClick={() =>
                                        handleTemplateSelect(
                                            template
                                        )
                                    }
                                    className="group relative overflow-hidden rounded-[18px] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                    style={{
                                        borderColor:
                                            active
                                                ? `${theme.accent}55`
                                                : "#E4E4E7",

                                        backgroundColor:
                                            active
                                                ? theme.accentSoft
                                                : "#FAFAFA",
                                    }}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="active-template"
                                            className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                                            style={{
                                                backgroundColor:
                                                    theme.accent,
                                            }}
                                        >
                                            <Check
                                                size={
                                                    11
                                                }
                                                className="text-white"
                                            />
                                        </motion.div>
                                    )}

                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition group-hover:scale-105"
                                        style={{
                                            borderColor:
                                                active
                                                    ? `${theme.accent}25`
                                                    : "#E4E4E7",

                                            color:
                                                active
                                                    ? theme.accent
                                                    : "#52525B",
                                        }}
                                    >
                                        <Icon
                                            size={
                                                17
                                            }
                                            strokeWidth={
                                                1.9
                                            }
                                        />
                                    </div>

                                    <p className="mt-3 pr-5 text-[12px] font-black text-zinc-900">
                                        {
                                            template.label
                                        }
                                    </p>

                                    <p className="mt-1.5 text-[10px] leading-4 text-zinc-500">
                                        {
                                            template.description
                                        }
                                    </p>

                                    <div className="mt-3 flex items-center gap-1.5">
                                        <span
                                            className="h-1.5 w-1.5 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    active
                                                        ? theme.accent
                                                        : "#A1A1AA",
                                            }}
                                        />

                                        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-zinc-400">
                                            {
                                                template.shortLabel
                                            }
                                        </span>
                                    </div>
                                </button>
                            );
                        }
                    )}
                </div>
            </motion.section>

            {/* =================================================
                MAIN GRID
            ================================================= */}

            <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">

                {/* =============================================
                    COMPOSER
                ============================================= */}

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 10,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.08,
                    }}
                    className="rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6"
                >
                    <div className="flex items-start justify-between gap-4">
                        <SectionHeading
                            icon={Bell}
                            title="Create Notification"
                            description="Compose your mobile broadcast"
                            theme={
                                theme
                            }
                        />

                        {selectedTemplate !==
                            "custom" && (
                                <div
                                    className="hidden rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] sm:block"
                                    style={{
                                        color:
                                            theme.accent,
                                        backgroundColor:
                                            theme.accentSoft,
                                    }}
                                >
                                    Template
                                    applied
                                </div>
                            )}
                    </div>

                    {/* TITLE */}

                    <div className="mt-6">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500">
                                Title
                            </label>

                            <span className="text-[10px] font-semibold text-zinc-400">
                                {
                                    title.length
                                }
                                /
                                {
                                    TITLE_LIMIT
                                }
                            </span>
                        </div>

                        <input
                            type="text"
                            value={title}
                            maxLength={
                                TITLE_LIMIT
                            }
                            onChange={(
                                event
                            ) => {
                                setTitle(
                                    event
                                        .target
                                        .value
                                );

                                markAsCustom();
                            }}
                            placeholder="QUIZTIANS"
                            className="mt-2.5 w-full rounded-2xl border border-zinc-200 bg-[#F8FAFC] px-4 py-3.5 text-[13px] font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
                        />
                    </div>

                    {/* MESSAGE */}

                    <div className="mt-5">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500">
                                Message
                            </label>

                            <span className="text-[10px] font-semibold text-zinc-400">
                                {
                                    message.length
                                }
                                /
                                {
                                    MESSAGE_LIMIT
                                }
                            </span>
                        </div>

                        <textarea
                            value={message}
                            maxLength={
                                MESSAGE_LIMIT
                            }
                            rows={6}
                            onChange={(
                                event
                            ) => {
                                setMessage(
                                    event
                                        .target
                                        .value
                                );

                                markAsCustom();
                            }}
                            placeholder="Write your notification message..."
                            className="mt-2.5 w-full resize-none rounded-2xl border border-zinc-200 bg-[#F8FAFC] px-4 py-3.5 text-[13px] leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
                        />

                        {selectedTemplate ===
                            "general-update" && (
                                <p className="mt-2 text-[10px] leading-5 text-zinc-400">
                                    General
                                    Update gives
                                    you a ready
                                    title. Add
                                    your own
                                    announcement
                                    message
                                    before
                                    sending.
                                </p>
                            )}
                    </div>

                    {/* DESTINATION */}

                    <div className="mt-6">
                        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500">
                            Opens
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-400">
                            Choose where the
                            participant goes
                            after tapping the
                            notification.
                        </p>

                        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                            {DESTINATIONS.map(
                                (item) => {
                                    const Icon =
                                        item.icon;

                                    const active =
                                        destination ===
                                        item.id;

                                    return (
                                        <button
                                            key={
                                                item.id
                                            }
                                            type="button"
                                            onClick={() => {
                                                setDestination(
                                                    item.id
                                                );

                                                markAsCustom();
                                            }}
                                            className="rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5"
                                            style={{
                                                borderColor:
                                                    active
                                                        ? `${theme.accent}55`
                                                        : "#E4E4E7",

                                                backgroundColor:
                                                    active
                                                        ? theme.accentSoft
                                                        : "#F8FAFC",
                                            }}
                                        >
                                            <div
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border bg-white"
                                                style={{
                                                    borderColor:
                                                        active
                                                            ? `${theme.accent}30`
                                                            : "#E4E4E7",
                                                }}
                                            >
                                                <Icon
                                                    size={
                                                        16
                                                    }
                                                    strokeWidth={
                                                        active
                                                            ? 2.2
                                                            : 1.8
                                                    }
                                                    style={{
                                                        color:
                                                            active
                                                                ? theme.accent
                                                                : "#52525B",
                                                    }}
                                                />
                                            </div>

                                            <p className="mt-3 text-[12px] font-black text-zinc-800">
                                                {
                                                    item.label
                                                }
                                            </p>

                                            <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                                                {
                                                    item.description
                                                }
                                            </p>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
                            <p className="text-[12px] font-bold text-red-600">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* SEND */}

                    <div className="mt-6 border-t border-zinc-200 pt-5">
                        <button
                            type="button"
                            disabled={
                                !canSend
                            }
                            onClick={
                                handleSendClick
                            }
                            className="flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-[12px] font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:w-auto sm:min-w-[220px]"
                            style={{
                                backgroundColor:
                                    theme.accent,
                            }}
                        >
                            <Send
                                size={15}
                            />

                            Send
                            Notification
                        </button>
                    </div>
                </motion.div>

                {/* =============================================
                    MOBILE PREVIEW
                ============================================= */}

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 10,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.12,
                    }}
                    className="rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6"
                >
                    <SectionHeading
                        icon={
                            Smartphone
                        }
                        title="Mobile Preview"
                        description="Approximate notification appearance"
                        theme={theme}
                    />

                    {/* PHONE */}

                    <div className="mt-6 rounded-[28px] border border-zinc-800 bg-[#111827] p-3 shadow-[0_18px_45px_rgba(24,24,27,0.15)] sm:p-4">
                        <div className="rounded-[21px] bg-[#050816] px-4 py-5">
                            <NotificationPreview
                                title={
                                    title.trim() ||
                                    "QUIZTIANS"
                                }
                                message={
                                    message.trim() ||
                                    "Your notification message will appear here."
                                }
                                theme={
                                    theme
                                }
                            />
                        </div>
                    </div>

                    {/* DESTINATION */}

                    <div className="mt-5 rounded-2xl border border-zinc-200 bg-[#F8FAFC] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                            Tap Destination
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white"
                                style={{
                                    borderColor:
                                        `${theme.accent}25`,
                                }}
                            >
                                <SelectedDestinationIcon
                                    size={17}
                                    strokeWidth={
                                        1.9
                                    }
                                    style={{
                                        color:
                                            theme.accent,
                                    }}
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[12px] font-black text-zinc-800">
                                    {
                                        selectedDestination.label
                                    }
                                </p>

                                <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                                    {
                                        selectedDestination.description
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SENDER */}

                    <div className="mt-4 rounded-2xl border border-zinc-200 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                            Authorized Sender
                        </p>

                        <p className="mt-2 truncate text-[12px] font-bold text-zinc-800">
                            {user?.email ||
                                "Administrator"}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-500">
                            {isSuperAdmin
                                ? "Super Administrator"
                                : "Administrator"}
                        </p>
                    </div>

                    {/* DELIVERY NOTE */}

                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5">
                        <div className="flex items-start gap-3">
                            <Bell
                                size={15}
                                className="mt-0.5 shrink-0 text-zinc-400"
                            />

                            <p className="text-[10px] leading-5 text-zinc-500">
                                This broadcast
                                will be sent to
                                all currently
                                active
                                QUIZTIANS push
                                notification
                                devices.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* =================================================
                NOTIFICATION HISTORY
            ================================================= */}

            <NotificationHistory
                theme={theme}
                refreshKey={
                    historyRefreshKey
                }
            />

            {/* =================================================
                CONFIRMATION MODAL
            ================================================= */}

            <ConfirmationModal
                open={
                    confirmModalOpen
                }
                title={
                    title.trim() ||
                    "QUIZTIANS"
                }
                message={
                    message.trim()
                }
                destination={
                    selectedDestination
                }
                theme={theme}
                sending={sending}
                onClose={
                    handleCloseConfirm
                }
                onConfirm={
                    handleConfirmSend
                }
            />

            {/* =================================================
                SUCCESS MODAL
            ================================================= */}

            <SuccessModal
                open={
                    successModalOpen
                }
                recipients={
                    result?.recipients ??
                    0
                }
                theme={theme}
                onClose={() =>
                    setSuccessModalOpen(
                        false
                    )
                }
            />
        </>
    );
}

// ===========================================================
// NOTIFICATION PREVIEW
// ===========================================================

function NotificationPreview({
    title,
    message,
    theme,
}) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-lg backdrop-blur-xl">
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                    backgroundColor:
                        theme.accent,
                }}
            >
                <Bell
                    size={18}
                    className="text-white"
                />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
                        QUIZTIANS
                    </p>

                    <span className="shrink-0 text-[9px] text-white/40">
                        now
                    </span>
                </div>

                <h4 className="mt-2 break-words text-[13px] font-black leading-5 text-white">
                    {title}
                </h4>

                <p className="mt-1.5 break-words text-[11px] leading-5 text-white/65">
                    {message}
                </p>
            </div>
        </div>
    );
}

// ===========================================================
// CONFIRMATION MODAL
// ===========================================================

function ConfirmationModal({
    open,
    title,
    message,
    destination,
    theme,
    sending,
    onClose,
    onConfirm,
}) {
    const DestinationIcon =
        destination.icon;

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (
            event
        ) => {
            if (
                event.key ===
                "Escape" &&
                !sending
            ) {
                onClose();
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
    }, [
        open,
        sending,
        onClose,
    ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style
                .overflow;

        document.body.style.overflow =
            "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
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
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
                >
                    {/* BACKDROP */}

                    <motion.button
                        type="button"
                        aria-label="Close confirmation"
                        onClick={
                            onClose
                        }
                        disabled={
                            sending
                        }
                        className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
                    />

                    {/* MODAL */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 18,
                            scale: 0.97,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 10,
                            scale: 0.98,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 28,
                        }}
                        className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.25)]"
                    >
                        {/* HEADER */}

                        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-5 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                                    style={{
                                        color:
                                            theme.accent,

                                        borderColor:
                                            `${theme.accent}25`,

                                        backgroundColor:
                                            theme.accentSoft,
                                    }}
                                >
                                    <Bell
                                        size={
                                            19
                                        }
                                    />
                                </div>

                                <div>
                                    <h3 className="text-[16px] font-black text-zinc-900">
                                        Send
                                        Notification?
                                    </h3>

                                    <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                                        Review
                                        your
                                        broadcast
                                        before
                                        sending.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    sending
                                }
                                aria-label="Close"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <X
                                    size={
                                        16
                                    }
                                />
                            </button>
                        </div>

                        {/* CONTENT */}

                        <div className="max-h-[65vh] overflow-y-auto px-5 py-5 sm:px-6">
                            <p className="text-[12px] leading-6 text-zinc-600">
                                You're
                                about to
                                send this
                                notification
                                to all
                                currently
                                active
                                QUIZTIANS
                                devices.
                            </p>

                            <div className="mt-4 rounded-[22px] border border-zinc-800 bg-[#111827] p-3">
                                <div className="rounded-[16px] bg-[#050816] p-3">
                                    <NotificationPreview
                                        title={
                                            title
                                        }
                                        message={
                                            message
                                        }
                                        theme={
                                            theme
                                        }
                                    />
                                </div>
                            </div>

                            {/* DESTINATION */}

                            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white"
                                    style={{
                                        color:
                                            theme.accent,

                                        borderColor:
                                            `${theme.accent}25`,
                                    }}
                                >
                                    <DestinationIcon
                                        size={
                                            17
                                        }
                                    />
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">
                                        Opens
                                        after
                                        tap
                                    </p>

                                    <p className="mt-1 text-[12px] font-black text-zinc-800">
                                        {
                                            destination.label
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}

                        <div className="flex flex-col-reverse gap-2.5 border-t border-zinc-200 bg-zinc-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                            <button
                                type="button"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    sending
                                }
                                className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-[12px] font-bold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    onConfirm
                                }
                                disabled={
                                    sending
                                }
                                className="flex min-w-[180px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-[12px] font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                                style={{
                                    backgroundColor:
                                        theme.accent,
                                }}
                            >
                                {sending ? (
                                    <>
                                        <Loader2
                                            size={
                                                15
                                            }
                                            className="animate-spin"
                                        />

                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send
                                            size={
                                                14
                                            }
                                        />

                                        Send
                                        Notification
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ===========================================================
// SUCCESS MODAL
// ===========================================================

function SuccessModal({
    open,
    recipients,
    theme,
    onClose,
}) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (
            event
        ) => {
            if (
                event.key ===
                "Escape"
            ) {
                onClose();
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
    }, [open, onClose]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style
                .overflow;

        document.body.style.overflow =
            "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
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
                    className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6"
                >
                    {/* BACKDROP */}

                    <motion.button
                        type="button"
                        aria-label="Close success message"
                        onClick={
                            onClose
                        }
                        className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
                    />

                    {/* MODAL */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.94,
                            y: 16,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.97,
                            y: 8,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 26,
                        }}
                        className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-[26px] border border-zinc-200 bg-white p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:p-7"
                    >
                        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                            <motion.div
                                initial={{
                                    scale: 0,
                                }}
                                animate={{
                                    scale: 1,
                                }}
                                transition={{
                                    delay: 0.1,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 18,
                                }}
                                className="absolute inset-0 rounded-full bg-emerald-100"
                            />

                            <CheckCircle2
                                size={32}
                                className="relative text-emerald-600"
                            />
                        </div>

                        <h3 className="mt-5 text-[20px] font-black tracking-[-0.03em] text-zinc-900">
                            Notification
                            Sent!
                        </h3>

                        <p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-6 text-zinc-500">
                            Your
                            QUIZTIANS
                            notification
                            was sent
                            successfully.
                        </p>

                        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">
                                Recipients
                            </p>

                            <div className="mt-2 flex items-center justify-center gap-2">
                                <Smartphone
                                    size={17}
                                    className="text-emerald-600"
                                />

                                <p className="text-[17px] font-black text-emerald-800">
                                    {
                                        recipients
                                    }{" "}
                                    active{" "}
                                    {recipients ===
                                        1
                                        ? "device"
                                        : "devices"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[12px] font-black text-white shadow-sm transition hover:-translate-y-0.5"
                            style={{
                                backgroundColor:
                                    theme.accent,
                            }}
                        >
                            <Check
                                size={15}
                            />

                            Done
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
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
                        `${theme.accent}20`,

                    backgroundColor:
                        theme.accentSoft,
                }}
            >
                <Icon
                    size={17}
                    strokeWidth={1.8}
                    style={{
                        color:
                            theme.accent,
                    }}
                />
            </div>

            <div className="min-w-0">
                <h3 className="text-[15px] font-black text-zinc-900">
                    {title}
                </h3>

                <p className="mt-1 text-[11px] text-zinc-500">
                    {description}
                </p>
            </div>
        </div>
    );
}