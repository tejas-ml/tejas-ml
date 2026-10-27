import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCmsLine, patternLabel, usdExact } from "@/lib/cms";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const line = await getCmsLine(id);
  return { title: line ? `${line.name} · ${line.hcpcs}` : "CMS line" };
}

export default async function QueueDetailPage({ params }: Props) {
  const { id } = await params;
  const line = await getCmsLine(decodeURIComponent(id));
  if (!line) notFound();

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10">
      <Link
        href="/queue"
        className="text-[12px] tracking-[0.12em] uppercase text-muted hover:text-ink"
      >
        ← Queue
      </Link>

      <div className="mt-6 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[13px] text-muted">{line.npi}</p>
          <h1 className="mt-1 font-serif text-4xl italic">{line.name}</h1>
          <p className="mt-2 text-[13px] text-muted">
            {line.specialty} · {line.city}, {line.state} {line.zip}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p
            className={`font-serif text-6xl tabular leading-none ${
              line.risk >= 72
                ? "text-flag"
                : line.risk >= 42
                  ? "text-amber"
                  : "text-forest"
            }`}
          >
            {line.risk}
          </p>
          <p className="mt-1 text-[11px] tracking-[0.16em] uppercase">
            {patternLabel(line.pattern)} · CMS 2024
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="paper-card p-6 md:p-8">
            <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
              Provider × service · CY 2024
            </p>
            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 text-[13px] sm:grid-cols-2 md:grid-cols-3">
              <Fact k="HCPCS" v={line.hcpcs} mono />
              <Fact k="Procedure" v={line.desc} />
              <Fact k="Place of service" v={`${line.pos} ${line.posLabel}`} />
              <Fact k="Services" v={line.services.toLocaleString()} />
              <Fact k="Beneficiaries" v={line.benes.toLocaleString()} />
              <Fact k="Services / bene" v={line.intensity.toFixed(2)} />
              <Fact k="Avg submitted charge" v={usdExact(line.charge)} />
              <Fact k="Avg Medicare allowed" v={usdExact(line.allowed)} />
              <Fact k="Avg Medicare paid" v={usdExact(line.paid)} />
            </dl>
          </div>

          <div className="mt-8">
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
              Why it scored
            </p>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">{line.note}</p>
            {line.flags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {line.flags.map((f) => (
                  <li
                    key={f}
                    className="border border-flag/30 bg-flag-soft/40 px-2 py-1 text-[11px] tracking-[0.06em] uppercase text-flag"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="border border-line p-5 text-[13px] leading-relaxed text-muted">
            <p className="text-[11px] tracking-[0.16em] uppercase text-ink">
              Public file
            </p>
            <p className="mt-3">
              Aggregated Medicare FFS line items. CMS suppresses small cells.
              This is not a patient claim and not an accusation.
            </p>
            <a
              href={`https://data.cms.gov/tools/medicare-physician-other-practitioner-look-up-tool?keyword=${line.npi}`}
              className="mt-4 inline-block text-[12px] tracking-[0.08em] uppercase hover:text-ink"
              target="_blank"
              rel="noreferrer"
            >
              CMS look-up tool →
            </a>
          </div>
          <Link
            href="/sample"
            className="border border-line px-4 py-3 text-center text-[12px] tracking-[0.12em] uppercase hover:border-ink"
          >
            Synthetic sample
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Fact({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.16em] uppercase text-muted">{k}</dt>
      <dd className={`mt-1 leading-snug ${mono ? "font-mono text-[12px]" : ""}`}>
        {v}
      </dd>
    </div>
  );
}
