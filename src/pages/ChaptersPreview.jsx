import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChaptersPreview() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 📘 Fetch unique chapters that have BOTH English and Tamil questions
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("chapter, question_en, question_ta")
          .not("chapter", "is", null);

        if (error) throw error;

        // Group by chapter and verify both languages exist
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

        // ✅ Only include chapters with both languages
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

  // 🔍 Handle search
  useEffect(() => {
    const filtered = chapters.filter((ch) =>
      ch.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredChapters(filtered);
  }, [searchTerm, chapters]);

  // 🧩 Navigate to quiz preview
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

  // 🌀 Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-xl font-bold animate-pulse text-blue-700">
          Loading chapters...
        </p>
      </div>
    );
  }

  // ⚠️ No chapters found
  if (filteredChapters.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <p className="text-xl font-bold text-red-600 mb-4">
          No bilingual chapters found.
        </p>
        {chapters.length > 0 && (
          <button
            onClick={() => setSearchTerm("")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Reset Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-evenly items-center mt-8 mb-6">
          <h1 className="text-3xl font-bold text-blue-700 text-center mb-4 cursor-pointer md:mb-0"
          onClick={() => window.location.reload()}
          >
            🧪 Admin Chapter Preview
          </h1>

          {/* Back Button */}
          <button
            onClick={() => navigate("/admin")}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all"
          >
            ⬅️ Back to Admin Panel
          </button>
        </div>

        {/* Search bar */}
        <div className="flex justify-center mb-15 mt-10">
          <input
            type="text"
            placeholder="🔍 Search chapter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Chapter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          {filteredChapters.map((chapter, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 flex flex-col items-center justify-between shadow-xl transition-all hover:scale-105 border-t-4 border-yellow-400"
            >
              <h2 className="text-2xl font-bold text-blue-800 mb-3 text-center">
                {chapter}
              </h2>
              <p className="text-gray-600 text-center mb-4">
                Preview the quiz in both languages
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handlePreview(chapter, "en")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  English
                </button>
                <button
                  onClick={() => handlePreview(chapter, "ta")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Tamil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
