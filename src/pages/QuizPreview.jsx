import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChaptersPreview() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📘 Fetch unique chapters that have BOTH English and Tamil questions
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("chapter, question_en, question_ta");

        if (error) throw error;

        // Group by chapter and verify both languages exist
        const chapterMap = {};

        data.forEach((q) => {
          if (!q.chapter) return;
          if (!chapterMap[q.chapter]) {
            chapterMap[q.chapter] = { hasEnglish: false, hasTamil: false };
          }
          if (q.question_en && q.question_en.trim() !== "")
            chapterMap[q.chapter].hasEnglish = true;
          if (q.question_ta && q.question_ta.trim() !== "")
            chapterMap[q.chapter].hasTamil = true;
        });

        // ✅ Only include chapters with both languages
        const validChapters = Object.keys(chapterMap).filter(
          (ch) => chapterMap[ch].hasEnglish && chapterMap[ch].hasTamil
        );

        setChapters(validChapters);
      } catch (err) {
        console.error("Error fetching chapters:", err);
        alert("Failed to load chapters.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-xl font-bold animate-pulse text-blue-700">
          Loading chapters...
        </p>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-xl font-bold text-red-600">
          No bilingual chapters found.
        </p>
      </div>
    );
  }

  // 🧩 Navigate to quiz preview
  const handlePreview = (chapter, lang) => {
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

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto">

        <div className="flex justify-evenly mt-5">

          <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">
            🧪 Admin Chapter Preview
          </h1>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => navigate("/admin")}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              ⬅️ Back to Admin Panel
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10">
          {chapters.map((chapter, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 flex flex-col items-center justify-between shadow-xl transition-all hover:scale-105 border-t-4 border-yellow-400"
            >
              <h2 className="text-2xl font-bold text-blue-800 mb-3">
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
                  🇬🇧 English
                </button>
                <button
                  onClick={() => handlePreview(chapter, "ta")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  🇮🇳 Tamil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
