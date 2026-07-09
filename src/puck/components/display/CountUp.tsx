// src/puck/components/display/CountUp.tsx
// 数字动画计数组件：requestAnimationFrame 驱动，不依赖第三方库

import { memo, useEffect, useRef, useState } from "react"
import type { ComponentConfig } from "@measured/puck"

export type CountUpProps = {
  value: number
  label: string
  duration: number
  suffix: string
  prefix: string
}

const CountUpRender = memo(function CountUpRender({ value, label, duration, suffix, prefix }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const prevValueRef = useRef(0)

  useEffect(() => {
    const startValue = prevValueRef.current
    const endValue = value
    const durationMs = Math.max(100, (duration || 2) * 1000)
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / durationMs, 1)
      // ease-out 缓动
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * eased)
      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        prevValueRef.current = endValue
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return (
    <div className="flex flex-col items-center justify-center gap-1 p-4">
      <span className="text-3xl font-bold tabular-nums text-foreground">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </span>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  )
})

CountUpRender.displayName = "CountUpRender"

export const CountUp: ComponentConfig<CountUpProps> = {
  fields: {
    value: { type: "number" },
    label: { type: "text" },
    duration: { type: "number" },
    suffix: { type: "text" },
    prefix: { type: "text" },
  },
  defaultProps: {
    value: 100,
    label: "用户数",
    duration: 2,
    suffix: "+",
    prefix: "",
  },
  render: (props: CountUpProps) => <CountUpRender {...props} />,
}
