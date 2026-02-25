import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QuizIcon from "@mui/icons-material/Quiz";
import LanguageIcon from "@mui/icons-material/Language";
import { motion } from "framer-motion";

export default function ChaptersPreview() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("chapter, question_en, question_ta")
          .not("chapter", "is", null);

        if (error) throw error;

        const chapterMap = {};
        data.forEach((q) => {
          if (!q.chapter) return;
          const chapterKey = q.chapter.trim().toLowerCase();
          if (!chapterMap[chapterKey]) {
            chapterMap[chapterKey] = {
              name: q.chapter.trim(),
              hasEnglish: false,
              hasTamil: false,
            };
          }
          if (q.question_en && q.question_en.trim() !== "")
            chapterMap[chapterKey].hasEnglish = true;
          if (q.question_ta && q.question_ta.trim() !== "")
            chapterMap[chapterKey].hasTamil = true;
        });

        const validChapters = Object.values(chapterMap)
          .filter((ch) => ch.hasEnglish && ch.hasTamil)
          .map((ch) => ch.name)
          .sort((a, b) => a.localeCompare(b));

        setChapters(validChapters);
        setFilteredChapters(validChapters);
      } catch (err) {
        console.error("Error fetching chapters:", err);
        alert("Failed to load chapters.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  useEffect(() => {
    const filtered = chapters.filter((ch) =>
      ch.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredChapters(filtered);
  }, [searchTerm, chapters]);

  const handlePreview = (chapter, lang) => {
    if (!chapter || !lang) return;
    navigate("/quiz", {
      state: {
        name: "Admin Preview",
        phone: "0000000000",
        place: "Admin",
        language: lang,
        chapter: chapter,
        isPreview: true,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900">
        <p className="text-xl animate-pulse font-black bg-linear-to-r from-pink-800 to-indigo-600 bg-clip-text text-transparent">
          Loading chapters...
        </p>
      </div>
    );
  }

  if (filteredChapters.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 p-4">
        <p className="text-xl font-bold text-red-600 mb-4">
          No bilingual chapters found.
        </p>
        {chapters.length > 0 && (
          <button
            onClick={() => setSearchTerm("")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow flex items-center gap-2"
          >
            <ArrowBackIcon /> Reset Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-8 mb-8 gap-4">
          <h1
            className="text-3xl font-black bg-linear-to-r from-pink-800 to-indigo-600 bg-clip-text text-transparent text-center cursor-pointer hover:underline transition-all"
            onClick={() => window.location.reload()}
          >
            Admin Chapter Preview
          </h1>

          <button
            onClick={() => navigate("/admin")}
            className="px-8 py-4 rounded-2xl font-bold bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-xl hover:scale-105 transition"
          >
            <ArrowBackIcon /> Back to Admin Panel
          </button>
        </div>

        {/* Total Chapters Summary */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center">
            <p className="text-gray-500 text-sm">Total Chapters</p>
            <p className="text-4xl font-black bg-linear-to-r from-pink-800 to-indigo-600 bg-clip-text text-transparent">{chapters.length}</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex justify-center mb-10 mt-4">
          <div className="relative w-full md:w-1/2 font-black bg-linear-to-r from-pink-200 to-indigo-800 bg-clip-text text-transparent">
            <input
              type="text"
              placeholder="Search chapter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
            />
            <SearchIcon className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Chapter Cards with animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          {filteredChapters.map((chapter, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-6 flex flex-col items-center justify-between shadow-xl hover:shadow-2xl transition-shadow transform hover:scale-105 border-t-4 border-blue-400"
            >
              <QuizIcon className="text-blue-500 text-5xl mb-4" />
              <h2 className="text-2xl font-bold text-pink-800 mb-3 text-center">
                {chapter}
              </h2>
              <p className="text-gray-600 text-center mb-4">
                Preview the quiz in both languages
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handlePreview(chapter, "en")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow flex items-center gap-2"
                >
                  <LanguageIcon /> English
                </button>
                <button
                  onClick={() => handlePreview(chapter, "ta")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow flex items-center gap-2"
                >
                  <LanguageIcon /> Tamil
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
