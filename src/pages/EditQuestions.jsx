import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  FileQuestion,
  Languages,
  PencilLine,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { logAdminActivity } from "../utils/logAdminActivity";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// CONSTANTS
// ===========================================================

const OPTION_KEYS = ["a", "b", "c", "d"];
const OPTION_LABELS = ["A", "B", "C", "D"];

// ===========================================================
// HELPERS
// ===========================================================

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function resolveCorrectOption(question) {
  if (!question) return "";

  const storedAnswer = normalizeValue(
    question.correct_answer
  );

  if (!storedAnswer) return "";

  // Existing/older records may already contain A/B/C/D.
  const upper = storedAnswer.toUpperCase();

  if (OPTION_LABELS.includes(upper)) {
    return upper;
  }

  // Current DB records may contain the English answer text.
  const matchingKey = OPTION_KEYS.find(
    (key) =>
      normalizeValue(
        question[`option_${key}_en`]
      ) === storedAnswer
  );

  if (matchingKey) {
    return matchingKey.toUpperCase();
  }

  // Fallback: try Tamil answer text too.
  const tamilStoredAnswer = normalizeValue(
    question.correct_answer_ta
  );

  const tamilMatchingKey = OPTION_KEYS.find(
    (key) =>
      normalizeValue(
        question[`option_${key}_ta`]
      ) === tamilStoredAnswer
  );

  return tamilMatchingKey
    ? tamilMatchingKey.toUpperCase()
    : "";
}

// ===========================================================
// EDIT QUESTIONS
// ===========================================================

