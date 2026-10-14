import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Edit3,
  FileQuestion,
  Filter,
  Languages,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { logAdminActivity } from "../utils/logAdminActivity";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// CONSTANTS
// ===========================================================

const OPTION_KEYS = ["a", "b", "c", "d"];

// ===========================================================
// QUESTION PREVIEW PAGE
// ===========================================================

export default function QuestionPreviewPage() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // ===========================================================

  const [questions, setQuestions] = useState([]);

  const [selectedChapter, setSelectedChapter] =
    useState("");

  const [chapterSearchTerm, setChapterSearchTerm] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [showTopBtn, setShowTopBtn] =
    useState(false);

  const [chapterMenuOpen, setChapterMenuOpen] =
    useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState(null);

  // =========================================================
  // FETCH QUESTIONS
  // ===========================================================

  const fetchQuestions = async ({
    showToast = false,
    isRefresh = false,
  } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
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

      if (showToast) {
        toast.success(
          "Questions loaded successfully!"
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch questions:",
        error
      );

      toast.error(
        "Failed to fetch questions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL FETCH
  // ===========================================================

  useEffect(() => {
    fetchQuestions({
      showToast: true,
    });
  }, []);

  // =========================================================
  // BACK TO TOP
  // ===========================================================

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(
        window.scrollY > 300
      );
    };

    window.addEventListener(
      "scroll",
      handleScroll
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
  // ===========================================================

  const chapters = useMemo(() => {
    return [
      ...new Set(
        questions
          .map((question) =>
            question.chapter?.trim()
          )
          .filter(Boolean)
      ),
    ];
  }, [questions]);

  // =========================================================
  // CHAPTER COUNTS
  // ===========================================================

  const chapterCounts = useMemo(() => {
    return questions.reduce(
      (acc, question) => {
        const chapter =
          question.chapter?.trim();

        if (!chapter) {
          return acc;
        }

        acc[chapter] =
          (acc[chapter] || 0) + 1;

        return acc;
      },
      {}
    );
  }, [questions]);

  // =========================================================
  // FILTERED CHAPTERS
  // ===========================================================

  const filteredChapters =
    useMemo(() => {
      const term =
        chapterSearchTerm
          .trim()
          .toLowerCase();

      if (!term) {
        return chapters;
      }

      return chapters.filter(
        (chapter) =>
          chapter
            .toLowerCase()
            .includes(term)
      );
    }, [
      chapters,
      chapterSearchTerm,
    ]);

  // =========================================================
  // FILTER QUESTIONS
  // ===========================================================

  const filteredQuestions =
    useMemo(() => {
      let filtered = [...questions];

      if (selectedChapter) {
        filtered = filtered.filter(
          (question) =>
            question.chapter ===
            selectedChapter
        );
      }

      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (search) {
        filtered = filtered.filter(
          (question) => {
            const english =
              question.question_en
                ?.toLowerCase() || "";

            const tamil =
              question.question_ta
                ?.toLowerCase() || "";

            return (
              english.includes(search) ||
              tamil.includes(search)
            );
          }
        );
      }

      return filtered;
    }, [
      questions,
      selectedChapter,
      searchTerm,
    ]);

  // =========================================================
  // STATS
  // ===========================================================

  const totalQuestionsForChapter =
    selectedChapter
      ? questions.filter(
        (question) =>
          question.chapter ===
          selectedChapter
      ).length
      : filteredQuestions.length;

  const hasActiveFilters =
    Boolean(selectedChapter) ||
    Boolean(searchTerm.trim());

  // =========================================================
  // CLEAR FILTERS
  // ===========================================================

  const clearFilters = () => {
    setSelectedChapter("");
    setChapterSearchTerm("");
    setSearchTerm("");
  };

  // =========================================================
  // DELETE REQUEST
  // ===========================================================

  const handleDeleteRequest = (
    question
  ) => {
    setDeleteTarget(question);
  };

  // =========================================================
  // CONFIRM DELETE
  // ===========================================================

  const confirmDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    const questionToDelete =
      deleteTarget;

    setDeletingId(
      questionToDelete.id
    );

    try {
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

      setQuestions((previous) =>
        previous.filter(
          (question) =>
            question.id !==
            questionToDelete.id
        )
      );

      await logAdminActivity({
        action: "DELETE_QUESTION",
        module: "Questions",
        description: `Deleted question from chapter "${questionToDelete?.chapter}"`,
        targetId:
          questionToDelete.id,
        targetType: "question",
      });

      toast.success(
        "Question deleted successfully!"
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "Failed to delete question:",
        error
      );

      toast.error(
        "Failed to delete question."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // SCROLL TO TOP
  // ===========================================================

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // UI
  // ===========================================================

  return (
    <AdminLayout
      title="Preview Questions"
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
                background: "#18181B",
                color: "#F4F4F5",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                fontSize: "13px",
                fontWeight: 600,
                boxShadow:
                  "0 20px 50px rgba(0,0,0,.4)",
              },

              success: {
                iconTheme: {
                  primary: "#22C55E",
                  secondary: "#18181B",
                },
              },

              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#18181B",
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
            className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#111114] p-5 sm:p-6 lg:p-7"
          >
            <div
              className={`pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full ${theme.glow} blur-[100px]`}
            />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
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
                    Question Library
                  </p>
                </div>

                <h2 className="mt-3 text-[26px] font-black tracking-[-0.035em] text-white sm:text-[30px] lg:text-[34px]">
                  Review your quiz questions
                </h2>

                <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-500 sm:text-[14px]">
                  Search, filter and review
                  every English and Tamil
                  question before it goes
                  live in your quiz.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() =>
                    fetchQuestions({
                      showToast: true,
                      isRefresh: true,
                    })
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-[12px] font-bold text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>

                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0D0D10] px-4 py-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      borderColor:
                        `${theme.accent}20`,
                      backgroundColor:
                        theme.accentSoft,
                    }}
                  >
                    <Languages
                      size={18}
                      style={{
                        color:
                          theme.accent,
                      }}
                    />
                  </div>

                  <div>
                    <p className="text-[12px] font-black text-zinc-200">
                      Bilingual
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-600">
                      English + Tamil
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              STATS
          ================================================= */}

          <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Questions"
              value={
                totalQuestionsForChapter
              }
              icon={FileQuestion}
              theme={theme}
            />

            <StatCard
              label="All Questions"
              value={questions.length}
              icon={CheckCircle2}
              theme={theme}
            />

            <StatCard
              label="Chapters"
              value={chapters.length}
              icon={BookOpen}
              theme={theme}
            />

            <StatCard
              label="Showing"
              value={
                filteredQuestions.length
              }
              icon={Filter}
              theme={theme}
            />
          </section>

          {/* =================================================
              FILTERS
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.05,
            }}
            className="relative z-20 mt-4 rounded-[22px] border border-white/[0.06] bg-[#111114] p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              {/* =============================================
                  CHAPTER FILTER
              ============================================= */}

              <div className="relative flex-1">
                <FieldLabel>
                  Chapter
                </FieldLabel>

                <button
                  type="button"
                  onClick={() =>
                    setChapterMenuOpen(
                      (previous) =>
                        !previous
                    )
                  }
                  className="mt-2 flex h-12 w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 text-left transition hover:border-white/[0.12]"
                >
                  <BookOpen
                    size={17}
                    style={{
                      color:
                        selectedChapter
                          ? theme.accent
                          : "#52525B",
                    }}
                  />

                  <span
                    className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${selectedChapter
                        ? "text-zinc-200"
                        : "text-zinc-600"
                      }`}
                  >
                    {selectedChapter ||
                      "All chapters"}
                  </span>

                  {selectedChapter && (
                    <span className="rounded-full border border-white/[0.05] bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-zinc-500">
                      {chapterCounts[
                        selectedChapter
                      ] || 0}
                    </span>
                  )}

                  <ChevronDown
                    size={16}
                    className={`text-zinc-600 transition-transform ${chapterMenuOpen
                        ? "rotate-180"
                        : ""
                      }`}
                  />
                </button>

                {/* ===========================================
                    CHAPTER MENU
                =========================================== */}

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
                        className="fixed inset-0 z-30 cursor-default"
                      />

                      <motion.div
                        initial={{
                          opacity: 0,
                          y: -6,
                          scale: 0.99,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: -6,
                          scale: 0.99,
                        }}
                        transition={{
                          duration: 0.15,
                        }}
                        className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161619] shadow-2xl"
                      >
                        {/* SEARCH CHAPTER */}

                        <div className="border-b border-white/[0.05] p-3">
                          <div className="relative">
                            <Search
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                            />

                            <input
                              type="text"
                              autoFocus
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
                              className="h-10 w-full rounded-xl border border-white/[0.06] bg-[#0D0D10] pl-9 pr-3 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-white/[0.12]"
                            />
                          </div>
                        </div>

                        {/* CHAPTERS */}

                        <div
                          className="admin-hidden-scrollbar max-h-[290px] overflow-y-auto p-2"
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

                              setChapterSearchTerm(
                                ""
                              );

                              setChapterMenuOpen(
                                false
                              );
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${!selectedChapter
                                ? "bg-white/[0.05]"
                                : "hover:bg-white/[0.035]"
                              }`}
                          >
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{
                                backgroundColor:
                                  !selectedChapter
                                    ? theme.accentSoft
                                    : "rgba(255,255,255,.025)",
                              }}
                            >
                              <FileQuestion
                                size={14}
                                style={{
                                  color:
                                    !selectedChapter
                                      ? theme.accent
                                      : "#52525B",
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-bold text-zinc-300">
                                All chapters
                              </p>

                              <p className="mt-0.5 text-[10px] text-zinc-600">
                                Complete
                                question
                                library
                              </p>
                            </div>

                            <span className="text-[11px] font-bold text-zinc-600">
                              {
                                questions.length
                              }
                            </span>
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

                                    setChapterSearchTerm(
                                      ""
                                    );

                                    setChapterMenuOpen(
                                      false
                                    );
                                  }}
                                  className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active
                                      ? "bg-white/[0.05]"
                                      : "hover:bg-white/[0.035]"
                                    }`}
                                >
                                  <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                    style={{
                                      backgroundColor:
                                        active
                                          ? theme.accentSoft
                                          : "rgba(255,255,255,.025)",
                                    }}
                                  >
                                    <BookOpen
                                      size={
                                        14
                                      }
                                      style={{
                                        color:
                                          active
                                            ? theme.accent
                                            : "#52525B",
                                      }}
                                    />
                                  </div>

                                  <span
                                    className={`min-w-0 flex-1 truncate text-[12px] font-semibold ${active
                                        ? "text-zinc-100"
                                        : "text-zinc-400"
                                      }`}
                                  >
                                    {
                                      chapter
                                    }
                                  </span>

                                  <span className="text-[10px] font-bold text-zinc-600">
                                    {chapterCounts[
                                      chapter
                                    ] ||
                                      0}{" "}
                                    Qs
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

                          {filteredChapters.length ===
                            0 && (
                              <div className="px-4 py-8 text-center">
                                <p className="text-[12px] font-semibold text-zinc-600">
                                  No chapters
                                  found
                                </p>
                              </div>
                            )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* =============================================
                  QUESTION SEARCH
              ============================================= */}

              <div className="flex-[1.5]">
                <FieldLabel>
                  Search questions
                </FieldLabel>

                <div className="relative mt-2">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search English or Tamil question..."
                    className="h-12 w-full rounded-2xl border border-white/[0.07] bg-[#0D0D10] pl-11 pr-11 text-[13px] font-medium text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-white/[0.14] focus:bg-[#101013]"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearchTerm("")
                      }
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* =============================================
                  CLEAR FILTERS
              ============================================= */}

              <button
                type="button"
                disabled={
                  !hasActiveFilters
                }
                onClick={clearFilters}
                className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 text-[12px] font-bold text-zinc-500 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <X size={14} />

                Clear
              </button>
            </div>

            {/* ACTIVE FILTER */}

            {selectedChapter && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-4">
                <span className="text-[11px] font-semibold text-zinc-600">
                  Active filter:
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedChapter(
                      ""
                    )
                  }
                  className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold"
                  style={{
                    borderColor:
                      `${theme.accent}20`,
                    backgroundColor:
                      theme.accentSoft,
                    color:
                      theme.accent,
                  }}
                >
                  <BookOpen size={12} />

                  {selectedChapter}

                  <X size={11} />
                </button>
              </div>
            )}
          </motion.section>

          {/* =================================================
              RESULTS HEADER
          ================================================= */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-600">
                Question Library
              </p>

              <h3 className="mt-1 text-[19px] font-black tracking-[-0.02em] text-zinc-100">
                {selectedChapter
                  ? selectedChapter
                  : "All Questions"}
              </h3>
            </div>

            <p className="text-[12px] font-medium text-zinc-600">
              Showing{" "}
              <span className="font-black text-zinc-300">
                {
                  filteredQuestions.length
                }
              </span>{" "}
              of{" "}
              <span className="font-black text-zinc-300">
                {questions.length}
              </span>{" "}
              questions
            </p>
          </div>

          {/* =================================================
              QUESTIONS
          ================================================= */}

          <section className="mt-4">
            {loading ? (
              <QuestionsLoading
                theme={theme}
              />
            ) : filteredQuestions.length ===
              0 ? (
              <EmptyQuestions
                hasFilters={
                  hasActiveFilters
                }
                onClear={
                  clearFilters
                }
                theme={theme}
              />
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map(
                  (question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={
                        question
                      }
                      number={
                        index + 1
                      }
                      theme={theme}
                      deleting={
                        deletingId ===
                        question.id
                      }
                      onEdit={() =>
                        navigate(
                          `/edit-question/${question.id}`
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
              BACK TO TOP
          ================================================= */}

          <AnimatePresence>
            {showTopBtn && (
              <motion.button
                initial={{
                  opacity: 0,
                  scale: 0.85,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.85,
                  y: 10,
                }}
                type="button"
                onClick={scrollToTop}
                aria-label="Back to top"
                className="fixed bottom-[92px] right-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#18181B]/95 text-zinc-300 shadow-2xl backdrop-blur-xl transition hover:bg-[#202024] hover:text-white lg:bottom-6 lg:right-6"
              >
                <ArrowUp size={17} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* =================================================
              DELETE MODAL
          ================================================= */}

          <AnimatePresence>
            {deleteTarget && (
              <DeleteQuestionModal
                question={
                  deleteTarget
                }
                loading={
                  deletingId ===
                  deleteTarget.id
                }
                theme={theme}
                onCancel={() => {
                  if (!deletingId) {
                    setDeleteTarget(
                      null
                    );
                  }
                }}
                onConfirm={
                  confirmDelete
                }
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AdminLayout>
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
  onEdit,
  onDelete,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const englishOptions =
    OPTION_KEYS.map((key) => ({
      key: key.toUpperCase(),
      value:
        question[
        `option_${key}_en`
        ] || "",
    }));

  const tamilOptions =
    OPTION_KEYS.map((key) => ({
      key: key.toUpperCase(),
      value:
        question[
        `option_${key}_ta`
        ] || "",
    }));

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.25,
      }}
      className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#111114]"
    >
      {/* =====================================================
          CARD HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 border-b border-white/[0.05] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[12px] font-black"
            style={{
              borderColor:
                `${theme.accent}20`,
              backgroundColor:
                theme.accentSoft,
              color: theme.accent,
            }}
          >
            {String(number).padStart(
              2,
              "0"
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen
                size={14}
                style={{
                  color:
                    theme.accent,
                }}
              />

              <p className="truncate text-[13px] font-black text-zinc-200">
                {question.chapter ||
                  "Uncategorized"}
              </p>
            </div>

            <p className="mt-1 text-[11px] text-zinc-600">
              Question ID #
              {question.id}
            </p>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/10 bg-amber-500/[0.035] px-4 text-[12px] font-bold text-amber-400/80 transition hover:border-amber-500/20 hover:bg-amber-500/[0.07] hover:text-amber-300 sm:flex-none"
          >
            <Edit3 size={14} />

            Edit
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.035] px-4 text-[12px] font-bold text-red-400/80 transition hover:border-red-500/20 hover:bg-red-500/[0.07] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {deleting ? (
              <LoadingSpinner />
            ) : (
              <Trash2 size={14} />
            )}

            Delete
          </button>
        </div>
      </div>

      {/* =====================================================
          QUESTIONS
      ===================================================== */}

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <QuestionLanguageBlock
            code="EN"
            label="English"
            question={
              question.question_en
            }
            theme={theme}
          />

          <QuestionLanguageBlock
            code="TA"
            label="Tamil"
            question={
              question.question_ta
            }
            theme={theme}
          />
        </div>

        {/* ===================================================
            OPTIONS
        =================================================== */}

        <div className="mt-4">
          <button
            type="button"
            onClick={() =>
              setExpanded(
                (previous) =>
                  !previous
              )
            }
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.05] bg-[#0D0D10] px-4 py-3 text-left transition hover:border-white/[0.09]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  backgroundColor:
                    theme.accentSoft,
                  color:
                    theme.accent,
                }}
              >
                <Languages
                  size={14}
                />
              </div>

              <div>
                <p className="text-[12px] font-black text-zinc-300">
                  Answer Options
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                  English and Tamil
                  choices
                </p>
              </div>
            </div>

            <ChevronDown
              size={16}
              className={`text-zinc-600 transition-transform ${expanded
                  ? "rotate-180"
                  : ""
                }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: "auto",
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-3 pt-3 lg:grid-cols-2">
                  <OptionsBlock
                    code="EN"
                    label="English"
                    options={
                      englishOptions
                    }
                    correctAnswer={
                      question.correct_answer
                    }
                    theme={theme}
                  />

                  <OptionsBlock
                    code="TA"
                    label="Tamil"
                    options={
                      tamilOptions
                    }
                    correctAnswer={
                      question.correct_answer_ta
                    }
                    theme={theme}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===================================================
            CORRECT ANSWER
        =================================================== */}

        <div className="mt-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.025] p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={16}
              className="shrink-0 text-emerald-500"
            />

            <p className="text-[12px] font-black text-emerald-400/90">
              Correct Answer
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <CorrectAnswer
              language="English"
              answer={
                question.correct_answer
              }
            />

            <CorrectAnswer
              language="Tamil"
              answer={
                question.correct_answer_ta
              }
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ===========================================================
// QUESTION LANGUAGE BLOCK
// ===========================================================

