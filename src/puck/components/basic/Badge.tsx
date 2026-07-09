// src/puck/components/basic/Badge.tsx
// 徽标基础组件：text + variant

import type { ComponentConfig } from "@measured/puck"

export type BadgeProps = {
  text: string
  variant: "default" | "secondary" | "destructive" | "outline"
}

const variantClass: Record<BadgeProps["variant"], string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive text-white",
  outline: "text-foreground",
}

export const Badge: ComponentConfig<BadgeProps> = {
  fields: {
    text: { type: "text" },
    variant: {
      type: "select",
      options: [
        { label: "主要", value: "default" },
        { label: "次要", value: "secondary" },
        { label: "危险", value: "destructive" },
        { label: "描边", value: "outline" },
      ],
    },
  },
  defaultProps: { text: "徽标", variant: "default" },
  render: ({ text, variant }: BadgeProps) => (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClass[variant]}`}
    >
      {text}
    </span>
  ),
}
