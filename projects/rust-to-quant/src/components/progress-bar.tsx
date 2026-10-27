"use client";

import { curriculum } from "@/lib/curriculum";
import { useProgress } from "@/hooks/use-progress";

export function CourseProgress() {
  const { progress, ready } = useProgress();
  const total = curriculum.reduce((a, m) => a + m.lessons.length, 0);
  const done = progress.completed.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  if (!ready) {
    return (
      <div className="h-2 w-full overflow-hidden rounded-full bg-background-muted">
        <div className="h-full w-0 rounded-full bg-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-foreground-muted">
        <span>
          Progress: {done}/{total} lessons
        </span>
        <span className="font-medium text-accent">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-background-muted">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
