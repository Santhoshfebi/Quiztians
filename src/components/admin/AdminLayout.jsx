import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import AdminChatBot from "./chatbot/AdminChatBot";

import {
    Activity,
    BarChart3,
    ChevronRight,
    Clock3,
    FileQuestion,
    History,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Menu,
    Play,
    Plus,
    Settings,
    ShieldCheck,
    UserCog,
    X,
} from "lucide-react";

import { supabase } from "../../supabaseClient";
import { roleThemes } from "../../theme/roleTheme";

// ===========================================================
// BRAND
// ===========================================================

const Q_LOGO = "/branding/quiztians-q.png";
const WORDMARK_LOGO = "/branding/quiztians-wordmark.png";

// ===========================================================
// NAVIGATION
// ===========================================================

const BASE_NAV_ITEMS = [
    {
        label: "Dashboard",
        shortLabel: "Home",
        icon: LayoutDashboard,
        route: "/admin",
    },
    {
        label: "Add Questions",
        shortLabel: "Add",
        icon: Plus,
        route: "/admin/add-questions",
    },
    {
        label: "Preview Questions",
        shortLabel: "Preview",
        icon: FileQuestion,
        route: "/admin/preview-questions",
    },
    {
        label: "Preview Quiz",
        shortLabel: "Quiz",
        icon: Play,
        route: "/admin/preview-quiz",
    },
    {
        label: "Quiz Config",
        shortLabel: "Config",
        icon: Settings,
        route: "/admin/quiz-config",
    },
    {
        label: "Results",
        shortLabel: "Results",
        icon: BarChart3,
        route: "/admin/view-results",
    },
    {
        label: "Analytics",
        shortLabel: "Analytics",
        icon: Activity,
        route: "/admin/analytics",
    },
    {
        label: "Announcements",
        shortLabel: "News",
        icon: Megaphone,
        route: "/admin/announcements",
    },
    {
        label: "Activity Logs",
        shortLabel: "Activity",
        icon: Activity,
        route: "/admin/activity-logs",
    },
];

const SUPERADMIN_NAV_ITEMS = [
    {
        label: "Login Logs",
        shortLabel: "Logs",
        icon: History,
        route: "/admin/login-logs",
    },
    {
        label: "Admin Users",
        shortLabel: "Admins",
        icon: UserCog,
        route: "/admin/admin-users",
    },
];

// ===========================================================
// PAGE META
// ===========================================================

const PAGE_META = {
    "/admin": {
        eyebrow: "Administration",
        title: "Dashboard",
    },

    "/admin/add-questions": {
        eyebrow: "Question Management",
        title: "Add Questions",
    },

    "/admin/preview-questions": {
        eyebrow: "Question Management",
        title: "Preview Questions",
    },

    "/admin/preview-quiz": {
        eyebrow: "Quiz Management",
        title: "Preview Quiz",
    },

    "/admin/quiz-config": {
        eyebrow: "Quiz Management",
        title: "Quiz Configuration",
    },

    "/admin/view-results": {
        eyebrow: "Analytics",
        title: "Results",
    },

    "/admin/analytics": {
        eyebrow: "Analytics",
        title: "Quiz Analytics",
    },

    "/admin/announcements": {
        eyebrow: "Communication",
        title: "Announcements",
    },

    "/admin/activity-logs": {
        eyebrow: "Monitoring",
        title: "Activity Logs",
    },

    "/admin/login-logs": {
        eyebrow: "Super Administrator",
        title: "Login Logs",
    },

    "/admin/admin-users": {
        eyebrow: "Super Administrator",
        title: "Admin Users",
    },
};

// ===========================================================
// SHARED HIDDEN SCROLLBAR STYLE
// ===========================================================

const hiddenScrollbarStyle = {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
};

// ===========================================================
// ADMIN LAYOUT
// ===========================================================

