import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function ReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { phone, chapter, name, place, score, total } = state || {};

  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone || !chapter) {
      navigate("/"); // redirect if missing state
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
        setAnswers(data);
      } catch (err) {
        console.error("Error fetching answers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [phone, chapter, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <h2 className="text-lg font-semibold text-gray-600 animate-pulse">
          Loading your answers...
        </h2>
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex flex-col items-center relative">
      {/* Header */}
      <div className="w-full max-w-3xl text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">
          📝 Review Your Answers
        </h1>
        <p className="text-gray-600 text-sm">
          Chapter: <span className="font-semibold">{chapter}</span>
        </p>
      </div>

      {/* Answers List */}
      <div className="w-full max-w-3xl space-y-4">
        <AnimatePresence>
          {answers.length === 0 && (
            <p className="text-center text-gray-500">No answers found for this chapter.</p>
          )}
          {answers.map((a, idx) => {
            const isCorrect = a.is_correct;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`p-4 rounded-xl shadow-md border-l-4 ${
                  isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                }`}
              >
                <p className="font-medium mb-1 break-words">{a.question}</p>
                <p className="text-sm">
                  Your Answer:{" "}
                  <span
                    className={
                      isCorrect ? "text-green-700 font-semibold" : "text-red-700 font-semibold"
                    }
                  >
                    {a.user_answer}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="text-sm text-gray-800">
                    Correct Answer: <span className="font-semibold">{a.correct_answer}</span>
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Back to Result Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
      >
        🔙 Back to Result
      </button>
    </div>
  );
}



