"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rust-to-quant-progress";

export type ProgressState = {
  completed: string[];
  lastVisited?: string;
};

function readProgress(): ProgressState {
  if (typeof window === "undefined") return { completed: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [] };
    return JSON.parse(raw) as ProgressState;
  } catch {
    return { completed: [] };
  }
}

function writeProgress(state: ProgressState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>({ completed: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProgress(readProgress());
    setReady(true);
  }, []);

  const markComplete = useCallback((lessonId: string) => {
    setProgress((prev) => {
      if (prev.completed.includes(lessonId)) return prev;
      const next = { ...prev, completed: [...prev.completed, lessonId] };
      writeProgress(next);
      return next;
    });
  }, []);

  const markVisited = useCallback((lessonId: string) => {
    setProgress((prev) => {
      const next = { ...prev, lastVisited: lessonId };
      writeProgress(next);
      return next;
    });
  }, []);

  const isComplete = useCallback(
    (lessonId: string) => progress.completed.includes(lessonId),
    [progress.completed]
  );

  const resetProgress = useCallback(() => {
    const next = { completed: [] as string[] };
    writeProgress(next);
    setProgress(next);
  }, []);

  return { progress, ready, markComplete, markVisited, isComplete, resetProgress };
}
