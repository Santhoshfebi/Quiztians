import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Stack,
  Slide,
} from "@mui/material";
import { forwardRef } from "react";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ResetDialog({
  open,
  onClose,
  selectedChapter,
  setSelectedChapter,
  onConfirm,
  chapters = ["Chapter 1", "Chapter 2"],
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Transition}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Reset Results by Chapter</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Chapter</InputLabel>
            <Select
              value={selectedChapter}
              label="Select Chapter"
              onChange={(e) => setSelectedChapter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {chapters.map((ch) => (
                <MenuItem key={ch} value={ch}>
                  {ch}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#fff4f4",
              border: "1px solid #f5c2c2",
            }}
          >
            <Typography variant="body2" color="error">
              ⚠️ Selecting “All” will delete <strong>every result</strong>. This action is irreversible.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => onConfirm(selectedChapter)}
        >
          Confirm Reset
        </Button>
      </DialogActions>
    </Dialog>
  );
}
