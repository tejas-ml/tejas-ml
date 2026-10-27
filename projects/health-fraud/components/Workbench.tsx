"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CLAIMS,
  PROVIDERS,
  fraudLabel,
  usd,
  usdExact,
  type FraudType,
} from "@/lib/claims";
import { ScorePanel } from "./ScorePanel";

const TYPES: Array<"all" | FraudType> = [
  "all",
  "upcoding",
  "unbundling",
  "duplicate",
  "phantom",
  "modifier",
  "clean",
];

export function Workbench() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [minRisk, setMinRisk] = useState(0);
  const [status, setStatus] = useState<"all" | "flagged" | "review" | "cleared">(
    "flagged",
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CLAIMS.filter((c) => {
      if (type !== "all" && c.fraudType !== type) return false;
      if (status !== "all" && c.status !== status) return false;
      if (c.risk < minRisk) return false;
      if (!needle) return true;
      return (
        c.id.toLowerCase().includes(needle) ||
        c.provider.toLowerCase().includes(needle) ||
        c.npi.includes(needle) ||
        c.cpt.includes(needle) ||
        c.icd10.toLowerCase().includes(needle)
      );
    });
  }, [q, type, minRisk, status]);

  const flagged = CLAIMS.filter((c) => c.status === "flagged").length;
  const review = CLAIMS.filter((c) => c.status === "review").length;
  const waste = CLAIMS.filter((c) => c.status !== "cleared").reduce(
    (s, c) => s + Math.max(0, c.billed - c.cmsFee),
    0,
  );

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10">
      <div className="flex flex-col gap-2 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
            Sample · synthetic CMS-1500
          </p>
          <h1 className="mt-2 font-serif text-4xl italic">Sample</h1>
        </div>
        <p className="max-w-sm text-[13px] leading-relaxed text-muted">
          Planted fraud labels on fake line items so you can open a case file.
          The live queue uses real CMS PUF. Default view is flagged.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        <Stat k="In queue" v={String(CLAIMS.length)} />
        <Stat k="Flagged" v={String(flagged)} hint="risk ≥ 72" />
        <Stat k="Needs review" v={String(review)} hint="42–71" />
        <Stat k="Excess billed" v={usd(waste)} hint="vs CMS fee" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-6">
          <label className="block">
            <span className="text-[11px] tracking-[0.16em] uppercase text-muted">
              Search
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="NPI, CPT, provider, id"
              className="mt-2 w-full border border-line bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-muted/60 focus:border-ink"
            />
          </label>

          <div>
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">Status</p>
            <div className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:gap-0">
              {(["flagged", "review", "cleared", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`border border-line px-2 py-1.5 text-[12px] lg:border-x-0 lg:border-t-0 lg:px-0 lg:py-2 lg:text-left lg:text-[13px] ${
                    status === s
                      ? "border-ink bg-ink text-paper lg:border-line lg:bg-transparent lg:text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">Pattern</p>
            <div className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:gap-0">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`border border-line px-2 py-1.5 text-[12px] lg:border-x-0 lg:border-t-0 lg:px-0 lg:py-2 lg:text-left lg:text-[13px] ${
                    type === t
                      ? "border-ink bg-ink text-paper lg:border-line lg:bg-transparent lg:text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {t === "all" ? "all patterns" : fraudLabel(t).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="flex justify-between text-[11px] tracking-[0.16em] uppercase text-muted">
              Min risk <span className="tabular text-ink">{minRisk}</span>
            </span>
            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={minRisk}
              onChange={(e) => setMinRisk(Number(e.target.value))}
              className="mt-4 w-full"
            />
          </label>

          <div>
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
              Provider risk
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {PROVIDERS.slice()
                .sort((a, b) => b.risk - a.risk)
                .slice(0, 6)
                .map((p) => (
                  <li key={p.npi} className="text-[12px]">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">{p.name}</span>
                      <span className="tabular text-flag">{p.risk}</span>
                    </div>
                    <div className="mt-1 h-px bg-paper-3">
                      <div
                        className="h-px bg-flag"
                        style={{ width: `${p.risk}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </aside>

        <div>
          <p className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-[12px] text-muted">
            <span>
              {rows.length} claim{rows.length === 1 ? "" : "s"}
            </span>
            <Link href="/queue" className="tracking-[0.08em] uppercase hover:text-ink">
              Real CMS queue →
            </Link>
          </p>
          <ul className="divide-y divide-line border border-line md:hidden">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/sample/${c.id}`} className="block px-3 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[12px]">{c.id}</span>
                    <span
                      className={`tabular font-medium ${
                        c.risk >= 72
                          ? "text-flag"
                          : c.risk >= 42
                            ? "text-amber"
                            : "text-forest"
                      }`}
                    >
                      {c.risk}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px]">{c.provider}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    {c.cpt} / {c.icd10} · {usdExact(c.billed)}
                  </p>
                  <p
                    className={`mt-1 text-[11px] tracking-[0.08em] uppercase ${
                      c.fraudType === "clean" ? "text-forest" : "text-flag"
                    }`}
                  >
                    {fraudLabel(c.fraudType)}
                  </p>
                </Link>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-3 py-10 text-center text-[13px] text-muted">
                No claims match these filters.
              </li>
            )}
          </ul>
          <div className="hidden overflow-x-auto border border-line md:block">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="border-b border-line bg-paper-2/60 text-[10px] tracking-[0.16em] uppercase text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Risk</th>
                  <th className="px-3 py-2 font-medium">Claim</th>
                  <th className="px-3 py-2 font-medium">Provider</th>
                  <th className="px-3 py-2 font-medium">CPT / ICD</th>
                  <th className="px-3 py-2 font-medium">Billed</th>
                  <th className="px-3 py-2 font-medium">Pattern</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper-2/40">
                    <td className="px-3 py-3">
                      <span
                        className={`tabular font-medium ${
                          c.risk >= 72
                            ? "text-flag"
                            : c.risk >= 42
                              ? "text-amber"
                              : "text-forest"
                        }`}
                      >
                        {c.risk}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/sample/${c.id}`} className="font-mono text-[12px] underline-offset-2 hover:underline">
                        {c.id}
                      </Link>
                      <p className="text-[11px] text-muted">{c.date}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p>{c.provider}</p>
                      <p className="font-mono text-[11px] text-muted">{c.npi}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px]">
                      {c.cpt}
                      <span className="text-muted"> / {c.icd10}</span>
                    </td>
                    <td className="px-3 py-3 tabular">{usdExact(c.billed)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`text-[11px] tracking-[0.08em] uppercase ${
                          c.fraudType === "clean" ? "text-forest" : "text-flag"
                        }`}
                      >
                        {fraudLabel(c.fraudType)}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-muted">
                      No claims match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ScorePanel />
    </div>
  );
}

function Stat({ k, v, hint }: { k: string; v: string; hint?: string }) {
  return (
    <div className="bg-paper px-4 py-5">
      <p className="text-[11px] tracking-[0.16em] uppercase text-muted">{k}</p>
      <p className="mt-2 font-serif text-3xl tabular">{v}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
