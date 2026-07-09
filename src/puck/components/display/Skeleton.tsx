// src/puck/components/display/Skeleton.tsx
// 骨架屏组件：模拟多行加载占位效果

import { memo } from "react"
import type { ComponentConfig } from "@measured/puck"

export type SkeletonProps = {
  width: "full" | "sm" | "md" | "lg"
  height: string
  lines: number
  rounded: "true" | "false"
}

const widthMap: Record<SkeletonProps["width"], string> = {
  full: "w-full",
  sm: "w-24",
  md: "w-48",
  lg: "w-64",
}

const SkeletonRender = memo(function SkeletonRender({ width, height, lines, rounded }: SkeletonProps) {
  const lineCount = Math.max(1, lines)
  const items = Array.from({ length: lineCount }, (_, i) => ({
    key: i,
    w: lineCount > 1 && i === lineCount - 1 ? "w-3/4" : widthMap[width],
  }))
  const isRounded = rounded === "true"

  return (
    <div className="flex flex-col gap-2" role="status" aria-label="加载中">
      {items.map((item) => (
        <div
          key={item.key}
          className={`animate-pulse bg-muted ${isRounded ? "rounded-md" : "rounded-none"} ${item.w}`}
          style={{ height: height || "1rem" }}
        />
      ))}
    </div>
  )
})

SkeletonRender.displayName = "SkeletonRender"

export const Skeleton: ComponentConfig<SkeletonProps> = {
  fields: {
    width: {
      type: "select",
      options: [
        { label: "全宽", value: "full" },
        { label: "小", value: "sm" },
        { label: "中", value: "md" },
        { label: "大", value: "lg" },
      ],
    },
    height: { type: "text" },
    lines: { type: "number" },
    rounded: {
      type: "select",
      options: [
        { label: "是", value: "true" },
        { label: "否", value: "false" },
      ],
    },
  },
  defaultProps: {
    width: "full",
    height: "1rem",
    lines: 1,
    rounded: "true",
  },
  render: (props: SkeletonProps) => <SkeletonRender {...props} />,
}
