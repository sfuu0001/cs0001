// src/puck/components/basic/Button.tsx
// 按钮 / 链接基础组件：label + href + variant

import type { ComponentConfig } from "@measured/puck"

export type ButtonProps = {
  label: string
  href: string
  variant: "primary" | "outline"
}

const variantClass: Record<ButtonProps["variant"], string> = {
  primary:
    "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  outline:
    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
}

export const Button: ComponentConfig<ButtonProps> = {
  fields: {
    label: { type: "text" },
    href: { type: "text" },
    variant: {
      type: "select",
      options: [
        { label: "主要", value: "primary" },
        { label: "次要", value: "outline" },
      ],
    },
  },
  defaultProps: { label: "按钮", href: "#", variant: "primary" },
  render: ({ label, href, variant }: ButtonProps) => (
    <a
      href={href || "#"}
      className={`inline-block rounded-md px-4 py-2 text-sm font-medium transition-colors ${variantClass[variant]}`}
    >
      {label}
    </a>
  ),
}
