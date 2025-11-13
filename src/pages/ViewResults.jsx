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
  useMediaQuery,
  Card,
  CardContent,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack,
  RestartAlt,
  Download,
  Search,
  FilterList,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Group,
  School,
  EmojiEvents,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { Toaster, toast } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function ViewResults() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:900px)");
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

  // Reset by Chapter dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedResetChapter, setSelectedResetChapter] = useState("");

  // --- Helpers: robust parse + exact format "Nov 13, 2025 7:30 PM" ---
  const parseDate = (value) => {
    if (!value && value !== 0) return null;
    try {
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
      }
      if (typeof value === "number") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof value === "object") {
        const str = value.toString?.() ?? JSON.stringify(value);
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof value === "string") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const formatDateParts = (date) => {
    if (!date) return "—";
    const dt = parseDate(date);
    if (!dt) return "—";

    const parts = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(dt);

    const map = {};
    parts.forEach((p) => {
      map[p.type] = (map[p.type] ?? "") + p.value;
    });

    const month = map.month ?? "";
    const day = map.day ?? "";
    const year = map.year ?? "";
    const hour = map.hour ?? "";
    const minute = map.minute ?? "";
    const dayPeriod = map.dayPeriod ?? "";

    if (!month || !day || !year) return "—";
    return `${month} ${day}, ${year} ${hour}:${minute} ${dayPeriod}`.trim();
  };

  // --- Auth & access check ---
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
        toast.success("Welcome to the Results Dashboard!");
        sessionStorage.setItem("viewResultsWelcome", "true");
      }
    };
    checkAccess();
  }, [navigate]);

  // --- Fetching data ---
  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .order("created_at", { ascending: false });

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

    const channel = supabase
      .channel("results_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, fetchResults)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // --- Derived data & filters ---
  const duplicatePhones = useMemo(() => {
    const counts = {};
    allRows.forEach((r) => {
      if (r?.phone) counts[r.phone] = (counts[r.phone] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((p) => counts[p] > 1));
  }, [allRows]);

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

  const chapterOptions = [...new Set(allRows.map((r) => r.chapter).filter(Boolean))];
  const languageOptions = [...new Set(allRows.map((r) => r.language).filter(Boolean))];
  const placeOptions = [...new Set(allRows.map((r) => r.place).filter(Boolean))];

  const chapterStats = useMemo(() => {
    const stats = {};
    allRows.forEach((r) => {
      if (!r?.chapter) return;
      if (!stats[r.chapter]) stats[r.chapter] = { chapter: r.chapter, participants: 0, totalScore: 0 };
      stats[r.chapter].participants++;
      stats[r.chapter].totalScore += r.score || 0;
    });
    return Object.values(stats).map((s) => ({
      ...s,
      avgScore: s.participants ? (s.totalScore / s.participants).toFixed(2) : 0,
    }));
  }, [allRows]);

  const COLORS = ["#1976d2", "#9c27b0", "#ff9800", "#4caf50", "#f44336", "#00bcd4", "#8bc34a"];

  // --- CSV export ---
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
        parseDate(p.created_at) ? formatDateParts(p.created_at) : "",
      ]),
    ]
      .map((row) =>
        row.map((cell) => {
          if (typeof cell === "string" && cell.includes(",")) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "quiz_results.csv");
    link.click();
    toast.success("CSV exported successfully!");
  };

  // --- Reset Attempts ---
  const handleResetAttempt = async (phone = null, chapter = null, all = false) => {
    let confirmText = "Are you sure you want to reset all attempts?";
    if (phone && chapter) confirmText = `Reset attempts for ${phone} in ${chapter}?`;
    else if (phone) confirmText = `Reset all attempts for ${phone}?`;
    else if (chapter) confirmText = `Reset all attempts in ${chapter}?`;
    else if (all) confirmText = "⚠️ This will delete ALL results. Continue?";
    if (!window.confirm(confirmText)) return;

    try {
      let query = supabase.from("results");
      if (phone && chapter) query = query.delete().eq("phone", phone).eq("chapter", chapter);
      else if (phone) query = query.delete().eq("phone", phone);
      else if (chapter) query = query.delete().eq("chapter", chapter);
      else if (all) query = query.delete();
      else return;

      const { error } = await query;
      if (error) throw error;
      toast.success("✅ Attempt(s) reset successfully!");
      fetchResults();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to reset attempt(s).");
    }
  };

  const columns = [
    { field: "id", headerName: "#", width: 80 },
    { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
    { field: "phone", headerName: "Phone", width: 140 },
    { field: "place", headerName: "Place", flex: 1, minWidth: 160 },
    { field: "score", headerName: "Score", width: 100 },
    { field: "total", headerName: "Total", width: 100 },
    { field: "chapter", headerName: "Chapter", flex: 1, minWidth: 140 },
    { field: "language", headerName: "Language", width: 120 },
    { field: "created_at", headerName: "Submitted At", width: 160 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          color="error"
          variant="outlined"
          size="small"
          startIcon={<RestartAlt />}
          onClick={() => handleResetAttempt(params.row.phone, params.row.chapter)}
        >
          Reset
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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Toaster position="top-right" />

      {/* Header */}
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "stretch" : "center"}
        mb={4}
        gap={isMobile ? 2 : 0}
      >
        <Typography variant="h4" fontWeight={700} color="primary" display="flex" alignItems="center" gap={1}>
          📊 Results Dashboard
        </Typography>
        <Stack direction={isMobile ? "column" : "row"} spacing={2}>
          <Button variant="outlined" color="secondary" startIcon={<ArrowBack />} onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <Button variant="contained" color="warning" startIcon={<RestartAlt />} onClick={() => setResetDialogOpen(true)}>
            Reset by Chapter
          </Button>
          <Button variant="contained" startIcon={<Download />} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </Stack>
      </Box>

      {/* Reset by Chapter Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Results by Chapter</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Chapter</InputLabel>
            <Select
              value={selectedResetChapter}
              label="Select Chapter"
              onChange={(e) => setSelectedResetChapter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {chapterOptions.map((ch) => (
                <MenuItem key={ch} value={ch}>
                  {ch}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!selectedResetChapter}
            startIcon={<RestartAlt />}
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to reset all results for chapter "${selectedResetChapter}"?`
                )
              ) {
                handleResetAttempt(null, selectedResetChapter);
                setResetDialogOpen(false);
                setSelectedResetChapter("");
              }
            }}
          >
            Confirm Reset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Cards */}
      <Box display="grid" gridTemplateColumns={isMobile ? "1fr" : "repeat(3, 1fr)"} gap={3} mb={5}>
        {[
          { label: "Total Participants", value: allRows.length, icon: <Group color="primary" /> },
          { label: "Total Chapters", value: chapterOptions.length, icon: <School color="primary" /> },
          {
            label: "Average Score",
            value: (
              allRows.reduce((sum, r) => sum + (r?.score || 0), 0) / (allRows.length || 1)
            ).toFixed(2),
            icon: <EmojiEvents color="primary" />,
          },
        ].map((item, i) => (
          <Card
            key={i}
            elevation={3}
            sx={{
              borderRadius: 3,
              p: 2,
              transition: "0.3s",
              "&:hover": { boxShadow: 6, transform: "translateY(-3px)" },
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                {item.icon}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {item.label}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {item.value}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Charts */}
      <Box display="grid" gridTemplateColumns={isMobile ? "1fr" : "1fr 1fr"} gap={3} mb={5}>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
            <BarChartIcon color="primary" /> Average Score per Chapter
          </Typography>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <BarChart data={chapterStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="chapter" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#1976d2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
            <PieChartIcon color="primary" /> Participants by Chapter
          </Typography>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <PieChart>
              <Pie data={chapterStats} dataKey="participants" nameKey="chapter" outerRadius={isMobile ? 80 : 120} label>
                {chapterStats.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
          <FilterList color="primary" /> Filters
        </Typography>
        <Box display="flex" flexDirection={isMobile ? "column" : "row"} flexWrap="wrap" gap={2}>
          <TextField
            label="Search"
            placeholder="Search name, phone, place, chapter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: "action.active" }} />,
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Chapter</InputLabel>
            <Select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}>
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
            <Select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
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
            <Select value={placeFilter} onChange={(e) => setPlaceFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {placeOptions.map((pl) => (
                <MenuItem key={pl} value={pl}>
                  {pl}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={showDuplicates} onChange={(e) => setShowDuplicates(e.target.checked)} />}
            label="Show Duplicates"
          />
        </Box>
      </Paper>

      {/* Data Table */}
      <Paper sx={{ borderRadius: 3, p: 2 }}>
        <DataGrid
          rows={filteredRows.map((r, i) => ({ ...r, id: r.id ?? i + 1 }))}
          columns={columns}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => setPageSize(newSize)}
          rowsPerPageOptions={[10, 25, 50, 100]}
          pagination
          autoHeight
          disableSelectionOnClick
          sx={{
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f5f5f5",
              fontWeight: 600,
            },
            "& .MuiDataGrid-row:hover": {
              bgcolor: "action.hover",
            },
          }}
        />
      </Paper>
    </Container>
  );
}
