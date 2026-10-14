/* ==========================================================
   SUPER ADMIN ONLY STATE
========================================================== */

export default function SuperAdminOnlyState({ theme }) {
    const handleReturnToDashboard = () => {
        window.location.href = "/admin";
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center py-10">
            <div className="relative w-full max-w-lg overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#111114] p-6 text-center sm:p-8">
                {/* ==================================================
            BACKGROUND GLOW
        ================================================== */}

                <div
                    className={`pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full ${theme.glow} blur-[90px]`}
                />

                <div className="relative">
                    {/* ==================================================
              ICON
          ================================================== */}

                    <div
                        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border text-[22px]"
                        style={{
                            borderColor: `${theme.accent}20`,
                            backgroundColor: theme.accentSoft,
                            color: theme.accent,
                        }}
                    >
                        ✦
                    </div>

                    {/* ==================================================
              EYEBROW
          ================================================== */}

                    <p
                        className="mt-5 text-[11px] font-black uppercase tracking-[0.14em]"
                        style={{
                            color: theme.accent,
                        }}
                    >
                        Restricted Area
                    </p>

                    {/* ==================================================
              TITLE
          ================================================== */}

                    <h2 className="mt-2 text-[24px] font-black tracking-[-0.035em] text-white sm:text-[28px]">
                        Super Administrator Only
                    </h2>

                    {/* ==================================================
              DESCRIPTION
          ================================================== */}

                    <p className="mx-auto mt-3 max-w-sm text-[13px] leading-6 text-zinc-500">
                        Results management is restricted to super
                        administrators. Return to the dashboard to continue.
                    </p>

                    {/* ==================================================
              RETURN BUTTON
          ================================================== */}

                    <button
                        type="button"
                        onClick={handleReturnToDashboard}
                        className="mt-6 h-11 rounded-xl px-5 text-[12px] font-black text-white transition hover:opacity-90"
                        style={{
                            backgroundColor: theme.accent,
                        }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}