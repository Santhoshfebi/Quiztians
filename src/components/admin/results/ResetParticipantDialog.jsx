import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    AlertTriangle,
    BookOpen,
    RotateCcw,
    ShieldCheck,
    Smartphone,
    UserRound,
    X,
} from "lucide-react";

/* ==========================================================
   RESET PARTICIPANT DIALOG
========================================================== */

export default function ResetParticipantDialog({
    open,
    phone,
    chapter,
    name,
    resetting,
    onClose,
    onConfirm,
    theme,
}) {
    const canReset =
        Boolean(phone && chapter);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4">
                    {/* ==================================================
              BACKDROP
          ================================================== */}

                    <motion.button
                        type="button"
                        aria-label="Close participant reset dialog"
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        onClick={() => {
                            if (!resetting) {
                                onClose();
                            }
                        }}
                        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
                    />

                    {/* ==================================================
              DIALOG
          ================================================== */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: 0.96,
                            y: 12,
                        }}
                        transition={{
                            duration: 0.18,
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reset-participant-title"
                        className="relative z-10 w-full max-w-[470px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#111114] shadow-2xl shadow-black/50"
                    >
                        {/* ==================================================
                HEADER
            ================================================== */}

                        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5 sm:p-6">
                            <div className="flex min-w-0 items-start gap-3">
                                {/* ICON */}

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/[0.06] text-red-400">
                                    <RotateCcw
                                        size={18}
                                    />
                                </div>

                                {/* TEXT */}

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[10px] font-black uppercase tracking-[0.13em] text-red-400 sm:text-[11px]">
                                            Result Reset
                                        </p>

                                        <span className="rounded-full border border-amber-500/15 bg-amber-500/[0.06] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.07em] text-amber-400">
                                            Single Attempt
                                        </span>
                                    </div>

                                    <h3
                                        id="reset-participant-title"
                                        className="mt-1.5 text-[18px] font-black tracking-[-0.025em] text-white sm:text-[19px]"
                                    >
                                        Reset this result?
                                    </h3>

                                    <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-zinc-500">
                                        This removes only the
                                        selected participant&apos;s
                                        result for this chapter.
                                    </p>
                                </div>
                            </div>

                            {/* CLOSE */}

                            <button
                                type="button"
                                aria-label="Close"
                                disabled={resetting}
                                onClick={onClose}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-500 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <X
                                    size={15}
                                />
                            </button>
                        </div>

                        {/* ==================================================
                BODY
            ================================================== */}

                        <div className="p-5 sm:p-6">
                            {/* =================================================
                  RESET TARGET
              ================================================= */}

                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-zinc-600">
                                    Reset Target
                                </p>

                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[9px] font-black text-zinc-500">
                                    <ShieldCheck
                                        size={11}
                                    />

                                    Scoped Reset
                                </span>
                            </div>

                            {/* =================================================
                  PARTICIPANT
              ================================================= */}

                            {name && (
                                <InfoRow
                                    icon={UserRound}
                                    label="Participant"
                                    value={name}
                                    theme={theme}
                                    prominent
                                />
                            )}

                            {/* =================================================
                  PHONE + CHAPTER
              ================================================= */}

                            <div
                                className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${name
                                        ? "mt-2"
                                        : ""
                                    }`}
                            >
                                <InfoRow
                                    icon={Smartphone}
                                    label="Phone Number"
                                    value={
                                        phone ||
                                        "Unknown"
                                    }
                                    theme={theme}
                                />

                                <InfoRow
                                    icon={BookOpen}
                                    label="Chapter"
                                    value={
                                        chapter ||
                                        "Unknown"
                                    }
                                    theme={theme}
                                />
                            </div>

                            {/* =================================================
                  SCOPE INFORMATION
              ================================================= */}

                            <div className="mt-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.025] p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/[0.05] text-emerald-400">
                                        <ShieldCheck
                                            size={15}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[12px] font-black text-emerald-300 sm:text-[13px]">
                                            Only this attempt is affected
                                        </p>

                                        <p className="mt-1 text-[11px] leading-5 text-emerald-200/50 sm:text-[12px]">
                                            Results belonging to the
                                            same phone number in other
                                            chapters will remain
                                            unchanged.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* =================================================
                  WARNING
              ================================================= */}

                            <div className="mt-3 flex items-start gap-3 rounded-2xl border border-red-500/10 bg-red-500/[0.035] p-4">
                                <AlertTriangle
                                    size={17}
                                    className="mt-0.5 shrink-0 text-red-400"
                                />

                                <div className="min-w-0">
                                    <p className="text-[12px] font-black text-red-300 sm:text-[13px]">
                                        This chapter result will be
                                        removed
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-red-300/60 sm:text-[12px]">
                                        The selected result cannot be
                                        recovered from this dashboard
                                        after the reset is confirmed.
                                    </p>
                                </div>
                            </div>

                            {/* =================================================
                  INVALID TARGET
              ================================================= */}

                            {!canReset && (
                                <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.035] p-4">
                                    <AlertTriangle
                                        size={16}
                                        className="mt-0.5 shrink-0 text-amber-400"
                                    />

                                    <div>
                                        <p className="text-[12px] font-black text-amber-300">
                                            Reset unavailable
                                        </p>

                                        <p className="mt-1 text-[11px] leading-5 text-amber-200/50">
                                            A valid phone number and
                                            chapter are required before
                                            this result can be reset.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ==================================================
                FOOTER
            ================================================== */}

                        <div className="border-t border-white/[0.06] bg-black/[0.08] p-4 sm:p-5">
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                {/* CANCEL */}

                                <button
                                    type="button"
                                    disabled={resetting}
                                    onClick={onClose}
                                    className="h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 text-[12px] font-black text-zinc-400 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Cancel
                                </button>

                                {/* CONFIRM RESET */}

                                <button
                                    type="button"
                                    disabled={
                                        resetting ||
                                        !canReset
                                    }
                                    onClick={onConfirm}
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.09] px-5 text-[12px] font-black text-red-400 transition hover:border-red-500/25 hover:bg-red-500/[0.14] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <RotateCcw
                                        size={14}
                                        className={
                                            resetting
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />

                                    {resetting
                                        ? "Resetting..."
                                        : "Reset Result"}
                                </button>
                            </div>

                            {/* SCOPE NOTE */}

                            <p className="mt-3 text-center text-[9px] font-semibold leading-4 text-zinc-700 sm:text-right sm:text-[10px]">
                                Other participant results and
                                other chapters are not affected.
                            </p>
                        </div>

                        {/* ==================================================
                ACCENT
            ================================================== */}

                        <div
                            className="h-[2px] w-full opacity-50"
                            style={{
                                background:
                                    `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
                            }}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/* ==========================================================
   INFO ROW
========================================================== */

function InfoRow({
    icon: Icon,
    label,
    value,
    theme,
    prominent = false,
}) {
    return (
        <div
            className={`flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.055] bg-[#0D0D10] ${prominent
                    ? "p-4"
                    : "p-3.5"
                }`}
        >
            {/* ICON */}

            <div
                className={`flex shrink-0 items-center justify-center rounded-xl ${prominent
                        ? "h-11 w-11"
                        : "h-10 w-10"
                    }`}
                style={{
                    backgroundColor:
                        theme.accentSoft,
                    color:
                        theme.accent,
                }}
            >
                <Icon
                    size={
                        prominent
                            ? 17
                            : 16
                    }
                />
            </div>

            {/* CONTENT */}

            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-zinc-600 sm:text-[10px]">
                    {label}
                </p>

                <p
                    className={`mt-1 truncate font-black text-zinc-300 ${prominent
                            ? "text-[14px]"
                            : "text-[12px] sm:text-[13px]"
                        }`}
                    title={
                        value
                            ? String(value)
                            : undefined
                    }
                >
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}