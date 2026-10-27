"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/queue", label: "Queue" },
  { href: "/sample", label: "Sample" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/model", label: "Model" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-6 w-6 place-items-center border border-ink">
            <span className="h-2 w-full bg-flag" />
          </span>
          <span className="text-[13px] font-medium tracking-[0.18em] uppercase">Aegis</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] text-muted md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                path === l.href || path.startsWith(l.href + "/")
                  ? "text-ink"
                  : "hover:text-ink"
              }
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/queue"
            className="border border-ink bg-ink px-3 py-1.5 text-[12px] tracking-[0.12em] text-paper uppercase hover:bg-transparent hover:text-ink"
          >
            Open queue
          </Link>
        </nav>

        <button
          type="button"
          className="border border-line px-2 py-1 text-[11px] tracking-[0.14em] uppercase text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="border-t border-line px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-[14px]">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/queue" onClick={() => setOpen(false)} className="text-flag">
              Open queue
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
