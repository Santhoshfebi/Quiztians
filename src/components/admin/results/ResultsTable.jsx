import {
  useEffect,
  useMemo,
} from "react";

import { motion } from "framer-motion";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  MapPin,
  RotateCcw,
  UserRound,
} from "lucide-react";

import toast from "react-hot-toast";

/* ==========================================================
   RESULTS TABLE
========================================================== */

export default function ResultsTable({
  rows,
  filteredRows,
//   duplicatePhones,
  showDuplicates,
  page,
  setPage,
  pageSize,
  setPageSize,
  onResetIndividual,
  theme,
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / pageSize)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [
    page,
    totalPages,
    setPage,
  ]);

  const paginatedRows = useMemo(() => {
    const start =
      (page - 1) * pageSize;

    return rows.slice(
      start,
      start + pageSize
    );
  }, [
    rows,
    page,
    pageSize,
  ]);

  const firstVisible =
    rows.length === 0
      ? 0
      : (page - 1) *
          pageSize +
        1;

  const lastVisible = Math.min(
    page * pageSize,
    rows.length
  );

  return (
    <section className="mt-4 w-full min-w-0 overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-4 border-b border-zinc-200/80 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-black text-zinc-900">
              Result Records
            </h3>

            <MiniBadge>
              {rows.length} shown
            </MiniBadge>
          </div>

          <p className="mt-1.5 text-[12px] leading-5 text-zinc-500">
            {showDuplicates
              ? `Showing duplicate attempts from ${filteredRows.length} filtered records.`
              : `${filteredRows.length} records match the current filters.`}
          </p>
        </div>

        {/* ================================================
            ROW SIZE
        ================================================ */}

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-500">
            Rows
          </span>

          <div className="relative">
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(
                  Number(
                    event.target.value
                  )
                );

                setPage(1);
              }}
              className="h-9 appearance-none rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3 pr-8 text-[12px] font-bold text-zinc-700 outline-none transition [color-scheme:light] hover:border-zinc-300 focus:border-zinc-400 focus:bg-white"
            >
              <option value={10}>
                10
              </option>

              <option value={25}>
                25
              </option>

              <option value={50}>
                50
              </option>

              <option value={100}>
                100
              </option>
            </select>

            <ChevronDownIndicator />
          </div>
        </div>
      </div>

      {/* ==================================================
          EMPTY
      ================================================== */}

      {!rows.length ? (
        <EmptyResults
          showDuplicates={
            showDuplicates
          }
          theme={theme}
        />
      ) : (
        <>
          {/* ==================================================
              DESKTOP TABLE
          ================================================== */}

          <div className="hidden w-full min-w-0 lg:block">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[18%]" />
                <col className="w-[13%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
                <col className="w-[8%]" />
              </colgroup>

              <thead>
                <tr className="border-b border-zinc-200/80 bg-[#F8FAFC]">
                  <TableHead>
                    #
                  </TableHead>

                  <TableHead>
                    Participant
                  </TableHead>

                  <TableHead>
                    Phone
                  </TableHead>

                  <TableHead>
                    Place
                  </TableHead>

                  <TableHead>
                    Score
                  </TableHead>

                  <TableHead>
                    Chapter
                  </TableHead>

                  <TableHead>
                    Language
                  </TableHead>

                  <TableHead>
                    Attempt
                  </TableHead>

                  <TableHead className="text-right">
                    Action
                  </TableHead>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map(
                  (row, index) => {
                    const phone =
                      String(
                        row.phone || ""
                      ).trim();

                    const chapter =
                      String(
                        row.chapter ||
                          ""
                      ).trim();

                    const rowNumber =
                      (page - 1) *
                        pageSize +
                      index +
                      1;

                    return (
                      <tr
                        key={
                          row.id ??
                          `${phone}-${chapter}-${row.created_at}-${index}`
                        }
                        className="border-b border-zinc-200/70 bg-white transition last:border-b-0 hover:bg-[#F8FAFC]"
                      >
                        {/* ==================================
                            NUMBER
                        ================================== */}

                        <TableCell>
                          <span className="block truncate text-[11px] font-black text-zinc-400">
                            {String(
                              rowNumber
                            ).padStart(
                              2,
                              "0"
                            )}
                          </span>
                        </TableCell>

                        {/* ==================================
                            PARTICIPANT
                        ================================== */}

                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <ParticipantAvatar
                              name={
                                row.name
                              }
                              theme={
                                theme
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-[13px] font-black text-zinc-900"
                                title={
                                  row.name ||
                                  "Unknown"
                                }
                              >
                                {row.name ||
                                  "Unknown"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* ==================================
                            PHONE
                        ================================== */}

                        <TableCell>
                          <span
                            className="block w-full truncate text-[12px] font-semibold text-zinc-600"
                            title={
                              phone ||
                              undefined
                            }
                          >
                            {phone ||
                              "—"}
                          </span>
                        </TableCell>

                        {/* ==================================
                            PLACE
                        ================================== */}

                        <TableCell>
                          <div className="flex min-w-0 items-center gap-1.5">
                            <MapPin
                              size={12}
                              className="shrink-0 text-zinc-400"
                            />

                            <span
                              className="min-w-0 flex-1 truncate text-[12px] font-semibold text-zinc-600"
                              title={
                                row.place ||
                                undefined
                              }
                            >
                              {row.place ||
                                "—"}
                            </span>
                          </div>
                        </TableCell>

                        {/* ==================================
                            SCORE
                        ================================== */}

                        <TableCell>
                          <ScoreDisplay
                            score={
                              row.score
                            }
                            theme={
                              theme
                            }
                          />
                        </TableCell>

                        {/* ==================================
                            CHAPTER
                        ================================== */}

                        <TableCell>
                          <span
                            className="block w-full truncate text-[12px] font-bold text-zinc-700"
                            title={
                              chapter ||
                              undefined
                            }
                          >
                            {chapter ||
                              "—"}
                          </span>
                        </TableCell>

                        {/* ==================================
                            LANGUAGE
                        ================================== */}

                        <TableCell>
                          <div className="min-w-0">
                            <LanguageBadge
                              language={
                                row.language
                              }
                            />
                          </div>
                        </TableCell>

                        {/* ==================================
                            ATTEMPT
                        ================================== */}

                        <TableCell>
                          <div className="min-w-0">
                            <p
                              className="truncate text-[11px] font-semibold text-zinc-600"
                              title={
                                row.created_at
                                  ? `${formatDate(
                                      row.created_at
                                    )} ${formatTime(
                                      row.created_at
                                    )}`
                                  : undefined
                              }
                            >
                              {formatDate(
                                row.created_at
                              )}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-zinc-400">
                              {formatTime(
                                row.created_at
                              )}
                            </p>
                          </div>
                        </TableCell>

                        {/* ==================================
                            ACTIONS
                        ================================== */}

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* COPY */}

                            <button
                              type="button"
                              aria-label="Copy phone number"
                              title="Copy phone number"
                              disabled={
                                !phone
                              }
                              onClick={() =>
                                copyToClipboard(
                                  phone
                                )
                              }
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/90 bg-[#F8FAFC] text-zinc-500 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Copy
                                size={
                                  13
                                }
                              />
                            </button>

                            {/* RESET ONLY THIS PHONE + CHAPTER */}

                            <button
                              type="button"
                              aria-label={`Reset ${
                                row.name ||
                                phone ||
                                "participant"
                              } for ${
                                chapter ||
                                "chapter"
                              }`}
                              title="Reset this chapter attempt"
                              disabled={
                                !phone ||
                                !chapter
                              }
                              onClick={() =>
                                onResetIndividual(
                                  {
                                    phone,
                                    chapter,
                                    name:
                                      row.name ||
                                      "",
                                  }
                                )
                              }
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <RotateCcw
                                size={
                                  13
                                }
                              />
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================
              MOBILE / TABLET
          ================================================== */}

          <div className="divide-y divide-zinc-200/80 lg:hidden">
            {paginatedRows.map(
              (row, index) => {
                const phone =
                  String(
                    row.phone || ""
                  ).trim();

                const chapter =
                  String(
                    row.chapter || ""
                  ).trim();

                const rowNumber =
                  (page - 1) *
                    pageSize +
                  index +
                  1;

                return (
                  <motion.article
                    key={
                      row.id ??
                      `${phone}-${chapter}-${row.created_at}-${index}`
                    }
                    initial={{
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        Math.min(
                          index,
                          8
                        ) * 0.025,
                    }}
                    className="bg-white p-4 transition hover:bg-[#FCFCFD]"
                  >
                    {/* ======================================
                        TOP
                    ====================================== */}

                    <div className="flex items-start gap-3">
                      <ParticipantAvatar
                        name={
                          row.name
                        }
                        theme={
                          theme
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-[14px] font-black text-zinc-900"
                              title={
                                row.name ||
                                "Unknown"
                              }
                            >
                              {row.name ||
                                "Unknown"}
                            </p>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-zinc-400">
                                #
                                {String(
                                  rowNumber
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </span>

                              <LanguageBadge
                                language={
                                  row.language
                                }
                              />
                            </div>
                          </div>

                          <ScoreDisplay
                            score={
                              row.score
                            }
                            theme={
                              theme
                            }
                            compact
                          />
                        </div>
                      </div>
                    </div>

                    {/* ======================================
                        DETAILS
                    ====================================== */}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileDetail
                        label="Phone"
                        value={
                          phone ||
                          "—"
                        }
                      />

                      <MobileDetail
                        label="Place"
                        value={
                          row.place ||
                          "—"
                        }
                      />

                      <MobileDetail
                        label="Chapter"
                        value={
                          chapter ||
                          "—"
                        }
                      />

                      <MobileDetail
                        label="Attempt"
                        value={formatDate(
                          row.created_at
                        )}
                        secondary={formatTime(
                          row.created_at
                        )}
                      />
                    </div>

                    {/* ======================================
                        ACTIONS
                    ====================================== */}

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Copy phone number"
                        title="Copy phone number"
                        disabled={
                          !phone
                        }
                        onClick={() =>
                          copyToClipboard(
                            phone
                          )
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-[#F8FAFC] text-zinc-500 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Copy
                          size={14}
                        />
                      </button>

                      <button
                        type="button"
                        aria-label={`Reset ${
                          row.name ||
                          phone ||
                          "participant"
                        } for ${
                          chapter ||
                          "chapter"
                        }`}
                        title="Reset this chapter attempt"
                        disabled={
                          !phone ||
                          !chapter
                        }
                        onClick={() =>
                          onResetIndividual(
                            {
                              phone,
                              chapter,
                              name:
                                row.name ||
                                "",
                            }
                          )
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <RotateCcw
                          size={14}
                        />
                      </button>
                    </div>
                  </motion.article>
                );
              }
            )}
          </div>

          {/* ==================================================
              PAGINATION
          ================================================== */}

          <ResultsPagination
            page={page}
            setPage={setPage}
            totalPages={
              totalPages
            }
            firstVisible={
              firstVisible
            }
            lastVisible={
              lastVisible
            }
            totalRows={
              rows.length
            }
          />
        </>
      )}
    </section>
  );
}

/* ==========================================================
   TABLE HEAD
========================================================== */

function TableHead({
  children,
  className = "",
}) {
  return (
    <th
      className={`min-w-0 overflow-hidden px-2 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.04em] text-zinc-500 xl:px-2.5 2xl:px-3 ${className}`}
    >
      <span className="block truncate">
        {children}
      </span>
    </th>
  );
}

/* ==========================================================
   TABLE CELL
========================================================== */

function TableCell({
  children,
  className = "",
}) {
  return (
    <td
      className={`min-w-0 overflow-hidden px-2 py-4 align-middle xl:px-2.5 2xl:px-3 ${className}`}
    >
      {children}
    </td>
  );
}

/* ==========================================================
   PARTICIPANT AVATAR
========================================================== */

function ParticipantAvatar({
  name,
  theme,
}) {
  const initial = String(
    name || "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[12px] font-black shadow-sm 2xl:h-10 2xl:w-10 2xl:text-[13px]"
      style={{
        borderColor:
          `${theme.accent}20`,
        backgroundColor:
          theme.accentSoft,
        color: theme.accent,
      }}
    >
      {initial || (
        <UserRound size={16} />
      )}
    </div>
  );
}

/* ==========================================================
   SCORE
========================================================== */

function ScoreDisplay({
  score,
  theme,
  compact = false,
}) {
  const value = Number(
    score || 0
  );

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border font-black ${
        compact
          ? "min-w-[42px] px-2.5 py-1.5 text-[13px]"
          : "min-w-[38px] px-2 py-1.5 text-[12px] 2xl:text-[13px]"
      }`}
      style={{
        borderColor:
          `${theme.accent}20`,
        backgroundColor:
          theme.accentSoft,
        color: theme.accent,
      }}
    >
      {value}
    </span>
  );
}

/* ==========================================================
   LANGUAGE BADGE
========================================================== */

function LanguageBadge({
  language,
}) {
  if (!language) {
    return (
      <span className="text-[11px] text-zinc-400">
        —
      </span>
    );
  }

  const original =
    String(language);

  const value =
    original.toLowerCase();

  const isTamil =
    value === "ta" ||
    value.includes("tamil");

  const isEnglish =
    value === "en" ||
    value.includes("english");

  const label = isTamil
    ? "Tamil"
    : isEnglish
      ? "English"
      : original;

  return (
    <span
      title={label}
      className={`inline-block max-w-full truncate rounded-full border px-2 py-1 text-[11px] font-black ${
        isTamil
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-sky-200 bg-sky-50 text-sky-700"
      }`}
    >
      {label}
    </span>
  );
}

/* ==========================================================
   MINI BADGE
========================================================== */

function MiniBadge({
  children,
}) {
  return (
    <span className="inline-flex rounded-full border border-zinc-200/90 bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-black text-zinc-600">
      {children}
    </span>
  );
}

/* ==========================================================
   MOBILE DETAIL
========================================================== */

function MobileDetail({
  label,
  value,
  secondary,
}) {
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200/80 bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.06em] text-zinc-400">
        {label}
      </p>

      <p
        className="mt-1.5 truncate text-[12px] font-bold text-zinc-700"
        title={
          value !== "—"
            ? String(value)
            : undefined
        }
      >
        {value}
      </p>

      {secondary && (
        <p className="mt-1 truncate text-[11px] text-zinc-500">
          {secondary}
        </p>
      )}
    </div>
  );
}

/* ==========================================================
   PAGINATION
========================================================== */

function ResultsPagination({
  page,
  setPage,
  totalPages,
  firstVisible,
  lastVisible,
  totalRows,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200/80 bg-[#FCFCFD] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-[12px] font-semibold text-zinc-500">
        Showing{" "}
        <span className="font-black text-zinc-900">
          {firstVisible}
        </span>
        {" – "}
        <span className="font-black text-zinc-900">
          {lastVisible}
        </span>{" "}
        of{" "}
        <span className="font-black text-zinc-900">
          {totalRows}
        </span>
      </p>

      <div className="flex items-center gap-1.5">
        <PaginationButton
          label="First page"
          disabled={page === 1}
          onClick={() =>
            setPage(1)
          }
        >
          <ChevronsLeft
            size={15}
          />
        </PaginationButton>

        <PaginationButton
          label="Previous page"
          disabled={page === 1}
          onClick={() =>
            setPage(
              (previous) =>
                Math.max(
                  1,
                  previous - 1
                )
            )
          }
        >
          <ChevronLeft
            size={15}
          />
        </PaginationButton>

        <div className="flex h-9 min-w-[76px] items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-2.5 text-[12px] font-bold text-zinc-500 shadow-sm sm:min-w-[82px] sm:px-3">
          <span className="text-zinc-900">
            {page}
          </span>

          <span className="mx-1 text-zinc-300">
            /
          </span>

          {totalPages}
        </div>

        <PaginationButton
          label="Next page"
          disabled={
            page === totalPages
          }
          onClick={() =>
            setPage(
              (previous) =>
                Math.min(
                  totalPages,
                  previous + 1
                )
            )
          }
        >
          <ChevronRight
            size={15}
          />
        </PaginationButton>

        <PaginationButton
          label="Last page"
          disabled={
            page === totalPages
          }
          onClick={() =>
            setPage(totalPages)
          }
        >
          <ChevronsRight
            size={15}
          />
        </PaginationButton>
      </div>
    </div>
  );
}

/* ==========================================================
   PAGINATION BUTTON
========================================================== */

function PaginationButton({
  children,
  onClick,
  disabled,
  label,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-500 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
    >
      {children}
    </button>
  );
}

/* ==========================================================
   EMPTY RESULTS
========================================================== */

function EmptyResults({
  showDuplicates,
  theme,
}) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center px-5 py-12 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{
          borderColor:
            showDuplicates
              ? "#FDE68A"
              : `${theme.accent}18`,

          backgroundColor:
            showDuplicates
              ? "#FFFBEB"
              : theme.accentSoft,

          color:
            showDuplicates
              ? "#D97706"
              : theme.accent,
        }}
      >
        {showDuplicates ? (
          <AlertTriangle
            size={23}
          />
        ) : (
          <UserRound
            size={23}
          />
        )}
      </div>

      <h4 className="mt-4 text-[15px] font-black text-zinc-800">
        {showDuplicates
          ? "No duplicate attempts"
          : "No results found"}
      </h4>

      <p className="mt-2 max-w-sm text-[12px] leading-5 text-zinc-500">
        {showDuplicates
          ? "No phone numbers in the current filtered results have multiple attempts."
          : "No result records match the filters you currently have selected."}
      </p>
    </div>
  );
}

/* ==========================================================
   SELECT CHEVRON
========================================================== */

function ChevronDownIndicator() {
  return (
    <ChevronRight
      size={13}
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-zinc-400"
    />
  );
}

/* ==========================================================
   COPY PHONE
========================================================== */

async function copyToClipboard(
  value
) {
  if (!value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(
      String(value)
    );

    toast.success(
      "Phone number copied"
    );
  } catch (error) {
    console.error(
      "Clipboard error:",
      error
    );

    toast.error(
      "Unable to copy phone number"
    );
  }
}

/* ==========================================================
   DATE
========================================================== */

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* ==========================================================
   TIME
========================================================== */

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}