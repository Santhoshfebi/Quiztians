import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "../supabaseClient";

import AdminLayout from "../components/admin/AdminLayout";

import ResultsHero from "../components/admin/results/ResultsHero";
import ResultsStats from "../components/admin/results/ResultsStats";
import ResultsCharts from "../components/admin/results/ResultsCharts";
import ResultsFilters from "../components/admin/results/ResultsFilters";
import ResultsTable from "../components/admin/results/ResultsTable";
import ResultsLoading from "../components/admin/results/ResultsLoading";
import SuperAdminOnlyState from "../components/admin/results/SuperAdminOnlyState";
import ResetResultsDialog from "../components/admin/results/ResetResultsDialog";
import ResetParticipantDialog from "../components/admin/results/ResetParticipantDialog";

import {
  createResultsCSV,
  filterResults,
  getDisplayRows,
  getDuplicatePhones,
  getResultsCSVFilename,
  getUniqueOptions,
} from "../utils/resultsHelpers";

/* ==========================================================
   VIEW RESULTS
========================================================== */

export default function ViewResults() {
  /* ========================================================
     DATA
  ======================================================== */

  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ========================================================
     FILTERS
  ======================================================== */

  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState([]);
  const [languageFilter, setLanguageFilter] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showHighestScore, setShowHighestScore] = useState(false);

  /* ========================================================
     RESET DIALOGS
  ======================================================== */

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const [selectedResetChapter, setSelectedResetChapter] =
    useState("");

  /*
   * Individual reset stores:
   *
   * {
   *   phone,
   *   chapter,
   *   name
   * }
   */
  const [individualReset, setIndividualReset] = useState(null);

  const [resetting, setResetting] = useState(false);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* ========================================================
     FETCH RESULTS
  ======================================================== */

  const fetchResults = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setAllRows(data || []);
    } catch (error) {
      console.error("Fetch results error:", error);

      toast.error(
        error?.message || "Failed to load results"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ========================================================
     INITIAL FETCH + REALTIME
  ======================================================== */

  useEffect(() => {
    fetchResults();

    const channel = supabase
      .channel("results_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "results",
        },
        () => {
          fetchResults({
            silent: true,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ========================================================
     FILTER OPTIONS
  ======================================================== */

  const chapterOptions = useMemo(
    () => getUniqueOptions(allRows, "chapter"),
    [allRows]
  );

  const languageOptions = useMemo(
    () => getUniqueOptions(allRows, "language"),
    [allRows]
  );

  const placeOptions = useMemo(
    () => getUniqueOptions(allRows, "place"),
    [allRows]
  );

  /* ========================================================
     FILTERED RESULTS
  ======================================================== */

  const filteredRows = useMemo(
    () =>
      filterResults(allRows, {
        search,
        chapterFilter,
        languageFilter,
        placeFilter,
        showHighestScore,
      }),
    [
      allRows,
      search,
      chapterFilter,
      languageFilter,
      placeFilter,
      showHighestScore,
    ]
  );

  /* ========================================================
     DUPLICATE PHONE NUMBERS
  ======================================================== */

  const duplicatePhones = useMemo(
    () => getDuplicatePhones(filteredRows),
    [filteredRows]
  );

  /* ========================================================
     DISPLAY ROWS

     Duplicate mode only changes the visible table.

     filteredRows remains unchanged so CSV export continues
     exporting the complete filtered result set.
  ======================================================== */

  const displayRows = useMemo(
    () =>
      getDisplayRows(
        filteredRows,
        duplicatePhones,
        showDuplicates
      ),
    [
      filteredRows,
      duplicatePhones,
      showDuplicates,
    ]
  );

  /* ========================================================
     RESET PAGINATION WHEN FILTERS CHANGE
  ======================================================== */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    chapterFilter,
    languageFilter,
    placeFilter,
    showDuplicates,
    showHighestScore,
    pageSize,
  ]);

  /* ========================================================
     CLEAR FILTERS
  ======================================================== */

  const clearFilters = () => {
    setSearch("");
    setChapterFilter([]);
    setLanguageFilter("");
    setPlaceFilter("");
    setShowDuplicates(false);
    setShowHighestScore(false);
  };

  /* ========================================================
     CSV EXPORT
  ======================================================== */

  const handleCSVExport = () => {
    if (!filteredRows.length) {
      toast.error("No results available to export");
      return;
    }

    try {
      /*
       * IMPORTANT:
       *
       * Export filteredRows, not displayRows.
       *
       * "Show Duplicates" only changes what is displayed
       * inside the results table.
       */

      const csvContent = createResultsCSV(filteredRows);

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = getResultsCSVFilename();

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success(
        `${filteredRows.length} results exported`
      );
    } catch (error) {
      console.error("CSV export error:", error);

      toast.error("Failed to export results");
    }
  };

  /* ========================================================
     RESET RESULTS

     phone + chapter
       -> Reset participant results only for that chapter

     chapter only
       -> Reset all results for that chapter

     neither
       -> Reset all results
  ======================================================== */

  const handleResetAttempt = async (
    phone = null,
    chapter = null
  ) => {
    if (resetting) {
      return;
    }

    setResetting(true);

    try {
      let query = supabase
        .from("results")
        .delete();

      /* ====================================================
         INDIVIDUAL PARTICIPANT + CHAPTER
      ==================================================== */

      if (phone) {
        const normalizedPhone = String(phone).trim();

        const normalizedChapter = String(
          chapter || ""
        ).trim();

        if (!normalizedPhone) {
          throw new Error(
            "Phone number is required."
          );
        }

        if (!normalizedChapter) {
          throw new Error(
            "Chapter is required when resetting a participant."
          );
        }

        /*
         * IMPORTANT:
         *
         * Reset only:
         *
         * phone + chapter
         *
         * The participant's results in other chapters
         * remain untouched.
         */

        query = query
          .eq("phone", normalizedPhone)
          .eq("chapter", normalizedChapter);
      }

      /* ====================================================
         RESET ENTIRE CHAPTER
      ==================================================== */

      else if (
        chapter &&
        chapter !== "All"
      ) {
        query = query.eq(
          "chapter",
          chapter
        );
      }

      /* ====================================================
         RESET ALL RESULTS

         When neither phone nor chapter is supplied, the
         delete remains the intentional global reset.
      ==================================================== */

      const { error } = await query;

      if (error) {
        throw error;
      }

      /* ====================================================
         SUCCESS MESSAGE
      ==================================================== */

      if (phone && chapter) {
        toast.success(
          "Participant chapter result reset successfully"
        );
      } else if (chapter) {
        toast.success(
          "Chapter results reset successfully"
        );
      } else {
        toast.success(
          "All results reset successfully"
        );
      }

      /* ====================================================
         CLOSE RESET DIALOGS
      ==================================================== */

      setResetDialogOpen(false);
      setSelectedResetChapter("");
      setIndividualReset(null);

      /* ====================================================
         REFRESH RESULTS
      ==================================================== */

      await fetchResults({
        silent: true,
      });
    } catch (error) {
      console.error(
        "Reset results error:",
        error
      );

      toast.error(
        error?.message || "Failed to reset result"
      );
    } finally {
      setResetting(false);
    }
  };

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <AdminLayout
      title="Results"
      eyebrow="Analytics"
    >
      {({ theme, isSuperAdmin }) => {
        /* ==================================================
           SUPERADMIN ACCESS
        ================================================== */

        if (!isSuperAdmin) {
          return (
            <>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "#18181B",
                    color: "#F4F4F5",
                    border:
                      "1px solid rgba(255,255,255,.07)",
                    borderRadius: "14px",
                    fontSize: "13px",
                  },
                }}
              />

              <SuperAdminOnlyState
                theme={theme}
              />
            </>
          );
        }

        return (
          <>
            {/* ===============================================
                TOASTER
            =============================================== */}

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,

                style: {
                  background: "#18181B",
                  color: "#F4F4F5",
                  border:
                    "1px solid rgba(255,255,255,.07)",
                  borderRadius: "14px",
                  fontSize: "13px",
                },
              }}
            />

            {/* ===============================================
                HERO
            =============================================== */}

            <ResultsHero
              filteredCount={
                filteredRows.length
              }
              totalCount={
                allRows.length
              }
              refreshing={
                refreshing
              }
              onRefresh={() =>
                fetchResults({
                  silent: true,
                })
              }
              onExport={
                handleCSVExport
              }
              onReset={() =>
                setResetDialogOpen(true)
              }
              theme={theme}
            />

            {/* ===============================================
                RESULTS CONTENT
            =============================================== */}

            {loading ? (
              <ResultsLoading
                theme={theme}
              />
            ) : (
              <>
                {/* ===========================================
                    STATS
                =========================================== */}

                <ResultsStats
                  allRows={allRows}
                  theme={theme}
                />

                {/* ===========================================
                    CHARTS
                =========================================== */}

                <ResultsCharts
                  allRows={allRows}
                  theme={theme}
                />

                {/* ===========================================
                    FILTERS
                =========================================== */}

                <ResultsFilters
                  search={search}
                  setSearch={setSearch}
                  chapterFilter={
                    chapterFilter
                  }
                  setChapterFilter={
                    setChapterFilter
                  }
                  languageFilter={
                    languageFilter
                  }
                  setLanguageFilter={
                    setLanguageFilter
                  }
                  placeFilter={
                    placeFilter
                  }
                  setPlaceFilter={
                    setPlaceFilter
                  }
                  showDuplicates={
                    showDuplicates
                  }
                  setShowDuplicates={
                    setShowDuplicates
                  }
                  showHighestScore={
                    showHighestScore
                  }
                  setShowHighestScore={
                    setShowHighestScore
                  }
                  chapterOptions={
                    chapterOptions
                  }
                  languageOptions={
                    languageOptions
                  }
                  placeOptions={
                    placeOptions
                  }
                  clearFilters={
                    clearFilters
                  }
                  theme={theme}
                />

                {/* ===========================================
                    TABLE
                =========================================== */}

                <ResultsTable
                  rows={displayRows}
                  filteredRows={
                    filteredRows
                  }
                  duplicatePhones={
                    duplicatePhones
                  }
                  showDuplicates={
                    showDuplicates
                  }
                  page={page}
                  setPage={setPage}
                  pageSize={pageSize}
                  setPageSize={
                    setPageSize
                  }
                  onResetIndividual={(
                    participant
                  ) => {
                    setIndividualReset(
                      participant
                    );
                  }}
                  theme={theme}
                />
              </>
            )}

            {/* ===============================================
                RESET ALL / CHAPTER DIALOG
            =============================================== */}

            <ResetResultsDialog
              open={
                resetDialogOpen
              }
              onClose={() => {
                if (!resetting) {
                  setResetDialogOpen(
                    false
                  );
                }
              }}
              selectedChapter={
                selectedResetChapter
              }
              setSelectedChapter={
                setSelectedResetChapter
              }
              chapters={
                chapterOptions
              }
              resetting={
                resetting
              }
              onConfirm={() =>
                handleResetAttempt(
                  null,
                  selectedResetChapter
                )
              }
              theme={theme}
            />

            {/* ===============================================
                PARTICIPANT + CHAPTER RESET DIALOG
            =============================================== */}

            <ResetParticipantDialog
              open={Boolean(
                individualReset
              )}
              phone={
                individualReset?.phone
              }
              chapter={
                individualReset?.chapter
              }
              name={
                individualReset?.name
              }
              resetting={
                resetting
              }
              onClose={() => {
                if (!resetting) {
                  setIndividualReset(
                    null
                  );
                }
              }}
              onConfirm={() =>
                handleResetAttempt(
                  individualReset?.phone,
                  individualReset?.chapter
                )
              }
              theme={theme}
            />
          </>
        );
      }}
    </AdminLayout>
  );
}