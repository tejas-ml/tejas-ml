import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(value: number, duration = 700): number {
  const [display, setDisplay] = useState(value)
  const current = useRef(value)

  useEffect(() => {
    const from = current.current
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      const next = from + (value - from) * eased
      current.current = next
      setDisplay(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return display
}