export default function AdminLayout({
    children,
    title,
    eyebrow,
    showHeader = true,
    contentClassName = "",
}) {
    const navigate = useNavigate();
    const location = useLocation();

    // =========================================================
    // STATE
    // =========================================================

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // =========================================================
    // SESSION
    // =========================================================

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const {
                    data: { user: currentUser },
                    error,
                } = await supabase.auth.getUser();

                if (!mounted) return;

                if (error) {
                    console.error("Admin session check failed:", error);
                }

                if (!currentUser) {
                    navigate("/admin-login", {
                        replace: true,
                    });

                    return;
                }

                setUser(currentUser);
            } catch (error) {
                console.error("Admin session check failed:", error);

                if (mounted) {
                    navigate("/admin-login", {
                        replace: true,
                    });
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        checkSession();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    // =========================================================
    // CLOSE MOBILE DRAWER WHEN ROUTE CHANGES
    // =========================================================

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // =========================================================
    // LOCK BODY WHILE MOBILE DRAWER IS OPEN
    // =========================================================

    useEffect(() => {
        if (!mobileMenuOpen) return;

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileMenuOpen]);

    // =========================================================
    // USER / ROLE
    // =========================================================

    const role = user?.user_metadata?.role || "admin";

    const isSuperAdmin = role === "superadmin";

    const theme = roleThemes[role] || roleThemes.admin;

    // =========================================================
    // NAV ITEMS
    // =========================================================

    const navItems = useMemo(() => {
        if (isSuperAdmin) {
            return [...BASE_NAV_ITEMS, ...SUPERADMIN_NAV_ITEMS];
        }

        return BASE_NAV_ITEMS;
    }, [isSuperAdmin]);

    // =========================================================
    // PAGE META
    // =========================================================

    const currentPageMeta =
        PAGE_META[location.pathname] || {
            eyebrow: "Administration",
            title: "Admin Console",
        };

    const pageTitle = title || currentPageMeta.title;

    const pageEyebrow = eyebrow || currentPageMeta.eyebrow;

    // =========================================================
    // PREVIOUS LOGIN
    // =========================================================

    const previousLogin =
        user?.user_metadata?.previous_login || null;

    const formatLastLogin = (dateString) => {
        if (!dateString) {
            return "First login";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "First login";
        }

        const day = date.toLocaleString("en-GB", {
            day: "2-digit",
        });

        const month = date.toLocaleString("en-GB", {
            month: "short",
        });

        const year = date.getFullYear();

        const time = date.toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        return `${day} ${month}, ${year} ${time}`;
    };

    // =========================================================
    // ACTIVE ROUTE
    // =========================================================

    const isRouteActive = (route) => {
        if (route === "/admin") {
            return location.pathname === "/admin";
        }

        return location.pathname.startsWith(route);
    };

    // =========================================================
    // NAVIGATION
    // =========================================================

    const handleNavigate = (route) => {
        setMobileMenuOpen(false);
        navigate(route);
    };

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Sign out failed:", error);
        } finally {
            navigate("/admin-login", {
                replace: true,
            });
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return <AdminLayoutLoading />;
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="min-h-screen bg-[#F5F6F8] text-zinc-900">
            {/* =====================================================
                HIDE WEBKIT SCROLLBARS
            ===================================================== */}

            <style>
                {`
                    .admin-hidden-scrollbar {
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                    }

                    .admin-hidden-scrollbar::-webkit-scrollbar {
                        display: none;
                        width: 0;
                        height: 0;
                    }
                `}
            </style>

            {/* =====================================================
                BACKGROUND
            ===================================================== */}

            <AdminBackground theme={theme} />

            {/* =====================================================
                DESKTOP SIDEBAR
            ===================================================== */}

            <DesktopSidebar
                user={user}
                theme={theme}
                role={role}
                navItems={navItems}
                isRouteActive={isRouteActive}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
            />

            {/* =====================================================
                MOBILE DRAWER
            ===================================================== */}

            <AnimatePresence>
                {mobileMenuOpen && (
                    <MobileDrawer
                        user={user}
                        role={role}
                        theme={theme}
                        navItems={navItems}
                        isRouteActive={isRouteActive}
                        onNavigate={handleNavigate}
                        onLogout={handleLogout}
                        onClose={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* =====================================================
                MAIN
            ===================================================== */}

            <div className="relative min-h-screen lg:pl-[270px]">
                {/* ===================================================
                    HEADER
                =================================================== */}

                {showHeader && (
                    <AdminHeader
                        title={pageTitle}
                        eyebrow={pageEyebrow}
                        role={role}
                        theme={theme}
                        previousLogin={previousLogin}
                        formatLastLogin={formatLastLogin}
                        onLogout={handleLogout}
                        onOpenMenu={() => setMobileMenuOpen(true)}
                    />
                )}

                {/* ===================================================
                    PAGE CONTENT
                =================================================== */}

                <main
                    className={`mx-auto w-full max-w-[1500px] px-4 pb-32 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-8 xl:px-10 ${contentClassName}`}
                >
                    {typeof children === "function"
                        ? children({
                            user,
                            role,
                            theme,
                            isSuperAdmin,
                            previousLogin,
                        })
                        : children}
                </main>
            </div>

            {/* =====================================================
                MOBILE BOTTOM NAVIGATION
            ===================================================== */}

            <MobileBottomNav
                theme={theme}
                navItems={navItems}
                isRouteActive={isRouteActive}
                onNavigate={handleNavigate}
                onOpenMenu={() => setMobileMenuOpen(true)}
            />

            {/* =====================================================
                ADMIN CHATBOT
            ===================================================== */}

            <AdminChatBot
                theme={theme}
                isSuperAdmin={isSuperAdmin}
            />
        </div>
    );
}

// ===========================================================
// BACKGROUND
// ===========================================================

function AdminBackground({ theme }) {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            {/* ROLE ACCENT GLOW */}

            <div
                className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-[170px]"
                style={{
                    backgroundColor: `${theme.accent}0D`,
                }}
            />

            {/* SECONDARY GLOW */}

            <div className="absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-400/[0.04] blur-[170px]" />

            {/* LIGHT GRID */}

            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(24,24,27,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.22) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                }}
            />
        </div>
    );
}

