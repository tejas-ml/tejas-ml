import type {
  CreditInputs,
  FactorResult,
  Rating,
  ScoreBand,
  ScoreResult,
} from './types'

export const SCORE_MIN = 300
export const SCORE_MAX = 850

export const WEIGHTS = {
  paymentHistory: 0.35,
  utilization: 0.3,
  creditAge: 0.15,
  creditMix: 0.1,
  newCredit: 0.1,
} as const

export const BANDS: ScoreBand[] = [
  {
    rating: 'Poor',
    min: 300,
    max: 579,
    copy: 'Lenders see elevated risk. Focus on on-time payments and lowering balances.',
  },
  {
    rating: 'Fair',
    min: 580,
    max: 669,
    copy: 'You may qualify, but rates will be higher. Utilization and recent lates matter most.',
  },
  {
    rating: 'Good',
    min: 670,
    max: 739,
    copy: 'A solid file. Small moves on utilization and inquiries can still add points.',
  },
  {
    rating: 'Very Good',
    min: 740,
    max: 799,
    copy: 'Strong standing. Keep balances low and protect your oldest accounts.',
  },
  {
    rating: 'Excellent',
    min: 800,
    max: 850,
    copy: 'Top-tier. Maintain low utilization and a long, clean payment streak.',
  },
]

export const DEFAULT_INPUTS: CreditInputs = {
  late30: 0,
  late60: 0,
  late90: 0,
  collections: 0,
  chargeOffs: 0,
  bankruptcy: false,
  creditLimit: 12000,
  revolvingBalance: 2400,
  oldestYears: 6,
  averageYears: 3.5,
  creditCards: 3,
  autoLoan: true,
  mortgage: false,
  studentLoans: false,
  otherInstallment: false,
  hardInquiries: 1,
  newAccounts: 0,
  rateShopping: false,
}

