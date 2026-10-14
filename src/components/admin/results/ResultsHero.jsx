import { motion } from "framer-motion";
import {
    Download,
    RefreshCw,
    RotateCcw,
    Sparkles,
} from "lucide-react";

export default function ResultsHero({
    filteredCount,
    totalCount,
    refreshing,
    onRefresh,
    onExport,
    onReset,
    theme,
}) {
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
            className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#111114] p-5 sm:p-6 lg:p-7"
        >
            {/* Background glow */}
            <div
                className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full ${theme.glow} blur-[110px]`}
            />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                {/* LEFT */}
                <div className="max-w-2xl">
                    <div className="flex items-center gap-2">
                        <Sparkles
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
                            Result Analytics
                        </p>
                    </div>

                    <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-white sm:text-[32px] lg:text-[36px]">
                        Results Dashboard
                    </h2>

                    <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-500 sm:text-[14px]">
                        Analyze participant performance, identify repeat attempts,
                        export filtered data and manage quiz results.
                    </p>

                    {/* Counts */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-[11px] font-bold text-zinc-500">
                            {filteredCount} visible
                        </span>

                        <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-[11px] font-bold text-zinc-500">
                            {totalCount} total
                        </span>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <ActionButton
                        icon={RefreshCw}
                        label="Refresh"
                        onClick={onRefresh}
                        loading={refreshing}
                    />

                    <ActionButton
                        icon={Download}
                        label="Export CSV"
                        onClick={onExport}
                        theme={theme}
                        primary
                    />

                    <ActionButton
                        icon={RotateCcw}
                        label="Reset Results"
                        onClick={onReset}
                        danger
                        className="col-span-2 sm:col-span-1"
                    />
                </div>
            </div>
        </motion.section>
    );
}

/* ==========================================================
   ACTION BUTTON
========================================================== */

function ActionButton({
    icon: Icon,
    label,
    onClick,
    loading = false,
    primary = false,
    danger = false,
    theme,
    className = "",
}) {
    let styles =
        "border-white/[0.07] bg-white/[0.025] text-zinc-400 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white";

    if (danger) {
        styles =
            "border-red-500/10 bg-red-500/[0.04] text-red-400 hover:bg-red-500/[0.08]";
    }

    return (
        <button
            type="button"
            disabled={loading}
            onClick={onClick}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[12px] font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
            style={
                primary
                    ? {
                        borderColor: `${theme.accent}25`,
                        backgroundColor: theme.accentSoft,
                        color: theme.accent,
                    }
                    : undefined
            }
        >
            <Icon
                size={15}
                className={loading ? "animate-spin" : ""}
            />

            {label}
        </button>
    );
}