// ===========================================================
// DESKTOP SIDEBAR
// ===========================================================

function DesktopSidebar({
    user,
    theme,
    role,
    navItems,
    isRouteActive,
    onNavigate,
    onLogout,
}) {
    return (
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-[270px] border-r border-zinc-200/80 bg-white/95 shadow-[8px_0_30px_rgba(24,24,27,0.025)] backdrop-blur-xl lg:flex lg:flex-col">
            {/* =====================================================
                BRAND
            ===================================================== */}

            <div className="shrink-0 border-b border-zinc-200/70 px-6 py-6">
                <img
                    src={WORDMARK_LOGO}
                    alt="QUIZTIANS"
                    className="h-[48px] w-auto max-w-[180px] object-contain object-left"
                />

                <div className="mt-3 flex items-center gap-2">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{
                            backgroundColor: theme.accent,
                        }}
                    />

                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">
                        Admin Console
                    </p>
                </div>
            </div>

            {/* =====================================================
                NAVIGATION
            ===================================================== */}

            <nav
                className="admin-hidden-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-5"
                style={hiddenScrollbarStyle}
            >
                <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Workspace
                </p>

                <div className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isRouteActive(item.route);

                        return (
                            <button
                                key={item.route}
                                type="button"
                                onClick={() => onNavigate(item.route)}
                                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active
                                    ? "bg-zinc-100/90"
                                    : "text-zinc-900 hover:bg-zinc-100/70"
                                    }`}
                                style={{
                                    color: active
                                        ? theme.accent
                                        : undefined,
                                }}
                            >
                                {/* ACTIVE INDICATOR */}

                                {active && (
                                    <motion.span
                                        layoutId="desktop-admin-active-nav"
                                        className="absolute bottom-2 left-0 top-2 w-[2px] rounded-r-full"
                                        style={{
                                            backgroundColor:
                                                theme.accent,
                                        }}
                                    />
                                )}

                                {/* ICON */}

                                <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${active
                                        ? "bg-white shadow-sm"
                                        : "group-hover:bg-white"
                                        }`}
                                >
                                    <Icon
                                        size={17}
                                        strokeWidth={
                                            active ? 2.2 : 1.8
                                        }
                                        style={{
                                            color: active
                                                ? theme.accent
                                                : "#18181B",
                                        }}
                                    />
                                </div>

                                {/* LABEL */}

                                <span className="flex-1 text-[13px] font-semibold">
                                    {item.label}
                                </span>

                                {/* ARROW */}

                                {active && (
                                    <ChevronRight
                                        size={14}
                                        style={{
                                            color: theme.accent,
                                        }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* =====================================================
                USER CARD
            ===================================================== */}

            <SidebarUserCard
                user={user}
                role={role}
                theme={theme}
                onLogout={onLogout}
            />
        </aside>
    );
}

