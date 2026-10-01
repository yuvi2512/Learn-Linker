import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ALL_BATCHES } from "@/utils/batches";

const STORAGE_KEY = "learn-linker:selected-batch";

function readStoredBatch() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function storeBatch(batchId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, batchId || "");
  } catch {
    // Private browsing modes can refuse writes; the picker still works.
  }
}

/** Batches the signed-in user can see: all of them for a teacher, their own for a student. */
export function useBatches({ notifyOnError = true } = {}) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await axios.get("/api/batches");
      setBatches(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading batches:", error);
      if (notifyOnError) toast.error("Could not load batches.");
    } finally {
      setLoading(false);
    }
  }, [notifyOnError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { batches, loading, refresh, setBatches };
}

/**
 * Batch list plus the currently picked batch, remembered across pages so a
 * teacher does not have to re-pick their class on every screen.
 *
 * With `allowAll`, an empty selection is legitimate and means "everyone".
 * Without it, the first batch is selected as soon as the list arrives.
 */
export function useBatchSelection({ allowAll = false } = {}) {
  const { batches, loading, refresh } = useBatches();
  const [batchId, setBatchIdState] = useState(() =>
    allowAll ? ALL_BATCHES : readStoredBatch()
  );

  const setBatchId = useCallback((next) => {
    setBatchIdState(next);
    if (next && next !== ALL_BATCHES) storeBatch(next);
  }, []);

  useEffect(() => {
    if (loading) return;

    const exists = batches.some((batch) => batch.id === batchId);
    if (exists) return;
    if (allowAll && batchId === ALL_BATCHES) return;

    // The remembered batch was deleted, or nothing is picked yet.
    const fallback = allowAll ? ALL_BATCHES : batches[0]?.id || "";
    setBatchIdState(fallback);
    if (!allowAll) storeBatch(fallback);
  }, [loading, batches, batchId, allowAll]);

  const selectedBatch = batches.find((batch) => batch.id === batchId);
  const resolvedBatchId = selectedBatch
    ? batchId
    : loading
      ? allowAll
        ? ALL_BATCHES
        : ""
      : allowAll
        ? ALL_BATCHES
        : batches[0]?.id || "";
  const selected = batches.find((batch) => batch.id === resolvedBatchId) || null;

  return {
    batches,
    loading,
    batchId: resolvedBatchId,
    setBatchId,
    selected,
    refresh,
  };
}
