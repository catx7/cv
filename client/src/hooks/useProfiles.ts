import { useState, useEffect, useCallback } from "react";
import type { SearchProfile } from "../types";
import * as api from "../api/client";

export function useProfiles() {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const create = useCallback(
    async (name: string, keywords: string[]) => {
      const profile = await api.createProfile({ name, keywords });
      setProfiles((prev) => [profile, ...prev]);
      return profile;
    },
    [],
  );

  const update = useCallback(
    async (id: string, name: string, keywords: string[]) => {
      const updated = await api.updateProfile(id, { name, keywords });
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? updated : p)),
      );
      return updated;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await api.deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { profiles, loading, error, create, update, remove, refetch: fetchProfiles };
}
