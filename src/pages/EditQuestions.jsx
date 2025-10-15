import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, CircularProgress, Container, TextField, Typography, MenuItem } from "@mui/material";
import { Toaster, toast } from "react-hot-toast";

export default function EditQuestions() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { data, error } = await supabase.from("questions").select("*").eq("id", id).single();
        if (error) throw error;
        setQuestion(data);

        const { data: chapterData, error: chError } = await supabase.from("questions").select("chapter");
        if (chError) throw chError;
        setChapters([...new Set(chapterData.map(q => q.chapter))]);
      } catch (err) {
        console.error(err);
        toast.error("❌ Failed to load question.");
        navigate("/admin/preview-questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, navigate]);

  const handleChange = (field, value) => setQuestion(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!question) return;
    if (!question.chapter || !question.question_en || !question.question_ta || !question.option_a_en || !question.option_b_en || !question.option_c_en || !question.option_d_en || !question.correct_answer) {
      return toast.error("Please fill all required fields.");
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("questions").update({
        chapter: question.chapter,
        question_en: question.question_en,
        question_ta: question.question_ta,
        option_a_en: question.option_a_en,
        option_a_ta: question.option_a_ta,
        option_b_en: question.option_b_en,
        option_b_ta: question.option_b_ta,
        option_c_en: question.option_c_en,
        option_c_ta: question.option_c_ta,
        option_d_en: question.option_d_en,
        option_d_ta: question.option_d_ta,
        correct_answer: question.correct_answer,
        correct_answer_ta: question.correct_answer_ta
      }).eq("id", question.id);
      if (error) throw error;

      toast.success("✅ Question updated successfully!");
      navigate("/admin/preview-questions");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update question.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Toaster position="top-right" />
      <Typography variant="h4" fontWeight="bold" color="primary" mb={4} textAlign="center">Edit Question</Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        <TextField select label="Chapter" value={question.chapter} onChange={(e) => handleChange("chapter", e.target.value)}>
          {chapters.map(ch => <MenuItem key={ch} value={ch}>{ch}</MenuItem>)}
        </TextField>

        <TextField label="Question (English)" value={question.question_en} onChange={(e) => handleChange("question_en", e.target.value)} multiline rows={2} />
        <TextField label="Question (Tamil)" value={question.question_ta} onChange={(e) => handleChange("question_ta", e.target.value)} multiline rows={2} />

        {["a","b","c","d"].map(opt => (
          <Box key={opt} display="flex" gap={2} flexDirection={{ xs: "column", sm: "row" }}>
            <TextField label={`Option ${opt.toUpperCase()} (English)`} value={question[`option_${opt}_en`]} onChange={(e) => handleChange(`option_${opt}_en`, e.target.value)} fullWidth />
            <TextField label={`Option ${opt.toUpperCase()} (Tamil)`} value={question[`option_${opt}_ta`]} onChange={(e) => handleChange(`option_${opt}_ta`, e.target.value)} fullWidth />
          </Box>
        ))}

        <TextField label="Correct Answer (English)" value={question.correct_answer} onChange={(e) => handleChange("correct_answer", e.target.value)} />
        <TextField label="Correct Answer (Tamil)" value={question.correct_answer_ta} onChange={(e) => handleChange("correct_answer_ta", e.target.value)} />

        <Box display="flex" gap={2} justifyContent="center" mt={2}>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate("/admin/preview-questions")}>Cancel</Button>
        </Box>
      </Box>
    </Container>
  );
}
