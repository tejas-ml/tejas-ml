"use client";

import { useMemo, useState } from "react";
import { CPT_OPTIONS, ICD_OPTIONS, PROVIDERS, usdExact } from "@/lib/claims";
import { scoreClaim } from "@/lib/score";
import { ShapBars } from "./ShapBars";

export function ScorePanel() {
  const [cpt, setCpt] = useState("99215");
  const [icd10, setIcd] = useState("J06.9");
  const [npi, setNpi] = useState(PROVIDERS[0]!.npi);
  const [billed, setBilled] = useState(412);
  const [units, setUnits] = useState(1);
  const [weekend, setWeekend] = useState(false);
  const [modifier25, setMod] = useState(false);
  const [duplicate, setDup] = useState(false);

  const result = useMemo(
    () =>
      scoreClaim({
        cpt,
        icd10,
        billed,
        npi,
        units,
        weekend,
        modifier25,
        duplicate,
      }),
    [cpt, icd10, billed, npi, units, weekend, modifier25, duplicate],
  );

  const fee = CPT_OPTIONS.find((c) => c.code === cpt)?.fee ?? 0;

  return (
    <section className="mt-16 border-t border-line pt-10">
      <div className="md:flex md:items-end md:justify-between">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-muted">
            Interactive scorer
          </p>
          <h2 className="mt-2 font-serif text-3xl italic">Run a claim through the model</h2>
        </div>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted md:mt-0">
          A calibrated stand-in for the XGBoost scorer. Change the codes and watch
          the risk and SHAP drivers move.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form className="grid grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
          <Field label="CPT">
            <select
              value={cpt}
              onChange={(e) => {
                setCpt(e.target.value);
                const next = CPT_OPTIONS.find((c) => c.code === e.target.value);
                if (next) setBilled(Math.round(next.fee * 1.1));
              }}
              className="mt-1.5 w-full border border-line bg-transparent px-3 py-2 text-[13px] outline-none focus:border-ink"
            >
              {CPT_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.desc}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ICD-10">
            <select
              value={icd10}
              onChange={(e) => setIcd(e.target.value)}
              className="mt-1.5 w-full border border-line bg-transparent px-3 py-2 text-[13px] outline-none focus:border-ink"
            >
              {ICD_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.desc}
                </option>
              ))}
            </select>
          </Field>
          <label className="col-span-2 block text-[11px] tracking-[0.16em] uppercase text-muted">
            Provider
            <select
              value={npi}
              onChange={(e) => setNpi(e.target.value)}
              className="mt-1.5 w-full border border-line bg-transparent px-3 py-2 text-[13px] normal-case tracking-normal outline-none focus:border-ink"
            >
              {PROVIDERS.map((p) => (
                <option key={p.npi} value={p.npi}>
                  {p.name} · {p.specialty}
                </option>
              ))}
            </select>
          </label>
          <Field label="Billed">
            <input
              type="number"
              value={billed}
              min={0}
              onChange={(e) => setBilled(Number(e.target.value))}
              className="mt-1.5 w-full border border-line bg-transparent px-3 py-2 text-[13px] outline-none focus:border-ink"
            />
          </Field>
          <Field label="Units">
            <input
              type="number"
              value={units}
              min={1}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="mt-1.5 w-full border border-line bg-transparent px-3 py-2 text-[13px] outline-none focus:border-ink"
            />
          </Field>
          <label className="flex items-center gap-2 text-[13px] tracking-normal normal-case">
            <input type="checkbox" checked={weekend} onChange={(e) => setWeekend(e.target.checked)} />
            Weekend service
          </label>
          <label className="flex items-center gap-2 text-[13px] tracking-normal normal-case">
            <input type="checkbox" checked={modifier25} onChange={(e) => setMod(e.target.checked)} />
            Modifier 25
          </label>
          <label className="col-span-2 flex items-center gap-2 text-[13px] tracking-normal normal-case">
            <input type="checkbox" checked={duplicate} onChange={(e) => setDup(e.target.checked)} />
            Same-day duplicate already on file
          </label>
        </form>

        <div className="paper-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] tracking-[0.16em] uppercase text-muted">
                Score · {result.type}
              </p>
              <p
                className={`mt-2 font-serif text-6xl tabular leading-none ${
                  result.label === "flagged"
                    ? "text-flag"
                    : result.label === "review"
                      ? "text-amber"
                      : "text-forest"
                }`}
              >
                {result.risk}
              </p>
              <p className="mt-2 text-[12px] tracking-[0.14em] uppercase">
                {result.label}
              </p>
            </div>
            <p className="text-right font-mono text-[11px] text-muted">
              CMS fee {usdExact(fee)}
              <br />
              billed {usdExact(billed)}
            </p>
          </div>
          <ul className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
            {result.reasons.map((r) => (
              <li key={r}>— {r}</li>
            ))}
          </ul>
          <div className="mt-6">
            <ShapBars items={result.shap} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[11px] tracking-[0.16em] uppercase text-muted">
      {label}
      {children}
    </label>
  );
}
