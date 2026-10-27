"use client";

import { useProgress } from "@/hooks/use-progress";

export function CourseClientExtras() {
  const { resetProgress, progress, ready } = useProgress();

  if (!ready || progress.completed.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Reset all lesson progress?")) resetProgress();
      }}
      className="mt-3 text-xs text-foreground-muted underline-offset-2 hover:text-error hover:underline"
    >
      Reset progress
    </button>
  );
}
