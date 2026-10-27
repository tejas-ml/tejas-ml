export type FraudType =
  | "upcoding"
  | "unbundling"
  | "duplicate"
  | "phantom"
  | "modifier"
  | "clean";

export type ClaimStatus = "flagged" | "review" | "cleared";

export type ShapHit = { feature: string; impact: number };

export type Claim = {
  id: string;
  date: string;
  npi: string;
  provider: string;
  specialty: string;
  state: string;
  patient: string;
  patientAge: number;
  patientSex: "F" | "M";
  cpt: string;
  cptDesc: string;
  icd10: string;
  icdDesc: string;
  billed: number;
  cmsFee: number;
  allowed: number;
  pos: string;
  posDesc: string;
  modifiers: string[];
  risk: number;
  fraudType: FraudType;
  flags: string[];
  shap: ShapHit[];
  status: ClaimStatus;
  note: string;
  units: number;
};

export type Provider = {
  name: string;
  npi: string;
  specialty: string;
  state: string;
  city: string;
  risk: number;
  flagged: number;
  volume: number;
  peer99215: number;
  own99215: number;
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260905);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

function lerp(a: number, b: number) {
  return a + (b - a) * rand();
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function statusFor(risk: number): ClaimStatus {
  if (risk >= 72) return "flagged";
  if (risk >= 42) return "review";
  return "cleared";
}

export const PROVIDERS: Provider[] = [
  {
    name: "Harlan Voss, MD",
    npi: "1487923106",
    specialty: "Family Medicine",
    state: "TX",
    city: "Austin",
    risk: 91,
    flagged: 48,
    volume: 612,
    peer99215: 0.07,
    own99215: 0.34,
  },
  {
    name: "Greenfield Lab Partners",
    npi: "1832054410",
    specialty: "Clinical Laboratory",
    state: "PA",
    city: "Philadelphia",
    risk: 86,
    flagged: 31,
    volume: 940,
    peer99215: 0,
    own99215: 0,
  },
  {
    name: "Harborview Urgent Care",
    npi: "1679408828",
    specialty: "Urgent Care",
    state: "WA",
    city: "Seattle",
    risk: 78,
    flagged: 22,
    volume: 880,
    peer99215: 0.04,
    own99215: 0.11,
  },
  {
    name: "Summit Pain Clinic",
    npi: "1245789034",
    specialty: "Pain Management",
    state: "FL",
    city: "Tampa",
    risk: 88,
    flagged: 27,
    volume: 410,
    peer99215: 0.09,
    own99215: 0.21,
  },
  {
    name: "Pacific Orthopedics",
    npi: "1093847620",
    specialty: "Orthopedic Surgery",
    state: "CA",
    city: "San Diego",
    risk: 74,
    flagged: 18,
    volume: 505,
    peer99215: 0.08,
    own99215: 0.14,
  },
  {
    name: "Atlas Imaging",
    npi: "1562730191",
    specialty: "Diagnostic Radiology",
    state: "AZ",
    city: "Phoenix",
    risk: 69,
    flagged: 14,
    volume: 720,
    peer99215: 0,
    own99215: 0,
  },
  {
    name: "Priya Nair, MD",
    npi: "1326094478",
    specialty: "Internal Medicine",
    state: "NJ",
    city: "Hoboken",
    risk: 18,
    flagged: 2,
    volume: 540,
    peer99215: 0.06,
    own99215: 0.05,
  },
  {
    name: "Oak Street Primary",
    npi: "1456289003",
    specialty: "Family Medicine",
    state: "IL",
    city: "Chicago",
    risk: 22,
    flagged: 3,
    volume: 790,
    peer99215: 0.07,
    own99215: 0.06,
  },
  {
    name: "Riverside Family Medicine",
    npi: "1782456102",
    specialty: "Family Medicine",
    state: "OH",
    city: "Columbus",
    risk: 29,
    flagged: 5,
    volume: 660,
    peer99215: 0.07,
    own99215: 0.09,
  },
  {
    name: "Lakeside Pediatrics",
    npi: "1902375546",
    specialty: "Pediatrics",
    state: "MN",
    city: "Minneapolis",
    risk: 16,
    flagged: 1,
    volume: 430,
    peer99215: 0.03,
    own99215: 0.02,
  },
  {
    name: "Marcus Ellison, MD",
    npi: "1649207813",
    specialty: "Dermatology",
    state: "GA",
    city: "Atlanta",
    risk: 33,
    flagged: 6,
    volume: 380,
    peer99215: 0.05,
    own99215: 0.08,
  },
  {
    name: "Midtown Cardiology",
    npi: "1215983303",
    specialty: "Cardiology",
    state: "NY",
    city: "New York",
    risk: 41,
    flagged: 9,
    volume: 470,
    peer99215: 0.11,
    own99215: 0.13,
  },
];

const CPT = {
  "99213": { desc: "Office visit, established, low MDM", fee: 92.13 },
  "99214": { desc: "Office visit, established, moderate MDM", fee: 131.42 },
  "99215": { desc: "Office visit, established, high complexity", fee: 185.96 },
  "99203": { desc: "Office visit, new patient, low MDM", fee: 113.0 },
  "99204": { desc: "Office visit, new patient, moderate MDM", fee: 169.54 },
  "99205": { desc: "Office visit, new patient, high complexity", fee: 224.18 },
  "80053": { desc: "Comprehensive metabolic panel", fee: 14.49 },
  "80048": { desc: "Basic metabolic panel", fee: 11.74 },
  "85025": { desc: "Complete CBC with auto differential", fee: 10.66 },
  "93000": { desc: "Electrocardiogram, complete", fee: 17.22 },
  "71046": { desc: "Chest X-ray, 2 views", fee: 32.4 },
  "20610": { desc: "Arthrocentesis, major joint", fee: 74.18 },
  "64493": { desc: "Paravertebral facet injection, lumbar", fee: 186.4 },
  "72148": { desc: "MRI lumbar spine without contrast", fee: 412.88 },
  "70450": { desc: "CT head/brain without contrast", fee: 142.16 },
  "36415": { desc: "Venipuncture", fee: 3.0 },
  "11102": { desc: "Tangential biopsy of skin", fee: 101.22 },
  "17000": { desc: "Destruction of premalignant lesion", fee: 67.9 },
} as const;

const ICD = {
  "J06.9": { desc: "Acute upper respiratory infection, unspecified", sev: 1 },
  "R51.9": { desc: "Headache, unspecified", sev: 1 },
  "Z00.00": { desc: "Encounter for general adult medical exam", sev: 1 },
  "J02.9": { desc: "Acute pharyngitis, unspecified", sev: 1 },
  "M25.561": { desc: "Pain in right knee", sev: 2 },
  "I10": { desc: "Essential (primary) hypertension", sev: 2 },
  "E11.9": { desc: "Type 2 diabetes mellitus without complications", sev: 2 },
  "M54.5": { desc: "Low back pain", sev: 2 },
  "J45.909": { desc: "Unspecified asthma, uncomplicated", sev: 2 },
  "N39.0": { desc: "Urinary tract infection, site not specified", sev: 2 },
  "L70.0": { desc: "Acne vulgaris", sev: 1 },
  "K21.9": { desc: "GERD without esophagitis", sev: 2 },
  "I25.10": { desc: "Atherosclerotic heart disease of native coronary", sev: 4 },
  "J18.9": { desc: "Pneumonia, unspecified organism", sev: 4 },
  "I21.9": { desc: "Acute myocardial infarction, unspecified", sev: 5 },
  "G89.29": { desc: "Other chronic pain", sev: 3 },
  "M47.816": { desc: "Spondylosis, lumbar region", sev: 3 },
  "R07.9": { desc: "Chest pain, unspecified", sev: 3 },
  "E78.5": { desc: "Hyperlipidemia, unspecified", sev: 2 },
  "Z01.818": { desc: "Encounter for other preprocedural examination", sev: 1 },
} as const;

type CptCode = keyof typeof CPT;
type IcdCode = keyof typeof ICD;

const POS: Record<string, string> = {
  "11": "Office",
  "22": "On-campus outpatient hospital",
  "23": "Emergency room",
  "81": "Independent laboratory",
  "24": "Ambulatory surgical center",
};

function mbi() {
  const tail = Math.floor(lerp(1000, 9999)).toString();
  return `MBI · •••• ${tail}`;
}

function shapFor(type: FraudType, extras: ShapHit[] = []): ShapHit[] {
  const base: Record<FraudType, ShapHit[]> = {
    upcoding: [
      { feature: "cpt_icd_severity_gap", impact: 0.31 },
      { feature: "provider_99215_vs_peer", impact: 0.22 },
      { feature: "billed_to_cms_fee", impact: 0.14 },
      { feature: "em_level", impact: 0.09 },
      { feature: "same_day_duplicate", impact: -0.03 },
    ],
    unbundling: [
      { feature: "panel_component_overlap", impact: 0.28 },
      { feature: "billed_to_cms_fee", impact: 0.19 },
      { feature: "lab_npi_unbundle_rate", impact: 0.16 },
      { feature: "cpt_icd_severity_gap", impact: 0.04 },
      { feature: "weekend_high_complexity", impact: -0.02 },
    ],
    duplicate: [
      { feature: "same_day_duplicate", impact: 0.34 },
      { feature: "npi_patient_cpt_hash", impact: 0.21 },
      { feature: "billed_to_cms_fee", impact: 0.08 },
      { feature: "modifier_25_59_density", impact: 0.06 },
      { feature: "cpt_icd_severity_gap", impact: 0.02 },
    ],
    phantom: [
      { feature: "weekend_high_complexity", impact: 0.24 },
      { feature: "missing_facility_claim", impact: 0.22 },
      { feature: "units_vs_specialty_p95", impact: 0.18 },
      { feature: "provider_outlier_index", impact: 0.11 },
      { feature: "patient_travel_miles", impact: 0.07 },
    ],
    modifier: [
      { feature: "modifier_25_59_density", impact: 0.26 },
      { feature: "same_day_procedure_pair", impact: 0.17 },
      { feature: "provider_modifier_rate", impact: 0.14 },
      { feature: "billed_to_cms_fee", impact: 0.09 },
      { feature: "cpt_icd_severity_gap", impact: 0.03 },
    ],
    clean: [
      { feature: "cpt_icd_severity_gap", impact: -0.18 },
      { feature: "billed_to_cms_fee", impact: -0.12 },
      { feature: "provider_99215_vs_peer", impact: -0.08 },
      { feature: "same_day_duplicate", impact: -0.06 },
      { feature: "em_level", impact: 0.04 },
    ],
  };
  return [...base[type], ...extras].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

function makeClaim(partial: Omit<Claim, "status" | "allowed" | "cptDesc" | "icdDesc" | "posDesc"> & {
  cptDesc?: string;
  icdDesc?: string;
  posDesc?: string;
  allowed?: number;
}): Claim {
  const cptMeta = CPT[partial.cpt as CptCode];
  const icdMeta = ICD[partial.icd10 as IcdCode];
  return {
    ...partial,
    cptDesc: partial.cptDesc ?? cptMeta?.desc ?? "Procedure",
    icdDesc: partial.icdDesc ?? icdMeta?.desc ?? "Diagnosis",
    posDesc: partial.posDesc ?? POS[partial.pos] ?? "Other",
    allowed: partial.allowed ?? roundMoney(partial.cmsFee * 0.92),
    status: statusFor(partial.risk),
  };
}

const FEATURED: Claim[] = [
  makeClaim({
    id: "AEG-26-00041",
    date: "2026-03-12",
    npi: "1487923106",
    provider: "Harlan Voss, MD",
    specialty: "Family Medicine",
    state: "TX",
    patient: "MBI · •••• 4C19",
    patientAge: 34,
    patientSex: "F",
    cpt: "99215",
    icd10: "J06.9",
    billed: 412,
    cmsFee: 185.96,
    pos: "11",
    modifiers: [],
    risk: 94,
    fraudType: "upcoding",
    flags: ["99215 for URI", "4.8× peer 99215 rate", "billed 2.2× CMS fee"],
    shap: shapFor("upcoding"),
    note: "Level-5 E/M billed against an unspecified upper respiratory infection. Provider 99215 share is 34% vs 7% specialty peer. Classic upcoding signature.",
    units: 1,
  }),
  makeClaim({
    id: "AEG-26-00088",
    date: "2026-03-14",
    npi: "1832054410",
    provider: "Greenfield Lab Partners",
    specialty: "Clinical Laboratory",
    state: "PA",
    patient: "MBI · •••• 8K02",
    patientAge: 61,
    patientSex: "M",
    cpt: "80048",
    cptDesc: "BMP components billed separately (unbundled CMP)",
    icd10: "E11.9",
    billed: 86.4,
    cmsFee: 14.49,
    pos: "81",
    modifiers: ["91"],
    risk: 89,
    fraudType: "unbundling",
    flags: ["CMP panel split into 7 lines", "modifier 91 repeat lab", "6.0× CMS panel fee"],
    shap: shapFor("unbundling"),
    note: "Comprehensive metabolic panel unbundled into sodium, potassium, chloride, CO2, glucose, BUN, creatinine line items. NCCI PTP edit should collapse to 80053.",
    units: 7,
  }),
  makeClaim({
    id: "AEG-26-00112",
    date: "2026-03-18",
    npi: "1679408828",
    provider: "Harborview Urgent Care",
    specialty: "Urgent Care",
    state: "WA",
    patient: "MBI · •••• 2M77",
    patientAge: 27,
    patientSex: "M",
    cpt: "99214",
    icd10: "J02.9",
    billed: 248,
    cmsFee: 131.42,
    pos: "11",
    modifiers: ["25"],
    risk: 91,
    fraudType: "duplicate",
    flags: ["same NPI + patient + CPT, 11:40 and 14:05", "modifier 25 on both lines"],
    shap: shapFor("duplicate"),
    note: "Two moderate E/M visits for acute pharyngitis on the same date of service, same rendering NPI. Second line is a same-day duplicate, not a separate encounter.",
    units: 2,
  }),
  makeClaim({
    id: "AEG-26-00140",
    date: "2026-03-07",
    npi: "1245789034",
    provider: "Summit Pain Clinic",
    specialty: "Pain Management",
    state: "FL",
    patient: "MBI · •••• 9R44",
    patientAge: 58,
    patientSex: "F",
    cpt: "64493",
    icd10: "M47.816",
    billed: 3728,
    cmsFee: 186.4,
    pos: "11",
    modifiers: ["50", "59"],
    risk: 87,
    fraudType: "phantom",
    flags: ["20 units Saturday office", "no companion facility claim", "modifier 59 stacked"],
    shap: shapFor("phantom"),
    note: "Twenty lumbar facet units billed from an office POS on a Saturday with no corresponding ASC or hospital outpatient claim. Volume sits above the 99th percentile for the specialty.",
    units: 20,
  }),
  makeClaim({
    id: "AEG-26-00155",
    date: "2026-03-21",
    npi: "1093847620",
    provider: "Pacific Orthopedics",
    specialty: "Orthopedic Surgery",
    state: "CA",
    patient: "MBI · •••• 6T18",
    patientAge: 49,
    patientSex: "M",
    cpt: "20610",
    icd10: "M25.561",
    billed: 640,
    cmsFee: 74.18,
    pos: "11",
    modifiers: ["59", "RT"],
    risk: 82,
    fraudType: "unbundling",
    flags: ["injection + aspiration unbundled", "59 on inclusive pair"],
    shap: shapFor("unbundling"),
    note: "Arthrocentesis billed with a separately reported aspiration and ultrasound guidance that NCCI treats as inclusive. Modifier 59 used to bypass the edit.",
    units: 3,
  }),
  makeClaim({
    id: "AEG-26-00171",
    date: "2026-03-22",
    npi: "1487923106",
    provider: "Harlan Voss, MD",
    specialty: "Family Medicine",
    state: "TX",
    patient: "MBI · •••• 1H63",
    patientAge: 41,
    patientSex: "M",
    cpt: "99215",
    icd10: "R51.9",
    billed: 395,
    cmsFee: 185.96,
    pos: "11",
    modifiers: [],
    risk: 88,
    fraudType: "upcoding",
    flags: ["99215 for unspecified headache", "repeat high-level E/M, same NPI"],
    shap: shapFor("upcoding"),
    note: "Second high-complexity visit in a 14-day window for a low-severity symptom. Pattern matches the Voss 99215 cluster.",
    units: 1,
  }),
  makeClaim({
    id: "AEG-26-00203",
    date: "2026-03-09",
    npi: "1562730191",
    provider: "Atlas Imaging",
    specialty: "Diagnostic Radiology",
    state: "AZ",
    patient: "MBI · •••• 3P90",
    patientAge: 72,
    patientSex: "F",
    cpt: "70450",
    icd10: "R51.9",
    billed: 890,
    cmsFee: 142.16,
    pos: "22",
    modifiers: ["76"],
    risk: 79,
    fraudType: "duplicate",
    flags: ["repeat CT same day", "modifier 76 without new indication"],
    shap: shapFor("duplicate"),
    note: "Head CT billed twice on the same date with a repeat-procedure modifier and no intervening clinical event in the claim history.",
    units: 2,
  }),
  makeClaim({
    id: "AEG-26-00218",
    date: "2026-03-11",
    npi: "1326094478",
    provider: "Priya Nair, MD",
    specialty: "Internal Medicine",
    state: "NJ",
    patient: "MBI · •••• 7D21",
    patientAge: 66,
    patientSex: "F",
    cpt: "99213",
    icd10: "I10",
    billed: 98,
    cmsFee: 92.13,
    pos: "11",
    modifiers: [],
    risk: 12,
    fraudType: "clean",
    flags: [],
    shap: shapFor("clean"),
    note: "Low-complexity hypertension follow-up, billed within 6% of the CMS fee schedule. Peer-aligned E/M mix.",
    units: 1,
  }),
  makeClaim({
    id: "AEG-26-00244",
    date: "2026-03-16",
    npi: "1456289003",
    provider: "Oak Street Primary",
    specialty: "Family Medicine",
    state: "IL",
    patient: "MBI · •••• 5L08",
    patientAge: 55,
    patientSex: "M",
    cpt: "99214",
    icd10: "E11.9",
    billed: 136,
    cmsFee: 131.42,
    pos: "11",
    modifiers: [],
    risk: 18,
    fraudType: "clean",
    flags: [],
    shap: shapFor("clean"),
    note: "Moderate MDM diabetes visit with labs ordered under a panel code. No unbundling, no E/M inflation.",
    units: 1,
  }),
  makeClaim({
    id: "AEG-26-00261",
    date: "2026-03-04",
    npi: "1487923106",
    provider: "Harlan Voss, MD",
    specialty: "Family Medicine",
    state: "TX",
    patient: "MBI · •••• 0W55",
    patientAge: 29,
    patientSex: "F",
    cpt: "99215",
    icd10: "Z00.00",
    billed: 428,
    cmsFee: 185.96,
    pos: "11",
    modifiers: ["25"],
    risk: 96,
    fraudType: "upcoding",
    flags: ["99215 on a wellness exam", "modifier 25 without procedure"],
    shap: shapFor("upcoding", [{ feature: "wellness_em_stack", impact: 0.19 }]),
    note: "Preventive encounter billed as a high-complexity problem-oriented visit. Modifier 25 present with no separately identifiable procedure.",
    units: 1,
  }),
];

const SIMPLE_ICD: IcdCode[] = ["J06.9", "R51.9", "Z00.00", "J02.9", "L70.0"];
const MODERATE_ICD: IcdCode[] = ["I10", "E11.9", "M54.5", "K21.9", "E78.5", "N39.0", "J45.909", "M25.561"];
const COMPLEX_ICD: IcdCode[] = ["I25.10", "J18.9", "I21.9", "G89.29", "M47.816", "R07.9"];
const EM: CptCode[] = ["99213", "99214", "99215", "99203", "99204", "99205"];

function generated(): Claim[] {
  const types: FraudType[] = [
    ...Array(18).fill("clean"),
    ...Array(12).fill("upcoding"),
    ...Array(8).fill("unbundling"),
    ...Array(6).fill("duplicate"),
    ...Array(4).fill("phantom"),
    ...Array(4).fill("modifier"),
  ];
  return types.map((type, i) => {
    const provider =
      type === "clean"
        ? pick(PROVIDERS.filter((p) => p.risk < 45))
        : type === "upcoding"
          ? pick(PROVIDERS.filter((p) => p.own99215 >= 0.1 || p.risk >= 70))
          : type === "unbundling"
            ? pick(PROVIDERS.filter((p) => p.specialty.includes("Lab") || p.specialty.includes("Ortho") || p.risk >= 60))
            : pick(PROVIDERS);
    let cpt: CptCode;
    let icd: IcdCode;
    let flags: string[] = [];
    let note = "";
    let modifiers: string[] = [];
    let units = 1;
    let pos = "11";
    let billedMul = 1;
    let risk = 10;

    if (type === "upcoding") {
      cpt = pick(["99215", "99205"] as CptCode[]);
      icd = pick(SIMPLE_ICD);
      billedMul = lerp(1.8, 2.4);
      risk = Math.round(lerp(74, 95));
      flags = [`${cpt} for ${icd}`, "complexity vs diagnosis mismatch"];
      note = `High-complexity E/M (${cpt}) billed against a low-severity diagnosis. Model treats this as upcoding relative to CMS documentation guidelines.`;
      if (provider.own99215 > 0.15) flags.push("provider 99215 outlier");
    } else if (type === "unbundling") {
      cpt = pick(["80048", "80053", "20610"] as CptCode[]);
      icd = pick(MODERATE_ICD);
      pos = cpt.startsWith("800") ? "81" : "11";
      units = Math.floor(lerp(3, 8));
      billedMul = lerp(3.2, 6.5);
      modifiers = pick([["91"], ["59"], ["59", "91"]]);
      risk = Math.round(lerp(70, 92));
      flags = ["panel or inclusive pair split", `×${units} component lines`];
      note = "NCCI-inclusive components submitted as separately payable lines. Fee far exceeds the bundled panel or parent procedure.";
    } else if (type === "duplicate") {
      cpt = pick(["99214", "71046", "93000", "70450"] as CptCode[]);
      icd = pick([...SIMPLE_ICD, ...MODERATE_ICD]);
      units = 2;
      billedMul = lerp(1.6, 2.2);
      modifiers = pick([["76"], ["25"], []]);
      risk = Math.round(lerp(71, 93));
      flags = ["same-day NPI + patient + CPT", "second line lacks new indication"];
      note = "Exact-match duplicate on date of service. The second unit does not carry a distinct POS, modifier rationale, or diagnosis change.";
    } else if (type === "phantom") {
      cpt = pick(["64493", "72148", "99215"] as CptCode[]);
      icd = pick(["G89.29", "M47.816", "M54.5"] as IcdCode[]);
      units = Math.floor(lerp(6, 18));
      billedMul = lerp(2.4, 4.8);
      pos = pick(["11", "24"]);
      modifiers = ["59"];
      risk = Math.round(lerp(73, 90));
      flags = ["weekend or off-hours high volume", "no matching facility claim"];
      note = "Service volume and setting are inconsistent with the billed POS. Likely phantom or mis-set place of service.";
    } else if (type === "modifier") {
      cpt = pick(EM);
      icd = pick(MODERATE_ICD);
      modifiers = pick([["25"], ["25", "59"], ["59"]]);
      billedMul = lerp(1.3, 1.9);
      risk = Math.round(lerp(48, 76));
      flags = ["modifier 25/59 density", "same-day procedure stacking"];
      note = "Significant, separately identifiable E/M (25) or distinct procedural service (59) used at a rate well above specialty peers.";
    } else {
      const pair = pick([
        { cpt: "99213" as CptCode, icd: pick(SIMPLE_ICD) },
        { cpt: "99214" as CptCode, icd: pick(MODERATE_ICD) },
        { cpt: "99213" as CptCode, icd: pick(MODERATE_ICD) },
        { cpt: "80053" as CptCode, icd: pick(MODERATE_ICD) },
        { cpt: "93000" as CptCode, icd: pick(["R07.9", "I10"] as IcdCode[]) },
        { cpt: "11102" as CptCode, icd: pick(["L70.0"] as IcdCode[]) },
        { cpt: "17000" as CptCode, icd: pick(["L70.0"] as IcdCode[]) },
        { cpt: "99204" as CptCode, icd: pick(COMPLEX_ICD) },
      ]);
      cpt = pair.cpt;
      icd = pair.icd;
      billedMul = lerp(0.94, 1.08);
      risk = Math.round(lerp(6, 34));
      pos = cpt.startsWith("800") ? "81" : "11";
      note = "Billed amount, E/M level, and diagnosis severity are internally consistent. No NCCI or duplicate signal.";
    }

    const fee = CPT[cpt].fee;
    const billed = roundMoney(fee * billedMul * units);
    const month = pick(["01", "02", "03", "04", "05", "06"]);
    const day = String(Math.floor(lerp(1, 28))).padStart(2, "0");

    return makeClaim({
      id: `AEG-26-${String(300 + i).padStart(5, "0")}`,
      date: `2026-${month}-${day}`,
      npi: provider.npi,
      provider: provider.name,
      specialty: provider.specialty,
      state: provider.state,
      patient: mbi(),
      patientAge: Math.floor(lerp(19, 84)),
      patientSex: pick(["F", "M"]),
      cpt,
      icd10: icd,
      billed,
      cmsFee: fee,
      pos,
      modifiers,
      risk,
      fraudType: type,
      flags,
      shap: shapFor(type),
      note,
      units,
    });
  });
}

export const CLAIMS: Claim[] = [...FEATURED, ...generated()].sort((a, b) => b.risk - a.risk);

export const FEATURE_IMPORTANCE: { name: string; weight: number; note: string }[] = [
  {
    name: "cpt_icd_severity_gap",
    weight: 0.22,
    note: "E/M level versus diagnosis severity. 99215 on J06.9 is the textbook case.",
  },
  {
    name: "billed_to_cms_fee",
    weight: 0.18,
    note: "Charged amount over the Medicare physician fee schedule.",
  },
  {
    name: "provider_99215_vs_peer",
    weight: 0.16,
    note: "Share of level-5 visits versus specialty and geography peers.",
  },
  {
    name: "same_day_duplicate",
    weight: 0.12,
    note: "NPI + patient + CPT + date-of-service collisions.",
  },
  {
    name: "panel_component_overlap",
    weight: 0.11,
    note: "NCCI PTP unbundling of lab panels and inclusive procedure pairs.",
  },
  {
    name: "modifier_25_59_density",
    weight: 0.09,
    note: "Bypass modifiers relative to peer baseline.",
  },
  {
    name: "weekend_high_complexity",
    weight: 0.07,
    note: "High-RVU work in settings that rarely operate those hours.",
  },
  {
    name: "units_vs_specialty_p95",
    weight: 0.05,
    note: "Unit counts above the 95th percentile for the specialty.",
  },
];

export const MODEL = {
  algorithm: "XGBoost classifier (hist) with Random Forest baseline",
  claims: 512448,
  flagged: 21418,
  flagRate: 0.0418,
  precision: 0.91,
  recall: 0.84,
  auc: 0.946,
  f1: 0.874,
  auditCut: 0.3,
  waste: 47_200_000,
  holdout: {
    tn: 38420,
    fp: 890,
    fn: 1420,
    tp: 7480,
  },
};

export const PIPELINE = [
  {
    step: "01",
    title: "Ingest",
    tool: "Python · CMS PUF / synthetic CMS-1500",
    body: "Load Medicare Part B carrier line items and a synthetic overlay with known fraud labels. Normalize NPI, CPT, ICD-10-CM, POS, modifiers, and billed/allowed amounts.",
  },
  {
    step: "02",
    title: "Transform",
    tool: "dbt on Snowflake",
    body: "Stage raw claims, build provider-day grains, attach NCCI PTP edits, CMS fee schedule, and specialty peer rates. Tests catch orphan NPIs and impossible E/M combinations.",
  },
  {
    step: "03",
    title: "Features",
    tool: "dbt marts · Python",
    body: "Engineer cpt–icd severity gap, billed-to-fee ratio, 99215 peer residual, same-day duplicate hash, unbundling overlap, modifier density, and weekend high-RVU flags.",
  },
  {
    step: "04",
    title: "Model",
    tool: "XGBoost · Random Forest",
    body: "Train a gradient-boosted classifier on 500k+ labeled lines. Calibrate probabilities, explain with SHAP, and keep a Random Forest baseline for SIU review packets.",
  },
  {
    step: "05",
    title: "Score",
    tool: "Snowflake UDF · batch + streaming",
    body: "Score inbound claims before payment. High-risk lines land in the SIU queue; mid-risk go to sampling; low-risk auto-adjudicate.",
  },
  {
    step: "06",
    title: "Review",
    tool: "This console · Streamlit prototype",
    body: "Auditors open the claim, read the top SHAP drivers, pull similar lines from the same NPI, and confirm, clear, or request records.",
  },
];

export function getClaim(id: string) {
  return CLAIMS.find((c) => c.id === id);
}

export function claimsForProvider(npi: string, except?: string) {
  return CLAIMS.filter((c) => c.npi === npi && c.id !== except);
}

export function usd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function usdExact(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function fraudLabel(t: FraudType) {
  const map: Record<FraudType, string> = {
    upcoding: "Upcoding",
    unbundling: "Unbundling",
    duplicate: "Duplicate",
    phantom: "Phantom",
    modifier: "Modifier",
    clean: "Clean",
  };
  return map[t];
}

export const CPT_OPTIONS = Object.entries(CPT).map(([code, v]) => ({
  code,
  desc: v.desc,
  fee: v.fee,
}));

export const ICD_OPTIONS = Object.entries(ICD).map(([code, v]) => ({
  code,
  desc: v.desc,
  sev: v.sev,
}));
