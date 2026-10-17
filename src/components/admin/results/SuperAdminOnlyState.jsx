/* ==========================================================
   SUPER ADMIN ONLY STATE
========================================================== */

export default function SuperAdminOnlyState({ theme }) {
  const handleReturnToDashboard = () => {
    window.location.href = "/admin";
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[26px] border border-zinc-200/90 bg-white p-6 text-center shadow-[0_12px_36px_rgba(24,24,27,0.08)] sm:p-8">
        {/* ==================================================
            BACKGROUND ACCENT GLOW
        ================================================== */}

        <div
          className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
          style={{
            backgroundColor: `${theme.accent}12`,
          }}
        />

        {/* ==================================================
            SUBTLE GRID
        ================================================== */}

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative">
          {/* ==================================================
              ICON
          ================================================== */}

          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border text-[22px] shadow-sm"
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

          <h2 className="mt-2 text-[24px] font-black tracking-[-0.035em] text-zinc-900 sm:text-[28px]">
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
              ACCESS INFO
          ================================================== */}

          <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-zinc-200/80 bg-[#F8FAFC] px-4 py-3">
            <p className="text-[11px] font-bold leading-5 text-zinc-500">
              This section contains participant result management
              and administrative reset controls.
            </p>
          </div>

          {/* ==================================================
              RETURN BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={handleReturnToDashboard}
            className="mt-6 h-11 rounded-xl px-5 text-[12px] font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
            style={{
              backgroundColor: theme.accent,
              boxShadow: `0 8px 20px ${theme.accent}22`,
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}