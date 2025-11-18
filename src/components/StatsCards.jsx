import { Card, CardContent, Stack, Typography, Box } from "@mui/material";
import { Group, School, EmojiEvents, Person, Star, Today } from "@mui/icons-material";

export default function StatsCards({ allRows }) {
  const total = allRows.length;

  const chapters = [...new Set(allRows.map((r) => r.chapter).filter(Boolean))];

  const avgScore = (
    allRows.reduce((sum, r) => sum + (r.score || 0), 0) / (total || 1)
  ).toFixed(2);

  // Unique participants by phone
  const phones = allRows.map((r) => r.phone).filter(Boolean);
  const uniqueParticipants = new Set(phones.map((p) => p.trim())).size;

  // Top scoring chapter
  const chapterScores = {};
  const chapterCounts = {};

  allRows.forEach((r) => {
    if (!r.chapter || r.score == null) return;
    chapterScores[r.chapter] = (chapterScores[r.chapter] || 0) + r.score;
    chapterCounts[r.chapter] = (chapterCounts[r.chapter] || 0) + 1;
  });

  const chapterAvgScores = Object.entries(chapterScores).map(
    ([chapter, totalScore]) => ({
      chapter,
      avgScore: totalScore / chapterCounts[chapter],
    })
  );

  const topScoringChapter =
    chapterAvgScores.sort((a, b) => b.avgScore - a.avgScore)[0]?.chapter ||
    "N/A";

  // 🔥 New Today — count records added today
  const today = new Date().toDateString();
  const newToday = allRows.filter((r) => {
    if (!r.created_at) return false;
    return new Date(r.created_at).toDateString() === today;
  }).length;

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: "repeat(6, 1fr)" }}
      gap={3}
      mb={4}
      mt={2}
    >
      <StatCard
        icon={<Group color="primary" />}
        title="Total Participants"
        value={total}
      />

      <StatCard
        icon={<Person color="primary" />}
        title="Unique Participants"
        value={uniqueParticipants}
      />

      <StatCard
        icon={<School color="primary" />}
        title="Total Chapters"
        value={chapters.length}
      />

      <StatCard
        icon={<EmojiEvents color="primary" />}
        title="Average Score"
        value={avgScore}
      />

      <StatCard
        icon={<Star color="primary" />}
        title="Top Scoring Chapter"
        value={topScoringChapter}
      />

      {/* ⭐ New Today – NEW CARD */}
      <StatCard
        icon={<Today color="primary" />}
        title="New Today"
        value={newToday}
      />
    </Box>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <Card sx={{ p: 2, borderRadius: 4, boxShadow: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          {icon}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
