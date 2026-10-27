"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useProgress } from "@/hooks/use-progress";

export function LessonActions({ lessonId }: { lessonId: string }) {
  const { markComplete, markVisited, isComplete, ready } = useProgress();
  const done = ready && isComplete(lessonId);

  useEffect(() => {
    markVisited(lessonId);
  }, [lessonId, markVisited]);

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => markComplete(lessonId)}
        disabled={done}
        className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
          done
            ? "bg-success-soft text-success"
            : "border border-border bg-background-elevated text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        <CheckCircle2 className="h-4 w-4" />
        {done ? "Completed" : "Mark as complete"}
      </button>
    </div>
  );
}
