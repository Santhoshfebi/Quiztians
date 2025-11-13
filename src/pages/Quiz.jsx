import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Quiz() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const results = state || {};

  const language = results.language || "en";
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
  const [refreshWarned, setRefreshWarned] = useState(false);

  const attemptKey = `${results.phone || "guest"}_${selectedChapter}_attempted`;
  const quizSubmittedRef = useRef(false);

  // Restore pending quiz result
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingQuizResult");
    if (pending) {
      const data = JSON.parse(pending);
      (async () => {
        try {
          await supabase.from("results").insert([data]);
          sessionStorage.removeItem("pendingQuizResult");
          toast.success("✅ Your last quiz result was safely restored!", {
            duration: 4000,
          });
        } catch (err) {
          console.error("Error restoring pending result:", err);
        }
      })();
    }
  }, []);

  // Prevent refresh/back & auto-submit
  useEffect(() => {
    if (isPreview) return;

    const handleBeforeUnload = (e) => {
      if (quizSubmittedRef.current) return;

      if (!refreshWarned) {
        toast.error(
          "⚠️ Refreshing or leaving will auto-submit your quiz next time.",
          { duration: 5000 }
        );
        setRefreshWarned(true);
        e.preventDefault();
        e.returnValue = "";
      } else {
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
      if (!refreshWarned) {
        toast.error(
          "⚠️ Navigation blocked. Next time will submit your quiz.",
          { duration: 5000 }
        );
        setRefreshWarned(true);
      } else {
        handleSubmit(true);
      }
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
  }, [refreshWarned]);

  // Fetch questions & prevent reattempts
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedChapter) {
        toast.error("No chapter selected. Redirecting...");
        navigate("/");
        return;
      }

      if (!isPreview && localStorage.getItem(attemptKey) === "true") {
        navigate("/already-attempted", { state: { language } });
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
        }
      }

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("chapter", selectedChapter);

      if (error || !data?.length) {
        toast.error("⚠️ No questions found for this chapter.");
        setLoading(false);
        return;
      }

      setQuestions(data.sort(() => Math.random() - 0.5));
      setLoading(false);
    };

    fetchQuestions();
  }, [selectedChapter]);

  // Timer logic
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

  // Handle submit (manual & auto)
  const handleSubmit = async (isAuto = false) => {
    if (hasSubmitted || quizSubmittedRef.current) return;
    quizSubmittedRef.current = true;
    setHasSubmitted(true);
    localStorage.setItem(attemptKey, "true");

    const resultData = {
      name: results.name,
      phone: results.phone,
      place: results.place,
      chapter: selectedChapter,
      score,
      total: questions.length,
      language: language === "en" ? "English" : "Tamil",
      created_at: new Date(),
    };

    if (!isPreview) {
      if (isAuto) {
        sessionStorage.setItem("pendingQuizResult", JSON.stringify(resultData));
      }

      try {
        await supabase.from("results").insert([resultData]);
        sessionStorage.removeItem("pendingQuizResult");
      } catch (error) {
        console.error("Error submitting quiz:", error);
      }
    }

    if (isAuto) {
      toast.success("✅ Quiz auto-submitted.", { duration: 3000 });
    }

    navigate(isPreview ? "/admin" : "/result", {
      state: { ...results, score, total: questions.length, isPreview },
    });
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Memoize options to avoid recalculation
  const q = questions[current];
  const options = useMemo(() => {
    if (!q) return [];
    return language === "en"
      ? [q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en]
      : [q.option_a_ta, q.option_b_ta, q.option_c_ta, q.option_d_ta];
  }, [q, language]);

  const correctAnswer = useMemo(() => {
    if (!q) return null;
    return language === "en" ? q.correct_answer : q.correct_answer_ta;
  }, [q, language]);

  const timePercent = (timeLeft / (quizDuration * 60)) * 100;
  const isWarningTime = timeLeft <= 300;

  const handleSelect = (option) => {
    if (isPreview || showAnswer) return;

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

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <h2 className="text-xl font-bold text-red-600">
          No questions found for this chapter.
        </h2>
      </div>
    );

  return (
    <div className="relative flex items-start justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster position="top-center" />
      <motion.div
        className="w-full md:w-3/4 max-w-3xl mx-auto mt-16 bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 text-gray-700">
          <p className="font-semibold">
            👤 {results.name} | 📍 {results.place}
          </p>
          <h2 className="text-xl font-bold text-blue-700 text-center">
            {language === "en" ? "Chapter" : "அதிகாரம்"}:{" "}
            <span className="text-indigo-700">{selectedChapter}</span>
          </h2>
          <p className="font-medium">
            {language === "en" ? "Question" : "கேள்வி"} {current + 1} / {questions.length}
          </p>
        </div>

        {/* Timer */}
        {!isPreview && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-600">
                ⏱️ {language === "en" ? "Time Left" : "மீதமுள்ள நேரம்"}:
              </span>
              <span
                className={`font-semibold ${
                  isWarningTime ? "text-red-600 animate-pulse" : "text-green-600"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full mb-6">
              <motion.div
                className={`h-3 rounded-full ${
                  isWarningTime ? "bg-red-500" : "bg-green-500"
                }`}
                initial={{ width: "100%" }}
                animate={{ width: `${timePercent}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
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
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 leading-relaxed">
              {language === "en" ? q.question_en : q.question_ta}
            </h3>

            <div className="space-y-3">
              {options.map((option, idx) => {
                const base =
                  "w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 font-medium";
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
