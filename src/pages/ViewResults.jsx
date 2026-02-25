import { useState, useEffect, useMemo } from "react";
import { Container, CircularProgress, Box } from "@mui/material";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

// COMPONENTS
import HeaderBar from "../components/HeaderBar";
import StatsCards from "../components/StatsCards";
import ChartsSection from "../components/ChartsSection";
import FiltersPanel from "../components/FiltersPanel";
import ResultsTable from "../components/ResultsTable";
import ResetDialog from "../components/ResetDialog";

export default function ViewResults() {
  const navigate = useNavigate();

  // data states
  const [user, setUser] = useState(null);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter states
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState([]);
  const [languageFilter, setLanguageFilter] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showHighestScore, setShowHighestScore] = useState(false);

  // reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedResetChapter, setSelectedResetChapter] = useState("");

  /* -------------------------
     AUTH CHECK
  ------------------------- */
  useEffect(() => {
    const checkAccess = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser) return navigate("/admin-login");
      if (currentUser.user_metadata.role !== "superadmin") {
        toast.error("Access Denied");
        return navigate("/admin");
      }

      setUser(currentUser);
    };

    checkAccess();
  }, []);

  /* -------------------------
     FETCH RESULTS
  ------------------------- */
  const fetchResults = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("results")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setAllRows(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchResults();
    const channel = supabase
      .channel("results_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        fetchResults,
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* -------------------------
     RESET HANDLER
  ------------------------- */
  const handleResetAttempt = async (phone = null, chapter = null) => {
    let target = "All Results";
    if (chapter && chapter !== "All") target = `Chapter "${chapter}"`;
    if (phone) target = `Phone "${phone}"`;

    const confirmReset = window.confirm(
      `Are you sure you want to reset results for ${target}?`,
    );
    if (!confirmReset) return;

    try {
      let query = supabase.from("results").delete();

      if (chapter && chapter !== "All") query = query.eq("chapter", chapter);
      if (phone) query = query.eq("phone", phone);

      const { error } = await query;
      if (error) throw error;

      toast.success(`Results reset for ${target}`);
      setResetDialogOpen(false);
      setSelectedResetChapter("");
      fetchResults();
    } catch (err) {
      toast.error(err.message || "Failed to reset results");
    }
  };

  /* -------------------------
     FILTERED DATA (with showHighestScore)
  ------------------------- */
  const filteredRows = useMemo(() => {
    let rows = [...allRows];

    if (search)
      rows = rows.filter((r) =>
        [r.name, r.phone, r.chapter, r.language, r.place].some((x) =>
          String(x || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
      );

    if (chapterFilter.length)
      rows = rows.filter((r) => chapterFilter.includes(r.chapter));

    if (languageFilter)
      rows = rows.filter((r) => r.language === languageFilter);

    if (placeFilter) rows = rows.filter((r) => r.place === placeFilter);

    // Show highest score per phone + chapter
    if (showHighestScore) {
      const best = {};
      rows.forEach((r) => {
        const key = `${r.phone}-${r.chapter}`;
        if (!best[key] || r.score > best[key].score) best[key] = r;
      });
      rows = Object.values(best);
    }

    return rows;
  }, [
    allRows,
    search,
    chapterFilter,
    languageFilter,
    placeFilter,
    showHighestScore,
  ]);

  /* -------------------------
     CSV EXPORT
  ------------------------- */
  const handleCSVExport = () => {
    if (!filteredRows.length) return;
    const headers = Object.keys(filteredRows[0]);
    const csvRows = [
      headers.join(","),
      ...filteredRows.map((row) =>
        headers.map((field) => `"${row[field] ?? ""}"`).join(","),
      ),
    ];
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -------------------------
     LOADING
  ------------------------- */
  if (!user)
    return (
      <Box textAlign="center" mt={10} sx={{
        py: 3,
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #312e81 50%, #020617 100%)",
      }}>
        Checking Access...
      </Box>
    );

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={10} sx={{
        py: 3,
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #312e81 50%, #020617 100%)",
      }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #312e81 50%, #020617 100%)",
      }}
    >
      <Toaster />

      <HeaderBar
        onBack={() => navigate("/admin")}
        onCSV={handleCSVExport}
        onOpenReset={() => setResetDialogOpen(true)}
        filteredRows={filteredRows} // optional for reference
      />

      <StatsCards allRows={allRows} />

      <ChartsSection allRows={allRows} />

      <FiltersPanel
        search={search}
        setSearch={setSearch}
        chapterFilter={chapterFilter}
        setChapterFilter={setChapterFilter}
        languageFilter={languageFilter}
        setLanguageFilter={setLanguageFilter}
        placeFilter={placeFilter}
        setPlaceFilter={setPlaceFilter}
        showDuplicates={showDuplicates}
        setShowDuplicates={setShowDuplicates}
        showHighestScore={showHighestScore}
        setShowHighestScore={setShowHighestScore}
        allRows={allRows}
      />

      <ResultsTable
        filteredRows={filteredRows}
        showDuplicates={showDuplicates}
        onResetIndividual={handleResetAttempt}
      />

      <ResetDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        selectedChapter={selectedResetChapter}
        setSelectedChapter={setSelectedResetChapter}
        onConfirm={(chapter) => handleResetAttempt(null, chapter)}
        chapters={[...new Set(allRows.map((r) => r.chapter).filter(Boolean))]}
      />
    </Container>
  );
}