export const EMPTY_INPUTS: CreditInputs = {
  late30: 0,
  late60: 0,
  late90: 0,
  collections: 0,
  chargeOffs: 0,
  bankruptcy: false,
  creditLimit: 0,
  revolvingBalance: 0,
  oldestYears: 0,
  averageYears: 0,
  creditCards: 0,
  autoLoan: false,
  mortgage: false,
  studentLoans: false,
  otherInstallment: false,
  hardInquiries: 0,
  newAccounts: 0,
  rateShopping: false,
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function accountCount(input: CreditInputs): number {
  return (
    input.creditCards +
    (input.autoLoan ? 1 : 0) +
    (input.mortgage ? 1 : 0) +
    (input.studentLoans ? 1 : 0) +
    (input.otherInstallment ? 1 : 0)
  )
}

export function utilizationRatio(input: CreditInputs): number {
  if (input.creditLimit <= 0) {
    return input.revolvingBalance > 0 ? 1.2 : 0
  }
  return input.revolvingBalance / input.creditLimit
}

function ratingFromFactor(score: number): Rating {
  if (score >= 88) return 'Excellent'
  if (score >= 74) return 'Very Good'
  if (score >= 58) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

export function bandForScore(score: number): ScoreBand {
  const rounded = Math.round(score)
  return (
    BANDS.find((b) => rounded >= b.min && rounded <= b.max) ??
    BANDS[BANDS.length - 1]
  )
}

function scorePaymentHistory(input: CreditInputs, accounts: number): FactorResult {
  if (accounts === 0) {
    return {
      key: 'paymentHistory',
      label: 'Payment history',
      weight: WEIGHTS.paymentHistory,
      score: 42,
      rating: 'Fair',
      detail: 'No accounts on file — lenders have nothing to score.',
    }
  }

  let score = 100
  if (input.late30 > 0) score -= 10 + input.late30 * 8
  if (input.late60 > 0) score -= 8 + input.late60 * 16
  if (input.late90 > 0) score -= 12 + input.late90 * 26
  score -= input.collections * 20
  score -= input.chargeOffs * 24
  if (input.bankruptcy) score -= 58

  score = clamp(score, 0, 100)

  let detail = 'A clean streak — this is the heaviest factor.'
  if (input.bankruptcy) {
    detail = 'A bankruptcy is a major derogatory and will weigh this factor down for years.'
  } else if (input.late90 > 0 || input.chargeOffs > 0 || input.collections > 0) {
    detail = 'Serious delinquencies (90+ days, collections, charge-offs) cut this factor hardest.'
  } else if (input.late30 > 0 || input.late60 > 0) {
    detail = 'Late payments are on file. Time and a perfect streak from here will recover points.'
  }

  return {
    key: 'paymentHistory',
    label: 'Payment history',
    weight: WEIGHTS.paymentHistory,
    score,
    rating: ratingFromFactor(score),
    detail,
  }
}

function scoreUtilization(input: CreditInputs): FactorResult {
  const hasRevolving = input.creditCards > 0 || input.creditLimit > 0
  if (!hasRevolving) {
    return {
      key: 'utilization',
      label: 'Amounts owed',
      weight: WEIGHTS.utilization,
      score: 62,
      rating: 'Good',
      detail: 'No revolving credit. Installment-only files score this factor more neutrally.',
    }
  }

  const ratio = utilizationRatio(input)
  let score: number
  if (input.creditLimit <= 0) {
    score = 18
  } else if (ratio <= 0) {
    score = 86
  } else if (ratio <= 0.09) {
    score = 100
  } else if (ratio <= 0.29) {
    score = 100 - ((ratio - 0.09) / 0.2) * 36
  } else if (ratio <= 0.49) {
    score = 64 - ((ratio - 0.29) / 0.2) * 18
  } else if (ratio <= 0.74) {
    score = 46 - ((ratio - 0.49) / 0.25) * 16
  } else if (ratio <= 1) {
    score = 30 - ((ratio - 0.74) / 0.26) * 16
  } else {
    score = 8
  }

  score = clamp(score, 0, 100)
  const pct = Math.round(ratio * 100)

  let detail: string
  if (ratio <= 0.09) {
    detail = `${pct}% utilization — in the range models treat as excellent.`
  } else if (ratio <= 0.29) {
    detail = `${pct}% utilization. Getting under 10% is the usual next win.`
  } else if (ratio <= 0.49) {
    detail = `${pct}% utilization is a common drag. Paying down revolving balances moves this fast.`
  } else {
    detail = `${pct}% utilization looks stretched. This factor can swing a score more than almost anything else.`
  }

  return {
    key: 'utilization',
    label: 'Amounts owed',
    weight: WEIGHTS.utilization,
    score,
    rating: ratingFromFactor(score),
    detail,
  }
}

function ageCurve(years: number): number {
  if (years <= 0) return 12
  if (years >= 15) return 100
  const points: [number, number][] = [
    [0.25, 16],
    [0.5, 22],
    [1, 32],
    [2, 48],
    [3, 58],
    [5, 72],
    [7, 84],
    [10, 93],
    [15, 100],
  ]
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1]
    const [x2, y2] = points[i]
    if (years <= x2) {
      const t = (years - x1) / (x2 - x1)
      return y1 + t * (y2 - y1)
    }
  }
  return 100
}

function scoreCreditAge(input: CreditInputs, accounts: number): FactorResult {
  if (accounts === 0) {
    return {
      key: 'creditAge',
      label: 'Length of history',
      weight: WEIGHTS.creditAge,
      score: 14,
      rating: 'Poor',
      detail: 'No history to measure. Age only grows if accounts stay open.',
    }
  }

  const oldest = Math.max(0, input.oldestYears)
  const average = clamp(input.averageYears, 0, oldest || input.averageYears)
  const score = clamp(ageCurve(oldest) * 0.65 + ageCurve(average) * 0.35, 0, 100)

  let detail: string
  if (oldest < 2) {
    detail = 'A young file. Time is the only way this factor rises — keep oldest accounts open.'
  } else if (oldest < 7) {
    detail = `Oldest account is about ${formatYears(oldest)}. Closing it would reset a lot of this progress.`
  } else {
    detail = `A ${formatYears(oldest)} file is a genuine advantage. Don’t close the oldest card.`
  }

  return {
    key: 'creditAge',
    label: 'Length of history',
    weight: WEIGHTS.creditAge,
    score,
    rating: ratingFromFactor(score),
    detail,
  }
}

function formatYears(n: number): string {
  if (n === 1) return '1 year'
  if (n < 1) return `${Math.round(n * 12)} months`
  const rounded = Math.round(n * 10) / 10
  return `${rounded} years`
}

