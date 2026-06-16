import { Box, Button, Typography, Container, Divider } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import CelebrationIcon from "@mui/icons-material/Celebration";

export default function AlreadyAttempted() {
  const navigate = useNavigate();
  const location = useLocation();

  const { name, place, chapter, score, total, attemptedAt } =
    location.state || {};

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e1b4b, #3b0764, #0f172a)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(168, 85, 247, 0.25)",
          filter: "blur(120px)",
          top: -120,
          left: -120,
        }}
      />

      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "rgba(99, 102, 241, 0.25)",
          filter: "blur(120px)",
          bottom: -120,
          right: -120,
        }}
      />

      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              p: { xs: 4, sm: 5 },
              borderRadius: 5,
              backdropFilter: "blur(18px)",
              background: "rgba(255,255,255,0.08)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.16)",
              textAlign: "center",
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 180 }}
            >
              <CelebrationIcon
                sx={{
                  fontSize: 70,
                  mb: 2,
                  color: "#f59e0b",
                  filter: "drop-shadow(0 0 20px rgba(245,158,11,0.6))",
                }}
              />
            </motion.div>

            <Typography
              variant="h4"
              fontWeight="900"
              sx={{
                mb: 2,
                background: "linear-gradient(90deg, #f472b6, #818cf8)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Already Attempted
            </Typography>

            <Typography
              sx={{
                color: "#e5e7eb",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                mb: 3,
              }}
            >
              You have already completed this chapter. Each participant can
              attempt a chapter only once.
            </Typography>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", mb: 3 }} />

            <Box
              sx={{
                textAlign: "left",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 4,
                p: 2.5,
                mb: 3,
              }}
            >
              <InfoRow label="Participant" value={name || "N/A"} />
              <InfoRow label="Place" value={place || "N/A"} />
              <InfoRow label="Chapter" value={chapter || "N/A"} />

              {score !== undefined && total !== undefined && (
                <InfoRow label="Score" value={`${score} / ${total}`} />
              )}

              <InfoRow label="Attempted On" value={formatDate(attemptedAt)} />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="outlined"
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    color: "#e5e7eb",
                    width: "100%",
                    fontWeight: 800,
                    textTransform: "none",
                    borderColor: "rgba(255,255,255,0.25)",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.45)",
                      background: "rgba(255,255,255,0.08)",
                    },
                  }}
                  onClick={() => navigate("/")}
                >
                  Go Back
                </Button>
              </motion.div>
            </Box>

            <Typography
              sx={{
                mt: 3,
                color: "#cbd5e1",
                fontSize: "0.82rem",
                lineHeight: 1.6,
              }}
            >
              Need help? Please contact the quiz administrator if you think this
              is a mistake.
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
        py: 0.8,
      }}
    >
      <Typography sx={{ color: "#a5b4fc", fontSize: "0.85rem" }}>
        {label}
      </Typography>

      <Typography
        sx={{
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "0.85rem",
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
