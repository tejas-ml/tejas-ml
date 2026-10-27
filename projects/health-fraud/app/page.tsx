import Link from "next/link";
import { HeroClaim } from "@/components/HeroClaim";
import { LiveTicker } from "@/components/LiveTicker";
import { CLAIMS, FEATURE_IMPORTANCE, MODEL, PIPELINE } from "@/lib/claims";

const targets = [
  {
    name: "UnitedHealth Group",
    role: "National payer · SIU & payment integrity",
  },
  {
    name: "Anthem / Elevance",
    role: "Commercial and Medicaid claims integrity",
  },
  {
    name: "Optum",
    role: "Analytics, payment integrity, provider networks",
  },
  {
    name: "Zocdoc",
    role: "Appointment + billing quality at the front door",
  },
];

const patterns = [
  {
    code: "99215",
    title: "Upcoding",
    body: "A high-complexity office visit billed for a simple issue — a cold, a headache, a wellness exam. The CPT asks for extensive MDM. The ICD does not.",
  },
  {
    code: "80053",
    title: "Unbundling",
    body: "A comprehensive metabolic panel split into seven separately payable lab lines, or an inclusive procedure pair forced apart with modifier 59.",
  },
  {
    code: "×2",
    title: "Duplicates",
    body: "The same NPI, patient, CPT, and date of service, twice. Sometimes with a repeat modifier. Often with no new indication.",
  },
  {
    code: "POS",
    title: "Phantom & setting",
    body: "High-unit injections on a Saturday from an office that does not operate those hours, and no matching facility claim.",
  },
];

