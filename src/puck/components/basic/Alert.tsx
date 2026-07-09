// src/puck/components/basic/Alert.tsx
// 提示条基础组件：title + description + variant

import type { ComponentConfig } from "@measured/puck"

export type AlertProps = {
  title: string
  description: string
  variant: "default" | "destructive" | "success" | "warning"
}

const variantClass: Record<AlertProps["variant"], string> = {
  default: "bg-muted text-foreground",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
  success: "bg-primary/10 text-primary border-primary/30",
  warning: "bg-secondary text-secondary-foreground border-border",
}

export const Alert: ComponentConfig<AlertProps> = {
  fields: {
    title: { type: "text" },
    description: { type: "textarea" },
    variant: {
      type: "select",
      options: [
        { label: "默认", value: "default" },
        { label: "危险", value: "destructive" },
        { label: "成功", value: "success" },
        { label: "警告", value: "warning" },
      ],
    },
  },
  defaultProps: {
    title: "提示",
    description: "这是一条提示信息。",
    variant: "default",
  },
  render: ({ title, description, variant }: AlertProps) => (
    <div className={`rounded-lg border p-4 ${variantClass[variant]}`}>
      {title ? <div className="mb-1 font-medium">{title}</div> : null}
      {description ? (
        <div className="text-sm opacity-90">{description}</div>
      ) : null}
    </div>
  ),
}
