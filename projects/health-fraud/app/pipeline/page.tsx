import type { Metadata } from "next";
import Link from "next/link";
import { PIPELINE } from "@/lib/claims";

export const metadata: Metadata = {
  title: "Pipeline",
  description: "How Aegis ingests CMS claims, builds dbt marts, and scores with XGBoost.",
};

const grains = [
  {
    name: "stg_cms_carrier_lines",
    grain: "claim line",
    tests: "unique claim_line_id · not_null npi, cpt, icd10, dos",
  },
  {
    name: "int_provider_day",
    grain: "npi × date",
    tests: "accepted_values pos · relationships to dim_npi",
  },
  {
    name: "int_ncci_edits",
    grain: "cpt pair",
    tests: "PTP modifier indicator in (0,1,9)",
  },
  {
    name: "fct_claim_scored",
    grain: "claim line",
    tests: "risk between 0 and 100 · fraud_type accepted values",
  },
];

const features = [
  ["cpt_icd_severity_gap", "E/M MDM level minus mapped ICD severity (1–5)."],
  ["billed_to_cms_fee", "Charged amount / Medicare PFS allowed for that CPT × locality."],
  ["provider_99215_vs_peer", "Trailing 12-month 99215 share minus specialty-state peer."],
  ["same_day_duplicate", "Collision on npi + mbi_hash + cpt + dos."],
  ["panel_component_overlap", "Count of NCCI-inclusive components billed with a parent panel."],
  ["modifier_25_59_density", "25/59 rate vs specialty p50 / p90."],
  ["weekend_high_complexity", "High RVU on Saturday/Sunday with office POS."],
  ["units_vs_specialty_p95", "Units above the 95th percentile for that CPT and specialty."],
];

export default function PipelinePage() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12">
      <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
        Methodology
      </p>
      <h1 className="mt-3 max-w-3xl font-serif text-4xl italic md:text-5xl">
        From a CMS tape to a ranked queue.
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">
        Aegis is a batch-first payment-integrity pipeline. Public CMS carrier
        files and a labeled synthetic overlay land in Snowflake. dbt builds the
        features. XGBoost scores the line. This console is the last mile.
      </p>

      <ol className="mt-14 divide-y divide-line border-y border-line">
        {PIPELINE.map((s) => (
          <li
            key={s.step}
            className="grid gap-3 py-8 md:grid-cols-[88px_1fr] md:gap-10"
          >
            <span className="font-mono text-[13px] text-flag">{s.step}</span>
            <div>
              <h2 className="font-serif text-3xl">{s.title}</h2>
              <p className="mt-1 font-mono text-[12px] text-muted">{s.tool}</p>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">dbt grains</h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
          Tests run in CI. A broken unique key on claim_line_id fails the
          build before a model is trained on duplicates of duplicates.
        </p>
        <div className="mt-8 overflow-x-auto border border-line">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-line bg-paper-2/60 text-[10px] tracking-[0.16em] uppercase text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Model</th>
                <th className="px-4 py-2 font-medium">Grain</th>
                <th className="px-4 py-2 font-medium">Tests</th>
              </tr>
            </thead>
            <tbody>
              {grains.map((g) => (
                <tr key={g.name} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-[12px]">{g.name}</td>
                  <td className="px-4 py-3">{g.grain}</td>
                  <td className="px-4 py-3 text-muted">{g.tests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Features the tree actually uses</h2>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {features.map(([name, body]) => (
            <li
              key={name}
              className="grid gap-2 py-4 md:grid-cols-[240px_1fr] md:gap-8"
            >
              <span className="font-mono text-[12px]">{name}</span>
              <span className="text-[14px] text-muted">{body}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-[13px] text-muted">
        Labels come from a mix of NCCI-hard violations, SIU-style rule hits, and
        a planted fraud overlay so precision/recall is measurable. Production
        would replace the overlay with recovered overpayment outcomes.
      </p>
      <Link
        href="/model"
        className="mt-6 inline-block text-[12px] tracking-[0.12em] uppercase hover:text-muted"
      >
        Model card →
      </Link>
    </div>
  );
}
