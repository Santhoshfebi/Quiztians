import {
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
  Checkbox,
  Box,
  useMediaQuery,
  useTheme,
  Collapse,
  Typography,
  Fade,
} from "@mui/material";
import { Search, ClearAll, ExpandMore } from "@mui/icons-material";
import { useState } from "react";

export default function FiltersPanel({
  search,
  setSearch,
  chapterFilter,
  setChapterFilter,
  languageFilter,
  setLanguageFilter,
  placeFilter,
  setPlaceFilter,
  showDuplicates,
  setShowDuplicates,
  showHighestScore,
  setShowHighestScore,
  allRows,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [advancedOpen, setAdvancedOpen] = useState(!isMobile);

  const chapterOptions = [...new Set(allRows.map((r) => r.chapter).filter(Boolean))];
  const languageOptions = [...new Set(allRows.map((r) => r.language).filter(Boolean))];
  const placeOptions = [...new Set(allRows.map((r) => r.place).filter(Boolean))];

  const clearFilters = () => {
    setSearch("");
    setChapterFilter([]);
    setLanguageFilter("");
    setPlaceFilter("");
    setShowDuplicates(false);
    setShowHighestScore(false);
  };

  const filterChips = [
    ...chapterFilter.map((c) => ({ label: c, color: "primary", onDelete: () => setChapterFilter(chapterFilter.filter((x) => x !== c)) })),
    languageFilter && { label: languageFilter, color: "success", onDelete: () => setLanguageFilter("") },
    placeFilter && { label: placeFilter, color: "warning", onDelete: () => setPlaceFilter("") },
    showDuplicates && { label: "Duplicates", color: "secondary", onDelete: () => setShowDuplicates(false) },
    showHighestScore && { label: "Highest Score", color: "secondary", onDelete: () => setShowHighestScore(false) },
  ].filter(Boolean);

  const ChapterDropdown = () => (
    <FormControl size="small" sx={{ minWidth: 200, flex: isMobile ? "1 1 100%" : 1 }}>
      <InputLabel>Chapter</InputLabel>
      <Select
        multiple
        value={chapterFilter}
        onChange={(e) => setChapterFilter(e.target.value)}
        label="Chapter"
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} size="small" color="primary" sx={{ borderRadius: 8 }} />
            ))}
          </Box>
        )}
        sx={{
          "& .MuiSelect-select": {
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
          },
        }}
      >
        {chapterOptions.map((chapter) => (
          <MenuItem key={chapter} value={chapter} sx={{ "&:hover": { backgroundColor: theme.palette.action.hover } }}>
            <Checkbox checked={chapterFilter.includes(chapter)} color="primary" />
            <Typography variant="body2" sx={{ ml: 1 }}>{chapter}</Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Paper
      sx={{
        p: isMobile ? 2 : 3,
        mb: 4,
        borderRadius: 4,
        boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Active Filters */}
      {filterChips.length > 0 && (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2.5} alignItems="center">
          {filterChips.map((chip) => (
            <Fade key={chip.label} in timeout={200}>
              <Chip
                label={chip.label}
                color={chip.color}
                size="small"
                onDelete={chip.onDelete}
                sx={{
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "scale(1.05)", boxShadow: theme.shadows[3] },
                }}
              />
            </Fade>
          ))}
          <Button variant="text" size="small" onClick={clearFilters} startIcon={<ClearAll />} sx={{ ml: 1 }}>
            Clear All
          </Button>
        </Stack>
      )}

      {/* Search + Mobile toggle */}
      <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 2.5 : 2} alignItems={isMobile ? "stretch" : "center"}>
        <TextField
          placeholder="Search name, phone, chapter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} /> }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              "&:hover fieldset": { borderColor: theme.palette.primary.light },
              "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main, boxShadow: `0 0 5px ${theme.palette.primary.light}` },
            },
          }}
        />

        {isMobile && (
          <IconButton onClick={() => setAdvancedOpen(!advancedOpen)}>
            <ExpandMore sx={{ transition: "transform 0.3s", transform: advancedOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
          </IconButton>
        )}
      </Stack>

      {/* Advanced Filters */}
      <Collapse in={advancedOpen} timeout={300}>
        <Stack direction="column" spacing={2.5} mt={2}>
          <ChapterDropdown />
          <Dropdown label="Language" value={languageFilter} onChange={setLanguageFilter} options={languageOptions} allOption fullWidth />
          <Dropdown label="Place" value={placeFilter} onChange={setPlaceFilter} options={placeOptions} allOption fullWidth />
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControlLabel
              control={<Switch checked={showDuplicates} onChange={(e) => setShowDuplicates(e.target.checked)} color="secondary" />}
              label="Show Duplicates"
            />
            <FormControlLabel
              control={<Switch checked={showHighestScore} onChange={(e) => setShowHighestScore(e.target.checked)} color="secondary" />}
              label="Highest Score Only"
            />
          </Stack>
        </Stack>
      </Collapse>
    </Paper>
  );
}

function Dropdown({ label, value, onChange, options, allOption, fullWidth, color = "default" }) {
  return (
    <FormControl size="small" sx={{ minWidth: fullWidth ? "100%" : 180, flex: fullWidth ? "1 1 100%" : "0 1 180px" }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={(e) => onChange(e.target.value)} label={label}>
        {allOption && <MenuItem value="">All</MenuItem>}
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
