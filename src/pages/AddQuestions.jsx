import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  Stack,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  useMediaQuery,
} from "@mui/material";

export default function AddQuestions() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:900px)");

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
  const [tabIndex, setTabIndex] = useState(0);

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
        toast.success(`Welcome, ${currentUser.email}!`);
        sessionStorage.setItem("addQuestionWelcome", "true");
      }
    };
    checkAdmin();
  }, [navigate]);

  const allFieldsFilled =
    chapter &&
    question_en &&
    question_ta &&
    optionA_en &&
    optionB_en &&
    optionC_en &&
    optionD_en &&
    optionA_ta &&
    optionB_ta &&
    optionC_ta &&
    optionD_ta &&
    correct_en &&
    correct_ta;

  const handleAddQuestion = async () => {
    if (!allFieldsFilled) {
      toast.error("Please fill all fields and select correct answers");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("questions").insert([{
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
      }]);
      if (error) throw error;
      toast.success("Question added successfully!");
      // Reset all fields
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

  if (!user)
    return (
      <Container sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
        <Typography mt={2}>Checking admin access...</Typography>
      </Container>
    );

  const optionsEN = [
    { label: "A", value: optionA_en },
    { label: "B", value: optionB_en },
    { label: "C", value: optionC_en },
    { label: "D", value: optionD_en },
  ];

  const optionsTA = [
    { label: "A", value: optionA_ta },
    { label: "B", value: optionB_ta },
    { label: "C", value: optionC_ta },
    { label: "D", value: optionD_ta },
  ];

  return (
    <Container maxWidth="lg" sx={{ my: 6 }}>
      <Toaster position="top-right" />

      <Stack direction={isMobile ? "column" : "row"} spacing={4} alignItems="stretch">
        {/* Form Panel */}
        <Paper sx={{ p: 5, borderRadius: 3, boxShadow: 5, flex: 1, background: "linear-gradient(to bottom, #e3f2fd, #ffffff)" }}>
          <Typography variant="h4" fontWeight="bold" textAlign="center" color="primary" gutterBottom>
            Add New Question
          </Typography>

          <Stack spacing={4}>
            {/* Chapter */}
            <TextField
              label="Chapter"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              fullWidth
            />

            {/* Question */}
            <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} textColor="primary" indicatorColor="primary">
              <Tab label="English" />
              <Tab label="Tamil" />
            </Tabs>
            {tabIndex === 0 ? (
              <TextField
                label="Question (English)"
                value={question_en}
                onChange={(e) => setQuestionEn(e.target.value)}
                fullWidth multiline rows={3} sx={{ mt: 2 }}
              />
            ) : (
              <TextField
                label="Question (Tamil)"
                value={question_ta}
                onChange={(e) => setQuestionTa(e.target.value)}
                fullWidth multiline rows={3} sx={{ mt: 2 }}
              />
            )}

            {/* Options Grid */}
            <Grid container spacing={2}>
              {tabIndex === 0
                ? optionsEN.map((opt, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <TextField
                        label={`Option ${opt.label}`}
                        value={opt.value}
                        onChange={(e) => [setOptionAEn, setOptionBEn, setOptionCEn, setOptionDEn][idx](e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  ))
                : optionsTA.map((opt, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <TextField
                        label={`Option ${opt.label}`}
                        value={opt.value}
                        onChange={(e) => [setOptionATa, setOptionBTa, setOptionCTa, setOptionDTa][idx](e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  ))}
            </Grid>

            {/* Correct Answer */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Correct Answer (English)"
                  value={correct_en}
                  onChange={(e) => setCorrectEn(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Correct Answer (Tamil)"
                  value={correct_ta}
                  onChange={(e) => setCorrectTa(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddQuestion}
                disabled={loading || !allFieldsFilled}
                fullWidth
                sx={{ fontWeight: "bold", py: 1.5, textTransform: "none" }}
              >
                {loading ? "Adding..." : "Add Question"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/admin")}
                fullWidth
                sx={{ fontWeight: "bold", py: 1.5, textTransform: "none" }}
              >
                Back to Admin Panel
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Preview Panel */}
        <Card sx={{ flex: 1, p: 3, borderRadius: 3, boxShadow: 5, background: "#f0f4ff" }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom color="primary" textAlign="center">
              Live Preview
            </Typography>

            <Box mb={2}>
              <Typography fontWeight="bold">Chapter:</Typography>
              <Typography>{chapter || "—"}</Typography>
            </Box>

            {[{ label: "Question (EN)", value: question_en, opts: optionsEN, correct: correct_en },
              { label: "Question (TA)", value: question_ta, opts: optionsTA, correct: correct_ta }].map((q, idx) => (
              <Box key={idx} mb={3}>
                <Typography fontWeight="bold">{q.label}</Typography>
                <Typography mb={1}>{q.value || "—"}</Typography>
                <Stack spacing={1}>
                  {q.opts.filter(o => o.value).map((opt, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: opt.value === q.correct ? "#c8e6c9" : "#ffffff",
                        border: "1px solid #ccc",
                      }}
                    >
                      {opt.label}. {opt.value}
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
