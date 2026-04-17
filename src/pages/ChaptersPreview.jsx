import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QuizIcon from "@mui/icons-material/Quiz";
import LanguageIcon from "@mui/icons-material/Language";
import AdminBottomDock from "../components/AdminBottomDock";

export default function ChaptersPreview() {
  const navigate = useNavigate();

  const [chapters, setChapters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // FETCH
  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("chapter, question_en, question_ta");

      if (error) {
        console.error(error);
        return;
      }

      const map = {};

      data.forEach((q) => {
        if (!q.chapter) return;

        const key = q.chapter.trim().toLowerCase();

        if (!map[key]) {
          map[key] = {
            name: q.chapter.trim(),
            count: 0,
            en: false,
            ta: false,
          };
        }

        map[key].count++;
        if (q.question_en?.trim()) map[key].en = true;
        if (q.question_ta?.trim()) map[key].ta = true;
      });

      const list = Object.values(map).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setChapters(list);
      setFiltered(list);
      setLoading(false);
    };

    fetch();
  }, []);

  // SEARCH
  useEffect(() => {
    setFiltered(
      chapters.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, chapters]);

  const handlePreview = (chapter, lang) => {
    navigate("/quiz", {
      state: {
        name: "Admin Preview",
        phone: "0000000000",
        place: "Admin",
        language: lang,
        chapter,
        isPreview: true,
      },
    });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900">
        <p className="text-xl animate-pulse font-black bg-linear-to-r from-pink-600 to-indigo-800 bg-clip-text text-transparent">
          Loading Chapters...
        </p>
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 text-white pb-28">

        {/* HEADER */}
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-black bg-linear-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Chapters Dashboard
          </h1>
        </div>

        {/* SEARCH */}
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapters..."
              className="w-full px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
            />
            <SearchIcon className="absolute right-4 top-3 text-gray-400" />
          </div>
        </div>

        {/* STATS */}
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <p className="text-gray-300 text-sm">Total Chapters</p>
            <p className="text-3xl font-bold">{chapters.length}</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
            <p className="text-gray-300 text-sm">Total Questions</p>
            <p className="text-3xl font-bold">
              {chapters.reduce((acc, c) => acc + c.count, 0)}
            </p>
          </div>
        </div>

        {/* GRID */}
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ch, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl hover:scale-[1.03] transition"
            >
              <div className="flex items-center justify-between mb-4">
                <QuizIcon className="text-purple-400" />
                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20">
                  {ch.count} Qs
                </span>
              </div>

              <h2 className="text-xl font-bold mb-2">{ch.name}</h2>

              {/* LANGUAGE STATUS */}
              <div className="flex gap-2 mb-4 text-xs">
                <span
                  className={`px-2 py-1 rounded ${
                    ch.en ? "bg-blue-500/30" : "bg-red-500/30"
                  }`}
                >
                  EN
                </span>
                <span
                  className={`px-2 py-1 rounded ${
                    ch.ta ? "bg-green-500/30" : "bg-red-500/30"
                  }`}
                >
                  TA
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePreview(ch.name, "en")}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm flex items-center justify-center gap-1"
                >
                  <LanguageIcon fontSize="small" /> English
                </button>

                <button
                  onClick={() => handlePreview(ch.name, "ta")}
                  className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm flex items-center justify-center gap-1"
                >
                  <LanguageIcon fontSize="small" /> Tamil
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AdminBottomDock />
    </>
  );
}