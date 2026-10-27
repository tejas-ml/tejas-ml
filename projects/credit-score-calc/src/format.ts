export function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(n))
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return `${Math.round(n * 100)}%`
}

export function yearsLabel(n: number): string {
  if (n <= 0) return '0 yrs'
  if (n < 1) return `${Math.round(n * 12)} mo`
  const rounded = Math.round(n * 10) / 10
  return rounded === 1 ? '1 yr' : `${rounded} yrs`
}
