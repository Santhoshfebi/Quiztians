import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

export default function QuestionPreviewPage() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const navigate = useNavigate();

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

  // Filter questions based on chapter & search
  useEffect(() => {
    let tempQuestions = questions;

    if (selectedChapter) tempQuestions = tempQuestions.filter(q => q.chapter === selectedChapter);

    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      tempQuestions = tempQuestions.filter(
        q => q.question_en.toLowerCase().includes(lower) || q.question_ta.toLowerCase().includes(lower)
      );
    }

    setFilteredQuestions(tempQuestions);
  }, [questions, selectedChapter, searchTerm]);

  // Same as previous preview page
// Add Toaster and welcome toast once per session
useEffect(() => {
  const checkAdmin = async () => {
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user;
    if (!currentUser || (currentUser.user_metadata.role !== "admin" && currentUser.user_metadata.role !== "superadmin")) {
      toast.error("Access denied");
      navigate("/admin-login");
      return;
    }
    setUser(currentUser);
    if (!sessionStorage.getItem("previewQuestionsWelcome")) {
      toast.success(`Welcome, ${currentUser.email}! Preview questions here.`);
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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;

      const updatedQuestions = questions.filter(q => q.id !== id);
      setQuestions(updatedQuestions);

      toast.success("✅ Question deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to delete question.");
    }
  };

  if (loading) return <p className="text-center mt-20 text-lg font-semibold">Loading questions...</p>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Preview Questions</h1>

        <div className="flex justify-end mt-6">
          <button onClick={() => navigate("/admin")} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
            Back to Admin Panel
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
          <select value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">All Chapters</option>
            {chapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
          </select>

          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search questions..."
                 className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-1/3" />
        </div>

        {/* Questions List */}
        {filteredQuestions.length === 0 ? (
          <p className="text-center text-gray-600">No questions found.</p>
        ) : (
          <ul className="space-y-6">
            {filteredQuestions.map((q, idx) => (
              <li key={q.id} className="border border-gray-200 p-4 rounded-lg shadow-sm bg-gray-50">
                <p className="font-semibold mb-1">
                  <span className="text-blue-600">#{idx + 1}</span> - Chapter: <span className="font-medium">{q.chapter}</span>
                </p>

                <p className="mt-2"><span className="font-semibold text-gray-700">English:</span> {q.question_en}</p>
                <p className="mt-1"><span className="font-semibold text-gray-700">Tamil:</span> {q.question_ta}</p>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["a","b","c","d"].map(opt => (
                    <div key={opt}>
                      <p className="font-medium">Option {opt.toUpperCase()}:</p>
                      <p>English: {q[`option_${opt}_en`]}</p>
                      <p>Tamil: {q[`option_${opt}_ta`]}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-3 font-semibold flex justify-center text-green-600">
                  Correct Answer: English: {q.correct_answer} | Tamil: {q.correct_answer_ta}
                </p>

                {/* Buttons */}
                <div className="flex justify-center mt-3 gap-4">
                  <button onClick={() => navigate(`/edit-question/${q.id}`)}
                          className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-all">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(q.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Back to Top */}
      <button onClick={scrollToTop}
              className={`fixed bottom-8 right-8 px-4 py-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-500 ${showTopBtn ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        ↑ Top
      </button>
    </div>
  );
}
