import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function PreviewQuestions() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;

        setQuestions(data);
        setFilteredQuestions(data);

        // Extract unique chapters for filter
        const uniqueChapters = [...new Set(data.map((q) => q.chapter))];
        setChapters(uniqueChapters);
      } catch (err) {
        console.error("Error fetching questions:", err);
        alert("Failed to fetch questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Filter questions by selected chapter
  useEffect(() => {
    if (!selectedChapter) {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(questions.filter((q) => q.chapter === selectedChapter));
    }
  }, [selectedChapter, questions]);

  if (loading)
    return (
      <p className="text-center mt-20 text-lg font-semibold">
        Loading questions...
      </p>
    );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Preview Questions
        </h1>

        {/* Chapter Filter */}
        <div className="flex justify-center mb-4">
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Chapters</option>
            {chapters.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        {filteredQuestions.length === 0 ? (
          <p className="text-center text-gray-600">No questions found.</p>
        ) : (
          <ul className="space-y-6">
            {filteredQuestions.map((q, idx) => (
              <li
                key={q.id}
                className="border border-gray-200 p-4 rounded-lg shadow-sm bg-gray-50"
              >
                <p className="font-semibold mb-1">
                  <span className="text-blue-600">#{idx + 1}</span> - Chapter:{" "}
                  <span className="font-medium">{q.chapter}</span>
                </p>

                {/* Questions */}
                <p className="mt-2">
                  <span className="font-semibold text-gray-700">English:</span>{" "}
                  {q.question_en}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-gray-700">Tamil:</span>{" "}
                  {q.question_ta}
                </p>

                {/* Options */}
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="font-medium">Option A:</p>
                    <p>English: {q.option_a_en}</p>
                    <p>Tamil: {q.option_a_ta}</p>
                  </div>
                  <div>
                    <p className="font-medium">Option B:</p>
                    <p>English: {q.option_b_en}</p>
                    <p>Tamil: {q.option_b_ta}</p>
                  </div>
                  <div>
                    <p className="font-medium">Option C:</p>
                    <p>English: {q.option_c_en}</p>
                    <p>Tamil: {q.option_c_ta}</p>
                  </div>
                  <div>
                    <p className="font-medium">Option D:</p>
                    <p>English: {q.option_d_en}</p>
                    <p>Tamil: {q.option_d_ta}</p>
                  </div>
                </div>

                {/* Correct Answer */}
                <p className="mt-3 font-semibold flex justify-center text-green-600">
                  Correct Answer: English: {q.correct_answer} | Tamil: {q.correct_answer_ta}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate("/admin")}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          >
            Back to Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}
