import type { Metadata } from "next";
import Link from "next/link";
import { FEATURE_IMPORTANCE, MODEL } from "@/lib/claims";

export const metadata: Metadata = {
  title: "Model card",
  description: "XGBoost claims fraud classifier — metrics, holdout matrix, and intended use.",
};

export default function ModelPage() {
  const { holdout } = MODEL;
  const n = holdout.tn + holdout.fp + holdout.fn + holdout.tp;
  const cell = (v: number) => `${v.toLocaleString()} · ${((v / n) * 100).toFixed(1)}%`;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12">
      <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
        Model card
      </p>
      <h1 className="mt-3 font-serif text-4xl italic md:text-5xl">
        XGBoost, with a forest in the packet.
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">
        Binary classifier on claim lines. Positive class = SIU-worthy
        (upcoding, unbundling, duplicate, phantom, or modifier abuse). The
        Random Forest is not the production scorer — it is the explainer SIU
        reviewers still trust when a tree ensemble feels like a black box.
      </p>

      <dl className="mt-12 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        <M k="Training lines" v="512,448" />
        <M k="ROC AUC" v={MODEL.auc.toFixed(3)} />
        <M k="Precision" v={MODEL.precision.toFixed(2)} />
        <M k="Recall" v={MODEL.recall.toFixed(2)} />
      </dl>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Holdout confusion</h2>
        <p className="mt-3 max-w-xl text-[14px] text-muted">
          48,210 lines, stratified 15% holdout. Threshold chosen for 0.91
          precision so the SIU queue is not a junk drawer.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full max-w-xl border border-line text-center text-[13px]">
            <thead>
              <tr className="border-b border-line bg-paper-2/60 text-[10px] tracking-[0.14em] uppercase text-muted">
                <th className="px-3 py-2" />
                <th className="px-3 py-2 font-medium">Pred clean</th>
                <th className="px-3 py-2 font-medium">Pred SIU</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <th className="px-3 py-6 text-left text-[10px] tracking-[0.14em] uppercase text-muted">
                  True clean
                </th>
                <td className="bg-forest-soft/50 px-3 py-6 tabular">{cell(holdout.tn)}</td>
                <td className="px-3 py-6 tabular">{cell(holdout.fp)}</td>
              </tr>
              <tr>
                <th className="px-3 py-6 text-left text-[10px] tracking-[0.14em] uppercase text-muted">
                  True SIU
                </th>
                <td className="px-3 py-6 tabular">{cell(holdout.fn)}</td>
                <td className="bg-flag-soft/60 px-3 py-6 tabular">{cell(holdout.tp)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl">Gain</h2>
          <ul className="mt-6 flex flex-col gap-4">
            {FEATURE_IMPORTANCE.map((f) => (
              <li key={f.name}>
                <div className="flex justify-between gap-4 text-[13px]">
                  <span className="font-mono text-[12px]">{f.name}</span>
                  <span className="tabular">{(f.weight * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-1 h-1 bg-paper-2">
                  <div className="h-1 bg-ink" style={{ width: `${f.weight * 400}%` }} />
                </div>
                <p className="mt-1 text-[12px] text-muted">{f.note}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-3xl">Intended use</h2>
          <ul className="mt-6 flex flex-col gap-4 text-[14px] leading-relaxed text-muted">
            <li>— Pre-payment scoring for commercial, Medicare Advantage, and Medicaid lines.</li>
            <li>— Post-payment sampling where the contract already paid.</li>
            <li>— Provider education packets: 99215 rate vs peer, not a guilt score.</li>
            <li className="text-ink">
              Not for: denying medically necessary care, patient-level risk, or
              any decision that uses real PHI in this demo.
            </li>
          </ul>
          <div className="mt-8 border border-line p-5">
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
              Outcome
            </p>
            <p className="mt-3 font-serif text-xl italic leading-snug">
              Flagging the top 4.2% of lines cut manual audit volume 30% while
              holding precision at 0.91 on holdout.
            </p>
          </div>
        </div>
      </section>

      <Link
        href="/queue"
        className="mt-12 inline-block border border-ink bg-ink px-4 py-2.5 text-[12px] tracking-[0.14em] text-paper uppercase hover:bg-transparent hover:text-ink"
      >
        Score the queue
      </Link>
    </div>
  );
}

function M({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-paper px-4 py-5">
      <dt className="text-[11px] tracking-[0.16em] uppercase text-muted">{k}</dt>
      <dd className="mt-2 font-serif text-3xl tabular">{v}</dd>
    </div>
  );
}
