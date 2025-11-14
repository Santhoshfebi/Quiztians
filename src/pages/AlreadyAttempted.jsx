import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QuizIcon from '@mui/icons-material/Quiz';
import HomeIcon from '@mui/icons-material/Home';
import StarIcon from '@mui/icons-material/Star';
import { Button } from '@mui/material';
import { supabase } from "../supabaseClient";

export default function AlreadyAttempted() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const results = state || {};
  const language = results.language || "en";

  const phone = results.phone || "guest";
  const chapter = results.chapter || localStorage.getItem("selectedChapter") || "Unknown";
  const attemptKey = `${phone}_${chapter}_attempted`;

  const [quizData, setQuizData] = useState({
    name: chapter,
    score: 0,
    completed: false,
  });
  const [loading, setLoading] = useState(true);
  const [canRetry, setCanRetry] = useState(false);

  // Check Supabase if user has an attempt for this chapter
  useEffect(() => {
    async function checkAttempt() {
      try {
        const { data: existing, error } = await supabase
          .from("results")
          .select("score,name")
          .eq("phone", phone)
          .eq("chapter", chapter);

        if (error) {
          console.error("Error checking attempts:", error);
        }

        if (!existing || existing.length === 0) {
          // No attempt exists: user can retry
          localStorage.removeItem(attemptKey);
          sessionStorage.removeItem(`${attemptKey}_warnings`);
          setCanRetry(true);
          setQuizData({ name: chapter, score: 0, completed: false });
        } else {
          const quiz = existing[0];
          setQuizData({
            name: quiz.name || chapter,
            score: quiz.score || 0,
            completed: true,
          });
          setCanRetry(false);
        }
      } catch (err) {
        console.error("Error fetching quiz data:", err);
        setCanRetry(false);
      } finally {
        setLoading(false);
      }
    }

    checkAttempt();
  }, [phone, chapter, attemptKey]);

  const handleRetry = () => {
    navigate("/quiz", {
      state: { ...results, isPreview: false },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
        <p className="text-gray-700 text-xl">
          {language === "en" ? "Checking quiz status..." : "வினா நிலை சரிபார்க்கப்படுகிறது..."}
        </p>
      </div>
    );
  }

  const sparkles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    delay: Math.random() * 2,
  }));

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-6 relative overflow-hidden">
      {/* Sparkles */}
      {sparkles.map(s => (
        <span
          key={s.id}
          className="absolute text-yellow-400 font-bold animate-sparkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
            fontSize: '0.75rem',
          }}
        >
          ★
        </span>
      ))}

      {/* Card */}
      <div className="relative z-10 max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-fadeInUp overflow-hidden">
        <div className="flex justify-center mb-4">
          <QuizIcon className="text-yellow-500 text-6xl animate-bounce" />
        </div>

        <h1 className="text-3xl font-extrabold text-purple-700 mb-2">
          {language === "en"
            ? "Oops! Quiz Already Attempted"
            : "ஓப்ப்ஸ்! நீங்கள் ஏற்கனவே இந்த வினாவை முயற்சித்துள்ளீர்கள்"}
        </h1>

        {/* Quiz Name */}
        <p className="text-gray-600 mb-2 font-semibold">
          {language === "en"
            ? `Quiz: ${quizData.name}`
            : `வினா: ${quizData.name}`}
        </p>

        {/* Score */}
        {quizData.completed && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <StarIcon className="text-yellow-400" />
            <span className="text-gray-700 font-medium">
              {language === "en"
                ? `You scored: ${quizData.score}%`
                : `உங்கள் மதிப்பெண்: ${quizData.score}%`}
            </span>
          </div>
        )}

        <p className="text-gray-700 mb-6 leading-relaxed">
          {language === "en"
            ? "You have already completed this quiz. Try the next chapter or review previous lessons to improve your score."
            : "நீங்கள் ஏற்கனவே இந்த வினாவை முடித்துள்ளீர்கள். அடுத்த அதிகாரத்தை முயற்சிக்கவும் அல்லது முந்தைய பாடங்களை மீண்டும் பார்க்கவும்."}
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
            sx={{
              width: '100%',
              py: 1.5,
              borderRadius: '1rem',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'transform 0.3s',
              '&:hover': {
                backgroundColor: '#6b46c1',
                transform: 'scale(1.05)',
              },
            }}
          >
            {language === "en" ? "Back to Home" : "முகப்புக்கு திரும்பவும்"}
          </Button>

          {canRetry && (
            <Button
              variant="contained"
              color="success"
              startIcon={<QuizIcon />}
              onClick={handleRetry}
              sx={{
                width: '100%',
                py: 1.5,
                borderRadius: '1rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'transform 0.3s',
                '&:hover': {
                  backgroundColor: '#16a34a',
                  transform: 'scale(1.05)',
                },
              }}
            >
              {language === "en" ? "Retry Quiz" : "வினாவை மீண்டும் முயற்சிக்கவும்"}
            </Button>
          )}
        </div>
      </div>

      {/* Inline CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sparkle {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-50px) scale(0.5); opacity: 0; }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-sparkle { animation: sparkle 3s linear infinite; }
        .animate-bounce { animation: bounce 1s infinite; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
