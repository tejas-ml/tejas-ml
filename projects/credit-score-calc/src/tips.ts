import { calculateScore } from './calc'
import type { CreditInputs, ScoreResult, Tip } from './types'
import { money } from './format'

export function getTips(input: CreditInputs, current: ScoreResult): Tip[] {
  const tips: Tip[] = []

  if (input.creditLimit > 0 && input.revolvingBalance > input.creditLimit * 0.09) {
    const target = Math.max(0, Math.floor(input.creditLimit * 0.09))
    const delta = calculateScore({ ...input, revolvingBalance: target }).score - current.score
    if (delta > 0) {
      const payDown = input.revolvingBalance - target
      tips.push({
        title: 'Get utilization under 9%',
        body: `Pay down ${money(payDown)} on revolving balances (to about ${money(target)}). This is usually the fastest lever.`,
        points: delta,
      })
    }
  }

  if (input.creditLimit > 0 && input.revolvingBalance > input.creditLimit * 0.29) {
    const target = Math.floor(input.creditLimit * 0.29)
    const delta = calculateScore({ ...input, revolvingBalance: target }).score - current.score
    if (delta > 0) {
      tips.push({
        title: 'At least break 30% utilization',
        body: `Paying balances down to ${money(target)} crosses the 30% line most scoring models watch.`,
        points: delta,
      })
    }
  }

  if (input.late30 + input.late60 + input.late90 + input.collections + input.chargeOffs > 0) {
    const clean = {
      ...input,
      late30: 0,
      late60: 0,
      late90: 0,
      collections: 0,
      chargeOffs: 0,
    }
    const delta = calculateScore(clean).score - current.score
    tips.push({
      title: 'Protect a perfect streak from here',
      body: 'Derogatories fade with time. New late payments would cost more than almost any other change.',
      points: Math.max(0, Math.min(delta, 40)),
    })
  }

  if (input.hardInquiries >= 2) {
    const delta =
      calculateScore({ ...input, hardInquiries: 0, newAccounts: 0 }).score - current.score
    if (delta > 0) {
      tips.push({
        title: 'Pause new applications',
        body: 'Hard inquiries age off over about 12 months. Avoid extra pulls unless you are rate-shopping one loan.',
        points: delta,
      })
    }
  }

  const revolving = input.creditCards > 0 || input.creditLimit > 0
  const installment = input.autoLoan || input.studentLoans || input.otherInstallment
  if (revolving !== installment) {
    const mixed = revolving
      ? { ...input, autoLoan: true }
      : { ...input, creditCards: Math.max(1, input.creditCards), creditLimit: Math.max(input.creditLimit, 3000) }
    const delta = calculateScore(mixed).score - current.score
    if (delta > 0) {
      tips.push({
        title: revolving ? 'A mix includes installment credit' : 'A managed card can help mix',
        body: revolving
          ? 'Files with both revolving and installment accounts typically score this factor higher. Don’t open credit just for mix.'
          : 'A single well-managed credit card usually improves mix versus installment-only.',
        points: delta,
      })
    }
  }

  if (input.oldestYears < 5) {
    tips.push({
      title: 'Keep your oldest account open',
      body: 'Length of history only grows with time. Closing the first card you opened is a common own-goal.',
      points: 0,
    })
  }

  if (input.bankruptcy) {
    tips.push({
      title: 'Rebuild on time, every month',
      body: 'Bankruptcy is the heaviest mark on payment history. A long clean streak after it is what recovers the file.',
      points: 0,
    })
  }

  const unique = new Map<string, Tip>()
  for (const tip of tips) {
    if (!unique.has(tip.title)) unique.set(tip.title, tip)
  }

  return [...unique.values()]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
}
