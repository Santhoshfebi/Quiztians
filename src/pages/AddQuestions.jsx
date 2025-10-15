import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

export default function AddQuestions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [chapter, setChapter] = useState("");
  const [question_en, setQuestionEn] = useState("");
  const [question_ta, setQuestionTa] = useState("");
  const [optionA_en, setOptionAEn] = useState("");
  const [optionB_en, setOptionBEn] = useState("");
  const [optionC_en, setOptionCEn] = useState("");
  const [optionD_en, setOptionDEn] = useState("");
  const [optionA_ta, setOptionATa] = useState("");
  const [optionB_ta, setOptionBTa] = useState("");
  const [optionC_ta, setOptionCTa] = useState("");
  const [optionD_ta, setOptionDTa] = useState("");
  const [correct_en, setCorrectEn] = useState("");
  const [correct_ta, setCorrectTa] = useState("");

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

      if (!sessionStorage.getItem("addQuestionWelcome")) {
        toast.success(`Welcome, ${currentUser.email}! You can add questions now.`);
        sessionStorage.setItem("addQuestionWelcome", "true");
      }
    };

    checkAdmin();
  }, [navigate]);

  const handleAddQuestion = async () => {
    if (!chapter || !question_en || !question_ta || !optionA_en || !optionB_en || !optionC_en || !optionD_en || !optionA_ta || !optionB_ta || !optionC_ta || !optionD_ta || !correct_en || !correct_ta) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("questions").insert([
        {
          chapter,
          question_en,
          question_ta,
          option_a_en: optionA_en,
          option_b_en: optionB_en,
          option_c_en: optionC_en,
          option_d_en: optionD_en,
          option_a_ta: optionA_ta,
          option_b_ta: optionB_ta,
          option_c_ta: optionC_ta,
          option_d_ta: optionD_ta,
          correct_answer: correct_en,
          correct_answer_ta: correct_ta,
          created_at: new Date(),
        },
      ]);

      if (error) throw error;
      toast.success("Question added successfully!");
      setChapter(""); setQuestionEn(""); setQuestionTa("");
      setOptionAEn(""); setOptionBEn(""); setOptionCEn(""); setOptionDEn("");
      setOptionATa(""); setOptionBTa(""); setOptionCTa(""); setOptionDTa("");
      setCorrectEn(""); setCorrectTa("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add question");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p className="text-center mt-20">Checking admin...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 p-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">Add New Question</h1>

        <input
          type="text"
          placeholder="Chapter"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div class="flex justify-evenly gap-10">
          <h2 className="text-xl items-center  font-semibold text-gray-600">English</h2>
          <h2 className="text-xl items-center  font-semibold text-gray-600">Tamil</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <textarea
            placeholder="Question (English)"
            value={question_en}
            onChange={(e) => setQuestionEn(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            placeholder="Question (Tamil)"
            value={question_ta}
            onChange={(e) => setQuestionTa(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div class="flex gap-4">

        {/* Options EN */}
        <div className="grid md:grid-cols-2 gap-4">
          <input type="text" placeholder="Option A (EN)" value={optionA_en} onChange={(e) => setOptionAEn(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <input type="text" placeholder="Option B (EN)" value={optionB_en} onChange={(e) => setOptionBEn(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <input type="text" placeholder="Option C (EN)" value={optionC_en} onChange={(e) => setOptionCEn(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <input type="text" placeholder="Option D (EN)" value={optionD_en} onChange={(e) => setOptionDEn(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>

        {/* Options TA */}
        <div className="grid md:grid-cols-2 gap-4">
          <input type="text" placeholder="Option A (TA)" value={optionA_ta} onChange={(e) => setOptionATa(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <input type="text" placeholder="Option B (TA)" value={optionB_ta} onChange={(e) => setOptionBTa(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <input type="text" placeholder="Option C (TA)" value={optionC_ta} onChange={(e) => setOptionCTa(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          <input type="text" placeholder="Option D (TA)" value={optionD_ta} onChange={(e) => setOptionDTa(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>

        </div>

        {/* Correct Answers */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Correct Answer (EN)"
            value={correct_en}
            onChange={(e) => setCorrectEn(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Correct Answer (TA)"
            value={correct_ta}
            onChange={(e) => setCorrectTa(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          onClick={handleAddQuestion}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? "Adding..." : "Add Question"}
        </button>

        <button
          onClick={() => navigate("/admin")}
          className="w-full py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all"
        >
          Back to Admin Panel
        </button>
      </div>
    </div>
  );
}
