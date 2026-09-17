import React from "react";
import { MenuItem, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { ALL_BATCHES } from "@/utils/batches";

/**
 * Batch selector shared by every teacher screen. When `allowAll` is set, the
 * first option means "not scoped to a batch".
 */
export default function BatchPicker({
  batches,
  loading,
  value,
  onChange,
  allowAll = false,
  allLabel = "All students",
  label = "Batch",
  helperText,
  emptyHint,
  canCreate = false,
  disabled = false,
  sx,
}) {
  const empty = !loading && batches.length === 0;

  const inRange =
    (allowAll && value === ALL_BATCHES) ||
    batches.some((batch) => batch.id === value);

  const fallbackHelp = empty
    ? emptyHint ||
      (canCreate ? (
        <Typography component="span" variant="caption">
          No batches yet.{" "}
          <Link href="/batches" style={{ color: "#2563EB", fontWeight: 600 }}>
            Create one
          </Link>{" "}
          to get started.
        </Typography>
      ) : (
        "No batches assigned yet. Ask your admin to add you to a class."
      ))
    : helperText;

  return (
    <TextField
      select
      label={label}
      value={inRange ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || loading || (empty && !allowAll)}
      helperText={fallbackHelp}
      sx={{ minWidth: 240, ...sx }}
    >
      {allowAll && <MenuItem value={ALL_BATCHES}>{allLabel}</MenuItem>}
      {batches.map((batch) => (
        <MenuItem key={batch.id} value={batch.id}>
          {batch.name}
          {batch.subject ? ` · ${batch.subject}` : ""}
        </MenuItem>
      ))}
    </TextField>
  );
}
