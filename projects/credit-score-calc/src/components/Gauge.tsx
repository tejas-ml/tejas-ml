import { SCORE_MAX, SCORE_MIN } from '../calc'
import type { Rating } from '../types'
import { useAnimatedNumber } from '../hooks'

const R = 90
const CX = 120
const CY = 108
const C = 2 * Math.PI * R
const ARC = C * 0.72
const START_ROT = 140.4
const SWEEP = 259.2

const TICKS = [300, 580, 670, 740, 800, 850]

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function scoreToAngle(score: number) {
  const t = (score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)
  return 90 + START_ROT + t * SWEEP
}

type Props = {
  score: number
  rating: Rating
}

export function Gauge({ score, rating }: Props) {
  const animated = useAnimatedNumber(score)
  const shown = Math.round(animated)
  const t = (animated - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)
  const offset = ARC * (1 - t)
  const start = polar(CX, CY, R + 30, scoreToAngle(SCORE_MIN))
  const end = polar(CX, CY, R + 30, scoreToAngle(SCORE_MAX))

  return (
    <div className="gauge" data-rating={rating}>
      <svg viewBox="0 0 240 228" role="img" aria-label={`Estimated score ${shown}, ${rating}`}>
        <g transform={`rotate(${START_ROT} ${CX} ${CY})`}>
          <circle
            className="gauge-track"
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            strokeWidth="14"
            strokeDasharray={`${ARC} ${C}`}
            strokeLinecap="round"
          />
          <circle
            className="gauge-fill"
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            strokeWidth="14"
            strokeDasharray={`${ARC} ${C}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </g>
        {TICKS.map((tick) => {
          const ang = scoreToAngle(tick)
          const a = polar(CX, CY, R + 16, ang)
          const b = polar(CX, CY, R + 8, ang)
          return (
            <line
              key={tick}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="gauge-tick"
            />
          )
        })}
        <text x={start.x} y={start.y} className="gauge-end" textAnchor="middle">
          300
        </text>
        <text x={end.x} y={end.y} className="gauge-end" textAnchor="middle">
          850
        </text>
      </svg>
      <div className="gauge-readout">
        <div className="gauge-score" aria-live="polite">
          {shown}
        </div>
        <div className="gauge-rating">{rating}</div>
      </div>
    </div>
  )
}
