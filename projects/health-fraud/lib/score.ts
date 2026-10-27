import { CPT_OPTIONS, ICD_OPTIONS, PROVIDERS } from "./claims";

export type ScoreInput = {
  cpt: string;
  icd10: string;
  billed: number;
  npi: string;
  units: number;
  weekend: boolean;
  modifier25: boolean;
  duplicate: boolean;
};

export type ScoreResult = {
  risk: number;
  label: "flagged" | "review" | "cleared";
  type: string;
  reasons: string[];
  shap: { feature: string; impact: number }[];
};

export function scoreClaim(input: ScoreInput): ScoreResult {
  const cpt = CPT_OPTIONS.find((c) => c.code === input.cpt);
  const icd = ICD_OPTIONS.find((c) => c.code === input.icd10);
  const provider = PROVIDERS.find((p) => p.npi === input.npi);
  const fee = cpt?.fee ?? 100;
  const sev = icd?.sev ?? 2;
  const emLevel = ["99215", "99205"].includes(input.cpt)
    ? 5
    : ["99214", "99204"].includes(input.cpt)
      ? 4
      : ["99213", "99203"].includes(input.cpt)
        ? 3
        : 0;
  const billedToFee = input.billed / (fee * Math.max(input.units, 1));

  let risk = 8;
  const shap: { feature: string; impact: number }[] = [];
  const reasons: string[] = [];
  let type = "clean";

  const gap = emLevel > 0 ? emLevel - sev : 0;
  if (gap >= 3) {
    risk += 38;
    shap.push({ feature: "cpt_icd_severity_gap", impact: 0.31 });
    reasons.push(`${input.cpt} is a high-complexity E/M; ${input.icd10} is severity ${sev}.`);
    type = "upcoding";
  } else if (gap === 2) {
    risk += 18;
    shap.push({ feature: "cpt_icd_severity_gap", impact: 0.14 });
    reasons.push("E/M level sits two steps above diagnosis severity.");
  } else {
    shap.push({ feature: "cpt_icd_severity_gap", impact: -0.12 });
  }

  if (billedToFee > 1.7) {
    risk += 18;
    shap.push({ feature: "billed_to_cms_fee", impact: 0.18 });
    reasons.push(`Billed ${billedToFee.toFixed(1)}× the CMS fee schedule.`);
    if (type === "clean") type = "fee outlier";
  } else if (billedToFee > 1.25) {
    risk += 8;
    shap.push({ feature: "billed_to_cms_fee", impact: 0.08 });
  } else {
    shap.push({ feature: "billed_to_cms_fee", impact: -0.08 });
  }

  if (provider && provider.own99215 > provider.peer99215 * 2 && emLevel === 5) {
    risk += 16;
    shap.push({ feature: "provider_99215_vs_peer", impact: 0.2 });
    reasons.push(
      `${provider.name} bills 99215 at ${(provider.own99215 * 100).toFixed(0)}% vs ${(provider.peer99215 * 100).toFixed(0)}% peer.`,
    );
    type = "upcoding";
  }

  if (["80048", "80053", "20610"].includes(input.cpt) && input.units >= 3) {
    risk += 24;
    shap.push({ feature: "panel_component_overlap", impact: 0.26 });
    reasons.push("Unit count looks like a panel split into component lines (unbundling).");
    type = "unbundling";
  }

  if (input.duplicate) {
    risk += 28;
    shap.push({ feature: "same_day_duplicate", impact: 0.3 });
    reasons.push("Same NPI, patient, CPT, and date of service already exists.");
    type = "duplicate";
  }

  if (input.weekend && (emLevel === 5 || input.units >= 6)) {
    risk += 12;
    shap.push({ feature: "weekend_high_complexity", impact: 0.12 });
    reasons.push("High-complexity or high-unit work on a weekend.");
    if (type === "clean") type = "phantom";
  }

  if (input.modifier25 && emLevel >= 4) {
    risk += 8;
    shap.push({ feature: "modifier_25_59_density", impact: 0.1 });
    reasons.push("Modifier 25 on a high-level E/M without a documented separate procedure.");
    if (type === "clean") type = "modifier";
  }

  risk = Math.max(4, Math.min(98, Math.round(risk)));
  const label = risk >= 72 ? "flagged" : risk >= 42 ? "review" : "cleared";
  if (reasons.length === 0) reasons.push("Amounts, codes, and provider mix are internally consistent.");
  shap.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return { risk, label, type, reasons, shap };
}