// ===========================================================
// SIDEBAR USER CARD
// ===========================================================

function SidebarUserCard({
    user,
    role,
    theme,
    onLogout,
}) {
    const roleLabel =
        role === "superadmin"
            ? "Super Administrator"
            : "Administrator";

    return (
        <div className="shrink-0 border-t border-zinc-200/70 p-4">
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    {/* ROLE ICON */}

                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                        style={{
                            borderColor: `${theme.accent}25`,
                            backgroundColor: theme.accentSoft,
                        }}
                    >
                        <ShieldCheck
                            size={18}
                            style={{
                                color: theme.accent,
                            }}
                        />
                    </div>

                    {/* USER */}

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-zinc-800">
                            {user?.user_metadata?.full_name ||
                                roleLabel}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-zinc-500">
                            {user?.email}
                        </p>
                    </div>
                </div>

                {/* LOGOUT */}

                <button
                    type="button"
                    onClick={onLogout}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-[12px] font-bold text-red-500 transition hover:border-red-300 hover:bg-red-100 hover:text-red-600"
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

// ===========================================================
// ADMIN HEADER
// ===========================================================

function AdminHeader({
    title,
    eyebrow,
    role,
    theme,
    previousLogin,
    formatLastLogin,
    onLogout,
    onOpenMenu,
}) {
    const isSuperAdmin = role === "superadmin";

    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 shadow-[0_1px_18px_rgba(24,24,27,0.025)] backdrop-blur-xl">
            <div className="flex h-[70px] items-center justify-between px-4 sm:px-6 lg:h-[76px] lg:px-8 xl:px-10">
                {/* ===================================================
                    MOBILE LEFT
                =================================================== */}

                <div className="flex min-w-0 items-center gap-3 lg:hidden">
                    <button
                        type="button"
                        onClick={onOpenMenu}
                        aria-label="Open navigation"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                        <Menu size={19} />
                    </button>

                    <img
                        src={Q_LOGO}
                        alt="Quiztians"
                        className="h-9 w-9 shrink-0 object-contain"
                    />

                    <div className="min-w-0">
                        <p className="truncate text-[14px] font-black tracking-[0.04em] text-zinc-900">
                            {title}
                        </p>

                        <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                            {eyebrow}
                        </p>
                    </div>
                </div>

                {/* ===================================================
                    DESKTOP LEFT
                =================================================== */}

                <div className="hidden lg:block">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                        {eyebrow}
                    </p>

                    <h1 className="mt-1 text-[19px] font-black tracking-[-0.02em] text-zinc-900">
                        {title}
                    </h1>
                </div>

                {/* ===================================================
                    RIGHT
                =================================================== */}

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* LAST LOGIN */}

                    <div className="hidden items-center gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3.5 py-2.5 sm:flex">
                        <Clock3
                            size={14}
                            className="text-zinc-400"
                        />

                        <span className="text-[11px] font-medium text-zinc-500">
                            Last login:{" "}
                            {formatLastLogin(previousLogin)}
                        </span>
                    </div>

                    {/* ROLE */}

                    <div
                        className="hidden rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] sm:block"
                        style={{
                            color: theme.accent,
                            borderColor: `${theme.accent}25`,
                            backgroundColor: theme.accentSoft,
                        }}
                    >
                        {isSuperAdmin ? "Superadmin" : "Admin"}
                    </div>

                    {/* MOBILE LOGOUT */}

                    <button
                        type="button"
                        onClick={onLogout}
                        aria-label="Sign out"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 lg:hidden"
                    >
                        <LogOut size={17} />
                    </button>
                </div>
            </div>
        </header>
    );
}

