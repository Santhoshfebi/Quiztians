import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

import {
  Container,
  Typography,
  TextField,
  Grid,
  Button,
  Stack,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Box,
  Autocomplete,
} from "@mui/material";

import AdminBottomDock from "../components/AdminBottomDock";

export default function AddQuestions() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [chapter, setChapter] = useState("");
  const [allChapters, setAllChapters] = useState([]);

  const [tabIndex, setTabIndex] = useState(0);

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

  // admin check
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
    };

    checkAdmin();
  }, [navigate]);

  // fetch chapters
  useEffect(() => {
    const fetchChapters = async () => {
      const { data } = await supabase
        .from("questions")
        .select("chapter")
        .not("chapter", "is", null);

      if (data) {
        const unique = [...new Set(data.map((q) => q.chapter))];
        setAllChapters(unique);
      }
    };

    fetchChapters();
  }, []);

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
      toast.error("Please complete all fields");
      return;
    }

    setLoading(true);

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

    if (error) {
      toast.error("Failed to add question");
      setLoading(false);
      return;
    }

    toast.success("Question added!");

    setQuestionEn("");
    setQuestionTa("");

    setOptionAEn("");
    setOptionBEn("");
    setOptionCEn("");
    setOptionDEn("");

    setOptionATa("");
    setOptionBTa("");
    setOptionCTa("");
    setOptionDTa("");

    setCorrectEn("");
    setCorrectTa("");

    setLoading(false);
  };

  if (!user)
    return (
      <Container sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
        <Typography mt={2}>Checking admin...</Typography>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ py: 6, pb: 14 }}>
      <Toaster position="top-right" />

      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign="center"
        color="primary"
        mb={4}
      >
        Add Question
      </Typography>

      <Grid container spacing={4}>
        {/* FORM */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 5 }}>
            <Stack spacing={3}>
              {/* Chapter */}
              <Autocomplete
                freeSolo
                options={allChapters}
                value={chapter}
                onChange={(e, v) => setChapter(v || "")}
                onInputChange={(e, v) => setChapter(v)}
                renderInput={(params) => (
                  <TextField {...params} label="Chapter" />
                )}
              />

              {/* Language Toggle */}
              <ToggleButtonGroup
                value={tabIndex}
                exclusive
                onChange={(e, v) => v !== null && setTabIndex(v)}
                sx={{ alignSelf: "center" }}
              >
                <ToggleButton value={0}>English</ToggleButton>
                <ToggleButton value={1}>Tamil</ToggleButton>
              </ToggleButtonGroup>

              {/* Question */}
              {tabIndex === 0 ? (
                <TextField
                  label="Question (English)"
                  multiline
                  rows={3}
                  value={question_en}
                  onChange={(e) => setQuestionEn(e.target.value)}
                />
              ) : (
                <TextField
                  label="Question (Tamil)"
                  multiline
                  rows={3}
                  value={question_ta}
                  onChange={(e) => setQuestionTa(e.target.value)}
                />
              )}

              {/* Options */}
              <Grid container spacing={2}>
                {(tabIndex === 0 ? optionsEN : optionsTA).map((opt, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: "1px solid #ddd",
                      }}
                    >
                      <Typography fontWeight="bold">
                        Option {opt.label}
                      </Typography>

                      <TextField
                        value={opt.value}
                        onChange={(e) =>
                          (tabIndex === 0
                            ? [
                                setOptionAEn,
                                setOptionBEn,
                                setOptionCEn,
                                setOptionDEn,
                              ]
                            : [
                                setOptionATa,
                                setOptionBTa,
                                setOptionCTa,
                                setOptionDTa,
                              ])[idx](e.target.value)
                        }
                        fullWidth
                        placeholder={`Enter option ${opt.label}`}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Correct answer */}
              <Typography fontWeight="bold" textAlign="center">
                Select Correct Answer
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                {["A", "B", "C", "D"].map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    clickable
                    color={
                      (tabIndex === 0 ? correct_en : correct_ta) === opt
                        ? "success"
                        : "default"
                    }
                    onClick={() =>
                      tabIndex === 0 ? setCorrectEn(opt) : setCorrectTa(opt)
                    }
                    sx={{ fontWeight: "bold", px: 2 }}
                  />
                ))}
              </Stack>

              {/* Add button */}
              <Button
                variant="contained"
                size="large"
                disabled={!allFieldsFilled || loading}
                onClick={handleAddQuestion}
                sx={{
                  py: 1.8,
                  fontWeight: "bold",
                  borderRadius: 3,
                }}
              >
                {loading ? "Adding..." : "Add Question"}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* PREVIEW */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: 6,
              position: "sticky",
              top: 90,
            }}
          >
            <CardContent>
              <Typography fontWeight="bold" mb={2}>
                Live Preview
              </Typography>

              <Typography variant="subtitle2">Chapter</Typography>
              <Typography mb={3}>{chapter || "—"}</Typography>

              <Grid container spacing={3}>
                {/* English Preview */}
                <Grid item xs={12} md={6}>
                  <Typography fontWeight="bold" mb={1}>
                    English
                  </Typography>

                  <Typography mb={2}>{question_en || "—"}</Typography>

                  <Stack spacing={1}>
                    {optionsEN
                      .filter((o) => o.value)
                      .map((opt, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            border: "1px solid #ccc",
                            background:
                              opt.label === correct_en ? "#c8e6c9" : "#ffffff",
                          }}
                        >
                          {opt.label}. {opt.value}
                        </Box>
                      ))}
                  </Stack>
                </Grid>

                {/* Tamil Preview */}
                <Grid item xs={12} md={6}>
                  <Typography fontWeight="bold" mb={1}>
                    Tamil
                  </Typography>

                  <Typography mb={2}>{question_ta || "—"}</Typography>

                  <Stack spacing={1}>
                    {optionsTA
                      .filter((o) => o.value)
                      .map((opt, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            border: "1px solid #ccc",
                            background:
                              opt.label === correct_ta ? "#c8e6c9" : "#ffffff",
                          }}
                        >
                          {opt.label}. {opt.value}
                        </Box>
                      ))}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <AdminBottomDock role={user?.user_metadata?.role} />
    </Container>
  );
}
