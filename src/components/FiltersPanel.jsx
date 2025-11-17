import {
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
  useMediaQuery,
  useTheme,
  Collapse,
  Slide,
  Fade,
} from "@mui/material";
import { Search, ClearAll, ExpandMore, ExpandLess } from "@mui/icons-material";
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

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        boxShadow: 3,
        backgroundColor: theme.palette.background.paper,
        transition: "all 0.3s ease",
      }}
    >
      {/* Top Row: Search + Clear + Toggle */}
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        alignItems={isMobile ? "stretch" : "center"}
      >
        <TextField
          placeholder="Search name / phone / chapter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{
            borderRadius: 2,
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": { borderColor: theme.palette.primary.light },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 5px ${theme.palette.primary.light}`,
              },
              transition: "all 0.3s ease",
            },
          }}
        />

        <Stack direction="row" spacing={1} justifyContent={isMobile ? "space-between" : "flex-end"}>
          <Button
            variant="outlined"
            startIcon={<ClearAll />}
            onClick={clearFilters}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
            }}
          >
            Clear
          </Button>

          {isMobile && (
            <IconButton
              onClick={() => setAdvancedOpen(!advancedOpen)}
              sx={{
                transition: "transform 0.3s",
                transform: advancedOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <ExpandMore />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {/* Advanced Filters with Slide+Fade */}
      {isMobile ? (
        <Slide direction="down" in={advancedOpen} mountOnEnter unmountOnExit>
          <Fade in={advancedOpen}>
            <Stack spacing={2} mt={2}>
              <Dropdown
                label="Chapter"
                value={chapterFilter}
                onChange={setChapterFilter}
                multiple
                options={chapterOptions}
                fullWidth
              />
              <Dropdown
                label="Language"
                value={languageFilter}
                onChange={setLanguageFilter}
                options={languageOptions}
                allOption
                fullWidth
              />
              <Dropdown
                label="Place"
                value={placeFilter}
                onChange={setPlaceFilter}
                options={placeOptions}
                allOption
                fullWidth
              />
              <Divider sx={{ my: 1 }} />
              <Stack direction="column" spacing={1}>
                <Chip
                  label={`Active Filters`}
                  color="primary"
                  size="small"
                  sx={{
                    fontWeight: 500,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": { transform: "scale(1.05)", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showDuplicates}
                      onChange={(e) => setShowDuplicates(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show Duplicates"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showHighestScore}
                      onChange={(e) => setShowHighestScore(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Highest Score Only"
                />
              </Stack>
            </Stack>
          </Fade>
        </Slide>
      ) : (
        <Collapse in={advancedOpen} timeout={300}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            mt={2}
            flexWrap="wrap"
          >
            <Dropdown
              label="Chapter"
              value={chapterFilter}
              onChange={setChapterFilter}
              multiple
              options={chapterOptions}
            />
            <Dropdown
              label="Language"
              value={languageFilter}
              onChange={setLanguageFilter}
              options={languageOptions}
              allOption
            />
            <Dropdown
              label="Place"
              value={placeFilter}
              onChange={setPlaceFilter}
              options={placeOptions}
              allOption
            />
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end" ml="auto">
              <Chip
                label={`Active Filters`}
                color="primary"
                size="small"
                sx={{
                  fontWeight: 500,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": { transform: "scale(1.05)", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showDuplicates}
                    onChange={(e) => setShowDuplicates(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Duplicates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showHighestScore}
                    onChange={(e) => setShowHighestScore(e.target.checked)}
                    color="primary"
                  />
                }
                label="Highest Score Only"
              />
            </Stack>
          </Stack>
        </Collapse>
      )}
    </Paper>
  );
}

/* ---------------- Dropdown Component ---------------- */
function Dropdown({ label, value, onChange, options, multiple, allOption, fullWidth }) {
  return (
    <FormControl
      size="small"
      sx={{
        minWidth: fullWidth ? "100%" : 180,
        flex: fullWidth ? "1 1 100%" : "0 1 180px",
        transition: "all 0.3s ease",
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          "&:hover fieldset": { borderColor: "#1976d2", boxShadow: "0 0 5px rgba(25,118,210,0.2)" },
          "&.Mui-focused fieldset": { borderColor: "#1976d2", boxShadow: "0 0 8px rgba(25,118,210,0.3)" },
        },
      }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        multiple={multiple}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        renderValue={(selected) => Array.isArray(selected) ? selected.join(", ") : selected}
      >
        {allOption && <MenuItem value="">All</MenuItem>}
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
