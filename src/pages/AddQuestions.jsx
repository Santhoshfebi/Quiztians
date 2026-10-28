import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileQuestion,
  FileSpreadsheet,
  Languages,
  Plus,
  Save,
  Sparkles,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { logAdminActivity } from "../utils/logAdminActivity";
import AdminLayout from "../components/admin/AdminLayout";

// ===========================================================
// CONSTANTS
// ===========================================================

const OPTION_LABELS = ["A", "B", "C", "D"];

const IMPORT_COLUMNS = [
  "chapter", "question_en", "question_ta",
  "option_a_en", "option_b_en", "option_c_en", "option_d_en",
  "option_a_ta", "option_b_ta", "option_c_ta", "option_d_ta",
  "correct_answer",
];

const IMPORT_TEMPLATE_ROW = {
  chapter: "John",
  question_en: "Who came to Jesus at night?",
  question_ta: "இரவில் இயேசுவிடம் வந்தவர் யார்?",
  option_a_en: "Peter", option_b_en: "Nicodemus", option_c_en: "John", option_d_en: "Thomas",
  option_a_ta: "பேதுரு", option_b_ta: "நிக்கொதேமு", option_c_ta: "யோவான்", option_d_ta: "தோமா",
  correct_answer: "B",
};

// ===========================================================
// ADD QUESTIONS
// ===========================================================