// ===========================================================
// MOBILE BOTTOM NAVIGATION
// ===========================================================

function MobileBottomNav({
    theme,
    navItems,
    isRouteActive,
    onNavigate,
    onOpenMenu,
}) {
    /*
        Only the most important destinations stay permanently
        visible in the mobile bottom navigation.

        The remaining destinations are accessible through "More".
    */

    const primaryRoutes = [
        "/admin",
        "/admin/add-questions",
        "/admin/preview-questions",
        "/admin/view-results",
    ];

    const primaryItems = primaryRoutes
        .map((route) =>
            navItems.find((item) => item.route === route)
        )
        .filter(Boolean);

    const primaryActive = primaryItems.some((item) =>
        isRouteActive(item.route)
    );

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(24,24,27,0.04)] backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-xl items-center">
                {primaryItems.map((item) => {
                    const Icon = item.icon;
                    const active = isRouteActive(item.route);

                    return (
                        <button
                            key={item.route}
                            type="button"
                            onClick={() => onNavigate(item.route)}
                            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2.5"
                        >
                            {/* ACTIVE BACKGROUND */}

                            {active && (
                                <motion.div
                                    layoutId="mobile-admin-active-nav"
                                    className="absolute inset-0 rounded-xl border"
                                    style={{
                                        backgroundColor:
                                            theme.accentSoft,
                                        borderColor: `${theme.accent}20`,
                                    }}
                                />
                            )}

                            {/* ICON */}

                            <Icon
                                size={19}
                                strokeWidth={
                                    active ? 2.2 : 1.8
                                }
                                className="relative"
                                style={{
                                    color: active
                                        ? theme.accent
                                        : "#18181B",
                                }}
                            />

                            {/* LABEL */}

                            <span
                                className="relative truncate text-[10px] font-bold"
                                style={{
                                    color: active
                                        ? theme.accent
                                        : "#18181B",
                                }}
                            >
                                {item.shortLabel}
                            </span>
                        </button>
                    );
                })}

                {/* ===================================================
                    MORE
                =================================================== */}

                <button
                    type="button"
                    onClick={onOpenMenu}
                    className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2.5"
                >
                    {!primaryActive && (
                        <div
                            className="absolute inset-0 rounded-xl border"
                            style={{
                                backgroundColor:
                                    theme.accentSoft,
                                borderColor: `${theme.accent}20`,
                            }}
                        />
                    )}

                    <Menu
                        size={19}
                        strokeWidth={
                            !primaryActive ? 2.2 : 1.8
                        }
                        className="relative"
                        style={{
                            color: !primaryActive
                                ? theme.accent
                                : "#18181B",
                        }}
                    />

                    <span
                        className="relative text-[10px] font-bold"
                        style={{
                            color: !primaryActive
                                ? theme.accent
                                : "#18181B",
                        }}
                    >
                        More
                    </span>
                </button>
            </div>
        </div>
    );
}

// ===========================================================
// MOBILE DRAWER
// ===========================================================

