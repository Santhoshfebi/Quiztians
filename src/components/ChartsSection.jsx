import { Paper, Box, Stack, Typography, useTheme, useMediaQuery } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";

export default function ChartsSection({ allRows }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const chapterStats = getStats(allRows);

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    "#ff9800",
    "#4caf50",
    "#f44336",
  ];

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
      gap={3}
      mb={4}
    >
      {/* Average Score Bar */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, backgroundColor: "background.paper" }}>
        <ChartTitle title="Average Score per Chapter" subtitle="Based on all participants" />
        <ChartContainer height={isMobile ? 220 : 280}>
          <ResponsiveBar data={chapterStats} barColor={theme.palette.primary.main} />
        </ChartContainer>
      </Paper>

      {/* Participants Pie */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2, backgroundColor: "background.paper" }}>
        <ChartTitle title="Participants by Chapter" subtitle="Distribution overview" />
        <ChartContainer height={isMobile ? 220 : 280}>
          <ResponsivePie data={chapterStats} COLORS={COLORS} />
        </ChartContainer>
      </Paper>
    </Box>
  );
}

/* -------- Sub Components -------- */
function ChartTitle({ title, subtitle }) {
  return (
    <Stack mb={2}>
      <Typography fontWeight={700} variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Stack>
  );
}

function ChartContainer({ children, height = 280 }) {
  return <Box sx={{ width: "100%", height }}>{children}</Box>;
}

/* -------- Chart Components -------- */
function ResponsiveBar({ data, barColor }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="chapter" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar
          dataKey="avgScore"
          fill={barColor}
          radius={[4, 4, 0, 0]}
          barSize={30}
          animationDuration={1200}
          isAnimationActive={true}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ResponsivePie({ data, COLORS }) {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="participants"
          nameKey="chapter"
          outerRadius="80%"
          innerRadius="40%"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          isAnimationActive={true}
          animationDuration={1200}
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={COLORS[i % COLORS.length]}
              cursor="pointer"
              outerRadius={i === activeIndex ? "90%" : "80%"} // expand on hover
              style={{
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}`, "Participants"]} />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* -------- Helpers -------- */
function getStats(allRows) {
  const stats = {};

  allRows.forEach((r) => {
    if (!r.chapter) return;

    if (!stats[r.chapter])
      stats[r.chapter] = { chapter: r.chapter, participants: 0, total: 0 };

    stats[r.chapter].participants++;
    stats[r.chapter].total += r.score || 0;
  });

  return Object.values(stats).map((s) => ({
    chapter: s.chapter,
    participants: s.participants,
    avgScore: parseFloat((s.total / s.participants).toFixed(2)),
  }));
}