export default function AddQuestions() {
  // =========================================================
  // STATE
  // ===========================================================

  const [loading, setLoading] = useState(false);

  const importInputRef = useRef(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importRows, setImportRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importDragActive, setImportDragActive] = useState(false);

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
      This intentionally preserves your original behavior:
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

      /*
        Keep chapter selected so multiple questions can be
        entered into the same chapter quickly.

        Your original page also did not clear chapter.
      */

      resetForm();

      /*
        If this was a brand-new chapter, make it immediately
        available in the chapter suggestions.
      */

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
  // BULK QUESTION IMPORT
  // =========================================================

  const resetImport = () => {
    setImportFile(null);
    setImportRows([]);
    setImportDragActive(false);
    if (importInputRef.current) importInputRef.current.value = "";
  };

  const closeImport = () => {
    if (importing) return;
    setImportOpen(false);
    resetImport();
  };

  const normalizeImportValue = (value) =>
    value === null || value === undefined ? "" : String(value).trim();

  const validateImportRow = (rawRow, index) => {
    const row = {};
    IMPORT_COLUMNS.forEach((column) => { row[column] = normalizeImportValue(rawRow?.[column]); });
    const errors = [];
    const requiredFields = [
      ["chapter", "Chapter"], ["question_en", "English question"], ["question_ta", "Tamil question"],
      ["option_a_en", "English option A"], ["option_b_en", "English option B"], ["option_c_en", "English option C"], ["option_d_en", "English option D"],
      ["option_a_ta", "Tamil option A"], ["option_b_ta", "Tamil option B"], ["option_c_ta", "Tamil option C"], ["option_d_ta", "Tamil option D"],
      ["correct_answer", "Correct answer"],
    ];
    requiredFields.forEach(([field, label]) => { if (!row[field]) errors.push(`${label} is missing`); });
    const correctLetter = row.correct_answer.toUpperCase();
    if (row.correct_answer && !OPTION_LABELS.includes(correctLetter)) errors.push("Correct answer must be A, B, C or D");
    return { id: `import-${index}-${Date.now()}`, rowNumber: index + 2, data: { ...row, correct_answer: correctLetter }, errors, valid: errors.length === 0 };
  };

  const parseImportFile = async (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension)) { toast.error("Please upload an Excel (.xlsx/.xls) or CSV file"); return; }
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("The uploaded spreadsheet does not contain a sheet");
      const jsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: "", raw: false });
      if (!jsonRows.length) throw new Error("The uploaded file does not contain any questions");
      const normalizedRows = jsonRows.map((rawRow) => {
        const normalized = {};
        Object.entries(rawRow || {}).forEach(([key, value]) => { normalized[String(key).trim().toLowerCase()] = value; });
        return normalized;
      });
      const validatedRows = normalizedRows.map(validateImportRow);
      setImportFile(file); setImportRows(validatedRows);
      const validCount = validatedRows.filter((row) => row.valid).length;
      const invalidCount = validatedRows.length - validCount;
      if (invalidCount) toast.error(`${invalidCount} ${invalidCount === 1 ? "row needs" : "rows need"} attention`);
      else toast.success(`${validCount} ${validCount === 1 ? "question is" : "questions are"} ready to import`);
    } catch (error) {
      console.error("Unable to parse import file:", error); resetImport();
      toast.error(error?.message || "Unable to read the selected file");
    }
  };

  const handleImportFileChange = async (event) => { const file = event.target.files?.[0]; if (file) await parseImportFile(file); };
  const handleImportDrop = async (event) => { event.preventDefault(); setImportDragActive(false); const file = event.dataTransfer.files?.[0]; if (file) await parseImportFile(file); };

  const downloadImportTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([IMPORT_TEMPLATE_ROW], { header: IMPORT_COLUMNS });
    worksheet["!cols"] = [{ wch: 20 }, { wch: 45 }, { wch: 45 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 16 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "quiztians-question-import-template.xlsx");
    toast.success("Import template downloaded");
  };

  const validImportRows = importRows.filter((row) => row.valid);
  const invalidImportRows = importRows.filter((row) => !row.valid);

  const handleBulkImport = async () => {
    if (importing || !validImportRows.length) return;
    if (invalidImportRows.length) { toast.error("Fix the invalid rows before importing"); return; }
    setImporting(true);
    try {
      const questionsToInsert = validImportRows.map(({ data }) => {
        const key = data.correct_answer.toLowerCase();
        return {
          chapter: data.chapter.trim(), question_en: data.question_en.trim(), question_ta: data.question_ta.trim(),
          option_a_en: data.option_a_en.trim(), option_b_en: data.option_b_en.trim(), option_c_en: data.option_c_en.trim(), option_d_en: data.option_d_en.trim(),
          option_a_ta: data.option_a_ta.trim(), option_b_ta: data.option_b_ta.trim(), option_c_ta: data.option_c_ta.trim(), option_d_ta: data.option_d_ta.trim(),
          correct_answer: data[`option_${key}_en`].trim(), correct_answer_ta: data[`option_${key}_ta`].trim(), created_at: new Date().toISOString(),
        };
      });
      const { error } = await supabase.from("questions").insert(questionsToInsert);
      if (error) throw error;
      const importedChapters = [...new Set(questionsToInsert.map((q) => q.chapter))];
      setAllChapters((previous) => {
        const map = new Map(previous.map((item) => [item.toLowerCase(), item]));
        importedChapters.forEach((item) => { if (!map.has(item.toLowerCase())) map.set(item.toLowerCase(), item); });
        return Array.from(map.values());
      });
      await logAdminActivity({ action: "IMPORT_QUESTIONS", module: "Questions", description: `Imported ${questionsToInsert.length} questions from "${importFile?.name || "spreadsheet"}"`, targetType: "question" });
      toast.success(`${questionsToInsert.length} ${questionsToInsert.length === 1 ? "question" : "questions"} imported successfully`);
      setImportOpen(false); resetImport();
    } catch (error) { console.error("Question import failed:", error); toast.error(error?.message || "Unable to import questions"); }
    finally { setImporting(false); }
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

          {/* IMPORT NOTE */}
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-sky-500/10 bg-sky-500/[0.04] px-4 py-3.5">
            <FileSpreadsheet size={17} className="mt-0.5 shrink-0 text-sky-400" />
            <p className="text-[11px] leading-5 text-zinc-500 sm:text-[12px]">
              <span className="font-black text-zinc-900">Quick tip:</span>{" "}
              You can import questions using the Import Questions option. Download the template, fill in your bilingual questions, then upload the Excel or CSV file to add multiple questions at once.
            </p>
          </div>

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
            className="relative overflow-hidden rounded-[24px] border border-zinc-200/90 bg-white p-5 sm:p-6 lg:p-7"
          >
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-[100px]"
              style={{ backgroundColor: `${theme.accent}10` }}
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

                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-500">
                  Build the English and Tamil versions
                  together, select the correct answer and
                  review everything before publishing.
                </p>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ borderColor: `${theme.accent}20`, backgroundColor: theme.accentSoft }}>
                    <Languages size={18} style={{ color: theme.accent }} />
                  </div>
                  <div><p className="text-[12px] font-black text-zinc-900">Bilingual question</p><p className="mt-1 text-[11px] text-zinc-500">English + Tamil</p></div>
                </div>
                <button type="button" onClick={() => setImportOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[11px] font-black text-zinc-400 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900">
                  <Upload size={15} style={{ color: theme.accent }} /> Import Questions
                </button>
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
              className="rounded-[22px] border border-zinc-200/90 bg-white p-4 sm:p-5 lg:p-6"
            >
              {/* =============================================
                  CARD HEADER
              ============================================= */}

              <SectionHeading
                icon={FileQuestion}
                title="Question Details"
                description="Enter the chapter and question content."
                theme={theme}
              />

              {/* =============================================
                  CHAPTER
              ============================================= */}

              <div className="mt-6">
                <ChapterInput
                  value={chapter}
                  onChange={setChapter}
                  chapters={allChapters}
                  theme={theme}
                />
              </div>

              {/* =============================================
                  LANGUAGE TABS
              ============================================= */}

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

              {/* =============================================
                  LANGUAGE CONTENT
              ============================================= */}

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
                  {/* QUESTION */}

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
                    className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-[#F8FAFC] px-4 py-3.5 text-[14px] leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
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
                              ? "text-zinc-900"
                              : "border-zinc-200/90 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
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

              {/* =============================================
                  COMPLETION
              ============================================= */}

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

              {/* =============================================
                  SUBMIT
              ============================================= */}

              <button
                type="button"
                disabled={!allFieldsFilled || loading}
                onClick={handleAddQuestion}
                className={`mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-[14px] font-black transition ${allFieldsFilled && !loading
                  ? "text-white shadow-lg hover:-translate-y-0.5"
                  : "cursor-not-allowed border border-zinc-200 bg-zinc-50 text-zinc-400"
                  }`}
                style={
                  allFieldsFilled && !loading
                    ? {
                      background: `linear-gradient(90deg, ${theme.accent}, ${theme.chartSecondary ||
                        theme.accent
                        })`,
                      boxShadow: `0 12px 30px ${theme.accent}18`,
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
          <AnimatePresence>
            {importOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/35 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget && !importing) closeImport(); }}>
                <motion.div initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }} className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_30px_100px_rgba(24,24,27,.18)]">
                  <div className="flex items-start justify-between gap-4 border-b border-zinc-200/90 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ borderColor: `${theme.accent}25`, backgroundColor: theme.accentSoft }}><FileSpreadsheet size={18} style={{ color: theme.accent }} /></div><div><p className="text-[9px] font-black uppercase tracking-[.14em]" style={{ color: theme.accent }}>Bulk Import</p><h3 className="mt-1 text-[20px] font-black text-zinc-900">Import Questions</h3><p className="mt-1 text-[11px] text-zinc-500">Upload bilingual questions using Excel or CSV.</p></div></div>
                    <button type="button" disabled={importing} onClick={closeImport} className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/90 text-zinc-500 hover:text-zinc-900"><X size={16} /></button>
                  </div>
                  <div className="overflow-y-auto px-4 py-5 sm:px-6">
                    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[12px] font-black text-zinc-900">Start with our template</p><p className="mt-1 text-[10px] leading-5 text-zinc-500">Keep the column names unchanged. Use A, B, C or D in correct_answer.</p></div><button type="button" onClick={downloadImportTemplate} className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-[10px] font-black text-zinc-400 hover:bg-zinc-100"><Download size={14} /> Download Template</button></div>
                    <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFileChange} className="hidden" />
                    <div onDragEnter={(e) => { e.preventDefault(); setImportDragActive(true) }} onDragOver={(e) => { e.preventDefault(); setImportDragActive(true) }} onDragLeave={(e) => { e.preventDefault(); setImportDragActive(false) }} onDrop={handleImportDrop} className={`mt-4 rounded-[20px] border border-dashed p-6 text-center transition sm:p-8 ${importDragActive ? "border-zinc-300 bg-zinc-100" : "border-zinc-200 bg-zinc-50"}`}>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: `${theme.accent}25`, backgroundColor: theme.accentSoft }}><Upload size={20} style={{ color: theme.accent }} /></div><p className="mt-4 text-[13px] font-black text-zinc-900">Drop your spreadsheet here</p><p className="mt-1 text-[10px] text-zinc-500">Excel .xlsx / .xls or CSV</p><button type="button" onClick={() => importInputRef.current?.click()} className="mt-4 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-[10px] font-black text-zinc-400 hover:bg-zinc-100">Browse File</button>{importFile && <p className="mx-auto mt-4 max-w-md truncate text-[10px] font-bold text-zinc-500">{importFile.name}</p>}
                    </div>
                    {importRows.length > 0 && <><div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3"><ImportStat label="Total" value={importRows.length} /><ImportStat label="Ready" value={validImportRows.length} tone="success" /><ImportStat label="Invalid" value={invalidImportRows.length} tone={invalidImportRows.length ? "danger" : "success"} /></div><div className="mt-5"><div className="flex justify-between"><div><p className="text-[12px] font-black text-zinc-900">Import Preview</p><p className="mt-1 text-[10px] text-zinc-500">Review all rows before importing.</p></div><span className="text-[9px] font-black uppercase text-zinc-400">{importRows.length} rows</span></div><div className="mt-3 max-h-[330px] divide-y divide-white/[0.05] overflow-y-auto rounded-2xl border border-zinc-200/90">{importRows.map((row) => <ImportPreviewRow key={row.id} row={row} />)}</div></div></>}
                  </div>
                  <div className="border-t border-zinc-200/90 bg-[#F8FAFC] px-4 py-4 sm:px-6">
                    {invalidImportRows.length > 0 && <div className="mb-3 flex gap-2 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-3 py-2.5"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" /><p className="text-[10px] leading-5 text-amber-500/80">Correct the invalid rows in your spreadsheet and upload it again before importing.</p></div>}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={importing} onClick={closeImport} className="rounded-xl border border-zinc-200 px-4 py-3 text-[11px] font-black text-zinc-500">Cancel</button><button type="button" disabled={importing || !validImportRows.length || invalidImportRows.length > 0} onClick={handleBulkImport} className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[11px] font-black disabled:border disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400" style={!importing && validImportRows.length && !invalidImportRows.length ? { background: `linear-gradient(90deg, ${theme.accent}, ${theme.chartSecondary || theme.accent})`, color: "#fff" } : undefined}>{importing ? <><LoadingSpinner /> Importing...</> : <><Upload size={15} /> Import {validImportRows.length} {validImportRows.length === 1 ? "Question" : "Questions"}</>}</button></div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AdminLayout>
  );
}


