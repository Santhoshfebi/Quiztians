import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    AlertTriangle,
    BookOpen,
    ChevronDown,
    Database,
    RotateCcw,
    ShieldAlert,
    X,
} from "lucide-react";

/* ==========================================================
   RESET RESULTS DIALOG
========================================================== */

export default function ResetResultsDialog({
    open,
    onClose,
    selectedChapter,
    setSelectedChapter,
    chapters,
    resetting,
    onConfirm,
    theme,
}) {
    const isGlobalReset =
        !selectedChapter;

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
                    {/* ==================================================
              BACKDROP
          ================================================== */}

                    <motion.button
                        type="button"
                        aria-label="Close reset dialog"
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
                        aria-labelledby="reset-results-title"
                        className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#111114] shadow-2xl shadow-black/50"
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
                                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-red-400 sm:text-[11px]">
                                        Destructive Action
                                    </p>

                                    <h3
                                        id="reset-results-title"
                                        className="mt-1 text-[18px] font-black tracking-[-0.025em] text-white sm:text-[19px]"
                                    >
                                        Reset Quiz Results
                                    </h3>

                                    <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-zinc-500">
                                        Choose exactly which
                                        result records should
                                        be permanently removed.
                                    </p>
                                </div>
                            </div>

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
                            {/* ================================================
                  TARGET SELECT
              ================================================ */}

                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="reset-results-target"
                                        className="text-[11px] font-black uppercase tracking-[0.07em] text-zinc-500"
                                    >
                                        Reset Target
                                    </label>

                                    <span
                                        className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em] ${isGlobalReset
                                                ? "border-red-500/15 bg-red-500/[0.06] text-red-400"
                                                : "border-amber-500/15 bg-amber-500/[0.06] text-amber-400"
                                            }`}
                                    >
                                        {isGlobalReset
                                            ? "Global"
                                            : "Chapter"}
                                    </span>
                                </div>

                                <div className="relative mt-2">
                                    <select
                                        id="reset-results-target"
                                        value={
                                            selectedChapter
                                        }
                                        disabled={
                                            resetting
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSelectedChapter(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#0D0D10] px-4 pr-10 text-[13px] font-bold text-zinc-300 outline-none transition focus:border-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
                                    >
                                        <option value="">
                                            All Results
                                        </option>

                                        {chapters.map(
                                            (chapter) => (
                                                <option
                                                    key={
                                                        chapter
                                                    }
                                                    value={
                                                        chapter
                                                    }
                                                >
                                                    {
                                                        chapter
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <ChevronDown
                                        size={15}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
                                    />
                                </div>
                            </div>

                            {/* ================================================
                  SELECTED TARGET
              ================================================ */}

                            <div
                                className={`mt-4 rounded-2xl border p-4 ${isGlobalReset
                                        ? "border-red-500/10 bg-red-500/[0.025]"
                                        : "border-white/[0.055] bg-[#0D0D10]"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isGlobalReset
                                                ? "border-red-500/10 bg-red-500/[0.06] text-red-400"
                                                : "border-white/[0.06] bg-white/[0.025] text-zinc-400"
                                            }`}
                                    >
                                        {isGlobalReset ? (
                                            <Database
                                                size={16}
                                            />
                                        ) : (
                                            <BookOpen
                                                size={16}
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-black uppercase tracking-[0.09em] text-zinc-600">
                                            Selected Target
                                        </p>

                                        <p
                                            className={`mt-1.5 truncate text-[14px] font-black ${isGlobalReset
                                                    ? "text-red-300"
                                                    : "text-zinc-300"
                                                }`}
                                            title={
                                                selectedChapter ||
                                                "All quiz results"
                                            }
                                        >
                                            {selectedChapter
                                                ? selectedChapter
                                                : "All quiz results"}
                                        </p>

                                        <p className="mt-1 text-[11px] leading-5 text-zinc-600 sm:text-[12px]">
                                            {selectedChapter
                                                ? `Every stored result for "${selectedChapter}" will be permanently deleted. Results from other chapters will remain unchanged.`
                                                : "Every stored quiz result will be permanently deleted from the results table."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ================================================
                  GLOBAL RESET WARNING
              ================================================ */}

                            {isGlobalReset && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        y: 4,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    className="mt-3 flex items-start gap-3 rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-4"
                                >
                                    <ShieldAlert
                                        size={17}
                                        className="mt-0.5 shrink-0 text-red-400"
                                    />

                                    <div>
                                        <p className="text-[12px] font-black text-red-300 sm:text-[13px]">
                                            Full results reset
                                        </p>

                                        <p className="mt-1 text-[11px] leading-5 text-red-300/60 sm:text-[12px]">
                                            This option affects
                                            every participant and
                                            every chapter currently
                                            stored in the results
                                            table.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* ================================================
                  PERMANENT ACTION WARNING
              ================================================ */}

                            <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.035] p-4">
                                <AlertTriangle
                                    size={17}
                                    className="mt-0.5 shrink-0 text-amber-400"
                                />

                                <div>
                                    <p className="text-[12px] font-black text-amber-300 sm:text-[13px]">
                                        This action cannot be
                                        undone
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-amber-200/50 sm:text-[12px]">
                                        Deleted result records
                                        cannot be recovered from
                                        this dashboard. Export
                                        any data you want to
                                        keep before continuing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ==================================================
                FOOTER
            ================================================== */}

                        <div className="border-t border-white/[0.06] bg-black/[0.08] p-4 sm:p-5">
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                {/* CANCEL */}

                                <button
                                    type="button"
                                    disabled={
                                        resetting
                                    }
                                    onClick={
                                        onClose
                                    }
                                    className="h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 text-[12px] font-black text-zinc-400 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Cancel
                                </button>

                                {/* CONFIRM */}

                                <button
                                    type="button"
                                    disabled={
                                        resetting
                                    }
                                    onClick={
                                        onConfirm
                                    }
                                    className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-[12px] font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${isGlobalReset
                                            ? "border-red-500/20 bg-red-500/[0.11] text-red-300 hover:border-red-500/30 hover:bg-red-500/[0.16]"
                                            : "border-red-500/15 bg-red-500/[0.08] text-red-400 hover:bg-red-500/[0.13]"
                                        }`}
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
                                        : selectedChapter
                                            ? "Reset Chapter"
                                            : "Reset All Results"}
                                </button>
                            </div>

                            {/* SCOPE NOTE */}

                            <p className="mt-3 text-center text-[9px] font-semibold leading-4 text-zinc-700 sm:text-right sm:text-[10px]">
                                {selectedChapter
                                    ? "Only the selected chapter will be affected."
                                    : "All stored quiz results will be affected."}
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