import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Menu } from "@headlessui/react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";

export default function QuestionPreviewPage() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [chapterSearchTerm, setChapterSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;

      setQuestions(data);
      setFilteredQuestions(data);
      const uniqueChapters = [...new Set(data.map((q) => q.chapter))];
      setChapters(uniqueChapters);

      toast.success("✅ Questions loaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to fetch questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Filter questions by selected chapter and search term
  useEffect(() => {
    let tempQuestions = questions;

    if (selectedChapter)
      tempQuestions = tempQuestions.filter((q) => q.chapter === selectedChapter);

    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      tempQuestions = tempQuestions.filter(
        (q) =>
          q.question_en.toLowerCase().includes(lower) ||
          q.question_ta.toLowerCase().includes(lower)
      );
    }

    setFilteredQuestions(tempQuestions);
  }, [questions, selectedChapter, searchTerm]);

  // Admin access check
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      if (
        !currentUser ||
        (currentUser.user_metadata.role !== "admin" &&
          currentUser.user_metadata.role !== "superadmin")
      ) {
        toast.error("Access denied");
        navigate("/admin-login");
        return;
      }
      setUser(currentUser);
      if (!sessionStorage.getItem("previewQuestionsWelcome")) {
        toast.success(
          `Welcome, ${currentUser.email}! Preview questions here.`
        );
        sessionStorage.setItem("previewQuestionsWelcome", "true");
      }
    };
    checkAdmin();
  }, [navigate]);

  // Back-to-top button
  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;

      const updatedQuestions = questions.filter((q) => q.id !== id);
      setQuestions(updatedQuestions);

      toast.success("✅ Question deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to delete question.");
    }
  };

  const totalQuestionsForChapter = selectedChapter
    ? questions.filter((q) => q.chapter === selectedChapter).length
    : filteredQuestions.length;

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900">
        <p className="text-xl animate-pulse font-black bg-linear-to-r from-pink-600 to-indigo-800 bg-clip-text text-transparent">
          Loading questions...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen p-6 bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 relative">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1
            className="text-3xl font-black bg-linear-to-r from-pink-600 to-indigo-800 bg-clip-text text-transparent text-center cursor-pointer hover:underline transition-all flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
             Admin Question Preview
          </h1>

          <button
            onClick={() => navigate("/admin")}
            className="px-8 py-4 rounded-2xl font-bold bg-linear-to-r from-pink-500 via-purple-600 to-indigo-600 shadow-xl hover:scale-105 transition"
          >
            <ArrowBackIcon /> Back to Admin Panel
          </button>
        </div>

        {/* Total Questions */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center">
            <p className="text-gray-500 text-l">Total Questions</p>
            <p className="text-4xl font-black bg-linear-to-r from-pink-600 to-indigo-800 bg-clip-text text-transparent">{totalQuestionsForChapter}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-evenly gap-4 mb-6 flex-wrap">
          <Menu as="div" className="relative inline-block text-left w-full md:w-1/3">
            <Menu.Button className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-left bg-white hover:bg-gray-100 flex items-center gap-2">
              <MenuBookIcon /> {selectedChapter ? `Chapter: ${selectedChapter}` : "Select Chapter"}
            </Menu.Button>
            <Menu.Items className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto focus:outline-none">
              <div className="px-2 py-2 ">
                <input
                  type="text"
                  placeholder="Search chapter..."
                  value={chapterSearchTerm}
                  onChange={(e) => setChapterSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 mb-2 border  border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                />
                {chapters
                  .filter((ch) =>
                    ch.toLowerCase().includes(chapterSearchTerm.toLowerCase())
                  )
                  .map((ch) => {
                    const count = questions.filter((q) => q.chapter === ch).length;
                    return (
                      <Menu.Item key={ch}>
                        {({ active }) => (
                          <div
                            onClick={() => {
                              setSelectedChapter(ch);
                              setChapterSearchTerm("");
                            }}
                            className={`cursor-pointer px-4 py-2 rounded-md flex justify-between items-center ${
                              active ? "bg-blue-100 text-blue-700" : "text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <MenuBookIcon className="text-blue-500" />
                              <span>{ch}</span>
                            </div>
                            <span className="text-sm text-gray-500">{count} Qs</span>
                          </div>
                        )}
                      </Menu.Item>
                    );
                  })}
              </div>
            </Menu.Items>
          </Menu>

          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="🔍 Search question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
            />
            <SearchIcon className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <p className="text-center text-gray-600">No questions found.</p>
        ) : (
          <ul className="space-y-6">
            {filteredQuestions.map((q, idx) => (
              <motion.li
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-xl border-t-4 border-blue-400"
              >
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <MenuBookIcon className="text-blue-500" /> 
                  <span className="text-blue-600">#{idx + 1}</span> - Chapter:{" "}
                  <span className="font-medium">{q.chapter}</span>
                </p>

                <p className="mt-2">
                  <span className="font-semibold text-gray-700">English:</span> {q.question_en}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-gray-700">Tamil:</span> {q.question_ta}
                </p>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["a", "b", "c", "d"].map((opt) => (
                    <div key={opt} className="flex items-start gap-2">
                      <span className="font-bold text-blue-500">{opt.toUpperCase()}.</span>
                      <div>
                        <p>English: {q[`option_${opt}_en`]}</p>
                        <p>Tamil: {q[`option_${opt}_ta`]}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-3 font-semibold flex items-center justify-center gap-2 text-green-600">
                  <CheckCircleIcon /> Correct Answer: English: {q.correct_answer} | Tamil: {q.correct_answer_ta}
                </p>

                <div className="flex justify-center mt-4 gap-4">
                  <button
                    onClick={() => navigate(`/edit-question/${q.id}`)}
                    className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-all flex items-center gap-2"
                  >
                    <EditIcon /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center gap-2"
                  >
                    <DeleteIcon /> Delete
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 px-4 py-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-500 ${
          showTopBtn ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        ↑ Top
      </button>
    </div>
  );
}