// ===========================================================
// IMPORT HELPERS
// ===========================================================
function ImportStat({ label, value, tone = "neutral" }) {
  const styles = { neutral: "border-zinc-200/90 bg-zinc-50 text-zinc-400", success: "border-emerald-500/10 bg-emerald-500/[0.04] text-emerald-500", danger: "border-red-500/10 bg-red-500/[0.04] text-red-500" };
  return <div className={`rounded-2xl border p-3 text-center sm:p-4 ${styles[tone]}`}><p className="text-[20px] font-black">{value}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[.1em] opacity-60 sm:text-[9px]">{label}</p></div>;
}

function ImportPreviewRow({ row }) {
  return <div className="bg-[#F8FAFC] p-3.5 sm:p-4"><div className="flex items-start gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${row.valid ? "border-emerald-500/10 bg-emerald-500/[0.04] text-emerald-500" : "border-red-500/10 bg-red-500/[0.04] text-red-500"}`}>{row.valid ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase text-zinc-400">Row {row.rowNumber}</span><span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${row.valid ? "border-emerald-500/10 text-emerald-500" : "border-red-500/10 text-red-500"}`}>{row.valid ? "Ready" : "Invalid"}</span></div><p className="mt-2 truncate text-[11px] font-black text-zinc-400">{row.data.chapter || "No chapter"}</p><p className="mt-1 line-clamp-2 text-[10px] leading-5 text-zinc-500">{row.data.question_en || "English question missing"}</p>{row.valid ? <p className="mt-2 text-[9px] font-bold text-emerald-500/70">Correct option: {row.data.correct_answer}</p> : <div className="mt-2 space-y-1">{row.errors.map((error) => <p key={error} className="text-[9px] leading-4 text-red-400/80">• {error}</p>)}</div>}</div></div></div>;
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

  const normalizedValue = value.trim().toLowerCase();

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
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
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
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-[#F8FAFC] pl-11 pr-11 text-[13px] font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
        />

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Show chapters"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-400"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      {/* =====================================================
          DROPDOWN
      ===================================================== */}

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
              className="admin-hidden-scrollbar absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-[230px] overflow-y-auto rounded-2xl border border-zinc-200 bg-[#161619] p-2 shadow-2xl"
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
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
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
                        <div className="my-1 border-t border-zinc-200/90" />
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

                        <p className="truncate text-[12px] font-bold text-zinc-400">
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
              ? "text-zinc-900"
              : "text-zinc-500 hover:text-zinc-400"
              }`}
          >
            {active && (
              <motion.div
                layoutId="add-question-language"
                className="absolute inset-0 rounded-xl border"
                style={{
                  backgroundColor:
                    theme.accentSoft,
                  borderColor:
                    `${theme.accent}20`,
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
                      "rgba(255,255,255,.03)",
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
                className="relative text-emerald-500"
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
          : "rgba(255,255,255,.055)",
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
                  color: "#71717A",
                  borderColor:
                    "rgba(255,255,255,.06)",
                  backgroundColor:
                    "rgba(255,255,255,.02)",
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
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-500">
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
        className="h-10 w-full rounded-xl border border-zinc-200/90 bg-white px-3 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300"
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
    <div className="overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white">
      {/* HEADER */}

      <div className="border-b border-zinc-200/90 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            icon={Save}
            title="Live Preview"
            description="Review before publishing."
            theme={theme}
          />

          <span className="shrink-0 rounded-full border border-emerald-500/10 bg-emerald-500/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-500/70">
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
              ? "text-zinc-400"
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
          <div className="h-px flex-1 bg-zinc-100" />

          <Languages
            size={14}
            className="text-zinc-400"
          />

          <div className="h-px flex-1 bg-zinc-100" />
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

        <p className="text-[12px] font-black text-zinc-400">
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
                className="flex items-start gap-3 rounded-xl border px-3 py-3"
                style={{
                  borderColor: selected
                    ? "rgba(34,197,94,.18)"
                    : "rgba(255,255,255,.05)",

                  backgroundColor: selected
                    ? "rgba(34,197,94,.045)"
                    : "rgba(255,255,255,.015)",
                }}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${selected
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-zinc-50 text-zinc-500"
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
                      ? "font-semibold text-emerald-300/90"
                      : "font-medium text-zinc-500"
                      }`}
                  >
                    {option.value}
                  </p>
                </div>

                {selected && (
                  <span className="mt-0.5 shrink-0 text-[8px] font-black uppercase tracking-[0.08em] text-emerald-500/70">
                    Correct
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200/90 px-4 py-5 text-center">
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
      className="flex items-center gap-3 rounded-xl border px-3 py-3"
      style={{
        borderColor: complete
          ? "rgba(34,197,94,.12)"
          : "rgba(255,255,255,.05)",

        backgroundColor: complete
          ? "rgba(34,197,94,.025)"
          : "rgba(255,255,255,.012)",
      }}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${complete
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-zinc-50 text-zinc-400"
          }`}
      >
        {complete ? (
          <Check size={15} />
        ) : (
          <Languages size={14} />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold text-zinc-500">
          {label}
        </p>

        <p
          className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${complete
            ? "text-emerald-500/70"
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
        ? "border-emerald-500/10 bg-emerald-500/[0.04] text-emerald-500/70"
        : "border-zinc-200/90 bg-zinc-50 text-zinc-400"
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
          borderColor: `${theme.accent}18`,
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
    <label className="flex items-center gap-1 text-[12px] font-bold text-zinc-500">
      {label}

      {required && (
        <span className="text-red-400/70">
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