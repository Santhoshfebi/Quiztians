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
  const [starting, setStarting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("quiz_config")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching quiz config:", error.message);
        return;
      }

      if (data) {
        setConfig(data);
        setChapters(data.active_chapters || []);
      }
    };

    fetchConfig();

    const channel = supabase
      .channel("public:quiz_config")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "quiz_config" },
        (payload) => {
          const updatedConfig = payload.new;
          setConfig(updatedConfig);
          setChapters(updatedConfig.active_chapters || []);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!config?.start_time) return;

    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(config.start_time);
      const diff = startTime - now;
      setIsQuizAvailable(diff <= 0);
      setTimeLeft(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config]);

  useEffect(() => {
    const totalTips = 6;
    const interval = setInterval(
      () => setActiveTip((prev) => (prev + 1) % totalTips),
      3000
    );
    return () => clearInterval(interval);
  }, []);

  const timeUnits = [
    { label: "Days", value: Math.floor(timeLeft / (1000 * 60 * 60 * 24)) },
    { label: "Hrs", value: Math.floor((timeLeft / (1000 * 60 * 60)) % 24) },
    { label: "Min", value: Math.floor((timeLeft / (1000 * 60)) % 60) },
    { label: "Sec", value: Math.floor((timeLeft / 1000) % 60) },
  ];

  const tips = [
    language === "en"
      ? "🌐 Choose your preferred language."
      : "🌐 விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.",
    language === "en"
      ? `⏳ You have ${config?.duration} minutes to complete the quiz.`
      : `⏳ வினாவை முடிக்க உங்களுக்கு ${config?.duration} நிமிடங்கள் வழங்கப்படும்.`,
    language === "en"
      ? "Once selected, answers cannot be changed."
      : "ஒருமுறை தேர்ந்தெடுத்த பதிலை மாற்ற முடியாது.",
    language === "en"
      ? "Try to answer all questions."
      : "அனைத்து கேள்விகளுக்கும் பதில் சொல்ல முயலுங்கள்.",
      language === "en"
      ? "Review your  responses at the end of Quiz for correct answers."
      : "வினாடி வினா முடிவில் உங்கள் பதில்களைச் சரிபார்க்கவும்.",
    language === "en"
      ? "🏅 Correct answers are rewarded."
      : "🏅 சரியான பதில்களுக்கு மதிப்பெண் வழங்கப்படும்.",
    language === "en"
      ? "🥇 Leaderboard will be shown at the end."
      : "🥇 முடிவில் முன்னணி பட்டியல் காணலாம்.",
  ];

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);

    const phoneRegex = /^[0-9]{10}$/;
    const missingFields = !name || !phone || !place || !chapter;

    if (missingFields) {
      alert(language === "en" ? "Please fill all fields" : "எல்லா புலங்களையும் நிரப்பவும்");
      setStarting(false);
      return;
    }

    if (!phoneRegex.test(phone)) {
      alert(
        language === "en"
          ? "Enter a valid 10-digit phone number"
          : "செல்லுபடியாகும் 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
      );
      setStarting(false);
      return;
    }

    try {
      const { data: existingAttempt, error } = await supabase
        .from("results")
        .select("*")
        .eq("phone", phone)
        .eq("chapter", chapter)
        .maybeSingle();

      if (error) throw error;

      if (existingAttempt) {
        navigate("/already-attempted", { state: { language } });
        return;
      }

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
    } catch (err) {
      console.error("Error checking attempt:", err.message);
      alert("Error checking attempt. Please try again later.");
    } finally {
      setStarting(false);
    }
  };

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-lg font-semibold text-gray-600 animate-pulse">
        <h4>Loading quiz setup...</h4>
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
        />
      </div>
    );
  }

  // Animation variants
  const fieldVariant = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.1 } }),
  };

  const buttonVariant = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  return (
    <div className="flex flex-col-reverse md:flex-row items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 gap-8">
      {/* Left: Form */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="relative w-full md:w-96 bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-6 border border-gray-200"
      >
        <motion.h1 variants={fieldVariant} custom={0} className="text-3xl font-extrabold text-center text-indigo-700 drop-shadow-sm">
          {language === "en" ? "Welcome to the Quiz!" : "வினாவிற்கு வருக!"}
        </motion.h1>

        {/* Countdown */}
        {!isQuizAvailable && (
          <motion.div variants={fieldVariant} custom={1} className="bg-indigo-50 p-4 rounded-xl text-center shadow-inner flex flex-col gap-3">
            <p className="text-gray-600 font-medium mb-2">
              {language === "en" ? "Quiz starts in:" : "வினா தொடங்கும் நேரம்:"}
            </p>
            <div className="flex justify-center gap-3">
              {timeUnits.map((unit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-indigo-600 text-white rounded-xl w-16 h-16 flex flex-col justify-center items-center shadow-lg font-mono"
                >
                  <span className="text-2xl font-bold">{String(unit.value).padStart(2, "0")}</span>
                  <span className="text-xs uppercase tracking-wide">{unit.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chapter & Language */}
        <motion.div variants={fieldVariant} custom={2} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 relative">
            <label className="absolute -top-3 left-3 bg-white px-1 text-indigo-700 text-sm font-semibold">📚 {language === "en" ? "Select Chapter" : "அதிகாரம்"}</label>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              disabled={chapters.length === 0 || !isQuizAvailable}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-400 bg-white pl-8"
            >
              <option value="">
                {chapters.length === 0 ? (language === "en" ? "Loading chapters..." : "அதிகாரங்கள் ஏற்றப்படுகிறது...") : "-- Choose Chapter --"}
              </option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="absolute -top-3 left-3 bg-white px-1 text-indigo-700 text-sm font-semibold">🌐 {language === "en" ? "Select Language" : "மொழி"}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-400 bg-white pl-8"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
        </motion.div>

        {/* Inputs */}
        <motion.div variants={fieldVariant} custom={3} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder={language === "en" ? "Your Name" : "உங்கள் பெயர்"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="tel"
            placeholder={language === "en" ? "Phone Number" : "தொலைபேசி எண்"}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={10}
            className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="text"
            placeholder={language === "en" ? "Division / Place" : "இடம்"}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-indigo-400"
          />
        </motion.div>

        {/* Buttons */}
        <motion.div variants={fieldVariant} custom={4} className="flex flex-col gap-4">
          <motion.button
            variants={buttonVariant}
            onClick={handleStart}
            disabled={!isQuizAvailable || starting}
            className={`w-full py-3 rounded-2xl font-semibold text-white shadow-md transition-all ${
              isQuizAvailable ? "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isQuizAvailable
              ? language === "en" ? (starting ? "Starting..." : "Start Quiz →") : "வினாவை தொடங்கு →"
              : language === "en" ? "Quiz Not Started Yet" : "வினா இன்னும் தொடங்கவில்லை"}
          </motion.button>

          <motion.button
            variants={buttonVariant}
            onClick={() => navigate("/admin-login")}
            className="w-full py-3 rounded-2xl bg-gray-800 text-white font-semibold shadow-md hover:bg-black transition-all"
          >
            {language === "en" ? "Admin" : "அட்மின்"}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Right: Tips */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="md:ml-8 mt-8 md:mt-0 bg-white p-6 rounded-3xl shadow-md w-full md:w-1/3 border border-gray-200 flex flex-col gap-4"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {language === "en" ? "💡 Quiz Tips" : "💡 வினா குறிப்புகள்"}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm leading-relaxed">
          {tips.map((tip, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0.4 }}
              animate={{
                opacity: idx === activeTip ? 1 : 0.5,
                scale: idx === activeTip ? 1.05 : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {tip}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