function QuestionLanguageBlock({
  code,
  label,
  question,
  theme,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-[#0D0D10] p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[9px] font-black"
          style={{
            backgroundColor:
              theme.accentSoft,
            color: theme.accent,
          }}
        >
          {code}
        </span>

        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-600">
          {label}
        </p>
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-[14px] font-semibold leading-6 text-zinc-200">
        {question || "—"}
      </p>
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
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-[#0D0D10] p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[9px] font-black"
          style={{
            backgroundColor:
              theme.accentSoft,
            color: theme.accent,
          }}
        >
          {code}
        </span>

        <p className="text-[12px] font-black text-zinc-400">
          {label} Options
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {options.map((option) => {
          const correct =
            option.value ===
            correctAnswer &&
            Boolean(option.value);

          return (
            <div
              key={option.key}
              className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: correct
                  ? "rgba(34,197,94,.18)"
                  : "rgba(255,255,255,.045)",

                backgroundColor: correct
                  ? "rgba(34,197,94,.04)"
                  : "rgba(255,255,255,.012)",
              }}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${correct
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-white/[0.03] text-zinc-600"
                  }`}
              >
                {correct ? (
                  <Check size={13} />
                ) : (
                  option.key
                )}
              </span>

              <p
                className={`min-w-0 flex-1 break-words pt-1 text-[12px] leading-5 ${correct
                    ? "font-semibold text-emerald-300/90"
                    : "font-medium text-zinc-500"
                  }`}
              >
                {option.value || "—"}
              </p>

              {correct && (
                <span className="mt-1 shrink-0 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-500/70">
                  Correct
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================
// CORRECT ANSWER
// ===========================================================

function CorrectAnswer({
  language,
  answer,
}) {
  return (
    <div className="rounded-xl border border-emerald-500/[0.07] bg-black/10 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-500/50">
        {language}
      </p>

      <p className="mt-1.5 break-words text-[12px] font-bold leading-5 text-emerald-300/80">
        {answer || "—"}
      </p>
    </div>
  );
}

// ===========================================================
// STAT CARD
// ===========================================================

function StatCard({
  label,
  value,
  icon: Icon,
  theme,
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.055] bg-[#111114] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold text-zinc-600">
          {label}
        </p>

        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            backgroundColor:
              theme.accentSoft,
            color: theme.accent,
          }}
        >
          <Icon size={14} />
        </div>
      </div>

      <p className="mt-3 text-[28px] font-black tracking-[-0.04em] text-zinc-100 sm:text-[32px]">
        {value}
      </p>
    </div>
  );
}

// ===========================================================
// DELETE MODAL
// ===========================================================

function DeleteQuestionModal({
  question,
  loading,
  theme,
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
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 10,
        }}
        transition={{
          duration: 0.18,
        }}
        className="w-full max-w-[460px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#141418] shadow-2xl"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.06] text-red-400">
              <Trash2 size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-[18px] font-black tracking-[-0.02em] text-white">
                Delete question?
              </p>

              <p className="mt-2 text-[13px] leading-6 text-zinc-500">
                This question will be
                permanently removed from
                the quiz library.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.05] bg-[#0D0D10] p-4">
            <div className="flex items-center gap-2">
              <BookOpen
                size={13}
                style={{
                  color:
                    theme.accent,
                }}
              />

              <p className="truncate text-[11px] font-bold text-zinc-500">
                {question.chapter ||
                  "Uncategorized"}
              </p>
            </div>

            <p className="mt-2 line-clamp-3 text-[13px] font-semibold leading-5 text-zinc-300">
              {question.question_en}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="h-11 rounded-xl border border-white/[0.07] bg-white/[0.02] text-[12px] font-bold text-zinc-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.09] text-[12px] font-black text-red-400 transition hover:bg-red-500/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Delete
                </>
              )}
            </button>
          </div>
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
      }}
      animate={{
        opacity: 1,
      }}
      className="rounded-[22px] border border-dashed border-white/[0.07] bg-[#111114] px-5 py-16 text-center"
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border"
        style={{
          borderColor:
            `${theme.accent}15`,
          backgroundColor:
            theme.accentSoft,
        }}
      >
        <Search
          size={22}
          style={{
            color: theme.accent,
          }}
        />
      </div>

      <h3 className="mt-5 text-[17px] font-black text-zinc-200">
        No questions found
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-zinc-600">
        {hasFilters
          ? "No questions match the current chapter or search filters."
          : "There are no questions in the library yet."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-[12px] font-bold text-zinc-300 transition hover:bg-white/[0.06]"
        >
          Clear Filters
        </button>
      )}
    </motion.div>
  );
}

// ===========================================================
// LOADING
// ===========================================================

function QuestionsLoading({ theme }) {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[22px] border border-white/[0.05] bg-[#111114]"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.04] p-4 sm:p-5">
            <div
              className="h-10 w-10 animate-pulse rounded-xl"
              style={{
                backgroundColor:
                  theme.accentSoft,
              }}
            />

            <div className="flex-1">
              <div className="h-3 w-32 animate-pulse rounded-full bg-white/[0.05]" />

              <div className="mt-2 h-2.5 w-20 animate-pulse rounded-full bg-white/[0.03]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-2">
            <div className="h-28 animate-pulse rounded-2xl bg-white/[0.025]" />

            <div className="h-28 animate-pulse rounded-2xl bg-white/[0.025]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================
// FIELD LABEL
// ===========================================================

function FieldLabel({ children }) {
  return (
    <label className="text-[12px] font-bold text-zinc-500">
      {children}
    </label>
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