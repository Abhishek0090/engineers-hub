"use client";

// Keeps the learner's progress in the browser (localStorage) and, when the server stores
// progress (DATA_SOURCE=mongo), loads it from and saves it to /api/progress.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { emptyProgress, sanitizeProgress } from "@/lib/progress";
import type { Progress } from "@/lib/types";

interface ProgressContextValue {
  progress: Progress;
  ready: boolean;
  synced: boolean;
  update: (fn: (p: Progress) => Progress) => void;
  reset: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const storageKey = (userId: string) => `seh:progress:${userId}`;

function readLocal(userId: string): Progress | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? sanitizeProgress(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
function writeLocal(userId: string, p: Progress) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(p));
  } catch {
    // Storage full or blocked: progress still works for this session.
  }
}

export function ProgressProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);
  const persist = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const local = readLocal(userId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage after mount
    if (local) setProgress(local);
    setReady(true);
    fetch("/api/progress", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { persist: boolean; progress: Progress | null } | null) => {
        if (cancelled || !data) return;
        persist.current = data.persist;
        setSynced(data.persist);
        if (data.persist && data.progress) {
          const server = sanitizeProgress(data.progress);
          setProgress((cur) => (server.updatedAt >= cur.updatedAt ? server : cur));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const save = useCallback(
    (p: Progress) => {
      writeLocal(userId, p);
      if (!persist.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        fetch("/api/progress", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(p) }).catch(() => {});
      }, 600);
    },
    [userId],
  );

  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      setProgress((cur) => {
        const next = fn(cur);
        if (next !== cur) save(next);
        return next;
      });
    },
    [save],
  );

  const reset = useCallback(() => {
    const fresh = { ...emptyProgress(), updatedAt: new Date().toISOString() };
    setProgress(fresh);
    save(fresh);
  }, [save]);

  const value = useMemo(() => ({ progress, ready, synced, update, reset }), [progress, ready, synced, update, reset]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
