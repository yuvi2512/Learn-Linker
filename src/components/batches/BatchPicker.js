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
  disabled = false,
  sx,
}) {
  const empty = !loading && batches.length === 0;

  // A remembered batch can be missing from the list for a render or two while
  // it loads; MUI warns about a value with no matching option, so drop it.
  const inRange =
    (allowAll && value === ALL_BATCHES) ||
    batches.some((batch) => batch.id === value);

  const fallbackHelp = empty ? (
    <Typography component="span" variant="caption">
      No batches yet.{" "}
      <Link href="/batches" style={{ color: "#2563EB", fontWeight: 600 }}>
        Create one
      </Link>{" "}
      to get started.
    </Typography>
  ) : (
    helperText
  );

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
