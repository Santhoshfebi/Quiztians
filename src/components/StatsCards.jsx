import { Card, CardContent, Stack, Typography, Box } from "@mui/material";
import { Group, School, EmojiEvents } from "@mui/icons-material";

export default function StatsCards({ allRows }) {
  const total = allRows.length;

  const chapters = [...new Set(allRows.map((r) => r.chapter).filter(Boolean))];
  const avgScore = (
    allRows.reduce((sum, r) => sum + (r.score || 0), 0) / (total || 1)
  ).toFixed(2);

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }}
      gap={3}
      mb={4}
    >
      <StatCard
        icon={<Group color="primary" />}
        title="Total Participants"
        value={total}
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
    </Box>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <Card sx={{ p: 2, borderRadius: 4 }}>
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
