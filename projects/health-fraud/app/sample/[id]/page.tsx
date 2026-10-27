import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Actions } from "@/components/Actions";
import { ShapBars } from "@/components/ShapBars";
import {
  claimsForProvider,
  fraudLabel,
  getClaim,
  usdExact,
  CLAIMS,
} from "@/lib/claims";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return CLAIMS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const claim = getClaim(id);
  return { title: claim ? claim.id : "Claim" };
}

export default async function ClaimPage({ params }: Props) {
  const { id } = await params;
  const claim = getClaim(id);
  if (!claim) notFound();
  const related = claimsForProvider(claim.npi, claim.id).slice(0, 6);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10">
      <Link
        href="/sample"
        className="text-[12px] tracking-[0.12em] uppercase text-muted hover:text-ink"
      >
        ← Sample
      </Link>

      <div className="mt-6 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[13px] text-muted">{claim.id}</p>
          <h1 className="mt-1 font-serif text-4xl italic">{claim.provider}</h1>
          <p className="mt-2 text-[13px] text-muted">
            {claim.specialty} · {claim.state} · NPI {claim.npi}
          </p>
        </div>
        <div className="text-left md:text-right">
          <p
            className={`font-serif text-6xl tabular leading-none ${
              claim.risk >= 72
                ? "text-flag"
                : claim.risk >= 42
                  ? "text-amber"
                  : "text-forest"
            }`}
          >
            {claim.risk}
          </p>
          <p className="mt-1 text-[11px] tracking-[0.16em] uppercase">
            {fraudLabel(claim.fraudType)} · {claim.status}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="paper-card p-6 md:p-8">
            <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
              CMS-1500 · {claim.date} · synthetic
            </p>
            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 text-[13px] sm:grid-cols-2 md:grid-cols-3">
              <Fact k="Patient" v={`${claim.patient}`} />
              <Fact k="Age / sex" v={`${claim.patientAge} / ${claim.patientSex}`} />
              <Fact k="Place of service" v={`${claim.pos} ${claim.posDesc}`} />
              <Fact k="CPT" v={`${claim.cpt}`} mono />
              <Fact k="Procedure" v={claim.cptDesc} />
              <Fact k="Units" v={String(claim.units)} />
              <Fact k="ICD-10" v={claim.icd10} mono />
              <Fact k="Diagnosis" v={claim.icdDesc} />
              <Fact
                k="Modifiers"
                v={claim.modifiers.length ? claim.modifiers.join(", ") : "—"}
              />
              <Fact k="Billed" v={usdExact(claim.billed)} />
              <Fact k="CMS fee" v={usdExact(claim.cmsFee)} />
              <Fact k="Allowed (est.)" v={usdExact(claim.allowed)} />
            </dl>
          </div>

          <div className="mt-8">
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
              Why it scored
            </p>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">{claim.note}</p>
            {claim.flags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {claim.flags.map((f) => (
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

          <div className="mt-10">
            <p className="mb-4 text-[11px] tracking-[0.16em] uppercase text-muted">
              SHAP drivers
            </p>
            <ShapBars items={claim.shap} />
          </div>

          {related.length > 0 && (
            <div className="mt-12">
              <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
                Other lines from this NPI
              </p>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/sample/${r.id}`}
                      className="flex items-center justify-between gap-4 py-3 text-[13px] hover:bg-paper-2/40"
                    >
                      <span className="font-mono text-[12px]">{r.id}</span>
                      <span className="hidden text-muted sm:inline">
                        {r.cpt} / {r.icd10}
                      </span>
                      <span className="text-muted">{fraudLabel(r.fraudType)}</span>
                      <span
                        className={`tabular ${r.risk >= 72 ? "text-flag" : "text-ink"}`}
                      >
                        {r.risk}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Actions id={claim.id} />
          <div className="border border-line p-5 text-[13px] leading-relaxed text-muted">
            <p className="text-[11px] tracking-[0.16em] uppercase text-ink">
              SIU note
            </p>
            <p className="mt-3">
              Synthetic claim. Use Confirm to practice the recoupment path,
              Clear to return the line to auto-pay, or Request records to mimic
              a medical-record chase.
            </p>
          </div>
          <Link
            href="/queue"
            className="border border-line px-4 py-3 text-center text-[12px] tracking-[0.12em] uppercase hover:border-ink"
          >
            Real CMS queue
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
