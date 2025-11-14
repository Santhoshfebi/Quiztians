import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  Paper,
  Card,
  CardContent,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { Toaster, toast } from "react-hot-toast";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QuizIcon from "@mui/icons-material/Quiz";
import PreviewIcon from "@mui/icons-material/Preview";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

export default function EditQuestions() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [langTab, setLangTab] = useState("en");

  // Load question & chapters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: qData, error } = await supabase
          .from("questions")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setQuestion(qData);

        const { data: chapterData } = await supabase
          .from("questions")
          .select("chapter");

        setChapters([...new Set(chapterData.map(q => q.chapter))]);

      } catch (err) {
        toast.error("Failed to load question");
        navigate("/admin/preview-questions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleChange = (field, value) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!question) return;

    const required = ["chapter", "question_en", "question_ta", "option_a_en", "option_b_en", "option_c_en", "option_d_en", "correct_answer"];
    for (let field of required) {
      if (!question[field]) {
        toast.error("Fill all mandatory fields");
        return;
      }
    }

    setSaving(true);
    try {
      const { id, ...updateData } = question;
      const { error } = await supabase.from("questions").update(updateData).eq("id", id);

      if (error) throw error;

      toast.success("Question updated successfully!");
      navigate("/admin/preview-questions");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box height="100vh" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Toaster position="top-right" />

      {/* Page Header */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          boxShadow: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(to right, #e3f2fd, #ffffff)",
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1} color="primary">
          <QuizIcon /> Edit Question
        </Typography>

        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/preview-questions")}
        >
          Back
        </Button>
      </Paper>

      {/* Split layout: Left (Form) | Right (Preview) */}
      <Stack direction={isMobile ? "column" : "row"} spacing={4}>
        
        {/* LEFT: Edit Form */}
        <Paper
          sx={{
            flex: 1,
            p: 4,
            borderRadius: 3,
            boxShadow: 4,
            background: "linear-gradient(to bottom, #e3f2fd, #ffffff)",
          }}
        >
          {/* Chapter Selector */}
          <TextField
            select
            label="Chapter"
            value={question.chapter}
            onChange={(e) => handleChange("chapter", e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          >
            {chapters.map(ch => (
              <MenuItem key={ch} value={ch}>
                {ch}
              </MenuItem>
            ))}
          </TextField>

          {/* Language Tabs */}
          <Tabs
            value={langTab}
            onChange={(e, tab) => setLangTab(tab)}
            indicatorColor="primary"
            textColor="primary"
            sx={{ mb: 3 }}
            variant="fullWidth"
          >
            <Tab label="English" value="en" />
            <Tab label="Tamil" value="ta" />
          </Tabs>

          {/* ENGLISH FORM */}
          {langTab === "en" && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Question (English)"
                  fullWidth
                  multiline
                  rows={2}
                  value={question.question_en}
                  onChange={(e) => handleChange("question_en", e.target.value)}
                />
              </Grid>

              {["a", "b", "c", "d"].map((opt) => (
                <Grid item xs={12} md={6} key={opt}>
                  <TextField
                    label={`Option ${opt.toUpperCase()} (EN)`}
                    fullWidth
                    value={question[`option_${opt}_en`]}
                    onChange={(e) => handleChange(`option_${opt}_en`, e.target.value)}
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <TextField
                  label="Correct Answer (EN)"
                  fullWidth
                  value={question.correct_answer}
                  onChange={(e) => handleChange("correct_answer", e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          {/* TAMIL FORM */}
          {langTab === "ta" && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Question (Tamil)"
                  fullWidth
                  multiline
                  rows={2}
                  value={question.question_ta}
                  onChange={(e) => handleChange("question_ta", e.target.value)}
                />
              </Grid>

              {["a", "b", "c", "d"].map((opt) => (
                <Grid item xs={12} md={6} key={opt}>
                  <TextField
                    label={`Option ${opt.toUpperCase()} (TA)`}
                    fullWidth
                    value={question[`option_${opt}_ta`]}
                    onChange={(e) => handleChange(`option_${opt}_ta`, e.target.value)}
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <TextField
                  label="Correct Answer (TA)"
                  fullWidth
                  value={question.correct_answer_ta}
                  onChange={(e) => handleChange("correct_answer_ta", e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          {/* Buttons */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={4}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              fullWidth={isMobile}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CancelIcon />}
              onClick={() => navigate("/admin/preview-questions")}
              fullWidth={isMobile}
            >
              Cancel
            </Button>
          </Stack>
        </Paper>

        {/* RIGHT: LIVE PREVIEW */}
        <Card
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 3,
            boxShadow: 4,
            background: "#f0f4ff",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
              color="primary"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <PreviewIcon /> Live Preview
            </Typography>

            <Typography mb={1}><strong>Chapter:</strong> {question.chapter}</Typography>

            {/* Preview EN + TA */}
            {["en", "ta"].map((lang) => (
              <Box key={lang} mb={3}>
                <Typography fontWeight="bold">
                  {lang === "en" ? "English" : "Tamil"}:
                </Typography>

                <Typography mb={1}>
                  {question[`question_${lang}`] || "—"}
                </Typography>

                {/* Options List */}
                <Stack spacing={1}>
                  {["a", "b", "c", "d"].map((opt) => {
                    const val = question[`option_${opt}_${lang}`];
                    const correct = question[`correct_answer${lang === "en" ? "" : "_ta"}`];

                    return (
                      <Box
                        key={opt}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid #ccc",
                          backgroundColor: val === correct ? "#c8e6c9" : "#fff",
                        }}
                      >
                        {opt.toUpperCase()}. {val || "—"}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
