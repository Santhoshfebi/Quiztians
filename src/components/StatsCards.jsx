import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
} from "@mui/material";

import {
  Group,
  School,
  EmojiEvents,
  Person,
  Star,
  Today,
} from "@mui/icons-material";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function StatsCards({ allRows }) {
  const total = allRows.length;

  const chapters = [
    ...new Set(allRows.map((r) => r.chapter).filter(Boolean)),
  ];

  const avgScore = (
    allRows.reduce((sum, r) => sum + (r.score || 0), 0) /
    (total || 1)
  ).toFixed(2);

  const phones = allRows.map((r) => r.phone).filter(Boolean);
  const uniqueParticipants = new Set(
    phones.map((p) => String(p).trim()),
  ).size;

  const chapterScores = {};
  const chapterCounts = {};

  allRows.forEach((r) => {
    if (!r.chapter || r.score == null) return;

    chapterScores[r.chapter] =
      (chapterScores[r.chapter] || 0) + r.score;

    chapterCounts[r.chapter] =
      (chapterCounts[r.chapter] || 0) + 1;
  });

  const chapterAvgScores = Object.entries(chapterScores).map(
    ([chapter, totalScore]) => ({
      chapter,
      avgScore: totalScore / chapterCounts[chapter],
    }),
  );

  const topScoringChapter =
    chapterAvgScores.sort((a, b) => b.avgScore - a.avgScore)[0]
      ?.chapter || "N/A";

  const today = new Date().toDateString();
  const newToday = allRows.filter((r) => {
    if (!r.created_at) return false;
    return (
      new Date(r.created_at).toDateString() === today
    );
  }).length;

  const stats = [
    {
      title: "Total Participants",
      value: total,
      icon: <Group />,
      gradient: "linear-gradient(135deg,#6366f1,#3b82f6)",
    },
    {
      title: "Unique Participants",
      value: uniqueParticipants,
      icon: <Person />,
      gradient: "linear-gradient(135deg,#22c55e,#10b981)",
    },
    {
      title: "Total Chapters",
      value: chapters.length,
      icon: <School />,
      gradient: "linear-gradient(135deg,#f59e0b,#f97316)",
    },
    {
      title: "Average Score",
      value: avgScore,
      icon: <EmojiEvents />,
      gradient: "linear-gradient(135deg,#ec4899,#8b5cf6)",
    },
    {
      title: "Top Chapter",
      value: topScoringChapter,
      icon: <Star />,
      gradient: "linear-gradient(135deg,#06b6d4,#3b82f6)",
    },
    {
      title: "New Today",
      value: newToday,
      icon: <Today />,
      gradient: "linear-gradient(135deg,#ef4444,#f43f5e)",
    },
  ];

  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: "repeat(2, 1fr)",
        sm: "repeat(3, 1fr)",
        md: "repeat(6, 1fr)",
      }}
      gap={3}
      mb={4}
      mt={2}
    >
      {stats.map((stat, index) => (
        <PremiumStatCard key={index} {...stat} />
      ))}
    </Box>
  );
}

/* ================= PREMIUM CARD ================= */

function PremiumStatCard({ title, value, icon, gradient }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value === "number") {
      let start = 0;
      const duration = 800;
      const step = value / (duration / 16);

      const interval = setInterval(() => {
        start += step;
        if (start >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        sx={{
          height: "100%",
          borderRadius: 4,
          background: gradient,
          color: "white",
          boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Box>{icon}</Box>

            <Box>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                {title}
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  mt: 0.5,
                  textShadow: "0px 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                {displayValue}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}