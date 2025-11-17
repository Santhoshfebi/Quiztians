import { Paper, Stack, Chip, IconButton, Typography, Box, Tooltip, Popover, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { ContentCopy, RestartAlt, Visibility } from "@mui/icons-material";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function ResultsTable({ filteredRows, showDuplicates, onResetIndividual }) {
  const duplicatePhones = getDuplicatePhones(filteredRows);
  const [totalDuplicates, setTotalDuplicates] = useState(duplicatePhones.size);
  const [totalParticipants, setTotalParticipants] = useState(filteredRows.length);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPhone, setSelectedPhone] = useState(null);

  useEffect(() => {
    setTotalDuplicates(duplicatePhones.size);
    setTotalParticipants(filteredRows.length);
  }, [duplicatePhones.size, filteredRows.length]);

  const copyPhone = (phone) => {
    if (!phone) return toast.error("No phone to copy");
    navigator.clipboard.writeText(phone);
    toast.success("Phone copied!");
  };

  const handleResetClick = (event, phone) => {
    setAnchorEl(event.currentTarget);
    setSelectedPhone(phone);
  };

  const handleConfirmReset = () => {
    if (selectedPhone) onResetIndividual(selectedPhone);
    setAnchorEl(null);
    setSelectedPhone(null);
  };

  const handleCancelReset = () => {
    setAnchorEl(null);
    setSelectedPhone(null);
  };

  const displayRows = showDuplicates
    ? filteredRows.filter((r) => duplicatePhones.has(String(r.phone || "").trim()))
    : filteredRows;

  const open = Boolean(anchorEl);

  const columns = [
    { field: "id", headerName: "#", width: 60 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "phone", headerName: "Phone", width: 140 },
    { field: "place", headerName: "Place", flex: 1 },
    { field: "score", headerName: "Score", width: 90 },
    { field: "chapter", headerName: "Chapter", width: 120 },
    { field: "language", headerName: "Language", width: 110 },
    {
      field: "duplicate",
      headerName: "Dup?",
      width: 90,
      renderCell: (params) => {
        const phone = String(params.row.phone || "").trim();
        const isDup = duplicatePhones.has(phone);
        return (
          <Chip
            label={isDup ? "Yes" : "No"}
            color={isDup ? "error" : "success"}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Copy phone">
            <IconButton size="small" color="primary" onClick={() => copyPhone(params.row.phone)}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="View details">
            <IconButton size="small" color="info">
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset this row">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => handleResetClick(e, params.row.phone)}
            >
              <RestartAlt fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
      {/* Badges Row */}
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={totalParticipants}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Chip
              label={`Total Participants: ${totalParticipants}`}
              color="primary"
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </motion.div>
        </AnimatePresence>

        {showDuplicates && (
          <AnimatePresence mode="wait">
            <motion.div
              key={totalDuplicates}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Chip
                label={`Total Duplicates: ${totalDuplicates}`}
                color="error"
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </Stack>

      {/* No duplicates message */}
      {showDuplicates && totalDuplicates === 0 && (
        <Box
          sx={{
            p: 2,
            bgcolor: "#fff7e6",
            borderRadius: 2,
            border: "1px solid #fde3a7",
            mb: 2,
            textAlign: "center",
          }}
        >
          <Typography color="text.secondary">No duplicate phone numbers found.</Typography>
        </Box>
      )}

      {/* DataGrid Table */}
      <DataGrid
        rows={displayRows.map((r, i) => ({ ...r, id: r.id ?? i + 1 }))}
        columns={columns}
        autoHeight
        disableSelectionOnClick
        pageSize={25}
        rowsPerPageOptions={[25, 50, 100]}
        getRowClassName={(params) => {
          const phone = String(params.row.phone || "").trim();
          return duplicatePhones.has(phone) ? "duplicate-row" : "";
        }}
        sx={{
          border: "none",
          "& .duplicate-row": { backgroundColor: "#ffebee" },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5", fontWeight: 700 },
          "& .MuiDataGrid-footerContainer": { justifyContent: "flex-end" },
        }}
        disableColumnMenu
      />

      {/* Popover for individual reset */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCancelReset}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body2">
            Are you sure you want to reset phone <strong>{selectedPhone}</strong>?
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
            <Button size="small" variant="outlined" onClick={handleCancelReset}>
              Cancel
            </Button>
            <Button size="small" variant="contained" color="error" onClick={handleConfirmReset}>
              Confirm
            </Button>
          </Stack>
        </Box>
      </Popover>
    </Paper>
  );
}

function getDuplicatePhones(rows) {
  const count = {};
  rows.forEach((r) => {
    if (!r.phone) return;
    const phone = String(r.phone).trim();
    if (!phone) return;
    count[phone] = (count[phone] || 0) + 1;
  });
  return new Set(Object.keys(count).filter((p) => count[p] > 1));
}
