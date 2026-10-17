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
            className="h-[138px] animate-pulse rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.06)]"
          >
            {/* ICON */}

            <div
              className="h-10 w-10 rounded-xl border"
              style={{
                borderColor: `${theme.accent}12`,
                backgroundColor:
                  theme.accentSoft,
                opacity: 0.65,
              }}
            />

            {/* LABEL */}

            <div className="mt-4 h-3 w-20 rounded-full bg-zinc-200/80" />

            {/* VALUE */}

            <div className="mt-3 h-7 w-16 rounded-lg bg-zinc-200/70" />

            {/* BOTTOM ACCENT */}

            <div className="mt-4 h-1 w-8 rounded-full bg-zinc-200/70" />
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
            className="h-[390px] animate-pulse overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.06)]"
          >
            {/* HEADER */}

            <div className="flex items-center gap-3 border-b border-zinc-200/80 p-5">
              <div
                className="h-10 w-10 shrink-0 rounded-xl border"
                style={{
                  borderColor: `${theme.accent}12`,
                  backgroundColor:
                    theme.accentSoft,
                  opacity: 0.65,
                }}
              />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 max-w-full rounded-full bg-zinc-200/80" />

                <div className="mt-2 h-3 w-56 max-w-full rounded-full bg-zinc-100" />
              </div>
            </div>

            {/* CHART AREA */}

            <div className="flex h-[290px] items-center justify-center p-5">
              {index === 0 ? (
                <BarChartSkeleton />
              ) : (
                <DonutChartSkeleton
                  theme={theme}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ==================================================
          TABLE SKELETON
      ================================================== */}

      <div className="overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.06)]">
        {/* HEADER */}

        <div className="border-b border-zinc-200/80 p-5">
          <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-200/80" />

          <div className="mt-2 h-3 w-48 animate-pulse rounded-full bg-zinc-100" />
        </div>

        {/* DESKTOP-LIKE TABLE HEADER */}

        <div className="hidden border-b border-zinc-200/80 bg-[#F8FAFC] px-5 py-3.5 lg:grid lg:grid-cols-[1.5fr_1fr_1fr_0.7fr_1fr] lg:gap-5">
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="h-2.5 animate-pulse rounded-full bg-zinc-200/80"
              style={{
                width:
                  index === 0
                    ? "90px"
                    : "65px",
              }}
            />
          ))}
        </div>

        {/* ROWS */}

        <div className="divide-y divide-zinc-200/70">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-16 animate-pulse items-center gap-4 px-4 py-3 sm:px-5"
            >
              {/* AVATAR */}

              <div
                className="h-9 w-9 shrink-0 rounded-xl border"
                style={{
                  borderColor: `${theme.accent}10`,
                  backgroundColor:
                    theme.accentSoft,
                  opacity: 0.55,
                }}
              />

              {/* PRIMARY INFO */}

              <div className="min-w-0 flex-1">
                <div
                  className="h-3 rounded-full bg-zinc-200/80"
                  style={{
                    width:
                      index % 2 === 0
                        ? "144px"
                        : "118px",
                    maxWidth: "70%",
                  }}
                />

                <div
                  className="mt-2 h-2.5 rounded-full bg-zinc-100"
                  style={{
                    width:
                      index % 3 === 0
                        ? "96px"
                        : "78px",
                  }}
                />
              </div>

              {/* SECONDARY DESKTOP ITEMS */}

              <div className="hidden h-8 w-20 rounded-xl bg-[#F8FAFC] sm:block" />

              <div className="hidden h-8 w-14 rounded-lg bg-zinc-100 md:block" />

              <div className="hidden h-8 w-8 rounded-lg bg-zinc-100 lg:block" />
            </div>
          ))}
        </div>

        {/* PAGINATION SKELETON */}

        <div className="flex items-center justify-between border-t border-zinc-200/80 bg-[#FCFCFD] px-4 py-4 sm:px-5">
          <div className="h-3 w-32 animate-pulse rounded-full bg-zinc-200/80" />

          <div className="flex gap-1.5">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className={`h-9 animate-pulse rounded-xl border border-zinc-200/90 bg-white shadow-sm ${
                  index === 2
                    ? "w-[76px]"
                    : "w-9"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   BAR CHART SKELETON
========================================================== */

function BarChartSkeleton() {
  const heights = [
    "42%",
    "68%",
    "52%",
    "82%",
    "60%",
    "74%",
  ];

  return (
    <div className="relative flex h-full w-full items-end gap-3 rounded-2xl border border-zinc-200/70 bg-[#F8FAFC] px-5 pb-5 pt-8">
      {/* GRID */}

      <div className="pointer-events-none absolute inset-x-5 top-[25%] border-t border-dashed border-zinc-200" />

      <div className="pointer-events-none absolute inset-x-5 top-[50%] border-t border-dashed border-zinc-200" />

      <div className="pointer-events-none absolute inset-x-5 top-[75%] border-t border-dashed border-zinc-200" />

      {/* BARS */}

      {heights.map(
        (height, index) => (
          <div
            key={index}
            className="relative z-10 flex h-full flex-1 items-end"
          >
            <div
              className="w-full rounded-t-lg bg-zinc-200/80"
              style={{
                height,
              }}
            />
          </div>
        )
      )}
    </div>
  );
}

/* ==========================================================
   DONUT CHART SKELETON
========================================================== */

function DonutChartSkeleton({
  theme,
}) {
  return (
    <div className="flex w-full items-center justify-center gap-8">
      {/* DONUT */}

      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(
            ${theme.accent}35 0deg 80deg,
            #E4E4E7 80deg 155deg,
            ${theme.accent}20 155deg 235deg,
            #F4F4F5 235deg 305deg,
            ${theme.accent}15 305deg 360deg
          )`,
        }}
      >
        <div className="absolute inset-[30px] rounded-full border border-zinc-100 bg-white" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-10 rounded-full bg-zinc-200/80" />
        </div>
      </div>

      {/* LEGEND */}

      <div className="hidden w-32 space-y-3 sm:block">
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-2"
          >
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  index % 2 === 0
                    ? `${theme.accent}45`
                    : "#D4D4D8",
              }}
            />

            <div
              className="h-2.5 rounded-full bg-zinc-200/80"
              style={{
                width:
                  index % 2 === 0
                    ? "70px"
                    : "54px",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}