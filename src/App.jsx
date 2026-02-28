import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./supabaseClient";

import Welcome from "./pages/Welcome";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import SetPassword from "./pages/SetPassword";
import ResetPassword from "./pages/ResetPassword";
import AddQuestions from "./pages/AddQuestions";
import QuizConfig from "./pages/QuizConfig";
import ViewResults from "./pages/ViewResults";
import QuestionPreviewPage from "./pages/QuestionPreviewPage";
import QuizPreview from "./pages/ChaptersPreview";
import EditQuestion from "./pages/EditQuestions";
import AlreadyAttempted from "./pages/AlreadyAttempted";
import Review from "./pages/Review";
import Leaderboard from "./pages/Leaderboard";
import StartQuizConfirm from "./pages/StartQuizConfirm";
import Scores from "./pages/Scores";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        return;
      }

      if (data.session) {
        const user = data.session.user;

        // Detect if this is first login (invite flow)
        if (window.location.hash.includes("type=invite")) {
          navigate("/set-password");
          return;
        }

        // Detect password recovery flow
        if (window.location.hash.includes("type=recovery")) {
          navigate("/reset-password");
          return;
        }
      }
    };

    handleAuthRedirect();
  }, [navigate]);

  return (
    <Routes>
      {/* user navigation path */}
      <Route path="/" element={<Welcome />} />
      <Route path="/already-attempted" element={<AlreadyAttempted />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/result" element={<Result />} />
      <Route path="/review" element={<Review />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/scores" element={<Scores />} />
      <Route path="/start-confirm" element={<StartQuizConfirm />} />

      {/* admin navigation path */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/admin/add-questions" element={<AddQuestions />} />
      <Route path="/admin/preview-questions" element={<QuestionPreviewPage />} />
      <Route path="/edit-question/:id" element={<EditQuestion />} />
      <Route path="/admin/preview-quiz" element={<QuizPreview />} />
      <Route path="/admin/quiz-config" element={<QuizConfig />} />
      <Route path="/admin/view-results" element={<ViewResults />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;