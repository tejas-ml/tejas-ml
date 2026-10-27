import Link from "next/link";
import { notFound } from "next/navigation";
import { curriculum, getModule } from "@/lib/curriculum";
import { formatDuration } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ module: string }> };

export function generateStaticParams() {
  return curriculum.map((m) => ({ module: m.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { module: slug } = await params;
  const m = getModule(slug);
  if (!m) return { title: "Module" };
  return { title: m.title, description: m.description };
}

export default async function ModulePage({ params }: Props) {
  const { module: slug } = await params;
  const m = getModule(slug);
  if (!m) notFound();

  const totalMin = m.lessons.reduce((a, l) => a + l.duration, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/course"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        All modules
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-md"
          style={{ background: m.color }}
        >
          {String(m.number).padStart(2, "0")}
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {m.level} · {m.sections.length} submodules · {m.lessons.length} lessons ·{" "}
            {formatDuration(totalMin)}
          </span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{m.title}</h1>
          <p className="mt-2 text-foreground-muted">{m.description}</p>
        </div>
      </div>

      <div className="space-y-8">
        {m.sections.map((section, sIdx) => (
          <section key={section.id}>
            <div className="mb-3 border-b border-border pb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Submodule {m.number}.{sIdx + 1}
              </p>
              <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              <p className="mt-1 text-sm text-foreground-muted">{section.description}</p>
            </div>
            <ol className="space-y-3">
              {section.lessons.map((lesson, i) => (
                <li key={lesson.id}>
                  <Link
                    href={`/course/${m.slug}/${lesson.slug}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-background-elevated p-4 shadow-[var(--shadow)] transition hover:border-border-strong hover:shadow-[var(--shadow-lg)]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background-muted font-mono text-sm font-semibold text-foreground-muted">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold tracking-tight">{lesson.title}</p>
                      <p className="mt-0.5 text-sm text-foreground-muted">{lesson.summary}</p>
                    </div>
                    <span className="shrink-0 text-xs text-foreground-muted">
                      {lesson.duration} min
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
