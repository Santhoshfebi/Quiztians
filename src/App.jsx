import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import AddQuestions from "./pages/AddQuestions";
import QuizConfig from "./pages/QuizConfig";
import ViewResults from "./pages/ViewResults";
import QuestionPreviewPage from "./pages/QuestionPreviewPage";
import QuizPreview from "./pages/ChaptersPreview";
import EditQuestion from "./pages/EditQuestions";
import AlreadyAttempted from "./pages/AlreadyAttempted";
import Review from "./pages/Review";

function App() {
  return (
    <Router>
      <Routes>
        // user navigation path
      
        <Route path="/" element={<Welcome />} />
        <Route path="/already-attempted" element={<AlreadyAttempted />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result" element={<Result />} />
        <Route path="/review" element={<Review />} />


        // admin navigation path
        
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/add-questions" element={<AddQuestions />} />  
        <Route path="/admin/preview-questions" element={<QuestionPreviewPage />} />
        <Route path="/edit-question/:id" element={<EditQuestion />} />
        <Route path="/admin/preview-quiz" element={<QuizPreview />} />
        <Route path="/admin/quiz-config" element={<QuizConfig />} /> 
        <Route path="/admin/view-results" element={<ViewResults />} /> 
      </Routes>
    </Router>
  );
}

export default App;
