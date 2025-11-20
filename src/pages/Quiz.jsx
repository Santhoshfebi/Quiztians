import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Material UI imports
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function Quiz() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const results = state || {};

  const language = results.language || "en"; // 'en' or 'ta'
  const selectedChapter =
    results.chapter || localStorage.getItem("selectedChapter");
  const isPreview = results.isPreview || false;
  const quizDuration = results.duration || (isPreview ? 5 : 20);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizDuration * 60);

  const attemptKey = `${results.phone || "guest"}_${selectedChapter}_attempted`;
  const quizSubmittedRef = useRef(false);

  const maxWarnings = 5;
  const [warningCount, setWarningCount] = useState(
    parseInt(sessionStorage.getItem(`${attemptKey}_warnings`)) || 0
  );

  // ⭐ Store answers for review
  const answersTracker = useRef([]);

  // ⭐ Store quiz start time
  useEffect(() => {
    const now = new Date().toISOString();
    localStorage.setItem("quiz_start_time", now);
  }, []);

  // Restore pending quiz result
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingQuizResult");
    if (pending) {
      const data = JSON.parse(pending);
      (async () => {
        try {
          await supabase.from("results").insert([data]);
          sessionStorage.removeItem("pendingQuizResult");
          toast.success("Your last quiz result was safely restored!", {
            duration: 4000,
          });
        } catch (err) {
          console.error("Error restoring pending result:", err);
        }
      })();
    }
  }, []);

  // Anti-cheating logic
  useEffect(() => {
    if (isPreview) return;

    const warningKey = `${attemptKey}_warnings`;
    let warnings = parseInt(sessionStorage.getItem(warningKey)) || 0;

    const handleBeforeUnload = (e) => {
      if (quizSubmittedRef.current) return;

      warnings += 1;
      sessionStorage.setItem(warningKey, warnings);
      setWarningCount(warnings);

      if (warnings < maxWarnings) {
        const urgency =
          warnings < maxWarnings - 1 ? "Warning" : "FINAL WARNING";
        toast.error(
          `${urgency} ${warnings}/${maxWarnings - 1}: Refreshing or leaving will auto-submit on the ${maxWarnings}th attempt.`,
          { duration: 5000 }
        );
        e.preventDefault();
        e.returnValue = "";
      } else {
        toast.success("Quiz auto-submitted due to multiple attempts.", {
          duration: 4000,
        });
        handleSubmit(true);
      }
    };

    const blockKeys = (e) => {
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")
      ) {
        e.preventDefault();
        handleBeforeUnload(e);
      }
    };

    const blockBackForward = () => {
      window.history.pushState(null, "", window.location.href);
      handleBeforeUnload({});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", blockKeys);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockBackForward);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", blockKeys);
      window.removeEventListener("popstate", blockBackForward);
    };
  }, []);

  // Fetch questions & prevent reattempts
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedChapter) {
        toast.error("No chapter selected. Redirecting...");
        navigate("/");
        return;
      }

      if (!isPreview && results.phone) {
        const { data: existing } = await supabase
          .from("results")
          .select("id")
          .eq("phone", results.phone)
          .eq("chapter", selectedChapter);

        if (existing && existing.length > 0) {
          localStorage.setItem(attemptKey, "true");
          navigate("/already-attempted", { state: { language } });
          return;
        } else {
          localStorage.removeItem(attemptKey);
          sessionStorage.removeItem(`${attemptKey}_warnings`);
          setWarningCount(0);
        }
      }

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("chapter", selectedChapter);

      if (error || !data?.length) {
        toast.error("No questions found for this chapter.");
        setLoading(false);
        return;
      }

      setQuestions(data.sort(() => Math.random() - 0.5));
      setLoading(false);
    };

    fetchQuestions();
  }, [selectedChapter]);

  // Timer
  useEffect(() => {
    if (isPreview) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const q = questions[current];

  // ⭐ Multilingual options
  const options = useMemo(() => {
    if (!q) return [];
    return language === "en"
      ? [q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en]
      : [q.option_a_ta, q.option_b_ta, q.option_c_ta, q.option_d_ta];
  }, [q, language]);

  // ⭐ Correct answer based on language
  const correctAnswer = useMemo(() => {
    if (!q) return null;
    return language === "en" ? q.correct_answer : q.correct_answer_ta;
  }, [q, language]);

  // Handle select
  const handleSelect = (option) => {
    if (isPreview || showAnswer) return;

    // ⭐ Track answer with language
    answersTracker.current.push({
      question: language === "en" ? q.question_en : q.question_ta,
      correct_answer: correctAnswer,
      user_answer: option,
      chapter: selectedChapter,
      lang: language, // ✅ store language for review
    });

    setSelected(option);
    setShowAnswer(true);

    if (option === correctAnswer) setScore((prev) => prev + 1);

    if (current < questions.length - 1) {
      setTimeout(() => {
        setSelected(null);
        setShowAnswer(false);
        setCurrent((prev) => prev + 1);
      }, 800);
    }
  };

  // ⭐ Submit function with language-aware answers
  const handleSubmit = async (isAuto = false) => {
    if (hasSubmitted || quizSubmittedRef.current) return;
    quizSubmittedRef.current = true;
    setHasSubmitted(true);
    localStorage.setItem(attemptKey, "true");

    const start_time = localStorage.getItem("quiz_start_time");
    const end_time = new Date().toISOString();
    let time_taken = null;
    if (start_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      time_taken = Math.floor((end - start) / 1000);
    }

    const resultData = {
      name: results.name,
      phone: results.phone,
      place: results.place,
      chapter: selectedChapter,
      score,
      total: questions.length,
      language: language === "en" ? "English" : "Tamil",
      start_time,
      end_time,
      time_taken,
    };

    let resultInsert;

    if (!isPreview) {
      if (isAuto) {
        sessionStorage.setItem("pendingQuizResult", JSON.stringify(resultData));
      }

      try {
        resultInsert = await supabase.from("results").insert([resultData]).select("id");
        sessionStorage.removeItem("pendingQuizResult");
      } catch (error) {
        console.error("Error submitting quiz:", error);
      }
    }

    if (resultInsert?.data?.[0]?.id) {
      const result_id = resultInsert.data[0].id;

      // ⭐ Save answers with language
      const formattedAnswers = answersTracker.current.map((a) => ({
        result_id,
        phone: results.phone,
        chapter: selectedChapter,
        question: a.question,
        correct_answer: a.correct_answer,
        user_answer: a.user_answer,
        lang: a.lang, // ✅ store language
      }));

      try {
        await supabase.from("answers_history").insert(formattedAnswers);
      } catch (err) {
        console.error("Error saving answers_history:", err);
      }
    }

    if (isAuto) {
      toast.success("Quiz auto-submitted.", { duration: 3000 });
    }

    navigate(isPreview ? "/admin" : "/result", {
      state: {
        ...results,
        score,
        total: questions.length,
        isPreview,
        time_taken,
      },
    });
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const timePercent = (timeLeft / (quizDuration * 60)) * 100;
  const isWarningTime = timeLeft <= 300;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <h2 className="text-center text-lg font-semibold text-gray-600 animate-pulse">
          Loading questions...
        </h2>
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
        />
      </div>
    );

  if (!questions?.length)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <h2 className="text-xl font-bold text-red-600 text-center">
          No questions found for this chapter.
        </h2>
      </div>
    );
    
  return (
    <div className="relative flex items-start justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster position="top-center" />
      <motion.div
        className="w-full md:w-3/4 max-w-3xl mx-auto mt-16 bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 text-gray-700 space-y-2 sm:space-y-0">
          <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
            <PersonIcon fontSize="small" /> {results.name}
          </p>
          <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
            <LocationOnIcon fontSize="small" /> {results.place}
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-blue-700 text-center">
            {language === "en" ? "Chapter" : "அதிகாரம்"}:{" "}
            <span className="text-indigo-700">{selectedChapter}</span>
          </h2>
          <p className="font-medium text-sm sm:text-base text-center sm:text-right">
            {language === "en" ? "Question" : "கேள்வி"} {current + 1} / {questions.length}
          </p>
        </div>

        {/* Timer */}
        {!isPreview && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-600 text-sm sm:text-base flex items-center gap-1">
                <AccessTimeIcon fontSize="small" /> {language === "en" ? "Time Left" : "மீதமுள்ள நேரம்"}:
              </span>
              <span
                className={`font-semibold text-sm sm:text-base ${isWarningTime ? "text-red-600 animate-pulse" : "text-green-600"
                  }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full mb-2 overflow-hidden">
              <motion.div
                className={`h-3 rounded-full ${warningCount === maxWarnings - 1
                  ? "bg-red-800 animate-[pulse_0.5s_infinite]"
                  : isWarningTime
                    ? "bg-red-500"
                    : "bg-green-500"
                  }`}
                initial={{ width: "100%" }}
                animate={{ width: `${timePercent}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            {warningCount > 0 && warningCount < maxWarnings && (
              <p
                className={`text-xs sm:text-sm font-medium mb-2 text-center ${warningCount === maxWarnings - 1
                  ? "text-red-800 animate-[pulse_0.5s_infinite]"
                  : "text-red-600 animate-pulse"
                  }`}
              >
                Warning {warningCount}/{maxWarnings - 1} – Quiz will auto-submit on the {maxWarnings}th attempt with 0 score
              </p>
            )}
          </>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 leading-relaxed break-words">
              {language === "en" ? q.question_en : q.question_ta}
            </h3>

            <div className="space-y-2 sm:space-y-3">
              {options.map((option, idx) => {
                const base =
                  "w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-all duration-200 font-medium break-words";
                const isCorrect = option === correctAnswer;
                const isSelected = selected === option;

                let styles = base;
                if (isPreview) {
                  styles += isCorrect
                    ? " bg-green-100 border-green-400 text-green-800"
                    : " bg-gray-100";
                } else if (showAnswer) {
                  if (isSelected && isCorrect)
                    styles += " bg-green-500 text-white border-green-600";
                  else if (isSelected && !isCorrect)
                    styles += " bg-red-500 text-white border-red-600";
                  else styles += " bg-gray-100 opacity-70";
                } else if (isSelected)
                  styles += " bg-blue-500 text-white border-blue-600";
                else styles += " hover:bg-blue-50";

                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(option)}
                    disabled={showAnswer || isPreview}
                    className={styles}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>

            {/* Preview Navigation Buttons */}
            {isPreview && (
              <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3">
                <button
                  onClick={() => setCurrent((prev) => Math.max(prev - 1, 0))}
                  disabled={current === 0}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold shadow ${current === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                >
                  Previous
                </button>

                <button
                  onClick={() => navigate("/admin/preview-quiz")}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold shadow bg-gray-500 text-white hover:bg-gray-600"
                >
                  Back to Chapter Preview
                </button>

                <button
                  onClick={() =>
                    setCurrent((prev) => Math.min(prev + 1, questions.length - 1))
                  }
                  disabled={current === questions.length - 1}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold shadow ${current === questions.length - 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Submit */}
        {!isPreview && current === questions.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSubmit(false)}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition"
          >
            {language === "en" ? "Submit Quiz" : "வினாவை சமர்ப்பிக்கவும்"}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