function scoreCreditMix(input: CreditInputs, accounts: number): FactorResult {
  const revolving = input.creditCards > 0 || input.creditLimit > 0
  const installment =
    input.autoLoan || input.studentLoans || input.otherInstallment
  const mortgage = input.mortgage

  if (accounts === 0) {
    return {
      key: 'creditMix',
      label: 'Credit mix',
      weight: WEIGHTS.creditMix,
      score: 18,
      rating: 'Poor',
      detail: 'No account types on file.',
    }
  }

  let score = 40
  if (revolving) score += 20
  if (installment) score += 16
  if (mortgage) score += 10
  if (revolving && installment) score += 6
  if (accounts >= 4) score += 4
  if (accounts === 1) score -= 16
  if (input.creditCards >= 8) score -= 6

  score = clamp(score, 0, 100)

  let detail = 'A mix of revolving and installment credit is what this factor rewards.'
  if (revolving && installment && mortgage) {
    detail = 'Revolving, installment, and a mortgage — a full mix.'
  } else if (revolving && installment) {
    detail = 'You have both revolving and installment credit, which is the core mix lenders like.'
  } else if (revolving && !installment) {
    detail = 'Cards only. An installment loan (auto, student, or personal) would diversify this factor.'
  } else if (!revolving && (installment || mortgage)) {
    detail = 'Installment-only. A well-managed credit card usually improves mix.'
  }

  return {
    key: 'creditMix',
    label: 'Credit mix',
    weight: WEIGHTS.creditMix,
    score,
    rating: ratingFromFactor(score),
    detail,
  }
}

function scoreNewCredit(input: CreditInputs): FactorResult {
  const inquiries = input.rateShopping
    ? Math.max(0, Math.ceil(input.hardInquiries * 0.4))
    : input.hardInquiries

  let score = 100
  if (inquiries === 1) score -= 8
  else if (inquiries === 2) score -= 18
  else if (inquiries === 3) score -= 30
  else if (inquiries >= 4) score -= 30 + (inquiries - 3) * 10

  if (input.newAccounts === 1) score -= 6
  else if (input.newAccounts === 2) score -= 14
  else if (input.newAccounts >= 3) score -= 14 + (input.newAccounts - 2) * 9

  score = clamp(score, 8, 100)

  let detail = 'A quiet file — few new accounts or pulls.'
  if (inquiries >= 4 || input.newAccounts >= 3) {
    detail = 'A lot of recent activity. Models treat a burst of applications as risk.'
  } else if (inquiries >= 2 || input.newAccounts >= 1) {
    detail = 'Some recent applications. Letting the file sit for a while usually helps.'
  } else if (input.rateShopping && input.hardInquiries > 1) {
    detail = 'Rate-shopping inquiries are grouped, so this factor is kinder than the raw count.'
  }

  return {
    key: 'newCredit',
    label: 'New credit',
    weight: WEIGHTS.newCredit,
    score,
    rating: ratingFromFactor(score),
    detail,
  }
}

function thinFileCap(input: CreditInputs, accounts: number, score: number): number {
  const age = input.oldestYears
  if (accounts === 0) return Math.min(score, 510)
  if (accounts === 1 && age < 1) return Math.min(score, 630)
  if (accounts < 3 && age < 2) return Math.min(score, 705)
  return score
}

export function calculateScore(input: CreditInputs): ScoreResult {
  const accounts = accountCount(input)
  const factors: FactorResult[] = [
    scorePaymentHistory(input, accounts),
    scoreUtilization(input),
    scoreCreditAge(input, accounts),
    scoreCreditMix(input, accounts),
    scoreNewCredit(input),
  ]

  const weighted =
    factors.reduce((sum, f) => sum + f.score * f.weight, 0) / 100
  let score = SCORE_MIN + weighted * (SCORE_MAX - SCORE_MIN)
  score = thinFileCap(input, accounts, score)
  if (input.bankruptcy) score = Math.min(score, 560)
  if (input.collections + input.chargeOffs >= 2) score = Math.min(score, 600)
  if (input.late90 >= 2) score = Math.min(score, 620)
  score = clamp(Math.round(score), SCORE_MIN, SCORE_MAX)

  const band = bandForScore(score)
  return {
    score,
    rating: band.rating,
    band,
    factors,
    utilization: utilizationRatio(input),
    accountCount: accounts,
    thinFile: accounts < 3 || input.oldestYears < 2,
  }
}
