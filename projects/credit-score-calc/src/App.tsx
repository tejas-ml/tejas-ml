import { useMemo, useState } from 'react'
import { calculateScore, DEFAULT_INPUTS, EMPTY_INPUTS } from './calc'
import { getTips } from './tips'
import { yearsLabel, pct } from './format'
import { MoneyField, Section, SliderField, Stepper, Toggle } from './components/Fields'
import { ScorePanel } from './components/ScorePanel'
import type { CreditInputs } from './types'

function patch<K extends keyof CreditInputs>(
  set: (u: CreditInputs) => void,
  input: CreditInputs,
  key: K,
  value: CreditInputs[K],
) {
  const next = { ...input, [key]: value }
  if (key === 'oldestYears' && next.averageYears > next.oldestYears) {
    next.averageYears = next.oldestYears
  }
  set(next)
}

export default function App() {
  const [input, setInput] = useState<CreditInputs>(DEFAULT_INPUTS)
  const result = useMemo(() => calculateScore(input), [input])
  const tips = useMemo(() => getTips(input, result), [input, result])
  function set<K extends keyof CreditInputs>(key: K) {
    return (value: CreditInputs[K]) => patch(setInput, input, key, value)
  }

  const util =
    input.creditLimit > 0 ? input.revolvingBalance / input.creditLimit : 0

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <p className="kicker">Ledger</p>
            <h1>Credit score calculator</h1>
          </div>
        </div>
        <p className="lede">
          Enter your file. This estimates a FICO-style score from the five
          factors lenders actually weigh — it is not an official bureau score.
        </p>
        <div className="top-actions">
          <button type="button" className="ghost" onClick={() => setInput(DEFAULT_INPUTS)}>
            Load sample
          </button>
          <button type="button" className="ghost" onClick={() => setInput(EMPTY_INPUTS)}>
            Start blank
          </button>
        </div>
      </header>

      <main className="layout">
        <form
          className="form"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Credit profile"
        >
          <Section kicker="35% of score" title="Payment history" weight="Largest factor">
            <Stepper
              id="late30"
              label="30-day late payments"
              hint="Last 2 years, approximately"
              value={input.late30}
              onChange={set('late30')}
            />
            <Stepper
              id="late60"
              label="60-day late payments"
              value={input.late60}
              onChange={set('late60')}
            />
            <Stepper
              id="late90"
              label="90+ day late payments"
              value={input.late90}
              onChange={set('late90')}
            />
            <Stepper
              id="collections"
              label="Collections"
              value={input.collections}
              max={10}
              onChange={set('collections')}
            />
            <Stepper
              id="chargeOffs"
              label="Charge-offs"
              value={input.chargeOffs}
              max={10}
              onChange={set('chargeOffs')}
            />
            <Toggle
              label="Bankruptcy on file"
              hint="Chapter 7 or 13 in the last 7 years"
              checked={input.bankruptcy}
              onChange={set('bankruptcy')}
            />
          </Section>

          <Section kicker="30% of score" title="Amounts owed" weight="Utilization">
            <MoneyField
              id="limit"
              label="Total revolving credit limit"
              hint="Sum of credit card limits"
              value={input.creditLimit}
              onChange={set('creditLimit')}
            />
            <MoneyField
              id="balance"
              label="Current revolving balances"
              hint="What you owe on those cards right now"
              value={input.revolvingBalance}
              onChange={set('revolvingBalance')}
            />
            <div className="util-meter" aria-hidden="true">
              <div className="util-meter-top">
                <span>Utilization</span>
                <span>{input.creditLimit > 0 ? pct(util) : '—'}</span>
              </div>
              <div className="factor-track tall">
                <div
                  className="factor-fill"
                  data-rating={
                    util <= 0.09
                      ? 'Excellent'
                      : util <= 0.29
                        ? 'Good'
                        : util <= 0.49
                          ? 'Fair'
                          : 'Poor'
                  }
                  style={{ width: `${Math.min(100, Math.max(0, util * 100))}%` }}
                />
              </div>
              <div className="util-ticks">
                <span style={{ left: '0%' }}>0%</span>
                <span style={{ left: '9%' }}>9%</span>
                <span style={{ left: '30%' }}>30%</span>
                <span style={{ left: '50%' }}>50%</span>
                <span style={{ left: '100%' }}>100%</span>
              </div>
            </div>
          </Section>

          <Section kicker="15% of score" title="Length of history" weight="Time on file">
            <SliderField
              id="oldest"
              label="Age of oldest account"
              value={input.oldestYears}
              min={0}
              max={25}
              step={0.5}
              display={yearsLabel(input.oldestYears)}
              onChange={set('oldestYears')}
            />
            <SliderField
              id="average"
              label="Average age of accounts"
              hint="Cannot exceed the oldest account"
              value={input.averageYears}
              min={0}
              max={Math.max(0, input.oldestYears)}
              step={0.5}
              display={yearsLabel(input.averageYears)}
              onChange={set('averageYears')}
            />
          </Section>

          <Section kicker="10% of score" title="Credit mix" weight="Account types">
            <Stepper
              id="cards"
              label="Credit cards"
              value={input.creditCards}
              max={15}
              onChange={set('creditCards')}
            />
            <div className="toggle-grid">
              <Toggle
                label="Auto loan"
                checked={input.autoLoan}
                onChange={set('autoLoan')}
              />
              <Toggle
                label="Mortgage"
                checked={input.mortgage}
                onChange={set('mortgage')}
              />
              <Toggle
                label="Student loans"
                checked={input.studentLoans}
                onChange={set('studentLoans')}
              />
              <Toggle
                label="Other installment"
                hint="Personal loan, retail, etc."
                checked={input.otherInstallment}
                onChange={set('otherInstallment')}
              />
            </div>
          </Section>

          <Section kicker="10% of score" title="New credit" weight="Recent activity">
            <Stepper
              id="inquiries"
              label="Hard inquiries, last 12 months"
              value={input.hardInquiries}
              max={15}
              onChange={set('hardInquiries')}
            />
            <Stepper
              id="newAccounts"
              label="Accounts opened, last 12 months"
              value={input.newAccounts}
              max={10}
              onChange={set('newAccounts')}
            />
            <Toggle
              label="Most inquiries were rate shopping"
              hint="Auto, mortgage, or student loan shopping is grouped by scoring models"
              checked={input.rateShopping}
              onChange={set('rateShopping')}
            />
          </Section>
        </form>

        <ScorePanel result={result} tips={tips} />
      </main>

      <footer className="foot">
        <p>
          Educational estimate only. Real FICO and VantageScore models use full
          bureau data, proprietary tables, and version-specific rules this
          calculator cannot see. Ranges: Poor 300–579 · Fair 580–669 · Good
          670–739 · Very Good 740–799 · Excellent 800–850.
        </p>
      </footer>
    </div>
  )
}
