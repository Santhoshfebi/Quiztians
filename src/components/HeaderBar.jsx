import {
  Box,
  Button,
  Stack,
  Typography,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { ArrowBack, Download, RestartAlt, Menu } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function HeaderBar({ onBack, onOpenReset, filteredRows }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll shadow listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation for slide-down menu
  const menuVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  // CSV Export function
  const exportToCSV = (data, filename = "results.csv") => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // header row
      ...data.map((row) =>
        headers.map((field) => `"${row[field] ?? ""}"`).join(",")
      ),
    ];
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1200}
      bgcolor="background.paper"
      sx={{
        py: 2,
        px: { xs: 2, md: 3 },
        boxShadow: scrolled
          ? "0 4px 12px rgba(0,0,0,0.15)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {/* Top Row */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {/* Title */}
        <Box>
          <Typography variant={isMobile ? "h6" : "h4"} fontWeight={700}>
            Results Dashboard
          </Typography>
          {!isMobile && (
            <Typography variant="body2" color="text.secondary" mt={0.3}>
              Manage quiz results, export data, and reset attempts.
            </Typography>
          )}
        </Box>

        {/* Desktop Buttons */}
        {!isMobile && (
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<ArrowBack />}
              variant="outlined"
              sx={{ borderRadius: 2 }}
              onClick={onBack}
            >
              Back
            </Button>

            <Button
              startIcon={<Download />}
              variant="contained"
              sx={{ borderRadius: 2 }}
              onClick={() => exportToCSV(filteredRows)}
            >
              Export CSV
            </Button>

            <Button
              startIcon={<RestartAlt />}
              variant="contained"
              color="error"
              sx={{ borderRadius: 2 }}
              onClick={onOpenReset}
            >
              Reset by Chapter
            </Button>
          </Stack>
        )}

        {/* Mobile Hamburger */}
        {isMobile && (
          <IconButton
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            <Menu />
          </IconButton>
        )}
      </Box>

      {/* Mobile Description */}
      {isMobile && (
        <Typography
          variant="body2"
          color="text.secondary"
          mt={0.5}
          sx={{ opacity: 0.8 }}
        >
          Manage quiz results and actions.
        </Typography>
      )}

      {/* Mobile Sliding Menu */}
      {isMobile && (
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}
              style={{ overflow: "hidden", marginTop: 12 }}
            >
              <Stack spacing={1.2}>
                <Button
                  fullWidth
                  startIcon={<ArrowBack />}
                  variant="outlined"
                  onClick={onBack}
                  sx={{ borderRadius: 2 }}
                >
                  Back
                </Button>

                <Button
                  fullWidth
                  startIcon={<Download />}
                  variant="contained"
                  onClick={() => exportToCSV(filteredRows)}
                  sx={{ borderRadius: 2 }}
                >
                  Export CSV
                </Button>

                <Button
                  fullWidth
                  startIcon={<RestartAlt />}
                  variant="contained"
                  color="error"
                  onClick={onOpenReset}
                  sx={{ borderRadius: 2 }}
                >
                  Reset by Chapter
                </Button>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Box>
  );
}
