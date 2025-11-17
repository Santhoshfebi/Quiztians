import { Box, Button, Stack, Typography, useMediaQuery } from "@mui/material";
import { ArrowBack, Download, RestartAlt } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function HeaderBar({ onBack, onCSV, onOpenReset }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [scrolled, setScrolled] = useState(false);

  // Scroll listener for shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Button entrance animation
  const buttonVariants = {
    hidden: { opacity: 0, x: isMobile ? 0 : 50, y: isMobile ? 50 : 0 },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  // Button hover effect
  const hoverEffect = {
    scale: 1.05,
    boxShadow: "0px 6px 18px rgba(0,0,0,0.15)",
    transition: { type: "spring", stiffness: 300 },
  };

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1200}
      bgcolor="background.paper"
      sx={{
        py: 3,
        px: { xs: 2, md: 3 },
        borderBottomRadius: 2,
        boxShadow: scrolled
          ? "0 4px 12px rgba(0,0,0,0.15)"
          : "0 2px 6px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        gap={isMobile ? 2 : 0}
      >
        {/* Title + description */}
        <Box width={isMobile ? "100%" : "auto"} mb={isMobile ? 2 : 0}>
          <Typography
            variant={isMobile ? "h6" : "h4"}
            fontWeight={700}
            textAlign={isMobile ? "left" : "inherit"}
            color={theme.palette.text.primary}
          >
            Results Dashboard
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
            textAlign={isMobile ? "left" : "inherit"}
          >
            Manage all quiz results, export data, and reset attempts per chapter.
          </Typography>
        </Box>

        {/* Animated button row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={buttonVariants}
          style={{ width: isMobile ? "100%" : "auto" }}
        >
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={isMobile ? 1.5 : 1}
            width={isMobile ? "100%" : "auto"}
          >
            {/* Back */}
            <motion.div whileHover={hoverEffect}>
              <Button
                fullWidth={isMobile}
                startIcon={<ArrowBack />}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                }}
                onClick={onBack}
              >
                Back
              </Button>
            </motion.div>

            {/* Export CSV */}
            <motion.div whileHover={hoverEffect}>
              <Button
                fullWidth={isMobile}
                startIcon={<Download />}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  backgroundColor: theme.palette.primary.main,
                  color: "#fff",
                  "&:hover": { backgroundColor: theme.palette.primary.dark },
                }}
                onClick={onCSV}
              >
                Export CSV
              </Button>
            </motion.div>

            {/* Reset */}
            <motion.div whileHover={hoverEffect}>
              <Button
                fullWidth={isMobile}
                startIcon={<RestartAlt />}
                variant="contained"
                color="error"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": { backgroundColor: theme.palette.error.dark },
                }}
                onClick={onOpenReset}
              >
                Reset by Chapter
              </Button>
            </motion.div>
          </Stack>
        </motion.div>
      </Box>
    </Box>
  );
}
