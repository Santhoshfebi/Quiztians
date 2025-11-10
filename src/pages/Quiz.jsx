import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Quiz() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const results = state || {};

  const language = results.language || "en";
  const selectedChapter = results.chapter || localStorage.getItem("selectedChapter");
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
  const [showWarning, setShowWarning] = useState(false);

  // ✅ Fetch questions & check for reattempt
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedChapter) {
        alert("No chapter selected. Redirecting...");
        navigate("/");
        return;
      }

      // 🚫 Prevent reattempt if already completed
      if (localStorage.getItem(`quiz_completed_${selectedChapter}`) === "true") {
        alert("You have already completed this quiz. You cannot retake it.");
        navigate("/result");
        return;
      }

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("chapter", selectedChapter);

      if (error) {
        console.error("Error fetching questions:", error.message);
        alert("Failed to fetch questions.");
      } else if (!data || data.length === 0) {
        alert("No questions found for this chapter.");
      } else {
        setQuestions(data.sort(() => Math.random() - 0.5));
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [selectedChapter, navigate]);

  // ⏱️ Timer (skip for preview)
  useEffect(() => {
    if (isPreview) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    if (timeLeft === 300 && !showWarning) setShowWarning(true);
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showWarning, isPreview]);

  // 🚫 Disable refresh and back navigation
  useEffect(() => {
    if (isPreview) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your progress will be lost.";
    };

    const handlePopState = () => {
      alert("Back navigation is disabled during the quiz.");
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isPreview]);

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

  if (!questions || questions.length === 0)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <h2 className="text-xl font-bold text-red-600">
          No questions available for this chapter.
        </h2>
      </div>
    );

  // 🧠 Current question
  const q = questions[current];
  const correctAnswer = language === "en" ? q.correct_answer : q.correct_answer_ta;
  const options =
    language === "en"
      ? [q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en]
      : [q.option_a_ta, q.option_b_ta, q.option_c_ta, q.option_d_ta];

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSelect = (option) => {
    if (isPreview) return; // disable in preview
    if (showAnswer) return;
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

  const handleSubmit = async () => {
    if (hasSubmitted) return;
    setHasSubmitted(true);

    if (!isPreview) {
      try {
        const fullLanguage = language === "en" ? "English" : "Tamil";
        const { error } = await supabase.from("results").insert([
          {
            name: results.name,
            phone: results.phone,
            place: results.place,
            chapter: selectedChapter,
            score,
            total: questions.length,
            language: fullLanguage,
            created_at: new Date(),
          },
        ]);
        if (error) console.error("Supabase insert error:", error);
      } catch (err) {
        console.error("Error saving participant:", err);
      }
    }

    // ✅ Prevent quiz reattempt
    localStorage.setItem(`quiz_completed_${selectedChapter}`, "true");

    navigate(isPreview ? "/admin" : "/result", {
      state: { ...results, score, total: questions.length, isPreview },
    });
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setSelected(null);
      setShowAnswer(false);
      setCurrent((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (current > 0) {
      setSelected(null);
      setShowAnswer(false);
      setCurrent((prev) => prev - 1);
    }
  };

  const totalQuizTime = quizDuration * 60;
  const timePercent = (timeLeft / totalQuizTime) * 100;
  const isWarningTime = timeLeft <= 300 && !isPreview;

  return (
    <div className="relative flex items-start justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="md:w-3/4 w-96 mx-auto mt-20 bg-white p-6 rounded-2xl shadow-lg relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 text-lg font-semibold">
          {!isPreview && (
            <p>
              👤 {language === "en" ? "Participant" : "பங்கேற்பாளர்"}:{" "}
              <span className="text-blue-950">{results.name}</span>
            </p>
          )}

          <h5 className="text-xl font-bold text-center text-indigo-500">
            📖{" "}
            {language === "en"
              ? `Chapter: ${selectedChapter}`
              : `அதிகாரம்: ${selectedChapter}`}
          </h5>

          <div className="text-gray-700">
            {language === "en" ? "Question" : "கேள்வி"}: {current + 1} / {questions.length}
          </div>
        </div>

        {/* Timer */}
        {!isPreview && (
          <>
            <div className="flex justify-end mb-2 font-medium text-gray-700">
              <span> Time Left : </span>
              <span
                className={`font-semibold ${
                  isWarningTime ? "text-red-600 animate-pulse" : "text-green-600"
                }`}
              >
                ⏱️ {formatTime(timeLeft)}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded mb-3">
              <div
                className={`h-3 rounded transition-all duration-1000 ease-linear ${
                  isWarningTime ? "bg-red-500" : "bg-green-500"
                }`}
                style={{ width: `${timePercent}%` }}
              />
            </div>
          </>
        )}

        {/* Question */}
        <h2 className="text-lg font-semibold mb-2">
          {language === "en" ? q.question_en : q.question_ta}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-4">
          {options.map((option, idx) => {
            let cls =
              "w-full px-4 py-2 border rounded-lg transition-all duration-200 ";
            if (isPreview) {
              if (option === correctAnswer)
                cls += "bg-green-500 text-white font-semibold";
              else cls += "bg-gray-100";
            } else if (showAnswer) {
              if (selected === option && option === correctAnswer)
                cls += "bg-green-500 text-white";
              else if (selected === option && option !== correctAnswer)
                cls += "bg-red-500 text-white";
              else cls += "opacity-70";
            } else if (selected === option) cls += "bg-blue-500 text-white";
            else cls += "hover:bg-gray-100";

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                disabled={showAnswer || isPreview}
                className={cls}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Admin-only nav buttons */}
        {isPreview && (
          <div className="flex justify-between mt-4">
            <button
              onClick={handlePrev}
              disabled={current === 0}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50"
            >
              ⬅️ Previous
            </button>
            <button
              onClick={() => navigate("/admin/preview-quiz")}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all"
            >
              ⬅️ Back to ChapterPreview
            </button>
            <button
              onClick={handleNext}
              disabled={current === questions.length - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next ➡️
            </button>
          </div>
        )}

        {/* Submit */}
        {!isPreview && current === questions.length - 1 && (
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-blue-600 text-white rounded-lg mt-4 hover:bg-blue-700 transition-all"
          >
            {language === "en" ? "Submit Quiz" : "வினாவை சமர்ப்பிக்கவும்"}
          </button>
        )}

        {/* ⚠️ 5-Min Warning Modal */}
        {showWarning && (
          <div className="fixed inset-0 flex justify-center items-start mt-2 z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm w-full mx-4">
              <h2 className="text-xl font-bold text-red-600 mb-2">
                ⚠️ {language === "en" ? "Time Alert!" : "நேர எச்சரிக்கை!"}
              </h2>
              <p className="text-gray-700 mb-4">
                {language === "en"
                  ? "Only 5 minutes left! Please review and submit your quiz soon."
                  : "இன்னும் 5 நிமிடங்கள் மட்டுமே உள்ளன! தயவுசெய்து விரைவில் சமர்ப்பிக்கவும்."}
              </p>
              <button
                onClick={() => setShowWarning(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                {language === "en" ? "OK, Continue" : "சரி, தொடரவும்"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
