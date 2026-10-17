import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  FileQuestion,
  Languages,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { logAdminActivity } from "../utils/logAdminActivity";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// CONSTANTS
// ===========================================================

const OPTION_LABELS = ["A", "B", "C", "D"];

// ===========================================================
// ADD QUESTIONS
// ===========================================================

export default function AddQuestions() {
  // =========================================================
  // STATE
  // ===========================================================

  const [loading, setLoading] = useState(false);

  const [chapter, setChapter] = useState("");
  const [allChapters, setAllChapters] = useState([]);

  const [tabIndex, setTabIndex] = useState(0);

  const [question_en, setQuestionEn] = useState("");
  const [question_ta, setQuestionTa] = useState("");

  const [optionA_en, setOptionAEn] = useState("");
  const [optionB_en, setOptionBEn] = useState("");
  const [optionC_en, setOptionCEn] = useState("");
  const [optionD_en, setOptionDEn] = useState("");

  const [optionA_ta, setOptionATa] = useState("");
  const [optionB_ta, setOptionBTa] = useState("");
  const [optionC_ta, setOptionCTa] = useState("");
  const [optionD_ta, setOptionDTa] = useState("");

  const [correct_en, setCorrectEn] = useState("");
  const [correct_ta, setCorrectTa] = useState("");

  // =========================================================
  // FETCH CHAPTERS
  // ===========================================================

  useEffect(() => {
    let mounted = true;

    const fetchChapters = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("chapter")
          .not("chapter", "is", null);

        if (error) {
          console.error("Unable to fetch chapters:", error);
          return;
        }

        if (!mounted || !data) return;

        const unique = [
          ...new Set(
            data
              .map((q) => q.chapter)
              .filter(Boolean)
          ),
        ];

        setAllChapters(unique);
      } catch (error) {
        console.error("Chapter fetch failed:", error);
      }
    };

    fetchChapters();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // OPTIONS
  // ===========================================================

  const optionsEN = useMemo(
    () => [
      {
        label: "A",
        value: optionA_en,
        setter: setOptionAEn,
      },
      {
        label: "B",
        value: optionB_en,
        setter: setOptionBEn,
      },
      {
        label: "C",
        value: optionC_en,
        setter: setOptionCEn,
      },
      {
        label: "D",
        value: optionD_en,
        setter: setOptionDEn,
      },
    ],
    [
      optionA_en,
      optionB_en,
      optionC_en,
      optionD_en,
    ]
  );

  const optionsTA = useMemo(
    () => [
      {
        label: "A",
        value: optionA_ta,
        setter: setOptionATa,
      },
      {
        label: "B",
        value: optionB_ta,
        setter: setOptionBTa,
      },
      {
        label: "C",
        value: optionC_ta,
        setter: setOptionCTa,
      },
      {
        label: "D",
        value: optionD_ta,
        setter: setOptionDTa,
      },
    ],
    [
      optionA_ta,
      optionB_ta,
      optionC_ta,
      optionD_ta,
    ]
  );

  const currentOptions =
    tabIndex === 0 ? optionsEN : optionsTA;

  // =========================================================
  // VALIDATION
  // ===========================================================

  const allFieldsFilled =
    chapter.trim() &&
    question_en.trim() &&
    question_ta.trim() &&
    optionA_en.trim() &&
    optionB_en.trim() &&
    optionC_en.trim() &&
    optionD_en.trim() &&
    optionA_ta.trim() &&
    optionB_ta.trim() &&
    optionC_ta.trim() &&
    optionD_ta.trim() &&
    correct_en &&
    correct_ta;

  const completedEnglish =
    question_en.trim() &&
    optionA_en.trim() &&
    optionB_en.trim() &&
    optionC_en.trim() &&
    optionD_en.trim() &&
    correct_en;

  const completedTamil =
    question_ta.trim() &&
    optionA_ta.trim() &&
    optionB_ta.trim() &&
    optionC_ta.trim() &&
    optionD_ta.trim() &&
    correct_ta;

  // =========================================================
  // SELECT CORRECT ANSWER
  // ===========================================================

  const handleCorrectAnswer = (option) => {
    /*
      Preserve existing behavior:
      selecting A/B/C/D applies the same option position
      to both English and Tamil.
    */

    setCorrectEn(option);
    setCorrectTa(option);
  };

  // =========================================================
  // RESET FORM
  // ===========================================================

  const resetForm = () => {
    setQuestionEn("");
    setQuestionTa("");

    setOptionAEn("");
    setOptionBEn("");
    setOptionCEn("");
    setOptionDEn("");

    setOptionATa("");
    setOptionBTa("");
    setOptionCTa("");
    setOptionDTa("");

    setCorrectEn("");
    setCorrectTa("");

    setTabIndex(0);
  };

  // =========================================================
  // ADD QUESTION
  // ===========================================================

  const handleAddQuestion = async () => {
    if (!allFieldsFilled) {
      toast.error("Please complete all fields");
      return;
    }

    setLoading(true);

    try {
      const correctAnswerTextEN =
        correct_en === "A"
          ? optionA_en
          : correct_en === "B"
            ? optionB_en
            : correct_en === "C"
              ? optionC_en
              : optionD_en;

      const correctAnswerTextTA =
        correct_ta === "A"
          ? optionA_ta
          : correct_ta === "B"
            ? optionB_ta
            : correct_ta === "C"
              ? optionC_ta
              : optionD_ta;

      const { error } = await supabase
        .from("questions")
        .insert([
          {
            chapter: chapter.trim(),

            question_en: question_en.trim(),
            question_ta: question_ta.trim(),

            option_a_en: optionA_en.trim(),
            option_b_en: optionB_en.trim(),
            option_c_en: optionC_en.trim(),
            option_d_en: optionD_en.trim(),

            option_a_ta: optionA_ta.trim(),
            option_b_ta: optionB_ta.trim(),
            option_c_ta: optionC_ta.trim(),
            option_d_ta: optionD_ta.trim(),

            correct_answer: correctAnswerTextEN.trim(),
            correct_answer_ta:
              correctAnswerTextTA.trim(),

            created_at: new Date(),
          },
        ]);

      if (error) {
        console.error("Question insert failed:", error);

        toast.error("Failed to add question");
        return;
      }

      await logAdminActivity({
        action: "ADD_QUESTION",
        module: "Questions",
        description: `Added a new question to chapter "${chapter.trim()}"`,
        targetType: "question",
      });

      toast.success("Question added!");

      // Keep chapter selected for quick batch entry.
      resetForm();

      // Add a newly-created chapter to suggestions.
      setAllChapters((prev) => {
        const cleanChapter = chapter.trim();

        if (
          prev.some(
            (item) =>
              item.toLowerCase() ===
              cleanChapter.toLowerCase()
          )
        ) {
          return prev;
        }

        return [...prev, cleanChapter];
      });
    } catch (error) {
      console.error("Unable to add question:", error);

      toast.error(
        error?.message ||
        "Something went wrong while adding the question"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // ===========================================================

  return (
    <AdminLayout
      title="Add Questions"
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
                border: "1px solid #E4E4E7",
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
              PAGE INTRO
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
                backgroundColor: `${theme.accent}10`,
              }}
            />

            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(24,24,27,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,.18) 1px, transparent 1px)",
                backgroundSize: "34px 34px",
              }}
            />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={15}
                    style={{
                      color: theme.accent,
                    }}
                  />

                  <p
                    className="text-[11px] font-black uppercase tracking-[0.14em]"
                    style={{
                      color: theme.accent,
                    }}
                  >
                    Question Builder
                  </p>
                </div>

                <h2 className="mt-3 text-[25px] font-black tracking-[-0.035em] text-zinc-900 sm:text-[29px]">
                  Create a new quiz question
                </h2>

                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-600">
                  Build the English and Tamil versions
                  together, select the correct answer and
                  review everything before publishing.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${theme.accent}20`,
                    backgroundColor:
                      theme.accentSoft,
                  }}
                >
                  <Languages
                    size={18}
                    style={{
                      color: theme.accent,
                    }}
                  />
                </div>

                <div>
                  <p className="text-[12px] font-black text-zinc-900">
                    Bilingual question
                  </p>

                  <p className="mt-1 text-[11px] text-zinc-500">
                    English + Tamil
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            {/* ===============================================
                QUESTION BUILDER
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
                icon={FileQuestion}
                title="Question Details"
                description="Enter the chapter and question content."
                theme={theme}
              />

              {/* CHAPTER */}

              <div className="mt-6">
                <ChapterInput
                  value={chapter}
                  onChange={setChapter}
                  chapters={allChapters}
                  theme={theme}
                />
              </div>

              {/* LANGUAGE */}

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-black text-zinc-900">
                      Language
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-500">
                      Complete both translations before
                      publishing.
                    </p>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <CompletionBadge
                      complete={completedEnglish}
                      label="EN"
                    />

                    <CompletionBadge
                      complete={completedTamil}
                      label="TA"
                    />
                  </div>
                </div>

                <LanguageTabs
                  tabIndex={tabIndex}
                  setTabIndex={setTabIndex}
                  completedEnglish={
                    completedEnglish
                  }
                  completedTamil={completedTamil}
                  theme={theme}
                />
              </div>

              {/* LANGUAGE CONTENT */}

              <AnimatePresence mode="wait">
                <motion.div
                  key={tabIndex}
                  initial={{
                    opacity: 0,
                    x: tabIndex === 0 ? -8 : 8,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: tabIndex === 0 ? 8 : -8,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                  className="mt-6"
                >
                  <FieldLabel
                    label={
                      tabIndex === 0
                        ? "Question — English"
                        : "Question — Tamil"
                    }
                    required
                  />

                  <textarea
                    rows={4}
                    value={
                      tabIndex === 0
                        ? question_en
                        : question_ta
                    }
                    onChange={(e) => {
                      if (tabIndex === 0) {
                        setQuestionEn(e.target.value);
                      } else {
                        setQuestionTa(e.target.value);
                      }
                    }}
                    placeholder={
                      tabIndex === 0
                        ? "Enter the question in English..."
                        : "தமிழில் கேள்வியை உள்ளிடவும்..."
                    }
                    className="mt-2 w-full resize-none rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3.5 text-[14px] leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,24,27,0.025)]"
                  />

                  {/* OPTIONS */}

                  <div className="mt-6">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-black text-zinc-900">
                          Answer options
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-500">
                          Enter all four choices for this
                          language.
                        </p>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                        4 options
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {currentOptions.map(
                        (option) => (
                          <OptionInput
                            key={`${tabIndex}-${option.label}`}
                            label={option.label}
                            value={option.value}
                            onChange={
                              option.setter
                            }
                            selected={
                              (tabIndex === 0
                                ? correct_en
                                : correct_ta) ===
                              option.label
                            }
                            theme={theme}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* CORRECT ANSWER */}

                  <div className="mt-6 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-4 sm:p-5">
                    <div>
                      <p className="text-[13px] font-black text-zinc-900">
                        Select correct answer
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                        The same option position is used for
                        both English and Tamil.
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                      {OPTION_LABELS.map((option) => {
                        const selected =
                          (tabIndex === 0
                            ? correct_en
                            : correct_ta) === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              handleCorrectAnswer(
                                option
                              )
                            }
                            className={`relative flex h-12 items-center justify-center rounded-xl border text-[14px] font-black transition ${selected
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
                                layoutId="correct-answer"
                                className="absolute inset-0 rounded-xl"
                                style={{
                                  boxShadow: `inset 0 0 0 1px ${theme.accent}20`,
                                }}
                              />
                            )}

                            <span className="relative">
                              {option}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* COMPLETION */}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <LanguageProgress
                  label="English"
                  complete={completedEnglish}
                  theme={theme}
                />

                <LanguageProgress
                  label="Tamil"
                  complete={completedTamil}
                  theme={theme}
                />
              </div>

              {/* SUBMIT */}

              <button
                type="button"
                disabled={!allFieldsFilled || loading}
                onClick={handleAddQuestion}
                className={`mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-[14px] font-black transition ${allFieldsFilled && !loading
                    ? "text-white shadow-lg hover:-translate-y-0.5"
                    : "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400"
                  }`}
                style={
                  allFieldsFilled && !loading
                    ? {
                      background: `linear-gradient(90deg, ${theme.accent}, ${theme.chartSecondary ||
                        theme.accent
                        })`,
                      boxShadow: `0 12px 30px ${theme.accent}20`,
                    }
                    : undefined
                }
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Adding question...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Question
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {!allFieldsFilled && (
                <p className="mt-3 text-center text-[11px] leading-5 text-zinc-400">
                  Complete the chapter, both languages,
                  all answer options and the correct
                  answer to continue.
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
                chapter={chapter}
                questionEN={question_en}
                questionTA={question_ta}
                optionsEN={optionsEN}
                optionsTA={optionsTA}
                correctEN={correct_en}
                correctTA={correct_ta}
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
// CHAPTER INPUT
// ===========================================================

function ChapterInput({
  value,
  onChange,
  chapters,
  theme,
}) {
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);

  const normalizedValue =
    value.trim().toLowerCase();

  const filteredChapters = useMemo(() => {
    if (!normalizedValue) {
      return chapters.slice(0, 8);
    }

    return chapters
      .filter((chapter) =>
        chapter
          .toLowerCase()
          .includes(normalizedValue)
      )
      .slice(0, 8);
  }, [chapters, normalizedValue]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <FieldLabel
        label="Chapter"
        required
      />

      <div className="relative mt-2">
        <BookOpen
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />

        <input
          type="text"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder="Select or enter a chapter"
          className="h-12 w-full rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] pl-11 pr-11 text-[13px] font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,24,27,0.025)]"
        />

        <button
          type="button"
          onClick={() =>
            setOpen((prev) => !prev)
          }
          aria-label="Show chapters"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {/* DROPDOWN */}

      <AnimatePresence>
        {open &&
          (filteredChapters.length > 0 ||
            value.trim()) && (
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
              className="admin-hidden-scrollbar absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[230px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_18px_50px_rgba(24,24,27,0.14)]"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {filteredChapters.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <BookOpen
                      size={14}
                      style={{
                        color:
                          item === value
                            ? theme.accent
                            : undefined,
                      }}
                    />

                    <span className="truncate">
                      {item}
                    </span>

                    {item === value && (
                      <Check
                        size={14}
                        className="ml-auto"
                        style={{
                          color: theme.accent,
                        }}
                      />
                    )}
                  </button>
                )
              )}

              {value.trim() &&
                !chapters.some(
                  (item) =>
                    item.toLowerCase() ===
                    normalizedValue
                ) && (
                  <>
                    {filteredChapters.length >
                      0 && (
                        <div className="my-1 border-t border-zinc-200" />
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        setOpen(false)
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-zinc-100"
                    >
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor:
                            theme.accentSoft,
                          color:
                            theme.accent,
                        }}
                      >
                        <Plus size={14} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] text-zinc-500">
                          Use new chapter
                        </p>

                        <p className="truncate text-[12px] font-bold text-zinc-900">
                          {value.trim()}
                        </p>
                      </div>
                    </button>
                  </>
                )}
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

// ===========================================================
// LANGUAGE TABS
// ===========================================================

function LanguageTabs({
  tabIndex,
  setTabIndex,
  completedEnglish,
  completedTamil,
  theme,
}) {
  const tabs = [
    {
      index: 0,
      label: "English",
      short: "EN",
      complete: completedEnglish,
    },
    {
      index: 1,
      label: "Tamil",
      short: "TA",
      complete: completedTamil,
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-1.5">
      {tabs.map((tab) => {
        const active =
          tabIndex === tab.index;

        return (
          <button
            key={tab.index}
            type="button"
            onClick={() =>
              setTabIndex(tab.index)
            }
            className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12px] font-black transition ${active
                ? ""
                : "text-zinc-500 hover:bg-white/70 hover:text-zinc-900"
              }`}
            style={
              active
                ? {
                  color: theme.accent,
                }
                : undefined
            }
          >
            {active && (
              <motion.div
                layoutId="add-question-language"
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
                    color: "#52525B",
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
      <div className="mb-2 flex items-center justify-between">
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
                  color: "#52525B",
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
        onChange={(e) =>
          onChange(e.target.value)
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
  chapter,
  questionEN,
  questionTA,
  optionsEN,
  optionsTA,
  correctEN,
  correctTA,
  theme,
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_8px_24px_rgba(24,24,27,0.07)]">
      {/* HEADER */}

      <div className="border-b border-zinc-200/80 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            icon={Save}
            title="Live Preview"
            description="Review before publishing."
            theme={theme}
          />

          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700">
            Live
          </span>
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-4 sm:p-5">
        {/* CHAPTER */}

        <div className="rounded-xl border border-zinc-200/90 bg-[#F8FAFC] px-3.5 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
            Chapter
          </p>

          <p
            className={`mt-1.5 text-[13px] font-bold ${chapter
                ? "text-zinc-900"
                : "text-zinc-400"
              }`}
          >
            {chapter || "No chapter selected"}
          </p>
        </div>

        {/* ENGLISH */}

        <PreviewLanguage
          label="English"
          languageCode="EN"
          question={questionEN}
          options={optionsEN}
          correct={correctEN}
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
          label="Tamil"
          languageCode="TA"
          question={questionTA}
          options={optionsTA}
          correct={correctTA}
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
  label,
  languageCode,
  question,
  options,
  correct,
  theme,
}) {
  const visibleOptions = options.filter(
    (option) => option.value.trim()
  );

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
          {languageCode}
        </span>

        <p className="text-[12px] font-black text-zinc-800">
          {label}
        </p>
      </div>

      {/* QUESTION */}

      <div className="mt-3">
        {question.trim() ? (
          <p className="whitespace-pre-wrap text-[14px] font-semibold leading-6 text-zinc-900">
            {question}
          </p>
        ) : (
          <p className="text-[13px] italic text-zinc-400">
            Question will appear here...
          </p>
        )}
      </div>

      {/* OPTIONS */}

      <div className="mt-4 space-y-2">
        {visibleOptions.length > 0 ? (
          visibleOptions.map((option) => {
            const selected =
              option.label === correct;

            return (
              <div
                key={option.label}
                className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${selected
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-zinc-200/90 bg-[#F8FAFC]"
                  }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${selected
                      ? "bg-emerald-100 text-emerald-700"
                      : "border border-zinc-200 bg-white text-zinc-500"
                    }`}
                >
                  {selected ? (
                    <Check size={13} />
                  ) : (
                    option.label
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words text-[12px] leading-5 ${selected
                        ? "font-semibold text-emerald-800"
                        : "font-medium text-zinc-600"
                      }`}
                  >
                    {option.value}
                  </p>
                </div>

                {selected && (
                  <span className="mt-0.5 shrink-0 text-[8px] font-black uppercase tracking-[0.08em] text-emerald-600">
                    Correct
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-[#F8FAFC] px-4 py-5 text-center">
            <p className="text-[11px] text-zinc-400">
              Options will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================
// LANGUAGE PROGRESS
// ===========================================================

function LanguageProgress({
  label,
  complete,
  theme,
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${complete
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-zinc-200/90 bg-[#F8FAFC]"
        }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${complete
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
          className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${complete
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
  complete,
  label,
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${complete
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-zinc-200 bg-[#F8FAFC] text-zinc-400"
        }`}
    >
      {complete && <Check size={10} />}

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
            color: theme.accent,
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