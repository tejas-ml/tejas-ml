export type CmsPattern =
  | "upcoding"
  | "fee-outlier"
  | "injection"
  | "lab"
  | "watch";

export type CmsLine = {
  id: string;
  npi: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
  zip: string;
  hcpcs: string;
  desc: string;
  pos: string;
  posLabel: string;
  services: number;
  benes: number;
  intensity: number;
  charge: number;
  allowed: number;
  paid: number;
  ratio: number;
  risk: number;
  flags: string[];
  pattern: CmsPattern;
  note: string;
};

export type CmsQueueResult = {
  lines: CmsLine[];
  year: number;
  source: string;
  error?: string;
};

type CmsRaw = {
  Rndrng_NPI: string;
  Rndrng_Prvdr_Last_Org_Name: string;
  Rndrng_Prvdr_First_Name: string;
  Rndrng_Prvdr_Crdntls: string;
  Rndrng_Prvdr_Ent_Cd: string;
  Rndrng_Prvdr_City: string;
  Rndrng_Prvdr_State_Abrvtn: string;
  Rndrng_Prvdr_Zip5: string;
  Rndrng_Prvdr_Type: string;
  HCPCS_Cd: string;
  HCPCS_Desc: string;
  Place_Of_Srvc: string;
  Tot_Benes: string;
  Tot_Srvcs: string;
  Avg_Sbmtd_Chrg: string;
  Avg_Mdcr_Alowd_Amt: string;
  Avg_Mdcr_Pymt_Amt: string;
};

const DATASET = "92396110-2aed-4d63-a6a2-5d6207d46a29";
const YEAR = 2024;
const PRIMARY = new Set([
  "Family Practice",
  "Internal Medicine",
  "Nurse Practitioner",
  "Physician Assistant",
  "General Practice",
]);

const QUERIES: { filters: Record<string, string>; size: number; offset: number }[] = [
  { filters: { HCPCS_Cd: "99215", Place_Of_Srvc: "O" }, size: 250, offset: 0 },
  { filters: { HCPCS_Cd: "99215", Place_Of_Srvc: "O" }, size: 250, offset: 20000 },
  { filters: { HCPCS_Cd: "99215", Place_Of_Srvc: "O" }, size: 250, offset: 60000 },
  {
    filters: {
      HCPCS_Cd: "99215",
      Place_Of_Srvc: "O",
      Rndrng_Prvdr_Type: "Family Practice",
    },
    size: 200,
    offset: 0,
  },
  { filters: { HCPCS_Cd: "80053" }, size: 150, offset: 0 },
  { filters: { HCPCS_Cd: "64493" }, size: 150, offset: 0 },
  { filters: { HCPCS_Cd: "20610", Place_Of_Srvc: "O" }, size: 120, offset: 0 },
];

function num(v: string | undefined) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function providerName(r: CmsRaw) {
  if (r.Rndrng_Prvdr_Ent_Cd === "O" || !r.Rndrng_Prvdr_First_Name) {
    return r.Rndrng_Prvdr_Last_Org_Name;
  }
  const cred = r.Rndrng_Prvdr_Crdntls?.replace(/\s+/g, " ").trim();
  const name = `${r.Rndrng_Prvdr_First_Name} ${r.Rndrng_Prvdr_Last_Org_Name}`.trim();
  return cred ? `${name}, ${cred}` : name;
}

function posLabel(pos: string) {
  if (pos === "O") return "Office";
  if (pos === "F") return "Facility";
  return pos || "—";
}

export function patternLabel(p: CmsPattern) {
  const map: Record<CmsPattern, string> = {
    upcoding: "99215 intensity",
    "fee-outlier": "Fee outlier",
    injection: "Injection volume",
    lab: "Lab volume",
    watch: "Watch",
  };
  return map[p];
}