function MobileDrawer({
    user,
    role,
    theme,
    navItems,
    isRouteActive,
    onNavigate,
    onLogout,
    onClose,
}) {
    const isSuperAdmin = role === "superadmin";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] lg:hidden"
        >
            {/* =====================================================
                BACKDROP
            ===================================================== */}

            <motion.button
                type="button"
                aria-label="Close navigation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            />

            {/* =====================================================
                DRAWER
            ===================================================== */}

            <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 32,
                }}
                className="absolute inset-y-0 left-0 flex w-[min(86vw,330px)] flex-col border-r border-zinc-200 bg-white shadow-2xl"
            >
                {/* ===================================================
                    DRAWER HEADER
                =================================================== */}

                <div className="shrink-0 border-b border-zinc-200/70 px-5 py-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <img
                                src={WORDMARK_LOGO}
                                alt="QUIZTIANS"
                                className="h-[42px] w-auto max-w-[160px] object-contain object-left"
                            />

                            <div className="mt-2 flex items-center gap-2">
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                        backgroundColor:
                                            theme.accent,
                                    }}
                                />

                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                    Admin Console
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close navigation"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ===================================================
                    USER
                =================================================== */}

                <div className="shrink-0 px-4 pt-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4">
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
                            style={{
                                borderColor: `${theme.accent}25`,
                                backgroundColor:
                                    theme.accentSoft,
                            }}
                        >
                            <ShieldCheck
                                size={19}
                                style={{
                                    color: theme.accent,
                                }}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-zinc-800">
                                {user?.user_metadata?.full_name ||
                                    "Administrator"}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-zinc-500">
                                {user?.email}
                            </p>
                        </div>

                        <div
                            className="shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em]"
                            style={{
                                color: theme.accent,
                                borderColor: `${theme.accent}25`,
                                backgroundColor:
                                    theme.accentSoft,
                            }}
                        >
                            {isSuperAdmin ? "Super" : "Admin"}
                        </div>
                    </div>
                </div>

                {/* ===================================================
                    NAVIGATION
                =================================================== */}

                <nav
                    className="admin-hidden-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5"
                    style={hiddenScrollbarStyle}
                >
                    <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                        Workspace
                    </p>

                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active =
                                isRouteActive(item.route);

                            return (
                                <button
                                    key={item.route}
                                    type="button"
                                    onClick={() =>
                                        onNavigate(item.route)
                                    }
                                    className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active
                                        ? "bg-zinc-100"
                                        : "text-zinc-900 hover:bg-zinc-100/70"
                                        }`}
                                    style={{
                                        color: active
                                            ? theme.accent
                                            : undefined,
                                    }}
                                >
                                    {/* ACTIVE INDICATOR */}

                                    {active && (
                                        <motion.span
                                            layoutId="drawer-admin-active-nav"
                                            className="absolute bottom-2 left-0 top-2 w-[2px] rounded-r-full"
                                            style={{
                                                backgroundColor:
                                                    theme.accent,
                                            }}
                                        />
                                    )}

                                    {/* ICON */}

                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${active
                                            ? "bg-white shadow-sm"
                                            : "group-hover:bg-white"
                                            }`}
                                    >
                                        <Icon
                                            size={17}
                                            strokeWidth={
                                                active
                                                    ? 2.2
                                                    : 1.8
                                            }
                                            style={{
                                                color: active
                                                    ? theme.accent
                                                    : "#18181B",
                                            }}
                                        />
                                    </div>

                                    {/* LABEL */}

                                    <span className="flex-1 text-[13px] font-semibold">
                                        {item.label}
                                    </span>

                                    {/* ARROW */}

                                    {active && (
                                        <ChevronRight
                                            size={14}
                                            style={{
                                                color:
                                                    theme.accent,
                                            }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* ===================================================
                    LOGOUT
                =================================================== */}

                <div className="shrink-0 border-t border-zinc-200/70 p-4">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-[12px] font-bold text-red-500 transition hover:border-red-300 hover:bg-red-100 hover:text-red-600"
                    >
                        <LogOut size={15} />
                        Sign Out
                    </button>
                </div>
            </motion.aside>
        </motion.div>
    );
}

// ===========================================================
// ADMIN LAYOUT LOADING
// ===========================================================

function AdminLayoutLoading() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F6F8] px-6 text-zinc-900">
            {/* =====================================================
                BACKGROUND
            ===================================================== */}

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B86C3A]/[0.08] blur-[130px]" />

                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />
            </div>

            {/* =====================================================
                CONTENT
            ===================================================== */}

            <motion.div
                initial={{
                    opacity: 0,
                    y: 8,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                className="relative text-center"
            >
                <img
                    src={Q_LOGO}
                    alt="Quiztians"
                    className="mx-auto h-16 w-16 object-contain"
                />

                <div className="mx-auto mt-6 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <LoadingSpinner />
                </div>

                <p className="mt-5 text-[14px] font-bold text-zinc-700">
                    Loading admin console
                </p>

                <p className="mt-2 text-[12px] text-zinc-400">
                    Verifying your session...
                </p>
            </motion.div>
        </div>
    );
}

// ===========================================================
// LOADING SPINNER
// ===========================================================

function LoadingSpinner() {
    return (
        <svg
            className="h-4 w-4 animate-spin text-zinc-500"
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