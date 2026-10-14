/* ==========================================================
   RESULTS LOADING
========================================================== */

export default function ResultsLoading({ theme }) {
    return (
        <div className="mt-4 space-y-4">
            {/* ==================================================
          STATS SKELETON
      ================================================== */}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {Array.from({
                    length: 6,
                }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[138px] animate-pulse rounded-[18px] border border-white/[0.05] bg-[#111114] p-4"
                    >
                        <div
                            className="h-10 w-10 rounded-xl opacity-30"
                            style={{
                                backgroundColor: theme.accentSoft,
                            }}
                        />

                        <div className="mt-4 h-3 w-20 rounded bg-white/[0.04]" />

                        <div className="mt-3 h-7 w-16 rounded bg-white/[0.05]" />
                    </div>
                ))}
            </div>

            {/* ==================================================
          CHART SKELETONS
      ================================================== */}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {Array.from({
                    length: 2,
                }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[390px] animate-pulse rounded-[22px] border border-white/[0.05] bg-[#111114]"
                    >
                        <div className="border-b border-white/[0.04] p-5">
                            <div className="h-4 w-40 rounded bg-white/[0.05]" />

                            <div className="mt-2 h-3 w-56 max-w-full rounded bg-white/[0.03]" />
                        </div>

                        <div className="flex h-[290px] items-center justify-center">
                            <div className="h-40 w-[75%] rounded-2xl bg-white/[0.025]" />
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================================================
          TABLE SKELETON
      ================================================== */}

            <div className="overflow-hidden rounded-[22px] border border-white/[0.05] bg-[#111114]">
                <div className="border-b border-white/[0.04] p-5">
                    <div className="h-4 w-32 rounded bg-white/[0.05]" />

                    <div className="mt-2 h-3 w-48 rounded bg-white/[0.03]" />
                </div>

                <div className="space-y-1 p-4">
                    {Array.from({
                        length: 6,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="flex h-16 animate-pulse items-center gap-4 rounded-xl px-3"
                        >
                            <div className="h-9 w-9 shrink-0 rounded-xl bg-white/[0.04]" />

                            <div className="min-w-0 flex-1">
                                <div className="h-3 w-36 rounded bg-white/[0.05]" />

                                <div className="mt-2 h-2.5 w-24 rounded bg-white/[0.025]" />
                            </div>

                            <div className="hidden h-8 w-20 rounded-xl bg-white/[0.03] sm:block" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}