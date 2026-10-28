import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

import {
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Edit3,
  FileQuestion,
  Filter,
  Languages,
  RefreshCw,
  Search,
  ShieldCheck,
  SquareCheckBig,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { logAdminActivity } from "../utils/logAdminActivity";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// CONSTANTS
// ===========================================================

const OPTION_KEYS = ["a", "b", "c", "d"];
const QUESTIONS_PER_PAGE = 20;

const LANGUAGE_FILTERS = [
  {
    value: "all",
    label: "All Questions",
    description: "No language filter",
  },
  {
    value: "bilingual",
    label: "Bilingual Ready",
    description: "English + Tamil complete",
  },
  {
    value: "english",
    label: "English Only",
    description: "English available, Tamil missing",
  },
  {
    value: "tamil",
    label: "Tamil Only",
    description: "Tamil available, English missing",
  },
  {
    value: "review",
    label: "Needs Review",
    description: "Missing required bilingual content",
  },
];

const SORT_OPTIONS = [
  {
    value: "id-asc",
    label: "ID: Oldest First",
  },
  {
    value: "id-desc",
    label: "ID: Newest First",
  },
  {
    value: "chapter-asc",
    label: "Chapter: A–Z",
  },
  {
    value: "chapter-desc",
    label: "Chapter: Z–A",
  },
];

// ===========================================================
// HELPERS
// ===========================================================

function hasText(value) {
  return Boolean(String(value ?? "").trim());
}

function hasEnglishQuestion(question) {
  return hasText(question.question_en);
}

function hasTamilQuestion(question) {
  return hasText(question.question_ta);
}

function hasEnglishOptions(question) {
  return OPTION_KEYS.every((key) =>
    hasText(question[`option_${key}_en`])
  );
}

function hasTamilOptions(question) {
  return OPTION_KEYS.every((key) =>
    hasText(question[`option_${key}_ta`])
  );
}

function hasEnglishAnswer(question) {
  return hasText(question.correct_answer);
}

function hasTamilAnswer(question) {
  return hasText(question.correct_answer_ta);
}

function isEnglishComplete(question) {
  return (
    hasEnglishQuestion(question) &&
    hasEnglishOptions(question) &&
    hasEnglishAnswer(question)
  );
}

function isTamilComplete(question) {
  return (
    hasTamilQuestion(question) &&
    hasTamilOptions(question) &&
    hasTamilAnswer(question)
  );
}

function isBilingualReady(question) {
  return (
    isEnglishComplete(question) &&
    isTamilComplete(question)
  );
}

function needsReview(question) {
  return !isBilingualReady(question);
}

function getLanguageStatus(question) {
  const english = isEnglishComplete(question);
  const tamil = isTamilComplete(question);

  if (english && tamil) {
    return {
      key: "bilingual",
      label: "Bilingual Ready",
      tone: "success",
    };
  }

  if (english && !tamil) {
    return {
      key: "english",
      label: "English Only",
      tone: "warning",
    };
  }

  if (!english && tamil) {
    return {
      key: "tamil",
      label: "Tamil Only",
      tone: "warning",
    };
  }

  return {
    key: "review",
    label: "Needs Review",
    tone: "danger",
  };
}

// ===========================================================
// MAIN PAGE
// ===========================================================

export default function QuestionPreviewPage() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [questions, setQuestions] = useState([]);

  const [selectedChapter, setSelectedChapter] =
    useState("");

  const [chapterSearchTerm, setChapterSearchTerm] =
    useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [languageFilter, setLanguageFilter] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("id-asc");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [showTopBtn, setShowTopBtn] =
    useState(false);

  const [chapterMenuOpen, setChapterMenuOpen] =
    useState(false);

  const [languageMenuOpen, setLanguageMenuOpen] =
    useState(false);

  const [sortMenuOpen, setSortMenuOpen] =
    useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState(null);

  // Pagination
  const [currentPage, setCurrentPage] =
    useState(1);

  // =========================================================
  //  DUPLICATE QUESTION
  // =========================================================

  const [duplicateTarget, setDuplicateTarget] =
    useState(null);

  const [duplicatingId, setDuplicatingId] =
    useState(null);

  const [selectedQuestionIds, setSelectedQuestionIds] =
    useState([]);

  const [showBulkDeleteDialog, setShowBulkDeleteDialog] =
    useState(false);

  const [bulkDeleting, setBulkDeleting] =
    useState(false);

  // =========================================================
  // FETCH QUESTIONS
  // =========================================================

  const fetchQuestions = async ({
    showRefreshToast = false,
  } = {}) => {
    try {
      if (showRefreshToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("id", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setQuestions(data || []);

      if (showRefreshToast) {
        toast.success(
          "Question bank refreshed"
        );
      }
    } catch (error) {
      console.error(
        "Failed to load questions:",
        error
      );

      toast.error(
        "Failed to load questions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL FETCH
  // =========================================================

  useEffect(() => {
    fetchQuestions();
  }, []);

  // =========================================================
  // BACK TO TOP
  // =========================================================

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(
        window.scrollY > 500
      );
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    handleScroll();

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  // =========================================================
  // CHAPTERS
  // =========================================================

  const chapters = useMemo(() => {
    return [
      ...new Set(
        questions
          .map((question) =>
            String(
              question.chapter ?? ""
            ).trim()
          )
          .filter(Boolean)
      ),
    ].sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [questions]);

  const chapterCounts = useMemo(() => {
    const counts = {};

    questions.forEach((question) => {
      const chapter = String(
        question.chapter ?? ""
      ).trim();

      if (!chapter) {
        return;
      }

      counts[chapter] =
        (counts[chapter] || 0) + 1;
    });

    return counts;
  }, [questions]);

  const filteredChapters = useMemo(() => {
    const query =
      chapterSearchTerm
        .trim()
        .toLowerCase();

    if (!query) {
      return chapters;
    }

    return chapters.filter((chapter) =>
      chapter
        .toLowerCase()
        .includes(query)
    );
  }, [
    chapters,
    chapterSearchTerm,
  ]);

  // =========================================================
  // QUESTION HEALTH
  // =========================================================

  const questionHealth = useMemo(() => {
    let bilingual = 0;
    let review = 0;
    let englishOnly = 0;
    let tamilOnly = 0;

    questions.forEach((question) => {
      const status =
        getLanguageStatus(question);

      if (
        status.key === "bilingual"
      ) {
        bilingual += 1;
      } else if (
        status.key === "english"
      ) {
        englishOnly += 1;
        review += 1;
      } else if (
        status.key === "tamil"
      ) {
        tamilOnly += 1;
        review += 1;
      } else {
        review += 1;
      }
    });

    return {
      bilingual,
      review,
      englishOnly,
      tamilOnly,
    };
  }, [questions]);

  // =========================================================
  // FILTER + SEARCH + SORT
  // =========================================================

  const filteredQuestions = useMemo(() => {
    let filtered = [
      ...questions,
    ];

    // Chapter
    if (selectedChapter) {
      filtered = filtered.filter(
        (question) =>
          question.chapter ===
          selectedChapter
      );
    }

    // Search
    const query = searchTerm
      .trim()
      .toLowerCase();

    if (query) {
      filtered = filtered.filter(
        (question) => {
          const english = String(
            question.question_en ?? ""
          ).toLowerCase();

          const tamil = String(
            question.question_ta ?? ""
          ).toLowerCase();

          const chapter = String(
            question.chapter ?? ""
          ).toLowerCase();

          const id = String(
            question.id ?? ""
          ).toLowerCase();

          return (
            english.includes(query) ||
            tamil.includes(query) ||
            chapter.includes(query) ||
            id.includes(query)
          );
        }
      );
    }

    // Language filter
    if (
      languageFilter !== "all"
    ) {
      filtered = filtered.filter(
        (question) => {
          const status =
            getLanguageStatus(
              question
            );

          if (
            languageFilter ===
            "review"
          ) {
            return needsReview(
              question
            );
          }

          return (
            status.key ===
            languageFilter
          );
        }
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      if (
        sortBy === "id-desc"
      ) {
        return (
          Number(b.id) -
          Number(a.id)
        );
      }

      if (
        sortBy ===
        "chapter-asc"
      ) {
        return String(
          a.chapter ?? ""
        ).localeCompare(
          String(
            b.chapter ?? ""
          ),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      }

      if (
        sortBy ===
        "chapter-desc"
      ) {
        return String(
          b.chapter ?? ""
        ).localeCompare(
          String(
            a.chapter ?? ""
          ),
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      }

      return (
        Number(a.id) -
        Number(b.id)
      );
    });

    return filtered;
  }, [
    questions,
    selectedChapter,
    searchTerm,
    languageFilter,
    sortBy,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredQuestions.length /
      QUESTIONS_PER_PAGE
    )
  );

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );

  const paginationStart =
    (safeCurrentPage - 1) *
    QUESTIONS_PER_PAGE;

  const paginationEnd =
    paginationStart +
    QUESTIONS_PER_PAGE;

  const paginatedQuestions =
    useMemo(() => {
      return filteredQuestions.slice(
        paginationStart,
        paginationEnd
      );
    }, [
      filteredQuestions,
      paginationStart,
      paginationEnd,
    ]);

  const showingFrom =
    filteredQuestions.length === 0
      ? 0
      : paginationStart + 1;

  const showingTo = Math.min(
    paginationEnd,
    filteredQuestions.length
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedChapter,
    searchTerm,
    languageFilter,
    sortBy,
  ]);

  // Protect against deleting the
  // last question from the final page
  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const handlePageChange = (
    page
  ) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === safeCurrentPage
    ) {
      return;
    }

    setCurrentPage(page);

    window.requestAnimationFrame(
      () => {
        const section =
          document.getElementById(
            "question-results"
          );

        if (!section) {
          return;
        }

        const top =
          section.getBoundingClientRect()
            .top +
          window.scrollY -
          100;

        window.scrollTo({
          top,
          behavior: "smooth",
        });
      }
    );
  };

  const selectedQuestionIdSet = useMemo(
    () => new Set(selectedQuestionIds),
    [selectedQuestionIds]
  );

  const currentPageQuestionIds = useMemo(
    () =>
      paginatedQuestions.map(
        (question) => question.id
      ),
    [paginatedQuestions]
  );

  const selectedCount =
    selectedQuestionIds.length;

  const selectedOnCurrentPage =
    currentPageQuestionIds.filter((id) =>
      selectedQuestionIdSet.has(id)
    ).length;

  const allCurrentPageSelected =
    currentPageQuestionIds.length > 0 &&
    selectedOnCurrentPage ===
    currentPageQuestionIds.length;

  const someCurrentPageSelected =
    selectedOnCurrentPage > 0 &&
    !allCurrentPageSelected;

  const handleToggleQuestionSelection = (
    questionId
  ) => {
    setSelectedQuestionIds((previous) => {
      if (previous.includes(questionId)) {
        return previous.filter(
          (id) => id !== questionId
        );
      }

      return [...previous, questionId];
    });
  };

  const handleSelectCurrentPage = () => {
    setSelectedQuestionIds((previous) => {
      const next = new Set(previous);

      currentPageQuestionIds.forEach((id) => {
        next.add(id);
      });

      return Array.from(next);
    });
  };

  const handleDeselectCurrentPage = () => {
    setSelectedQuestionIds((previous) =>
      previous.filter(
        (id) =>
          !currentPageQuestionIds.includes(id)
      )
    );
  };

  const handleToggleCurrentPage = () => {
    if (allCurrentPageSelected) {
      handleDeselectCurrentPage();
    } else {
      handleSelectCurrentPage();
    }
  };

  const handleClearSelection = () => {
    if (bulkDeleting) return;

    setSelectedQuestionIds([]);
  };

  const handleBulkDeleteRequest = () => {
    if (
      selectedQuestionIds.length === 0 ||
      bulkDeleting
    ) {
      return;
    }

    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteCancel = () => {
    if (bulkDeleting) return;

    setShowBulkDeleteDialog(false);
  };

  const handleBulkDeleteConfirm = async () => {
    if (
      selectedQuestionIds.length === 0 ||
      bulkDeleting
    ) {
      return;
    }

    const idsToDelete = [
      ...selectedQuestionIds,
    ];

    try {
      setBulkDeleting(true);

      const { error } = await supabase
        .from("questions")
        .delete()
        .in("id", idsToDelete);

      if (error) {
        throw error;
      }

      setQuestions((previous) =>
        previous.filter(
          (question) =>
            !idsToDelete.includes(question.id)
        )
      );

      await logAdminActivity({
        action: "BULK_DELETE_QUESTIONS",
        module: "Questions",
        description: `Bulk deleted ${idsToDelete.length} questions from the Question Bank`,
        targetId: idsToDelete.join(","),
        targetType: "question",
      });

      setSelectedQuestionIds([]);
      setShowBulkDeleteDialog(false);

      toast.success(
        `${idsToDelete.length} ${idsToDelete.length === 1
          ? "question"
          : "questions"
        } deleted successfully`
      );
    } catch (error) {
      console.error(
        "Failed to bulk delete questions:",
        error
      );

      toast.error(
        "Failed to delete selected questions"
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    setSelectedQuestionIds((previous) =>
      previous.filter((id) =>
        questions.some(
          (question) => question.id === id
        )
      )
    );
  }, [questions]);

  // =========================================================
  // ACTIVE FILTERS
  // =========================================================

  const hasActiveFilters =
    Boolean(selectedChapter) ||
    Boolean(
      searchTerm.trim()
    ) ||
    languageFilter !== "all" ||
    sortBy !== "id-asc";

  const clearFilters = () => {
    setSelectedChapter("");
    setChapterSearchTerm("");
    setSearchTerm("");
    setLanguageFilter("all");
    setSortBy("id-asc");

    setChapterMenuOpen(false);
    setLanguageMenuOpen(false);
    setSortMenuOpen(false);

    setCurrentPage(1);
  };

  // =========================================================
  // DELETE QUESTION
  // =========================================================

  const handleDeleteRequest = (
    question
  ) => {
    setDeleteTarget(question);
  };

  const handleDeleteCancel = () => {
    if (deletingId) {
      return;
    }

    setDeleteTarget(null);
  };

  const handleDeleteConfirm =
    async () => {
      if (
        !deleteTarget ||
        deletingId
      ) {
        return;
      }

      const questionToDelete =
        deleteTarget;

      try {
        setDeletingId(
          questionToDelete.id
        );

        const { error } =
          await supabase
            .from("questions")
            .delete()
            .eq(
              "id",
              questionToDelete.id
            );

        if (error) {
          throw error;
        }

        setQuestions(
          (previous) =>
            previous.filter(
              (question) =>
                question.id !==
                questionToDelete.id
            )
        );

        await logAdminActivity({
          action:
            "DELETE_QUESTION",
          module: "Questions",
          description: `Deleted question from chapter "${questionToDelete?.chapter}"`,
          targetId:
            questionToDelete.id,
          targetType:
            "question",
        });

        toast.success(
          "Question deleted successfully"
        );

        setDeleteTarget(null);
      } catch (error) {
        console.error(
          "Failed to delete question:",
          error
        );

        toast.error(
          "Failed to delete question"
        );
      } finally {
        setDeletingId(null);
      }
    };

  // =========================================================
  //  DUPLICATE QUESTION
  // =========================================================

  const handleDuplicateRequest = (
    question
  ) => {
    setDuplicateTarget(
      question
    );
  };

  const handleDuplicateCancel =
    () => {
      if (duplicatingId) {
        return;
      }

      setDuplicateTarget(null);
    };

  const handleDuplicateConfirm =
    async () => {
      if (
        !duplicateTarget ||
        duplicatingId
      ) {
        return;
      }

      const sourceQuestion =
        duplicateTarget;

      try {
        setDuplicatingId(
          sourceQuestion.id
        );

        /*
         * IMPORTANT:
         *
         * We deliberately construct
         * the new question instead
         * of spreading the original
         * object.
         *
         * This prevents the original
         * database ID or unrelated
         * generated fields from being
         * copied.
         */

        const duplicateData = {
          chapter:
            sourceQuestion.chapter,

          question_en:
            sourceQuestion.question_en,

          question_ta:
            sourceQuestion.question_ta,

          option_a_en:
            sourceQuestion.option_a_en,

          option_b_en:
            sourceQuestion.option_b_en,

          option_c_en:
            sourceQuestion.option_c_en,

          option_d_en:
            sourceQuestion.option_d_en,

          option_a_ta:
            sourceQuestion.option_a_ta,

          option_b_ta:
            sourceQuestion.option_b_ta,

          option_c_ta:
            sourceQuestion.option_c_ta,

          option_d_ta:
            sourceQuestion.option_d_ta,

          correct_answer:
            sourceQuestion.correct_answer,

          correct_answer_ta:
            sourceQuestion.correct_answer_ta,
        };

        const {
          data,
          error,
        } = await supabase
          .from("questions")
          .insert(
            duplicateData
          )
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "Duplicated question was not returned"
          );
        }

        /*
         * Keep the local Question Bank
         * synchronized even though we're
         * about to navigate to Edit.
         */
        setQuestions(
          (previous) => [
            ...previous,
            data,
          ]
        );

        await logAdminActivity({
          action:
            "DUPLICATE_QUESTION",
          module: "Questions",
          description: `Duplicated question #${sourceQuestion.id} from chapter "${sourceQuestion.chapter}" as question #${data.id}`,
          targetId: data.id,
          targetType:
            "question",
        });

        toast.success(
          "Question duplicated successfully"
        );

        setDuplicateTarget(
          null
        );

        /*
         * Open the NEW record,
         * never the original.
         */
        navigate(
          `/edit-question/${data.id}`
        );
      } catch (error) {
        console.error(
          "Failed to duplicate question:",
          error
        );

        toast.error(
          "Failed to duplicate question"
        );
      } finally {
        setDuplicatingId(
          null
        );
      }
    };


  // =========================================================
  // UI
  // =========================================================

  return (
    <AdminLayout
      title="Question Bank"
      eyebrow="Question Management"
    >
      {({ theme }) => (
        <>
          {/* =================================================
              TOASTER
          ================================================= */}

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,

              style: {
                background: "#FFFFFF",
                color: "#18181B",
                border:
                  "1px solid #E4E4E7",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow:
                  "0 18px 45px rgba(24,24,27,0.12)",
              },

              success: {
                iconTheme: {
                  primary: "#16A34A",
                  secondary: "#FFFFFF",
                },
              },

              error: {
                iconTheme: {
                  primary: "#DC2626",
                  secondary: "#FFFFFF",
                },
              },
            }}
          />

          {/* =================================================
              HERO
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="relative overflow-hidden rounded-[24px] border border-zinc-200/90 bg-white p-5 shadow-[0_10px_30px_rgba(24,24,27,0.07)] sm:p-6 lg:p-7"
          >
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-[100px]"
              style={{
                backgroundColor:
                  `${theme.accent}10`,
              }}
            />

            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
                backgroundSize:
                  "34px 34px",
              }}
            />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileQuestion
                    size={15}
                    style={{
                      color:
                        theme.accent,
                    }}
                  />

                  <p
                    className="text-[11px] font-black uppercase tracking-[0.14em]"
                    style={{
                      color:
                        theme.accent,
                    }}
                  >
                    Question Bank V2
                  </p>
                </div>

                <h2 className="mt-3 text-[26px] font-black tracking-[-0.035em] text-zinc-900 sm:text-[30px] lg:text-[34px]">
                  Manage quiz questions
                </h2>

                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
                  Search, filter, review and
                  manage your English and Tamil
                  quiz questions from one place.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700">
                  <ShieldCheck
                    size={14}
                  />

                  Bilingual Bank
                </div>

                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() =>
                    fetchQuestions({
                      showRefreshToast:
                        true,
                    })
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-3.5 text-[11px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={14}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </button>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard
              label="Total Questions"
              value={questions.length}
              description="Question bank"
              icon={FileQuestion}
              theme={theme}
            />

            <SummaryCard
              label="Chapters"
              value={chapters.length}
              description="Available chapters"
              icon={BookOpen}
              theme={theme}
            />

            <SummaryCard
              label="Bilingual Ready"
              value={
                questionHealth.bilingual
              }
              description="English + Tamil"
              icon={CheckCircle2}
              theme={theme}
              success
            />

            <SummaryCard
              label="Needs Review"
              value={
                questionHealth.review
              }
              description="Incomplete content"
              icon={TriangleAlert}
              theme={theme}
              warning
            />
          </section>

          {/* =================================================
              FILTER PANEL
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.05,
            }}
            className="mt-4 rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.06)] sm:p-5"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Filter
                      size={15}
                      style={{
                        color:
                          theme.accent,
                      }}
                    />

                    <h3 className="text-[14px] font-black text-zinc-900">
                      Find Questions
                    </h3>
                  </div>

                  <p className="mt-1 text-[11px] text-zinc-500">
                    Narrow down the question
                    bank using chapter,
                    language or search.
                  </p>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex h-9 items-center justify-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-bold text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 sm:self-auto"
                  >
                    <X size={13} />

                    Clear Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(200px,0.8fr)_minmax(220px,0.9fr)_minmax(190px,0.75fr)_minmax(260px,1.4fr)]">
                {/* ===========================================
                    CHAPTER FILTER
                =========================================== */}

                <div>
                  <FilterLabel>
                    Chapter
                  </FilterLabel>

                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChapterMenuOpen(
                          (previous) =>
                            !previous
                        );

                        setLanguageMenuOpen(
                          false
                        );

                        setSortMenuOpen(
                          false
                        );
                      }}
                      className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3.5 text-left transition hover:border-zinc-300 hover:bg-white"
                    >
                      <BookOpen
                        size={15}
                        style={{
                          color:
                            theme.accent,
                        }}
                      />

                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-zinc-800">
                        {selectedChapter ||
                          "All Chapters"}
                      </span>

                      <ChevronDown
                        size={15}
                        className={`shrink-0 text-zinc-400 transition-transform ${chapterMenuOpen
                          ? "rotate-180"
                          : ""
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {chapterMenuOpen && (
                        <>
                          <button
                            type="button"
                            aria-label="Close chapter filter"
                            onClick={() =>
                              setChapterMenuOpen(
                                false
                              )
                            }
                            className="fixed inset-0 z-20 cursor-default"
                          />

                          <motion.div
                            initial={{
                              opacity: 0,
                              y: -5,
                              scale: 0.99,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              y: -5,
                              scale: 0.99,
                            }}
                            transition={{
                              duration: 0.15,
                            }}
                            className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(24,24,27,0.14)]"
                          >
                            <div className="border-b border-zinc-100 p-2.5">
                              <div className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-[#F8FAFC] px-3">
                                <Search
                                  size={13}
                                  className="text-zinc-400"
                                />

                                <input
                                  type="text"
                                  value={
                                    chapterSearchTerm
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setChapterSearchTerm(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="Search chapters..."
                                  className="min-w-0 flex-1 bg-transparent text-[11px] font-medium text-zinc-800 outline-none placeholder:text-zinc-400"
                                />
                              </div>
                            </div>

                            <div
                              className="admin-hidden-scrollbar max-h-[270px] overflow-y-auto p-2"
                              style={{
                                scrollbarWidth:
                                  "none",
                                msOverflowStyle:
                                  "none",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChapter(
                                    ""
                                  );

                                  setChapterMenuOpen(
                                    false
                                  );
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${!selectedChapter
                                  ? "bg-zinc-100"
                                  : "hover:bg-zinc-50"
                                  }`}
                              >
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                  style={{
                                    backgroundColor:
                                      !selectedChapter
                                        ? theme.accentSoft
                                        : "#F4F4F5",
                                    color:
                                      !selectedChapter
                                        ? theme.accent
                                        : "#71717A",
                                  }}
                                >
                                  <FileQuestion
                                    size={14}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[11px] font-bold text-zinc-800">
                                    All Chapters
                                  </p>

                                  <p className="mt-0.5 text-[9px] text-zinc-400">
                                    {
                                      questions.length
                                    }{" "}
                                    questions
                                  </p>
                                </div>

                                {!selectedChapter && (
                                  <Check
                                    size={13}
                                    style={{
                                      color:
                                        theme.accent,
                                    }}
                                  />
                                )}
                              </button>

                              {filteredChapters.map(
                                (chapter) => {
                                  const active =
                                    selectedChapter ===
                                    chapter;

                                  return (
                                    <button
                                      key={
                                        chapter
                                      }
                                      type="button"
                                      onClick={() => {
                                        setSelectedChapter(
                                          chapter
                                        );

                                        setChapterMenuOpen(
                                          false
                                        );
                                      }}
                                      className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active
                                        ? "bg-zinc-100"
                                        : "hover:bg-zinc-50"
                                        }`}
                                    >
                                      <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                        style={{
                                          backgroundColor:
                                            active
                                              ? theme.accentSoft
                                              : "#F4F4F5",
                                          color:
                                            active
                                              ? theme.accent
                                              : "#71717A",
                                        }}
                                      >
                                        <BookOpen
                                          size={
                                            14
                                          }
                                        />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`truncate text-[11px] font-bold ${active
                                            ? "text-zinc-900"
                                            : "text-zinc-700"
                                            }`}
                                        >
                                          {
                                            chapter
                                          }
                                        </p>

                                        <p className="mt-0.5 text-[9px] text-zinc-400">
                                          {chapterCounts[
                                            chapter
                                          ] ||
                                            0}{" "}
                                          questions
                                        </p>
                                      </div>

                                      {active && (
                                        <Check
                                          size={
                                            13
                                          }
                                          style={{
                                            color:
                                              theme.accent,
                                          }}
                                        />
                                      )}
                                    </button>
                                  );
                                }
                              )}

                              {filteredChapters.length ===
                                0 && (
                                  <div className="px-3 py-6 text-center">
                                    <p className="text-[11px] font-semibold text-zinc-500">
                                      No chapters
                                      found.
                                    </p>
                                  </div>
                                )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ===========================================
                    LANGUAGE FILTER
                =========================================== */}

                <div>
                  <FilterLabel>
                    Language Status
                  </FilterLabel>

                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguageMenuOpen(
                          (previous) =>
                            !previous
                        );

                        setChapterMenuOpen(
                          false
                        );

                        setSortMenuOpen(
                          false
                        );
                      }}
                      className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3.5 text-left transition hover:border-zinc-300 hover:bg-white"
                    >
                      <Languages
                        size={15}
                        style={{
                          color:
                            theme.accent,
                        }}
                      />

                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-zinc-800">
                        {
                          LANGUAGE_FILTERS.find(
                            (item) =>
                              item.value ===
                              languageFilter
                          )?.label
                        }
                      </span>

                      <ChevronDown
                        size={15}
                        className={`shrink-0 text-zinc-400 transition-transform ${languageMenuOpen
                          ? "rotate-180"
                          : ""
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {languageMenuOpen && (
                        <>
                          <button
                            type="button"
                            aria-label="Close language filter"
                            onClick={() =>
                              setLanguageMenuOpen(
                                false
                              )
                            }
                            className="fixed inset-0 z-20 cursor-default"
                          />

                          <motion.div
                            initial={{
                              opacity: 0,
                              y: -5,
                              scale: 0.99,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              y: -5,
                              scale: 0.99,
                            }}
                            transition={{
                              duration: 0.15,
                            }}
                            className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_18px_50px_rgba(24,24,27,0.14)]"
                          >
                            {LANGUAGE_FILTERS.map(
                              (item) => {
                                const active =
                                  languageFilter ===
                                  item.value;

                                return (
                                  <button
                                    key={
                                      item.value
                                    }
                                    type="button"
                                    onClick={() => {
                                      setLanguageFilter(
                                        item.value
                                      );

                                      setLanguageMenuOpen(
                                        false
                                      );
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active
                                      ? "bg-zinc-100"
                                      : "hover:bg-zinc-50"
                                      }`}
                                  >
                                    <div
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                      style={{
                                        backgroundColor:
                                          active
                                            ? theme.accentSoft
                                            : "#F4F4F5",
                                        color:
                                          active
                                            ? theme.accent
                                            : "#71717A",
                                      }}
                                    >
                                      {item.value ===
                                        "review" ? (
                                        <TriangleAlert
                                          size={
                                            14
                                          }
                                        />
                                      ) : item.value ===
                                        "bilingual" ? (
                                        <CheckCircle2
                                          size={
                                            14
                                          }
                                        />
                                      ) : (
                                        <Languages
                                          size={
                                            14
                                          }
                                        />
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`truncate text-[11px] font-bold ${active
                                          ? "text-zinc-900"
                                          : "text-zinc-700"
                                          }`}
                                      >
                                        {
                                          item.label
                                        }
                                      </p>

                                      <p className="mt-0.5 text-[9px] text-zinc-400">
                                        {
                                          item.description
                                        }
                                      </p>
                                    </div>

                                    {active && (
                                      <Check
                                        size={
                                          13
                                        }
                                        style={{
                                          color:
                                            theme.accent,
                                        }}
                                      />
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ===========================================
                    SORT
                =========================================== */}

                <div>
                  <FilterLabel>
                    Sort By
                  </FilterLabel>

                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSortMenuOpen(
                          (previous) =>
                            !previous
                        );

                        setChapterMenuOpen(
                          false
                        );

                        setLanguageMenuOpen(
                          false
                        );
                      }}
                      className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3.5 text-left transition hover:border-zinc-300 hover:bg-white"
                    >
                      <ArrowUpDown
                        size={15}
                        style={{
                          color:
                            theme.accent,
                        }}
                      />

                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-zinc-800">
                        {
                          SORT_OPTIONS.find(
                            (item) =>
                              item.value ===
                              sortBy
                          )?.label
                        }
                      </span>

                      <ChevronDown
                        size={15}
                        className={`shrink-0 text-zinc-400 transition-transform ${sortMenuOpen
                          ? "rotate-180"
                          : ""
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {sortMenuOpen && (
                        <>
                          <button
                            type="button"
                            aria-label="Close sort menu"
                            onClick={() =>
                              setSortMenuOpen(
                                false
                              )
                            }
                            className="fixed inset-0 z-20 cursor-default"
                          />

                          <motion.div
                            initial={{
                              opacity: 0,
                              y: -5,
                              scale: 0.99,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              y: -5,
                              scale: 0.99,
                            }}
                            transition={{
                              duration: 0.15,
                            }}
                            className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_18px_50px_rgba(24,24,27,0.14)]"
                          >
                            {SORT_OPTIONS.map(
                              (item) => {
                                const active =
                                  sortBy ===
                                  item.value;

                                return (
                                  <button
                                    key={
                                      item.value
                                    }
                                    type="button"
                                    onClick={() => {
                                      setSortBy(
                                        item.value
                                      );

                                      setSortMenuOpen(
                                        false
                                      );
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active
                                      ? "bg-zinc-100"
                                      : "hover:bg-zinc-50"
                                      }`}
                                  >
                                    <div
                                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                      style={{
                                        backgroundColor:
                                          active
                                            ? theme.accentSoft
                                            : "#F4F4F5",
                                        color:
                                          active
                                            ? theme.accent
                                            : "#71717A",
                                      }}
                                    >
                                      <ArrowUpDown
                                        size={
                                          14
                                        }
                                      />
                                    </div>

                                    <span
                                      className={`min-w-0 flex-1 truncate text-[11px] font-bold ${active
                                        ? "text-zinc-900"
                                        : "text-zinc-700"
                                        }`}
                                    >
                                      {
                                        item.label
                                      }
                                    </span>

                                    {active && (
                                      <Check
                                        size={
                                          13
                                        }
                                        style={{
                                          color:
                                            theme.accent,
                                        }}
                                      />
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ===========================================
                    SEARCH
                =========================================== */}

                <div>
                  <FilterLabel>
                    Search
                  </FilterLabel>

                  <div className="relative mt-2">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search ID, chapter, English or Tamil..."
                      className="h-11 w-full rounded-xl border border-zinc-200/90 bg-[#F8FAFC] pl-10 pr-10 text-[12px] font-medium text-zinc-800 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,24,27,0.025)]"
                    />

                    {searchTerm && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() =>
                          setSearchTerm(
                            ""
                          )
                        }
                        className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                      >
                        <X
                          size={13}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ===========================================
                  ACTIVE FILTER CHIPS
              =========================================== */}

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
                    Active
                  </span>

                  {selectedChapter && (
                    <ActiveFilterChip
                      label={
                        selectedChapter
                      }
                      onRemove={() =>
                        setSelectedChapter(
                          ""
                        )
                      }
                    />
                  )}

                  {languageFilter !==
                    "all" && (
                      <ActiveFilterChip
                        label={
                          LANGUAGE_FILTERS.find(
                            (item) =>
                              item.value ===
                              languageFilter
                          )?.label
                        }
                        onRemove={() =>
                          setLanguageFilter(
                            "all"
                          )
                        }
                      />
                    )}

                  {sortBy !==
                    "id-asc" && (
                      <ActiveFilterChip
                        label={
                          SORT_OPTIONS.find(
                            (item) =>
                              item.value ===
                              sortBy
                          )?.label
                        }
                        onRemove={() =>
                          setSortBy(
                            "id-asc"
                          )
                        }
                      />
                    )}

                  {searchTerm.trim() && (
                    <ActiveFilterChip
                      label={`Search: ${searchTerm.trim()}`}
                      onRemove={() =>
                        setSearchTerm(
                          ""
                        )
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </motion.section>

          {/* =================================================
              RESULTS HEADER
          ================================================= */}

          <section
            id="question-results"
            className="mt-4"
          >
            <div className="mb-3 flex flex-col gap-3 rounded-[18px] border border-zinc-200/80 bg-white p-3.5 shadow-[0_6px_18px_rgba(24,24,27,0.035)] sm:p-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                  Question Results
                </p>

                <h3 className="mt-1 text-[17px] font-black text-zinc-900">
                  {selectedChapter
                    ? selectedChapter
                    : "All Questions"}
                </h3>
              </div>

              <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
                {!loading &&
                  paginatedQuestions.length > 0 && (
                    <button
                      type="button"
                      disabled={bulkDeleting}
                      onClick={handleToggleCurrentPage}
                      className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-3.5 text-[10px] font-black transition sm:w-auto ${allCurrentPageSelected
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <SelectionCheckbox
                        checked={allCurrentPageSelected}
                        indeterminate={
                          someCurrentPageSelected
                        }
                        dark={allCurrentPageSelected}
                      />

                      {allCurrentPageSelected
                        ? "Deselect Page"
                        : "Select Page"}
                    </button>
                  )}

                <div className="min-w-0 text-left sm:text-right">
                  <p className="text-[12px] font-medium text-zinc-500">
                    Showing{" "}
                    <span className="font-black text-zinc-900">
                      {showingFrom}
                    </span>
                    {"–"}
                    <span className="font-black text-zinc-900">
                      {showingTo}
                    </span>{" "}
                    of{" "}
                    <span className="font-black text-zinc-900">
                      {filteredQuestions.length}
                    </span>{" "}
                    matching questions
                  </p>

                  {hasActiveFilters && (
                    <p className="mt-1 text-[10px] font-medium text-zinc-400">
                      {questions.length} total in
                      question bank
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ===============================================
                LOADING
            =============================================== */}

            {loading && (
              <QuestionListLoading />
            )}

            {/* ===============================================
                EMPTY STATE
            =============================================== */}

            {!loading &&
              filteredQuestions.length ===
              0 && (
                <EmptyQuestions
                  hasFilters={
                    hasActiveFilters
                  }
                  onClear={
                    clearFilters
                  }
                  theme={theme}
                />
              )}

            {/* ===============================================
                QUESTIONS
            =============================================== */}

            {!loading &&
              filteredQuestions.length >
              0 && (
                <div className="space-y-3">
                  {paginatedQuestions.map(
                    (
                      question,
                      index
                    ) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        number={
                          paginationStart +
                          index +
                          1
                        }
                        theme={theme}
                        deleting={
                          deletingId === question.id
                        }
                        duplicating={
                          duplicatingId === question.id
                        }
                        selected={selectedQuestionIdSet.has(
                          question.id
                        )}
                        selectionDisabled={bulkDeleting}
                        onToggleSelection={() =>
                          handleToggleQuestionSelection(
                            question.id
                          )
                        }
                        onEdit={() =>
                          navigate(
                            `/edit-question/${question.id}`
                          )
                        }
                        onDuplicate={() =>
                          handleDuplicateRequest(
                            question
                          )
                        }
                        onDelete={() =>
                          handleDeleteRequest(
                            question
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
          </section>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            filteredQuestions.length >
            0 &&
            totalPages > 1 && (
              <Pagination
                currentPage={
                  safeCurrentPage
                }
                totalPages={
                  totalPages
                }
                onPageChange={
                  handlePageChange
                }
                theme={theme}
              />
            )}

          {/* =================================================
              BULK ACTION BAR
          ================================================= */}

          <AnimatePresence>
            {selectedCount > 0 && (
              <BulkActionBar
                selectedCount={selectedCount}
                selectedOnCurrentPage={
                  selectedOnCurrentPage
                }
                bulkDeleting={bulkDeleting}
                onClear={handleClearSelection}
                onDelete={
                  handleBulkDeleteRequest
                }
                theme={theme}
              />
            )}
          </AnimatePresence>

          {/* =================================================
              BACK TO TOP
          ================================================= */}

          <AnimatePresence>
            {showTopBtn && (
              <motion.button
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  y: 8,
                }}
                type="button"
                aria-label="Back to top"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior:
                      "smooth",
                  })
                }
                className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 shadow-[0_12px_35px_rgba(24,24,27,0.14)] transition hover:-translate-y-0.5 hover:text-zinc-900 lg:bottom-6 lg:right-6"
              >
                <ArrowUp
                  size={17}
                />
              </motion.button>
            )}
          </AnimatePresence>

          {/* =================================================
              DELETE CONFIRMATION
          ================================================= */}

          <AnimatePresence>
            {deleteTarget && (
              <DeleteQuestionModal
                question={
                  deleteTarget
                }
                deleting={Boolean(
                  deletingId
                )}
                onCancel={
                  handleDeleteCancel
                }
                onConfirm={
                  handleDeleteConfirm
                }
              />
            )}
          </AnimatePresence>

          {/* =================================================
              DUPLICATE CONFIRMATION
          ================================================= */}

          <AnimatePresence>
            {duplicateTarget && (
              <DuplicateQuestionModal
                question={
                  duplicateTarget
                }
                duplicating={Boolean(
                  duplicatingId
                )}
                onCancel={
                  handleDuplicateCancel
                }
                onConfirm={
                  handleDuplicateConfirm
                }
                theme={theme}
              />
            )}
          </AnimatePresence>

          {/* =================================================
              BULK DELETE CONFIRMATION
          ================================================= */}

          <AnimatePresence>
            {showBulkDeleteDialog && (
              <BulkDeleteQuestionModal
                count={selectedCount}
                deleting={bulkDeleting}
                onCancel={handleBulkDeleteCancel}
                onConfirm={handleBulkDeleteConfirm}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AdminLayout>
  );
}


// ===========================================================
// SUMMARY CARD
// ===========================================================

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  theme,
  success = false,
  warning = false,
}) {
  let iconStyle = {
    borderColor:
      `${theme.accent}20`,
    backgroundColor:
      theme.accentSoft,
    color: theme.accent,
  };

  if (success) {
    iconStyle = {
      borderColor: "#BBF7D0",
      backgroundColor: "#F0FDF4",
      color: "#16A34A",
    };
  }

  if (warning) {
    iconStyle = {
      borderColor: "#FDE68A",
      backgroundColor: "#FFFBEB",
      color: "#D97706",
    };
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.055)] transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold text-zinc-500 sm:text-[11px]">
            {label}
          </p>

          <p className="mt-2 text-[22px] font-black tracking-[-0.04em] text-zinc-900 sm:text-[25px]">
            {value}
          </p>

          <p className="mt-1 truncate text-[9px] font-medium text-zinc-400 sm:text-[10px]">
            {description}
          </p>
        </div>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
          style={iconStyle}
        >
          <Icon size={15} />
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================================
// FILTER LABEL
// ===========================================================

function FilterLabel({
  children,
}) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">
      {children}
    </p>
  );
}

// ===========================================================
// ACTIVE FILTER CHIP
// ===========================================================

function ActiveFilterChip({
  label,
  onRemove,
}) {
  return (
    <div className="flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-[#F8FAFC] py-1 pl-2.5 pr-1.5">
      <span className="max-w-[220px] truncate text-[9px] font-bold text-zinc-600">
        {label}
      </span>

      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
      >
        <X size={10} />
      </button>
    </div>
  );
}

// ===========================================================
// PAGINATION
// ===========================================================

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  theme,
}) {
  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from(
        {
          length:
            totalPages,
        },
        (_, index) =>
          index + 1
      );
    }

    if (currentPage <= 4) {
      return [
        1,
        2,
        3,
        4,
        5,
        "...",
        totalPages,
      ];
    }

    if (
      currentPage >=
      totalPages - 3
    ) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [
    currentPage,
    totalPages,
  ]);

  return (
    <div className="mt-4 rounded-[20px] border border-zinc-200/90 bg-white p-3 shadow-[0_8px_24px_rgba(24,24,27,0.05)] sm:mt-5 sm:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[12px] font-black text-zinc-900">
            Page {currentPage} of{" "}
            {totalPages}
          </p>

          <p className="mt-1 text-[10px] font-medium text-zinc-500">
            {QUESTIONS_PER_PAGE}{" "}
            questions per page
          </p>
        </div>

        <div className="admin-hidden-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 md:mx-0 md:px-0 md:pb-0">
          <button
            type="button"
            disabled={
              currentPage === 1
            }
            onClick={() =>
              onPageChange(
                currentPage - 1
              )
            }
            className="h-9 shrink-0 rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-bold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            Previous
          </button>

          {pages.map(
            (page, index) => {
              if (
                page === "..."
              ) {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-9 w-7 shrink-0 items-center justify-center text-[11px] font-bold text-zinc-400"
                  >
                    •••
                  </span>
                );
              }

              const active =
                page ===
                currentPage;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() =>
                    onPageChange(
                      page
                    )
                  }
                  className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl border px-2 text-[11px] font-black transition ${active
                    ? ""
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  style={
                    active
                      ? {
                        borderColor:
                          `${theme.accent}30`,
                        backgroundColor:
                          theme.accentSoft,
                        color:
                          theme.accent,
                      }
                      : undefined
                  }
                >
                  {page}
                </button>
              );
            }
          )}

          <button
            type="button"
            disabled={
              currentPage ===
              totalPages
            }
            onClick={() =>
              onPageChange(
                currentPage + 1
              )
            }
            className="h-9 shrink-0 rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-bold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// QUESTION CARD
// ===========================================================

function QuestionCard({
  question,
  number,
  theme,
  deleting,
  duplicating,
  selected,
  selectionDisabled,
  onToggleSelection,
  onEdit,
  onDuplicate,
  onDelete,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const languageStatus =
    getLanguageStatus(question);

  const englishComplete =
    isEnglishComplete(question);

  const tamilComplete =
    isTamilComplete(question);

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      layout
      className={`overflow-hidden rounded-[18px] border bg-white shadow-[0_6px_20px_rgba(24,24,27,0.05)] transition duration-200 sm:rounded-[20px] sm:shadow-[0_8px_24px_rgba(24,24,27,0.055)] sm:hover:shadow-[0_12px_32px_rgba(24,24,27,0.08)] ${selected
        ? "border-zinc-900 ring-2 ring-zinc-900/5"
        : "border-zinc-200/90 hover:border-zinc-300"
        }`}
    >
      {/* =====================================================
          CARD HEADER
      ===================================================== */}

      <div className="border-b border-zinc-100 px-3 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
            <button
              type="button"
              aria-label={
                selected
                  ? `Deselect question ${question.id}`
                  : `Select question ${question.id}`
              }
              disabled={selectionDisabled}
              onClick={onToggleSelection}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
            >
              <SelectionCheckbox
                checked={selected}
              />
            </button>
            <div
              className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl border px-2 text-[11px] font-black"
              style={{
                borderColor:
                  `${theme.accent}25`,
                backgroundColor:
                  theme.accentSoft,
                color:
                  theme.accent,
              }}
            >
              {number}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">
                  Question #{question.id}
                </p>

                <LanguageStatusBadge
                  status={languageStatus}
                />
              </div>

              <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                <BookOpen
                  size={12}
                  className="shrink-0 text-zinc-400"
                />

                <p className="truncate text-[11px] font-bold text-zinc-600">
                  {question.chapter ||
                    "No chapter"}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:flex md:items-center">
            <button
              type="button"
              disabled={
                deleting ||
                duplicating ||
                selectionDisabled
              }
              onClick={onEdit}
              className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2 text-[9px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-[10px]"
            >
              <Edit3 size={13} />

              <span>
                Edit
              </span>
            </button>

            {/* ===============================================
                 DUPLICATE BUTTON
            =============================================== */}

            <button
              type="button"
              disabled={
                deleting ||
                duplicating ||
                selectionDisabled
              }
              onClick={onDuplicate}
              className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2 text-[9px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-[10px]"
            >
              {duplicating ? (
                <LoadingSpinner />
              ) : (
                <Copy size={13} />
              )}

              <span>
                {duplicating
                  ? "Copying..."
                  : "Duplicate"}
              </span>
            </button>

            <button
              type="button"
              disabled={
                deleting ||
                duplicating ||
                selectionDisabled
              }
              onClick={onDelete}
              className="flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2 text-[9px] font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-[10px]"
            >
              {deleting ? (
                <LoadingSpinner />
              ) : (
                <Trash2 size={13} />
              )}

              <span>
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          QUESTION BODY
      ===================================================== */}

      <div className="p-3.5 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* =================================================
              ENGLISH
          ================================================= */}

          <QuestionLanguageBlock
            code="EN"
            label="English"
            question={
              question.question_en
            }
            complete={
              englishComplete
            }
            theme={theme}
          />

          {/* =================================================
              TAMIL
          ================================================= */}

          <QuestionLanguageBlock
            code="TA"
            label="Tamil"
            question={
              question.question_ta
            }
            complete={
              tamilComplete
            }
            theme={theme}
          />
        </div>

        {/* ===================================================
            COMPLETENESS STRIP
        =================================================== */}

        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <QuestionCompletionBadge
            label="English"
            complete={
              englishComplete
            }
          />

          <QuestionCompletionBadge
            label="Tamil"
            complete={
              tamilComplete
            }
          />

          <div className="w-full sm:ml-auto sm:w-auto">
            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (previous) =>
                    !previous
                )
              }
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg px-2.5 text-[10px] font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 sm:h-8 sm:w-auto"
            >
              {expanded
                ? "Hide Details"
                : "View Details"}

              <ChevronDown
                size={13}
                className={`transition-transform ${expanded
                  ? "rotate-180"
                  : ""
                  }`}
              />
            </button>
          </div>
        </div>

        {/* ===================================================
            EXPANDED DETAILS
        =================================================== */}

        <AnimatePresence
          initial={false}
        >
          {expanded && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-zinc-100 pt-4 lg:grid-cols-2">
                {/* ===========================================
                    ENGLISH OPTIONS
                =========================================== */}

                <OptionsBlock
                  code="EN"
                  label="English Options"
                  options={OPTION_KEYS.map(
                    (key) => ({
                      key:
                        key.toUpperCase(),
                      value:
                        question[
                        `option_${key}_en`
                        ],
                    })
                  )}
                  correctAnswer={
                    question.correct_answer
                  }
                  theme={theme}
                />

                {/* ===========================================
                    TAMIL OPTIONS
                =========================================== */}

                <OptionsBlock
                  code="TA"
                  label="Tamil Options"
                  options={OPTION_KEYS.map(
                    (key) => ({
                      key:
                        key.toUpperCase(),
                      value:
                        question[
                        `option_${key}_ta`
                        ],
                    })
                  )}
                  correctAnswer={
                    question.correct_answer_ta
                  }
                  theme={theme}
                />
              </div>

              {/* =============================================
                  ANSWER SUMMARY
              ============================================= */}

              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2
                      size={16}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600">
                      Correct Answer
                    </p>

                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.08em] text-zinc-400">
                          English
                        </p>

                        <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-zinc-800">
                          {question.correct_answer ||
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.08em] text-zinc-400">
                          Tamil
                        </p>

                        <p className="mt-1 break-words text-[12px] font-semibold leading-5 text-zinc-800">
                          {question.correct_answer_ta ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

// ===========================================================
// LANGUAGE STATUS BADGE
// ===========================================================

function LanguageStatusBadge({
  status,
}) {
  if (
    status.tone === "success"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-emerald-700">
        <CheckCircle2
          size={10}
        />

        {status.label}
      </span>
    );
  }

  if (
    status.tone === "warning"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-amber-700">
        <Languages
          size={10}
        />

        {status.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-red-600">
      <TriangleAlert
        size={10}
      />

      {status.label}
    </span>
  );
}

// ===========================================================
// QUESTION LANGUAGE BLOCK
// ===========================================================

function QuestionLanguageBlock({
  code,
  label,
  question,
  complete,
  theme,
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[9px] font-black"
            style={{
              backgroundColor:
                theme.accentSoft,
              color:
                theme.accent,
            }}
          >
            {code}
          </span>

          <p className="text-[11px] font-black text-zinc-700">
            {label}
          </p>
        </div>

        {complete ? (
          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.08em] text-emerald-600">
            <Check
              size={10}
            />

            Complete
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.08em] text-amber-600">
            <TriangleAlert
              size={10}
            />

            Incomplete
          </span>
        )}
      </div>

      <div className="mt-3">
        {hasText(question) ? (
          <p className="whitespace-pre-wrap break-words text-[13px] font-semibold leading-6 text-zinc-900">
            {question}
          </p>
        ) : (
          <p className="text-[12px] italic text-zinc-400">
            No question content
            available.
          </p>
        )}
      </div>
    </div>
  );
}

// ===========================================================
// COMPLETION BADGE
// ===========================================================

function QuestionCompletionBadge({
  label,
  complete,
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 ${complete
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
    >
      {complete ? (
        <CheckCircle2
          size={11}
        />
      ) : (
        <TriangleAlert
          size={11}
        />
      )}

      <span className="text-[9px] font-black uppercase tracking-[0.08em]">
        {label}{" "}
        {complete
          ? "Ready"
          : "Incomplete"}
      </span>
    </div>
  );
}

// ===========================================================
// OPTIONS BLOCK
// ===========================================================

function OptionsBlock({
  code,
  label,
  options,
  correctAnswer,
  theme,
}) {
  const normalizedAnswer =
    String(
      correctAnswer ?? ""
    ).trim();

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-3.5 sm:p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[9px] font-black"
          style={{
            backgroundColor:
              theme.accentSoft,
            color:
              theme.accent,
          }}
        >
          {code}
        </span>

        <p className="text-[11px] font-black text-zinc-700">
          {label}
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {options.map(
          (option) => {
            const value =
              String(
                option.value ?? ""
              ).trim();

            /*
             * Existing QUIZTIANS DB
             * normally stores the
             * correct answer text.
             *
             * We also support A/B/C/D
             * here for older records.
             */
            const correct =
              normalizedAnswer ===
              value ||
              normalizedAnswer.toUpperCase() ===
              option.key;

            return (
              <div
                key={option.key}
                className={`flex items-start gap-2.5 rounded-xl border px-2.5 py-2.5 sm:gap-3 sm:px-3 ${correct
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-zinc-200 bg-white"
                  }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${correct
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500"
                    }`}
                >
                  {correct ? (
                    <Check
                      size={12}
                    />
                  ) : (
                    option.key
                  )}
                </span>

                <p
                  className={`min-w-0 flex-1 break-words pt-1 text-[11px] leading-5 ${correct
                    ? "font-semibold text-emerald-800"
                    : "font-medium text-zinc-600"
                    }`}
                >
                  {value || "—"}
                </p>

                {correct && (
                  <span className="mt-1 hidden shrink-0 text-[8px] font-black uppercase tracking-[0.08em] text-emerald-600 sm:inline">
                    Correct
                  </span>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

// ===========================================================
// DUPLICATE QUESTION MODAL
// ===========================================================

function DuplicateQuestionModal({
  question,
  duplicating,
  onCancel,
  onConfirm,
  theme,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[3px]"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget &&
          !duplicating
        ) {
          onCancel();
        }
      }}
    >
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
        className="w-full max-w-[500px] overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.22)]"
      >
        {/* ===================================================
            MODAL HEADER
        =================================================== */}

        <div className="border-b border-zinc-200/80 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
              style={{
                borderColor:
                  `${theme.accent}25`,
                backgroundColor:
                  theme.accentSoft,
                color:
                  theme.accent,
              }}
            >
              <Copy size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] font-black uppercase tracking-[0.12em]"
                style={{
                  color:
                    theme.accent,
                }}
              >
                Duplicate Question
              </p>

              <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.025em] text-zinc-900">
                Create a copy?
              </h3>

              <p className="mt-2 text-[12px] leading-5 text-zinc-500">
                A new question will
                be created using the
                same bilingual content
                and answer.
              </p>
            </div>

            <button
              type="button"
              disabled={duplicating}
              onClick={onCancel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ===================================================
            SOURCE QUESTION
        =================================================== */}

        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-zinc-200 bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
                  Source Question
                </p>

                <p className="mt-1 text-[12px] font-black text-zinc-900">
                  #{question.id}
                </p>
              </div>

              <div className="flex max-w-[60%] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5">
                <BookOpen
                  size={11}
                  className="shrink-0 text-zinc-400"
                />

                <span className="truncate text-[9px] font-bold text-zinc-600">
                  {question.chapter ||
                    "No chapter"}
                </span>
              </div>
            </div>

            <p className="mt-3 line-clamp-3 text-[12px] font-semibold leading-5 text-zinc-700">
              {question.question_en ||
                question.question_ta ||
                "No question text"}
            </p>
          </div>

          {/* =================================================
              DUPLICATE INFORMATION
          ================================================= */}

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-start gap-3">
              <Copy
                size={15}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="text-[11px] font-black text-blue-900">
                  What will be copied?
                </p>

                <p className="mt-1 text-[10px] leading-5 text-blue-700">
                  Chapter, English and
                  Tamil questions, all
                  eight answer options
                  and the correct answer
                  will be copied into a
                  brand-new question.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[10px] leading-5 text-zinc-400">
            The original question will
            not be modified. After the
            copy is created, QUIZTIANS
            will open the new question
            in the editor.
          </p>
        </div>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200/80 bg-[#FAFAFA] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={duplicating}
            onClick={onCancel}
            className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-[11px] font-bold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={duplicating}
            onClick={onConfirm}
            className="flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[11px] font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.chartSecondary ||
                theme.accent
                })`,
              boxShadow: `0 12px 28px ${theme.accent}20`,
            }}
          >
            {duplicating ? (
              <>
                <LoadingSpinner />
                Creating Copy...
              </>
            ) : (
              <>
                <Copy size={14} />
                Duplicate Question
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===========================================================
//  SELECTION CHECKBOX
// ===========================================================

function SelectionCheckbox({
  checked = false,
  indeterminate = false,
  dark = false,
}) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${checked
        ? dark
          ? "border-white/20 bg-white text-zinc-900"
          : "border-zinc-900 bg-zinc-900 text-white"
        : indeterminate
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white text-transparent"
        }`}
    >
      {checked ? (
        <Check size={12} strokeWidth={3} />
      ) : indeterminate ? (
        <span className="h-[2px] w-2 rounded-full bg-white" />
      ) : null}
    </span>
  );
}

// ===========================================================
//  BULK ACTION BAR
// ===========================================================

function BulkActionBar({
  selectedCount,
  selectedOnCurrentPage,
  bulkDeleting,
  onClear,
  onDelete,
  theme,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 20,
        scale: 0.98,
      }}
      transition={{
        duration: 0.18,
      }}
      className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-[720px] sm:bottom-4 sm:left-4 sm:right-4 lg:bottom-6"
    >
      <div className="overflow-hidden rounded-[18px] border border-zinc-800 bg-zinc-950 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:rounded-[20px]">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  `${theme.accent}20`,
                color: theme.accent,
              }}
            >
              <SquareCheckBig
                size={17}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[12px] font-black text-white">
                {selectedCount}{" "}
                {selectedCount === 1
                  ? "question"
                  : "questions"}{" "}
                selected
              </p>

              <p className="mt-0.5 text-[9px] font-medium text-zinc-500">
                {selectedOnCurrentPage} selected
                on this page
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <button
              type="button"
              disabled={bulkDeleting}
              onClick={onClear}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-[10px] font-bold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={13} />

              Clear
            </button>

            <button
              type="button"
              disabled={bulkDeleting}
              onClick={onDelete}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-[10px] font-black text-white shadow-[0_10px_25px_rgba(220,38,38,0.2)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkDeleting ? (
                <LoadingSpinner />
              ) : (
                <Trash2 size={13} />
              )}

              {bulkDeleting
                ? "Deleting..."
                : "Delete Selected"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================================
//  BULK DELETE MODAL
// ===========================================================

function BulkDeleteQuestionModal({
  count,
  deleting,
  onCancel,
  onConfirm,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-[5px]"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !deleting
        ) {
          onCancel();
        }
      }}
    >
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
        className="w-full max-w-[500px] overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
      >
        <div className="border-b border-zinc-800 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <Trash2 size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-red-400">
                Bulk Delete
              </p>

              <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.025em] text-white">
                Delete {count}{" "}
                {count === 1
                  ? "question"
                  : "questions"}?
              </h3>

              <p className="mt-2 text-[12px] leading-5 text-zinc-400">
                Every selected question will
                be permanently removed from
                the Question Bank.
              </p>
            </div>

            <button
              type="button"
              disabled={deleting}
              onClick={onCancel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert
                size={17}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="text-[11px] font-black text-red-300">
                  This cannot be undone
                </p>

                <p className="mt-1 text-[10px] leading-5 text-red-300/70">
                  You are about to permanently
                  delete{" "}
                  <span className="font-black text-red-300">
                    {count}
                  </span>{" "}
                  selected{" "}
                  {count === 1
                    ? "question"
                    : "questions"}{" "}
                  and their bilingual answer
                  options.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 bg-zinc-900/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-[11px] font-bold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-[11px] font-black text-white shadow-[0_12px_30px_rgba(220,38,38,0.22)] transition hover:-translate-y-0.5 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {deleting ? (
              <>
                <LoadingSpinner />
                Deleting {count}...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Delete {count}{" "}
                {count === 1
                  ? "Question"
                  : "Questions"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===========================================================
// DELETE QUESTION MODAL
// ===========================================================

function DeleteQuestionModal({
  question,
  deleting,
  onCancel,
  onConfirm,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-[4px]"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !deleting
        ) {
          onCancel();
        }
      }}
    >
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
        className="w-full max-w-[500px] overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
      >
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="border-b border-zinc-800 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <Trash2 size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-red-400">
                Destructive Action
              </p>

              <h3 className="mt-1.5 text-[19px] font-black tracking-[-0.025em] text-white">
                Delete this question?
              </h3>

              <p className="mt-2 text-[12px] leading-5 text-zinc-400">
                This question will be permanently
                removed from the question bank.
              </p>
            </div>

            <button
              type="button"
              disabled={deleting}
              onClick={onCancel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ===================================================
            QUESTION INFORMATION
        =================================================== */}

        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-500">
                  Question
                </p>

                <p className="mt-1 text-[12px] font-black text-white">
                  #{question.id}
                </p>
              </div>

              <div className="flex max-w-[60%] items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5">
                <BookOpen
                  size={11}
                  className="shrink-0 text-zinc-500"
                />

                <span className="truncate text-[9px] font-bold text-zinc-300">
                  {question.chapter ||
                    "No chapter"}
                </span>
              </div>
            </div>

            <p className="mt-3 line-clamp-3 text-[12px] font-semibold leading-5 text-zinc-300">
              {question.question_en ||
                question.question_ta ||
                "No question text"}
            </p>
          </div>

          {/* =================================================
              WARNING
          ================================================= */}

          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert
                size={16}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="text-[11px] font-black text-red-300">
                  This cannot be undone
                </p>

                <p className="mt-1 text-[10px] leading-5 text-red-300/70">
                  The question and its bilingual
                  answer options will be permanently
                  deleted from QUIZTIANS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 bg-zinc-900/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="flex h-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-[11px] font-bold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-[11px] font-black text-white shadow-[0_12px_30px_rgba(220,38,38,0.22)] transition hover:-translate-y-0.5 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {deleting ? (
              <>
                <LoadingSpinner />

                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} />

                Delete Question
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===========================================================
// EMPTY QUESTIONS
// ===========================================================

function EmptyQuestions({
  hasFilters,
  onClear,
  theme,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-[22px] border border-dashed border-zinc-300 bg-white px-5 py-14 text-center shadow-[0_8px_24px_rgba(24,24,27,0.04)]"
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{
          borderColor:
            `${theme.accent}20`,
          backgroundColor:
            theme.accentSoft,
          color:
            theme.accent,
        }}
      >
        {hasFilters ? (
          <Search size={21} />
        ) : (
          <FileQuestion size={21} />
        )}
      </div>

      <h3 className="mt-4 text-[16px] font-black text-zinc-900">
        {hasFilters
          ? "No matching questions"
          : "No questions yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-zinc-500">
        {hasFilters
          ? "No questions match the current search and filter settings. Try changing or clearing the filters."
          : "Your question bank is currently empty. Add questions to start building your QUIZTIANS quiz."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[11px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <X size={13} />

          Clear Filters
        </button>
      )}
    </motion.div>
  );
}

// ===========================================================
// QUESTION LIST LOADING
// ===========================================================

function QuestionListLoading() {
  return (
    <div className="space-y-3">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[20px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.04)]"
        >
          {/* HEADER */}

          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-4 py-4 sm:px-5">
            <div className="flex flex-1 items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-100" />

              <div className="flex-1">
                <div className="h-2.5 w-28 animate-pulse rounded-full bg-zinc-200" />

                <div className="mt-2 h-2 w-20 animate-pulse rounded-full bg-zinc-100" />
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-9 w-16 animate-pulse rounded-xl bg-zinc-100" />

              <div className="h-9 w-24 animate-pulse rounded-xl bg-zinc-100" />

              <div className="h-9 w-20 animate-pulse rounded-xl bg-zinc-100" />
            </div>
          </div>

          {/* CONTENT */}

          <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-2">
            <QuestionBlockSkeleton />

            <QuestionBlockSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================
// QUESTION BLOCK SKELETON
// ===========================================================

function QuestionBlockSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-3.5 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 animate-pulse rounded-lg bg-zinc-200" />

          <div className="h-2.5 w-16 animate-pulse rounded-full bg-zinc-200" />
        </div>

        <div className="h-2 w-14 animate-pulse rounded-full bg-zinc-200" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-zinc-200" />

        <div className="h-3 w-[92%] animate-pulse rounded-full bg-zinc-200" />

        <div className="h-3 w-[70%] animate-pulse rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}

// ===========================================================
// LOADING SPINNER
// ===========================================================

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}