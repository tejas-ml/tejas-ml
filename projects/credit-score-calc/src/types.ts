export type CreditInputs = {
  late30: number
  late60: number
  late90: number
  collections: number
  chargeOffs: number
  bankruptcy: boolean
  creditLimit: number
  revolvingBalance: number
  oldestYears: number
  averageYears: number
  creditCards: number
  autoLoan: boolean
  mortgage: boolean
  studentLoans: boolean
  otherInstallment: boolean
  hardInquiries: number
  newAccounts: number
  rateShopping: boolean
}

export type FactorKey =
  | 'paymentHistory'
  | 'utilization'
  | 'creditAge'
  | 'creditMix'
  | 'newCredit'

export type FactorResult = {
  key: FactorKey
  label: string
  weight: number
  score: number
  rating: Rating
  detail: string
}

export type Rating = 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent'

export type ScoreBand = {
  rating: Rating
  min: number
  max: number
  copy: string
}

export type ScoreResult = {
  score: number
  rating: Rating
  band: ScoreBand
  factors: FactorResult[]
  utilization: number
  accountCount: number
  thinFile: boolean
}

export type Tip = {
  title: string
  body: string
  points: number
}