export default function EditQuestions() {
  const navigate = useNavigate();
  const { id } = useParams();

  // =========================================================
  // STATE
  // ===========================================================

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [chapters, setChapters] = useState([]);

  const [langTab, setLangTab] = useState("en");

  const [correctOption, setCorrectOption] =
    useState("");

  const [chapterOpen, setChapterOpen] =
    useState(false);

  // =========================================================
  // FETCH QUESTION + CHAPTERS
  // ===========================================================

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: qData, error } =
          await supabase
            .from("questions")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        setQuestion(qData);
        setCorrectOption(
          resolveCorrectOption(qData)
        );

        const {
          data: chapterData,
          error: chapterError,
        } = await supabase
          .from("questions")
          .select("chapter");

        if (chapterError) {
          console.error(
            "Failed to load chapters:",
            chapterError
          );
        }

        if (!mounted) return;

        const uniqueChapters = [
          ...new Set(
            (chapterData || [])
              .map((item) =>
                item.chapter?.trim()
              )
              .filter(Boolean)
          ),
        ];

        setChapters(uniqueChapters);
      } catch (error) {
        console.error(
          "Failed to load question:",
          error
        );

        toast.error(
          "Failed to load question"
        );

        navigate(
          "/admin/preview-questions"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  // =========================================================
  // CHANGE FIELD
  // ===========================================================

  const handleChange = (
    field,
    value
  ) => {
    setQuestion((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // LANGUAGE COMPLETION
  // ===========================================================

  const englishComplete = useMemo(() => {
    if (!question) return false;

    return Boolean(
      normalizeValue(
        question.question_en
      ) &&
        OPTION_KEYS.every((key) =>
          normalizeValue(
            question[
              `option_${key}_en`
            ]
          )
        ) &&
        correctOption
    );
  }, [question, correctOption]);

  const tamilComplete = useMemo(() => {
    if (!question) return false;

    return Boolean(
      normalizeValue(
        question.question_ta
      ) &&
        OPTION_KEYS.every((key) =>
          normalizeValue(
            question[
              `option_${key}_ta`
            ]
          )
        ) &&
        correctOption
    );
  }, [question, correctOption]);

  // =========================================================
  // FORM VALIDATION
  // ===========================================================

  const formComplete = useMemo(() => {
    if (!question) return false;

    return Boolean(
      normalizeValue(question.chapter) &&
        normalizeValue(
          question.question_en
        ) &&
        normalizeValue(
          question.question_ta
        ) &&
        OPTION_KEYS.every(
          (key) =>
            normalizeValue(
              question[
                `option_${key}_en`
              ]
            ) &&
            normalizeValue(
              question[
                `option_${key}_ta`
              ]
            )
        ) &&
        correctOption
    );
  }, [question, correctOption]);

  // =========================================================
  // CORRECT ANSWER
  // ===========================================================

  const handleCorrectAnswer = (
    option
  ) => {
    setCorrectOption(option);
  };

  // =========================================================
  // SAVE
  // ===========================================================

  const handleSave = async () => {
    if (!question) return;

    const required = [
      "chapter",
      "question_en",
      "question_ta",
      "option_a_en",
      "option_b_en",
      "option_c_en",
      "option_d_en",
    ];

    for (const field of required) {
      if (
        !normalizeValue(
          question[field]
        )
      ) {
        toast.error(
          "Fill all mandatory fields"
        );

        return;
      }
    }

    if (!correctOption) {
      toast.error(
        "Select the correct answer"
      );

      return;
    }

    setSaving(true);

    try {
      // Preserve existing database semantics:
      // selected A/B/C/D -> matching answer text.
      const correctKey =
        correctOption.toLowerCase();

      const correctAnswerEN =
        question[
          `option_${correctKey}_en`
        ];

      const correctAnswerTA =
        question[
          `option_${correctKey}_ta`
        ];

      const {
        id: questionId,
        ...updateData
      } = question;

      updateData.correct_answer =
        normalizeValue(
          correctAnswerEN
        );

      updateData.correct_answer_ta =
        normalizeValue(
          correctAnswerTA
        );

      const { error } =
        await supabase
          .from("questions")
          .update(updateData)
          .eq("id", id);

      if (error) {
        throw error;
      }

      await logAdminActivity({
        action: "EDIT_QUESTION",
        module: "Questions",
        description: `Updated question in chapter "${question.chapter}"`,
        targetId: id,
        targetType: "question",
      });

      toast.success(
        "Question updated successfully!"
      );

      navigate(
        "/admin/preview-questions"
      );
    } catch (error) {
      console.error(
        "Question update failed:",
        error
      );

      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // ===========================================================

  if (loading) {
    return (
      <AdminLayout
        title="Edit Question"
        eyebrow="Question Management"
      >
        {({ theme }) => (
          <EditQuestionLoading
            theme={theme}
          />
        )}
      </AdminLayout>
    );
  }

  if (!question) {
    return null;
  }

  // =========================================================
  // UI
  // ===========================================================

  return (
    <AdminLayout
      title="Edit Question"
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
                  <PencilLine
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
                    Question Editor
                  </p>
                </div>

                <h2 className="mt-3 text-[26px] font-black tracking-[-0.035em] text-zinc-900 sm:text-[30px] lg:text-[34px]">
                  Edit quiz question
                </h2>

                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-600 sm:text-[14px]">
                  Update the English and
                  Tamil versions together,
                  verify the answer and
                  review the changes before
                  saving.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/preview-questions"
                  )
                }
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 text-[12px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
              >
                <ArrowLeft size={15} />

                Back to Questions
              </button>
            </div>
          </motion.section>

          {/* =================================================
              STATUS STRIP
          ================================================= */}

          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatusCard
              label="Question ID"
              value={`#${question.id}`}
              icon={FileQuestion}
              theme={theme}
            />

            <StatusCard
              label="English"
              value={
                englishComplete
                  ? "Complete"
                  : "Incomplete"
              }
              icon={
                englishComplete
                  ? CheckCircle2
                  : Languages
              }
              theme={theme}
              success={
                englishComplete
              }
            />

            <div className="col-span-2 sm:col-span-1">
              <StatusCard
                label="Tamil"
                value={
                  tamilComplete
                    ? "Complete"
                    : "Incomplete"
                }
                icon={
                  tamilComplete
                    ? CheckCircle2
                    : Languages
                }
                theme={theme}
                success={
                  tamilComplete
                }
              />
            </div>
          </section>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            {/* ===============================================
                EDIT FORM
            =============================================== */}

            <motion.div
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
              className="rounded-[22px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] sm:p-5 lg:p-6"
            >
              <SectionHeading
                icon={PencilLine}
                title="Question Details"
                description="Update the chapter and bilingual question content."
                theme={theme}
              />

              {/* =============================================
                  CHAPTER
              ============================================= */}

              <div className="mt-6">
                <FieldLabel
                  label="Chapter"
                  required
                />

                <div className="relative mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setChapterOpen(
                        (previous) =>
                          !previous
                      )
                    }
                    className="flex h-12 w-full items-center gap-3 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 text-left transition hover:border-zinc-300 hover:bg-white"
                  >
                    <BookOpen
                      size={17}
                      style={{
                        color:
                          theme.accent,
                      }}
                    />

                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-zinc-900">
                      {question.chapter ||
                        "Select chapter"}
                    </span>

                    <ChevronDown
                      size={16}
                      className={`text-zinc-500 transition-transform ${
                        chapterOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {chapterOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Close chapter selector"
                          onClick={() =>
                            setChapterOpen(
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
                          className="admin-hidden-scrollbar absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[260px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_18px_50px_rgba(24,24,27,0.14)]"
                          style={{
                            scrollbarWidth:
                              "none",
                            msOverflowStyle:
                              "none",
                          }}
                        >
                          {chapters.map(
                            (chapter) => {
                              const active =
                                question.chapter ===
                                chapter;

                              return (
                                <button
                                  key={
                                    chapter
                                  }
                                  type="button"
                                  onClick={() => {
                                    handleChange(
                                      "chapter",
                                      chapter
                                    );

                                    setChapterOpen(
                                      false
                                    );
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                    active
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

                                  <span
                                    className={`min-w-0 flex-1 truncate text-[12px] font-semibold ${
                                      active
                                        ? "text-zinc-900"
                                        : "text-zinc-600"
                                    }`}
                                  >
                                    {
                                      chapter
                                    }
                                  </span>

                                  {active && (
                                    <Check
                                      size={
                                        14
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

              {/* =============================================
                  LANGUAGE TABS
              ============================================= */}

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-black text-zinc-900">
                      Language
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-500">
                      Edit both translations
                      before saving.
                    </p>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <CompletionBadge
                      label="EN"
                      complete={
                        englishComplete
                      }
                    />

                    <CompletionBadge
                      label="TA"
                      complete={
                        tamilComplete
                      }
                    />
                  </div>
                </div>

                <LanguageTabs
                  value={langTab}
                  onChange={setLangTab}
                  englishComplete={
                    englishComplete
                  }
                  tamilComplete={
                    tamilComplete
                  }
                  theme={theme}
                />
              </div>

              {/* =============================================
                  LANGUAGE CONTENT
              ============================================= */}

              <AnimatePresence mode="wait">
                <motion.div
                  key={langTab}
                  initial={{
                    opacity: 0,
                    x:
                      langTab === "en"
                        ? -8
                        : 8,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x:
                      langTab === "en"
                        ? 8
                        : -8,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                  className="mt-6"
                >
                  <FieldLabel
                    label={
                      langTab === "en"
                        ? "Question — English"
                        : "Question — Tamil"
                    }
                    required
                  />

                  <textarea
                    rows={4}
                    value={
                      question[
                        `question_${langTab}`
                      ] || ""
                    }
                    onChange={(event) =>
                      handleChange(
                        `question_${langTab}`,
                        event.target.value
                      )
                    }
                    placeholder={
                      langTab === "en"
                        ? "Enter the question in English..."
                        : "தமிழில் கேள்வியை உள்ளிடவும்..."
                    }
                    className="mt-2 w-full resize-none rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3.5 text-[14px] leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,24,27,0.025)]"
                  />

                  {/* =========================================
                      OPTIONS
                  ========================================= */}

                  <div className="mt-6">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-black text-zinc-900">
                          Answer options
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-500">
                          Update all four
                          choices for this
                          language.
                        </p>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                        4 options
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {OPTION_KEYS.map(
                        (key) => {
                          const label =
                            key.toUpperCase();

                          return (
                            <OptionInput
                              key={`${langTab}-${key}`}
                              label={
                                label
                              }
                              value={
                                question[
                                  `option_${key}_${langTab}`
                                ] || ""
                              }
                              onChange={(
                                value
                              ) =>
                                handleChange(
                                  `option_${key}_${langTab}`,
                                  value
                                )
                              }
                              selected={
                                correctOption ===
                                label
                              }
                              theme={
                                theme
                              }
                            />
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* =========================================
                      CORRECT ANSWER
                  ========================================= */}

                  <div className="mt-6 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-4 sm:p-5">
                    <div>
                      <p className="text-[13px] font-black text-zinc-900">
                        Correct answer
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                        The same A/B/C/D
                        position is applied
                        to both English and
                        Tamil.
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                      {OPTION_LABELS.map(
                        (option) => {
                          const selected =
                            correctOption ===
                            option;

                          return (
                            <button
                              key={
                                option
                              }
                              type="button"
                              onClick={() =>
                                handleCorrectAnswer(
                                  option
                                )
                              }
                              className={`relative flex h-12 items-center justify-center rounded-xl border text-[14px] font-black transition ${
                                selected
                                  ? ""
                                  : "border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                              }`}
                              style={
                                selected
                                  ? {
                                      borderColor:
                                        `${theme.accent}45`,
                                      backgroundColor:
                                        theme.accentSoft,
                                      color:
                                        theme.accent,
                                    }
                                  : undefined
                              }
                            >
                              {selected && (
                                <motion.span
                                  layoutId="edit-correct-answer"
                                  className="absolute inset-0 rounded-xl"
                                  style={{
                                    boxShadow: `inset 0 0 0 1px ${theme.accent}20`,
                                  }}
                                />
                              )}

                              <span className="relative">
                                {
                                  option
                                }
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* =============================================
                  COMPLETION
              ============================================= */}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <LanguageProgress
                  label="English"
                  complete={
                    englishComplete
                  }
                />

                <LanguageProgress
                  label="Tamil"
                  complete={
                    tamilComplete
                  }
                />
              </div>

              {/* =============================================
                  ACTIONS
              ============================================= */}

              <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200/80 pt-5 sm:flex-row">
                <button
                  type="button"
                  disabled={
                    saving ||
                    !formComplete
                  }
                  onClick={handleSave}
                  className={`flex h-12 flex-1 items-center justify-center gap-2.5 rounded-xl px-5 text-[13px] font-black transition ${
                    !saving &&
                    formComplete
                      ? "text-white hover:-translate-y-0.5"
                      : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                  }`}
                  style={
                    !saving &&
                    formComplete
                      ? {
                          background: `linear-gradient(90deg, ${theme.accent}, ${
                            theme.chartSecondary ||
                            theme.accent
                          })`,
                          boxShadow: `0 12px 30px ${theme.accent}20`,
                        }
                      : undefined
                  }
                >
                  {saving ? (
                    <>
                      <LoadingSpinner />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save
                        size={16}
                      />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    navigate(
                      "/admin/preview-questions"
                    )
                  }
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-5 text-[13px] font-bold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
                >
                  <X size={15} />

                  Cancel
                </button>
              </div>

              {!formComplete && (
                <p className="mt-3 text-center text-[11px] leading-5 text-zinc-400">
                  Complete both
                  translations, all answer
                  options and select the
                  correct answer before
                  saving.
                </p>
              )}
            </motion.div>

            {/* ===============================================
                LIVE PREVIEW
            =============================================== */}

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.1,
              }}
              className="xl:sticky xl:top-[100px] xl:self-start"
            >
              <LivePreview
                question={question}
                correctOption={
                  correctOption
                }
                theme={theme}
              />
            </motion.div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

// ===========================================================
// LANGUAGE TABS
// ===========================================================

function LanguageTabs({
  value,
  onChange,
  englishComplete,
  tamilComplete,
  theme,
}) {
  const tabs = [
    {
      value: "en",
      label: "English",
      short: "EN",
      complete:
        englishComplete,
    },
    {
      value: "ta",
      label: "Tamil",
      short: "TA",
      complete:
        tamilComplete,
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-1.5">
      {tabs.map((tab) => {
        const active =
          value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() =>
              onChange(tab.value)
            }
            className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12px] font-black transition ${
              active
                ? ""
                : "text-zinc-500 hover:bg-white/70 hover:text-zinc-900"
            }`}
            style={
              active
                ? {
                    color:
                      theme.accent,
                  }
                : undefined
            }
          >
            {active && (
              <motion.div
                layoutId="edit-question-language-tab"
                className="absolute inset-0 rounded-xl border bg-white shadow-sm"
                style={{
                  borderColor:
                    `${theme.accent}25`,
                  boxShadow: `0 4px 14px ${theme.accent}0D`,
                }}
              />
            )}

            <span
              className="relative flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[9px] font-black"
              style={
                active
                  ? {
                      backgroundColor:
                        `${theme.accent}15`,
                      color:
                        theme.accent,
                    }
                  : {
                      backgroundColor:
                        "#E4E4E7",
                      color:
                        "#52525B",
                    }
              }
            >
              {tab.short}
            </span>

            <span className="relative">
              {tab.label}
            </span>

            {tab.complete && (
              <CheckCircle2
                size={14}
                className="relative text-emerald-600"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ===========================================================
// OPTION INPUT
// ===========================================================

function OptionInput({
  label,
  value,
  onChange,
  selected,
  theme,
}) {
  return (
    <div
      className="rounded-2xl border bg-[#F8FAFC] p-3 transition"
      style={{
        borderColor: selected
          ? `${theme.accent}35`
          : "#E4E4E7",

        boxShadow: selected
          ? `0 5px 18px ${theme.accent}0A`
          : "none",
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-black"
            style={
              selected
                ? {
                    color:
                      theme.accent,
                    borderColor:
                      `${theme.accent}30`,
                    backgroundColor:
                      theme.accentSoft,
                  }
                : {
                    color:
                      "#52525B",
                    borderColor:
                      "#E4E4E7",
                    backgroundColor:
                      "#FFFFFF",
                  }
            }
          >
            {label}
          </div>

          <span className="text-[11px] font-bold text-zinc-500">
            Option {label}
          </span>
        </div>

        {selected && (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-600">
            <Check size={11} />
            Correct
          </span>
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={`Enter option ${label}`}
        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:shadow-[0_0_0_3px_rgba(24,24,27,0.025)]"
      />
    </div>
  );
}

// ===========================================================
// LIVE PREVIEW
// ===========================================================

function LivePreview({
  question,
  correctOption,
  theme,
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
      {/* HEADER */}

      <div className="border-b border-zinc-200/80 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            icon={Sparkles}
            title="Live Preview"
            description="Review changes before saving."
            theme={theme}
          />

          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700">
            Live
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* CHAPTER */}

        <div className="rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3.5 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
            Chapter
          </p>

          <div className="mt-1.5 flex items-center gap-2">
            <BookOpen
              size={13}
              style={{
                color:
                  theme.accent,
              }}
            />

            <p className="text-[13px] font-bold text-zinc-900">
              {question.chapter ||
                "No chapter selected"}
            </p>
          </div>
        </div>

        {/* ENGLISH */}

        <PreviewLanguage
          code="EN"
          label="English"
          question={
            question.question_en
          }
          options={OPTION_KEYS.map(
            (key) => ({
              key:
                key.toUpperCase(),
              value:
                question[
                  `option_${key}_en`
                ] || "",
            })
          )}
          correctOption={
            correctOption
          }
          theme={theme}
        />

        {/* DIVIDER */}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />

          <Languages
            size={14}
            className="text-zinc-400"
          />

          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        {/* TAMIL */}

        <PreviewLanguage
          code="TA"
          label="Tamil"
          question={
            question.question_ta
          }
          options={OPTION_KEYS.map(
            (key) => ({
              key:
                key.toUpperCase(),
              value:
                question[
                  `option_${key}_ta`
                ] || "",
            })
          )}
          correctOption={
            correctOption
          }
          theme={theme}
        />
      </div>
    </div>
  );
}

// ===========================================================
// PREVIEW LANGUAGE
// ===========================================================

function PreviewLanguage({
  code,
  label,
  question,
  options,
  correctOption,
  theme,
}) {
  return (
    <div className="mt-5">
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

        <p className="text-[12px] font-black text-zinc-800">
          {label}
        </p>
      </div>

      {/* QUESTION */}

      <div className="mt-3">
        {normalizeValue(question) ? (
          <p className="whitespace-pre-wrap break-words text-[14px] font-semibold leading-6 text-zinc-900">
            {question}
          </p>
        ) : (
          <p className="text-[13px] italic text-zinc-400">
            Question will appear
            here...
          </p>
        )}
      </div>

      {/* OPTIONS */}

      <div className="mt-4 space-y-2">
        {options.map((option) => {
          const correct =
            option.key ===
            correctOption;

          return (
            <div
              key={option.key}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                correct
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-zinc-200/90 bg-[#F8FAFC]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                  correct
                    ? "bg-emerald-100 text-emerald-700"
                    : "border border-zinc-200 bg-white text-zinc-500"
                }`}
              >
                {correct ? (
                  <Check size={13} />
                ) : (
                  option.key
                )}
              </span>

              <p
                className={`min-w-0 flex-1 break-words pt-1 text-[12px] leading-5 ${
                  correct
                    ? "font-semibold text-emerald-800"
                    : "font-medium text-zinc-600"
                }`}
              >
                {option.value ||
                  "—"}
              </p>

              {correct && (
                <span className="mt-1 shrink-0 text-[8px] font-black uppercase tracking-[0.08em] text-emerald-600">
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
// STATUS CARD
// ===========================================================

function StatusCard({
  label,
  value,
  icon: Icon,
  theme,
  success = false,
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
      className="h-full rounded-[18px] border border-zinc-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.09)]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold text-zinc-500">
          {label}
        </p>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
            success
              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
              : ""
          }`}
          style={
            success
              ? undefined
              : {
                  borderColor:
                    `${theme.accent}20`,
                  backgroundColor:
                    theme.accentSoft,
                  color:
                    theme.accent,
                }
          }
        >
          <Icon size={14} />
        </div>
      </div>

      <p
        className={`mt-3 truncate text-[14px] font-black ${
          success
            ? "text-emerald-700"
            : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </motion.div>
  );
}

// ===========================================================
// LANGUAGE PROGRESS
// ===========================================================

function LanguageProgress({
  label,
  complete,
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
        complete
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-zinc-200/90 bg-[#F8FAFC]"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          complete
            ? "bg-emerald-100 text-emerald-700"
            : "border border-zinc-200 bg-white text-zinc-400"
        }`}
      >
        {complete ? (
          <Check size={15} />
        ) : (
          <Languages size={14} />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold text-zinc-700">
          {label}
        </p>

        <p
          className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${
            complete
              ? "text-emerald-600"
              : "text-zinc-400"
          }`}
        >
          {complete
            ? "Complete"
            : "Incomplete"}
        </p>
      </div>
    </div>
  );
}

// ===========================================================
// COMPLETION BADGE
// ===========================================================

function CompletionBadge({
  label,
  complete,
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
        complete
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-zinc-200 bg-[#F8FAFC] text-zinc-400"
      }`}
    >
      {complete && (
        <Check size={10} />
      )}

      <span className="text-[9px] font-black uppercase tracking-[0.08em]">
        {label}
      </span>
    </div>
  );
}

// ===========================================================
// SECTION HEADING
// ===========================================================

function SectionHeading({
  icon: Icon,
  title,
  description,
  theme,
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
        style={{
          borderColor:
            `${theme.accent}20`,
          backgroundColor:
            theme.accentSoft,
        }}
      >
        <Icon
          size={17}
          strokeWidth={1.8}
          style={{
            color:
              theme.accent,
          }}
        />
      </div>

      <div className="min-w-0">
        <h3 className="text-[15px] font-black text-zinc-900">
          {title}
        </h3>

        <p className="mt-1 text-[11px] text-zinc-500 sm:text-[12px]">
          {description}
        </p>
      </div>
    </div>
  );
}

// ===========================================================
// FIELD LABEL
// ===========================================================

function FieldLabel({
  label,
  required = false,
}) {
  return (
    <label className="flex items-center gap-1 text-[12px] font-bold text-zinc-700">
      {label}

      {required && (
        <span className="text-red-500">
          *
        </span>
      )}
    </label>
  );
}

// ===========================================================
// LOADING
// ===========================================================

function EditQuestionLoading({
  theme,
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-zinc-200/90 bg-white p-6 shadow-[0_10px_30px_rgba(24,24,27,0.06)]">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 animate-pulse rounded-xl"
            style={{
              backgroundColor:
                theme.accentSoft,
            }}
          />

          <div className="flex-1">
            <div className="h-4 w-44 animate-pulse rounded-full bg-zinc-200" />

            <div className="mt-3 h-3 max-w-sm animate-pulse rounded-full bg-zinc-100" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="rounded-[22px] border border-zinc-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(24,24,27,0.05)]">
          <div className="h-12 animate-pulse rounded-2xl bg-[#F8FAFC]" />

          <div className="mt-5 h-12 animate-pulse rounded-2xl bg-[#F8FAFC]" />

          <div className="mt-5 h-28 animate-pulse rounded-2xl bg-[#F8FAFC]" />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-2xl bg-[#F8FAFC]" />
            <div className="h-20 animate-pulse rounded-2xl bg-[#F8FAFC]" />
            <div className="h-20 animate-pulse rounded-2xl bg-[#F8FAFC]" />
            <div className="h-20 animate-pulse rounded-2xl bg-[#F8FAFC]" />
          </div>
        </div>

        <div className="h-[500px] rounded-[22px] border border-zinc-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(24,24,27,0.05)]">
          <div className="h-full animate-pulse rounded-2xl bg-[#F8FAFC]" />
        </div>
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