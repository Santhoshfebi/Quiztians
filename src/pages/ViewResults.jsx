import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Toaster, toast } from "react-hot-toast";

export default function ViewResults() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [showDuplicates, setShowDuplicates] = useState(false);

  const [pageSize, setPageSize] = useState(25);

  // ✅ Superadmin access check
  useEffect(() => {
    const checkAccess = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser) {
        toast.error("Please log in first.");
        navigate("/admin-login");
        return;
      }

      if (currentUser.user_metadata.role !== "superadmin") {
        toast.error("Access denied. Only Superadmins can view results.");
        navigate("/admin");
        return;
      }

      setUser(currentUser);

      if (!sessionStorage.getItem("viewResultsWelcome")) {
        toast.success("Welcome to View Results!");
        sessionStorage.setItem("viewResultsWelcome", "true");
      }
    };

    checkAccess();
  }, [navigate]);

  // Fetch all results once
  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("results").select("*");
      if (error) throw error;
      setAllRows(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();

    // Live updates
    const channel = supabase
      .channel("results_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => fetchResults()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Compute duplicates
  const duplicatePhones = useMemo(() => {
    const counts = {};
    allRows.forEach((r) => {
      if (r.phone) counts[r.phone] = (counts[r.phone] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((p) => counts[p] > 1));
  }, [allRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (!r) return false;
      const term = search.toLowerCase();
      const matchSearch =
        r.name?.toLowerCase().includes(term) ||
        r.phone?.toString().includes(term) ||
        r.place?.toLowerCase().includes(term) ||
        r.chapter?.toLowerCase().includes(term) ||
        r.language?.toLowerCase().includes(term);

      const matchChapter = !chapterFilter || r.chapter === chapterFilter;
      const matchLang = !languageFilter || r.language === languageFilter;
      const matchPlace = !placeFilter || r.place === placeFilter;
      const matchDuplicate = !showDuplicates || duplicatePhones.has(r.phone);

      return matchSearch && matchChapter && matchLang && matchPlace && matchDuplicate;
    });
  }, [allRows, search, chapterFilter, languageFilter, placeFilter, showDuplicates, duplicatePhones]);

  // Dropdown options
  const chapterOptions = [...new Set(allRows.map((r) => r.chapter).filter(Boolean))];
  const languageOptions = [...new Set(allRows.map((r) => r.language).filter(Boolean))];
  const placeOptions = [...new Set(allRows.map((r) => r.place).filter(Boolean))];

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredRows.length) return toast.error("No results to export.");

    const csv = [
      ["Name", "Phone", "Place", "Score", "Total", "Chapter", "Language", "Submitted At"],
      ...filteredRows.map((p) => [
        p.name || "",
        p.phone || "",
        p.place || "",
        p.score ?? "",
        p.total ?? "",
        p.chapter || "",
        p.language || "",
        new Date(p.created_at).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "quiz_results.csv");
    link.click();
    toast.success("CSV exported successfully!");
  };

  // Reset Attempt
  const handleResetAttempt = async (phone = null) => {
    const confirmText = phone
      ? `Are you sure you want to reset attempts for phone: ${phone}?`
      : `Are you sure you want to reset all attempts?`;
    if (!window.confirm(confirmText)) return;

    try {
      const query = supabase.from("results");
      const { error } = phone
        ? await query.delete().eq("phone", phone)
        : await query.delete();
      if (error) throw error;

      toast.success("✅ Attempt(s) reset successfully!");
      fetchResults(); // Refresh live
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to reset attempt(s).");
    }
  };

  const columns = [
    { field: "id", headerName: "#", width: 70 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "phone", headerName: "Phone", width: 140 },
    { field: "place", headerName: "Place", flex: 1 },
    { field: "score", headerName: "Score", width: 100 },
    { field: "total", headerName: "Total", width: 100 },
    { field: "chapter", headerName: "Chapter", flex: 1 },
    { field: "language", headerName: "Language", width: 110 },
    { field: "created_at", headerName: "Submitted At", width: 180 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Button
          color="error"
          variant="contained"
          size="small"
          onClick={() => handleResetAttempt(params.row.phone)}
        >
          Reset Attempt
        </Button>
      ),
    },
  ];

  if (!user)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6" color="text.secondary">
          Checking admin access...
        </Typography>
      </Box>
    );

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
      <Toaster position="top-right" />
      <Box display="flex" justifyContent="space-evenly" alignItems="center" mb={6}>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="blue"
          sx={{ cursor: "pointer" }}
          onClick={() => window.location.reload()}
        >
          Quiz Results
        </Typography>

        <Button variant="contained" color="secondary" onClick={() => navigate("/admin")}>
          Back to Admin Panel
        </Button>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Typography variant="h5" fontWeight="bold">
          Participants Details
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          Total Participants: {filteredRows.length}
        </Typography>
        <Button variant="contained" color="success" onClick={handleExportCSV}>
          Download CSV
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => handleResetAttempt()}
        >
          Reset All Attempts
        </Button>
      </Box>

      {/* Filters */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={4}
      >
        <TextField
          label="Search by name, phone, place, or chapter"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          variant="outlined"
          sx={{ width: "100%", maxWidth: 400 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Chapter</InputLabel>
          <Select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)} label="Chapter">
            <MenuItem value="">All</MenuItem>
            {chapterOptions.map((ch) => (
              <MenuItem key={ch} value={ch}>{ch}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Language</InputLabel>
          <Select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} label="Language">
            <MenuItem value="">All</MenuItem>
            {languageOptions.map((lang) => (
              <MenuItem key={lang} value={lang}>{lang}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Place</InputLabel>
          <Select value={placeFilter} onChange={(e) => setPlaceFilter(e.target.value)} label="Place">
            <MenuItem value="">All</MenuItem>
            {placeOptions.map((pl) => (
              <MenuItem key={pl} value={pl}>{pl}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={showDuplicates} onChange={(e) => setShowDuplicates(e.target.checked)} color="primary" />}
          label="Show Duplicates Only"
        />
      </Box>

      {/* DataGrid */}
      <DataGrid
        rows={filteredRows.map((r, idx) => ({ ...r, id: r.id || idx + 1 }))}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        autoHeight
        disableRowSelectionOnClick
        pagination
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </Container>
  );
}
