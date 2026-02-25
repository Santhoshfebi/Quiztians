import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StartQuizConfirm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [activeTip, setActiveTip] = useState(0);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [readyCountdown, setReadyCountdown] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  if (!state) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h2 className="text-red-600 font-semibold">No quiz data found.</h2>
      </div>
    );
  }

  const { name, phone, place, language, chapter, duration } = state;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTip((prev) => (prev + 1) % tips.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !isStarting) {
        alert(
          language === "en"
            ? "⚠ Do not switch tabs during exam"
            : "⚠ தேர்வு போது டாப் மாற்ற வேண்டாம்",
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isStarting, language]);


  const tips = [
    language === "en"
      ? "🎯 Answer carefully — answers cannot be changed."
      : "🎯 கவனமாக பதிலளிக்கவும்",

    language === "en"
      ? "Try to answer all questions."
      : "அனைத்து கேள்விகளுக்கும் பதில் சொல்ல முயலுங்கள்.",

    language === "en"
      ? "📜 Follow exam rules strictly."
      : "📜 தேர்வு விதிகளை பின்பற்றவும்",

    language === "en"
      ? "🏅 Correct answers increase score."
      : "🏅 சரியான பதில்களுக்கு மதிப்பெண்",

    language === "en"
      ? "Review your responses at the end of Quiz for correct answers."
      : "வினாடி வினா முடிவில் உங்கள் பதில்களைச் சரிபார்க்கவும்.",

     language === "en"
      ? "🥇 Leaderboard will be shown at the end."
      : "🥇 முடிவில் முன்னணி பட்டியல் காணலாம்.",
  ];

  const startQuizSequence = () => {
    if (!acceptedRules || isStarting) return;

    setIsStarting(true);
    setReadyCountdown(5);

    timerRef.current = setInterval(() => {
      setReadyCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timerRef.current);
          navigate("/quiz", { state });
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const DetailItem = ({ label, value }) => (
    <div className="flex flex-col p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm sm:text-base font-semibold text-gray-700 wrap-break-word">
        {value}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl backdrop-blur-xl bg-white/70 border border-white/40 rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-black bg-linear-to-r from-pink-800 to-indigo-600 bg-clip-text text-transparent">
            {language === "en"
              ? " Details / Tips "
              : "விவரங்கள் / குறிப்புகள்"}
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 ">
          <DetailItem label="Name" value={name} />
          <DetailItem label="Phone" value={phone} />
          <DetailItem label="Place" value={place} />
          <DetailItem label="Chapter" value={chapter} />
          <DetailItem label="Quiz Duration" value={`${duration} min`} />
          <DetailItem
            label="Language"
            value={language === "en" ? "English" : "Tamil"}
          />
        </div>

        {/* Elite Tip Carousel */}
        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl p-5 sm:p-6 shadow-lg">
          <h2 className="text-lg sm:text-xl font-black bg-linear-to-r from-pink-800 to-indigo-800 bg-clip-text text-transparent mb-4">
            💡 {language === "en" ? "Quiz Tips" : "வினா குறிப்புகள்"}
          </h2>

          <div className="relative min-h-22.5 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTip}
                initial={{ opacity: 0, x: 40, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -40, filter: "blur(8px)" }}
                transition={{ duration: 0.1 }}
                className="text-sm sm:text-base text-gray-700 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100"
              >
                {tips[activeTip]}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-4">
              {tips.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    idx === activeTip ? "w-6 bg-indigo-600" : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Rules Acceptance */}
        <label className="flex items-center gap-3 text-xs sm:text-sm cursor-pointer px-1">
          <input
            type="checkbox"
            checked={acceptedRules}
            onChange={(e) => setAcceptedRules(e.target.checked)}
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          {language === "en"
            ? "I accept exam rules"
            : "விதிகளை ஏற்றுக்கொள்கிறேன்"}
        </label>

        {/* Countdown */}
        <AnimatePresence>
          {readyCountdown !== null && isStarting && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-center text-6xl font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent"
            >
              {readyCountdown}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            disabled={!acceptedRules || isStarting}
            onClick={startQuizSequence}
            className={`w-full py-3 sm:py-4 rounded-xl font-semibold text-white transition ${
              acceptedRules
                ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:shadow-lg"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            {language === "en" ? "Start Exam →" : "தேர்வை தொடங்கு →"}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 sm:py-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
          >
            {language === "en" ? "Go Back" : "மீண்டும் செல்ல"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
