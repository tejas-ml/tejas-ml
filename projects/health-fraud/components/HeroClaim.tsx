import Link from "next/link";
import { CLAIMS, usdExact } from "@/lib/claims";

export function HeroClaim() {
  const claim = CLAIMS.find((c) => c.id === "AEG-26-00041") ?? CLAIMS[0];

  return (
    <Link
      href={`/sample/${claim.id}`}
      className="paper-card relative block min-w-0 max-w-full p-6 md:p-8"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
            CMS-1500 · Line item
          </p>
          <p className="mt-1 font-mono text-[13px]">{claim.id}</p>
        </div>
        <div className="stamp shrink-0 text-[10px] md:text-[11px]">Flagged</div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 text-[13px] sm:grid-cols-2 md:grid-cols-3">
        <Item k="Rendering NPI" v={claim.npi} mono />
        <Item k="Provider" v={claim.provider} />
        <Item k="Specialty" v={claim.specialty} />
        <Item k="CPT" v={`${claim.cpt}  ${claim.cptDesc}`} mono />
        <Item k="ICD-10" v={`${claim.icd10}  ${claim.icdDesc}`} mono />
        <Item k="POS" v={`${claim.pos}  ${claim.posDesc}`} />
        <Item k="Billed" v={usdExact(claim.billed)} mono />
        <Item k="CMS fee" v={usdExact(claim.cmsFee)} mono />
        <Item k="Patient" v={`${claim.patient} · ${claim.patientAge}${claim.patientSex}`} />
      </dl>

      <div className="mt-6 border-t border-line pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.16em] uppercase text-flag">
              Model output · upcoding
            </p>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted">
              Level-5 office visit billed for an unspecified cold. Provider 99215
              rate is 4.8× the family-medicine peer group.
            </p>
          </div>
          <p className="font-serif text-5xl tabular leading-none">
            0.{claim.risk}
          </p>
        </div>
      </div>

      <p className="mt-5 text-[11px] tracking-[0.14em] uppercase text-muted">
        Open the case file →
      </p>
    </Link>
  );
}

function Item({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.16em] uppercase text-muted">{k}</dt>
      <dd className={`mt-1 leading-snug ${mono ? "font-mono text-[12px]" : ""}`}>{v}</dd>
    </div>
  );
}
