import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser) {
        toast.error("You must login first");
        navigate("/admin-login");
        return;
      }

      const role = currentUser.user_metadata?.role;
      if (role !== "admin" && role !== "superadmin") {
        toast.error("Access denied: admin only");
        await supabase.auth.signOut();
        navigate("/admin-login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
      toast.success("Welcome to Admin Panel!");
    };
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/admin-login");
  };

  if (loading) return (
    <p className="text-center mt-20 text-lg font-semibold">Loading admin panel...</p>
  );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-blue-700">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="font-medium">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div
            onClick={() => navigate("/admin/preview-quiz")}
            className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">Preview Quiz</h2>
            <p className="text-center">View quiz for a selected chapter</p>
          </div>

          <div
            onClick={() => navigate("/admin/preview-questions")}
            className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">Preview Questions</h2>
            <p className="text-center">View all questions in the database</p>
          </div>

          <div
            onClick={() => navigate("/admin/add-questions")}
            className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">Add Questions</h2>
            <p className="text-center">Create new questions and assign chapters</p>
          </div>

          <div
            onClick={() => navigate("/admin/quiz-config")}
            className="cursor-pointer bg-green-500 hover:bg-green-600 text-white rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">Quiz Configuration</h2>
            <p className="text-center">Set quiz duration, start time, and active chapters</p>
          </div>

          <div
            onClick={() => navigate("/admin/view-results")}
            className="cursor-pointer bg-purple-500 hover:bg-purple-600 text-white rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-2">View / Download Results</h2>
            <p className="text-center">Preview participants' scores and export CSV</p>
          </div>
        </div>
      </div>
    </div>
  );
}
