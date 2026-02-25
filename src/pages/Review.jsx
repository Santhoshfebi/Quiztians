import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function ReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { phone, chapter, language: initialLanguage = "ta" } = state || {}; // default Tamil

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [merged, setMerged] = useState([]);
  const [filter, setFilter] = useState("all");
  const [totalTime, setTotalTime] = useState(0);
  const [language, setLanguage] = useState(initialLanguage);

  // Supported languages
  const languages = [
    { code: "ta", label: "Tamil" },
    { code: "en", label: "English" },
    // add more languages if available
  ];

  // Helper to get field by language
  const getFieldByLanguage = (item, field) => {
    const key = `${field}_${language}`;
    return item[key] || item[field] || "N/A";
  };

  // Load data from Supabase
  useEffect(() => {
    if (!phone || !chapter) {
      navigate("/");
      return;
    }

    const loadReviewData = async () => {
      setLoading(true);
      try {
        // Total time
        const { data: resultRow } = await supabase
          .from("results")
          .select("time_taken")
          .eq("phone", phone)
          .eq("chapter", chapter)
          .single();
        if (resultRow) setTotalTime(resultRow.time_taken || 0);

        // Questions
        const { data: qData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("chapter", chapter)
          .order("id", { ascending: true });
        if (qError) throw qError;
        setQuestions(qData || []);

        // User answers
        const { data: aData, error: aError } = await supabase
          .from("answers_history")
          .select("*")
          .eq("phone", phone)
          .eq("chapter", chapter);
        if (aError) throw aError;
        setAnswers(aData || []);

        // Merge questions & answers
        const mergedData = (qData || []).map((q) => {
          const userAns = (aData || []).find(
            (a) => a.question === getFieldByLanguage(q, "question")
          );
          return {
            id: q.id,
            question: getFieldByLanguage(q, "question"),
            correct_answer: getFieldByLanguage(q, "correct_answer"),
            explanation: getFieldByLanguage(q, "explanation") || "",
            user_answer: userAns ? userAns.user_answer : "Not Answered",
            is_correct: userAns ? userAns.is_correct : false,
            attempted: !!userAns,
          };
        });

        setMerged(mergedData);
      } catch (err) {
        console.error("Error loading review:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReviewData();
  }, [phone, chapter, navigate, language]);

  // Filtered list
  const filtered = merged.filter((item) => {
    if (filter === "all") return true;
    if (filter === "correct") return item.is_correct;
    if (filter === "incorrect")
      return !item.is_correct && item.user_answer !== "Not Answered";
    if (filter === "not_attempted") return item.user_answer === "Not Answered";
    return true;
  });

  // Counts
  const totalQuestions = merged.length;
  const correctCount = merged.filter((m) => m.is_correct).length;
  const incorrectCount = merged.filter(
    (m) => !m.is_correct && m.user_answer !== "Not Answered"
  ).length;
  const notAttemptedCount = merged.filter((m) => m.user_answer === "Not Answered").length;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 p-6">
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
          style={{ width: 140, height: 140 }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-12 bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-6 px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-linear-to-r from-pink-800 to-indigo-600 bg-clip-text text-transparent mb-2">
          Review Your Answers
        </h1>
        <p className="text-sm sm:text-base text-white mt-2">
          Chapter: <span className="font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">{chapter}</span> | Total Questions: <span className="font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">{totalQuestions}</span> | Time Taken: <span className="font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">{formatTime(totalTime)}</span>
        </p>
        <p className="text-lg font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
          Choose your language if you attend in English to see the questions and answers!
        </p>

        {/* Language Selector */}
        <div className="mt-4 flex justify-center items-center gap-2">
          <span className="text-white font-medium">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1 rounded-md border border-gray-300 bg-white shadow-sm"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col items-center border border-white/30">
          <span className="text-2xl sm:text-3xl font-bold text-green-600">✅ {correctCount}</span>
          <span className="text-sm sm:text-base text-slate-700 mt-1">Correct</span>
        </div>
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col items-center border border-white/30">
          <span className="text-2xl sm:text-3xl font-bold text-red-600">❌ {incorrectCount}</span>
          <span className="text-sm sm:text-base text-slate-700 mt-1">Incorrect</span>
        </div>
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-4 flex flex-col items-center border border-white/30">
          <span className="text-2xl sm:text-3xl font-bold text-gray-500">➖ {notAttemptedCount}</span>
          <span className="text-sm sm:text-base text-slate-700 mt-1">Not Attempted</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
        {["all", "correct", "incorrect", "not_attempted"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 sm:px-4 py-2 rounded-full font-semibold text-sm sm:text-base transition-colors ${filter === f
              ? "bg-indigo-600 text-white"
              : "bg-white/60 text-slate-700 hover:bg-white/80"
              } border border-white/30 shadow`}
          >
            {f === "not_attempted" ? "Not Attempted" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Answer Cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        <AnimatePresence>
          {filtered.map((a, idx) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className={`p-4 sm:p-5 rounded-2xl shadow-md border border-white/30 bg-white/60 backdrop-blur-md ${a.user_answer === "Not Answered"
                ? "border-gray-300"
                : a.is_correct
                  ? "border-green-500 bg-green-50/50"
                  : "border-red-500 bg-red-50/50"
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                <p className="font-semibold text-slate-900 wrap-break-word">{a.question}</p>
                <span
                  className={`mt-1 sm:mt-0 px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${a.user_answer === "Not Answered"
                    ? "bg-gray-300 text-slate-800"
                    : a.is_correct
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                    }`}
                >
                  {a.user_answer === "Not Answered"
                    ? "Not Answered"
                    : a.is_correct
                      ? "Correct"
                      : "Incorrect"}
                </span>
              </div>

              <p className="text-sm sm:text-base text-slate-700 mt-2">
                Your Answer: <span className="font-medium">{a.user_answer}</span>
              </p>

              <p className="text-sm sm:text-base text-slate-700 mt-1">
                Correct Answer: <span className="font-medium">{a.correct_answer}</span>
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:scale-[1.01] transition-transform"
      >
        ← Back
      </button>
    </div>
  );
}
