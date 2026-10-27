import { Gauge } from './Gauge'
import { pct } from '../format'
import type { ScoreResult, Tip } from '../types'

type Props = {
  result: ScoreResult
  tips: Tip[]
}

export function ScorePanel({ result, tips }: Props) {
  return (
    <aside className="score-panel">
      <div className="score-card">
        <p className="kicker">Estimated score</p>
        <Gauge score={result.score} rating={result.rating} />
        <p className="score-copy">{result.band.copy}</p>
        <p className="util-chip">
          Revolving utilization <strong>{pct(result.utilization)}</strong>
        </p>
      </div>

      <div className="score-card">
        <p className="kicker">How the estimate is built</p>
        <h2>Factor mix</h2>
        <ul className="factors">
          {result.factors.map((f) => (
            <li key={f.key}>
              <div className="factor-top">
                <span>{f.label}</span>
                <span className="factor-meta">
                  {Math.round(f.weight * 100)}% · {f.rating}
                </span>
              </div>
              <div
                className="factor-track"
                aria-hidden="true"
              >
                <div
                  className="factor-fill"
                  data-rating={f.rating}
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <p className="hint">{f.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="score-card">
        <p className="kicker">What would help</p>
        <h2>Next moves</h2>
        {tips.length === 0 ? (
          <p className="hint">This file is in strong shape. Protect it — don’t open credit you don’t need.</p>
        ) : (
          <ul className="tips">
            {tips.map((tip) => (
              <li key={tip.title}>
                <div className="tip-top">
                  <h3>{tip.title}</h3>
                  {tip.points > 0 ? (
                    <span className="pts">+{tip.points}</span>
                  ) : null}
                </div>
                <p>{tip.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
