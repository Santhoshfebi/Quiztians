import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Welcome() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [language, setLanguage] = useState("en");
  const [chapter, setChapter] = useState("");
  const [chapters, setChapters] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizAvailable, setIsQuizAvailable] = useState(false);
  const navigate = useNavigate();

  // 🕒 Scheduled quiz start time
  const scheduledTime = new Date("2025-10-12T19:00:00");

  // 📘 Fetch available chapters from Supabase
  useEffect(() => {
    const fetchChapters = async () => {
      const { data, error } = await supabase.from("questions").select("chapter");
      if (error) {
        console.error("Error fetching chapters:", error);
      } else {
        const uniqueChapters = [...new Set(data.map((q) => q.chapter))];
        setChapters(uniqueChapters);
      }
    };
    fetchChapters();
  }, []);

  // ⏱ Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = scheduledTime - now;

      if (diff <= 0) {
        setIsQuizAvailable(true);
        setTimeLeft(0);
        clearInterval(timer);
      } else {
        setIsQuizAvailable(false);
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ⏳ Convert milliseconds to days/hours/min/sec
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  const handleStart = () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!name || !phone || !place || !chapter) {
      alert(
        language === "en"
          ? "Please fill all fields and select a chapter"
          : "எல்லா புலங்களையும் நிரப்பி ஒரு அத்தியாயத்தைத் தேர்ந்தெடுக்கவும்"
      );
      return;
    }
    if (!phoneRegex.test(phone)) {
      alert(
        language === "en"
          ? "Please enter a valid 10-digit phone number"
          : "தயவுசெய்து செல்லுபடியாகும் 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
      );
      return;
    }

    // 💾 Save chapter and user info
    localStorage.setItem("selectedChapter", chapter);
    navigate("/quiz", { state: { name, phone, place, language, chapter } });
  };

  const timeUnits = [
    { label: "Days", value: days },
    { label: "Hrs", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];

  return (
    <div className="flex flex-col-reverse md:flex-row items-start justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Left: Form */}
      <div className="mt-20 w-96 bg-white p-6 rounded-2xl shadow-2xl space-y-4 border border-gray-100">
        <h1 className="text-3xl font-extrabold text-center text-blue-600 drop-shadow-sm">
          {language === "en" ? "Welcome to the Quiz!" : "வினாடி வினாவிற்கு வருக."}
        </h1>

        {/* ⏳ Countdown Timer */}
        {!isQuizAvailable && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 font-medium mb-2">
              {language === "en" ? "Quiz starts in:" : "வினா தொடங்கும் நேரம்:"}
            </p>
            <div className="flex justify-center gap-3">
              {timeUnits.map((unit, idx) => (
                <div
                  key={idx}
                  className="bg-blue-600 text-white rounded-lg px-3 py-2 w-16 shadow-lg"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={unit.value}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-2xl font-mono font-bold"
                    >
                      {String(unit.value).padStart(2, "0")}
                    </motion.div>
                  </AnimatePresence>
                  <div className="text-xs uppercase tracking-wide">{unit.label}</div>
                </div>
              ))}
            </div>
            
          </div>
        )}

        <p disabled={!isQuizAvailable} className="text-center text-gray-600">
          {isQuizAvailable
            ? language === "en"
              ? "Enjoy the Quiz! Let's get started..."
              : "வினாடி வினாவை ஆரம்பிக்கலாம்...!"
            : ""}
        </p>

        {/* 🔹 Chapter Dropdown */}
        <h5 className="text-xl font-bold text-center text-indigo-500">
          {language === "en" ? "Select Chapter" : "அத்தியாயத்தைத் தேர்ந்தெடுக்கவும்"}
        </h5>
        <select
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">
            {language === "en" ? "-- Choose Chapter --" : "-- அத்தியாயத்தைத் தேர்ந்தெடுக்கவும் --"}
          </option>
          {chapters.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>

        {/* 🗣️ Language + Inputs */}
        <div className="mt-4 bg-gray-50 p-4 rounded-lg shadow-inner">
          <h2 className="text-l text-center mb-2 font-medium">
            Choose your preferred language / விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.
          </h2>

          <div className="w-full mb-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>

          <input
            type="text"
            placeholder={language === "en" ? "Your Name" : "உங்கள் பெயர்"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="tel"
            placeholder={language === "en" ? "Phone Number" : "தொலைபேசி எண்"}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={10}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder={language === "en" ? "Division / Place" : "வகுப்பு / இடம்"}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* 🚀 Start Quiz Button */}
        <button
          onClick={handleStart}
          disabled={!isQuizAvailable}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all shadow-md ${isQuizAvailable
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          {isQuizAvailable
            ? language === "en"
              ? "Start Quiz"
              : "வினாவை தொடங்கு"
            : language === "en"
              ? "Quiz Not Started Yet"
              : "வினா இன்னும் தொடங்கவில்லை"}
        </button>

        {/* 🔐 Admin Access Button */}
        <button
          onClick={() => navigate("/admin-Login")}
          className="w-full mt-4 py-2 rounded-lg text-white font-semibold bg-gray-800 hover:bg-black transition-all shadow-md"
        >
          {language === "en" ? "Admin Access" : "அட்மின் அணுகல்"}
        </button>
      </div>

      {/* Right: Tips Section */}
      <div className="md:ml-8 mt-20 bg-white p-6 rounded-2xl shadow-md w-full md:w-1/3 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {language === "en" ? "💡 Quiz Tips" : "💡 வினா குறிப்புகள்"}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm leading-relaxed">
          <li>
            {language === "en"
              ? "🌐 Choose your preferred language."
              : "🌐 விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்."}
          </li>
          <li>
            {language === "en"
              ? "⏳ You have 20 Minutes to Complete the Quiz"
              : "⏳ வினாடி வினாவை முடிக்க உங்களுக்கு 20 நிமிடங்கள் வழங்கப்படும்."}
          </li>
          <li>
            {language === "en"
              ? "Once selected, answers cannot be changed."
              : "ஒருமுறை தேர்ந்தெடுத்த பதிலை மாற்ற முடியாது."}
          </li>
          <li>
            {language === "en"
              ? "Try to answer all questions."
              : "அனைத்து கேள்விகளுக்கும் பதில் சொல்ல முயலுங்கள்."}
          </li>
          <li>
            {language === "en"
              ? "🏅 Correct answers are rewarded."
              : "🏅 சரியான பதில்களுக்கு மதிப்பெண் வழங்கப்படும்."}
          </li>
          <li>
            {language === "en"
              ? "🥇 Leaderboard will be shown at the end."
              : "🥇 முடிவில் முன்னணி பட்டியல் காணலாம்."}
          </li>
        </ul>
      </div>
    </div>
  );
}
