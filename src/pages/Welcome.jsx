import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Welcome() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [language, setLanguage] = useState("en");
  const [chapter, setChapter] = useState("");
  const [chapters, setChapters] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizAvailable, setIsQuizAvailable] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTip, setActiveTip] = useState(0);

  const navigate = useNavigate();

  // 🔹 Fetch quiz config with realtime updates
  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("quiz_config")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching quiz config:", error);
        return;
      }
      if (data) {
        setConfig(data);
        setChapters(data.active_chapters || []);
      }
    };

    fetchConfig();

    // 🔁 Real-time updates when admin changes quiz_config
    const subscription = supabase
      .channel("public:quiz_config")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "quiz_config" },
        (payload) => {
          const newConfig = payload.new;
          setConfig(newConfig);
          setChapters(newConfig.active_chapters || []);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  // 🕒 Countdown timer before quiz starts
  useEffect(() => {
    if (!config?.start_time) return;

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(config.start_time);
      const diff = start - now;
      if (diff <= 0) {
        setIsQuizAvailable(true);
        setTimeLeft(0);
      } else {
        setIsQuizAvailable(false);
        setTimeLeft(diff);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [config]);

  // 💡 Animated quiz tips
  useEffect(() => {
    if (!config) return;
    const tipsCount = 6;
    const interval = setInterval(() => {
      setActiveTip((prev) => (prev + 1) % tipsCount);
    }, 3000);
    return () => clearInterval(interval);
  }, [config]);

  // Timer display units
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  // 🚦 Check and start quiz
  const handleStart = async () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!name || !phone || !place || !chapter) {
      alert(language === "en" ? "Please fill all fields" : "எல்லா புலங்களையும் நிரப்பவும்");
      return;
    }
    if (!phoneRegex.test(phone)) {
      alert(
        language === "en"
          ? "Enter a valid 10-digit phone number"
          : "செல்லுபடியாகும் 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
      );
      return;
    }

    // 🔍 Step 1: Check if this user already attempted this chapter
    const { data: existingAttempt, error } = await supabase
      .from("results")
      .select("*")
      .eq("phone", phone)
      .eq("chapter", chapter)
      .maybeSingle();

    if (error) {
      console.error("Error checking previous attempt:", error);
      alert("Error checking previous attempt. Please try again later.");
      return;
    }

    if (existingAttempt) {
      // 🚫 Already attempted
      alert(
        language === "en"
          ? "You have already attempted this quiz for this chapter!"
          : "இந்த அதிகாரத்திற்கான வினாவை நீங்கள் ஏற்கனவே முயற்சித்துவிட்டீர்கள்!"
      );
      return;
    }

    // ✅ Step 2: Proceed to quiz
    navigate("/quiz", {
      state: {
        name,
        phone,
        place,
        language,
        chapter,
        duration: config?.duration || 20,
      },
    });
  };

  const timeUnits = [
    { label: "Days", value: days },
    { label: "Hrs", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];

  const tips = [
    language === "en"
      ? "🌐 Choose your preferred language."
      : "🌐 விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.",
    language === "en"
      ? `⏳ You have ${config?.duration} Minutes to complete the quiz.`
      : `⏳ வினாவை முடிக்க உங்களுக்கு ${config?.duration} நிமிடங்கள் வழங்கப்படும்.`,
    language === "en"
      ? "Once selected, answers cannot be changed."
      : "ஒருமுறை தேர்ந்தெடுத்த பதிலை மாற்ற முடியாது.",
    language === "en"
      ? "Try to answer all questions."
      : "அனைத்து கேள்விகளுக்கும் பதில் சொல்ல முயலுங்கள்.",
    language === "en"
      ? "🏅 Correct answers are rewarded."
      : "🏅 சரியான பதில்களுக்கு மதிப்பெண் வழங்கப்படும்.",
    language === "en"
      ? "🥇 Leaderboard will be shown at the end."
      : "🥇 முடிவில் முன்னணி பட்டியல் காணலாம்.",
  ];

  if (!config) {
    return (
      <div className="items-center min-h-screen text-lg font-semibold animate-pulse text-gray-600">
        <h4 className="text-center">Loading quiz setup...</h4>
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row items-start justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Left: Form + Timer */}
      <div className="mt-20 w-full md:w-96 bg-white p-6 rounded-2xl shadow-2xl space-y-4 border border-gray-100">
        <h1 className="text-3xl font-extrabold text-center text-blue-600 drop-shadow-sm">
          {language === "en" ? "Welcome to the Quiz!" : "வினாவிற்கு வருக!"}
        </h1>

        {!isQuizAvailable && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 font-medium mb-2">
              {language === "en" ? "Quiz starts in:" : "வினா தொடங்கும் நேரம்:"}
            </p>
            <div className="flex justify-center gap-3">
              {timeUnits.map((unit, idx) => (
                <div key={idx} className="bg-blue-600 text-white rounded-lg px-3 py-2 w-16 shadow-lg">
                  <motion.div
                    key={unit.value}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl font-mono font-bold"
                  >
                    {String(unit.value).padStart(2, "0")}
                  </motion.div>
                  <div className="text-xs uppercase tracking-wide">{unit.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chapter + Inputs */}
        <h5 className="mt-4 bg-gray-50 p-4 rounded-lg shadow-inner">
          {language === "en" ? "Select Chapter" : "அதிகாரத்தைத் தேர்ந்தெடுக்கவும்"}
        </h5>
        <select
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          disabled={chapters.length === 0 || !isQuizAvailable}
          className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">
            {chapters.length === 0
              ? language === "en"
                ? "Loading chapters..."
                : "அதிகாரங்கள் ஏற்றப்படுகிறது..."
              : "-- Choose Chapter | அதிகாரம் --"}
          </option>
          {chapters.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>

        <div className="mt-4 bg-gray-50 p-4 rounded-lg shadow-inner">
          <h2 className="text-l text-center mb-2 font-medium">
            {language === "en" ? "Choose your preferred language" : "விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்"}
          </h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
          </select>

          <input
            type="text"
            placeholder={language === "en" ? "Your Name" : "உங்கள் பெயர்"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="tel"
            placeholder={language === "en" ? "Phone Number" : "தொலைபேசி எண்"}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={10}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder={language === "en" ? "Division / Place" : "வகுப்பு / இடம்"}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          onClick={handleStart}
          disabled={!isQuizAvailable}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all shadow-md ${
            isQuizAvailable ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
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

        <button
          onClick={() => navigate("/admin-login")}
          className="w-full mt-4 py-2 rounded-lg text-white font-semibold bg-gray-800 hover:bg-black transition-all shadow-md"
        >
          {language === "en" ? "Admin" : "அட்மின்"}
        </button>
      </div>

      {/* Right: Animated Quiz Tips */}
      <div className="md:ml-8 mt-20 bg-white p-6 rounded-2xl shadow-md w-full md:w-1/3 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {language === "en" ? "💡 Quiz Tips" : "💡 வினா குறிப்புகள்"}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm leading-relaxed">
          {tips.map((tip, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: idx === activeTip ? 1 : 0.5, scale: idx === activeTip ? 1.05 : 1 }}
              transition={{ duration: 0.5 }}
            >
              {tip}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
