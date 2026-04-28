import { useState, useRef, useCallback, useEffect } from "react";
import type { Scan } from "../types";
import * as api from "../api/client";

const POLL_INTERVAL_MS = 2000;

export function useScan() {
  const [scan, setScan] = useState<Scan | null>(null);
  const [scanning, setScanning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startScan = useCallback(
    async (
      searchProfileId: string,
      onComplete?: (scan: Scan) => void,
    ) => {
      stopPolling();
      setScanning(true);
      setScan(null);

      const { scanId } = await api.startScan(searchProfileId);

      intervalRef.current = setInterval(async () => {
        try {
          const current = await api.getScan(scanId);
          setScan(current);

          if (current.status === "completed" || current.status === "failed") {
            stopPolling();
            setScanning(false);
            onComplete?.(current);
          }
        } catch {
          stopPolling();
          setScanning(false);
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { scan, scanning, startScan, stopPolling };
}
