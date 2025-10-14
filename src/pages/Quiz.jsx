import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, phone, place, language } = location.state || {};
  const selectedChapter = localStorage.getItem("selectedChapter");

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🕒 Quiz time limit: 20 minutes
  const [timeLeft, setTimeLeft] = useState(20 * 60); // seconds

  // ⏱ Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 📘 Fetch questions from Supabase (filter by chapter)
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedChapter) {
        alert("No chapter selected. Redirecting...");
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("chapter", selectedChapter);

      if (error) {
        console.error("Error fetching questions:", error);
      } else if (data.length === 0) {
        alert("No questions found for this chapter.");
        navigate("/");
      } else {
        setQuestions(data);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [selectedChapter, navigate]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleAnswer = (option) => {
    setSelectedOption(option);
    if (option === currentQuestion.correct_answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption("");
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setQuizCompleted(true);

    // 🧾 Save user result to Supabase
    supabase.from("results").insert([
      {
        name,
        phone,
        place,
        chapter: selectedChapter,
        score,
        total: totalQuestions,
        language,
        created_at: new Date(),
      },
    ]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-lg font-semibold text-gray-700">
        Loading questions...
      </div>
    );

  if (quizCompleted)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold text-green-600 mb-4">
            {language === "en" ? "Quiz Completed!" : "வினா முடிந்தது!"}
          </h2>
          <p className="text-lg mb-4 text-gray-700">
            {language === "en"
              ? `Chapter: ${selectedChapter}`
              : `அத்தியாயம்: ${selectedChapter}`}
          </p>
          <p className="text-xl font-semibold mb-4">
            {language === "en"
              ? `Your Score: ${score} / ${totalQuestions}`
              : `உங்கள் மதிப்பெண்: ${score} / ${totalQuestions}`}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mt-4"
          >
            {language === "en" ? "Back to Home" : "முகப்புக்கு திரும்ப"}
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-blue-700">
            {language === "en"
              ? `Chapter: ${selectedChapter}`
              : `அத்தியாயம்: ${selectedChapter}`}
          </h2>
          <div className="text-lg font-semibold text-gray-700">
            ⏳ {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </div>
        </div>

        {/* Question */}
        <h3 className="text-lg font-bold mb-4">
          {language === "en"
            ? `Q${currentIndex + 1}. ${currentQuestion.question_en}`
            : `வ${currentIndex + 1}. ${currentQuestion.question_ta}`}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {["option_a", "option_b", "option_c", "option_d"].map((optKey, idx) => {
            const optionText =
              language === "en"
                ? currentQuestion[`${optKey}_en`]
                : currentQuestion[`${optKey}_ta`];

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(optionText)}
                disabled={!!selectedOption}
                className={`w-full text-left px-4 py-2 border rounded-lg transition-all ${
                  selectedOption === optionText
                    ? optionText === currentQuestion.correct_answer
                      ? "bg-green-200 border-green-500"
                      : "bg-red-200 border-red-500"
                    : "hover:bg-blue-50 border-gray-300"
                }`}
              >
                {optionText}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleNext}
            disabled={!selectedOption}
            className={`px-6 py-2 rounded-lg font-semibold text-white ${
              selectedOption
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {currentIndex === totalQuestions - 1
              ? language === "en"
                ? "Finish"
                : "முடிக்க"
              : language === "en"
              ? "Next"
              : "அடுத்தது"}
          </button>
        </div>
      </div>
    </div>
  );
}
