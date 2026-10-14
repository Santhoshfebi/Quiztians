import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    ChevronDown,
    RotateCcw,
    X,
} from "lucide-react";

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
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* BACKDROP */}
                    <motion.button
                        type="button"
                        aria-label="Close reset dialog"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            if (!resetting) {
                                onClose();
                            }
                        }}
                        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
                    />

                    {/* DIALOG */}
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
                        className="relative z-10 w-full max-w-[470px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#111114] shadow-2xl shadow-black/50"
                    >
                        {/* HEADER */}
                        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5 sm:p-6">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/[0.06] text-red-400">
                                    <RotateCcw size={18} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-red-400">
                                        Destructive Action
                                    </p>

                                    <h3
                                        id="reset-results-title"
                                        className="mt-1 text-[18px] font-black tracking-[-0.025em] text-white"
                                    >
                                        Reset Quiz Results
                                    </h3>

                                    <p className="mt-1.5 text-[12px] leading-5 text-zinc-600">
                                        Choose which result records you want to permanently
                                        delete.
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

                        {/* BODY */}
                        <div className="p-5 sm:p-6">
                            <label className="text-[12px] font-bold text-zinc-500">
                                Reset Target
                            </label>

                            <div className="relative mt-2">
                                <select
                                    value={selectedChapter}
                                    disabled={resetting}
                                    onChange={(event) =>
                                        setSelectedChapter(event.target.value)
                                    }
                                    className="h-12 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#0D0D10] px-4 pr-10 text-[13px] font-bold text-zinc-300 outline-none transition focus:border-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
                                >
                                    <option value="">
                                        All Results
                                    </option>

                                    {chapters.map((chapter) => (
                                        <option
                                            key={chapter}
                                            value={chapter}
                                        >
                                            {chapter}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    size={15}
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600"
                                />
                            </div>

                            {/* TARGET SUMMARY */}
                            <div className="mt-4 rounded-2xl border border-white/[0.055] bg-[#0D0D10] p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-700">
                                    Selected Target
                                </p>

                                <p className="mt-1.5 text-[14px] font-black text-zinc-300">
                                    {selectedChapter
                                        ? selectedChapter
                                        : "All quiz results"}
                                </p>

                                <p className="mt-1 text-[12px] leading-5 text-zinc-600">
                                    {selectedChapter
                                        ? `Every stored result for "${selectedChapter}" will be deleted.`
                                        : "Every stored quiz result will be deleted from the results table."}
                                </p>
                            </div>

                            {/* WARNING */}
                            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/10 bg-red-500/[0.035] p-4">
                                <AlertTriangle
                                    size={17}
                                    className="mt-0.5 shrink-0 text-red-400"
                                />

                                <div>
                                    <p className="text-[13px] font-black text-red-300">
                                        This action cannot be undone
                                    </p>

                                    <p className="mt-1 text-[12px] leading-5 text-red-300/60">
                                        Deleted result records cannot be recovered from this
                                        page. Make sure you have exported any data you want to
                                        keep.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
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
                                disabled={resetting}
                                onClick={onConfirm}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.08] px-5 text-[12px] font-black text-red-400 transition hover:bg-red-500/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RotateCcw
                                    size={14}
                                    className={resetting ? "animate-spin" : ""}
                                />

                                {resetting
                                    ? "Resetting..."
                                    : selectedChapter
                                        ? "Reset Chapter"
                                        : "Reset All Results"}
                            </button>
                        </div>

                        {/* SMALL ACCENT */}
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