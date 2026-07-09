// src/puck/components/display/Stepper.tsx
// 步骤条组件：横向步骤指示器，支持 numbered / dot / progress 三种样式

import { memo } from "react"
import type { ComponentConfig } from "@measured/puck"

export type StepperProps = {
  steps: { label: string; description: string }[]
  current: number
  variant: "numbered" | "dot" | "progress"
}

const StepperRender = memo(function StepperRender({ steps, current, variant }: StepperProps) {
  const activeIndex = Math.max(0, Math.min(current - 1, steps.length - 1))

  if (variant === "progress") {
    const progress = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 100
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {steps[activeIndex]?.label || ""}
          </span>
          <span className="text-muted-foreground">
            {activeIndex + 1} / {steps.length}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {steps[activeIndex]?.description && (
          <p className="text-xs text-muted-foreground">
            {steps[activeIndex].description}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full items-start">
      {steps.map((step, i) => {
        const isActive = i === activeIndex
        const isCompleted = i < activeIndex
        const isLast = i === steps.length - 1

        return (
          <div key={i} className={`flex items-start ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center">
              {/* 指示器 */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {variant === "numbered" ? (
                  isCompleted ? "✓" : i + 1
                ) : (
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    isCompleted || isActive ? "bg-primary-foreground" : "bg-muted-foreground/40"
                  }`} />
                )}
              </div>
              {/* 连接线 */}
              {!isLast && (
                <div className={`h-0.5 w-full mt-4 ${
                  isCompleted ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
            {/* 标签 */}
            <div className={`ml-3 mt-1 ${isLast ? "" : "mr-4"}`}>
              <div className={`text-sm font-medium ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})

StepperRender.displayName = "StepperRender"

export const Stepper: ComponentConfig<StepperProps> = {
  fields: {
    steps: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        description: { type: "textarea" },
      },
      getItemSummary: (item: { label?: string }, index?: number) =>
        item?.label || `步骤 ${(index ?? 0) + 1}`,
      defaultItemProps: { label: "步骤", description: "" },
    },
    current: { type: "number" },
    variant: {
      type: "select",
      options: [
        { label: "数字", value: "numbered" },
        { label: "圆点", value: "dot" },
        { label: "进度条", value: "progress" },
      ],
    },
  },
  defaultProps: {
    steps: [
      { label: "第一步", description: "开始" },
      { label: "第二步", description: "进行中" },
      { label: "第三步", description: "完成" },
    ],
    current: 1,
    variant: "numbered",
  },
  render: (props: StepperProps) => <StepperRender {...props} />,
}
