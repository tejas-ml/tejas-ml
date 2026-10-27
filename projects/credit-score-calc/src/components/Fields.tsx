import type { ReactNode } from 'react'

type StepperProps = {
  id: string
  label: string
  hint?: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (n: number) => void
}

export function Stepper({
  id,
  label,
  hint,
  value,
  min = 0,
  max = 20,
  step = 1,
  onChange,
}: StepperProps) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)))

  return (
    <div className="field">
      <div className="field-copy">
        <label htmlFor={id}>{label}</label>
        {hint ? <p className="hint">{hint}</p> : null}
      </div>
      <div className="stepper">
        <button
          type="button"
          className="stepper-btn"
          onClick={() => set(value - step)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) set(n)
          }}
        />
        <button
          type="button"
          className="stepper-btn"
          onClick={() => set(value + step)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

type MoneyProps = {
  id: string
  label: string
  hint?: string
  value: number
  onChange: (n: number) => void
}

export function MoneyField({ id, label, hint, value, onChange }: MoneyProps) {
  return (
    <div className="field">
      <div className="field-copy">
        <label htmlFor={id}>{label}</label>
        {hint ? <p className="hint">{hint}</p> : null}
      </div>
      <div className="money">
        <span aria-hidden="true">$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value === 0 ? '0' : value.toLocaleString('en-US')}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '')
            onChange(raw === '' ? 0 : Number(raw))
          }}
        />
      </div>
    </div>
  )
}

type SliderProps = {
  id: string
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (n: number) => void
}

export function SliderField({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="field field-stack">
      <div className="field-copy row">
        <label htmlFor={id}>{label}</label>
        <span className="field-value">{display}</span>
      </div>
      {hint ? <p className="hint">{hint}</p> : null}
      <input
        id={id}
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--pct' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

type ToggleProps = {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className={`toggle ${checked ? 'on' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-ui" aria-hidden="true" />
      <span className="toggle-copy">
        <span className="toggle-label">{label}</span>
        {hint ? <span className="hint">{hint}</span> : null}
      </span>
    </label>
  )
}

type SectionProps = {
  kicker: string
  title: string
  weight: string
  children: ReactNode
}

export function Section({ kicker, title, weight, children }: SectionProps) {
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <p className="kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        <span className="weight">{weight}</span>
      </header>
      <div className="card-body">{children}</div>
    </section>
  )
}
