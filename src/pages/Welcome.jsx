import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useMemo } from "react";

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
        },
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

  const timeUnits = [
    { label: "Days", value: Math.floor(timeLeft / (1000 * 60 * 60 * 24)) },
    { label: "Hrs", value: Math.floor((timeLeft / (1000 * 60 * 60)) % 24) },
    { label: "Min", value: Math.floor((timeLeft / (1000 * 60)) % 60) },
    { label: "Sec", value: Math.floor((timeLeft / 1000) % 60) },
  ];

  const formattedTime = useMemo(() => {
    return {
      days: Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((timeLeft / (1000 * 60 * 60)) % 24)),
      minutes: Math.max(0, Math.floor((timeLeft / (1000 * 60)) % 60)),
      seconds: Math.max(0, Math.floor((timeLeft / 1000) % 60)),
    };
  }, [timeLeft]);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);

    const phoneRegex = /^[0-9]{10}$/;
    const missingFields = !name || !phone || !place || !chapter;

    if (missingFields) {
      alert(
        language === "en"
          ? "Please fill all fields"
          : "எல்லா புலங்களையும் நிரப்பவும்",
      );
      setStarting(false);
      return;
    }

    if (!phoneRegex.test(phone)) {
      alert(
        language === "en"
          ? "Enter a valid 10-digit phone number"
          : "செல்லுபடியாகும் 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்",
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

      navigate("/start-confirm", {
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
    <div className="min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
      {/* NAVBAR */}
      <div className="w-full backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-row sm:flex-row justify-between items-center p-4 sm:p-5 gap-3">
          <h1 className="text-xl sm:text-2xl font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">
            QUIZTIANS
          </h1>

          <button
            onClick={() => navigate("/admin-login")}
            className="px-5 py-2 text-sm sm:text-base rounded-xl border border-white/20 hover:bg-white/10 transition"
          >
            {language === "en" ? "Admin Login" : "அட்மின்"}
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 sm:space-y-8 text-center md:text-left"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Smart Quiz Platform For Modern Learning
            </h1>

            <p className="text-gray-300 text-base sm:text-lg max-w-lg mx-auto md:mx-0">
              Join thousands of learners competing in real-time quizzes with
              smart analytics and instant results.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button
                onClick={handleStart}
                disabled={!isQuizAvailable || starting}
                className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-2xl font-bold bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-xl hover:scale-105 transition w-full sm:w-auto"
              >
                {!isQuizAvailable
                  ? "Quiz Starts In..."
                  : starting
                    ? "Starting..."
                    : "Start Quiz →"}
              </button>

              {/* TIMER DISPLAY */}
              {!isQuizAvailable && timeLeft > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-center">
                  {[
                    { label: "Days", value: formattedTime.days },
                    { label: "Hrs", value: formattedTime.hours },
                    { label: "Min", value: formattedTime.minutes },
                    { label: "Sec", value: formattedTime.seconds },
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-4 py-2 min-w-17.5"
                    >
                      <div className="text-xl font-bold">{t.value}</div>
                      <div className="text-xs text-gray-300">{t.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate("/scores")}
                className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-2xl border border-white/30 hover:bg-white/10 transition w-full sm:w-auto"
              >
                Leaderboard
              </button>
            </div>
          </motion.div>

          {/* RIGHT FORM CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl space-y-5 sm:space-y-6"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-center">
              {language === "en"
                ? "Enter Your Details"
                : "விவரங்களை உள்ளிடவும்"}
            </h2>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-black text-sm sm:text-base"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>

            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              disabled={chapters.length === 0 || !isQuizAvailable}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-black text-sm sm:text-base"
            >
              <option value="">
                {language === "en" ? "Select Chapter" : "அதிகாரம்"}
              </option>

              {chapters.map((ch) => (
                <option key={ch}>{ch}</option>
              ))}
            </select>

            <input
              placeholder={language === "en" ? "Name" : "பெயர்"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm sm:text-base"
            />

            <input
              placeholder={language === "en" ? "Phone Number" : "தொலைபேசி"}
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm sm:text-base"
            />

            <input
              placeholder={language === "en" ? "Place" : "இடம்"}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm sm:text-base"
            />

            <button
              onClick={handleStart}
              disabled={!isQuizAvailable || starting}
              className="w-full py-3 sm:py-4 rounded-2xl font-bold bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-xl hover:scale-105 transition text-sm sm:text-base"
            >
              {isQuizAvailable
                ? starting
                  ? "Starting..."
                  : "Start Quiz →"
                : "Quiz Not Started"}
            </button>
          </motion.div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-6xl mx-auto py-14 sm:py-20 px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-16">
          Why Choose QuizPro?
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            "Real-time Quiz Engine",
            "Smart Analytics",
            "Mobile Friendly Experience",
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 text-center"
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-3">
                {feature}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base">
                High performance quiz experience with modern UI interactions.
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
