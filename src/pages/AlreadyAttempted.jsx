import { Box, Button, Typography, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CelebrationIcon from "@mui/icons-material/Celebration";

export default function AlreadyAttempted({ chapter }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #dbeafe, #e9d5ff, #ffe4e6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            p: 5,
            borderRadius: 5,
            backdropFilter: "blur(16px)",
            background: "rgba(255,255,255,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              mb: 3,
              background: "linear-gradient(90deg, #6366f1, #ec4899)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            You've Already Attempted This Chapter
          </Typography>

          <CelebrationIcon
            sx={{
              fontSize: 60,
              mb: 2,
              color: "#f59e0b",
            }}
          />

          {/* CHAPTER NAME
          <Typography
            sx={{
              fontSize: "1.4rem",
              fontWeight: "bold",
              mt: 1,
              color: "#1e3a8a",
            }}
          >
            Chapter: {chapter}
          </Typography> */}

          {/* BUTTON */}
          <Button
            variant="contained"
            sx={{
              mt: 4,
              py: 1.5,
              borderRadius: 3,
              background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
              color: "white",
              width: "100%",
            }}
            onClick={() => navigate("/")}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
