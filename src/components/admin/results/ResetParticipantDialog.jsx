import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    AlertTriangle,
    BookOpen,
    RotateCcw,
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
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                        className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#111114] shadow-2xl shadow-black/50"
                    >
                        {/* ==================================================
                HEADER
            ================================================== */}

                        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5 sm:p-6">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/[0.06] text-red-400">
                                    <RotateCcw
                                        size={18}
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-red-400">
                                        Result Reset
                                    </p>

                                    <h3
                                        id="reset-participant-title"
                                        className="mt-1 text-[18px] font-black tracking-[-0.025em] text-white"
                                    >
                                        Reset this result?
                                    </h3>

                                    <p className="mt-1.5 text-[12px] leading-5 text-zinc-600">
                                        Only this participant&apos;s
                                        result for the selected chapter
                                        will be removed.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label="Close"
                                disabled={resetting}
                                onClick={onClose}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-600 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* ==================================================
                BODY
            ================================================== */}

                        <div className="p-5 sm:p-6">
                            {/* PARTICIPANT */}

                            {name && (
                                <InfoRow
                                    icon={UserRound}
                                    label="Participant"
                                    value={name}
                                    theme={theme}
                                />
                            )}

                            {/* PHONE */}

                            <div
                                className={
                                    name
                                        ? "mt-2"
                                        : ""
                                }
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
                            </div>

                            {/* CHAPTER */}

                            <div className="mt-2">
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

                            {/* WARNING */}

                            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/10 bg-red-500/[0.035] p-4">
                                <AlertTriangle
                                    size={17}
                                    className="mt-0.5 shrink-0 text-red-400"
                                />

                                <div>
                                    <p className="text-[13px] font-black text-red-300">
                                        This chapter result will be removed
                                    </p>

                                    <p className="mt-1 text-[12px] leading-5 text-red-300/60">
                                        Results belonging to the same
                                        phone number in other chapters
                                        will remain unchanged.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ==================================================
                FOOTER
            ================================================== */}

                        <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] p-4 sm:flex-row sm:justify-end sm:p-5">
                            <button
                                type="button"
                                disabled={resetting}
                                onClick={onClose}
                                className="h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 text-[12px] font-black text-zinc-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    resetting ||
                                    !phone ||
                                    !chapter
                                }
                                onClick={onConfirm}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.08] px-5 text-[12px] font-black text-red-400 transition hover:bg-red-500/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
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

                        {/* ACCENT */}

                        <div
                            className="h-[2px] w-full opacity-50"
                            style={{
                                background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
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
}) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.055] bg-[#0D0D10] p-3.5">
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                    backgroundColor:
                        theme.accentSoft,
                    color:
                        theme.accent,
                }}
            >
                <Icon size={16} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-zinc-700">
                    {label}
                </p>

                <p
                    className="mt-1 truncate text-[13px] font-black text-zinc-300"
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