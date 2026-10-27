import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Lightbulb, Target } from "lucide-react";
import {
  curriculum,
  getAdjacentLessons,
  getLesson,
} from "@/lib/curriculum";
import { CodeRunner } from "@/components/code-runner";
import { LessonContent } from "@/components/lesson-content";
import { LessonActions } from "./lesson-actions";

type Props = { params: Promise<{ module: string; lesson: string }> };

export function generateStaticParams() {
  return curriculum.flatMap((m) =>
    m.lessons.map((l) => ({ module: m.slug, lesson: l.slug }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { module: ms, lesson: ls } = await params;
  const data = getLesson(ms, ls);
  if (!data) return { title: "Lesson" };
  return {
    title: data.lesson.title,
    description: data.lesson.summary,
  };
}

export default async function LessonPage({ params }: Props) {
  const { module: ms, lesson: ls } = await params;
  const data = getLesson(ms, ls);
  if (!data) notFound();

  const { module: mod, lesson, index, section } = data;
  const adj = getAdjacentLessons(ms, ls);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href={`/course/${mod.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          {mod.title}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
              Module {mod.number}
            </span>
            {section && (
              <span className="rounded-full bg-background-muted px-2 py-0.5 font-medium">
                {section.title}
              </span>
            )}
            <span>
              Lesson {index + 1} of {mod.lessons.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {lesson.duration} min
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{lesson.title}</h1>
          <p className="mt-2 text-lg text-foreground-muted">{lesson.summary}</p>

          <div className="mt-8">
            <LessonContent content={lesson.content} />
          </div>

          {lesson.challenge && (
            <div className="mt-8 rounded-xl border border-border bg-info-soft/50 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-info">
                <Target className="h-4 w-4" />
                Challenge
              </div>
              <p className="text-sm text-foreground">{lesson.challenge}</p>
            </div>
          )}

          {lesson.tips && lesson.tips.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-background-muted/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="h-4 w-4 text-accent" />
                Tips
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground-muted">
                {lesson.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Try it live</h2>
            <CodeRunner
              initialCode={lesson.starterCode}
              solution={lesson.solution}
              title={lesson.title}
              height={360}
            />
          </div>

          <LessonActions lessonId={lesson.id} />

          <nav className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
            {adj.prev ? (
              <Link
                href={`/course/${adj.prev.moduleSlug}/${adj.prev.lessonSlug}`}
                className="group flex items-center gap-2 rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm shadow-sm transition hover:border-border-strong"
              >
                <ArrowLeft className="h-4 w-4 text-foreground-muted group-hover:text-accent" />
                <span>
                  <span className="block text-xs text-foreground-muted">Previous</span>
                  <span className="font-medium">{adj.prev.title}</span>
                </span>
              </Link>
            ) : (
              <div />
            )}
            {adj.next ? (
              <Link
                href={`/course/${adj.next.moduleSlug}/${adj.next.lessonSlug}`}
                className="group flex items-center justify-end gap-2 rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm shadow-sm transition hover:border-border-strong sm:text-right"
              >
                <span>
                  <span className="block text-xs text-foreground-muted">Next</span>
                  <span className="font-medium">{adj.next.title}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-accent" />
              </Link>
            ) : (
              <Link
                href="/course"
                className="inline-flex items-center justify-end gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
              >
                Course complete — review path
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </nav>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-border bg-background-elevated p-4 shadow-[var(--shadow)]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              In this module
            </p>
            <div className="space-y-4">
              {mod.sections.map((sec, sIdx) => (
                <div key={sec.id}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                    {mod.number}.{sIdx + 1} {sec.title}
                  </p>
                  <ol className="space-y-0.5">
                    {sec.lessons.map((l, i) => {
                      const active = l.slug === lesson.slug;
                      return (
                        <li key={l.id}>
                          <Link
                            href={`/course/${mod.slug}/${l.slug}`}
                            className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                              active
                                ? "bg-accent-soft font-medium text-accent"
                                : "text-foreground-muted hover:bg-background-muted hover:text-foreground"
                            }`}
                          >
                            <span className="mt-0.5 font-mono text-[11px] opacity-70">{i + 1}</span>
                            <span>{l.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