function score(raw: CmsRaw): CmsLine {
  const services = num(raw.Tot_Srvcs);
  const benes = Math.max(num(raw.Tot_Benes), 1);
  const charge = num(raw.Avg_Sbmtd_Chrg);
  const allowed = Math.max(num(raw.Avg_Mdcr_Alowd_Amt), 0.01);
  const paid = num(raw.Avg_Mdcr_Pymt_Amt);
  const ratio = charge / allowed;
  const intensity = services / benes;
  const hcpcs = raw.HCPCS_Cd;
  const spec = raw.Rndrng_Prvdr_Type || "Unknown";
  const flags: string[] = [];
  let risk = 10;
  let pattern: CmsPattern = "watch";
  let note = "Utilization sits near typical Medicare Part B ranges for this code.";

  if (hcpcs === "99215") {
    pattern = "upcoding";
    if (intensity >= 3.5) {
      risk += 38;
      flags.push(`${intensity.toFixed(1)} level-5 visits per beneficiary`);
    } else if (intensity >= 2.2) {
      risk += 28;
      flags.push(`${intensity.toFixed(1)} 99215s per beneficiary`);
    } else if (intensity >= 1.6) {
      risk += 16;
      flags.push(`${intensity.toFixed(1)} 99215s per beneficiary`);
    }
    if (services >= 800) {
      risk += 22;
      flags.push(`${fmt(services)} high-complexity office visits`);
    } else if (services >= 400) {
      risk += 14;
      flags.push(`${fmt(services)} high-complexity office visits`);
    } else if (services >= 150) {
      risk += 8;
      flags.push(`${fmt(services)} 99215 services`);
    }
    if (PRIMARY.has(spec)) {
      risk += 10;
      flags.push(`${spec} 99215 mix`);
    }
    note =
      "99215 is a high-complexity established-patient E/M. High volume per beneficiary, or a primary-care panel with a heavy 99215 mix, is a classic SIU sampling signal — not a finding by itself.";
  }

  if (hcpcs === "64493") {
    pattern = "injection";
    if (services >= 120) {
      risk += 24;
      flags.push(`${fmt(services)} lumbar facet units`);
    }
    if (intensity >= 3.5) {
      risk += 14;
      flags.push(`${intensity.toFixed(1)} units per beneficiary`);
    }
    note =
      "CPT 64493 is a lumbar paravertebral facet injection. Unit counts well above specialty peers often trigger a medical-necessity and unbundling review.";
  }

  if (hcpcs === "20610") {
    pattern = "injection";
    if (services >= 150) {
      risk += 16;
      flags.push(`${fmt(services)} major-joint injections`);
    }
    if (intensity >= 3) {
      risk += 10;
      flags.push(`${intensity.toFixed(1)} injections per beneficiary`);
    }
    note =
      "CPT 20610 is arthrocentesis of a major joint. High repeat rates on a small beneficiary panel are a sampling flag.";
  }

  if (hcpcs === "80053") {
    pattern = "lab";
    if (services >= 2500) {
      risk += 16;
      flags.push(`${fmt(services)} comprehensive metabolic panels`);
    }
    note =
      "CPT 80053 is a comprehensive metabolic panel. Extreme volume versus the allowed amount is a lab-utilization flag; NCCI unbundling would need line-level claims.";
  }

  if (ratio >= 6) {
    risk += 22;
    flags.push(`charged ${ratio.toFixed(1)}× Medicare allowed`);
    if (pattern === "watch") pattern = "fee-outlier";
  } else if (ratio >= 3.5) {
    risk += 10;
    flags.push(`charged ${ratio.toFixed(1)}× Medicare allowed`);
  }

  risk = clamp(risk, 6, 97);
  const id = `${raw.Rndrng_NPI}-${hcpcs}-${raw.Place_Of_Srvc}`;

  return {
    id,
    npi: raw.Rndrng_NPI,
    name: providerName(raw),
    specialty: spec,
    city: raw.Rndrng_Prvdr_City,
    state: raw.Rndrng_Prvdr_State_Abrvtn,
    zip: raw.Rndrng_Prvdr_Zip5,
    hcpcs,
    desc: raw.HCPCS_Desc,
    pos: raw.Place_Of_Srvc,
    posLabel: posLabel(raw.Place_Of_Srvc),
    services,
    benes,
    intensity,
    charge,
    allowed,
    paid,
    ratio,
    risk,
    flags,
    pattern,
    note,
  };
}

async function cmsFetch(
  filters: Record<string, string>,
  size: number,
  offset: number,
): Promise<CmsRaw[]> {
  const params = new URLSearchParams({
    size: String(size),
    offset: String(offset),
  });
  for (const [k, v] of Object.entries(filters)) {
    params.set(`filter[${k}]`, v);
  }
  const url = `https://data.cms.gov/data-api/v1/dataset/${DATASET}/data?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`CMS API ${res.status}`);
  }
  return (await res.json()) as CmsRaw[];
}

export async function getCmsQueue(): Promise<CmsQueueResult> {
  const source =
    "CMS Medicare Physician & Other Practitioners — by Provider and Service, CY 2024";
  try {
    const chunks = await Promise.all(
      QUERIES.map((q) => cmsFetch(q.filters, q.size, q.offset)),
    );
    const map = new Map<string, CmsLine>();
    for (const row of chunks.flat()) {
      if (!row?.Rndrng_NPI || !row.HCPCS_Cd) continue;
      const line = score(row);
      const prev = map.get(line.id);
      if (!prev || line.risk > prev.risk) map.set(line.id, line);
    }
    const lines = [...map.values()]
      .sort((a, b) => b.risk - a.risk || b.services - a.services)
      .slice(0, 250);
    return { lines, year: YEAR, source };
  } catch (err) {
    return {
      lines: [],
      year: YEAR,
      source,
      error: err instanceof Error ? err.message : "CMS fetch failed",
    };
  }
}

export async function getCmsLine(id: string): Promise<CmsLine | null> {
  const parts = id.split("-");
  if (parts.length < 3) return null;
  const pos = parts.pop()!;
  const hcpcs = parts.pop()!;
  const npi = parts.join("-");
  try {
    const rows = await cmsFetch(
      { Rndrng_NPI: npi, HCPCS_Cd: hcpcs, Place_Of_Srvc: pos },
      5,
      0,
    );
    if (rows[0]) return score(rows[0]);
  } catch {
    /* fall through to queue scan */
  }
  const { lines } = await getCmsQueue();
  return lines.find((l) => l.id === id) ?? null;
}

export function usdExact(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
