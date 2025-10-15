import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

export default function ViewResults() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Pagination & Sorting
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [sortModel, setSortModel] = useState([{ field: "score", sort: "desc" }]);

  // ✅ Superadmin access check
  useEffect(() => {
    const checkAccess = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser) {
        alert("Please log in first.");
        navigate("/admin-login");
        return;
      }

      if (currentUser.user_metadata.role !== "superadmin") {
        alert("Access denied. Only Superadmins can view results.");
        navigate("/admin");
        return;
      }

      setUser(currentUser);
    };

    checkAccess();
  }, [navigate]);

  // ✅ Fetch results from Supabase with pagination & sorting
  const fetchResults = useCallback(
    async (currentPage = 0, currentPageSize = 25, currentSortModel = sortModel) => {
      setLoading(true);
      try {
        const from = currentPage * currentPageSize;
        const to = from + currentPageSize - 1;

        let query = supabase
          .from("results")
          .select("*", { count: "exact" })
          .range(from, to);

        // Apply sorting if any
        if (currentSortModel.length > 0) {
          const sort = currentSortModel[0];
          query = query.order(sort.field, { ascending: sort.sort === "asc" });
        } else {
          query = query.order("score", { ascending: false });
        }

        const { data, error, count } = await query;
        if (error) throw error;

        setRows(data || []);
        setRowCount(count || 0);
      } catch (err) {
        console.error("Error fetching results:", err);
      } finally {
        setLoading(false);
      }
    },
    [sortModel]
  );

  useEffect(() => {
    if (user) fetchResults(page, pageSize);
  }, [user, page, pageSize, fetchResults]);

  // ✅ Real-time updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("results_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => fetchResults(page, pageSize)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, fetchResults, page, pageSize]);

  // ✅ Compute duplicates
  const duplicatePhones = useMemo(() => {
    const counts = {};
    rows.forEach((r) => {
      if (r.phone) counts[r.phone] = (counts[r.phone] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((p) => counts[p] > 1));
  }, [rows]);

  // ✅ Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
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
  }, [rows, search, chapterFilter, languageFilter, placeFilter, showDuplicates, duplicatePhones]);

  // ✅ Dropdown options
  const chapterOptions = [...new Set(rows.map((r) => r.chapter).filter(Boolean))];
  const languageOptions = [...new Set(rows.map((r) => r.language).filter(Boolean))];
  const placeOptions = [...new Set(rows.map((r) => r.place).filter(Boolean))];

  // ✅ CSV Export respecting filters & sorting
  const handleExportCSV = async () => {
    try {
      setLoading(true);

      let query = supabase.from("results").select("*");

      if (sortModel.length > 0) {
        const sort = sortModel[0];
        query = query.order(sort.field, { ascending: sort.sort === "asc" });
      } else {
        query = query.order("score", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data?.length) return alert("No results to export.");

      // Apply current filters
      const exportRows = data.filter((r) => {
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

      if (!exportRows.length) return alert("No results to export after filtering.");

      const csv = [
        ["Name", "Phone", "Place", "Score", "Total", "Chapter", "Language", "Submitted At"],
        ...exportRows.map((p) => [
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
    } catch (err) {
      console.error("CSV Export Error:", err);
      alert("Failed to export CSV.");
    } finally {
      setLoading(false);
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
    { field: "created_at",headerName: "Submitted At",width: 180, },
  ];

  if (!user)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6" color="text.secondary">
          Checking admin access...
        </Typography>
      </Box>
    );

  if (loading && rows.length === 0)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
      <Box display="flex" justifyContent="space-evenly" alignItems="center" mb={4}>
        <Button variant="contained" color="secondary" onClick={() => navigate("/admin")}>
          Back to Admin Panel
        </Button>
        <Typography variant="h4" fontWeight="bold" color="black">
          Quiz Results
        </Typography>
        <Button variant="contained" color="success" onClick={handleExportCSV}>
          Download CSV
        </Button>
      </Box>
      <Box  mb={4}>
        <Typography variant="h5" fontWeight="bold" color="black">
          Participants Details ...!
        </Typography>
        </Box>

      {/* Filters */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
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
              <MenuItem key={ch} value={ch}>
                {ch}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Language</InputLabel>
          <Select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} label="Language">
            <MenuItem value="">All</MenuItem>
            {languageOptions.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {lang}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Place</InputLabel>
          <Select value={placeFilter} onChange={(e) => setPlaceFilter(e.target.value)} label="Place">
            <MenuItem value="">All</MenuItem>
            {placeOptions.map((pl) => (
              <MenuItem key={pl} value={pl}>
                {pl}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch checked={showDuplicates} onChange={(e) => setShowDuplicates(e.target.checked)} color="primary" />
          }
          label="Show Duplicates Only"
        />
      </Box>

      {/* DataGrid */}
      <DataGrid
        rows={filteredRows.map((r, idx) => ({ ...r, id: r.id || idx + 1 }))}
        columns={columns}
        rowCount={rowCount}
        paginationMode="server"
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={(model) => {
          setSortModel(model);
          fetchResults(page, pageSize, model);
        }}
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(model) => {
          setPage(model.page);
          setPageSize(model.pageSize);
          fetchResults(model.page, model.pageSize, sortModel);
        }}
        disableRowSelectionOnClick
        loading={loading}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </Container>
  );
}
