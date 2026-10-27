import Link from "next/link";
import { curriculum, courseStats } from "@/lib/curriculum";
import { formatDuration } from "@/lib/utils";
import { CourseProgress } from "@/components/progress-bar";
import { CourseClientExtras } from "./course-client";

export const metadata = {
  title: "Course",
  description: "Full Rust to quant finance curriculum with interactive lessons and submodules.",
};

export default function CoursePage() {
  const stats = courseStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Course overview</h1>
        <p className="mt-3 text-foreground-muted">
          {stats.modules} modules · {stats.sections} submodules · {stats.lessons} lessons · ~
          {stats.hours} hours. Work top to bottom for the designed path, or jump to quant modules if
          you already know Rust.
        </p>
        <div className="mt-6 max-w-md">
          <CourseProgress />
        </div>
        <CourseClientExtras />
      </div>

      <div className="space-y-6">
        {curriculum.map((m) => (
          <section
            key={m.id}
            id={m.slug}
            className="overflow-hidden rounded-2xl border border-border bg-background-elevated shadow-[var(--shadow)]"
          >
            <div className="flex flex-wrap items-start gap-4 border-b border-border bg-background-muted/40 px-5 py-4 sm:px-6">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: m.color }}
              >
                {String(m.number).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">{m.title}</h2>
                  <span className="rounded-full bg-background-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground-muted ring-1 ring-border">
                    {m.level}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground-muted">{m.description}</p>
                <p className="mt-2 text-xs text-foreground-muted">
                  {m.sections.length} submodules · {m.lessons.length} lessons ·{" "}
                  {formatDuration(m.lessons.reduce((a, l) => a + l.duration, 0))}
                </p>
              </div>
              <Link
                href={`/course/${m.slug}`}
                className="text-sm font-semibold text-accent hover:text-accent-hover"
              >
                Module page →
              </Link>
            </div>

            <div className="divide-y divide-border">
              {m.sections.map((section, sIdx) => (
                <div key={section.id} className="px-5 py-4 sm:px-6">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Submodule {m.number}.{sIdx + 1}
                    </p>
                    <h3 className="font-semibold tracking-tight">{section.title}</h3>
                    <p className="text-sm text-foreground-muted">{section.description}</p>
                  </div>
                  <ol className="space-y-1">
                    {section.lessons.map((lesson, i) => (
                      <li key={lesson.id}>
                        <Link
                          href={`/course/${m.slug}/${lesson.slug}`}
                          className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-background-muted/60"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background-muted font-mono text-[11px] text-foreground-muted">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium tracking-tight">{lesson.title}</p>
                            <p className="truncate text-xs text-foreground-muted">{lesson.summary}</p>
                          </div>
                          <span className="shrink-0 text-xs text-foreground-muted">
                            {lesson.duration} min
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
