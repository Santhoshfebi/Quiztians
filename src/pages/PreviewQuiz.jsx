import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ChaptersPreview() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("chapter", { distinct: ["chapter"] });

        if (error) throw error;

        const uniqueChapters = data.map((row) => row.chapter);
        setChapters(uniqueChapters);
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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl font-bold animate-pulse">Loading chapters...</p>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl font-bold text-red-600">No chapters found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">
          Chapters Preview
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {chapters.map((chapter, idx) => (
            <div
              key={idx}
              onClick={() =>
                navigate("/quiz", {
                  state: {
                    name: "Admin Preview",
                    phone: "0000000000",
                    place: "Admin",
                    language: "en",
                    chapter: chapter,
                    preview: true,
                  },
                })
              }
              className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
            >
              <h2 className="text-2xl font-bold mb-2">{chapter}</h2>
              <p className="text-center">Click to preview this chapter's quiz</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
