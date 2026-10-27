import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background-elevated">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold tracking-tight">
            Rust<span className="text-accent">→</span>Quant
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            Beginner Rust to professional quant finance — interactive & easy on the eyes.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-foreground-muted">
          <Link href="/course" className="hover:text-accent">
            Course
          </Link>
          <Link href="/playground" className="hover:text-accent">
            Playground
          </Link>
          <a
            href="https://doc.rust-lang.org/book/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent"
          >
            The Book
          </a>
        </div>
      </div>
    </footer>
  );
}