export default function Home() {
  const sample = CLAIMS.filter((c) => c.status === "flagged").length;

  return (
    <>
      <section className="mx-auto max-w-[1180px] px-5 pt-14 md:pt-20">
        <p className="text-[11px] tracking-[0.2em] uppercase text-muted">
          Project 04 · Claims fraud & waste
        </p>
        <h1 className="mt-5 max-w-4xl font-serif text-[34px] leading-[1.12] tracking-tight sm:text-[44px] md:text-[68px]">
          Flag the claim
          <span className="block">
            <span className="italic">before</span> it pays.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted">
          Health insurance payers process billions of claims. A large share are
          fraudulent, miscoded, or duplicated. Aegis is an XGBoost classifier
          that reads CMS-style claims the way a special investigations unit
          would — and surfaces upcoding, unbundling, and duplicate billing
          before the check goes out.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/queue"
            className="inline-flex items-center justify-center border border-ink bg-ink px-4 py-2.5 text-[12px] tracking-[0.14em] text-paper uppercase hover:bg-transparent hover:text-ink"
          >
            Open the queue
          </Link>
          <Link
            href="/pipeline"
            className="inline-flex items-center justify-center border border-line px-4 py-2.5 text-[12px] tracking-[0.14em] uppercase hover:border-ink"
          >
            See the pipeline
          </Link>
        </div>
      </section>

      <div className="mt-14">
        <LiveTicker />
      </div>

      <section className="mx-auto grid max-w-[1180px] gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <HeroClaim />
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
            01 · The problem
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
            Billions of lines. A handful of patterns that cost real money.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            Upcoding a 99213 to a 99215 does not look dramatic on a single
            CMS-1500. Across a panel, it is a practice. Unbundling a lab panel
            is a line-item habit. Duplicates are software. Aegis scores every
            line against peer rates, the Medicare fee schedule, and NCCI edits
            so auditors stop sampling at random.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line">
            <Stat k="Claims scored" v="512,448" />
            <Stat k="Flag rate" v="4.2%" />
            <Stat k="Est. waste" v="$47.2M" />
            <Stat k="Audit load" v="−30%" />
          </dl>
        </div>
      </section>

      <section className="border-y border-line bg-paper-2/40">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
            02 · What the model flags
          </p>
          <div className="mt-8 grid gap-px border border-line bg-line md:grid-cols-2">
            {patterns.map((p) => (
              <article key={p.title} className="bg-paper p-6 md:p-8">
                <p className="font-mono text-[12px] text-flag">{p.code}</p>
                <h3 className="mt-3 font-serif text-2xl">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
          03 · Pipeline
        </p>
        <h2 className="mt-3 max-w-2xl font-serif text-3xl md:text-4xl">
          CMS claims in. A ranked SIU queue out.
        </h2>
        <ol className="mt-10 divide-y divide-line border-y border-line">
          {PIPELINE.map((s) => (
            <li key={s.step} className="grid gap-2 py-5 md:grid-cols-[72px_200px_1fr] md:gap-8">
              <span className="font-mono text-[12px] text-muted">{s.step}</span>
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">{s.tool}</p>
              </div>
              <p className="text-[14px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <Link
          href="/pipeline"
          className="mt-6 inline-block text-[13px] tracking-[0.08em] uppercase text-muted hover:text-ink"
        >
          Full methodology →
        </Link>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
            04 · Stack
          </p>
          <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-5">
            {["Python", "XGBoost / RF", "dbt", "Snowflake", "Next.js UI"].map(
              (t) => (
                <p
                  key={t}
                  className="border-t border-ink pt-3 text-[14px] tracking-[0.04em]"
                >
                  {t}
                </p>
              ),
            )}
          </div>
          <p className="mt-8 max-w-2xl text-[14px] leading-relaxed text-muted">
            Research scoring ran in Python with an XGBoost classifier and a
            Random Forest baseline. Features are built in dbt on Snowflake from
            CMS public use files plus a synthetic overlay. An earlier Streamlit
            app was the lab notebook. This console is the SIU product surface.
          </p>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
                Feature importance
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {FEATURE_IMPORTANCE.map((f) => (
                  <li key={f.name}>
                    <div className="flex items-baseline justify-between gap-4 text-[13px]">
                      <span className="font-mono text-[12px]">{f.name}</span>
                      <span className="tabular text-muted">
                        {(f.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-1 bg-paper-2">
                      <div
                        className="h-1 bg-ink"
                        style={{ width: `${f.weight * 100 * 4}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="paper-card p-6 md:p-8">
              <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
                Holdout · 48,210 lines
              </p>
              <p className="mt-4 font-serif text-5xl tabular">
                {MODEL.auc.toFixed(3)}
              </p>
              <p className="mt-1 text-[13px] text-muted">ROC AUC</p>
              <dl className="mt-6 grid grid-cols-3 gap-4 text-[13px]">
                <div>
                  <dt className="text-muted">Precision</dt>
                  <dd className="mt-1 font-serif text-2xl tabular">
                    {MODEL.precision.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Recall</dt>
                  <dd className="mt-1 font-serif text-2xl tabular">
                    {MODEL.recall.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">F1</dt>
                  <dd className="mt-1 font-serif text-2xl tabular">
                    {MODEL.f1.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <Link
                href="/model"
                className="mt-6 inline-block text-[12px] tracking-[0.12em] uppercase text-muted hover:text-ink"
              >
                Model card →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-16">
        <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
          05 · Built for
        </p>
        <h2 className="mt-3 font-serif text-3xl md:text-4xl">
          Payment integrity teams who already know the patterns.
        </h2>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {targets.map((t) => (
            <li
              key={t.name}
              className="flex flex-col gap-1 py-5 md:flex-row md:items-baseline md:justify-between"
            >
              <p className="text-[16px]">{t.name}</p>
              <p className="text-[13px] text-muted">{t.role}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-[14px] leading-relaxed text-muted">
          The live queue is real CMS Medicare Part B public use data (CY 2024),
          aggregated to provider and service. {sample} synthetic flagged lines
          remain in Sample for the case-file walkthrough. No PHI.
        </p>
        <Link
          href="/queue"
          className="mt-8 inline-block border border-ink bg-ink px-4 py-2.5 text-[12px] tracking-[0.14em] text-paper uppercase hover:bg-transparent hover:text-ink"
        >
          Work the queue
        </Link>
      </section>
    </>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-paper px-4 py-5">
      <dt className="text-[11px] tracking-[0.16em] uppercase text-muted">{k}</dt>
      <dd className="mt-2 font-serif text-3xl tabular">{v}</dd>
    </div>
  );
}
