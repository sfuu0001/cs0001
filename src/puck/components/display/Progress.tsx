// src/puck/components/display/Progress.tsx
// 进度条展示组件：value + label + variant

import type { ComponentConfig } from "@measured/puck"

export type ProgressProps = {
  value: number
  label: string
  variant: "default" | "primary" | "success" | "warning"
}

const variantBarClass: Record<ProgressProps["variant"], string> = {
  default: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-500",
}

const variantTextClass: Record<ProgressProps["variant"], string> = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-green-500",
  warning: "text-yellow-500",
}

export const Progress: ComponentConfig<ProgressProps> = {
  fields: {
    value: {
      type: "number",
      min: 0,
      max: 100,
    },
    label: { type: "text" },
    variant: {
      type: "select",
      options: [
        { label: "默认", value: "default" },
        { label: "主要", value: "primary" },
        { label: "成功", value: "success" },
        { label: "警告", value: "warning" },
      ],
    },
  },
  defaultProps: {
    value: 60,
    label: "进度",
    variant: "primary",
  },
  render: ({ value, label, variant }: ProgressProps) => {
    const clampedValue = Math.max(0, Math.min(100, value ?? 0))

    return (
      <div className="w-full space-y-2">
        {(label || value !== undefined) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            )}
            <span
              className={`text-sm font-medium ${variantTextClass[variant]}`}
            >
              {clampedValue}%
            </span>
          </div>
        )}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${variantBarClass[variant]}`}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
      </div>
    )
  },
}
