import Link from "next/link";
import { ArrowRight, BookOpen, Code2, Layers, Shield, Sparkles, Terminal, Zap } from "lucide-react";
import { curriculum, courseStats } from "@/lib/curriculum";
import { formatDuration } from "@/lib/utils";

export default function HomePage() {
  const stats = courseStats();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, var(--accent-soft), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background-elevated px-3 py-1 text-xs font-medium text-foreground-muted shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Beginner → Pro · Systems + Quant Math
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Learn Rust.{" "}
              <span className="text-accent">Build quant systems.</span>
            </h1>
            <p className="mt-5 text-lg text-foreground-muted sm:text-xl">
              A complete interactive path from first{" "}
              <code className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-[0.9em] text-rust">
                println!
              </code>{" "}
              to Black-Scholes, Monte Carlo, VaR, and production-minded pricing engines — with live
              code you run in the browser.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/course"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover"
              >
                Start the course
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/playground"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background-elevated px-5 text-sm font-semibold text-foreground shadow-sm transition hover:border-border-strong"
              >
                <Terminal className="h-4 w-4" />
                Open playground
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-foreground-muted">
              <span>
                <strong className="text-foreground">{stats.modules}</strong> modules
              </span>
              <span>
                <strong className="text-foreground">{stats.sections}</strong> submodules
              </span>
              <span>
                <strong className="text-foreground">{stats.lessons}</strong> lessons
              </span>
              <span>
                <strong className="text-foreground">~{stats.hours}h</strong> content
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Code2,
              title: "Run real Rust",
              body: "Monaco editor + Rust Playground compiler. Type, run, iterate — no local install required for lessons.",
            },
            {
              icon: BookOpen,
              title: "Beginner to pro path",
              body: "Ownership, interview DS (maps, sets, heaps, stdin), traits, concurrency — then BS, MC, and risk.",
            },
            {
              icon: Layers,
              title: "std + library mindset",
              body: "Master the standard library online; learn the crates quants use offline (serde, rayon, ndarray…).",
            },
            {
              icon: Zap,
              title: "Quant finance focus",
              body: "Not toy examples only — returns, Greeks, order books, portfolios, VaR, and a pricing-engine capstone.",
            },
            {
              icon: Shield,
              title: "Easy on the eyes",
              body: "Warm off-white light mode and soft dark mode. Designed for long study sessions.",
            },
            {
              icon: Sparkles,
              title: "Progress that sticks",
              body: "Mark lessons complete in your browser. Pick up where you left off anytime.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-background-elevated p-6 shadow-[var(--shadow)]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum preview */}
      <section className="border-t border-border bg-background-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Curriculum</h2>
              <p className="mt-2 text-foreground-muted">
                Thirteen modules with guided submodules — foundations, interview data structures, then quant systems.
              </p>
            </div>
            <Link href="/course" className="text-sm font-semibold text-accent hover:text-accent-hover">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {curriculum.map((m) => (
              <Link
                key={m.id}
                href={`/course/${m.slug}`}
                className="group rounded-2xl border border-border bg-background-elevated p-5 shadow-[var(--shadow)] transition hover:border-border-strong hover:shadow-[var(--shadow-lg)]"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {String(m.number).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold tracking-tight group-hover:text-accent">
                        {m.title}
                      </h3>
                      <span className="rounded-full bg-background-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        {m.level}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted line-clamp-2">{m.description}</p>
                    <p className="mt-2 text-xs text-foreground-muted">
                      {m.sections.length} submodules · {m.lessons.length} lessons ·{" "}
                      {formatDuration(m.lessons.reduce((a, l) => a + l.duration, 0))}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-accent-soft to-background-elevated px-8 py-12 text-center shadow-[var(--shadow-lg)]">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to write safer, faster finance code?</h2>
          <p className="mx-auto mt-3 max-w-xl text-foreground-muted">
            Start with Hello World, finish with a multi-leg options book priced in pure Rust.
          </p>
          <Link
            href="/course/foundations/why-rust"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-md transition hover:bg-accent-hover"
          >
            Lesson 1 — Why Rust for Finance?
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
