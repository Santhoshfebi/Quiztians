import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function ReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { phone, chapter } = state || {};

  const [answers, setAnswers] = useState([]);
  const [filteredAnswers, setFilteredAnswers] = useState([]);
  const [filter, setFilter] = useState("all"); // all / correct / incorrect
  const [loading, setLoading] = useState(true);

  const [totalTime, setTotalTime] = useState(0); // in seconds

  useEffect(() => {
    if (!phone || !chapter) {
      navigate("/");
      return;
    }

    const fetchAnswers = async () => {
      try {
        const { data, error } = await supabase
          .from("answers_history")
          .select("*")
          .eq("phone", phone)
          .eq("chapter", chapter)
          .order("created_at", { ascending: true });

        if (error) throw error;
        const answerData = data || [];
        setAnswers(answerData);
        setFilteredAnswers(answerData);

        // Calculate total time if timestamps are available
        if (answerData.length > 0) {
          const first = new Date(answerData[0].created_at);
          const last = new Date(answerData[answerData.length - 1].created_at);
          const diffSec = Math.round((last - first) / 1000);
          setTotalTime(diffSec);
        }
      } catch (err) {
        console.error("Error fetching answers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [phone, chapter, navigate]);

  useEffect(() => {
    if (filter === "all") setFilteredAnswers(answers);
    else if (filter === "correct") setFilteredAnswers(answers.filter(a => a.is_correct));
    else setFilteredAnswers(answers.filter(a => !a.is_correct));
  }, [filter, answers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
          style={{ width: 120, height: 120 }}
        />
        <h2 className="text-lg font-semibold text-gray-600 mt-4 animate-pulse">
          Loading your answers...
        </h2>
      </div>
    );
  }

  const totalQuestions = answers.length;
  const correctCount = answers.filter(a => a.is_correct).length;
  const incorrectCount = totalQuestions - correctCount;

  // Format time taken
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Donut chart parameters
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const correctOffset = circumference * (1 - (correctCount / totalQuestions || 0));

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Review Your Answers</h1>
        <p className="text-gray-600 text-sm">
          Chapter: <span className="font-semibold">{chapter}</span> | Total Questions: <span className="font-semibold">{totalQuestions}</span>
        </p>
      </div>

      {/* Summary Section */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-around items-center bg-white shadow-md rounded-xl p-6 mb-6">
        <div className="flex flex-col items-center mb-4 md:mb-0">
          <span className="text-2xl font-bold text-green-600">✅ {correctCount}</span>
          <span className="text-gray-500 text-sm">Correct</span>
        </div>
        <div className="flex flex-col items-center mb-4 md:mb-0">
          <span className="text-2xl font-bold text-red-600">❌ {incorrectCount}</span>
          <span className="text-gray-500 text-sm">Incorrect</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-600">🕒 {formatTime(totalTime)}</span>
          <span className="text-gray-500 text-sm">Time Taken</span>
          <span className="text-gray-500 text-sm font-bold">Coming soon</span>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="w-40 h-40 mb-6 relative">
        <svg className="w-full h-full rotate-[-90deg]">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            fill="transparent"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: correctOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-800 font-bold text-xl">
          <span>{Math.round((correctCount / totalQuestions) * 100) || 0}%</span>
          <span className="text-sm text-gray-500">Correct</span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-4 mb-6">
        {["all", "correct", "incorrect"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Answers Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAnswers.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">No answers to display.</p>
        )}
        <AnimatePresence>
          {filteredAnswers.map((a, idx) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`p-5 rounded-xl shadow-lg border-l-4 ${
                a.is_correct ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
              } hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-800 break-words">{a.question}</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    a.is_correct ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                  }`}
                >
                  {a.is_correct ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                Your Answer: <span className="font-medium">{a.user_answer}</span>
              </p>
              {!a.is_correct && (
                <>
                  <p className="text-sm text-gray-700 mt-1">
                    Correct Answer: <span className="font-medium">{a.correct_answer}</span>
                  </p>
                  {a.explanation && (
                    <p className="text-xs text-gray-500 mt-1 italic">{a.explanation}</p>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-6 right-6 z-50 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2"
      >
        ← Back
      </button>
    </div>
  );
}
